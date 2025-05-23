// src/pages/SummaryPage.js - Updated with Summary Container + Mobile Styles
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import './SummaryPage.css';

const SummaryPage = () => {
  const [logs, setLogs] = useState([]);
  const [studentFilter, setStudentFilter] = useState('All');
  const [teacherFilter, setTeacherFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      const snapshot = await getDocs(collection(db, 'behaviorLogs'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    (studentFilter === 'All' || log.studentName === studentFilter) &&
    (teacherFilter === 'All' || log.teacher === teacherFilter)
  );

  const students = ['All', ...Array.from(new Set(logs.map(l => l.studentName))).sort()];
  const teachers = ['All', ...Array.from(new Set(logs.map(l => l.teacher))).sort()];

  const handleExport = () => {
    const csvData = filteredLogs.map(log => ({
      Student: log.studentName,
      Teacher: log.teacher,
      Direction: log.direction,
      Reason: log.reason,
      Note: log.note,
      House: log.house,
      Date: log.timestamp?.toDate?.().toLocaleDateString() || ''
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'filtered_behavior_logs.csv');
  };

  return (
    <div className="summary-page">
      <div className="summary-container">
        <h2>Behavior Summary</h2>
        <div className="summary-controls">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button onClick={handleExport}>Export CSV</button>
          <select value={studentFilter} onChange={e => setStudentFilter(e.target.value)}>
            {students.map(name => (
              <option key={name} value={name}>
                {name === 'All' ? 'All Students' : name}
              </option>
            ))}
          </select>
          <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)}>
            {teachers.map(name => (
              <option key={name} value={name}>
                {name === 'All' ? 'All Teachers' : name}
              </option>
            ))}
          </select>
        </div>
        <div className="table-container">
          <table className="behavior-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Teacher</th>
                <th>Direction</th>
                <th>Reason</th>
                <th>Note</th>
                <th>House</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.studentName}</td>
                  <td>{log.teacher}</td>
                  <td>{log.direction}</td>
                  <td>{log.reason}</td>
                  <td>{log.note}</td>
                  <td>{log.house}</td>
                  <td>{log.timestamp?.toDate?.().toLocaleDateString() || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;