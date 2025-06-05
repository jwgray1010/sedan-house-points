import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useNavigate } from 'react-router-dom';
import './RewardsPage.css';
import { rewards as staticRewards } from "../data/rewards.js";

const RewardsPage = ({ isTeacher }) => {
  const [rewards, setRewards] = useState(staticRewards);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Fetch rewards from Firestore
  useEffect(() => {
    const fetchRewards = async () => {
      const snap = await getDocs(collection(db, "rewards"));
      setRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRewards();
  }, []);

  // Add a new reward
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !cost) {
      setMessage("Name and cost are required.");
      return;
    }
    await addDoc(collection(db, "rewards"), {
      name,
      cost: Number(cost),
      description
    });
    setName('');
    setCost('');
    setDescription('');
    setMessage("Reward added!");
    // Refresh rewards
    const snap = await getDocs(collection(db, "rewards"));
    setRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  // Delete a reward
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "rewards", id));
    setRewards(rewards.filter(r => r.id !== id));
  };

  return (
    <div className="reward-store">
      <button
        className="back-dashboard-btn"
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </button>
      <h2>Rewards</h2>
      <form className="reward-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Reward Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={e => setCost(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {message && <div className="store-message">{message}</div>}
      <div className="reward-list">
        {rewards.map(reward => (
          <div className="reward-card" key={reward.id}>
            <div className="reward-name">{reward.name}</div>
            <div className="reward-cost">{reward.cost} pts</div>
            <div className="reward-desc">{reward.description}</div>
            {isTeacher && (
              <button onClick={() => handleDelete(reward.id)}>
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardsPage;
