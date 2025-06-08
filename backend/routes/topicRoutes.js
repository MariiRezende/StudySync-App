const express = require('express');
const router = express.Router();
const StudyTopic = require('../models/StudyTopic');
const { protect } = require('../middleware/authMiddleware');

// --- Algoritmos de Grafo ---
// Função para realizar Ordenação Topológica e detectar ciclos (Algoritmo de Kahn)
// Baseado em: https://www.geeksforgeeks.org/topological-sorting-bfs-kahn-algorithm/
const topologicalSortAndDetectCycles = async (userId) => {
    const topics = await StudyTopic.find({ user: userId }).select('_id name prerequisites');

    // 1. Construir o Grafo (Lista de Adjacência) e calcular o grau de entrada
    const graph = new Map(); // Mapa de ID do tópico -> Array de IDs de seus dependentes (arestas de A para B se B depende de A)
    const inDegree = new Map(); // Mapa de ID do tópico -> Número de pré-requisitos (grau de entrada)
    const idToTopicMap = new Map(); // Mapeia ID para o objeto tópico completo

    topics.forEach(topic => {
        graph.set(topic._id.toString(), []); // Inicializa a lista de adjacência
        inDegree.set(topic._id.toString(), 0); // Inicializa grau de entrada
        idToTopicMap.set(topic._id.toString(), topic);
    });

    topics.forEach(topic => {
        const topicId = topic._id.toString();
        topic.prerequisites.forEach(prereqIdObj => {
            const prereqId = prereqIdObj.toString();
            if (!graph.has(prereqId)) {
                // Tratar pré-requisito que não existe como um erro ou ignorar
                console.warn(`Pré-requisito ${prereqId} para ${topic.name} não encontrado como um tópico válido.`);
                return;
            }
            graph.get(prereqId).push(topicId); // Adiciona aresta: prereq -> topic
            inDegree.set(topicId, inDegree.get(topicId) + 1); // Incrementa grau de entrada do tópico
        });
    });

    // 2. Inicializar Fila com nós de grau de entrada 0
    const queue = []; // Usado como Fila (FIFO)
    inDegree.forEach((degree, topicId) => {
        if (degree === 0) {
            queue.push(topicId);
        }
    });

    const topologicalOrder = [];
    let visitedNodes = 0;

    // 3. Processar a Fila
    while (queue.length > 0) {
        const u = queue.shift(); // Desenfileira (FIFO)
        topologicalOrder.push(idToTopicMap.get(u)); // Adiciona o tópico à ordem topológica
        visitedNodes++;

        // Para cada vizinho de u (tópico que depende de u)
        for (const v of graph.get(u)) {
            inDegree.set(v, inDegree.get(v) - 1); // Decrementa o grau de entrada do vizinho
            if (inDegree.get(v) === 0) {
                queue.push(v); // Se o grau de entrada se tornar 0, enfileira
            }
        }
    }

    // 4. Detectar Ciclo
    if (visitedNodes !== topics.length) {
        // Se o número de nós visitados é diferente do total de tópicos, há um ciclo
        return {
            order: [],
            hasCycle: true,
            message: 'Ciclo detectado nos pré-requisitos! Não é possível determinar uma ordem de estudo linear.',
            cycleDetails: Array.from(inDegree.entries()).filter(([id, degree]) => degree > 0).map(([id]) => idToTopicMap.get(id)?.name) // Tópicos envolvidos no ciclo
        };
    } else {
        return {
            order: topologicalOrder,
            hasCycle: false,
            message: 'Ordem de estudo determinada com sucesso!'
        };
    }
};
// --- Fim dos Algoritmos de Grafo ---


// @desc    Obter todos os tópicos de estudo do usuário
// @route   GET /api/topics
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const topics = await StudyTopic.find({ user: req.user._id }).sort({ name: 1 });
        res.json(topics);
    } catch (error) {
        console.error('Erro ao obter tópicos de estudo:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter tópicos.' });
    }
});

// @desc    Adicionar um novo tópico de estudo
// @route   POST /api/topics
// @access  Private
router.post('/', protect, async (req, res) => {
    const { name, description, prerequisites } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'O nome do tópico é obrigatório.' });
    }

    try {
        // Verifica se o tópico já existe para o usuário
        const existingTopic = await StudyTopic.findOne({ user: req.user._id, name });
        if (existingTopic) {
            return res.status(400).json({ message: 'Você já tem um tópico com este nome.' });
        }

        // Opcional: Validar se os pré-requisitos existem e pertencem ao usuário (para maior robustez)
        if (prerequisites && prerequisites.length > 0) {
            const existingPrereqs = await StudyTopic.find({ _id: { $in: prerequisites }, user: req.user._id });
            if (existingPrereqs.length !== prerequisites.length) {
                return res.status(400).json({ message: 'Um ou mais pré-requisitos informados não foram encontrados ou não pertencem a você.' });
            }
        }

        const newTopic = new StudyTopic({
            user: req.user._id,
            name,
            description,
            prerequisites: prerequisites || []
        });

        await newTopic.save();
        res.status(201).json(newTopic);
    } catch (error) {
        console.error('Erro ao adicionar tópico de estudo:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Você já tem um tópico com este nome.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao adicionar tópico.' });
    }
});

// @desc    Atualizar um tópico de estudo existente
// @route   PUT /api/topics/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const topicId = req.params.id;
    const { name, description, prerequisites } = req.body;

    try {
        const topic = await StudyTopic.findOne({ _id: topicId, user: req.user._id });

        if (!topic) {
            return res.status(404).json({ message: 'Tópico não encontrado ou não pertence a este usuário.' });
        }

        // Opcional: Validar se os pré-requisitos existem e pertencem ao usuário
        if (prerequisites && prerequisites.length > 0) {
            const existingPrereqs = await StudyTopic.find({ _id: { $in: prerequisites }, user: req.user._id });
            if (existingPrereqs.length !== prerequisites.length) {
                return res.status(400).json({ message: 'Um ou mais pré-requisitos informados não foram encontrados ou não pertencem a você.' });
            }
        }

        // Atualiza os campos
        topic.name = name || topic.name;
        topic.description = description !== undefined ? description : topic.description;
        topic.prerequisites = prerequisites !== undefined ? prerequisites : topic.prerequisites;

        await topic.save();
        res.json(topic);
    } catch (error) {
        console.error('Erro ao atualizar tópico de estudo:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Você já tem um tópico com este nome.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao atualizar tópico.' });
    }
});

// @desc    Deletar um tópico de estudo
// @route   DELETE /api/topics/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    const topicId = req.params.id;

    try {
        const topic = await StudyTopic.findOneAndDelete({ _id: topicId, user: req.user._id });

        if (!topic) {
            return res.status(404).json({ message: 'Tópico não encontrado ou não pertence a este usuário.' });
        }

        // Opcional: Remover este tópico dos pré-requisitos de outros tópicos
        await StudyTopic.updateMany(
            { user: req.user._id, prerequisites: topicId },
            { $pull: { prerequisites: topicId } }
        );

        res.json({ message: 'Tópico removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar tópico de estudo:', error);
        res.status(500).json({ message: 'Erro no servidor ao deletar tópico.' });
    }
});


// @desc    Obter a ordem topológica dos tópicos de estudo
// @route   GET /api/topics/topological-order
// @access  Private
router.get('/topological-order', protect, async (req, res) => {
    try {
        const result = await topologicalSortAndDetectCycles(req.user._id);
        res.json(result);
    } catch (error) {
        console.error('Erro ao obter ordem topológica:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter ordem topológica.' });
    }
});


module.exports = router;