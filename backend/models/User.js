const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // NOVO: Importa o módulo crypto

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Por favor, insira um e-mail válido']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    profilePicture: {
        type: String,
        default: ''
    },
    totalStudyTime: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['offline', 'online', 'studying'],
        default: 'offline'
    },
    resetPasswordToken: String, // NOVO CAMPO: Para armazenar o token de redefinição
    resetPasswordExpire: Date,   // NOVO CAMPO: Para armazenar a data de expiração do token
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// NOVO MÉTODO: Gerar token de redefinição de senha
userSchema.methods.getResetPasswordToken = function() {
    // Gerar um token aleatório (bytes)
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash do token e salvar no schema do usuário
    // Usamos sha256 para hashear o token antes de salvar no DB por segurança.
    // O token não hasheado é o que será enviado por e-mail.
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Definir data de expiração (10 minutos)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos em milissegundos

    return resetToken; // Retorna o token não hasheado para enviar por e-mail
};


const User = mongoose.model('User', userSchema);

module.exports = User;