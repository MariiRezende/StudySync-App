const mongoose = require('mongoose');

const disciplineSchema = new mongoose.Schema({
    user: { // Referência ao usuário que criou a disciplina
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Indica que se refere ao modelo 'User'
        required: true
    },
    name: { // Nome da disciplina
        type: String,
        required: true,
        trim: true,
        unique: false // Não precisa ser único globalmente, apenas por usuário
    },
    description: { // Descrição opcional da disciplina
        type: String,
        trim: true,
        default: ''
    },
    color: { // Cor opcional para identificação visual (frontend)
        type: String,
        default: '#007bff' // Cor padrão azul
    }
}, {
    timestamps: true // Adiciona `createdAt` e `updatedAt` automaticamente
});

// Garante que o nome da disciplina seja único PARA CADA USUÁRIO
disciplineSchema.index({ user: 1, name: 1 }, { unique: true });

const Discipline = mongoose.model('Discipline', disciplineSchema);

module.exports = Discipline;