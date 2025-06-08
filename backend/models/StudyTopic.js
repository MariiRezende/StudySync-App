const mongoose = require('mongoose');

const studyTopicSchema = new mongoose.Schema({
    user: { // Referência ao usuário que criou o tópico
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: { // Nome do tópico de estudo
        type: String,
        required: true,
        trim: true,
        unique: false // Não precisa ser único globalmente, apenas por usuário
    },
    description: { // Descrição opcional
        type: String,
        trim: true,
        default: ''
    },
    prerequisites: [ // Array de IDs de outros tópicos que são pré-requisitos
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyTopic' // Referência a outros StudyTopics
        }
    ]
}, {
    timestamps: true
});

// Garante que o nome do tópico seja único PARA CADA USUÁRIO
studyTopicSchema.index({ user: 1, name: 1 }, { unique: true });

const StudyTopic = mongoose.model('StudyTopic', studyTopicSchema);

module.exports = StudyTopic;