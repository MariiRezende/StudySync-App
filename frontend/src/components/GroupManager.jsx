import React, { useState, useEffect } from 'react'; 
import axios from 'axios';

function GroupManager() {
    const [myGroups, setMyGroups] = useState([]);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [joinGroupName, setJoinGroupName] = useState('');
    const [message, setMessage] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupRanking, setGroupRanking] = useState([]); // NOVO: Estado para o ranking do grupo
    const [rankingPeriod, setRankingPeriod] = useState('daily'); // NOVO: Estado para o período do ranking

    const currentUserId = localStorage.getItem('userId');

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    // Função para formatar segundos em HH:MM:SS
    const formatTime = (seconds) => {
        if (seconds === undefined || seconds === null) return '00:00:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return (
            `${hours.toString().padStart(2, '0')}:` +
            `${minutes.toString().padStart(2, '0')}:` +
            `${remainingSeconds.toString().padStart(2, '0')}`
        );
    };

    // Função para buscar os grupos que o usuário pertence
    const fetchMyGroups = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/groups/my-groups', getAuthHeaders());
            const formattedGroups = response.data.map(group => ({
                ...group,
                members: group.members.map(member => ({
                    ...member,
                    totalStudyTimeFormatted: formatTime(member.totalStudyTime)
                }))
            }));
            setMyGroups(formattedGroups);
        } catch (error) {
            console.error('Erro ao buscar meus grupos:', error.response?.data?.message || error.message);
            setMessage('Erro ao carregar seus grupos.');
        }
    };

    // NOVO: Função para buscar o ranking de um grupo específico por período
    const fetchGroupRanking = async (groupId, period) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/groups/<span class="math-inline">\{groupId\}/ranking?period\=</span>{period}`, getAuthHeaders());
            setGroupRanking(response.data);
        } catch (error) {
            console.error('Erro ao buscar ranking do grupo:', error.response?.data?.message || error.message);
            setGroupRanking([]); // Limpa o ranking em caso de erro
        }
    };

    // Carrega os grupos ao montar o componente
    useEffect(() => {
        fetchMyGroups();
    }, []);

    // Efeito para carregar o ranking sempre que o grupo selecionado ou o período mudar
    useEffect(() => {
        if (selectedGroup) {
            fetchGroupRanking(selectedGroup._id, rankingPeriod);
        }
    }, [selectedGroup, rankingPeriod]); // Dependências: selectedGroup e rankingPeriod

    // ... (handleCreateGroup, handleJoinGroup, handleLeaveGroup, handleDeleteGroup permanecem os mesmos)
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            setMessage('O nome do grupo é obrigatório.');
            return;
        }
        try {
            const response = await axios.post(
                'http://localhost:5000/api/groups',
                { name: newGroupName.trim(), description: newGroupDescription },
                getAuthHeaders()
            );
            const newGroupFormatted = {
                ...response.data,
                members: response.data.members.map(member => ({
                    ...member,
                    totalStudyTimeFormatted: formatTime(member.totalStudyTime)
                }))
            };
            setMyGroups([...myGroups, newGroupFormatted]);
            setNewGroupName('');
            setNewGroupDescription('');
            setMessage('Grupo criado com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao criar grupo:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao criar grupo.');
        }
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        if (!joinGroupName.trim()) {
            setMessage('O nome do grupo para entrar é obrigatório.');
            return;
        }
        try {
            const response = await axios.post(
                'http://localhost:5000/api/groups/join',
                { groupName: joinGroupName.trim() },
                getAuthHeaders()
            );
            const joinedGroupFormatted = {
                ...response.data.group,
                members: response.data.group.members.map(member => ({
                    ...member,
                    totalStudyTimeFormatted: formatTime(member.totalStudyTime)
                }))
            };
            if (!myGroups.some(group => group._id === joinedGroupFormatted._id)) {
                setMyGroups([...myGroups, joinedGroupFormatted]);
            } else {
                setMyGroups(myGroups.map(group =>
                    group._id === joinedGroupFormatted._id ? joinedGroupFormatted : group
                ));
            }
            setJoinGroupName('');
            setMessage(response.data.message || 'Você entrou no grupo com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao entrar no grupo:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao entrar no grupo.');
        }
    };

    const handleLeaveGroup = async (groupId) => {
        if (window.confirm('Tem certeza que deseja sair deste grupo?')) {
            try {
                await axios.put(`http://localhost:5000/api/groups/${groupId}/leave`, {}, getAuthHeaders());
                setMyGroups(myGroups.filter(group => group._id !== groupId));
                setMessage('Você saiu do grupo com sucesso!');
                setSelectedGroup(null);
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('Erro ao sair do grupo:', error.response?.data?.message || error.message);
                setMessage(error.response?.data?.message || 'Erro ao sair do grupo.');
            }
        }
    };

    const handleDeleteGroup = async (groupId) => {
        if (window.confirm('Tem certeza que deseja deletar este grupo? Esta ação é irreversível!')) {
            try {
                await axios.delete(`http://localhost:5000/api/groups/${groupId}`, getAuthHeaders());
                setMyGroups(myGroups.filter(group => group._id !== groupId));
                setMessage('Grupo deletado com sucesso!');
                setSelectedGroup(null);
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('Erro ao deletar grupo:', error.response?.data?.message || error.message);
                setMessage(error.response?.data?.message || 'Erro ao deletar grupo.');
            }
        }
    };

    const handleViewGroupDetails = (group) => {
        setSelectedGroup(group);
        setRankingPeriod('daily'); // Reseta para diário ao abrir detalhes
    };

    return (
        <div className="group-manager-container">
            <h3>Gerenciar Grupos de Estudo</h3>
            {message && <p className={`message ${message.includes('sucesso') || message.includes('Você entrou') || message.includes('Você saiu') ? 'success' : 'error'}`}>{message}</p>}

            <div className="group-forms-section">
                <form onSubmit={handleCreateGroup} className="group-form">
                    <h4>Criar Novo Grupo</h4>
                    <div className="form-group">
                        <label htmlFor="create-group-name">Nome do Grupo:</label>
                        <input
                            type="text"
                            id="create-group-name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="Nome do seu grupo"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="create-group-description">Descrição (Opcional):</label>
                        <textarea
                            id="create-group-description"
                            value={newGroupDescription}
                            onChange={(e) => setNewGroupDescription(e.target.value)}
                            placeholder="Sobre o que é o grupo..."
                            rows="2"
                        ></textarea>
                    </div>
                    <button type="submit" className="btn-primary">Criar Grupo</button>
                </form>

                <form onSubmit={handleJoinGroup} className="group-form">
                    <h4>Entrar em Grupo Existente</h4>
                    <div className="form-group">
                        <label htmlFor="join-group-name">Nome do Grupo:</label>
                        <input
                            type="text"
                            id="join-group-name"
                            value={joinGroupName}
                            onChange={(e) => setJoinGroupName(e.target.value)}
                            placeholder="Nome do grupo para entrar"
                            required
                        />
                    </div>
                    <button type="submit" className="btn-secondary">Entrar no Grupo</button>
                </form>
            </div>

            <div className="my-groups-list">
                <h4>Meus Grupos ({myGroups.length})</h4>
                {myGroups.length === 0 ? (
                    <p>Você não pertence a nenhum grupo ainda. Crie um ou entre em um!</p>
                ) : (
                    <ul>
                        {myGroups.map(group => (
                            <li key={group._id} className="group-item">
                                <span className="group-name" onClick={() => handleViewGroupDetails(group)}>
                                    {group.name}
                                </span>
                                <div className="group-actions">
                                    {group.creator._id === currentUserId ? (
                                        <button onClick={() => handleDeleteGroup(group._id)} className="btn-icon btn-delete" title="Deletar Grupo">
                                            🗑️
                                        </button>
                                    ) : (
                                        <button onClick={() => handleLeaveGroup(group._id)} className="btn-icon" title="Sair do Grupo">
                                            🚪
                                        </button>
                                    )}
                                    <button onClick={() => handleViewGroupDetails(group)} className="btn-icon" title="Ver Detalhes">
                                        ℹ️
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Modal/Detalhes do Grupo Selecionado */}
            {selectedGroup && (
                <div className="group-details-modal">
                    <div className="modal-content">
                        <h4>Detalhes do Grupo: {selectedGroup.name}</h4>
                        <p><strong>Descrição:</strong> {selectedGroup.description || 'N/A'}</p>
                        <p><strong>Criador:</strong> {selectedGroup.creator?.username || 'Desconhecido'}</p>

                        <h5>Membros:</h5>
                        <ul className="group-members-list">
                            {selectedGroup.members.length === 0 ? (
                                <li>Nenhum membro ainda.</li>
                            ) : (
                                selectedGroup.members.map(member => (
                                    <li key={member._id} className="member-item">
                                        {member.profilePicture && (
                                            <img
                                                src={`http://localhost:5000${member.profilePicture}`}
                                                alt={member.username}
                                                className="member-profile-pic"
                                            />
                                        )}
                                        <span className="member-username">{member.username}</span>
                                        <span className={`member-status status-${member.status || 'offline'}`}></span>
                                        <span className="member-study-time">Tempo Total: {member.totalStudyTimeFormatted || '00:00:00'}</span>
                                    </li>
                                ))
                            )}
                        </ul>

                        {/* NOVO: Seção de Ranking do Grupo */}
                        <div className="group-ranking-section">
                            <h5>Ranking de Estudo do Grupo:</h5>
                            <div className="ranking-period-selector">
                                <button
                                    onClick={() => setRankingPeriod('daily')}
                                    className={`btn-filter ${rankingPeriod === 'daily' ? 'active' : ''}`}
                                >
                                    Diário
                                </button>
                                <button
                                    onClick={() => setRankingPeriod('weekly')}
                                    className={`btn-filter ${rankingPeriod === 'weekly' ? 'active' : ''}`}
                                >
                                    Semanal
                                </button>
                                <button
                                    onClick={() => setRankingPeriod('monthly')}
                                    className={`btn-filter ${rankingPeriod === 'monthly' ? 'active' : ''}`}
                                >
                                    Mensal
                                </button>
                            </div>
                            {groupRanking.length === 0 ? (
                                <p>Nenhum tempo de estudo registrado para este período.</p>
                            ) : (
                                <ul className="group-ranking-list">
                                    {groupRanking.map((member, index) => (
                                        <li key={member._id} className="ranking-item">
                                            <span className="ranking-position">#{index + 1}</span>
                                            {member.profilePicture && (
                                                <img
                                                    src={`http://localhost:5000${member.profilePicture}`}
                                                    alt={member.username}
                                                    className="ranking-profile-pic"
                                                />
                                            )}
                                            <span className="ranking-username">{member.username}</span>
                                            <span className="ranking-time">{member.totalStudyTimeInPeriodFormatted}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <button onClick={() => setSelectedGroup(null)} className="btn-primary">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupManager;