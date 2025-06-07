import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useAuth } from '../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom'; // <-- Add this import
import './RewardsPage.css';

const ADMIN_EMAIL = 'john.gray@usd286.org';

const TeacherRewardsPage = () => {
  const authContext = useAuth() || {};
  const { user } = authContext;
  const isAdmin = user && user.email === ADMIN_EMAIL;
  // You should check the user's role or email domain properly.
  // The line below is likely incorrect unless your user object has a 'role' field set to '@usd286.org'.
  // If you want to check if the user's email ends with '@usd286.org', use:
  const isTeacher = user && user.email && user.email.endsWith('@usd286.org');
  const navigate = useNavigate();

  const [rewards, setRewards] = useState([]);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    const fetchRewards = async () => {
      const snap = await getDocs(collection(db, "rewards"));
      setRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRewards();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !cost) {
      setMessage("Name and cost are required.");
      return;
    }
    await addDoc(collection(db, "rewards"), {
      name,
      cost: Number(cost),
      description,
      category,
      popular: false,
      created: new Date().toISOString()
    });
    setName('');
    setCost('');
    setDescription('');
    setCategory('');
    setMessage("Reward added!");
    // Refresh rewards
    const snap = await getDocs(collection(db, "rewards"));
    setRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;
    await deleteDoc(doc(db, "rewards", id));
    setRewards(rewards.filter(r => r.id !== id));
  };

  const startEdit = (reward) => {
    setEditId(reward.id);
    setEditName(reward.name);
    setEditCost(reward.cost);
    setEditDescription(reward.description || '');
    setEditCategory(reward.category || '');
  };

  const handleEditSave = async (id) => {
    await updateDoc(doc(db, "rewards", id), {
      name: editName,
      cost: Number(editCost),
      description: editDescription,
      category: editCategory
    });
    setEditId(null);
    setMessage("Reward updated!");
    // Refresh rewards
    const snap = await getDocs(collection(db, "rewards"));
    setRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleEditCancel = () => {
    setEditId(null);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!isTeacher && !isAdmin) {
    return <div>Access denied.</div>;
  }

  return (
    <div className="reward-store">
      <button
        className="back-dashboard-btn"
        style={{ marginBottom: '1.5rem' }}
        onClick={() => navigate('/dashboard')}
      >
        Back to Dashboard
      </button>
      <h2>Manage Rewards</h2>
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
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      {message && <div className="store-message">{message}</div>}
      <div className="reward-list">
        {rewards.map(reward => (
          <div className="reward-card" key={reward.id}>
            <span className="reward-name">{reward.name}</span>
            <span className="reward-category">{reward.category}</span>
            <div className="reward-cost">{reward.cost} pts</div>
            <div className="reward-desc">{reward.description}</div>
            <div className="reward-actions">
              {editId === reward.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                  <input
                    type="number"
                    value={editCost}
                    onChange={e => setEditCost(e.target.value)}
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                  />
                  <input
                    type="text"
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                  />
                  <button type="button" onClick={() => handleEditSave(reward.id)}>Save</button>
                  <button type="button" onClick={handleEditCancel}>Cancel</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => startEdit(reward)}>Edit</button>
                  <button type="button" onClick={() => handleDelete(reward.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherRewardsPage;