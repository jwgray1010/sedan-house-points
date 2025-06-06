// src/pages/HallOfFamePage.js - Unified Background, Audio, Confetti & Black Headings
import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { db } from '../firebase.js';
import html2pdf from 'html2pdf.js';
import './HallOfFamePage.css';
import { column } from '../assets/assets.js';
import { useNavigate } from 'react-router-dom';

function HallOfFamePage({ winners = [] }) {
  const { width, height } = useWindowSize();
  const [filter, setFilter] = useState('all');
  const [yesterdayTopId, setYesterdayTopId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [search, setSearch] = useState('');
  const [houseFilter, setHouseFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const victoryAudioRef = useRef(null);
  const navigate = useNavigate();

  // Play victory audio on mount
  useEffect(() => {
    if (victoryAudioRef.current) {
      victoryAudioRef.current.play().catch(() => { });
    }
  }, []);

  // Fetch winners and trigger confetti
  useEffect(() => {
    const fetchWinners = async () => {
      const snapshot = await getDocs(collection(db, 'hallOfFame'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = data.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

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

  // Filter winners by week, all, date range, search, house
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const displayed = winners.filter(w => {
    const d = new Date(w.timestamp.seconds * 1000);
    const matchesYear = !yearFilter || d.getFullYear() === Number(yearFilter);
    const matchesMonth = !monthFilter || d.getMonth() + 1 === Number(monthFilter);
    const inWeek = filter === 'week' ? d >= weekAgo : true;
    const inRange = (!startDate || d >= new Date(startDate)) &&
      (!endDate || d <= new Date(endDate));
    const matchesSearch = !search ||
      (w.name && w.name.toLowerCase().includes(search.toLowerCase()));
    const matchesHouse = !houseFilter || (w.house && w.house === houseFilter);
    return matchesYear && matchesMonth && inWeek && inRange && matchesSearch && matchesHouse;
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

  // Helper for robust date formatting
  const getDate = (w) => w.timestamp && w.timestamp.seconds
    ? new Date(w.timestamp.seconds * 1000).toLocaleDateString()
    : '';

  // Export classes data as CSV
  const exportClassesCSV = () => {
    const rows = [
      ['Class', 'Points'],
      ...allTimeClasses.map(c => [c.name, c.pts])
    ];
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-time-classes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export all-time students as CSV
  const exportStudentsCSV = () => {
    const rows = [
      ['Student', 'Points'],
      ...allTimeStudents.map(s => [s.name, s.pts])
    ];
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-time-students.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export displayed winners as CSV
  const exportWinnersCSV = () => {
    const rows = [
      ['Name', 'House', 'Teacher', 'Points', 'Rank', 'Date', 'Category'],
      ...displayed.map(w => [
        w.name,
        w.house,
        w.teacher_name,
        w.points,
        w.rank,
        getDate(w),
        w.category
      ])
    ];
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'winners.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Replay celebration
  const replayCelebration = () => {
    setShowConfetti(false);
    if (victoryAudioRef.current) {
      victoryAudioRef.current.currentTime = 0;
      victoryAudioRef.current.play().catch(() => { });
    }
    setTimeout(() => setShowConfetti(true), 300);
  };

  // Download winner certificate as PDF
  const downloadCertificate = (winner) => {
    const certHtml = `
      <div style="width:500px;padding:2rem;text-align:center;border:4px solid #ffd700;border-radius:16px;font-family:sans-serif;">
        <h2 style="color:#d4af37;">🏆 Hall of Fame Certificate 🏆</h2>
        <h3>${winner.name}</h3>
        <p>of House <b>${winner.house || ''}</b></p>
        <p>Rank: <b>${winner.rank}</b> &nbsp; • &nbsp; Points: <b>${winner.points}</b></p>
        <p>Category: <b>${winner.category}</b></p>
        <p>Date: ${getDate(winner)}</p>
        <div style="margin-top:2rem;font-size:1.2em;color:#888;">Congratulations on your achievement!</div>
      </div>
    `;
    html2pdf().from(certHtml).set({
      margin: 0.5,
      filename: `${winner.name}-certificate.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait' }
    }).save();
  };

  // Winner details modal
  const WinnerModal = ({ winner, onClose }) => (
    <div className="winner-modal" role="dialog" aria-modal="true">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose} aria-label="Close details">&times;</button>
        <h2>{winner.name}</h2>
        <p><b>House:</b> {winner.house}</p>
        <p><b>Teacher:</b> {winner.teacher_name}</p>
        <p><b>Points:</b> {winner.points}</p>
        <p><b>Rank:</b> {winner.rank}</p>
        <p><b>Date:</b> {getDate(winner)}</p>
        <p><b>Category:</b> {winner.category}</p>
        <button onClick={() => downloadCertificate(winner)}>Download Certificate</button>
      </div>
    </div>
  );

  // Unique house list for filter
  const houseList = Array.from(new Set(winners.map(w => w.house).filter(Boolean)));
  const years = Array.from(new Set(winners.map(w => new Date(w.timestamp.seconds * 1000).getFullYear())));
  const months = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="dashboard-container hall-page">
      {/* Audio element */}
      <audio ref={victoryAudioRef} src="/victory.mp3" preload="auto" />

      {/* Back button top-left */}
      <button
        className="back-dashboard-btn"
        onClick={() => navigate('/dashboard')}
        type="button"
      >
        Back to Dashboard
      </button>

      {/* Confetti overlay */}
      {showConfetti && (
        <>
          <Confetti width={width} height={height} recycle={false} />
          <span style={{ position: 'absolute', left: '-9999px' }} aria-live="polite">Congratulations! 🎉</span>
        </>
      )}

      {/* Replay celebration */}
      <button onClick={replayCelebration} style={{ margin: '1rem 0' }}>Replay Celebration</button>

      {/* Main Title */}
      <h1 className="page-title">Hall of Fame</h1>

      {/* Filter controls */}
      <div className="filter-toggle" style={{ marginBottom: '1rem' }}>
        <button onClick={() => setFilter('week')} className={filter === 'week' ? 'active' : ''} aria-label="Show this week's winners">This Week</button>
        <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''} aria-label="Show all-time winners">All Time</button>
        <input
          type="date"
          id="hof-start-date"
          name="hof-start-date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          aria-label="Start date"
          style={{ marginLeft: '1rem' }} />

        <input
          type="date"
          id="hof-end-date"
          name="hof-end-date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          aria-label="End date" />

        <input
          type="text"
          id="hof-search"
          name="hof-search"
          placeholder="Search name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search by name"
          style={{ marginLeft: '1rem' }} />
        <select
          value={houseFilter}
          onChange={e => setHouseFilter(e.target.value)}
          aria-label="Filter by house"
        >
          <option value="">All Houses</option>
          {houseList.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} aria-label="Filter by year">
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} aria-label="Filter by month">
          <option value="">All Months</option>
          {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </div>

      {/* Export buttons */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={exportWinnersCSV}>Export Displayed Winners CSV</button>
        <button onClick={exportClassesCSV}>Export All-Time Classes CSV</button>
        <button onClick={exportStudentsCSV}>Export All-Time Students CSV</button>
      </div>

      {/* Winners Grid */}
      <div className="winner-grid">
        {displayed.map(w => (
          <div
            key={w.id}
            className={`winner-card rank-${w.rank} ${w.id === yesterdayTopId ? 'trophy' : ''}`}
            tabIndex={0}
            aria-label={`Details for ${w.name}`}
            onClick={() => setSelectedWinner(w)}
            onKeyDown={e => { if (e.key === 'Enter') setSelectedWinner(w); } }
            style={{ cursor: 'pointer' }}
          >
            {w.id === yesterdayTopId && <div className="trophy-icon">🏆</div>}
            <div className="medal">{['🥇', '🥈', '🥉'][w.rank - 1]}</div>
            <div className="avatar">{w.name?.[0] || '?'}</div>
            <div className="info">
              <div className="name">{w.name}</div>
              <div className="meta">{w.house && <span>🏠 {w.house}</span>} • {w.points} pts • {getDate(w)}</div>
              <div className="category">🏆 {w.category} Podium</div>
            </div>
            <button
              className="download-cert-btn"
              onClick={e => { e.stopPropagation(); downloadCertificate(w); } }
              aria-label={`Download certificate for ${w.name}`}
              style={{ marginTop: '0.5rem' }}
            >
              Download Certificate
            </button>
          </div>
        ))}
      </div>

      {/* Winner Details Modal */}
      {selectedWinner && (
        <WinnerModal winner={selectedWinner} onClose={() => setSelectedWinner(null)} />
      )}

      {/* Leader Section with black headings */}
      <div className="leader-section">
        <h2 style={{ color: '#000', textShadow: 'none' }}>All-Time Class Points</h2>
        <ul className="leader-list">
          {allTimeClasses.map((c) => <li key={c.name}>{c.name} – {c.pts} pts</li>)}
        </ul>

        <h2 style={{ color: '#000', textShadow: 'none' }}>Top 3 Student Points of the Year</h2>
        <ul className="leader-list">
          {allTimeStudents.slice(0, 3).map((s) => <li key={s.name}>{s.name} – {s.pts} pts</li>)}
        </ul>
      </div>

      <div className="hall-container">
        <h1 className="page-title">Hall of Fame</h1>
        <div className="winner-grid">
          {winners.slice(0, 3).map((student, idx) => (
            <WinnerCard key={student.id || idx} student={student} rank={idx + 1} />
          ))}
        </div>
        {/* Optionally, show more winners below */}
        {winners.length > 3 && (
          <div className="leader-section">
            <h2>Other Honorees</h2>
            <ul className="leader-list">
              {winners.slice(3).map((student, idx) => (
                <li key={student.id || idx}>
                  <span className="sparkle">{student.name}</span>
                  {student.grade && <> – {student.grade} Grade</>}
                  {student.category && <> ({student.category})</>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Fireworks effect */}
      <Fireworks active={showConfetti} />

      {/* Hall of Fame Wall */}
      <div className="hof-wall" aria-label="Hall of Fame Wall">
        <h2>Hall of Fame Wall</h2>
        <div className="hof-wall-grid">
          {winners.map(w => (
            <div key={w.id} className="hof-wall-card" tabIndex={0} aria-label={`${w.name}, ${w.category}, ${getDate(w)}`}>
              <span className="avatar">{w.name?.[0]}</span>
              <span className="name">{w.name}</span>
              <span className="meta">{w.category} • {getDate(w)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fun Facts Section */}
      <div className="fun-facts">
        <h2>Fun Facts</h2>
        <ul>
          <li>Most Wins: {allTimeStudents[0]?.name} ({allTimeStudents[0]?.pts} pts)</li>
          <li>Most Points in a Month: {/* calculate and display */}</li>
          <li>Total Winners: {winners.length}</li>
        </ul>
      </div>
    </div>
  );
}

function WinnerCard({ student }) {
  const initials = student?.name
    ? student.name.split(' ').map(n => n[0]).toUpperCase()
    : '?';
  return (
    <div className="winner-card column-style">
      <div className="winner-avatar-bounce">
        <div className="winner-avatar">{initials}</div>
      </div>
      <img src={column} alt="" className="winner-column-img" />
      <div className="winner-info">
        <div className="winner-name">{student?.name}</div>
        <div className="winner-medal">🥇</div>
      </div>
    </div>
  );
}

function Fireworks({ active }) {
  // Placeholder for fireworks effect; currently just renders Confetti
  return <Confetti style={{position:'fixed',pointerEvents:'none',top:0,left:0,width:'100vw',height:'100vh',zIndex:999}} />;
}
export default HallOfFamePage;
