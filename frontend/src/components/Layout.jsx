import { NavLink, useLocation } from 'react-router-dom';
import { featureRoutes, aiFeatures, customAiPages } from '../App';

const navSections = [
  { title: 'Space Management', items: ['desks', 'meeting-rooms', 'meeting-bookings', 'phone-booths', 'phone-booth-bookings', 'parking', 'storage'] },
  { title: 'Members & Teams', items: ['members', 'memberships', 'teams', 'checkins', 'access-control'] },
  { title: 'Services', items: ['invoices', 'day-passes', 'visitors', 'mail-packages', 'amenities', 'guest-wifi'] },
  { title: 'Community', items: ['events', 'community-board', 'referrals'] },
  { title: 'Operations', items: ['maintenance', 'cleaning', 'analytics'] },
];

export default function Layout({ user, onLogout, children }) {
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">🏢</span>
          <h2>CoWork Space</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>

          {navSections.map(section => (
            <div key={section.title}>
              <div className="nav-section-title">{section.title}</div>
              {section.items.map(path => {
                const route = featureRoutes.find(r => r.path === path);
                if (!route) return null;
                return (
                  <NavLink key={path} to={`/${path}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <span className="nav-icon">{route.icon}</span> {route.title}
                  </NavLink>
                );
              })}
            </div>
          ))}

          <div className="nav-section-title">AI Features</div>
          {aiFeatures.map(route => (
            <NavLink key={route.path} to={`/${route.path}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{route.icon}</span> {route.title}
            </NavLink>
          ))}

          {(customAiPages || []).map(p => (
            <NavLink key={p.path} to={`/${p.path}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{p.icon}</span> {p.title}
            </NavLink>
          ))}

          <div className="nav-section-title">Custom Views</div>
          <NavLink to="/custom-views" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">🗺️</span> Space Views
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user?.name?.[0] || 'U'}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{user?.role || 'member'}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
