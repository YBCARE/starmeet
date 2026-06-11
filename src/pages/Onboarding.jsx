// Onboarding — shown once after signup to let user follow their first celebrities
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, ChevronRight, Sparkles } from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ORDER = [
  'Actress', 'Actor', 'Musician', 'Athlete', 'Director',
  'Comedian', 'Model', 'Creator', 'Movie Producer',
];

export default function Onboarding() {
  const navigate   = useNavigate();
  const { celebrities } = useCelebContext();
  const { toggleCelebFollow, celebFollows, user } = useAuth();
  const [selected, setSelected] = useState(new Set(celebFollows));
  const [step,     setStep]     = useState(1); // 1 = pick celebs, 2 = done
  const [saving,   setSaving]   = useState(false);

  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=aaa&size=200`;

  // Sort celebs: by category order, then alphabetically
  const sorted = useMemo(() => {
    if (!celebrities.length) return [];
    return [...celebrities].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.name.localeCompare(b.name);
    });
  }, [celebrities]);

  // Group by category
  const groups = useMemo(() => {
    const map = new Map();
    for (const c of sorted) {
      const cat = c.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(c);
    }
    return [...map.entries()];
  }, [sorted]);

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  }

  async function finish() {
    setSaving(true);
    // Apply all selected follows
    const currentSet = new Set(celebFollows);
    for (const id of selected) {
      if (!currentSet.has(id)) toggleCelebFollow(id);
    }
    for (const id of currentSet) {
      if (!selected.has(id)) toggleCelebFollow(id);
    }
    // Small delay for state to settle
    await new Promise(r => setTimeout(r, 400));
    navigate('/feed', { replace: true });
  }

  function skip() {
    navigate('/feed', { replace: true });
  }

  const firstName = user?.name?.split(' ')[0] || 'there';
  const count     = selected.size;

  return (
    <div style={{
      background: '#000', minHeight: '100vh', color: '#fff',
      fontFamily: 'Inter,system-ui,sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        .onboard-card { animation: fadeUp 0.4s ease both; }
        .celeb-card:hover { border-color: #333 !important; }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #111', padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Starmeet</span>
          <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, background: '#3b82f618', borderRadius: 5, padding: '2px 6px' }}>Setup</span>
        </div>
        <button onClick={skip} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555', fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
        }}>
          Skip for now
        </button>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 14px 100px' }}>

        {/* Hero text */}
        <div className="onboard-card" style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⭐</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.2 }}>
            Welcome, {firstName}!
          </h1>
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6, margin: 0 }}>
            Follow your favourite celebrities to see their posts in your feed<br />
            and unlock direct messaging with them.
          </p>
        </div>

        {/* Selected count pill */}
        {count > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, marginBottom: 20,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#3b82f618', border: '1px solid #3b82f640',
              borderRadius: 99, padding: '6px 14px',
              fontSize: 13, fontWeight: 700, color: '#60a5fa',
            }}>
              <Check size={14} strokeWidth={2.5} />
              {count} selected
            </div>
          </div>
        )}

        {/* Celebrity grid by category */}
        {groups.map(([cat, celebs]) => (
          <div key={cat} className="onboard-card" style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
              {cat}s
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
              {celebs.map(c => {
                const isOn = selected.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className="celeb-card"
                    style={{
                      background: isOn ? '#0f1e3a' : '#0a0a0a',
                      border: `1.5px solid ${isOn ? '#3b82f6' : '#1a1a1a'}`,
                      borderRadius: 12, padding: '12px 10px',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transition: 'all 0.15s', position: 'relative', outline: 'none',
                    }}
                  >
                    {/* Checkmark */}
                    {isOn && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={11} strokeWidth={3} color="white" />
                      </div>
                    )}
                    {/* Avatar */}
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      overflow: 'hidden', border: isOn ? '2px solid #3b82f6' : '2px solid #1a1a1a',
                      flexShrink: 0,
                    }}>
                      <img
                        src={c.image} alt={c.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                        onError={e => { e.currentTarget.src = av(c.name); }}
                      />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isOn ? '#fff' : '#ccc', textAlign: 'center', lineHeight: 1.3 }}>
                      {c.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {celebrities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#555' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            Loading celebrities...
          </div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: '14px 16px 28px',
        background: 'linear-gradient(to top, #000 70%, transparent)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        zIndex: 100,
      }}>
        <button
          onClick={finish}
          disabled={saving}
          style={{
            width: '100%', maxWidth: 400,
            padding: '14px 0', borderRadius: 12, border: 'none',
            background: count >= 1 ? '#3b82f6' : '#1a1a1a',
            color: count >= 1 ? '#fff' : '#555',
            fontSize: 15, fontWeight: 800, cursor: count >= 1 ? 'pointer' : 'default',
            fontFamily: 'inherit', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving ? 'Setting up your feed…' : count >= 1 ? (
            <>Follow {count} {count === 1 ? 'celebrity' : 'celebrities'} &amp; Start <ChevronRight size={18} /></>
          ) : 'Select at least 1 celebrity'}
        </button>
        {count === 0 && (
          <button onClick={skip} style={{ background: 'none', border: 'none', color: '#444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            I'll do this later
          </button>
        )}
      </div>
    </div>
  );
}
