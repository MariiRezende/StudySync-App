import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState('');
    const [profilePictureUrl, setProfilePictureUrl] = useState(localStorage.getItem('profilePicture') || '');
    const navigate = useNavigate();

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setMessage('Por favor, selecione um arquivo para upload.');
            return;
        }

        const formData = new FormData();
        formData.append('profilePicture', selectedFile);

        try {
            const response = await axios.post(
                'http://localhost:5000/api/upload/profile-picture',
                formData,
                getAuthHeaders()
            );
            setMessage('Upload de foto de perfil bem-sucedido!');
            // Força um novo carregamento da imagem adicionando um timestamp para evitar cache
            setProfilePictureUrl(`http://localhost:5000${response.data.profilePicture}?${Date.now()}`);
            localStorage.setItem('profilePicture', response.data.profilePicture);
            console.log('Upload bem-sucedido:', response.data);
            setSelectedFile(null); // Limpa o arquivo selecionado
        } catch (error) {
            console.error('Erro no upload:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao fazer upload da foto.');
        }
    };

    // NOVO: Função para deletar a conta
    const handleDeleteAccount = async () => {
        if (window.confirm('ATENÇÃO: Tem certeza que deseja DELETAR sua conta? Esta ação é irreversível e excluirá TODOS os seus dados (sessões, disciplinas, tarefas, grupos)!')) {
            try {
                await axios.delete('http://localhost:5000/api/users/me', getAuthHeaders());
                localStorage.clear(); // Limpa todos os dados do usuário do localStorage
                setMessage('Conta excluída com sucesso! Redirecionando...');
                setTimeout(() => {
                    navigate('/login'); // Redireciona para o login
                    window.location.reload(); // Força um refresh para limpar o estado da aplicação
                }, 2000);
            } catch (error) {
                console.error('Erro ao deletar conta:', error.response?.data?.message || error.message);
                setMessage(error.response?.data?.message || 'Erro ao deletar conta. Tente novamente.');
            }
        }
    };

    return (
        <div className="profile-container">
            <h3>Minha Foto de Perfil</h3>
            {message && <p className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</p>}

            <div className="profile-picture-display">
                {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Foto de Perfil" className="current-profile-pic" />
                ) : (
                    <div className="no-profile-pic">Sem foto de perfil</div>
                )}
            </div>

            <form onSubmit={handleUpload} className="profile-upload-form">
                <div className="form-group">
                    <label htmlFor="file-upload" className="file-upload-label">
                        Escolher Imagem
                    </label>
                    <input
                        type="file"
                        id="file-upload"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    {selectedFile && <span className="selected-file-name">{selectedFile.name}</span>}
                </div>
                <button type="submit" className="btn-primary" disabled={!selectedFile}>
                    Fazer Upload
                </button>
            </form>

            {/* NOVO: Botão de Deletar Conta */}
            <button onClick={handleDeleteAccount} className="btn-danger" style={{ marginTop: '40px' }}>
                Deletar Minha Conta
            </button>

            {/* Botão para voltar ao dashboard */}
            <button onClick={() => navigate('/dashboard')} className="btn-secondary" style={{ marginTop: '20px' }}>
                Voltar ao Dashboard
            </button>
        </div>
    );
}

export default Profile;