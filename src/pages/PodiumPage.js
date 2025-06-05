// src/pages/PodiumPage.js - Hall of Fame-style Confetti via react-confetti
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { db } from '../firebase.js';
import './PodiumPage.css';

const getDateObj = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  return null;
};

const PodiumPage = () => {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [visibleRanks, setVisibleRanks] = useState([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);
  const victoryAudioRef = useRef(null);

  // Fetch students and logs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const studentSnap = await getDocs(collection(db, 'students'));
      setStudents(studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const logSnap = await getDocs(collection(db, 'behaviorLogs'));
      setLogs(logSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Animate podium spots & trigger confetti/audio
  useEffect(() => {
    if (!loading && victoryAudioRef.current) {
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
  }, [students, logs, loading]);

  // Compute top students for a given range
  const getTopStudents = (range) => {
    const now = new Date();
    const start = new Date(now);
    if (range === 'week') start.setDate(now.getDate() - 7);
    if (range === 'quarter') start.setMonth(now.getMonth() - 3);
    return students
      .map(stu => ({
        ...stu,
        count: logs.filter(log => {
          const logDate = getDateObj(log.timestamp);
          return (
            log.studentId === stu.id &&
            log.direction === 'positive' &&
            logDate &&
            logDate >= start
          );
        }).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  // Today's top
  const todayKey = new Date().toISOString().slice(0, 10);
  const topToday = useMemo(() =>
    students
      .map(stu => ({
        ...stu,
        count: logs.filter(log => {
          const logDate = getDateObj(log.timestamp);
          return (
            log.studentId === stu.id &&
            log.direction === 'positive' &&
            logDate &&
            logDate.toISOString().slice(0, 10) === todayKey
          );
        }).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  , [students, logs, todayKey, getTopStudents]);

  const topWeek = useMemo(() => getTopStudents('week'), [students, logs, getTopStudents]);
  const topQuarter = useMemo(() => getTopStudents('quarter'), [students, logs, getTopStudents]);

  // Replay celebration
  const replayCelebration = () => {
    setShowConfetti(false);
    if (victoryAudioRef.current) {
      victoryAudioRef.current.currentTime = 0;
      victoryAudioRef.current.play().catch(() => {});
    }
    setTimeout(() => setShowConfetti(true), 300);
  };

  // Render a podium section
  const renderPodium = (title, list) => (
    <section className="podium-section" key={title} aria-labelledby={title.replace(/\s/g, '-')}>
      <h2 className="section-title" id={title.replace(/\s/g, '-')}>{title}</h2>
      <div className="podium-container">
        <div className="podium">
          {list.length === 0 ? (
            <div className="no-data" aria-live="polite">No students found for this period.</div>
          ) : list.map((s, i) => (
            <div
              key={s.id}
              className={`podium-spot spot-${i + 1} ${visibleRanks.includes(i) ? 'animate' : ''}`}
              style={{ visibility: visibleRanks.includes(i) ? 'visible' : 'hidden' }}
              tabIndex={0}
              aria-label={`${s.name || 'Unknown'}, ${s.count} points, rank ${i + 1}`}
              onKeyDown={e => { if (e.key === 'Enter') alert(`${s.name || 'Unknown'}: ${s.count} points`); }}
            >
              <div className="podium-rank">{['🥇', '🥈', '🥉'][i]}</div>
              <div className="avatar">{s.name?.[0] || '?'}</div>
              <div className="name">{s.name || 'Unknown'}</div>
              <div className="score">{s.count} pts</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="dashboard-container podium-page">
      {/* Visually hidden heading for screen readers */}
      <h1 className="visually-hidden">Podium Leaders</h1>

      {/* Victory audio */}
      <audio ref={victoryAudioRef} src="/victory.mp3" preload="auto" />

      {/* Back button */}
      <button className="back-button" aria-label="Back to Dashboard" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      {/* Replay celebration */}
      <button style={{margin:'1rem 0'}} onClick={replayCelebration}>Replay Celebration</button>

      {/* Confetti */}
      {showConfetti && (
        <>
          <Confetti width={width} height={height} recycle={false} />
          <span style={{position:'absolute',left:'-9999px'}} aria-live="polite">Congratulations! 🎉</span>
        </>
      )}

      {/* Page Title */}
      <h1 className="page-title">Podium Leaders</h1>

      {/* Loading state */}
      {loading ? (
        <div className="no-data" aria-live="polite">Loading...</div>
      ) : (
        <>
          {renderPodium("Today's Top 3", topToday)}
          {renderPodium('Top 3 This Week', topWeek)}
          {renderPodium('Top 3 This Quarter', topQuarter)}
        </>
      )}
    </div>
  );
};

export default PodiumPage;
