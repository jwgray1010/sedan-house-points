// src/pages/GraphsPage.js - Behavior Analytics with White Lettering
import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
import html2pdf from 'html2pdf.js';
import './GraphsPage.css';

const GraphsPage = () => {
  const [logs, setLogs] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch logs, optionally filtered by date range
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      let q = collection(db, 'behaviorLogs');
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        q = query(
          collection(db, 'behaviorLogs'),
          where('timestamp', '>=', start),
          where('timestamp', '<=', end)
        );
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [startDate, endDate]);

  // Robust date formatting
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    return '';
  };

  // Derived analytics
  const dateTotals = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      const date = formatDate(log.timestamp);
      if (!map[date]) map[date] = { date, positive: 0, negative: 0 };
      if (log.direction === 'positive') map[date].positive++;
      if (log.direction === 'negative') map[date].negative++;
    });
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [logs]);

  const houseTotals = useMemo(() => {
    const totals = { Storm: 0, Meadow: 0, Flint: 0, Ember: 0 };
    logs.forEach(log => {
      if (log.direction === 'positive' && log.house && totals[log.house] !== undefined) {
        totals[log.house]++;
      }
    });
    return Object.entries(totals).map(([house, points]) => ({ house, points }));
  }, [logs]);

  const studentTotals = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      if (!map[log.studentName]) map[log.studentName] = { name: log.studentName, points: 0 };
      if (log.direction === 'positive') map[log.studentName].points++;
    });
    return Object.values(map)
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
  }, [logs]);

  // Export helpers
  const exportCSV = (rows, filename) => {
    const csvContent = rows.map(e => e.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDateTotalsCSV = () => {
    const rows = [
      ['Date', 'Positive', 'Negative'],
      ...dateTotals.map(row => [row.date, row.positive, row.negative])
    ];
    exportCSV(rows, 'date-totals.csv');
  };

  const exportHouseTotalsCSV = () => {
    const rows = [
      ['House', 'Points'],
      ...houseTotals.map(row => [row.house, row.points])
    ];
    exportCSV(rows, 'house-totals.csv');
  };

  const exportStudentTotalsCSV = () => {
    const rows = [
      ['Student', 'Points'],
      ...studentTotals.map(row => [row.name, row.points])
    ];
    exportCSV(rows, 'student-totals.csv');
  };

  // Export all graphs as PDF
  const exportPDF = () => {
    const element = document.getElementById('graphs-export');
    html2pdf()
      .set({
        margin: 0.5,
        filename: 'behavior-analytics.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' }
      })
      .from(element)
      .save();
  };

  return (
    <div className="graph-container">
      <h1>Behavior Graphs</h1>
      <button
        onClick={() => navigate('/dashboard')}
        className="back-button"
        aria-label="Back to Dashboard"
        style={{ marginBottom: '1rem' }}
      >
        Back to Dashboard
      </button>

      {/* Date Range Picker */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label>
          Start Date:{' '}
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            aria-label="Start date"
          />
        </label>
        <label>
          End Date:{' '}
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            aria-label="End date"
          />
        </label>
        <button onClick={() => { setStartDate(''); setEndDate(''); }} aria-label="Clear date filter">
          Clear Filter
        </button>
      </div>

      {/* Export Buttons */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={exportDateTotalsCSV} aria-label="Export daily totals as CSV">
          Export Daily Totals CSV
        </button>
        <button onClick={exportHouseTotalsCSV} aria-label="Export house totals as CSV">
          Export House Totals CSV
        </button>
        <button onClick={exportStudentTotalsCSV} aria-label="Export student totals as CSV">
          Export Top Students CSV
        </button>
        <button onClick={exportPDF} aria-label="Export all graphs as PDF">
          Export All Graphs as PDF
        </button>
      </div>

      <div id="graphs-export">
        <h3>Total Points Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dateTotals.length ? dateTotals : [{ date: '', positive: 0, negative: 0 }]}>
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
          <BarChart data={houseTotals.length ? houseTotals : [{ house: '', points: 0 }]}>
            <XAxis dataKey="house" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="points" fill="#3498db" name="Points" />
          </BarChart>
        </ResponsiveContainer>

        <h3>Top 10 Students (Positive Points)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={studentTotals.length ? studentTotals : [{ name: '', points: 0 }]} layout="vertical">
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Bar dataKey="points" fill="#2ecc71" name="Positive Points" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {loading && <div className="loading-indicator" aria-live="polite">Loading data...</div>}
    </div>
  );
};

export default GraphsPage;
