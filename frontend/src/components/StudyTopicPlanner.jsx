import React, { useState, useEffect } from 'react';
import axios from 'axios';

function StudyTopicPlanner() {
    const [topics, setTopics] = useState([]);
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicDescription, setNewTopicDescription] = useState('');
    const [selectedPrerequisites, setSelectedPrerequisites] = useState([]); // IDs dos pré-requisitos
    const [editingTopic, setEditingTopic] = useState(null); // Tópico sendo editado
    const [message, setMessage] = useState('');
    const [topologicalOrder, setTopologicalOrder] = useState([]); // Ordem sugerida
    const [hasCycle, setHasCycle] = useState(false); // Detecta ciclo
    const [cycleDetails, setCycleDetails] = useState([]); // Detalhes do ciclo

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    // Função para buscar todos os tópicos do usuário
    const fetchTopics = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/topics', getAuthHeaders());
            setTopics(response.data);
        } catch (error) {
            console.error('Erro ao buscar tópicos:', error.response?.data?.message || error.message);
            setMessage('Erro ao carregar tópicos.');
        }
    };

    // Função para buscar a ordem topológica
    const fetchTopologicalOrder = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/topics/topological-order', getAuthHeaders());
            setTopologicalOrder(response.data.order);
            setHasCycle(response.data.hasCycle);
            setCycleDetails(response.data.cycleDetails || []);
            // Ajusta a mensagem baseada no status do ciclo
            if (response.data.hasCycle) {
                setMessage('Um ciclo foi detectado nos pré-requisitos!');
            } else {
                setMessage(response.data.message);
            }
            setTimeout(() => setMessage(''), 5000); // Limpa a mensagem
        } catch (error) {
            console.error('Erro ao obter ordem topológica:', error.response?.data?.message || error.message);
            setMessage('Erro ao obter ordem de estudo.');
        }
    };

    // Carrega tópicos e ordem topológica ao montar o componente
    useEffect(() => {
        fetchTopics();
        fetchTopologicalOrder();
    }, []); // Roda apenas uma vez ao montar

    // Roda a ordem topológica novamente se os tópicos mudarem (exceto durante a edição para evitar ciclos temporários)
    useEffect(() => {
        if (!editingTopic) { // Só recalcula se não estiver em modo de edição
            fetchTopologicalOrder();
        }
    }, [topics, editingTopic]); // Roda sempre que a lista de tópicos ou o modo de edição for alterado

    // Função para adicionar um novo tópico
    const handleAddTopic = async (e) => {
        e.preventDefault();
        if (!newTopicName.trim()) {
            setMessage('O nome do tópico é obrigatório.');
            return;
        }
        try {
            const response = await axios.post(
                'http://localhost:5000/api/topics',
                {
                    name: newTopicName.trim(),
                    description: newTopicDescription,
                    prerequisites: selectedPrerequisites.filter(id => id !== '') // NOVO: Filtra IDs vazios
                },
                getAuthHeaders()
            );
            setTopics([...topics, response.data]); // Adiciona o novo tópico à lista
            setNewTopicName(''); // Limpa o formulário
            setNewTopicDescription('');
            setSelectedPrerequisites([]);
            setMessage('Tópico adicionado com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao adicionar tópico:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao adicionar tópico.');
        }
    };

    // Função para iniciar a edição de um tópico
    const handleEditClick = (topic) => {
        setEditingTopic(topic);
        setNewTopicName(topic.name);
        setNewTopicDescription(topic.description);
        // Preenche os pré-requisitos selecionados
        setSelectedPrerequisites(topic.prerequisites.map(prereq => prereq.toString()));
    };

    // Função para atualizar um tópico existente
    const handleUpdateTopic = async (e) => {
        e.preventDefault();
        if (!newTopicName.trim()) {
            setMessage('O nome do tópico é obrigatório.');
            return;
        }
        try {
            const response = await axios.put(
                `http://localhost:5000/api/topics/${editingTopic._id}`,
                {
                    name: newTopicName.trim(),
                    description: newTopicDescription,
                    prerequisites: selectedPrerequisites.filter(id => id !== '') // NOVO: Filtra IDs vazios
                },
                getAuthHeaders()
            );
            // Atualiza o tópico na lista localmente
            setTopics(topics.map(t => (t._id === response.data._id ? response.data : t)));
            setEditingTopic(null); // Sai do modo de edição
            setNewTopicName(''); // Limpa o formulário
            setNewTopicDescription('');
            setSelectedPrerequisites([]);
            setMessage('Tópico atualizado com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao atualizar tópico:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao atualizar tópico.');
        }
    };

    // Função para deletar um tópico
    const handleDeleteTopic = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este tópico?')) {
            try {
                await axios.delete(`http://localhost:5000/api/topics/${id}`, getAuthHeaders());
                setTopics(topics.filter(t => t._id !== id)); // Remove da lista localmente
                setMessage('Tópico excluído com sucesso!');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('Erro ao excluir tópico:', error.response?.data?.message || error.message);
                setMessage(error.response?.data?.message || 'Erro ao excluir tópico.');
            }
        }
    };

    return (
        <div className="study-topic-planner-container">
            <h3>Planejador de Rota de Estudo (Grafos)</h3>
            {message && <p className={`message ${hasCycle ? 'error' : (message.includes('sucesso') ? 'success' : '')}`}>{message}</p>}
            {hasCycle && cycleDetails.length > 0 && (
                <p className="message error">
                    Ciclo detectado envolvendo: <strong>{cycleDetails.join(', ')}</strong>. Remova o pré-requisito para resolver.
                </p>
            )}

            {/* Formulário de Adição/Edição de Tópicos */}
            <form onSubmit={editingTopic ? handleUpdateTopic : handleAddTopic} className="topic-form">
                <h4>{editingTopic ? 'Atualizar Tópico' : 'Adicionar Novo Tópico'}</h4>
                <div className="form-group">
                    <label htmlFor="topic-name">Nome do Tópico:</label>
                    <input
                        type="text"
                        id="topic-name"
                        value={newTopicName}
                        onChange={(e) => setNewTopicName(e.target.value)}
                        placeholder="Ex: Grafos, Recursão, Algoritmos"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="topic-description">Descrição (Opcional):</label>
                    <textarea
                        id="topic-description"
                        value={newTopicDescription}
                        onChange={(e) => setNewTopicDescription(e.target.value)}
                        placeholder="Breve descrição do conteúdo..."
                        rows="2"
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="prerequisites-select">Pré-requisitos (Opcional):</label>
                    <select
                        id="prerequisites-select"
                        multiple // Permite selecionar múltiplos
                        value={selectedPrerequisites}
                        onChange={(e) => {
                            // Coleta todos os valores selecionados
                            const options = e.target.options;
                            const value = [];
                            for (let i = 0, l = options.length; i < l; i++) {
                                if (options[i].selected) {
                                    value.push(options[i].value);
                                }
                            }
                            setSelectedPrerequisites(value);
                        }}
                    >
                        <option value="">-- Selecione Pré-requisitos --</option>
                        {topics
                            .filter(t => !editingTopic || t._id !== editingTopic._id) // Não pode ser pré-requisito de si mesmo
                            .map(topic => (
                                <option key={topic._id} value={topic._id}>
                                    {topic.name}
                                </option>
                            ))}
                    </select>
                    <small>Selecione um ou mais tópicos que devem ser estudados antes deste.</small>
                </div>
                <button type="submit" className="btn-primary">
                    {editingTopic ? 'Atualizar Tópico' : 'Adicionar Tópico'}
                </button>
                {editingTopic && (
                    <button type="button" onClick={() => {
                        setEditingTopic(null); // Cancela edição
                        setNewTopicName('');
                        setNewTopicDescription('');
                        setSelectedPrerequisites([]);
                    }} className="btn-secondary">
                        Cancelar
                    </button>
                )}
            </form>

            {/* Seção de Ordem de Estudo */}
            <div className="study-order-section">
                <h4>Ordem de Estudo Sugerida:</h4>
                {hasCycle ? (
                    <p className="error-message">Um ciclo foi detectado nos pré-requisitos! Remova o pré-requisito para resolver e obter a ordem de estudo.</p>
                ) : topologicalOrder.length === 0 ? (
                    <p>Adicione tópicos e pré-requisitos para ver a ordem de estudo.</p>
                ) : (
                    <ol className="topological-order-list">
                        {topologicalOrder.map((topic, index) => (
                            <li key={topic._id}>
                                <strong>{index + 1}. {topic.name}</strong>
                                {topic.prerequisites.length > 0 && (
                                    <span className="prereq-info"> (Pré-req: {topic.prerequisites.map(prereqId => 
                                        topics.find(t => t._id === prereqId)?.name || 'Desconhecido'
                                    ).join(', ')})</span>
                                )}
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            {/* Lista de Todos os Tópicos */}
            <div className="all-topics-list">
                <h4>Meus Tópicos Cadastrados:</h4>
                {topics.length === 0 ? (
                    <p>Nenhum tópico cadastrado ainda.</p>
                ) : (
                    <ul>
                        {topics.map(topic => (
                            <li key={topic._id} className="topic-item">
                                <span className="topic-name">{topic.name}</span>
                                <div className="topic-actions">
                                    <button onClick={() => handleEditClick(topic)} className="btn-icon">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDeleteTopic(topic._id)} className="btn-icon btn-delete">
                                        🗑️
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default StudyTopicPlanner;