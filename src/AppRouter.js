// AppRouter.js - With Splash, Summary, and Graph Pages
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StepsPage from './pages/StepsPage';
import SummaryPage from './pages/SummaryPage';
import GraphsPage from './pages/GraphsPage';
import NotFoundPage from './pages/NotFoundPage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/steps" element={<StepsPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/graphs" element={<GraphsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;