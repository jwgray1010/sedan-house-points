// App.js
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage.js';
import SummaryPage from './pages/SummaryPage.js';
import GraphsPage from './pages/GraphsPage.js';
import PodiumPage from './pages/PodiumPage.js';
import HallOfFamePage from './pages/HallOfFamePage.js';
import SplashScreen from './pages/SplashScreen.js';
import StepsPage from './pages/StepsPage.js';
import LoginPage from './pages/LoginPage.js';
import CertificatesPage from './pages/CertificatesPage.js';
import RewardsPage from './pages/RewardsPage.js';
import BadgesPage from './pages/BadgesPage.js';
import CelebrationPage from './pages/CelebrationPage.js';
import BehaviorLogPage from './pages/BehaviorLogPage.js';

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
        <Route path="/rewardspage" element={<RewardsPage isTeacher={isTeacher} />} />
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
