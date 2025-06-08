const express = require('express');
const router = express.Router();
const Discipline = require('../models/Discipline'); // Importa o modelo de disciplina
const { protect } = require('../middleware/authMiddleware'); // Importa o middleware de proteção

// @desc    Obter todas as disciplinas do usuário
// @route   GET /api/disciplines
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const disciplines = await Discipline.find({ user: req.user._id }).sort({ name: 1 }); // Busca e ordena por nome
        res.json(disciplines);
    } catch (error) {
        console.error('Erro ao obter disciplinas:', error);
        res.status(500).json({ message: 'Erro no servidor ao obter disciplinas.' });
    }
});

// @desc    Adicionar uma nova disciplina
// @route   POST /api/disciplines
// @access  Private
router.post('/', protect, async (req, res) => {
    const { name, description, color } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'O nome da disciplina é obrigatório.' });
    }

    try {
        const newDiscipline = new Discipline({
            user: req.user._id, // Associa a disciplina ao usuário logado
            name,
            description,
            color
        });

        const savedDiscipline = await newDiscipline.save();
        res.status(201).json(savedDiscipline); // Retorna a nova disciplina criada
    } catch (error) {
        console.error('Erro ao adicionar disciplina:', error);
        // Erro de duplicação de nome para o mesmo usuário (index unique)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Você já tem uma disciplina com este nome.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao adicionar disciplina.' });
    }
});

// @desc    Atualizar uma disciplina existente
// @route   PUT /api/disciplines/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const disciplineId = req.params.id;
    const { name, description, color } = req.body;

    try {
        const discipline = await Discipline.findOne({ _id: disciplineId, user: req.user._id });

        if (!discipline) {
            return res.status(404).json({ message: 'Disciplina não encontrada ou não pertence a este usuário.' });
        }

        discipline.name = name || discipline.name; // Atualiza se fornecido, senão mantém
        discipline.description = description !== undefined ? description : discipline.description;
        discipline.color = color || discipline.color;

        const updatedDiscipline = await discipline.save();
        res.json(updatedDiscipline);
    } catch (error) {
        console.error('Erro ao atualizar disciplina:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Você já tem uma disciplina com este nome.' });
        }
        res.status(500).json({ message: 'Erro no servidor ao atualizar disciplina.' });
    }
});

// @desc    Deletar uma disciplina
// @route   DELETE /api/disciplines/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    const disciplineId = req.params.id;

    try {
        const discipline = await Discipline.findOneAndDelete({ _id: disciplineId, user: req.user._id });

        if (!discipline) {
            return res.status(404).json({ message: 'Disciplina não encontrada ou não pertence a este usuário.' });
        }

        res.json({ message: 'Disciplina removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar disciplina:', error);
        res.status(500).json({ message: 'Erro no servidor ao deletar disciplina.' });
    }
});

module.exports = router;