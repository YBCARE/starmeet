import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Check, Star, Zap, Shield, MessageCircle, Play, ChevronRight } from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { celebrities as STATIC_CELEBS } from '../data/celebrities';
import Navbar from '../components/Navbar';

// ─── Category config — images pulled from real celebrity data ─────────────────
// Each entry maps to a celebrity in the app by category match
const CATEGORY_DEFS = [
  { label: 'Actors',          match: 'Actress'       },
  { label: 'Musicians',       match: 'Musician'      },
  { label: 'Athletes',        match: 'Athlete'       },
  { label: 'Directors',       match: 'Director'      },
  { label: 'Comedians',       match: 'Comedian'      },
  { label: 'Models',          match: 'Model'         },
  { label: 'Creators',        match: 'Creator'       },
  { label: 'Movie Producers', match: 'Movie Producer'},
];

function buildCategories(celebList) {
  // Use all available celebs (static + any added via admin)
  const all = celebList?.length ? celebList : STATIC_CELEBS;
  return CATEGORY_DEFS.map(def => {
    const celeb = all.find(c =>
      c.category?.toLowerCase().includes(def.match.toLowerCase())
    );
    return {
      label: def.label,
      match: def.match,
      name:  celeb?.name  || def.label,
      image: celeb?.image || null,
      id:    celeb?.id    || null,
    };
  });
}

// ─── Animated chat demo ───────────────────────────────────────────────────────
const DEMO_CONVO = [
  { from: 'fan',   text: "You're literally the reason I started acting. This is unreal 😭" },
  { from: 'celeb', text: "That genuinely means everything to me. Keep going. 🙏", delay: 1200 },
  { from: 'fan',   text: "Can I ask — what was your biggest fear starting out?", delay: 2200 },
  { from: 'celeb', text: "Rejection. Every single day. The difference? I showed up anyway. ✨", delay: 3600 },
];

