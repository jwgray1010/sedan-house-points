// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
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
import PointModal from '../components/PointModal';
import BehaviorHistoryModal from '../components/BehaviorHistoryModal';
import emailjs from 'emailjs-com';
import {
  sedanLogo,
  houseStorm,
  houseMeadow,
  houseFlint,
  houseEmber
} from '../assets/assets';
import './DashboardPage.css';
import Confetti from 'react-confetti'; // npm install react-confetti

const EMAIL_ALERT_STEPS = [3, 4, 5];
const ADMIN_EMAIL = 'john.gray@usd286.org';

const BADGE_MILESTONES = [
  { days: 20, label: "Blue Devil Champion", color: "#e53935" },
  { days: 10, label: "Self Manager", color: "#1e88e5" },
  { days: 5, label: "Consistency Star", color: "#ffd600" },
];

const ding = new Audio('/ding.mp3');
const alertSound = new Audio('/alert.mp3');

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

  // load students back
  useEffect(() => {
    const fetchStudents = async () => {
      const snap = await getDocs(collection(db, 'students'));
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchStudents();
  }, []);

  // load behavior logs
  useEffect(() => {
    const fetchLogs = async () => {
      const snap = await getDocs(collection(db, 'behaviorLogs'));
      setBehaviorLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchLogs();
  }, []);

 // init user
useEffect(() => {
  const initUser = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const email = user.email || '';
    const adminStatus = email === ADMIN_EMAIL;
    setIsAdmin(adminStatus);

    // get display name from teachers collection
    const ref = doc(db, 'teachers', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setTeacherName(snap.data().name);
    }
  };

  initUser();
}, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // extract today's logs for counting
  const getTodaysLogs = (studentId, direction) => {
    const today = new Date().toISOString().slice(0, 10);
    return behaviorLogs.filter(log =>
      log.studentId === studentId &&
      log.direction === direction &&
      log.timestamp?.toDate?.().toISOString().slice(0, 10) === today
    );
  };

  // current step = negative points + 1, capped at 5
  const getCurrentStep = studentId =>
    Math.min(getTodaysLogs(studentId, 'negative').length + 1, 5);

  // open point modal
  const handlePoint = (student, direction) => {
    setSelectedStudent(student);
    setSelectedDirection(direction);
  };

  // send email alert on specific negative steps
  const sendStepAlert = (student, step) => {
    const labels = { 3: 'Office', 4: 'Call Home', 5: 'Suspend' };
    emailjs.send(
      'service_foefqgl',
      'template_fgo2hkf',
      {
        to_email: ADMIN_EMAIL,
        student_name: student.name,
        teacher_name: teacherName,
        step_number: step,
        step_label: labels[step] || `Step ${step}`
      },
      'Ptwpl0H9suyvtHokY'
    );
  };

  // commit a new behavior log
  const handleSubmitPoint = async ({ student, direction, reason, note }) => {
    const log = {
      studentId: student.id,
      studentName: student.name,
      house: student.house,
      teacher: auth.currentUser?.email || 'Unknown',
      direction,
      reason,
      note,
      points: direction === 'positive' ? 1 : -1,
      timestamp: serverTimestamp()
    };
    await addDoc(collection(db, 'behaviorLogs'), log);

    // refresh logs & play sound & maybe send alert
    const snap = await getDocs(collection(db, 'behaviorLogs'));
    setBehaviorLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    const step = getCurrentStep(student.id);
    if (direction === 'negative' && EMAIL_ALERT_STEPS.includes(step)) {
      sendStepAlert(student, step);
    }
    direction === 'positive' ? ding.play() : alertSound.play();

    showNotification(
      `${student.name} received a ${direction === 'positive' ? 'Positive' : 'Negative'} point`,
      direction
    );

    setSelectedStudent(null);
    setSelectedDirection(null);
  };

  // calculate house totals & leader highlighting
  const housePoints = { Storm: 0, Meadow: 0, Flint: 0, Ember: 0 };
  behaviorLogs.forEach(log => {
    if (log.direction === 'positive') {
      housePoints[log.house] = (housePoints[log.house] || 0) + 1;
    }
  });
  const maxPts = Math.max(...Object.values(housePoints));

  // build teacher filter list from the "teacher" field on students
  const teacherList = Array.from(new Set(students.map(s => s.teacher))).sort();
  const filteredStudents =
    selectedTeacher === 'All'
      ? students
      : students.filter(s => s.teacher === selectedTeacher);

  useEffect(() => {
    if (!students.length || !behaviorLogs.length) return;

    const today = new Date().toISOString().slice(0, 10);

    students.forEach(async (student) => {
      // Get logs for this student, sorted by date descending
      const logs = behaviorLogs
        .filter(l => l.studentId === student.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Calculate streak
      let streak = 0;
      let currentDate = new Date(today);
      let streakBroken = false;

      while (!streakBroken) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        const dayLogs = logs.filter(
          l => l.timestamp?.toDate?.().toISOString().slice(0, 10) === dateStr ||
               l.timestamp?.slice?.(0, 10) === dateStr // fallback for string timestamps
        );
        if (dayLogs.length === 0) break;
        if (dayLogs.some(l => l.step > 0)) break; // any negative step breaks streak
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      }

      // Badge logic
      let newBadges = [];
      if (streak >= 30) newBadges.push("30-Day Behavior Anniversary");
      else if (streak >= 20) newBadges.push("Blue Devil Champion");
      else if (streak >= 10) newBadges.push("Self Manager");
      else if (streak >= 5) newBadges.push("Consistency Star");

      // Only update Firestore if values have changed
      if (
        student.streakCount !== streak ||
        student.lastStreakDate !== today ||
        JSON.stringify(student.badges) !== JSON.stringify(newBadges)
      ) {
        await updateDoc(doc(db, "students", student.id), {
          streakCount: streak,
          lastStreakDate: today,
          badges: newBadges,
        });
      }
    });
  }, [students, behaviorLogs]);

  const todayStr = new Date().toISOString().slice(5, 10); // "MM-DD"

  // filter students with birthdays today
  const birthdayStudents = students.filter(s => s.birthday && s.birthday.slice(5, 10) === todayStr);

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
              Sedan Elementary<br/>
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
              <button onClick={() => navigate('/reward-store')}>
                Reward Store
              </button>
              <button onClick={() => {/* logout logic */}}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Controls (moved _outside_ header-bar) ─── */}
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

      {/* ─── The rest of your page: house cards, student grid, etc. ─── */}
      {/* ... */}

      {/* house cards */}
      <div className="house-card-container">
        {['Storm', 'Meadow', 'Flint', 'Ember'].map((h) => (
          <div
            key={h}
            className={`house-card ${
              housePoints[h] === maxPts ? 'leader' : ''
            }`}
          >
            <img
              src={
                { Storm: houseStorm,
                  Meadow: houseMeadow,
                  Flint: houseFlint,
                  Ember: houseEmber }[h]
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

      {/* student grid */}
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
              onClick={() => setHistoryStudent(student)}
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
                    className={`bubble ${
                      dir === 'positive' ? 'green' : 'red'
                    } ${atMaxStep ? 'disabled' : ''}`}
                    onClick={(e) => {
                      if (atMaxStep) return;
                      e.stopPropagation();
                      handlePoint(student, dir);
                      const el = e.currentTarget;
                      el.classList.add('pop');
                      setTimeout(() => el.classList.remove('pop'), 300);
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

      {/* modals */}
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
