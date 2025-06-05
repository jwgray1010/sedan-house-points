import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import './BehaviorLogPage.css';

const BehaviorLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const logsPerPage = 20;
  const navigate = useNavigate();

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, 'behaviorLogs'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchLogs();
  }, []);

  // Filtering
  const filteredLogs = logs.filter(log =>
    (!search || (log.studentName && log.studentName.toLowerCase().includes(search.toLowerCase())))
    && (!directionFilter || log.direction === directionFilter)
  );

  // Sorting
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'timestamp') {
      aVal = aVal?.toDate ? aVal.toDate() : new Date(aVal);
      bVal = bVal?.toDate ? bVal.toDate() : new Date(bVal);
    }
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
  const pagedLogs = sortedLogs.slice((page - 1) * logsPerPage, page * logsPerPage);

  // Export to CSV
  const exportCSV = () => {
    const header = ['Student', 'Direction', 'Reason', 'Note', 'Date'];
    const rows = sortedLogs.map(log => [
      log.studentName,
      log.direction,
      log.reason,
      log.note,
      log.timestamp?.toDate
        ? log.timestamp.toDate().toLocaleString()
        : log.timestamp
          ? new Date(log.timestamp).toLocaleString()
          : ''
    ]);
    const csvContent = [header, ...rows].map(e => e.map(x => `"${x || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'behavior_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table header click for sorting
  const handleSort = (field) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="behavior-log-page">
      <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
      <h1>Behavior Log</h1>

      {/* Filtering and Search */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by student name"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={directionFilter} onChange={e => setDirectionFilter(e.target.value)}>
          <option value="">All Directions</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      {/* Table */}
      <table>
        <caption>Behavior Log Entries</caption>
        <thead>
          <tr>
            <th onClick={() => handleSort('studentName')}>Student</th>
            <th onClick={() => handleSort('direction')}>Direction</th>
            <th onClick={() => handleSort('reason')}>Reason</th>
            <th onClick={() => handleSort('note')}>Note</th>
            <th onClick={() => handleSort('timestamp')}>Date</th>
          </tr>
        </thead>
        <tbody>
          {pagedLogs.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center' }}>No logs found.</td>
            </tr>
          ) : (
            pagedLogs.map(log => (
              <tr
                key={log.id}
                style={{
                  background: log.direction === 'positive' ? '#e0ffe0' : '#ffe0e0'
                }}
              >
                <td>
                  {/* Student profile link example */}
                  <a href={`/student/${log.studentId}`} style={{ color: '#2a5ad7' }}>
                    {log.studentName}
                  </a>
                </td>
                <td>
                  <span style={{
                    color: log.direction === 'positive' ? 'green' : 'red',
                    fontWeight: 'bold'
                  }}>
                    {log.direction}
                  </span>
                </td>
                <td>{log.reason}</td>
                <td>{log.note}</td>
                <td>
                  {log.timestamp?.toDate
                    ? log.timestamp.toDate().toLocaleString()
                    : log.timestamp
                      ? new Date(log.timestamp).toLocaleString()
                      : ''}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default BehaviorLogPage;