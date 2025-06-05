import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from 'react-router-dom';
import './RewardStorePage.css';
import { rewards as staticRewards } from "../data/rewards";

const RewardStorePage = ({ isTeacher }) => {
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

  // Remove a reward
  const handleDelete = async (id) => {
    await deleteDoc(collection(db, "rewards").doc(id));
    setRewards(rewards.filter(r => r.id !== id));
  };

  return (
    <div className="reward-management">
      <button
        className="back-button"
        style={{ marginBottom: "1rem" }}
        onClick={() => navigate("/dashboard")}
      >
        ⬅ Back to Dashboard
      </button>
      <h2>Reward Management</h2>
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
        <button type="submit">Add Reward</button>
      </form>
      {message && <div className="store-message">{message}</div>}
      <div className="reward-list">
        {rewards.map(reward => (
          <div key={reward.id} className="reward-card">
            <h3>{reward.name}</h3>
            <p>{reward.description}</p>
            <div className="reward-cost">{reward.cost} pts</div>
            <button onClick={() => handleDelete(reward.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardStorePage;

// In App.js or your router file
import RewardsPage from "./pages/RewardsPage";
// ...
<Route path="/rewards" element={<RewardsPage />} />