const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importa o modelo de usuário
const asyncHandler = require('express-async-handler'); // Ajuda a lidar com erros assíncronos

// Carrega a variável de ambiente JWT_SECRET
require('dotenv').config();

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Verifica se há um token JWT no cabeçalho 'Authorization'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Pega o token do cabeçalho
            token = req.headers.authorization.split(' ')[1];

            // Decodifica o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Encontra o usuário pelo ID no token e anexa ao objeto req
            // Exclui a senha do objeto de usuário retornado
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Usuário não encontrado');
            }

            next(); // Continua para a próxima função da rota
        } catch (error) {
            console.error('Erro de autenticação:', error.message);
            res.status(401); // Unauthorized
            throw new Error('Não autorizado, token falhou');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Não autorizado, nenhum token');
    }
});

module.exports = { protect };