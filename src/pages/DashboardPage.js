// src/pages/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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

const EMAIL_ALERT_STEPS = [3, 4, 5];
const ADMIN_EMAIL = 'john.gray@usd286.org';

const ding = new Audio('/ding.mp3');
const alertSound = new Audio('/alert.mp3');

const DashboardPage = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  const [teacherName, setTeacherName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [notification, setNotification] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load students
  useEffect(() => {
    const fetchStudents = async () => {
      const snap = await getDocs(collection(db, 'students'));
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchStudents();
  }, []);

  // Load behavior logs
  useEffect(() => {
    const fetchLogs = async () => {
      const snap = await getDocs(collection(db, 'behaviorLogs'));
      setBehaviorLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchLogs();
  }, []);

  // Determine teacher info and admin status
  useEffect(() => {
    const initUser = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const email = user.email || '';
      const adminStatus = email === ADMIN_EMAIL;
      setIsAdmin(adminStatus);
      const ref = doc(db, 'teachers', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const name = snap.data().name;
        setTeacherName(name);
        if (!adminStatus) setSelectedTeacher(name);
      }
    };
    initUser();
  }, []);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getTodaysLogs = (studentId, direction) => {
    const today = new Date().toISOString().slice(0, 10);
    return behaviorLogs.filter(log =>
      log.studentId === studentId &&
      log.direction === direction &&
      log.timestamp?.toDate?.().toISOString().slice(0, 10) === today
    );
  };

  const getCurrentStep = studentId =>
    Math.min(getTodaysLogs(studentId, 'negative').length + 1, 5);

  const handlePoint = (student, direction) => {
    setSelectedStudent(student);
    setSelectedDirection(direction);
  };

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

  // Calculate house totals
  const housePoints = { Storm: 0, Meadow: 0, Flint: 0, Ember: 0 };
  behaviorLogs.forEach(log => {
    if (log.direction === 'positive') housePoints[log.house] += 1;
  });
  const maxPts = Math.max(...Object.values(housePoints));

  const teacherList = Array.from(new Set(students.map(s => s.teacherName))).sort();
  const filteredStudents = selectedTeacher === 'All'
    ? students
    : students.filter(s => s.teacherName === selectedTeacher);

  return (
    <div className="dashboard-container">
      {notification && <div className={`notification-banner ${notification.type}`}>{notification.message}</div>}

      <div className="page-header">
        <img src={sedanLogo} className="header-icon" alt="Logo" />
        <div className="header-title">
          <h1>Sedan Elementary<br />Behavior Tracker</h1>
          <p className="subtext">Logged in as {teacherName}</p>
          <p className="reset-note">* Steps reset daily at midnight</p>
        </div>
        <div className="dropdown">
          <button className="dropbtn" onClick={() => setMenuOpen(m => !m)}><Menu size={20} /></button>
          <div className={`dropdown-content ${menuOpen ? 'show' : ''}`}>
            <button onClick={() => navigate('/summary')}><List size={16} /> Summary</button>
            <button onClick={() => navigate('/graphs')}><BarChart2 size={16} /> Graphs</button>
            <button onClick={() => navigate('/podium')}><Award size={16} /> Podium</button>
            <button onClick={() => navigate('/hall-of-fame')}><Trophy size={16} /> Hall of Fame</button>
            <button onClick={() => { signOut(auth); navigate('/login'); }}><LogOut size={16} /> Logout</button>
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={() => navigate('/steps')}>View Behavior Steps</button>
        <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
          <option value="All">All Teachers</option>
          {teacherList.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="house-card-container">
        {['Storm','Meadow','Flint','Ember'].map(h => (
          <div key={h} className={`house-card ${housePoints[h]===maxPts?'leader':''}`}>
            <img src={{Storm:houseStorm,Meadow:houseMeadow,Flint:houseFlint,Ember:houseEmber}[h]} alt={h} className="shield-img" />
            <p>{h}: {housePoints[h]} pts</p>
          </div>
        ))}
      </div>

      <div className="student-grid">
        {filteredStudents.map(student => {
          const step = getCurrentStep(student.id);
          const locked = step >= 5;
          return (
            <div key={student.id} className="student-card" onClick={() => setHistoryStudent(student)}>
              <div className="step-indicator">Step {step}</div>
              <div className="avatar">{student.name?.[0] || '?'}</div>
              <div className="name">{student.name}</div>
              <div className="bubble-counters">
                {['positive','negative'].map(dir => (
                  <div
                    key={dir}
                    className={`bubble ${dir==='positive'?'green':'red'} ${locked?'disabled':''}`}
                    onClick={e => {
                      if (locked) return;
                      e.stopPropagation();
                      handlePoint(student, dir);
                      const el = e.currentTarget;
                      if (el && el.classList) {
                        el.classList.add('pop');
                        setTimeout(() => el.classList.remove('pop'), 300);
                      }
                    }}
                  >
                    {getTodaysLogs(student.id, dir).length}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

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
          logs={behaviorLogs.filter(l => l.studentId === historyStudent.id)}
          onClose={() => setHistoryStudent(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
