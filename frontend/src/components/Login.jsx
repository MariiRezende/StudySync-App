import React, { useState } from 'react'; 
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Para mensagens de sucesso/erro
  const navigate = useNavigate(); // Hook para navegação

  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o recarregamento da página

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });
      // Se o login for bem-sucedido:
      setMessage('Login bem-sucedido! Redirecionando...');
      // Armazenar o token JWT e dados do usuário no localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('userId', response.data._id); // Armazenar o ID do usuário
      localStorage.setItem('profilePicture', response.data.profilePicture || ''); // Armazenar a foto de perfil
      localStorage.setItem('totalStudyTime', response.data.totalStudyTime); // Armazenar tempo de estudo
      localStorage.setItem('userStatus', response.data.status || 'offline'); // NOVO: Salva o status também

      // Redirecionar para a tela principal/dashboard
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 1000);
    } catch (error) {
      // Tratar erros da API
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message); // Exibe a mensagem de erro do backend
      } else {
        setMessage('Erro ao fazer login. Tente novamente.');
      }
      console.error('Erro de login:', error);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
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
        <button type="submit" className="btn-primary">Entrar</button>
      </form>
      {message && <p className="message">{message}</p>}
      <p>Não tem uma conta? <Link to="/register">Crie uma!</Link></p>
      <p className="forgot-password-link">
        <Link to="/forgotpassword">Esqueci a senha?</Link> {/* NOVO LINK AQUI */}
      </p>
    </div>
  );
}

export default Login;