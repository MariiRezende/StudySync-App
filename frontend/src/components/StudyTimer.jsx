import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function StudyTimer() {
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [time, setTime] = useState(0);
    const [selectedDisciplineId, setSelectedDisciplineId] = useState('');
    const [disciplines, setDisciplines] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    const intervalRef = useRef(null);

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    // Função para atualizar o status do usuário no backend
    const updateUserStatus = async (status) => {
        try {
            await axios.put('http://localhost:5000/api/users/status', { status }, getAuthHeaders());
            console.log(`Status do usuário atualizado para: ${status}`);
            // Atualizar o status no localStorage pode ser útil para exibição imediata
            localStorage.setItem('userStatus', status);
        } catch (error) {
            console.error('Erro ao atualizar status do usuário:', error.response?.data?.message || error.message);
        }
    };

    // Função para buscar as disciplinas
    const fetchDisciplines = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/disciplines', getAuthHeaders());
            setDisciplines(response.data);
            if (response.data.length > 0) {
                setSelectedDisciplineId(response.data[0]._id);
            }
        } catch (error) {
            console.error('Erro ao buscar disciplinas para o timer:', error.response?.data?.message || error.message);
        }
    };

    // Carrega as disciplinas ao montar o componente
    useEffect(() => {
        fetchDisciplines();
    }, []);

    // Efeito para o cronômetro (rodando a cada segundo)
    useEffect(() => {
        if (isActive && !isPaused) {
            intervalRef.current = setInterval(() => {
                setTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => {
            clearInterval(intervalRef.current);
            // Opcional: setar status para 'online' quando o componente for desmontado (se o usuário não estiver estudando)
            // updateUserStatus('online');
        };
    }, [isActive, isPaused]);
    // NOVO useEffect: Verifica se há sessão ativa ao carregar o componente
useEffect(() => {
    const checkActiveSession = async () => {
        try {
            // Busca por sessões ativas do usuário logado
            const response = await axios.get('http://localhost:5000/api/studies?activeOnly=true', getAuthHeaders());
            const activeSessions = response.data;

            if (activeSessions.length > 0) {
                const session = activeSessions[0]; // Pega a primeira sessão ativa encontrada
                setCurrentSessionId(session._id);
                setIsActive(true);
                setIsPaused(false); // Assume que não está pausada ao reativar

                // Calcula o tempo decorrido desde o início da sessão
                const elapsedSeconds = Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / 1000);
                setTime(elapsedSeconds);
                console.log(`Sessão ativa encontrada para ${session.discipline}: ${formatTime(elapsedSeconds)}`);
                updateUserStatus('studying'); // Garante que o status do usuário seja 'studying'
            } else {
                updateUserStatus('online'); // Se não houver sessão ativa, o status é 'online'
            }
        } catch (error) {
            console.error('Erro ao verificar sessão ativa:', error.response?.data?.message || error.message);
            updateUserStatus('online'); // Em caso de erro, assume online para não travar
        }
    };

    checkActiveSession();
    // Quando o componente for desmontado (usuário sai da página), defina o status como online
    // Isso é importante para que o status não fique 'studying' quando o usuário sai do dashboard
    return () => {
        // Verifica se o usuário ainda está logado antes de mudar o status
        if (localStorage.getItem('token')) {
            updateUserStatus('online'); // Volta para online quando sai do dashboard
        }
    };
}, []); // Array de dependências vazio para rodar apenas na montagem

    // Função para formatar o tempo (HH:MM:SS)
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return (
            `${hours.toString().padStart(2, '0')}:` +
            `${minutes.toString().padStart(2, '0')}:` +
            `${remainingSeconds.toString().padStart(2, '0')}`
        );
    };

    // Handlers para os botões do cronômetro
    const handleStart = async () => {
        if (!selectedDisciplineId) {
            alert('Por favor, selecione uma disciplina para começar!');
            return;
        }
        const disciplineName = disciplines.find(d => d._id === selectedDisciplineId)?.name || 'Disciplina Desconhecida';

        try {
            const response = await axios.post(
                'http://localhost:5000/api/studies/start',
                { discipline: disciplineName, disciplineId: selectedDisciplineId },
                getAuthHeaders()
            );
            setCurrentSessionId(response.data._id);
            setTime(0);
            setIsActive(true);
            setIsPaused(false);
            updateUserStatus('studying'); // ATUALIZA STATUS PARA 'studying'
            console.log('Sessão iniciada:', response.data);
        } catch (error) {
            console.error('Erro ao iniciar sessão:', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Erro ao iniciar sessão.');
        }
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
        // Opcional: Mudar status para 'online' ao pausar, e 'studying' ao continuar
        // if (!isPaused) { updateUserStatus('online'); } else { updateUserStatus('studying'); }
    };

    const handleStop = async () => {
        if (!currentSessionId) {
            alert('Nenhuma sessão ativa para parar.');
            return;
        }
        try {
            const response = await axios.put(
                `http://localhost:5000/api/studies/stop/${currentSessionId}`,
                {},
                getAuthHeaders()
            );
            console.log('Sessão parada:', response.data);
            // Reseta o estado do cronômetro
            setIsActive(false);
            setIsPaused(false);
            setTime(0);
            setCurrentSessionId(null);
            updateUserStatus('online'); // ATUALIZA STATUS PARA 'online'
            const stoppedDisciplineName = disciplines.find(d => d.name === response.data.discipline)?.name || response.data.discipline;
            alert(`Sessão de ${stoppedDisciplineName} finalizada! Duração: ${formatTime(response.data.duration)}`);
        } catch (error) {
            console.error('Erro ao parar sessão:', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Erro ao parar sessão.');
        }
    };

    // ... (resto do componente de renderização)

    return (
        <div className="study-timer-container">
            <h3>Cronômetro de Estudo</h3>
            <div className="time-display">{formatTime(time)}</div>

            <div className="discipline-input">
                <label htmlFor="discipline-select">Disciplina:</label>
                {isActive ? (
                    <input
                        type="text"
                        value={disciplines.find(d => d._id === selectedDisciplineId)?.name || 'Carregando...'}
                        disabled
                    />
                ) : (
                    <select
                        id="discipline-select"
                        value={selectedDisciplineId}
                        onChange={(e) => setSelectedDisciplineId(e.target.value)}
                        disabled={disciplines.length === 0}
                    >
                        {disciplines.length === 0 && <option value="">Carregando Disciplinas...</option>}
                        {disciplines.length > 0 && <option value="">-- Selecione uma Disciplina --</option>}
                        {disciplines.map(d => (
                            <option key={d._id} value={d._id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="timer-controls">
                {!isActive ? (
                    <button onClick={handleStart} className="btn-primary" disabled={!selectedDisciplineId}>
                        Iniciar
                    </button>
                ) : (
                    <>
                        <button onClick={handlePause} className="btn-secondary">
                            {isPaused ? 'Continuar' : 'Pausar'}
                        </button>
                        <button onClick={handleStop} className="btn-danger">
                            Parar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default StudyTimer;