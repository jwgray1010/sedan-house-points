import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js'; // <-- You need a hook or context to get current user
import './RewardsPage.css';
import { rewards as staticRewards } from "../data/rewards.js";

const RewardsPage = ({ isTeacher }) => {
  const { user } = useAuth(); // user.uid should be available
  const [userPoints, setUserPoints] = useState(0);
  const [rewards, setRewards] = useState(staticRewards);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('cost');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [redeemed, setRedeemed] = useState({});
  const rewardsPerPage = 8;
  const navigate = useNavigate();

  // Fetch rewards from Firestore
  useEffect(() => {
    const fetchRewards = async () => {
      const snap = await getDocs(collection(db, "rewards"));
      setRewards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRewards();
  }, []);

  // Fetch user points from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchUserPoints = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserPoints(userSnap.data().points || 0);
      }
    };
    fetchUserPoints();
  }, [user]);

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

  // Delete a reward with confirmation
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;
    await deleteDoc(doc(db, "rewards", id));
    setRewards(rewards.filter(r => r.id !== id));
  };

  // Start editing a reward
  const startEdit = (reward) => {
    setEditId(reward.id);
    setEditName(reward.name);
    setEditCost(reward.cost);
    setEditDescription(reward.description || '');
    setEditCategory(reward.category || '');
  };

  // Save edited reward
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

  // Cancel editing
  const handleEditCancel = () => {
    setEditId(null);
  };

  // Toggle popular badge
  const togglePopular = async (reward) => {
    await updateDoc(doc(db, "rewards", reward.id), {
      popular: !reward.popular
    });
    setRewards(rewards.map(r => r.id === reward.id ? { ...r, popular: !r.popular } : r));
  };

  // Redeem reward and update points in Firestore
  const handleRedeem = async (reward) => {
    if (userPoints < reward.cost) {
      setMessage("Not enough points to redeem this reward.");
      return;
    }
    try {
      // Deduct points
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: userPoints - reward.cost
      });
      setUserPoints(prev => prev - reward.cost);

      // Optionally log the redemption
      await addDoc(collection(db, "redemptions"), {
        userId: user.uid,
        rewardId: reward.id,
        rewardName: reward.name,
        cost: reward.cost,
        redeemedAt: new Date().toISOString()
      });

      setRedeemed(prev => ({ ...prev, [reward.id]: true }));
      setMessage(`You redeemed "${reward.name}"!`);
      setTimeout(() => setRedeemed(prev => ({ ...prev, [reward.id]: false })), 2000);
    } catch (err) {
      setMessage("Error redeeming reward. Please try again.");
    }
  };

  // Filter and sort rewards
  const filteredRewards = rewards
    .filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (category ? (r.category || '') === category : true) &&
      (minCost ? r.cost >= Number(minCost) : true) &&
      (maxCost ? r.cost <= Number(maxCost) : true)
    )
    .sort((a, b) => {
      if (sortBy === 'cost') return a.cost - b.cost;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'popular') return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredRewards.length / rewardsPerPage);
  const paginatedRewards = filteredRewards.slice(
    (currentPage - 1) * rewardsPerPage,
    currentPage * rewardsPerPage
  );

  // Unique categories for filter dropdown
  const categories = Array.from(new Set(rewards.map(r => r.category).filter(Boolean)));

  return (
    <div className="reward-store">
      <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </button>
      <h2>Rewards</h2>
      <div className="user-points">
        <span>Available Points: <b>{userPoints}</b></span>
      </div>
      <div className="reward-controls">
        <input
          type="text"
          placeholder="Search rewards..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="cost">Sort by Cost</option>
          <option value="name">Sort by Name</option>
          <option value="popular">Sort by Popular</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min Cost"
          value={minCost}
          onChange={e => setMinCost(e.target.value)}
          style={{ width: 80 }}
        />
        <input
          type="number"
          placeholder="Max Cost"
          value={maxCost}
          onChange={e => setMaxCost(e.target.value)}
          style={{ width: 80 }}
        />
        <span className="reward-count">
          {filteredRewards.length} rewards
        </span>
      </div>
      {isTeacher && (
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
      )}
      {message && <div className="store-message">{message}</div>}
      <div className="reward-list">
        {paginatedRewards.length === 0 && (
          <div className="empty-state">No rewards found.</div>
        )}
        {paginatedRewards.map(reward => (
          <div className={`reward-card${reward.popular ? ' popular' : ''}`} key={reward.id}>
            {reward.popular && <span className="reward-badge">Popular</span>}
            <span className="reward-icon">{reward.icon}</span>
            <span className="reward-name">{reward.name}</span>
            <span className="reward-category">{reward.category}</span>
            <div className="reward-cost">{reward.cost} pts</div>
            <div className="reward-desc">{reward.description}</div>
            <div className="reward-actions">
              {isTeacher ? (
                editId === reward.id ? (
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
                    <button type="button" onClick={() => togglePopular(reward)}>
                      {reward.popular ? "Unmark Popular" : "Mark Popular"}
                    </button>
                  </>
                )
              ) : (
                <button
                  type="button"
                  className={`redeem-btn${redeemed[reward.id] ? ' redeemed' : ''}`}
                  disabled={userPoints < reward.cost || redeemed[reward.id]}
                  onClick={() => handleRedeem(reward)}
                >
                  {redeemed[reward.id] ? "Redeemed!" : "Redeem"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >Prev</button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >Next</button>
        </div>
      )}
    </div>
  );
};

export default RewardsPage;
