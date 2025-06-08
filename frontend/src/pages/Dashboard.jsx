import React from 'react';
// Removemos Link e useNavigate porque o logout será do Layout e a navegação também
import StudyTimer from '../components/StudyTimer';

function Dashboard() {
    // Removemos handleLogout, username e profilePicture, pois o Layout vai gerenciar
    // const navigate = useNavigate();
    // const username = localStorage.getItem('username');
    // const profilePicture = localStorage.getItem('profilePicture');
    // const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    return (
        <div className="dashboard-content-page"> {/* Nova classe para a página específica */}
            {/* Removemos o <header> e <nav> daqui */}
            <h2>Seu Espaço de Estudo</h2>
            <p>Aqui você pode iniciar suas sessões de estudo, organizar suas tarefas e ver seu progresso.</p>
            <StudyTimer />
            {/* Outras seções do dashboard podem vir aqui */}
        </div>
    );
}

export default Dashboard;