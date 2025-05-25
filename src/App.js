// App.js
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import SummaryPage from './pages/SummaryPage';
import GraphsPage from './pages/GraphsPage';
import PodiumPage from './pages/PodiumPage';
import HallOfFamePage from './pages/HallOfFamePage';
import SplashScreen from './pages/SplashScreen';
import StepsPage from './pages/StepsPage';
import LoginPage from './pages/LoginPage';
import CertificatesPage from './pages/CertificatesPage';
import RewardStorePage from './pages/RewardStorePage';

function App() {
    // TODO: Replace this with your actual logic for determining if the user is a teacher
  const isTeacher = true; // Replace with actual logic, e.g., check user email or role
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/graphs" element={<GraphsPage />} />
        <Route path="/podium" element={<PodiumPage />} />
        <Route path="/hall-of-fame" element={<HallOfFamePage />} />
        <Route path="/steps" element={<StepsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/reward-store" element={<RewardStorePage isTeacher={isTeacher} />} />
      </Routes>
    </Router>
  );
}

export default App;
