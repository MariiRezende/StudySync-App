import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudyStatistics() {
    const [sessions, setSessions] = useState([]);
    const [dailyStats, setDailyStats] = useState({});
    const [disciplineStats, setDisciplineStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    // Função para formatar segundos em HH:MM:SS
    const formatTime = (seconds) => {
        if (seconds === 0) return '00:00:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return (
            `${hours.toString().padStart(2, '0')}:` +
            `${minutes.toString().padStart(2, '0')}:` +
            `${remainingSeconds.toString().padStart(2, '0')}`
        );
    };

    // Função para agregar os dados das sessões
    const aggregateData = (sessionsData) => {
        const newDailyStats = {};
        const newDisciplineStats = {};

        sessionsData.forEach(session => {
            // Pular sessões que ainda não terminaram ou não têm duração
            if (!session.endTime || session.duration === 0) return;

            const date = new Date(session.startTime).toLocaleDateString('pt-BR'); // Formato dd/mm/yyyy
            const discipline = session.discipline;

            // Agregação por dia
            newDailyStats[date] = (newDailyStats[date] || 0) + session.duration;

            // Agregação por disciplina
            newDisciplineStats[discipline] = (newDisciplineStats[discipline] || 0) + session.duration;
        });

        setDailyStats(newDailyStats);
        setDisciplineStats(newDisciplineStats);
    };

    // Efeito para buscar as sessões e agregar os dados
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/studies', getAuthHeaders());
                setSessions(response.data);
                aggregateData(response.data); // Agrega os dados assim que recebe
                setLoading(false);
            } catch (err) {
                console.error('Erro ao buscar sessões para estatísticas:', err.response?.data?.message || err.message);
                setError('Erro ao carregar estatísticas.');
                setLoading(false);
            }
        };

        fetchSessions();
    }, []); // Executa apenas uma vez ao montar

    if (loading) return <p>Carregando estatísticas...</p>;
    if (error) return <p className="message error">{error}</p>;
    if (sessions.length === 0) return <p>Nenhuma sessão de estudo registrada ainda.</p>;

    return (
        <div className="study-statistics-container">
            <h3>Minhas Estatísticas de Estudo</h3>

            {/* Estatísticas Diárias */}
            <div className="stats-section">
                <h4>Tempo de Estudo por Dia:</h4>
                {Object.keys(dailyStats).length === 0 ? (
                    <p>Nenhum tempo registrado por dia.</p>
                ) : (
                    <ul>
                        {Object.entries(dailyStats)
                            .sort(([dateA], [dateB]) => new Date(dateB.split('/').reverse().join('-')) - new Date(dateA.split('/').reverse().join('-'))) // Ordena por data (mais recente primeiro)
                            .map(([date, duration]) => (
                            <li key={date}>
                                <strong>{date}:</strong> {formatTime(duration)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Estatísticas por Disciplina */}
            <div className="stats-section">
                <h4>Tempo de Estudo por Disciplina:</h4>
                {Object.keys(disciplineStats).length === 0 ? (
                    <p>Nenhum tempo registrado por disciplina.</p>
                ) : (
                    <ul>
                        {Object.entries(disciplineStats)
                            .sort(([, durationA], [, durationB]) => durationB - durationA) // Ordena por duração (maior primeiro)
                            .map(([discipline, duration]) => (
                            <li key={discipline}>
                                <strong>{discipline}:</strong> {formatTime(duration)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Opcional: Total Geral */}
            <div className="stats-section">
                <h4>Tempo Total Geral de Estudo:</h4>
                <p>{formatTime(sessions.reduce((total, session) => total + (session.duration || 0), 0))}</p>
            </div>
        </div>
    );
}

export default StudyStatistics;