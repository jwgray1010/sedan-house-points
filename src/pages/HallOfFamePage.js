// src/pages/HallOfFamePage.js - Unified Background, Audio, Confetti & Black Headings
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { db } from '../firebase';
import './HallOfFamePage.css';

const HallOfFamePage = () => {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [winners, setWinners] = useState([]);
  const [filter, setFilter] = useState('all');
  const [yesterdayTopId, setYesterdayTopId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const victoryAudioRef = useRef(null);

  // Play victory audio on mount
  useEffect(() => {
    if (victoryAudioRef.current) {
      victoryAudioRef.current.play().catch(() => {});
    }
  }, []);

  // Fetch winners and trigger confetti
  useEffect(() => {
    const fetchWinners = async () => {
      const snapshot = await getDocs(collection(db, 'hallOfFame'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
      setWinners(sorted);

      // Determine yesterday's top rank 1
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yStr = yesterday.toLocaleDateString();
      const yEntries = sorted.filter(w => {
        const d = new Date(w.timestamp.seconds * 1000);
        return d.toLocaleDateString() === yStr && w.rank === 1;
      });
      if (yEntries.length) setYesterdayTopId(yEntries[0].id);
    };
    fetchWinners();

    // Confetti after fetch
    setShowConfetti(false);
    const timer = setTimeout(() => setShowConfetti(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Filter winners by week or all
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const displayed = winners.filter(w => {
    const d = new Date(w.timestamp.seconds * 1000);
    return filter === 'all' || d >= weekAgo;
  });

  // Tally all-time
  const tally = key => {
    const totals = {};
    winners.forEach(w => {
      const k = w[key] || 'Unknown';
      totals[k] = (totals[k] || 0) + w.points;
    });
    return Object.entries(totals)
      .map(([name, pts]) => ({ name, pts }))
      .sort((a, b) => b.pts - a.pts);
  };
  const allTimeClasses = tally('teacher_name');
  const allTimeStudents = tally('name');

  return (
    <div className="dashboard-container hall-page">
      {/* Audio element */}
      <audio ref={victoryAudioRef} src="/victory.mp3" preload="auto" />

      {/* Back button top-left */}
      <button className="back-button" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      {/* Confetti overlay */}
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}

      {/* Main Title */}
      <h1 className="page-title">Hall of Fame</h1>

      {/* Filter controls */}
      <div className="filter-toggle">
        <button onClick={() => setFilter('week')} className={filter === 'week' ? 'active' : ''}>This Week</button>
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All Time</button>
      </div>

      {/* Winners Grid */}
      <div className="winner-grid">
        {displayed.map(w => (
          <div key={w.id} className={`winner-card rank-${w.rank} ${w.id === yesterdayTopId ? 'trophy' : ''}`}>
            {w.id === yesterdayTopId && <div className="trophy-icon">🏆</div>}
            <div className="medal">{['🥇','🥈','🥉'][w.rank-1]}</div>
            <div className="avatar">{w.name?.[0] || '?'}</div>
            <div className="info">
              <div className="name">{w.name}</div>
              <div className="meta">{w.house && <span>🏠 {w.house}</span>} • {w.points} pts • {new Date(w.timestamp.seconds*1000).toLocaleDateString()}</div>
              <div className="category">🏆 {w.category} Podium</div>
            </div>
          </div>
        ))}
      </div>

      {/* Leader Section with black headings */}
      <div className="leader-section">
        <h2 style={{color:'#000', textShadow:'none'}}>All-Time Class Points</h2>
        <ul className="leader-list">
          {allTimeClasses.map((c,i) => <li key={i}>{c.name} – {c.pts} pts</li>)}
        </ul>

        <h2 style={{color:'#000', textShadow:'none'}}>Top 3 Student Points of the Year</h2>
        <ul className="leader-list">
          {allTimeStudents.slice(0,3).map((s,i) => <li key={i}>{s.name} – {s.pts} pts</li>)}
        </ul>
      </div>
    </div>
  );
};

export default HallOfFamePage;
