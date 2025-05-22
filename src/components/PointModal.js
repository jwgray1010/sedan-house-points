// src/components/PointModal.js
import React, { useState } from 'react';
import './PointModal.css';

const PointModal = ({ student, direction, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  // Negative behavior reasons
  const negativeReasons = [
    'Disruption',              // Off-task, bothering others, continuous talking
    'Defiance/Disrespect',     // Refusing directions, arguing
    'Aggression',              // Horseplay, fighting, offensive language
    'Property Misuse',         // Throwing/breaking materials
    'Other'                    // Catch-all
  ];

  // Condensed positive reasons
  const positiveReasons = [
    'Collaboration',           // Helping peers, teamwork
    'Effort',                  // Perseverance, excellent work ethic
    'Leadership',              // Guiding others, initiative
    'Kindness & Respect',      // Courtesy, inclusivity
    'Participation',           // Engagement, asking questions
    'Creativity',              // Innovative ideas, problem-solving
    'Other'                    // Catch-all
  ];

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit({ student, direction, reason, note });
    setReason('');
    setNote('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{direction === 'positive' ? 'Add Positive Point' : 'Add Negative Point'}</h2>
        <p><strong>{student.name}</strong> ({student.house})</p>

        <label>Reason</label>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
        >
          <option value="" disabled>Select a reason…</option>
          {(direction === 'positive' ? positiveReasons : negativeReasons).map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <label>Note (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add additional context..."
        />

        <div className="modal-actions">
          <button onClick={handleSubmit} disabled={!reason} className="submit-button">
            {direction === 'positive' ? 'Add Positive' : 'Add Negative'}
          </button>
          <button onClick={onClose} className="cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default PointModal;
