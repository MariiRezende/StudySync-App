// Carrega as variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importa o pacote cors

// Importa todas as rotas
const authRoutes = require('./routes/authRoutes');
const studyRoutes = require('./routes/studyRoutes');
const disciplineRoutes = require('./routes/disciplineRoutes');
const taskRoutes = require('./routes/taskRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const groupRoutes = require('./routes/groupRoutes');
const userRoutes = require('./routes/userRoutes');
const topicRoutes = require('./routes/topicRoutes'); // NOVO: Importa as rotas de tópico
const path = require('path'); // Módulo nativo do Node.js para lidar com caminhos de arquivo

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middlewares
app.use(express.json()); // Permite que o Express lide com JSON nas requisições
app.use(cors()); // Habilita o CORS para permitir requisições do frontend

// Rotas da API (organizadas e sem repetição)
app.use('/api/auth', authRoutes);
app.use('/api/studies', studyRoutes);
app.use('/api/disciplines', disciplineRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/topics', topicRoutes); // NOVO: Usa as rotas de tópico para o caminho /api/topics


// Servir pasta 'uploads' como estática (acessível via URL)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware para lidar com rotas não encontradas (404)
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Se o status for 200 (ok), muda para 500 (erro interno)
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Mostra o stack trace apenas em desenvolvimento
    });
});

// Conexão com o Banco de Dados MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Conectado ao MongoDB com sucesso!');
        // Inicia o servidor Express APENAS APÓS a conexão com o DB
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Erro ao conectar ao MongoDB:', error.message);
        process.exit(1); // Encerra o processo do Node.js em caso de erro na conexão
    });