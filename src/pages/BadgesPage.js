// BadgesPage.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './BadgesPage.css';

const celebrateAudio = new Audio('/celebrate.mp3');

const BadgesPage = () => {
  const [students, setStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const studentSnapshot = await getDocs(collection(db, 'students'));
      const studentData = studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentData);

      const logSnapshot = await getDocs(collection(db, 'behaviorLogs'));
      const logData = logSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logData);
    };
    fetchData();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const scores = students.map(student => {
    const studentLogs = logs.filter(l => l.studentId === student.id);
    const todayNeg = studentLogs.filter(l => l.direction === 'negative' && l.timestamp?.toDate?.().toISOString().slice(0, 10) === today).length;
    const todayPos = studentLogs.filter(l => l.direction === 'positive' && l.timestamp?.toDate?.().toISOString().slice(0, 10) === today).length;
    return { ...student, todayNeg, todayPos };
  });

  const perfectDay = scores.find(s => s.todayNeg === 0 && s.todayPos > 0);
  const topEarner = scores.reduce((a, b) => (a.todayPos > b.todayPos ? a : b), {});
  const fireworksTrigger = scores.some(s => s.todayPos >= 5);

  useEffect(() => {
    setBadges([
      { title: 'Perfect Day', medal: '🥇', students: perfectDay ? [perfectDay] : [] },
      { title: 'Top Positive Earner', medal: '🥇', students: topEarner?.id ? [topEarner] : [] }
    ]);
  }, [logs, students]);

  useEffect(() => {
    if (fireworksTrigger) {
      celebrateAudio.play().catch(() => {});
    }
  }, [fireworksTrigger]);

  return (
    <div className="badges-page">
      {fireworksTrigger && (
        <div className="fireworks-overlay">
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                '--confetti-color': ['#ff0', '#0ff', '#f0f', '#f90', '#09f'][i % 5]
              }}
            ></div>
          ))}
        </div>
      )}

      <h1>🏅 Student Medals</h1>
      {badges.map(badge => (
        <div key={badge.title} className="badge-section">
          <h2>{badge.title}</h2>
          <div className="badge-students">
            {badge.students.map(s => (
              <div key={s.id} className="badge-card">
                <div className="medal">{badge.medal}</div>
                <div className="avatar">{s.name?.[0]}</div>
                <div className="name">{s.name}</div>
                {s.badges && s.badges.includes("30-Day Behavior Anniversary") && (
                  <span className="milestone-badge" title="30-Day Behavior Anniversary">🏆</span>
                )}
              </div>
            ))}
            {badge.students.length === 0 && <p>No winner today</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgesPage;

// Add badge to student.badges array if streak is 30 days
students.forEach(student => {
  const streak = calculateStreak(student.id); // Assume this function calculates the streak
  if (streak >= 30 && !student.badges.includes("30-Day Behavior Anniversary")) {
    // Add badge to student.badges array
  }
});