// Onboarding — shown once after signup to let user follow their first celebrities
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { useAuth } from '../context/AuthContext';
import CelebImage from '../components/CelebImage';
import './Onboarding.css';

const CATEGORY_ORDER = [
  'Actress', 'Actor', 'Musician', 'Athlete', 'Director',
  'Comedian', 'Model', 'Creator', 'Movie Producer',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { celebrities } = useCelebContext();
  const { toggleCelebFollow, celebFollows, user } = useAuth();
  const [selected, setSelected] = useState(new Set(celebFollows));
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => {
    if (!celebrities.length) return [];
    return [...celebrities].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category);
      const bi = CATEGORY_ORDER.indexOf(b.category);
      if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      return a.name.localeCompare(b.name);
    });
  }, [celebrities]);

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
      else next.add(id);
      return next;
    });
  }

  async function finish() {
    setSaving(true);
    const currentSet = new Set(celebFollows);
    for (const id of selected) {
      if (!currentSet.has(id)) toggleCelebFollow(id);
    }
    for (const id of currentSet) {
      if (!selected.has(id)) toggleCelebFollow(id);
    }
    await new Promise(r => setTimeout(r, 400));
    navigate('/feed', { replace: true });
  }

  function skip() {
    navigate('/feed', { replace: true });
  }

  const firstName = user?.name?.split(' ')[0] || 'there';
  const count = selected.size;

  return (
    <div className="sm-onboard">
      <header className="sm-onboard-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Starmeet</span>
          <span className="sm-onboard-badge">Setup</span>
        </div>
        <button type="button" onClick={skip} className="sm-onboard-skip">
          Skip for now
        </button>
      </header>

      <div className="sm-onboard-inner">
        <div className="sm-onboard-hero">
          <div style={{ fontSize: 36, marginBottom: 10 }}>⭐</div>
          <h1>Welcome, {firstName}!</h1>
          <p>
            Follow your favourite celebrities to see their posts in your feed
            and unlock direct messaging with them.
          </p>
        </div>

        {count > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div className="sm-onboard-count">
              <Check size={14} strokeWidth={2.5} />
              {count} selected
            </div>
          </div>
        )}

        {groups.map(([cat, celebs]) => (
          <section key={cat} className="sm-onboard-group">
            <h2 className="sm-onboard-group-title">{cat}s</h2>
            <div className="sm-onboard-grid">
              {celebs.map(c => {
                const isOn = selected.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={`sm-onboard-card${isOn ? ' selected' : ''}`}
                  >
                    {isOn && (
                      <span className="sm-onboard-check">
                        <Check size={11} strokeWidth={3} color="white" />
                      </span>
                    )}
                    <div className="sm-onboard-avatar">
                      <CelebImage celeb={c} alt={c.name} px={440} />
                    </div>
                    <span className="sm-onboard-name">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {celebrities.length === 0 && (
          <div className="sm-onboard-loading">
            <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
            Loading celebrities...
          </div>
        )}
      </div>

      <footer className="sm-onboard-foot">
        <button
          type="button"
          onClick={finish}
          disabled={saving || count < 1}
          className={`sm-onboard-cta${count >= 1 ? ' active' : ' inactive'}`}
        >
          {saving ? 'Setting up your feed…' : count >= 1 ? (
            <>Follow {count} {count === 1 ? 'celebrity' : 'celebrities'} &amp; Start <ChevronRight size={18} /></>
          ) : 'Select at least 1 celebrity'}
        </button>
        {count === 0 && (
          <button type="button" onClick={skip} className="sm-onboard-skip">
            I&apos;ll do this later
          </button>
        )}
      </footer>
    </div>
  );
}
