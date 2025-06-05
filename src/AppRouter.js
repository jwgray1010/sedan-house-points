// AppRouter.js - All main pages included, ready for future auth/role protection
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen.js';
import LoginPage from './pages/LoginPage.js';
import DashboardPage from './pages/DashboardPage.js';
import StepsPage from './pages/StepsPage.js';
import SummaryPage from './pages/SummaryPage.js';
import GraphsPage from './pages/GraphsPage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import StudentProfile from './pages/StudentProfile.js';
import PodiumPage from './pages/PodiumPage.js';
import HallOfFamePage from './pages/HallOfFamePage.js';
import CertificatesPage from './pages/CertificatesPage.js';
import RewardStorePage from './pages/RewardStorePage.js';
import BadgesPage from './pages/BadgesPage.js';
import CelebrationPage from './pages/CelebrationPage.js';
import BehaviorLogPage from './pages/BehaviorLogPage.js';

// TODO: Add authentication/role-based route protection as needed

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Student profile route */}
        <Route path="/student/:studentId" element={<StudentProfile />} />
        {/* Main routes */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/steps" element={<StepsPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/graphs" element={<GraphsPage />} />
        <Route path="/podium" element={<PodiumPage />} />
        <Route path="/hall-of-fame" element={<HallOfFamePage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/reward-store" element={<RewardStorePage />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/celebration" element={<CelebrationPage />} />
        <Route path="/behavior-log" element={<BehaviorLogPage />} />
        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;