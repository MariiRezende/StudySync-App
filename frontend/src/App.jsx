import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DisciplineManager from './components/DisciplineManager';
import StudyStatistics from './components/StudyStatistics';
import TaskList from './components/TaskList';
import Profile from './components/Profile';
import Ranking from './components/Ranking';
import GroupManager from './components/GroupManager';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import StudyTopicPlanner from './components/StudyTopicPlanner'; // NOVO: Importa StudyTopicPlanner
import './App.css';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Rotas públicas */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />
        <Route path="/" element={<Login />} />

        {/* Rotas protegidas (dentro do Layout) */}
        <Route path="/" element={<Layout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="disciplines" element={<DisciplineManager />} />
            <Route path="statistics" element={<StudyStatistics />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="profile" element={<Profile />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="groups" element={<GroupManager />} />
            <Route path="topics" element={<StudyTopicPlanner />} /> {/* NOVA ROTA AQUI */}
        </Route>
      </Routes>
    </div>
  );
}

export default App;