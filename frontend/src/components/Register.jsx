import React, { useState } from 'react'; 
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Para mensagens de sucesso/erro
  const navigate = useNavigate(); // Hook para navegação

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
      });
      // Se o registro for bem-sucedido:
      setMessage('Registro bem-sucedido! Redirecionando para o login...');
      // Armazenar o token JWT no localStorage (ex: para manter o usuário logado)
      // Em um app real, o token seria guardado aqui, mas para este fluxo, vamos redirecionar e logar depois.
      // localStorage.setItem('token', response.data.token);
      // localStorage.setItem('username', response.data.username); 
      // Redirecionar para a tela de login (ou dashboard, se preferir logar direto)
      setTimeout(() => {
        navigate('/login'); // Redireciona para a página de login
      }, 2000); // Espera 2 segundos antes de redirecionar
    } catch (error) {
      // Tratar erros da API
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message); // Exibe a mensagem de erro do backend
      } else {
        setMessage('Erro ao registrar. Tente novamente.');
      }
      console.error('Erro de registro:', error);
    }
  };

  return (
    <div className="auth-container">
      <h2>Registrar</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label>Nome de Usuário:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">Registrar</button>
      </form>
      {message && <p className="message">{message}</p>}
      <p>Já tem uma conta? <Link to="/login">Faça Login</Link></p>
    </div>
  );
}

export default Register;