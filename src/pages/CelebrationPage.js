// CelebrationPage.js
import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { houseStorm, houseMeadow, houseFlint, houseEmber } from '../assets/assets.js';
import './CelebrationPage.css';

const houses = [
  { name: 'Storm', image: houseStorm },
  { name: 'Meadow', image: houseMeadow },
  { name: 'Flint', image: houseFlint },
  { name: 'Ember', image: houseEmber }
];

// TEMP: Default data for testing
const defaultHousePoints = { Storm: 100, Meadow: 80, Flint: 60, Ember: 90 };
const defaultStudents = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

const CelebrationPage = ({ housePoints = defaultHousePoints, students = defaultStudents }) => {
  const navigate = useNavigate();
  const sorted = [...houses].sort((a, b) => (housePoints[b.name] || 0) - (housePoints[a.name] || 0));
  const winner = sorted[0];

  return (
    <div className="celebration-container">
      <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
      <h1>🎉 House Celebration 🎉</h1>
      <h2 className="winner">🏆 Winner: {winner.name} 🏆</h2>
      <div className="house-tiles">
        {sorted.map(h => (
          <div key={h.name} className={`house-tile ${h.name === winner.name ? 'glow' : ''}`}>
            <img src={h.image} alt={h.name} />
            <p>{h.name}: {housePoints[h.name] || 0} pts</p>
          </div>
        ))}
      </div>
      {students.length > 0 && (
        <div className="certificates-list">
          {students.map(student => (
            <div className="certificate" id={`cert-${student.id}`} key={student.id}>
              <span className="corner-star-topright" />
              <span className="corner-star-bottomleft" />
              {/* ...rest of your certificate content for {student.name} ... */}
              <h3>Certificate for {student.name}</h3>
              {/* Add more certificate details here */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CelebrationPage.propTypes = {
  housePoints: PropTypes.object.isRequired,
  students: PropTypes.array // Array of student objects
};

export default CelebrationPage;


