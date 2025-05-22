// src/pages/GraphsPage.js - Behavior Analytics with White Lettering
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './GraphsPage.css';

const GraphsPage = () => {
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      const snapshot = await getDocs(collection(db, 'behaviorLogs'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    };
    fetchLogs();
  }, []);

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate?.();
    return date ? date.toLocaleDateString() : '';
  };

  const getDateTotals = () => {
    const map = {};
    logs.forEach(log => {
      const date = formatDate(log.timestamp);
      if (!map[date]) map[date] = { date, positive: 0, negative: 0 };
      if (log.direction === 'positive') map[date].positive++;
      if (log.direction === 'negative') map[date].negative++;
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getHouseTotals = () => {
    const totals = { Storm: 0, Meadow: 0, Flint: 0, Ember: 0 };
    logs.forEach(log => {
      if (log.direction === 'positive' && log.house && totals[log.house] !== undefined) {
        totals[log.house]++;
      }
    });
    return Object.entries(totals).map(([house, points]) => ({ house, points }));
  };

  const getStudentTotals = () => {
    const map = {};
    logs.forEach(log => {
      if (!map[log.studentName]) map[log.studentName] = { name: log.studentName, points: 0 };
      if (log.direction === 'positive') map[log.studentName].points++;
    });
    return Object.values(map)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  };

  return (
    <div className="graph-container">
      <h1>Behavior Graphs</h1>
      <button onClick={() => navigate('/dashboard')} className="back-button">
        Back to Dashboard
      </button>

      <h3>Total Points Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={getDateTotals()}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="positive" stroke="#27ae60" name="Positive" />
          <Line type="monotone" dataKey="negative" stroke="#e74c3c" name="Negative" />
        </LineChart>
      </ResponsiveContainer>

      <h3>House Point Totals</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={getHouseTotals()}>
          <XAxis dataKey="house" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="points" fill="#3498db" name="Points" />
        </BarChart>
      </ResponsiveContainer>

      <h3>Top 10 Students (Positive Points)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={getStudentTotals()} layout="vertical">
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Tooltip />
          <Bar dataKey="points" fill="#2ecc71" name="Positive Points" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraphsPage;
