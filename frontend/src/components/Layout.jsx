import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

function Layout() {
    const navigate = useNavigate();
    const username = localStorage.getItem('username');
    const profilePicture = localStorage.getItem('profilePicture');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <header className="main-header">
                <div className="logo-section">
                    {profilePicture && (
                        <img
                            src={`http://localhost:5000${profilePicture}`}
                            alt="Perfil"
                            className="profile-pic-header"
                        />
                    )}
                    <h2>StudySync</h2>
                    <span className="welcome-message">Olá, {username || 'Usuário'}!</span>
                </div>
                <nav className="main-nav">
                    <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    <Link to="/disciplines" className="nav-link">Disciplinas</Link>
                    <Link to="/statistics" className="nav-link">Estatísticas</Link>
                    <Link to="/tasks" className="nav-link">Tarefas</Link>
                    <Link to="/profile" className="nav-link">Perfil</Link>
                    <Link to="/ranking" className="nav-link">Ranking</Link>
                    <Link to="/groups" className="nav-link">Grupos</Link>
                    <Link to="/topics" className="nav-link">Tópicos</Link> {/* NOVO LINK AQUI */}
                    <button onClick={handleLogout} className="btn-logout">Sair</button>
                </nav>
            </header>
            <main className="app-content">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;