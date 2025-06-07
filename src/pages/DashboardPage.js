// src/pages/DashboardPage.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase.js';
import { useNavigate, } from 'react-router-dom';
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
import {
  sedanLogo,
  houseStorm,
  houseMeadow,
  houseFlint,
  houseEmber,
} from '../assets/assets.js';
import './DashboardPage.css';
import Confetti from 'react-confetti';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import emailjs from 'emailjs-com';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, increment } from 'firebase/firestore';

const ADMIN_EMAIL = 'john.gray@usd286.org';

// List of emails that should see all students
const ALL_ACCESS_EMAILS = [
  'john.gray@usd286.org'
];

const BADGE_MILESTONES = [
  { days: 20, label: "Blue Devil Champion", color: "#e53935" },
  { days: 10, label: "Self Manager", color: "#1e88e5" },
  { days: 5, label: "Consistency Star", color: "#ffd600" },
];

const ding = new Audio('/ding.mp3');
const alertSound = new Audio('/alert.mp3');
 
function DashboardPage() {
  const navigate = useNavigate();

  // State for students and teachers
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherName, setTeacherName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('All'); // Default to 'All'
  const [notification, setNotification] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [houseData, setHouseData] = useState({});

  // 1. Move fetchData OUTSIDE of useEffect so it's accessible
  const fetchData = async () => {
    // Fetch students
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch teachers
    const teachersSnapshot = await getDocs(collection(db, 'teachers'));
    setTeachers(teachersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch logs
    const logsSnapshot = await getDocs(collection(db, 'behaviorLogs'));
    setLogs(logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch houses
    const housesSnapshot = await getDocs(collection(db, 'houses'));
    const houseObj = {};
    housesSnapshot.forEach(doc => {
      houseObj[doc.id] = doc.data().points || 0;
    });
    setHouseData(houseObj);

    // Set teacherName from auth
    if (auth.currentUser) {
      setTeacherName(auth.currentUser.displayName || auth.currentUser.email);
    }
  };

  // 2. Use fetchData in useEffect
  useEffect(() => {
    fetchData();
  }, []);

  // After teacherName is set, update selectedTeacher if not already set
  useEffect(() => {
    if (teacherName && teacherName !== selectedTeacher) {
      setSelectedTeacher(teacherName);
    }
  }, [teacherName, selectedTeacher]);

  // Example teacher list from backend data
  const teacherList = teachers.map(t => t.name);

  // Example house points (replace with your real logic)
  const housePoints = {
    Storm: students.filter(s => s.house === 'Storm').reduce((sum, s) => sum + (s.step || 1), 0),
    Meadow: students.filter(s => s.house === 'Meadow').reduce((sum, s) => sum + (s.step || 1), 0),
    Flint: students.filter(s => s.house === 'Flint').reduce((sum, s) => sum + (s.step || 1), 0),
    Ember: students.filter(s => s.house === 'Ember').reduce((sum, s) => sum + (s.step || 1), 0),
  };
  const maxPts = Math.max(...Object.values(housePoints));

  // When filtering students:
  const isAdmin = ALL_ACCESS_EMAILS.includes(
    (auth.currentUser?.email || teacherName || '').toLowerCase()
  );

  // Example filtered students (replace with your real filter logic)
  const filteredStudents = isAdmin || selectedTeacher === 'All'
    ? students
    : students.filter(s => s.teacher === selectedTeacher);

  // Example current step function (replace with your real logic)
  const getCurrentStep = () => 1;

  // Today's date string (MM-DD)
  const todayStr = new Date().toISOString().slice(5, 10);

  // Example handlePoint function (replace with your real logic)
  const
    handlePoint = (student, dir) => {
      // ...your logic to update the student's step...
      const newStep = getCurrentStep(student.id) + (dir === 'positive' ? 1 : -1); // Example logic


      // If the new step is 3, 4, or 5, notify the principal
      if ([3, 4, 5].includes(newStep)) {
        sendPrincipalAlert(student, newStep);
      }

      // ...rest of your logic...
    };

  // Example getTodaysLogs function (replace with your real logic)
  const getTodaysLogs = (studentId, direction) => {
    const today = new Date().toISOString().slice(0, 10);
    return logs.filter(
      log =>
        log.studentId === studentId &&
        log.direction === direction &&
        (
          log.timestamp?.toDate?.()
            ? log.timestamp.toDate().toISOString().slice(0, 10)
            : typeof log.timestamp === 'string'
              ? log.timestamp.slice(0, 10)
              : ''
        ) === today
    );
  };

  const handleSubmitPoint = async ({ student, direction, reason, note }) => {
    // 1. Add behavior log
    await addDoc(collection(db, 'behaviorLogs'), {
      studentId: student.id,
      direction,
      reason,
      note,
      timestamp: new Date(),
      teacher: teacherName,
    });

    // 2. If negative, increment step
    if (direction === 'negative') {
      const studentRef = doc(db, 'students', student.id);
      // Get the latest student data to avoid race conditions
      const studentSnap = await getDoc(studentRef);
      let currentStep = studentSnap.exists() ? (studentSnap.data().step || 1) : 1;
      let newStep = Math.min(currentStep + 1, 5); // Max step is 5

      await updateDoc(studentRef, { step: newStep });

      // 3. Notify principal if step is 3, 4, or 5
      if ([3, 4, 5].includes(newStep)) {
        sendPrincipalAlert(student, newStep);
      }
    }

    // 4. If positive, you may want to decrease step (optional)
    // Uncomment below if you want positive points to move students down a step
    if (direction === 'positive') {
      // Move student down a step (optional, as before)
      const studentRef = doc(db, 'students', student.id);
      const studentSnap = await getDoc(studentRef);
      let currentStep = studentSnap.exists() ? (studentSnap.data().step || 1) : 1;
      let newStep = Math.max(currentStep - 1, 1); // Min step is 1
      await updateDoc(studentRef, { step: newStep });

      // Add a point to the house
      if (student.house) {
        const houseRef = doc(db, 'houses', student.house);
        await updateDoc(houseRef, { points: increment(1) });
      }
    }

    // 5. Refresh data so UI updates
    await fetchData();

    // 6. Show notification
    setNotification({
      type: direction === 'positive' ? 'success' : 'warning',
      message: `${student.name} received a ${direction === 'positive' ? 'positive' : 'negative'} point!`
    });

    // 7. Close modal
    setSelectedStudent(null);
    setSelectedDirection(null);
  };

  // Example birthday students (replace with your real logic)
  const birthdayStudents = [];

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

  const sendPrincipalAlert = (student, step) => {
    emailjs.send(
      'service_foefqgl', // Service ID
      'template_fgo2hkf', // Template ID
      {
        to_email: ADMIN_EMAIL, // Principal's email
        student_name: student.name,
        step: step,
        teacher: teacherName,
      },
      'Ptwpl0H9suyvtHokY' // Public Key
    )
      .then(() => {
        playDing();
        setNotification({ type: 'success', message: `Principal notified for ${student.name} (Step ${step})` });
      })
      .catch(() => {
        playDing();
        setNotification({ type: 'error', message: 'Failed to notify principal.' });
      });
  };

  const playDing = () => {
    try {
      ding.currentTime = 0;
      ding.play();
    } catch (e) {
      // Ignore play errors (e.g., user hasn't interacted yet)
    }
  };

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login'); // or navigate('/') if your login page is at /
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
          <img src={sedanLogo} alt="Sedan Logo" className="sedan-logo" />
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
              <button onClick={() => navigate('/teacher-rewards')}>
                <BarChart2 size={16} /> Rewards
              </button>
              <button onClick={() => navigate('/podium')}>
                <Award size={12} /> Podium
              </button>
              <button onClick={() => navigate('/hall-of-fame')}>
                <Trophy size={12} /> Hall of Fame
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
              <button onClick={() => navigate('/manage-rewards')}>
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
          <div key={h} className={`house-card ${houseData[h] === maxPts ? 'leader' : ''}`}>
            <img src={{ Storm: houseStorm, Meadow: houseMeadow, Flint: houseFlint, Ember: houseEmber }[h]} alt={h} className="shield-img" />
            <p>
              {h}: <span className="house-points-number">{houseData[h] || 0}</span> pts
            </p>
          </div>
        ))}
      </div>

      {/* ─── Student Grid ─── */}
      <div className="student-grid">
        {filteredStudents.map((student) => {
          const step = student.step || 1; // <-- Use the actual step from Firestore
          const atMaxStep = step >= 5 && !isAdmin; // Admins are never blocked
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
              onKeyDown={e => { if (e.key === 'Enter') setHistoryStudent(student); } }
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
              {student.house && (
                <img
                  src={{
                    Storm: houseStorm,
                    Meadow: houseMeadow,
                    Flint: houseFlint,
                    Ember: houseEmber
                  }[student.house]}
                  alt={student.house}
                  className="student-house-shield"
                  style={{ width: 32, height: 32, marginBottom: 4 }} />
              )}
              <div className="bubble-counters">
                {['positive', 'negative'].map((dir) => (
                  <div
                    key={dir}
                    className={`bubble ${dir === 'positive' ? 'green' : 'red'} ${(step >= 5 && !isAdmin) ? 'disabled' : ''}`}
                    tabIndex={0}
                    aria-label={`Add ${dir} point for ${student.name}`}
                    onClick={(e) => {
                      if (atMaxStep) return;
                      e.stopPropagation();
                      setSelectedStudent(student);
                      setSelectedDirection(dir); // <-- Set direction ('positive' or 'negative')
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !atMaxStep) {
                        if (dir === 'positive') playDing();
                        if (dir === 'negative') {
                          try {
                            alertSound.currentTime = 0;
                            alertSound.play();
                          } catch (e) {
                            // Ignore play errors
                          }
                        }
                        handlePoint(student, dir);
                      }
                    } }
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
          onSubmit={handleSubmitPoint} />
      )}
      {historyStudent && (
        <BehaviorHistoryModal
          student={historyStudent}
          onClose={() => setHistoryStudent(null)} />
      )}

      {/* Birthday alert for teacher's students */}
      {birthdayStudents.length > 0 && (
        <div className="teacher-birthday-alert">
          🎂 Today is {birthdayStudents.map(s => s.name).join(', ')}'s birthday!
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
