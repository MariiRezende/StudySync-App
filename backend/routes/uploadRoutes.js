const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); // Módulo nativo do Node.js para lidar com caminhos de arquivo
const User = require('../models/User'); // Importa o modelo de usuário
const { protect } = require('../middleware/authMiddleware'); // Middleware de proteção

// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Salva os arquivos na pasta 'uploads/' do backend
    },
    filename: function (req, file, cb) {
        // Define o nome do arquivo como ID_DO_USUARIO-TIMESTAMP.EXTENSAO_ORIGINAL
        const extname = path.extname(file.originalname); // Pega a extensão original do arquivo
        cb(null, `${req.user._id}-${Date.now()}${extname}`);
    }
});

// Filtro para aceitar apenas arquivos de imagem
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) { // Verifica se o mimetype é de imagem
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas!'), false);
    }
};

// Inicializa o upload com Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // Limite de 5MB
});

// @desc    Upload de foto de perfil
// @route   POST /api/upload/profile-picture
// @access  Private
router.post('/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de imagem enviado.' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // O caminho completo do arquivo para o frontend
        const imageUrl = `/uploads/${req.file.filename}`; // Assumimos que o frontend acessará /uploads/filename

        user.profilePicture = imageUrl; // Atualiza o campo profilePicture do usuário
        await user.save();

        res.json({
            message: 'Foto de perfil atualizada com sucesso!',
            profilePicture: imageUrl
        });

    } catch (error) {
        console.error('Erro ao fazer upload da foto de perfil:', error);
        res.status(500).json({ message: 'Erro no servidor ao fazer upload da imagem.' });
    }
});

module.exports = router;