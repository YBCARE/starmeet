import { useState, useRef, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICON_MAP  = { like: Heart, message: MessageCircle, comment: MessageCircle, follow: UserPlus, post: Star };
const COLOR_MAP = { like: '#e05252', message: '#3b82f6', comment: '#3b82f6', follow: '#8b5cf6', post: '#f59e0b' };

function timeAgo(ts) {
  if (!ts) return 'just now';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleOpen() {
    const next = !open;
    setOpen(next);
    // Mark all read after 1.5s when opening
    if (next && unreadCount > 0) {
      setTimeout(markAllRead, 1500);
    }
  }

  const recent = notifications.slice(0, 20);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={handleOpen} style={{
        width: 36, height: 36, borderRadius: 8,
        background: '#0d0d0d', border: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: open ? '#fff' : '#666', cursor: 'pointer', position: 'relative',
        transition: 'all 0.15s',
      }}>
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            background: '#e05252', color: '#fff', borderRadius: '50%',
            minWidth: 17, height: 17, fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #000', padding: '0 2px', lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 320, maxHeight: 440, overflowY: 'auto',
          background: '#0d0d0d', border: '1px solid #222',
          borderRadius: 14, zIndex: 300,
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: '#0d0d0d', zIndex: 1,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Notifications</span>
            <button onClick={() => setOpen(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#555',
              lineHeight: 0, padding: 2,
            }}>
              <X size={15} />
            </button>
          </div>

          {/* List */}
          {recent.length === 0 ? (
            <div style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 6 }}>All caught up</div>
              <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                When celebrities reply to you,<br />you'll see it here instantly
              </div>
            </div>
          ) : (
            recent.map(n => {
              const Icon  = ICON_MAP[n.type]  || Bell;
              const color = COLOR_MAP[n.type] || '#666';
              const dest  = n.type === 'message' || n.type === 'comment'
                ? `/messages${n.celebId ? `?with=celeb_${n.celebId}` : ''}`
                : '/messages';
              return (
                <Link
                  key={n.id} to={dest}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid #111',
                    textDecoration: 'none',
                    background: n.read ? 'transparent' : 'rgba(59,130,246,0.06)',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Icon bubble */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} color={color} />
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                      {n.title || n.text || 'New notification'}
                    </div>
                    {(n.body || n.preview) && (
                      <div style={{
                        fontSize: 12, color: '#888', marginTop: 3, lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {n.body || n.preview}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#3b82f6', flexShrink: 0, marginTop: 5,
                    }} />
                  )}
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
