const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
    name: { // Nome do grupo
        type: String,
        required: true,
        unique: true, // Nome do grupo deve ser único globalmente
        trim: true,
        minlength: 3
    },
    description: { // Descrição do grupo
        type: String,
        trim: true,
        default: ''
    },
    members: [ // Lista de IDs de usuários que são membros do grupo
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    creator: { // Usuário que criou o grupo (opcional, mas bom para tracking)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true // Adiciona `createdAt` e `updatedAt` automaticamente
});

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

module.exports = StudyGroup;