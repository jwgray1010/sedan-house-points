// src/pages/PodiumPage.js - Hall of Fame-style Confetti via react-confetti
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { db } from '../firebase';
import './PodiumPage.css';

const PodiumPage = () => {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [visibleRanks, setVisibleRanks] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const victoryAudioRef = useRef(null);

  // Fetch students and logs
  useEffect(() => {
    const fetchData = async () => {
      const studentSnap = await getDocs(collection(db, 'students'));
      setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const logSnap = await getDocs(collection(db, 'behaviorLogs'));
      setLogs(logSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  // Animate podium spots & trigger confetti/audio
  useEffect(() => {
    // play victory audio immediately
    if (victoryAudioRef.current) {
      victoryAudioRef.current.play().catch(() => {});
    }
    setShowConfetti(false);
    setVisibleRanks([]);
    const delays = [0, 1500, 3000];
    [2, 1, 0].forEach((rank, i) => {
      setTimeout(() => setVisibleRanks(prev => [...prev, rank]), delays[i]);
    });
    const confettiTimer = setTimeout(() => setShowConfetti(true), 100);
    const clearTimer = setTimeout(() => setShowConfetti(false), 5000);
    return () => {
      clearTimeout(confettiTimer);
      clearTimeout(clearTimer);
    };
  }, [students, logs]);

  // Compute top students for a given range
  const getTopStudents = range => {
    const now = new Date();
    const start = new Date(now);
    if (range === 'week') start.setDate(now.getDate() - 7);
    if (range === 'quarter') start.setMonth(now.getMonth() - 3);
    return students
      .map(stu => ({
        ...stu,
        count: logs.filter(log =>
          log.studentId === stu.id && log.direction === 'positive' && log.timestamp?.toDate?.() >= start
        ).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  // Today's top
  const todayKey = new Date().toISOString().slice(0, 10);
  const topToday = students
    .map(stu => ({
      ...stu,
      count: logs.filter(log =>
        log.studentId === stu.id &&
        log.direction === 'positive' &&
        log.timestamp?.toDate?.().toISOString().slice(0, 10) === todayKey
      ).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topWeek = getTopStudents('week');
  const topQuarter = getTopStudents('quarter');

  // Render a podium section
  const renderPodium = (title, list) => (
    <div className="podium-section" key={title}>
      <h2 className="section-title">{title}</h2>
      <div className="podium-container">
        <div className="podium">
          {list.map((s, i) => (
            <div
              key={s.id}
              className={`podium-spot spot-${i + 1} ${visibleRanks.includes(i) ? 'animate' : ''}`}
              style={{ visibility: visibleRanks.includes(i) ? 'visible' : 'hidden' }}
            >
              <div className="podium-rank">{['🥇', '🥈', '🥉'][i]}</div>
              <div className="avatar">{s.name?.[0] || '?'}</div>
              <div className="name">{s.name}</div>
              <div className="score">{s.count} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container podium-page">
      {/* Victory audio */}
      <audio ref={victoryAudioRef} src="/victory.mp3" preload="auto" />

      {/* Back button */}
      <button className="back-button" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      {/* Confetti */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}

      {/* Page Title */}
      <h1 className="page-title">Podium Leaders</h1>

      {/* Podium Sections */}
      {renderPodium("Today's Top 3", topToday)}
      {renderPodium('Top 3 This Week', topWeek)}
      {renderPodium('Top 3 This Quarter', topQuarter)}
    </div>
  );
};

export default PodiumPage;
