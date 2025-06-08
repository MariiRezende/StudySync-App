const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudySession = require('../models/StudySession'); // NOVO: Importa StudySession
const Discipline = require('../models/Discipline');   // NOVO: Importa Discipline
const Task = require('../models/Task');             // NOVO: Importa Task
const StudyGroup = require('../models/StudyGroup');     // NOVO: Importa StudyGroup
const { protect } = require('../middleware/authMiddleware');

// @desc    Atualizar o status do usuário (já existia)
// @route   PUT /api/users/status
// @access  Private
router.put('/status', protect, async (req, res) => {
    const { status } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (!['offline', 'online', 'studying'].includes(status)) {
            return res.status(400).json({ message: 'Status inválido.' });
        }

        user.status = status;
        await user.save();

        res.json({ message: 'Status atualizado com sucesso!', status: user.status });
    } catch (error) {
        console.error('Erro ao atualizar status do usuário:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar status.' });
    }
});


// @desc    Deletar a própria conta do usuário
// @route   DELETE /api/users/me
// @access  Private
router.delete('/me', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Encontrar o usuário para garantir que existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Excluir sessões de estudo do usuário
        await StudySession.deleteMany({ user: userId });

        // Excluir disciplinas do usuário
        await Discipline.deleteMany({ user: userId });

        // Excluir tarefas do usuário
        await Task.deleteMany({ user: userId });

        // Remover o usuário de todos os grupos que ele possa pertencer
        await StudyGroup.updateMany(
            { members: userId },
            { $pull: { members: userId } } // Remove o userId do array de membros
        );

        // Excluir grupos que o usuário criou (se ele era o único criador, o grupo será deletado)
        // Se houver outros membros, o grupo pode ficar sem um criador principal.
        // Para um sistema mais robusto, você transferiria a criação para outro membro.
        await StudyGroup.deleteMany({ creator: userId });


        // Finalmente, excluir o próprio usuário
        await User.deleteOne({ _id: userId });

        res.json({ message: 'Conta e todos os dados associados foram excluídos com sucesso.' });

    } catch (error) {
        console.error('Erro ao deletar conta do usuário:', error);
        res.status(500).json({ message: 'Erro no servidor ao deletar conta.' });
    }
});

module.exports = router;