const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // Importa o modelo de tarefa
const { protect } = require('../middleware/authMiddleware'); // Importa o middleware de proteção

// @desc    Obter todas as tarefas do usuário
// @route   GET /api/tasks
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // Pode adicionar filtros como 'completed=true', 'priority=1' etc.
        const { completed, priority } = req.query;
        let query = { user: req.user._id };

        if (completed !== undefined) {
            query.completed = completed === 'true';
        }
        if (priority) {
            query.priority = parseInt(priority);
        }

        const tasks = await Task.find(query).sort({ completed: 1, priority: 1, createdAt: -1 }); // Ordena: não concluídas primeiro, depois por prioridade, depois mais recentes
        res.json(tasks);
    } catch (error) {
        console.error('Erro ao obter tarefas:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter tarefas.' });
    }
});

// @desc    Adicionar uma nova tarefa
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title, description, priority, dueDate } = req.body;

    if (!title) {
        return res.status(400).json({ message: 'O título da tarefa é obrigatório.' });
    }

    try {
        const newTask = new Task({
            user: req.user._id,
            title,
            description,
            priority: priority || 3, // Padrão 3 (baixa) se não fornecido
            dueDate: dueDate || null
        });

        const savedTask = await newTask.save();
        res.status(201).json(savedTask);
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor ao adicionar tarefa.' });
    }
});

// @desc    Atualizar uma tarefa existente
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const taskId = req.params.id;
    const { title, description, completed, priority, dueDate } = req.body;

    try {
        const task = await Task.findOne({ _id: taskId, user: req.user._id });

        if (!task) {
            return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a este usuário.' });
        }

        task.title = title || task.title;
        task.description = description !== undefined ? description : task.description;
        task.completed = completed !== undefined ? completed : task.completed;
        task.priority = priority !== undefined ? priority : task.priority;
        task.dueDate = dueDate !== undefined ? dueDate : task.dueDate; // Pode ser null para remover data

        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar tarefa.' });
    }
});

// @desc    Deletar uma tarefa
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    const taskId = req.params.id;

    try {
        const task = await Task.findOneAndDelete({ _id: taskId, user: req.user._id });

        if (!task) {
            return res.status(404).json({ message: 'Tarefa não encontrada ou não pertence a este usuário.' });
        }

        res.json({ message: 'Tarefa removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar tarefa:', error);
        res.status(500).json({ message: 'Erro no servidor ao deletar tarefa.' });
    }
});

module.exports = router;