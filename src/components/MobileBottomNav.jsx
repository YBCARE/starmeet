import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Plus, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadAll } from '../services/messageStore';

const TABS = [
  { to: '/feed',     label: 'Feed',     icon: Home,          match: p => p === '/feed' },
  { to: '/explore',  label: 'Explore',  icon: Compass,       match: p => p.startsWith('/explore') || p.startsWith('/celebrity') },
  { to: '/create-post', label: 'Post',  icon: Plus,          match: p => p === '/create-post', center: true },
  { to: '/messages', label: 'Messages', icon: MessageCircle, match: p => p.startsWith('/messages') },
  { to: '/profile',  label: 'Profile',  icon: User,          match: p => p === '/profile' || p.startsWith('/user/') },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

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

  return (
    <nav className="sm-bottom-nav" aria-label="Main navigation">
      {TABS.map(tab => {
        const active = tab.match(path);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`sm-bottom-nav-item${active ? ' active' : ''}${tab.center ? ' center' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="sm-bottom-nav-icon">
              <Icon size={tab.center ? 22 : 24} strokeWidth={active ? 2.5 : 2} />
              {tab.to === '/messages' && msgUnread > 0 && (
                <span className="sm-bottom-nav-badge">{msgUnread > 9 ? '9+' : msgUnread}</span>
              )}
            </span>
            {!tab.center && <span className="sm-bottom-nav-label">{tab.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
