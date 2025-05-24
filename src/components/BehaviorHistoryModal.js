import React from 'react';
import './BehaviorHistoryModal.css';

const BehaviorHistoryModal = ({ student, logs, onClose }) => {
  return (
    <div className="history-modal-backdrop">
      <div className="history-modal">
        <h2>{student.name}'s Behavior History</h2>
        <button className="close-btn" onClick={onClose}>✖</button>
        {logs.length === 0 ? (
          <p>No logs found.</p>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Direction</th>
                  <th>Reason</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.timestamp?.toDate?.().toLocaleDateString()}</td>
                    <td>{log.direction === 'positive' ? '✅' : '❌'}</td>
                    <td>{log.reason}</td>
                    <td>{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BehaviorHistoryModal;
