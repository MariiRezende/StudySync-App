const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
    user: { // Referência ao usuário que fez a sessão
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Indica que se refere ao modelo 'User'
        required: true
    },
    discipline: { // A disciplina que está sendo estudada
        type: String,
        required: true,
        trim: true
    },
    startTime: { // Quando a sessão começou
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: { // Quando a sessão terminou
        type: Date,
        default: null // Pode ser nulo se a sessão ainda estiver ativa
    },
    duration: { // Duração total em segundos (calculado)
        type: Number,
        default: 0
    },
    notes: { // Notas opcionais sobre a sessão
        type: String,
        trim: true
    }
}, {
    timestamps: true // Adiciona `createdAt` e `updatedAt` automaticamente
});

// Middleware para calcular a duração antes de salvar
studySessionSchema.pre('save', function(next) {
    if (this.startTime && this.endTime) {
        this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000); // Duração em segundos
    }
    next();
});

const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = StudySession;