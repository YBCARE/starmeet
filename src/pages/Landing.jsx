import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Check, Star, Zap, Shield, MessageCircle, ChevronRight,
} from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { celebrities as STATIC_CELEBS } from '../data/celebrities';
import { celebPath, pickCategoryCeleb, celebDisplayImage } from '../utils/celebrity';
import Navbar from '../components/Navbar';
import './Landing.css';

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
  const all = celebList?.length ? celebList : STATIC_CELEBS;
  return CATEGORY_DEFS.map(def => {
    const celeb = pickCategoryCeleb(all, def);
    return {
      label: def.label,
      match: def.match,
      name:  celeb?.name  || def.label,
      image: celeb ? celebDisplayImage(celeb, 512) : null,
      id:    celeb?.id    || null,
    };
  });
}

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

  useEffect(() => {
    if (visible === DEMO_CONVO.length) {
      const t = setTimeout(() => setVisible(0), 3000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const av = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=818cf8&size=100&bold=true`;

  return (
    <div className="landing-chat">
      <div className="landing-chat-head">
        <img src={celebImg || av(celebName)} alt={celebName}
          onError={e => { e.currentTarget.src = av(celebName); }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{celebName}</span>
            <span className="landing-verified"><Check size={7} strokeWidth={3.5} color="white" /></span>
          </div>
          <div className="landing-chat-online">Online now</div>
        </div>
        <span className="landing-chat-pro">Pro Member</span>
      </div>

      <div className="landing-chat-body">
        {DEMO_CONVO.slice(0, visible).map((msg, i) =>
          msg.from === 'fan' ? (
            <div key={i} className={`landing-bubble landing-bubble-${msg.from}`}>{msg.text}</div>
          ) : (
            <div key={i} className="landing-chat-row">
              <img src={celebImg || av(celebName)} alt=""
                onError={e => { e.currentTarget.src = av(celebName); }} />
              <div className={`landing-bubble landing-bubble-${msg.from}`}>{msg.text}</div>
            </div>
          )
        )}
        {typing && (
          <div className="landing-chat-row">
            <img src={celebImg || av(celebName)} alt=""
              onError={e => { e.currentTarget.src = av(celebName); }} />
            <div className="landing-bubble landing-bubble-celeb" style={{ display: 'flex', gap: 4, padding: '12px 16px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#555',
                  animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="landing-chat-foot">
        <div className="landing-chat-input">Message {celebName}...</div>
        <div className="landing-chat-send"><ArrowRight size={16} color="white" /></div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, sub, features, cta, ctaLink, featured, badge }) {
  return (
    <div className={`landing-price-card${featured ? ' featured' : ''}`}>
      {badge && <span className="landing-price-badge">{badge}</span>}
      <div className="landing-price-tier">{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className="landing-price-amount">{price}</span>
        {sub && <span className="landing-price-sub">{sub}</span>}
      </div>
      <div className="landing-price-divider" />
      <ul className="landing-price-features">
        {features.map((f, i) => (
          <li key={i} className={f.dim ? 'dim' : ''}>
            <Check size={14} color={f.dim ? '#444' : (featured ? '#a78bfa' : 'var(--sm-accent)')} style={{ flexShrink: 0, marginTop: 2 }} />
            {f.text}
          </li>
        ))}
      </ul>
      <Link to={ctaLink} className="landing-price-cta">{cta}</Link>
    </div>
  );
}

export default function Landing() {
  const { celebrities } = useCelebContext();
  const navigate        = useNavigate();
  const [query, setQuery] = useState('');
  const categories      = buildCategories(celebrities);

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
    <div className="landing">
      <Navbar />

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-grid" aria-hidden="true" />
        <div className="landing-hero-inner">
          <div>
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              1,300+ celebrities active now
            </div>

            <h1>
              Your message.{' '}
              <span className="landing-hero-accent">Their reply.</span>
              <br />
              No PR. No bots.
            </h1>

            <p className="landing-hero-lead">
              DM the actor, athlete or musician you actually care about — and get a real reply back.
              Over <strong style={{ color: 'var(--sm-text)' }}>500,000 fans</strong> have already had the conversation they thought was impossible.
            </p>

            <form className="landing-hero-search" onSubmit={handleSearch}>
              <Search size={18} color="var(--sm-text-faint)" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search Beyoncé, Keanu Reeves, Ronaldo..."
                aria-label="Search celebrities"
              />
              <button type="submit" className="sm-btn sm-btn-primary" style={{ padding: '10px 18px', borderRadius: 10 }}>
                Search
              </button>
            </form>

            <div className="landing-hero-actions">
              <Link to="/signup" className="sm-btn sm-btn-white" style={{ padding: '14px 28px', fontSize: 15 }}>
                Start for free <ArrowRight size={16} />
              </Link>
              <Link to="/explore" className="sm-btn sm-btn-ghost" style={{ padding: '14px 24px', fontSize: 15 }}>
                Browse celebrities
              </Link>
            </div>

            <div className="landing-hero-proof">
              <div className="landing-avatar-stack" aria-hidden="true">
                {['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e'].map((bg, i) => (
                  <span key={i} style={{ background: bg }}>{['K', 'A', 'M', 'J', 'R'][i]}</span>
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--sm-text-muted)' }}>
                <strong style={{ color: 'var(--sm-text-secondary)' }}>500,000+</strong> fans already connected
              </span>
            </div>
          </div>

          <div className="landing-hero-visual">
            {demoCell && (
              <ChatDemo celebName={demoCell.name || 'Dwayne Johnson'} celebImg={demoCell.image} />
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="landing-stats">
        <div className="landing-stats-inner">
          {[
            { value: '1,300+', label: 'Verified celebrities' },
            { value: '500K+',  label: 'Active fans' },
            { value: '2.4M',   label: 'Messages sent' },
            { value: '98%',    label: 'Reply rate (Pro)' },
          ].map(s => (
            <div key={s.label} className="landing-stat">
              <div className="landing-stat-value">{s.value}</div>
              <div className="landing-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="landing-section-tight">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <h2>Browse by category</h2>
            <Link to="/explore" className="landing-link-muted">
              All categories <ChevronRight size={14} />
            </Link>
          </div>
        </div>
        <div className="landing-wrap">
          <div className="landing-categories-scroll">
            {categories.map((cat, idx) => {
              const fallback = av(cat.name);
              return (
                <Link key={cat.label + idx} to={`/explore?cat=${cat.match}`} className="landing-cat-item">
                  <div className="landing-cat-ring">
                    <div className="landing-cat-ring-inner">
                      <img src={cat.image || fallback} alt={cat.name}
                        loading="lazy" decoding="async"
                        onError={e => { e.currentTarget.src = fallback; }} />
                    </div>
                  </div>
                  <span className="landing-cat-label">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section className="landing-section-tight">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <div>
              <h2>Trending now</h2>
              <p>Most messaged celebrities this week</p>
            </div>
            <Link to="/explore" className="landing-link-muted">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="landing-trend-scroll">
            {(trending.length ? trending : [...Array(8)]).map((c, i) => {
              const isReal = !!c?.name;
              return (
                <div
                  key={isReal ? c.id : i}
                  className="landing-trend-card"
                  onClick={() => isReal && navigate(celebPath(c))}
                  onKeyDown={e => isReal && e.key === 'Enter' && navigate(celebPath(c))}
                  role={isReal ? 'button' : undefined}
                  tabIndex={isReal ? 0 : undefined}
                >
                  <div className="landing-trend-img">
                    {isReal ? (
                      <>
                        <img src={c.image} alt={c.name}
                          onError={e => { e.currentTarget.src = av(c.name); }} />
                        <span className="landing-trend-badge">
                          <MessageCircle size={10} color="var(--sm-accent)" />
                          DM open
                        </span>
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', animation: 'pulse 1.5s ease-in-out infinite', background: 'var(--sm-bg-surface)' }} />
                    )}
                  </div>
                  {isReal ? (
                    <>
                      <div className="landing-trend-name">
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        <span className="landing-verified"><Check size={7} strokeWidth={3.5} color="white" /></span>
                      </div>
                      <div className="landing-trend-cat">{c.category}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ height: 11, background: 'var(--sm-bg-surface)', borderRadius: 4, width: '80%', marginBottom: 5 }} />
                      <div style={{ height: 9, background: 'var(--sm-bg-elevated)', borderRadius: 4, width: '55%' }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-center-head">
            <h2>Three steps to your favourite celebrity</h2>
            <p>No middleman. No PR team. No auto-replies.</p>
          </div>
          <div className="landing-steps">
            {[
              { icon: <Search size={22} color="var(--sm-accent)" />, step: '01', title: 'Find who you love', body: 'Search 1,300+ verified celebrities. Actors, musicians, athletes, creators. Every one of them real.' },
              { icon: <Zap size={22} color="#a78bfa" />, step: '02', title: 'Send your message', body: 'Follow for free or go Pro to unlock direct DMs, exclusive content, and monthly live Q&As.' },
              { icon: <MessageCircle size={22} color="var(--sm-success)" />, step: '03', title: 'They actually reply', body: '98% of Pro messages get a reply within 24 hours. Real words from the person you admire.' },
            ].map(s => (
              <div key={s.step} className="landing-step">
                <div className="landing-step-top">
                  <div className="landing-step-icon">{s.icon}</div>
                  <span className="landing-step-num">{s.step}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-center-head">
            <h2>Fans who couldn&apos;t believe it</h2>
            <p>Real moments between real people.</p>
          </div>
          <div className="landing-testimonials">
            {[
              { quote: "I sent a message on a Tuesday night not expecting anything. By Wednesday morning they had replied with a full paragraph. I actually cried.", name: 'Amara O.', tag: 'Messaged a Grammy-winning musician', avatar: 'AO', color: '#7c3aed' },
              { quote: "Been a fan for 15 years. Thought stuff like this only happened to influencers. Then I got a 'thank you for sticking around' and my week was made.", name: 'Daniel K.', tag: 'Messaged his favourite actor', avatar: 'DK', color: 'var(--sm-accent)' },
              { quote: "My daughter is obsessed with a pop star. I got her a Pro account for her birthday. When she got a reply she literally screamed. Worth every penny.", name: 'Sarah M.', tag: 'Pro member since 2025', avatar: 'SM', color: 'var(--sm-success)' },
            ].map(t => (
              <div key={t.name} className="landing-quote">
                <div className="landing-quote-stars">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={13} color="#f59e0b" fill="#f59e0b" />
                  ))}
                </div>
                <p className="landing-quote-text">&ldquo;{t.quote}&rdquo;</p>
                <div className="landing-quote-author">
                  <div className="landing-quote-avatar" style={{ background: `${t.color}22`, color: t.color, border: `1.5px solid ${t.color}44` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--sm-text-faint)', marginTop: 2 }}>{t.tag}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="landing-section landing-pricing-bg">
        <div className="landing-wrap">
          <div className="landing-center-head">
            <h2>Simple, honest pricing</h2>
            <p>Free forever to browse and follow. Pay only when you want to talk.</p>
          </div>
          <div className="landing-pricing-grid">
            <PricingCard
              name="Fan"
              price="Free"
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
              featured
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

      {/* For celebrities */}
      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-celeb-block">
            <div className="landing-celeb-grid">
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="landing-badge" style={{ marginBottom: 20 }}>
                  <Shield size={12} color="#a78bfa" />
                  For celebrities & public figures
                </div>
                <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.15 }}>
                  Your fanbase.<br />Your revenue.
                </h2>
                <p style={{ color: 'var(--sm-text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
                  Join 1,300+ verified celebrities earning directly from fans with zero middleman. Monetise who you already are.
                </p>
                <Link to="/signup" className="sm-btn" style={{ background: 'var(--sm-pro)', color: '#fff', padding: '13px 26px' }}>
                  Apply to join <ArrowRight size={15} />
                </Link>
              </div>
              <div className="landing-celeb-stats">
                {[
                  { label: 'Revenue split', value: '80% yours' },
                  { label: 'Payout speed', value: 'Instant' },
                  { label: 'Application', value: 'Free' },
                  { label: 'Content control', value: 'Full' },
                ].map(item => (
                  <div key={item.label} className="landing-celeb-stat-row">
                    <span style={{ color: 'var(--sm-text-muted)' }}>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-final">
        <h2>You&apos;re one message away.</h2>
        <p>Join 500,000+ fans who stopped waiting and started talking.</p>
        <p className="landing-final-note">Free to start · No credit card · Cancel anytime</p>
        <div className="landing-final-actions">
          <Link to="/signup" className="sm-btn sm-btn-white" style={{ padding: '14px 32px', fontSize: 15 }}>
            Start for free <ArrowRight size={16} />
          </Link>
          <Link to="/explore" className="sm-btn sm-btn-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
            Browse celebrities
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-wrap">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <div className="sm-logo">Starmeet</div>
              <p>Direct access to the celebrities you love.</p>
            </div>
            <div className="landing-footer-cols">
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
                { title: 'Legal', links: [
                  { label: 'Terms', href: '/terms' },
                  { label: 'Privacy', href: '/privacy' },
                ]},
              ].map(col => (
                <div key={col.title} className="landing-footer-col">
                  <h4>{col.title}</h4>
                  {col.links.map(l => (
                    <Link key={l.label} to={l.href}>{l.label}</Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>© 2026 Starmeet. All rights reserved.</span>
            <div className="landing-footer-legal">
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
              <Link to="/admin">Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
