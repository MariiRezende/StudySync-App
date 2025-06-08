const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    user: { // Referência ao usuário que criou a tarefa
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: { // Título da tarefa
        type: String,
        required: true,
        trim: true,
        minlength: 1
    },
    description: { // Descrição opcional
        type: String,
        trim: true,
        default: ''
    },
    completed: { // Se a tarefa está concluída ou não
        type: Boolean,
        default: false
    },
    priority: { // Prioridade da tarefa (ex: 1=Alta, 2=Média, 3=Baixa)
        type: Number,
        default: 3, // Padrão: Baixa prioridade
        min: 1,
        max: 3
    },
    dueDate: { // Data de vencimento opcional
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adiciona `createdAt` e `updatedAt` automaticamente
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;