import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import NewTask from "./pages/NewTask";
import Progress from "./pages/Progress";
import Evaluation from "./pages/Evaluation";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Management from "./pages/Management";
import TaskDashboard from './pages/TaskDashboard';

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/task/:id" element={<TaskDetail />} />
      <Route path="/new_task" element={<NewTask />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/evaluation" element={<Evaluation />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/management" element={<Management />} />
      <Route path="/task/:id/dashboard" element={<TaskDashboard />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  </Router>
);

export default App;
