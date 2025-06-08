import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    // Função para buscar o ranking
    const fetchRanking = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/ranking', getAuthHeaders());
            setRanking(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar ranking:', err.response?.data?.message || err.message);
            setError('Erro ao carregar o ranking.');
            setLoading(false);
        }
    };

    // Carrega o ranking ao montar o componente
    useEffect(() => {
        fetchRanking();
    }, []);

    if (loading) return <p>Carregando ranking...</p>;
    if (error) return <p className="message error">{error}</p>;
    if (ranking.length === 0) return <p>Nenhum usuário no ranking ainda.</p>;

    return (
        <div className="ranking-container">
            <h3>Ranking Global de Estudos</h3>
            <div className="ranking-list">
                <ul>
                    {ranking.map((user, index) => (
                        <li key={user._id} className="ranking-item">
                            <span className="ranking-position">#{index + 1}</span>
                            {user.profilePicture && (
                                <img
                                    src={`http://localhost:5000${user.profilePicture}`}
                                    alt={user.username}
                                    className="ranking-profile-pic"
                                />
                            )}
                            <span className="ranking-username">{user.username}</span>
                            <span className="ranking-time">{user.totalStudyTimeFormatted}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Ranking;