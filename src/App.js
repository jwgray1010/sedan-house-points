// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import SummaryPage from './pages/SummaryPage';
import GraphsPage from './pages/GraphsPage';
import PodiumPage from './pages/PodiumPage';
import HallOfFamePage from './pages/HallOfFamePage';
import SplashScreen from './pages/SplashScreen';
import StepsPage from './pages/StepsPage';

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
      </Routes>
    </Router>
  );
}

export default App;