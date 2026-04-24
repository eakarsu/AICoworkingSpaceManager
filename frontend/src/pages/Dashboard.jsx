import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { featureRoutes, aiFeatures } from '../App';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="page-subtitle">Welcome to your AI-powered coworking space management hub</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{loading ? '...' : stats?.total_members || 0}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🪑</div>
          <div className="stat-value">{loading ? '...' : stats?.desk_status?.available || 0}</div>
          <div className="stat-label">Available Desks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{loading ? '...' : stats?.active_checkins || 0}</div>
          <div className="stat-label">Active Check-ins</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-value">{loading ? '...' : stats?.pending_maintenance || 0}</div>
          <div className="stat-label">Pending Maintenance</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-value">{loading ? '...' : stats?.today_visitors || 0}</div>
          <div className="stat-label">Today's Visitors</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-value">{loading ? '...' : stats?.upcoming_events || 0}</div>
          <div className="stat-label">Upcoming Events</div>
        </div>
      </div>

      {/* Feature Cards */}
      <h2 style={{ margin: '32px 0 16px' }}>Space Management</h2>
      <div className="feature-grid">
        {featureRoutes.map(route => (
          <div key={route.path} className="feature-card" onClick={() => navigate(`/${route.path}`)}>
            <div className="feature-card-icon">{route.icon}</div>
            <div className="feature-card-title">{route.title}</div>
            <div className="feature-card-arrow">&rarr;</div>
          </div>
        ))}
      </div>

      {/* AI Feature Cards */}
      <h2 style={{ margin: '32px 0 16px' }}>AI-Powered Features</h2>
      <div className="feature-grid">
        {aiFeatures.map(route => (
          <div key={route.path} className="feature-card ai-card" onClick={() => navigate(`/${route.path}`)}>
            <div className="feature-card-icon">{route.icon}</div>
            <div className="feature-card-title">{route.title}</div>
            <div className="feature-card-desc">{route.description}</div>
            <div className="feature-card-arrow">&rarr;</div>
          </div>
        ))}
      </div>
    </div>
  );
}
