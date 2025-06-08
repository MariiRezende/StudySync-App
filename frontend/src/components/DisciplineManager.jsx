import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DisciplineManager() {
    const [disciplines, setDisciplines] = useState([]);
    const [newDisciplineName, setNewDisciplineName] = useState('');
    const [newDisciplineDescription, setNewDisciplineDescription] = useState('');
    const [newDisciplineColor, setNewDisciplineColor] = useState('#007bff');
    const [editingDiscipline, setEditingDiscipline] = useState(null); // Armazena a disciplina sendo editada
    const [message, setMessage] = useState('');

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    // Função para buscar as disciplinas do backend
    const fetchDisciplines = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/disciplines', getAuthHeaders());
            setDisciplines(response.data);
        } catch (error) {
            console.error('Erro ao buscar disciplinas:', error.response?.data?.message || error.message);
            setMessage('Erro ao carregar disciplinas.');
        }
    };

    // Carrega as disciplinas ao montar o componente
    useEffect(() => {
        fetchDisciplines();
    }, []);

    // Função para adicionar uma nova disciplina
    const handleAddDiscipline = async (e) => {
        e.preventDefault();
        if (!newDisciplineName.trim()) {
            setMessage('O nome da disciplina não pode ser vazio.');
            return;
        }
        try {
            const response = await axios.post(
                'http://localhost:5000/api/disciplines',
                { name: newDisciplineName.trim(), description: newDisciplineDescription, color: newDisciplineColor },
                getAuthHeaders()
            );
            setDisciplines([...disciplines, response.data]); // Adiciona a nova disciplina à lista
            setNewDisciplineName(''); // Limpa o campo
            setNewDisciplineDescription('');
            setNewDisciplineColor('#007bff');
            setMessage('Disciplina adicionada com sucesso!');
            setTimeout(() => setMessage(''), 3000); // Limpa a mensagem após 3 segundos
        } catch (error) {
            console.error('Erro ao adicionar disciplina:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao adicionar disciplina.');
        }
    };

    // Função para iniciar a edição de uma disciplina
    const handleEditClick = (discipline) => {
        setEditingDiscipline(discipline);
        setNewDisciplineName(discipline.name); // Preenche o formulário com os dados da disciplina
        setNewDisciplineDescription(discipline.description);
        setNewDisciplineColor(discipline.color);
    };

    // Função para atualizar uma disciplina existente
    const handleUpdateDiscipline = async (e) => {
        e.preventDefault();
        if (!newDisciplineName.trim()) {
            setMessage('O nome da disciplina não pode ser vazio.');
            return;
        }
        try {
            const response = await axios.put(
                `http://localhost:5000/api/disciplines/${editingDiscipline._id}`,
                { name: newDisciplineName.trim(), description: newDisciplineDescription, color: newDisciplineColor },
                getAuthHeaders()
            );
            // Atualiza a disciplina na lista localmente
            setDisciplines(disciplines.map(d => (d._id === response.data._id ? response.data : d)));
            setEditingDiscipline(null); // Sai do modo de edição
            setNewDisciplineName('');
            setNewDisciplineDescription('');
            setNewDisciplineColor('#007bff');
            setMessage('Disciplina atualizada com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao atualizar disciplina:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao atualizar disciplina.');
        }
    };

    // Função para deletar uma disciplina
    const handleDeleteDiscipline = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta disciplina?')) {
            try {
                await axios.delete(`http://localhost:5000/api/disciplines/${id}`, getAuthHeaders());
                setDisciplines(disciplines.filter(d => d._id !== id)); // Remove da lista localmente
                setMessage('Disciplina excluída com sucesso!');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('Erro ao excluir disciplina:', error.response?.data?.message || error.message);
                setMessage(error.response?.data?.message || 'Erro ao excluir disciplina.');
            }
        }
    };

    return (
        <div className="discipline-manager-container">
            <h3>Gerenciar Disciplinas</h3>
            {message && <p className={`message ${message.includes('sucesso') ? 'success' : 'error'}`}>{message}</p>}

            {/* Formulário de Adição/Edição */}
            <form onSubmit={editingDiscipline ? handleUpdateDiscipline : handleAddDiscipline} className="discipline-form">
                <div className="form-group">
                    <label htmlFor="discipline-name">Nome da Disciplina:</label>
                    <input
                        type="text"
                        id="discipline-name"
                        value={newDisciplineName}
                        onChange={(e) => setNewDisciplineName(e.target.value)}
                        placeholder="Ex: Estrutura de Dados"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="discipline-description">Descrição (Opcional):</label>
                    <input
                        type="text"
                        id="discipline-description"
                        value={newDisciplineDescription}
                        onChange={(e) => setNewDisciplineDescription(e.target.value)}
                        placeholder="Breve descrição"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="discipline-color">Cor (Opcional):</label>
                    <input
                        type="color"
                        id="discipline-color"
                        value={newDisciplineColor}
                        onChange={(e) => setNewDisciplineColor(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn-primary">
                    {editingDiscipline ? 'Atualizar Disciplina' : 'Adicionar Disciplina'}
                </button>
                {editingDiscipline && (
                    <button type="button" onClick={() => {
                        setEditingDiscipline(null); // Cancela a edição
                        setNewDisciplineName('');
                        setNewDisciplineDescription('');
                        setNewDisciplineColor('#007bff');
                    }} className="btn-secondary">
                        Cancelar
                    </button>
                )}
            </form>

            {/* Lista de Disciplinas */}
            <div className="disciplines-list">
                <h4>Minhas Disciplinas:</h4>
                {disciplines.length === 0 ? (
                    <p>Nenhuma disciplina cadastrada ainda.</p>
                ) : (
                    <ul>
                        {disciplines.map(discipline => (
                            <li key={discipline._id} className="discipline-item">
                                <span style={{ backgroundColor: discipline.color }} className="discipline-color-dot"></span>
                                {discipline.name}
                                {discipline.description && <span className="discipline-description"> - {discipline.description}</span>}
                                <div className="discipline-actions">
                                    <button onClick={() => handleEditClick(discipline)} className="btn-icon">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDeleteDiscipline(discipline._id)} className="btn-icon btn-delete">
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

export default DisciplineManager;