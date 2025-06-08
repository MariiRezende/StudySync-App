const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Importa o modelo de usuário
const { protect } = require('../middleware/authMiddleware'); // Middleware de proteção

// Função para formatar segundos em HH:MM:SS (útil para o backend também)
const formatTime = (seconds) => {
    if (seconds === 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return (
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${remainingSeconds.toString().padStart(2, '0')}`
    );
};

// @desc    Obter ranking de usuários por tempo de estudo
// @route   GET /api/ranking
// @access  Private (para que apenas usuários logados vejam o ranking)
router.get('/', protect, async (req, res) => {
    try {
        // Busca todos os usuários, exclui a senha e ordena por totalStudyTime em ordem decrescente
        const users = await User.find({})
            .select('-password') // Exclui a senha
            .sort({ totalStudyTime: -1 }) // Ordena do maior para o menor tempo
            .limit(100); // Limita aos top 100, para não carregar muitos dados

        // Formata o tempo de estudo para exibição
        const ranking = users.map(user => ({
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture,
            totalStudyTimeSeconds: user.totalStudyTime, // Tempo em segundos
            totalStudyTimeFormatted: formatTime(user.totalStudyTime) // Tempo formatado
        }));

        res.json(ranking);
    } catch (error) {
        console.error('Erro ao obter ranking:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter ranking.' });
    }
});

module.exports = router;