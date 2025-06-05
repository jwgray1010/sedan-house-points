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
import BadgesPage from './pages/BadgesPage';
import CelebrationPage from './pages/CelebrationPage';
import BehaviorLogPage from './pages/BehaviorLogPage';

// TODO: Replace with actual authentication/role logic
const isTeacher = true;

function App() {
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
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/celebration" element={<CelebrationPage />} />
        <Route path="/behavior-log" element={<BehaviorLogPage />} />
        {/* Optionally, add a catch-all route for 404s */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
