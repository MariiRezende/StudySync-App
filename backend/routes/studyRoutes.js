const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession'); // Importa o modelo de sessão
const User = require('../models/User'); // Importa o modelo de usuário para atualizar o tempo total
const { protect } = require('../middleware/authMiddleware'); // Importa o middleware de proteção

// @desc    Iniciar uma nova sessão de estudo
// @route   POST /api/studies/start
// @access  Private (requer autenticação)
router.post('/start', protect, async (req, res) => {
    const { discipline } = req.body;
    const userId = req.user._id; // ID do usuário vem do middleware de proteção

    try {
        // Verifica se já existe uma sessão ativa para este usuário
        const activeSession = await StudySession.findOne({ user: userId, endTime: null });
        if (activeSession) {
            return res.status(400).json({ message: 'Já existe uma sessão de estudo ativa. Por favor, pare a sessão atual antes de iniciar outra.' });
        }

        const newSession = new StudySession({
            user: userId,
            discipline,
            startTime: new Date() // Define a hora de início agora
        });

        await newSession.save();
        res.status(201).json(newSession); // Retorna a nova sessão iniciada
    } catch (error) {
        console.error('Erro ao iniciar sessão de estudo:', error);
        res.status(500).json({ message: 'Erro no servidor ao iniciar sessão.' });
    }
});

// @desc    Parar uma sessão de estudo ativa
// @route   PUT /api/studies/stop/:id
// @access  Private
router.put('/stop/:id', protect, async (req, res) => {
    const sessionId = req.params.id;
    const userId = req.user._id;

    try {
        const session = await StudySession.findOne({ _id: sessionId, user: userId, endTime: null });

        if (!session) {
            return res.status(404).json({ message: 'Sessão ativa não encontrada ou não pertence a este usuário.' });
        }

        session.endTime = new Date(); // Define a hora de término agora
        await session.save(); // O middleware 'pre-save' vai calcular a duração

        // Opcional: Atualizar o tempo total de estudo do usuário
        const user = await User.findById(userId);
        if (user) {
            user.totalStudyTime += session.duration; // Adiciona a duração da sessão (em segundos)
            await user.save();
        }

        res.json(session); // Retorna a sessão atualizada
    } catch (error) {
        console.error('Erro ao parar sessão de estudo:', error);
        res.status(500).json({ message: 'Erro no servidor ao parar sessão.' });
    }
});

// @desc    Obter todas as sessões de estudo do usuário (ou apenas as ativas)
// @route   GET /api/studies
// @access  Private
router.get('/', protect, async (req, res) => {
    const userId = req.user._id;
    const { activeOnly } = req.query; // Query param: ?activeOnly=true

    try {
        let query = { user: userId };
        if (activeOnly === 'true') {
            query.endTime = null; // Filtra por sessões que ainda não terminaram
        }

        const sessions = await StudySession.find(query).sort({ startTime: -1 }); // Ordena da mais recente para a mais antiga
        res.json(sessions);
    } catch (error) {
        console.error('Erro ao obter sessões de estudo:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter sessões.' });
    }
});

// @desc    Obter tempo total de estudo do usuário (opcional, já está no user, mas para fins de rota)
// @route   GET /api/studies/total-time
// @access  Private
router.get('/total-time', protect, async (req, res) => {
    const userId = req.user._id;
    try {
        const user = await User.findById(userId).select('totalStudyTime');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json({ totalStudyTime: user.totalStudyTime });
    } catch (error) {
        console.error('Erro ao obter tempo total de estudo:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter tempo total.' });
    }
});


module.exports = router;