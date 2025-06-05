import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import './PodiumPage.css';
import Confetti from 'react-confetti';
import { useNavigate } from 'react-router-dom';
import { podium } from '../assets/assets.js';

const getTopThree = (students, key) =>
  [...students]
    .sort((a, b) => (b[key] || 0) - (a[key] || 0))
    .slice(0, 3);

const PodiumVisual = ({ students }) => {
  // Ensure always 3 slots
  const podiums = [null, null, null];
  students.forEach((s, i) => { podiums[i] = s; });

  // Podium heights (center is tallest)
  const heights = [110, 150, 90]; // [2nd, 1st, 3rd]

  // Podium positions: left (2nd), center (1st), right (3rd)
  const positions = [
    { left: '23%', bottom: `${heights[0] + 60}px`, zIndex: 1, transform: 'translateX(-50%)' }, // 2nd
    { left: '50%', bottom: `${heights[1] + 60}px`, zIndex: 2, transform: 'translateX(-50%)' }, // 1st
    { left: '77%', bottom: `${heights[2] + 60}px`, zIndex: 1, transform: 'translateX(-50%)' }, // 3rd
  ];

  return (
    <div className="podium-visual-single">
      {/* Podium avatars */}
      {[1, 0, 2].map((place, idx) => {
        const student = podiums[place];
        const initials = student?.name
          ? student.name.split(' ').map(n => n[0]).join('').toUpperCase()
          : '-';
        return (
          <div
            key={place}
            className={`podium-avatar-bounce-single place-${place + 1}`}
            style={positions[idx]}
            aria-label={student?.name || 'Empty'}
          >
            <div className="podium-avatar">{initials}</div>
            <div className="podium-student">
              {student?.name ? student.name : null}
            </div>
          </div>
        );
      })}
      {/* Single podium image */}
      <img src={podium} alt="Podium" className="podium-img-single" />
    </div>
  );
};

const PodiumSection = ({ title, students, pointsKey, triggerCelebrate }) => {
  const prevTop = useRef('');
  useEffect(() => {
    const ids = students.map(s => s.id).join(',');
    if (ids && prevTop.current !== ids) {
      triggerCelebrate();
      prevTop.current = ids;
    }
    // eslint-disable-next-line
  }, [students]);
  return (
    <section className="podium-section">
      <h3>{title}</h3>
      <PodiumVisual students={students} pointsKey={pointsKey} />
    </section>
  );
};

const PodiumPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'students'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // Group students by className
  const classes = {};
  students.forEach(student => {
    if (!classes[student.className]) classes[student.className] = [];
    classes[student.className].push(student);
  });

  // Confetti and sound
  const celebrate = () => {
    setShowConfetti(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <div className="podium-page">
      <button
        className="back-dashboard-btn"
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </button>
      <h1>🏆 Podium</h1>
      <audio ref={audioRef} src="/victory.mp3" preload="auto" />
      {showConfetti && <Confetti />}
      {loading ? (
        <p>Loading...</p>
      ) : (
        Object.entries(classes).map(([className, classStudents]) => (
          <div key={className} className="class-podium">
            <h2>{className}</h2>
            <PodiumSection
              title="Top 3 Today"
              students={getTopThree(classStudents, 'dayPoints')}
              pointsKey="dayPoints"
              triggerCelebrate={celebrate}
            />
            <PodiumSection
              title="Top 3 This Week"
              students={getTopThree(classStudents, 'weekPoints')}
              pointsKey="weekPoints"
              triggerCelebrate={celebrate}
            />
            <PodiumSection
              title="Top 3 This Quarter"
              students={getTopThree(classStudents, 'quarterPoints')}
              pointsKey="quarterPoints"
              triggerCelebrate={celebrate}
            />
            <PodiumSection
              title="Top 3 This Year"
              students={getTopThree(classStudents, 'yearPoints')}
              pointsKey="yearPoints"
              triggerCelebrate={celebrate}
            />
          </div>
        ))
      )}
    </div>
  );
};

export default PodiumPage;