import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrCreateTicket, sendFanMessage, subscribeToTicket, ticketIdForUser } from '../services/supportStore';
import './SupportChat.css';

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SupportChat() {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const t = await getOrCreateTicket(user);
        if (!cancelled) setTicket(t);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not open support chat');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const unsub = subscribeToTicket(user.id, (t) => {
      if (!cancelled) setTicket(t);
    });

    return () => { cancelled = true; unsub(); };
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setError('');
    setSending(true);
    try {
      const updated = await sendFanMessage(user, text);
      setTicket(updated);
      setText('');
    } catch (err) {
      setError(err?.code === 'permission-denied'
        ? 'Could not send — check you are logged in and Firestore rules are published.'
        : (err?.message || 'Send failed'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sm-support-chat">
      <header className="sm-support-chat-header">
        <Link to="/settings" className="sm-support-chat-back" aria-label="Back">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <div className="sm-support-chat-title">Starmeet Support</div>
          <div className="sm-support-chat-sub">We typically reply within 24 hours</div>
        </div>
        <img src="/starmeet-oauth-logo.png" alt="" className="sm-support-chat-logo" />
      </header>

      {loading ? (
        <div className="sm-support-chat-loading">Loading…</div>
      ) : (
        <>
          {error && <div className="sm-support-chat-error">{error}</div>}

          <div className="sm-support-chat-messages">
            {(ticket?.messages || []).map(msg => (
              <div
                key={msg.id}
                className={`sm-support-msg sm-support-msg-${msg.from}`}
              >
                {msg.from === 'system' ? (
                  <div className="sm-support-msg-system">{msg.text}</div>
                ) : (
                  <div className="sm-support-msg-bubble">
                    <div className="sm-support-msg-label">
                      {msg.from === 'fan' ? 'You' : 'Starmeet Support'}
                    </div>
                    <div>{msg.text}</div>
                    <div className="sm-support-msg-time">{fmtTime(msg.timestamp)}</div>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form className="sm-support-chat-input" onSubmit={handleSend}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Describe your issue…"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !text.trim()} aria-label="Send">
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
