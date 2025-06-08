import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState(3); // Padrão: Baixa
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [editingTask, setEditingTask] = useState(null); // Armazena a tarefa sendo editada
    const [message, setMessage] = useState('');

    const getAuthHeaders = () => ({
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
    });

    // Função para buscar as tarefas do backend
    const fetchTasks = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/tasks', getAuthHeaders());
            setTasks(response.data);
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error.response?.data?.message || error.message);
            setMessage('Erro ao carregar tarefas.');
        }
    };

    // Carrega as tarefas ao montar o componente
    useEffect(() => {
        fetchTasks();
    }, []);

    // Função para adicionar uma nova tarefa
    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) {
            setMessage('O título da tarefa é obrigatório.');
            return;
        }
        try {
            const response = await axios.post(
                'http://localhost:5000/api/tasks',
                {
                    title: newTaskTitle.trim(),
                    description: newTaskDescription,
                    priority: newTaskPriority,
                    dueDate: newTaskDueDate || null,
                },
                getAuthHeaders()
            );
            // Adiciona a nova tarefa e reordena a lista para refletir a prioridade
            const updatedTasks = [...tasks, response.data].sort((a, b) => {
                if (a.completed !== b.completed) return a.completed - b.completed;
                if (a.priority !== b.priority) return a.priority - b.priority;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setTasks(updatedTasks);

            setNewTaskTitle(''); // Limpa o formulário
            setNewTaskDescription('');
            setNewTaskPriority(3);
            setNewTaskDueDate('');
            setMessage('Tarefa adicionada com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao adicionar tarefa.');
        }
    };

    // Função para iniciar a edição de uma tarefa
    const handleEditClick = (task) => {
        setEditingTask(task);
        setNewTaskTitle(task.title);
        setNewTaskDescription(task.description);
        setNewTaskPriority(task.priority);
        setNewTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : ''); // Formata para input type="date"
    };

    // Função para atualizar uma tarefa existente
    const handleUpdateTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) {
            setMessage('O título da tarefa é obrigatório.');
            return;
        }
        try {
            const response = await axios.put(
                `http://localhost:5000/api/tasks/${editingTask._id}`,
                {
                    title: newTaskTitle.trim(),
                    description: newTaskDescription,
                    priority: newTaskPriority,
                    dueDate: newTaskDueDate || null,
                },
                getAuthHeaders()
            );
            // Atualiza a tarefa na lista localmente e reordena
            const updatedTasks = tasks.map(t => (t._id === response.data._id ? response.data : t)).sort((a, b) => {
                if (a.completed !== b.completed) return a.completed - b.completed;
                if (a.priority !== b.priority) return a.priority - b.priority;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setTasks(updatedTasks);

            setEditingTask(null); // Sai do modo de edição
            setNewTaskTitle(''); // Limpa o formulário
            setNewTaskDescription('');
            setNewTaskPriority(3);
            setNewTaskDueDate('');
            setMessage('Tarefa atualizada com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao atualizar tarefa.');
        }
    };

    // Função para marcar/desmarcar tarefa como concluída
    const handleToggleComplete = async (task) => {
        try {
            const response = await axios.put(
                `http://localhost:5000/api/tasks/${task._id}`,
                { completed: !task.completed }, // Inverte o status de concluído
                getAuthHeaders()
            );
            // Atualiza a tarefa na lista localmente e reordena
            const updatedTasks = tasks.map(t => (t._id === response.data._id ? response.data : t)).sort((a, b) => {
                if (a.completed !== b.completed) return a.completed - b.completed;
                if (a.priority !== b.priority) return a.priority - b.priority;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setTasks(updatedTasks);
            setMessage(`Tarefa ${response.data.completed ? 'concluída' : 'reaberta'}!`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Erro ao marcar/desmarcar tarefa:', error.response?.data?.message || error.message);
            setMessage(error.response?.data?.message || 'Erro ao atualizar tarefa.');
        }
    };

    // Função para deletar uma tarefa
    const handleDeleteTask = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
            try {
                await axios.delete(`http://localhost:5000/api/tasks/${id}`, getAuthHeaders());
                setTasks(tasks.filter(t => t._id !== id)); // Remove da lista localmente
                setMessage('Tarefa excluída com sucesso!');
                setTimeout(() => setMessage(''), 3000);
            } catch (error) {
                console.error('Erro ao excluir tarefa:', error.response?.data?.message || error.message);
                setMessage(error.response?.data?.message || 'Erro ao excluir tarefa.');
            }
        }
    };

    // Helper para mapear números de prioridade para texto
    const getPriorityText = (priority) => {
        switch (priority) {
            case 1: return 'Alta';
            case 2: return 'Média';
            case 3: return 'Baixa';
            default: return 'Desconhecida';
        }
    };

    return (
        <div className="task-list-container">
            <h3>Minhas Tarefas</h3>
            {message && <p className={`message ${message.includes('sucesso') || message.includes('concluída') || message.includes('reaberta') ? 'success' : 'error'}`}>{message}</p>}

            {/* Formulário de Adição/Edição de Tarefas */}
            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} className="task-form">
                <div className="form-group">
                    <label htmlFor="task-title">Título da Tarefa:</label>
                    <input
                        type="text"
                        id="task-title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Ex: Concluir trabalho de Cálculo"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="task-description">Descrição (Opcional):</label>
                    <textarea
                        id="task-description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Detalhes sobre a tarefa..."
                        rows="2"
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="task-priority">Prioridade:</label>
                    <select
                        id="task-priority"
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(parseInt(e.target.value))}
                    >
                        <option value={1}>Alta</option>
                        <option value={2}>Média</option>
                        <option value={3}>Baixa</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="task-dueDate">Data de Vencimento (Opcional):</label>
                    <input
                        type="date"
                        id="task-dueDate"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn-primary">
                    {editingTask ? 'Atualizar Tarefa' : 'Adicionar Tarefa'}
                </button>
                {editingTask && (
                    <button type="button" onClick={() => {
                        setEditingTask(null);
                        setNewTaskTitle('');
                        setNewTaskDescription('');
                        setNewTaskPriority(3);
                        setNewTaskDueDate('');
                    }} className="btn-secondary">
                        Cancelar
                    </button>
                )}
            </form>

            {/* Lista de Tarefas */}
            <div className="tasks-list">
                <h4>Minhas Tarefas:</h4>
                {tasks.length === 0 ? (
                    <p>Nenhuma tarefa cadastrada ainda.</p>
                ) : (
                    <ul>
                        {tasks.map(task => (
                            <li key={task._id} className={`task-item ${task.completed ? 'completed-task' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => handleToggleComplete(task)}
                                />
                                <div className="task-info">
                                    <strong className="task-title">{task.title}</strong>
                                    {task.description && <span className="task-description">{task.description}</span>}
                                    <div className="task-meta">
                                        <span>Prioridade: <span className={`priority-${task.priority}`}>{getPriorityText(task.priority)}</span></span>
                                        {task.dueDate && <span>Vencimento: {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>}
                                    </div>
                                </div>
                                <div className="task-actions">
                                    <button onClick={() => handleEditClick(task)} className="btn-icon">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDeleteTask(task._id)} className="btn-icon btn-delete">
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

export default TaskList;