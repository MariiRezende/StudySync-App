const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Carrega a variável de ambiente JWT_SECRET e configs de email
require('dotenv').config();

// Função para gerar um token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token expira em 1 hora
    });
};

// Configuração do transportador de e-mail (usando Ethereal)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true para 465, false para outras portas (Ethereal é false)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { // NOVO: Desabilita a verificação de certificado (APENAS PARA DESENVOLVIMENTO)
        rejectUnauthorized: false
    }
});


// @desc    Registrar um novo usuário
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Usuário com este e-mail já existe.' });
        }

        user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Nome de usuário já existe.' });
        }

        user = new User({ username, email, password });
        await user.save();
        const token = generateToken(user._id);

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            token: token,
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

// @desc    Autenticar usuário e obter token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = generateToken(user._id);

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            totalStudyTime: user.totalStudyTime,
            status: user.status, // Inclui o status no login
            token: token,
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro no servidor. Tente novamente mais tarde.' });
    }
});

// Rota para solicitar redefinição de senha (enviar e-mail)
// @desc    Solicitar token de redefinição de senha
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Não revela se o e-mail existe por segurança
            return res.status(200).json({ message: 'Se o e-mail estiver registrado, um link para redefinição de senha será enviado.' });
        }

        // Gerar token de redefinição
        const resetToken = user.getResetPasswordToken();
        await user.save(); // Salva o usuário com o token hasheado e a data de expiração

        // Criar URL de redefinição para o frontend
        const resetUrl = `http://localhost:5173/resetpassword/${resetToken}`; // URL do seu frontend

        const message = `Você está recebendo este e-mail porque você (ou alguém) solicitou a redefinição da senha da sua conta StudySync.\n\n` +
                        `Por favor, clique no link a seguir ou cole-o no seu navegador para completar o processo:\n\n` +
                        `${resetUrl}\n\n` +
                        `Este link de redefinição de senha é válido por 10 minutos.\n\n` +
                        `Se você não solicitou isso, por favor ignore este e-mail e sua senha permanecerá inalterada.`;

        try {
            await transporter.sendMail({
                from: 'StudySync <noreply@studysync.com>', // Seu e-mail (do Ethereal)
                to: user.email,
                subject: 'Redefinição de Senha StudySync',
                text: message,
            });

            res.status(200).json({ message: 'E-mail para redefinição de senha enviado.' });
        } catch (mailError) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            console.error('Erro ao enviar e-mail de redefinição:', mailError);
            return res.status(500).json({ message: 'Erro ao enviar e-mail de redefinição de senha.' });
        }

    } catch (error) {
        console.error('Erro na solicitação de redefinição de senha:', error);
        res.status(500).json({ message: 'Erro no servidor ao solicitar redefinição de senha.' });
    }
});

// Rota para redefinir a senha usando o token
// @desc    Redefinir senha
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', async (req, res) => {
    const resettoken = req.params.resettoken;
    const { newPassword } = req.body;

    // Hash do token de redefinição da URL para comparar com o DB
    const hashedToken = crypto
        .createHash('sha256')
        .update(resettoken)
        .digest('hex');

    try {
        // Encontra o usuário pelo token hasheado e verifica se não expirou
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }, // Verifica se o token não expirou
        });

        if (!user) {
            return res.status(400).json({ message: 'Token de redefinição inválido ou expirado.' });
        }

        // Atualiza a senha do usuário
        user.password = newPassword; // O middleware pre-save vai hashear a nova senha
        user.resetPasswordToken = undefined; // Limpa o token
        user.resetPasswordExpire = undefined; // Limpa a expiração do token

        await user.save();

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ message: 'Erro no servidor ao redefinir senha.' });
    }
});

module.exports = router;