function ChatDemo({ celebName, celebImg }) {
  const [visible, setVisible] = useState(0);
  const [typing, setTyping]   = useState(false);

  useEffect(() => {
    if (visible >= DEMO_CONVO.length) return;
    const msg = DEMO_CONVO[visible];
    if (msg.from === 'celeb') {
      const t1 = setTimeout(() => setTyping(true), (msg.delay || 800) - 600);
      const t2 = setTimeout(() => { setTyping(false); setVisible(v => v + 1); }, msg.delay || 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    const t = setTimeout(() => setVisible(v => v + 1), msg.delay || 600);
    return () => clearTimeout(t);
  }, [visible]);

  // Restart loop
  useEffect(() => {
    if (visible === DEMO_CONVO.length) {
      const t = setTimeout(() => setVisible(0), 3000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const av = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=818cf8&size=100&bold=true`;

  return (
    <div style={{
      background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 20,
      overflow: 'hidden', width: '100%', maxWidth: 380, boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    }}>
      {/* Chat header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #141414', display: 'flex', alignItems: 'center', gap: 10, background: '#050505' }}>
        <div style={{ position: 'relative' }}>
          <img src={celebImg || av(celebName)} alt={celebName}
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top' }}
            onError={e => { e.currentTarget.src = av(celebName); }} />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: '#22c55e', border: '2px solid #050505' }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{celebName}</span>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={7} strokeWidth={3.5} color="white" />
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#22c55e' }}>Online now</div>
        </div>
        <div style={{ marginLeft: 'auto', background: '#7c3aed22', border: '1px solid #7c3aed44', borderRadius: 999, padding: '3px 10px' }}>
          <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>Pro Member</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: '16px 14px', minHeight: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DEMO_CONVO.slice(0, visible).map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'fan' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease' }}>
            {msg.from === 'celeb' && (
              <img src={celebImg || av(celebName)} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}
                onError={e => { e.currentTarget.src = av(celebName); }} />
            )}
            <div style={{
              maxWidth: '72%', padding: '9px 13px', borderRadius: msg.from === 'fan' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.from === 'fan' ? '#3b82f6' : '#1a1a1a',
              fontSize: 13, color: '#fff', lineHeight: 1.5,
            }}>{msg.text}</div>
          </div>
        ))}

        {typing && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, animation: 'fadeUp 0.3s ease' }}>
            <img src={celebImg || av(celebName)} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0 }}
              onError={e => { e.currentTarget.src = av(celebName); }} />
            <div style={{ background: '#1a1a1a', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#555', animation: `bounce 1.2s ${i*0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #111', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, background: '#111', borderRadius: 999, padding: '9px 14px', fontSize: 13, color: '#555' }}>
          Message {celebName}...
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowRight size={15} color="white" />
        </div>
      </div>
    </div>
  );
}

// ─── Stat counter ──────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────
function PricingCard({ name, price, sub, features, cta, ctaLink, highlight, badge }) {
  return (
    <div style={{
      flex: 1, minWidth: 240, maxWidth: 320,
      background: highlight ? 'linear-gradient(135deg, #1e1b4b, #0f172a)' : '#0a0a0a',
      border: `1.5px solid ${highlight ? '#7c3aed' : '#1a1a1a'}`,
      borderRadius: 20, padding: '28px 24px',
      position: 'relative', overflow: 'hidden',
      boxShadow: highlight ? '0 0 60px rgba(124,58,237,0.15)' : 'none',
    }}>
      {badge && (
        <div style={{ position: 'absolute', top: 16, right: 16, background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
          {badge}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? '#a78bfa' : '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>{price}</span>
        {sub && <span style={{ fontSize: 13, color: '#555' }}>{sub}</span>}
      </div>
      <div style={{ height: 1, background: '#1a1a1a', margin: '20px 0' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: f.dim ? '#444' : '#bbb', lineHeight: 1.4 }}>
            <Check size={14} color={f.dim ? '#333' : (highlight ? '#a78bfa' : '#3b82f6')} style={{ flexShrink: 0, marginTop: 1 }} />
            {f.text}
          </div>
        ))}
      </div>
      <Link to={ctaLink} style={{
        display: 'block', textAlign: 'center', textDecoration: 'none',
        background: highlight ? '#7c3aed' : '#1a1a1a',
        color: '#fff', fontWeight: 700, fontSize: 14,
        padding: '12px', borderRadius: 12,
        border: highlight ? 'none' : '1px solid #2a2a2a',
        transition: 'opacity 0.15s',
      }}>
        {cta}
      </Link>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function Landing() {
  const { celebrities }        = useCelebContext();
  const navigate               = useNavigate();
  const [query,    setQuery]   = useState('');
  const categories = buildCategories(celebrities);

  // Pick a high-profile celebrity for the chat demo
  const demoCell = celebrities.find(c =>
    c.name?.toLowerCase().includes('dwayne') ||
    c.name?.toLowerCase().includes('keanu') ||
    c.name?.toLowerCase().includes('beyoncé')
  ) || celebrities[0];

  const trending = celebrities.slice(0, 14);

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/explore${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  }

  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=555&size=300`;

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'Inter,system-ui,sans-serif' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-5px); } }
        @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes floatY { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-10px); } }
        .cta-primary:hover { opacity:0.88; }
        .cta-ghost:hover { border-color:#555 !important; }
        .celeb-card:hover { transform:translateY(-3px); }
        .celeb-card { transition: transform 0.2s; }
      `}</style>

      <Navbar />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section style={{ padding: 'clamp(40px,6vw,80px) 16px clamp(48px,6vw,80px)', position: 'relative', overflow: 'hidden' }}>

        {/* Background glow */}
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Left — copy */}
          <div style={{ flex: '1 1 420px', maxWidth: 520 }}>

            {/* Trust badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#0d0d0d', border: '1px solid #1f1f1f', borderRadius: 999, padding: '6px 14px', marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: '#aaa', fontWeight: 500 }}>1,300+ celebrities active now</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(36px,5.5vw,58px)', fontWeight: 900,
              lineHeight: 1.08, margin: '0 0 20px', letterSpacing: '-2px',
            }}>
              Your message.{' '}
              <span style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Their reply.
              </span>
              <br />No PR. No bots.
            </h1>

            <p style={{ color: '#888', fontSize: 'clamp(15px,2vw,17px)', lineHeight: 1.65, margin: '0 0 32px', maxWidth: 460 }}>
              DM the actor, athlete or musician you actually care about — and get a real reply back.
              Over <strong style={{ color: '#ccc' }}>500,000 fans</strong> have already had the conversation they thought was impossible.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#0d0d0d', border: '1.5px solid #1f1f1f',
              borderRadius: 14, padding: '10px 14px', marginBottom: 20,
              transition: 'border-color 0.2s',
            }}
              onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onBlur={e => e.currentTarget.style.borderColor = '#1f1f1f'}
            >
              <Search size={16} color="#555" style={{ flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search Beyoncé, Keanu Reeves, Ronaldo..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff', fontFamily: 'inherit' }}
              />
              <button type="submit" style={{
                background: '#3b82f6', border: 'none', borderRadius: 10,
                color: '#fff', fontSize: 13, fontWeight: 700, padding: '8px 16px',
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap',
              }}>Search</button>
            </form>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link to="/signup" className="cta-primary" style={{
                textDecoration: 'none', background: '#fff', color: '#000',
                fontWeight: 800, fontSize: 14, padding: '13px 28px',
                borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'opacity 0.2s',
              }}>
                Start for free <ArrowRight size={15} />
              </Link>
              <Link to="/explore" className="cta-ghost" style={{
                textDecoration: 'none', border: '1.5px solid #2a2a2a', color: '#aaa',
                fontWeight: 600, fontSize: 14, padding: '13px 24px',
                borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'border-color 0.2s',
              }}>
                Browse celebrities
              </Link>
            </div>

            {/* Micro social proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <div style={{ display: 'flex' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%', background: `hsl(${i*60},40%,30%)`,
                    border: '2px solid #000', marginLeft: i ? -8 : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#aaa', fontWeight: 600,
                  }}>
                    {['K','A','M','J','R'][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: '#666' }}>
                <span style={{ color: '#aaa', fontWeight: 600 }}>500,000+</span> fans already connected
              </span>
            </div>
          </div>

          {/* Right — live chat demo */}
          <div style={{ flex: '1 1 300px', maxWidth: 400, display: 'flex', justifyContent: 'center', animation: 'floatY 4s ease-in-out infinite' }}>
            {demoCell && (
              <ChatDemo
                celebName={demoCell.name || 'Dwayne Johnson'}
                celebImg={demoCell.image}
              />
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '28px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0 }}>
          {[
            { value: '1,300+', label: 'Verified celebrities' },
            { value: '500K+',  label: 'Active fans' },
            { value: '2.4M',   label: 'Messages sent' },
            { value: '98%',    label: 'Reply rate (Pro)' },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <Stat value={s.value} label={s.label} />
              {i < arr.length - 1 && <div style={{ width: 1, height: 36, background: '#1a1a1a', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Browse by category</h2>
            <Link to="/explore" style={{ color: '#555', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              All categories <ChevronRight size={13} />
            </Link>
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 20, overflowX: 'auto', paddingLeft: 16, paddingRight: 16,
          scrollbarWidth: 'none', msOverflowStyle: 'none', maxWidth: 1100, margin: '0 auto',
        }}>
          {categories.map((cat, idx) => {
            const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(cat.name)}&background=1a1a1a&color=555&size=300`;
            return (
              <Link key={cat.label + idx} to={`/explore?cat=${cat.match}`}
                style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 90, height: 90, borderRadius: '50%',
                  padding: 2.5, background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#111', border: '2px solid #000' }}>
                    <img
                      src={cat.image || fallback}
                      alt={cat.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                      onError={e => { e.currentTarget.src = fallback; }}
                    />
                  </div>
                </div>
                <span style={{ color: '#ccc', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TRENDING STARS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0', borderTop: '1px solid #0d0d0d' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>Trending now</h2>
              <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Most messaged celebrities this week</p>
            </div>
            <Link to="/explore" style={{ color: '#555', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              See all <ChevronRight size={13} />
            </Link>
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 14, overflowX: 'auto', paddingLeft: 16, paddingRight: 16,
          scrollbarWidth: 'none', msOverflowStyle: 'none', maxWidth: 1100, margin: '0 auto',
        }}>
          {(trending.length ? trending : [...Array(8)]).map((c, i) => {
            const isReal = !!c?.name;
            return (
              <div key={isReal ? c.id : i} className={isReal ? 'celeb-card' : ''}
                onClick={() => isReal && navigate(`/celebrity/${c.id}`)}
                style={{ flexShrink: 0, width: 148, cursor: isReal ? 'pointer' : 'default' }}>
                <div style={{ width: 148, height: 196, borderRadius: 14, overflow: 'hidden', background: '#0d0d0d', marginBottom: 10, position: 'relative' }}>
                  {isReal ? (
                    <>
                      <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                        onError={e => { e.currentTarget.src = av(c.name); }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
                      {/* DM badge */}
                      <div style={{ position: 'absolute', bottom: 9, left: 9, background: 'rgba(0,0,0,0.7)', border: '1px solid #1f1f1f', borderRadius: 999, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MessageCircle size={10} color="#3b82f6" />
                        <span style={{ fontSize: 10, color: '#aaa', fontWeight: 600 }}>DM open</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#0d0d0d', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  )}
                </div>
                {isReal ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={7} strokeWidth={3.5} color="white" />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{c.category}</div>
                  </>
                ) : (
                  <>
                    <div style={{ height: 11, background: '#111', borderRadius: 4, width: '80%', marginBottom: 5 }} />
                    <div style={{ height: 9, background: '#0d0d0d', borderRadius: 4, width: '55%' }} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT ACTUALLY WORKS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 16px', borderTop: '1px solid #0d0d0d' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
              Three steps to your favourite celebrity
            </h2>
            <p style={{ color: '#555', fontSize: 15, maxWidth: 420, margin: '0 auto' }}>No middleman. No PR team. No auto-replies.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {[
              {
                icon: <Search size={22} color="#3b82f6" />,
                step: '01',
                title: 'Find who you love',
                body: 'Search 1,300+ verified celebrities. Actors, musicians, athletes, creators. Every one of them real.',
                bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)',
              },
              {
                icon: <Zap size={22} color="#7c3aed" />,
                step: '02',
                title: 'Send your message',
                body: 'Follow for free or go Pro to unlock direct DMs, exclusive content, and monthly live Q&As.',
                bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)',
                highlight: true,
              },
              {
                icon: <MessageCircle size={22} color="#22c55e" />,
                step: '03',
                title: 'They actually reply',
                body: '98% of Pro messages get a reply within 24 hours. Real words from the person you admire.',
                bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)',
              },
            ].map((s, i) => (
              <div key={i} style={{
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: 20, padding: '28px 24px', position: 'relative',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: '#0a0a0a', border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: 12, color: '#333', fontWeight: 800 }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 16px', borderTop: '1px solid #0d0d0d' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 10 }}>
              Fans who couldn't believe it
            </h2>
            <p style={{ color: '#555', fontSize: 14, margin: 0 }}>Real moments between real people.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            {[
              {
                quote: "I sent a message on a Tuesday night not expecting anything. By Wednesday morning they had replied with a full paragraph. I actually cried.",
                name: 'Amara O.',
                tag: 'Messaged a Grammy-winning musician',
                avatar: 'AO',
                color: '#7c3aed',
              },
              {
                quote: "Been a fan for 15 years. Thought stuff like this only happened to influencers. Then I got a 'thank you for sticking around' and my week was made.",
                name: 'Daniel K.',
                tag: 'Messaged his favourite actor',
                avatar: 'DK',
                color: '#3b82f6',
              },
              {
                quote: "My daughter is obsessed with a pop star. I got her a Pro account for her birthday. When she got a reply she literally screamed. Worth every penny.",
                name: 'Sarah M.',
                tag: 'Pro member since 2025',
                avatar: 'SM',
                color: '#22c55e',
              },
            ].map((t, i) => (
              <div key={i} style={{
                background: '#080808', border: '1px solid #141414',
                borderRadius: 20, padding: '26px 24px',
              }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={13} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>
                <p style={{ fontSize: 14, color: '#bbb', lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `${t.color}22`, border: `1.5px solid ${t.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: t.color, flexShrink: 0,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: '#444', marginTop: 1 }}>{t.tag}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 16px', borderTop: '1px solid #0d0d0d', background: '#030303' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
              Simple, honest pricing
            </h2>
            <p style={{ color: '#555', fontSize: 15 }}>Free forever to browse and follow. Pay only when you want to talk.</p>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <PricingCard
              name="Fan"
              price="Free"
              sub=""
              features={[
                { text: 'Follow 1,300+ verified celebrities' },
                { text: 'See public posts and updates' },
                { text: 'Browse celebrity profiles' },
                { text: 'Direct messages', dim: true },
                { text: 'Exclusive content', dim: true },
              ]}
              cta="Get started free"
              ctaLink="/signup"
            />
            <PricingCard
              name="Pro Fan"
              price="$9"
              sub="/ month"
              features={[
                { text: 'Everything in Free' },
                { text: 'Direct message any celebrity' },
                { text: '98% reply rate guarantee' },
                { text: 'Exclusive behind-the-scenes content' },
                { text: 'Monthly live Q&A sessions' },
              ]}
              cta="Go Pro"
              ctaLink="/signup"
              highlight
              badge="Most popular"
            />
            <PricingCard
              name="Celebrity"
              price="Free"
              sub="to join"
              features={[
                { text: 'Free verified profile' },
                { text: 'Keep 80% of all revenue' },
                { text: 'Instant payouts' },
                { text: 'Full content control' },
                { text: 'Fan analytics dashboard' },
              ]}
              cta="Apply as celebrity"
              ctaLink="/signup"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOR CELEBRITIES
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 16px', borderTop: '1px solid #0d0d0d' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f0a1e, #0a0a0a)',
            border: '1px solid #1f1040', borderRadius: 24,
            padding: 'clamp(32px,5vw,56px)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a0a2e', border: '1px solid #3b1f6a', borderRadius: 999, padding: '4px 12px', marginBottom: 20 }}>
                  <Shield size={12} color="#a78bfa" />
                  <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>For celebrities & public figures</span>
                </div>
                <h2 style={{ fontSize: 'clamp(22px,3.5vw,32px)', fontWeight: 900, letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.2 }}>
                  Your fanbase.<br />Your revenue.
                </h2>
                <p style={{ color: '#666', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                  Join 1,300+ verified celebrities earning directly from fans with zero middleman. Monetise who you already are.
                </p>
                <Link to="/signup" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  textDecoration: 'none', background: '#7c3aed',
                  color: '#fff', fontWeight: 700, fontSize: 14,
                  padding: '13px 26px', borderRadius: 12,
                }}>
                  Apply to join <ArrowRight size={15} />
                </Link>
              </div>
              <div style={{ flex: '0 0 auto' }}>
                {[
                  { label: 'Revenue split', value: '80% yours' },
                  { label: 'Payout speed', value: 'Instant' },
                  { label: 'Application', value: 'Free' },
                  { label: 'Content control', value: 'Full' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 32, padding: '11px 0', borderBottom: i < 3 ? '1px solid #1a1a1a' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#555' }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 700 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section style={{ padding: '72px 16px', textAlign: 'center', background: '#000' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16, lineHeight: 1.15 }}>
            You're one message away.
          </h2>
          <p style={{ color: '#555', fontSize: 15, marginBottom: 12, lineHeight: 1.6 }}>
            Join 500,000+ fans who stopped waiting and started talking.
          </p>
          <p style={{ color: '#333', fontSize: 13, marginBottom: 36 }}>Free to start · No credit card · Cancel anytime</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="cta-primary" style={{
              textDecoration: 'none', background: '#fff', color: '#000',
              fontWeight: 800, fontSize: 15, padding: '14px 32px',
              borderRadius: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}>
              Start for free <ArrowRight size={16} />
            </Link>
            <Link to="/explore" className="cta-ghost" style={{
              textDecoration: 'none', border: '1.5px solid #2a2a2a', color: '#aaa',
              fontWeight: 600, fontSize: 15, padding: '14px 28px',
              borderRadius: 14, transition: 'border-color 0.2s',
            }}>
              Browse celebrities
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid #0d0d0d', padding: '40px 16px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 36 }}>

            {/* Brand */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' }}>Starmeet</div>
              <div style={{ fontSize: 13, color: '#444', maxWidth: 220, lineHeight: 1.6 }}>
                Direct access to the celebrities you love.
              </div>
            </div>

            {/* Links — only real pages */}
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              {[
                { title: 'Product', links: [
                  { label: 'Explore', href: '/explore' },
                  { label: 'Feed', href: '/feed' },
                  { label: 'Messages', href: '/messages' },
                ]},
                { title: 'Account', links: [
                  { label: 'Sign up', href: '/signup' },
                  { label: 'Log in', href: '/login' },
                ]},
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>{col.title}</div>
                  {col.links.map(l => (
                    <div key={l.label} style={{ marginBottom: 9 }}>
                      <Link to={l.href} style={{ color: '#555', fontSize: 13, textDecoration: 'none' }}>{l.label}</Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #0d0d0d', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#333' }}>© 2026 Starmeet. All rights reserved.</span>
            <Link to="/admin" style={{ fontSize: 12, color: '#222', textDecoration: 'none' }}>Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
