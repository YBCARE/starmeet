import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, User, Menu, X, LogOut, Home, Compass, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadAll } from '../services/messageStore';
import NotificationBell from './NotificationBell';

function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sm-nav sm-nav-public">
      <div className="sm-nav-inner sm-nav-public-inner">
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm-icon-btn sm-nav-public-menu"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" className="sm-logo sm-nav-public-logo">
          Starmeet
        </Link>

        <div className="sm-nav-public-actions">
          <Link to="/explore" className="sm-nav-link desktop-nav">Explore</Link>
          <Link to="/login" className="sm-btn sm-btn-ghost sm-nav-public-login">Log in</Link>
          <Link to="/signup" className="sm-btn sm-btn-primary sm-nav-public-signup">Sign up</Link>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: 'var(--sm-nav-height)', left: 0, right: 0,
          background: 'var(--sm-bg-elevated)', borderBottom: '1px solid var(--sm-border)',
          padding: '8px 16px 16px', zIndex: 99,
        }}>
          {[['Explore', '/explore'], ['Log in', '/login'], ['Sign up', '/signup']].map(([label, to]) => (
            <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="sm-nav-link" style={{ display: 'block', marginBottom: 4 }}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function AuthNavbar() {
  const { user, logout, unreadCount: notifUnread } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const msgUnread = (() => {
    try {
      const myId = user ? `user_${user.id}` : null;
      if (!myId) return 0;
      const all = loadAll();
      return Object.values(all).filter(c =>
        (c.participants?.includes(myId) || c.userId === myId) &&
        c.messages?.some(m => m.from === 'them' && !m.read)
      ).length;
    } catch { return 0; }
  })();

  const links = [
    { to: '/explore',  label: 'Explore',  icon: Compass },
    { to: '/feed',     label: 'Feed',      icon: Home },
    { to: '/messages', label: 'Messages',  icon: MessageCircle },
  ];

  const isActive = path => location.pathname === path || location.pathname.startsWith(path + '/');

  function handleLogout() {
    logout();
    navigate('/');
    setProfileOpen(false);
  }

  const initial = (user?.name || user?.email || 'F')[0].toUpperCase();

  return (
    <nav className="sm-nav">
      <div className="sm-nav-inner">
        <Link to="/feed" className="sm-logo">Starmeet</Link>

        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, marginLeft: 16 }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`sm-nav-link${isActive(l.to) ? ' active' : ''}`}>
              <l.icon size={16} />
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', position: 'relative' }}>
          <Link to="/create-post" className="sm-icon-btn mobile-hide-icons" style={{ background: 'var(--sm-accent)', borderColor: 'transparent', color: '#fff' }}>
            <Plus size={18} />
          </Link>
          <Link to="/explore" className="sm-icon-btn mobile-hide-icons" aria-label="Search"><Search size={16} /></Link>
          <Link to="/messages" className="sm-icon-btn mobile-hide-icons" aria-label="Messages" style={{ position: 'relative' }}>
            <MessageCircle size={16} />
            {msgUnread > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
                background: 'var(--sm-accent)', color: '#fff', borderRadius: '50%',
                fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #000', padding: '0 3px',
              }}>
                {msgUnread > 9 ? '9+' : msgUnread}
              </span>
            )}
          </Link>
          <NotificationBell />
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="Profile menu"
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #0095f6)', color: '#fff',
              fontSize: 14, fontWeight: 700,
            }}
          >
            {initial}
          </button>

          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn sm-icon-btn" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute', top: 48, right: 0, background: 'var(--sm-bg-elevated)',
              border: '1px solid var(--sm-border)', borderRadius: 'var(--sm-radius-md)',
              padding: 8, minWidth: 200, zIndex: 200, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}>
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--sm-border)', marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{user?.name || 'Fan'}</div>
                <div style={{ fontSize: 12, color: 'var(--sm-text-muted)', marginTop: 2 }}>{user?.email || ''}</div>
              </div>
              <Link to="/profile" onClick={() => setProfileOpen(false)} style={dropdownItemStyle}><User size={14} /> My Profile</Link>
              <Link to="/create-post" onClick={() => setProfileOpen(false)} style={dropdownItemStyle}><Plus size={14} /> Create Post</Link>
              <button type="button" onClick={handleLogout} style={{ ...dropdownItemStyle, border: 'none', cursor: 'pointer', width: '100%', color: 'var(--sm-danger)' }}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: 'var(--sm-nav-height)', left: 0, right: 0,
          background: 'var(--sm-bg-elevated)', borderBottom: '1px solid var(--sm-border)', padding: '8px 16px 16px', zIndex: 99,
        }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="sm-nav-link" style={{ display: 'flex', marginBottom: 4 }}>
              <l.icon size={16} /> {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

const dropdownItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8,
  color: 'var(--sm-text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 500,
  background: 'transparent', width: '100%', boxSizing: 'border-box',
};

export default function Navbar() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <AuthNavbar /> : <PublicNavbar />;
}
