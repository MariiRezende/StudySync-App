import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgotpassword', { email });
      setMessage(response.data.message);
      setEmail(''); // Limpa o campo
    } catch (error) {
      console.error('Erro ao solicitar redefinição:', error.response?.data?.message || error.message);
      setMessage(error.response?.data?.message || 'Erro ao solicitar redefinição de senha.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Esqueci a Senha</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">Enviar Link de Redefinição</button>
      </form>
      {message && <p className="message">{message}</p>}
      <p><Link to="/login">Voltar ao Login</Link></p>
    </div>
  );
}

export default ForgotPassword;