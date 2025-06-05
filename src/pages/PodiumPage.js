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

const PodiumVisual = ({ students, pointsKey }) => {
  const podiums = [null, null, null];
  students.forEach((s, i) => { podiums[i] = s; });
  const heights = [150, 110, 90];

  return (
    <div className="podium-visual">
      {[1, 0, 2].map((place, idx) => {
        const student = podiums[place];
        const initials = student?.name
          ? student.name.split(' ').map(n => n[0]).join('').toUpperCase()
          : '-';
        return (
          <div
            key={place}
            className={`podium-level ${['second', 'first', 'third'][idx]}`}
            style={{ height: heights[place] + 80 }}
          >
            <div className="podium-avatar-bounce">
              <div className="podium-avatar">{initials}</div>
            </div>
            <img src={podium} alt="" className="podium-img" />
            <div className="podium-info">
              <div className="podium-rank">{place + 1}</div>
              <div className="podium-student">{student?.name || <span className="empty">-</span>}</div>
            </div>
          </div>
        );
      })}
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
      <ol className="podium-list">
        {students.length === 0 ? (
          <li className="podium-empty">No students yet</li>
        ) : (
          students.map((student, idx) => (
            <li key={student.id} className={`podium-place place-${idx + 1}`}>
              <span className="podium-medal">
                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
              </span>
              <span className="podium-name">{student.name}</span>
              <span className="podium-points">{student[pointsKey] || 0} pts</span>
            </li>
          ))
        )}
      </ol>
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
      <div className="page-container">
        <button
          className="back-dashboard-btn"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PodiumPage;