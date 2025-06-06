// src/components/PointModal.js
import React, { useState, useRef, useEffect } from 'react';
import './PointModal.css';

const PointModal = ({ student, direction, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const reasonSelectRef = useRef(null);

  // Negative behavior reasons
  const negativeReasons = [
    'Disruption',
    'Defiance/Disrespect',
    'Aggression',
    'Property Misuse',
    'Other'
  ];

  // Positive behavior reasons
  const positiveReasons = [
    'Collaboration',
    'Effort',
    'Leadership',
    'Kindness & Respect',
    'Participation',
    'Creativity',
    'Other'
  ];

  useEffect(() => {
    reasonSelectRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;
    onSubmit({ student, direction, reason, note });
    setReason('');
    setNote('');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="point-modal-title">
      <div className="modal">
        <h2 id="point-modal-title">{direction === 'positive' ? 'Add Positive Point' : 'Add Negative Point'}</h2>
        <p>
          <strong>{student.name}</strong> ({student.house})
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="reason-select">Reason</label>
          <select
            id="reason-select"
            ref={reasonSelectRef}
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          >
            <option value="" disabled>Select a reason…</option>
            {(direction === 'positive' ? positiveReasons : negativeReasons).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <label htmlFor="note-input">Note (optional)</label>
          <textarea
            id="note-input"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add additional context..."
          />

          <div className="modal-actions">
            <button
              type="submit"
              disabled={!reason}
              className="submit-button"
              aria-disabled={!reason}
            >
              {direction === 'positive' ? 'Add Positive' : 'Add Negative'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PointModal;
