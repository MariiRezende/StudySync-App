const express = require('express');
const router = express.Router();
const StudyGroup = require('../models/StudyGroup'); // AGORA IMPORTA StudyGroup
const User = require('../models/User'); // Importa o modelo de usuário para populações
const StudySession = require('../models/StudySession'); // NOVO: Importa StudySession para agregação
const { protect } = require('../middleware/authMiddleware'); // Middleware de proteção

// Função para formatar segundos em HH:MM:SS (útil para o backend também, já estava aqui)
const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return (
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${remainingSeconds.toString().padStart(2, '0')}`
    );
};


// @desc    Criar um novo grupo de estudo
// @route   POST /api/groups
// @access  Private
router.post('/', protect, async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'O nome do grupo é obrigatório.' });
    }

    try {
        // Verifica se já existe um grupo com este nome
        const existingGroup = await StudyGroup.findOne({ name });
        if (existingGroup) {
            return res.status(400).json({ message: 'Um grupo com este nome já existe.' });
        }

        const newGroup = new StudyGroup({
            name,
            description,
            creator: req.user._id, // O usuário logado é o criador
            members: [req.user._id] // O criador é automaticamente um membro
        });

        const savedGroup = await newGroup.save();
        // Retorna o grupo populado com o criador (username e foto)
        const populatedGroup = await StudyGroup.findById(savedGroup._id)
            .populate('creator', 'username profilePicture')
            .populate('members', 'username profilePicture totalStudyTime status'); // Popula os membros e STATUS

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        res.status(500).json({ message: 'Erro no servidor ao criar grupo.' });
    }
});

// @desc    Obter todos os grupos que o usuário pertence
// @route   GET /api/groups/my-groups
// @access  Private
router.get('/my-groups', protect, async (req, res) => {
    try {
        // Encontra grupos onde o ID do usuário está na lista de membros
        const myGroups = await StudyGroup.find({ members: req.user._id })
            .populate('creator', 'username profilePicture')
            .populate('members', 'username profilePicture totalStudyTime status') // Popula membros e STATUS
            .sort({ name: 1 }); // Ordena por nome do grupo

        // Mapeia para formatar o tempo de estudo dos membros
        const formattedGroups = myGroups.map(group => ({
            ...group.toObject(), // Converte para objeto JS puro antes de modificar
            members: group.members.map(member => ({
                ...member.toObject(),
                totalStudyTimeFormatted: formatTime(member.totalStudyTime)
            }))
        }));

        res.json(formattedGroups);
    } catch (error) {
        console.error('Erro ao obter meus grupos:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter seus grupos.' });
    }
});

// @desc    Obter detalhes de um grupo específico e seus membros
// @route   GET /api/groups/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    const groupId = req.params.id;
    try {
        const group = await StudyGroup.findById(groupId)
            .populate('creator', 'username profilePicture')
            .populate('members', 'username profilePicture totalStudyTime status'); // Popula membros e STATUS

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        // Verifica se o usuário logado é membro do grupo (opcional, para visualização de detalhes)
        if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
             return res.status(403).json({ message: 'Você não tem permissão para visualizar este grupo.' });
        }

        // Mapeia membros para adicionar o tempo formatado
        const formattedGroup = {
            ...group.toObject(),
            members: group.members.map(member => ({
                ...member.toObject(),
                totalStudyTimeFormatted: formatTime(member.totalStudyTime)
            }))
        };

        res.json(formattedGroup);
    } catch (error) {
        console.error('Erro ao obter detalhes do grupo:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter detalhes do grupo.' });
    }
});


// @desc    Obter ranking de estudo de um grupo por período (diário, semanal, mensal)
// @route   GET /api/groups/:id/ranking
// @access  Private
router.get('/:id/ranking', protect, async (req, res) => {
    const groupId = req.params.id;
    const { period } = req.query; // 'daily', 'weekly', 'monthly'

    try {
        const group = await StudyGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        // Verifica se o usuário logado é membro do grupo
        if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: 'Você não tem permissão para visualizar o ranking deste grupo.' });
        }

        let startDate;
const now = new Date(); // Data e hora atuais (no fuso horário do servidor)

switch (period) {
    case 'daily':
        // Início do dia atual em UTC
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        break;
    case 'weekly':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        // Ajusta para a segunda-feira da semana em UTC
        // getUTCDay() retorna 0 para Domingo, 1 para Segunda...
        const dayOfWeek = startDate.getUTCDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajuste para segunda-feira (se domingo, volta 6 dias, senão volta (dia-1) dias)
        startDate.setUTCDate(startDate.getUTCDate() - diff);
        break;
    case 'monthly':
        // Primeiro dia do mês atual em UTC
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        break;
    default:
        return res.status(400).json({ message: 'Período inválido. Use "daily", "weekly" ou "monthly".' });
}

        // Pipeline de agregação para calcular o tempo de estudo dos membros do grupo no período
        const groupRanking = await User.aggregate([
            {
                $match: {
                    _id: { $in: group.members } // Filtra apenas pelos membros deste grupo
                }
            },
            {
                $lookup: { // Junta com as sessões de estudo
                    from: 'studysessions', // Nome da coleção de sessões de estudo (lowercase e plural)
                    localField: '_id',
                    foreignField: 'user',
                    as: 'sessions'
                }
            },
            {
                $addFields: { // Adiciona um campo de tempo total de estudo no período
                    totalStudyTimeInPeriod: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: { // Filtra sessões dentro do período
                                        input: '$sessions',
                                        as: 'session',
                                        cond: {
                                            $and: [
                                                { $gte: ['$$session.startTime', startDate] }, // Início da sessão >= startDate
                                                { $ne: ['$$session.endTime', null] } // Sessão deve ter terminado
                                            ]
                                        }
                                    }
                                },
                                as: 'filteredSession',
                                in: '$$filteredSession.duration' // Soma a duração das sessões filtradas
                            }
                        }
                    }
                }
            },
            {
                $project: { // Seleciona apenas os campos necessários
                    _id: 1,
                    username: 1,
                    profilePicture: 1,
                    status: 1,
                    // totalStudyTime: 1, // O tempo total de estudo geral do usuário (pode ser incluído se necessário)
                    totalStudyTimeInPeriod: 1 // O tempo total no período específico
                }
            },
            {
                $sort: { totalStudyTimeInPeriod: -1 } // Ordena pelo tempo no período, do maior para o menor
            }
        ]);

        // Formata o tempo para exibição no frontend
        const formattedRanking = groupRanking.map(user => ({
            _id: user._id,
            username: user.username,
            profilePicture: user.profilePicture,
            status: user.status,
            totalStudyTimeInPeriod: user.totalStudyTimeInPeriod,
            totalStudyTimeInPeriodFormatted: formatTime(user.totalStudyTimeInPeriod)
        }));

        res.json(formattedRanking);

    } catch (error) {
        console.error('Erro ao obter ranking do grupo:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter ranking do grupo.' });
    }
});


// @desc    Entrar em um grupo existente
// @route   POST /api/groups/join
// @access  Private
router.post('/join', protect, async (req, res) => {
    const { groupName } = req.body; // Aceita o nome do grupo para entrar

    try {
        const group = await StudyGroup.findOne({ name: groupName }); // Usando StudyGroup

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        // Verifica se o usuário já é membro
        if (group.members.includes(req.user._id)) {
            return res.status(400).json({ message: 'Você já é membro deste grupo.' });
        }

        group.members.push(req.user._id); // Adiciona o usuário à lista de membros
        await group.save();

        // Popula o grupo para retornar informações completas
        const populatedGroup = await StudyGroup.findById(group._id) // Usando StudyGroup
            .populate('creator', 'username profilePicture')
            .populate('members', 'username profilePicture totalStudyTime status'); // Popula membros e STATUS

        res.json({ message: 'Você entrou no grupo com sucesso!', group: populatedGroup });
    } catch (error) {
        console.error('Erro ao entrar no grupo:', error);
        res.status(500).json({ message: 'Erro no servidor ao entrar no grupo.' });
    }
});

// @desc    Sair de um grupo
// @route   PUT /api/groups/:id/leave
// @access  Private
router.put('/:id/leave', protect, async (req, res) => {
    const groupId = req.params.id;

    try {
        const group = await StudyGroup.findById(groupId); // Usando StudyGroup

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        // Verifica se o usuário é membro do grupo
        if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
            return res.status(400).json({ message: 'Você não é membro deste grupo.' });
        }

        // Remove o usuário da lista de membros
        group.members = group.members.filter(
            (memberId) => memberId.toString() !== req.user._id.toString()
        );

        await group.save();
        res.json({ message: 'Você saiu do grupo com sucesso!' });
    } catch (error) {
        console.error('Erro ao sair do grupo:', error);
        res.status(500).json({ message: 'Erro no servidor ao sair do grupo.' });
    }
});

// @desc    Deletar um grupo (apenas o criador)
// @route   DELETE /api/groups/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    const groupId = req.params.id;

    try {
        const group = await StudyGroup.findById(groupId); // Usando StudyGroup

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        // Apenas o criador pode deletar o grupo
        if (group.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Você não tem permissão para deletar este grupo.' });
        }

        await StudyGroup.deleteOne({ _id: groupId }); // Usando StudyGroup
        res.json({ message: 'Grupo deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar grupo:', error);
        res.status(500).json({ message: 'Erro no servidor ao deletar grupo.' });
    }
});


module.exports = router;