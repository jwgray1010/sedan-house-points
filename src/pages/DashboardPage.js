// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase.js';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  List,
  BarChart2,
  Award,
  Trophy,
  LogOut
} from 'lucide-react';
import PointModal from '../components/PointModal.js';
import BehaviorHistoryModal from '../components/BehaviorHistoryModal.js';
import emailjs from 'emailjs-com';
import {
  sedanLogo,
  houseStorm,
  houseMeadow,
  houseFlint,
  houseEmber
} from '../assets/assets.js';
import './DashboardPage.css';
import Confetti from 'react-confetti';
import { signOut } from 'firebase/auth';

const EMAIL_ALERT_STEPS = [3, 4, 5];
const ADMIN_EMAIL = 'john.gray@usd286.org';

const BADGE_MILESTONES = [
  { days: 20, label: "Blue Devil Champion", color: "#e53935" },
  { days: 10, label: "Self Manager", color: "#1e88e5" },
  { days: 5, label: "Consistency Star", color: "#ffd600" },
];

const ding = new Audio('/ding.mp3');
const alertSound = new Audio('/alert.mp3');

const teacherList = ['Teacher A', 'Teacher B'];
const housePoints = { Storm: 0, Meadow: 0, Flint: 0, Ember: 0 };
const maxPts = Math.max(...Object.values(housePoints));
const filteredStudents = []; // or apply your filter logic
const getCurrentStep = (id) => 1; // Replace with your logic
const todayStr = new Date().toISOString().slice(5, 10);
const handlePoint = (student, dir) => {};
const getTodaysLogs = (id, dir) => [];
const handleSubmitPoint = () => {};
const birthdayStudents = [];

const DashboardPage = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  const [teacherName, setTeacherName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [notification, setNotification] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // ... your other hooks, effects, and functions ...

  const handleSignOut = () => {
    signOut(auth)
      .then(() => {
        console.log('User signed out.');
        navigate('/');
      })
      .catch((error) => {
        console.error('Sign out error:', error);
      });
  };

  // ... your filtering, point handling, etc. ...

  return (
    <div className="dashboard-container">
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* ─── Header Bar ─── */}
      <div className="header-bar">
        <div className="page-header">
          <img src={sedanLogo} className="header-icon" alt="Sedan Logo" />
          <div className="header-title">
            <h1>
              Sedan Elementary<br />
              Behavior Tracker
            </h1>
            <p className="subtext">Logged in as {teacherName}</p>
            <p className="reset-note">* Steps reset daily at midnight</p>
          </div>
          {/* Menu button + dropdown content */}
          <div className="dropdown">
            <button className="dropbtn" onClick={() => setMenuOpen(o => !o)}>
              <Menu size={24} />
            </button>
            <div className={`dropdown-content ${menuOpen ? 'show' : ''}`}>
              <button onClick={() => navigate('/summary')}>
                <List size={16} /> Summary
              </button>
              <button onClick={() => navigate('/graphs')}>
                <BarChart2 size={16} /> Graphs
              </button>
              <button onClick={() => navigate('/podium')}>
                <Award size={16} /> Podium
              </button>
              <button onClick={() => navigate('/hall-of-fame')}>
                <Trophy size={16} /> Hall of Fame
              </button>
              <button onClick={() => navigate('/certificates')}>
                Certificates
              </button>
              <button onClick={() => navigate('/badges')}>
                Badges
              </button>
              <button onClick={() => navigate('/celebration')}>
                Celebration
              </button>
              <button onClick={() => navigate('/behavior-log')}>
                Behavior Log
              </button>
              <button onClick={() => navigate('/steps')}>
                Behavior Steps
              </button>
              <button onClick={() => navigate('/reward-store')}>
                Rewards
              </button>
              <button onClick={handleSignOut}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Controls ─── */}
      <div className="controls">
        <button onClick={() => navigate('/steps')}>
          View Behavior Steps
        </button>
        <select
          value={selectedTeacher}
          onChange={e => setSelectedTeacher(e.target.value)}
        >
          <option value="All">All Teachers</option>
          {teacherList.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* ─── House Cards ─── */}
      <div className="house-card-container">
        {['Storm', 'Meadow', 'Flint', 'Ember'].map((h) => (
          <div
            key={h}
            className={`house-card ${housePoints[h] === maxPts ? 'leader' : ''}`}
          >
            <img
              src={
                { Storm: houseStorm, Meadow: houseMeadow, Flint: houseFlint, Ember: houseEmber }[h]
              }
              alt={h}
              className="shield-img"
            />
            <p>
              {h}: {housePoints[h]} pts
            </p>
          </div>
        ))}
      </div>

      {/* ─── Student Grid ─── */}
      <div className="student-grid">
        {filteredStudents.map((student) => {
          const step = getCurrentStep(student.id);
          const atMaxStep = step >= 5;
          const streak = student.streakCount || 0;
          const badge = BADGE_MILESTONES.find(b => streak >= b.days);
          const isBirthday = student.birthday && student.birthday.slice(5, 10) === todayStr;

          return (
            <div
              key={student.id}
              className="student-card"
              tabIndex={0}
              aria-label={`View history for ${student.name}`}
              onClick={() => setHistoryStudent(student)}
              onKeyDown={e => { if (e.key === 'Enter') setHistoryStudent(student); }}
            >
              {isBirthday && <Confetti width={window.innerWidth} height={window.innerHeight} />}
              {isBirthday && <div className="birthday-banner">🎉 Happy Birthday! 🎂</div>}
              {badge && (
                <div
                  className="streak-badge"
                  style={{ background: badge.color }}
                  title={`${badge.label} (${streak}-Day Streak)`}
                >
                  🏅 {badge.label}
                </div>
              )}
              <div className="step-indicator">Step {step}</div>
              <div className="avatar">
                {student.name?.[0] || '?'}
              </div>
              <div className="name">{student.name}</div>
              <div className="bubble-counters">
                {['positive', 'negative'].map((dir) => (
                  <div
                    key={dir}
                    className={`bubble ${dir === 'positive' ? 'green' : 'red'} ${atMaxStep ? 'disabled' : ''}`}
                    tabIndex={0}
                    aria-label={`Add ${dir} point for ${student.name}`}
                    onClick={(e) => {
                      if (atMaxStep) return;
                      e.stopPropagation();
                      handlePoint(student, dir);
                      const el = e.currentTarget;
                      el.classList.add('pop');
                      setTimeout(() => el.classList.remove('pop'), 300);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !atMaxStep) {
                        handlePoint(student, dir);
                      }
                    }}
                  >
                    {getTodaysLogs(student.id, dir).length}
                  </div>
                ))}
              </div>
              {student.badges && student.badges.includes("30-Day Behavior Anniversary") && (
                <span className="milestone-badge" title="30-Day Behavior Anniversary">🏆</span>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── Modals ─── */}
      {selectedStudent && (
        <PointModal
          student={selectedStudent}
          direction={selectedDirection}
          onClose={() => setSelectedStudent(null)}
          onSubmit={handleSubmitPoint}
        />
      )}
      {historyStudent && (
        <BehaviorHistoryModal
          student={historyStudent}
          logs={behaviorLogs.filter((l) => l.studentId === historyStudent.id)}
          onClose={() => setHistoryStudent(null)}
        />
      )}

      {isAdmin && (
        <div className="admin-panel">
          {/* Admin-only content here */}
        </div>
      )}

      {/* Birthday alert for teacher's students */}
      {birthdayStudents.length > 0 && (
        <div className="teacher-birthday-alert">
          🎂 Today is {birthdayStudents.map(s => s.name).join(', ')}'s birthday!
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
