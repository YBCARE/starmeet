import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MessageCircle, User, Menu, X, LogOut, Home, Compass, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadAll } from '../services/messageStore';
import NotificationBell from './NotificationBell';

// ─── Landing navbar (not logged in) ──────────────────────────────────────────
function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#000', borderBottom: '1px solid #1a1a1a', height: 56,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 16px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative',
      }}>
        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4, lineHeight: 0 }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo — centred */}
        <Link to="/" style={{
          textDecoration: 'none', position: 'absolute',
          left: '50%', transform: 'translateX(-50%)',
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Starmeet
          </span>
        </Link>

        {/* Login */}
        <Link to="/login" style={{
          textDecoration: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
          padding: '7px 18px', border: '1.5px solid #333', borderRadius: 999,
        }}>
          Log in
        </Link>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 56, left: 0, right: 0,
          background: '#0a0a0a', borderBottom: '1px solid #1a1a1a',
          padding: '8px 16px 16px', zIndex: 99,
        }}>
          {[['Sign up', '/signup'], ['Explore', '/explore'], ['About', '/']].map(([label, to]) => (
            <Link key={label} to={to} onClick={() => setMenuOpen(false)} style={{
              display: 'block', padding: '13px 4px',
              color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 500,
              borderBottom: '1px solid #1a1a1a',
            }}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Authenticated navbar ─────────────────────────────────────────────────────
function AuthNavbar() {
  const { user, logout, unreadCount: notifUnread } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Count unread message conversations
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
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#000', borderBottom: '1px solid #1a1a1a', height: 56,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 16px',
        height: '100%', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', marginRight: 24 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
            Starmeet
          </span>
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}
          className="desktop-nav">
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              color: isActive(l.to) ? '#fff' : '#666',
              background: isActive(l.to) ? '#1a1a1a' : 'transparent',
              transition: 'all 0.15s',
            }}>
              <l.icon size={15} />
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', position: 'relative' }}>
          {/* Create post */}
          <Link to="/create-post" style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#3b82f6', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', textDecoration: 'none',
          }}>
            <Plus size={18} />
          </Link>

          {/* Search */}
          <Link to="/explore" style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#0d0d0d', border: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#666', textDecoration: 'none',
          }}>
            <Search size={16} />
          </Link>

          {/* Messages */}
          <Link to="/messages" style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#0d0d0d', border: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#666', textDecoration: 'none', position: 'relative',
          }}>
            <MessageCircle size={16} />
            {notifUnread > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                background: '#3b82f6', color: '#fff', borderRadius: '50%',
                minWidth: 17, height: 17, fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #000', padding: '0 2px', lineHeight: 1,
              }}>
                {notifUnread > 9 ? '9+' : notifUnread}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile avatar */}
          <button onClick={() => setProfileOpen(!profileOpen)} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#7c3aed', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer',
          }}>
            {initial}
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div style={{
              position: 'absolute', top: 44, right: 0,
              background: '#0d0d0d', border: '1px solid #222',
              borderRadius: 12, padding: 8, minWidth: 180, zIndex: 200,
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #1a1a1a', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name || 'Fan'}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{user?.email || ''}</div>
              </div>
              <Link to="/profile" onClick={() => setProfileOpen(false)} style={dropdownItemStyle}>
                <User size={14} /> My Profile
              </Link>
              <Link to="/create-post" onClick={() => setProfileOpen(false)} style={dropdownItemStyle}>
                <Plus size={14} /> Create Post
              </Link>
              <Link to="/explore" onClick={() => setProfileOpen(false)} style={dropdownItemStyle}>
                <Compass size={14} /> Explore
              </Link>
              <Link to="/feed" onClick={() => setProfileOpen(false)} style={dropdownItemStyle}>
                <Home size={14} /> Feed
              </Link>
              <button onClick={handleLogout} style={{ ...dropdownItemStyle, border: 'none', cursor: 'pointer', width: '100%', color: '#e05252' }}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#fff', padding: 4, lineHeight: 0, display: 'none',
          }} className="mobile-menu-btn">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 56, left: 0, right: 0,
          background: '#0a0a0a', borderBottom: '1px solid #1a1a1a',
          padding: '8px 16px 16px', zIndex: 99,
        }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 4px', color: '#fff', textDecoration: 'none',
              fontSize: 15, fontWeight: 500, borderBottom: '1px solid #1a1a1a',
            }}>
              <l.icon size={16} /> {l.label}
            </Link>
          ))}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '13px 4px', color: '#e05252', background: 'none',
            border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 500,
            fontFamily: 'inherit', marginTop: 4,
          }}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </nav>
  );
}

const dropdownItemStyle = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '9px 12px', borderRadius: 8,
  color: '#ccc', textDecoration: 'none', fontSize: 13, fontWeight: 500,
  background: 'transparent', transition: 'background 0.15s',
  width: '100%', boxSizing: 'border-box',
};

// ─── Smart export — picks the right navbar ────────────────────────────────────
export default function Navbar() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <AuthNavbar /> : <PublicNavbar />;
}
