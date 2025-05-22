// CelebrationPage.js
import React from 'react';
import { houseStorm, houseMeadow, houseFlint, houseEmber } from '../assets/assets';
import './CelebrationPage.css';

const houses = [
  { name: 'Storm', image: houseStorm },
  { name: 'Meadow', image: houseMeadow },
  { name: 'Flint', image: houseFlint },
  { name: 'Ember', image: houseEmber }
];

const CelebrationPage = ({ housePoints }) => {
  const sorted = [...houses].sort((a, b) => (housePoints[b.name] || 0) - (housePoints[a.name] || 0));
  const winner = sorted[0];

  return (
    <div className="celebration-container">
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
    </div>
  );
};

export default CelebrationPage;
