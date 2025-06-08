import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const { resettoken } = useParams(); // Pega o token da URL
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) { // Validação de tamanho mínimo da senha
        setMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/api/auth/resetpassword/${resettoken}`, { newPassword });
      setMessage(response.data.message + ' Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error.response?.data?.message || error.message);
      setMessage(error.response?.data?.message || 'Erro ao redefinir senha. O link pode ser inválido ou expirado.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Redefinir Senha</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Nova Senha:</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Confirmar Senha:</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">Redefinir Senha</button>
      </form>
      {message && <p className="message">{message}</p>}
      <p><Link to="/login">Voltar ao Login</Link></p>
    </div>
  );
}

export default ResetPassword;