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

  return (
    <div className="dashboard-container">
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.message}
        </div>
      )}
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
    <div className="dropdown">
      {/* your menu button & dropdown content */}
    </div>
  </div>

  {/* ← Paste your controls here, inside header-bar */}
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
</div>
      {/* controls */}
      <div className="controls">
        <button onClick={() => navigate('/steps')}>
          View Behavior Steps
        </button>
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          <option value="All">All Teachers</option>
          {teacherList.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

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
          return (
            <div
              key={student.id}
              className="student-card"
              onClick={() => setHistoryStudent(student)}
            >
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
    </div>
  );
};

export default DashboardPage;
