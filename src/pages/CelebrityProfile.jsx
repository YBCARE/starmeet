import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check, Grid3x3, Play, Info, ChevronLeft, Heart, MessageCircle, X, Share2, MessageSquare, Flame } from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { useAuth } from '../context/AuthContext';
import { getSomeFans, getFakeFans } from '../services/fakeFans';
import { fetchCelebPhotos, fetchCelebBio, dedupePhotoUrls } from '../services/wikiPhotos';
import { useMeta } from '../hooks/useMeta';
import { findCelebrity, celebPath, celebDisplayImage } from '../utils/celebrity';
import CelebImage from '../components/CelebImage';
import './CelebrityProfile.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function ri(min, max, rng) { return min + Math.floor(rng() * (max - min + 1)); }
function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

// ─── Hardcoded real-world follower counts ─────────────────────────────────────
const FOLLOWER_MAP = {
  'Dwayne Johnson':    350_000_000,
  'Beyoncé':          200_000_000,
  'Cristiano Ronaldo':600_000_000,
  'Taylor Swift':     280_000_000,
  'Rihanna':          150_000_000,
  'Ariana Grande':    370_000_000,
  'Kylie Jenner':     400_000_000,
  'Kim Kardashian':   360_000_000,
  'Selena Gomez':     430_000_000,
  'LeBron James':     160_000_000,
  'Neymar':           220_000_000,
  'Lionel Messi':     500_000_000,
  'Drake':            140_000_000,
  'Kevin Hart':        80_000_000,
  'Will Smith':        50_000_000,
  'Leonardo DiCaprio': 55_000_000,
  'Tom Cruise':        45_000_000,
  'Brad Pitt':         40_000_000,
  'Morgan Freeman':    30_000_000,
  'Keanu Reeves':      60_000_000,
  'Johnny Depp':       25_000_000,
  'Jason Momoa':       20_000_000,
  'Can Yaman':         15_000_000,
  'Zendaya':          185_000_000,
  'Margot Robbie':     22_000_000,
  'Billie Eilish':    110_000_000,
  'Bad Bunny':        450_000_000,
  'Shakira':           80_000_000,
  'Adele':             50_000_000,
  'Ed Sheeran':       100_000_000,
  'Justin Bieber':    240_000_000,
  'Katy Perry':       170_000_000,
  'Lady Gaga':        145_000_000,
};

function getFollowerCount(name) {
  const exact = FOLLOWER_MAP[name];
  if (exact) return exact;
  // Partial match
  const key = Object.keys(FOLLOWER_MAP).find(k => name.includes(k) || k.includes(name.split(' ')[0]));
  if (key) return FOLLOWER_MAP[key];
  // Seed-based for everyone else (1M–50M range)
  const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seeded(seed * 31);
  return ri(1_000_000, 50_000_000, rng);
}

// ─── Tributes (memorial accounts) ────────────────────────────────────────────
function loadTributes(celebId) {
  try { return JSON.parse(localStorage.getItem(`sm_tributes_${celebId}`) || '[]'); } catch { return []; }
}
function saveTributes(celebId, arr) {
  localStorage.setItem(`sm_tributes_${celebId}`, JSON.stringify(arr));
}

// ─── Dailymotion video IDs ─────────────────────────────────────────────────────
// 50 real celebrity-related Dailymotion video IDs
const DM_IDS = [
  'x8cv12l','x8jmte8','x7xnqe1','x8k8o8e','x8crzol',
  'x8c8poe','x7yp00e','x8jq9hy','x8l5fco','x8lf9t3',
  'x8bh8oc','x7vl3c7','x8a4d9z','x7skm8v','x8c3xw1',
  'x8dqkmy','x8eo9j3','x7zlczf','x8f8gmy','x8g3cnb',
  'x7t4phl','x8h1bmk','x8i0kp2','x8jk7na','x8kp2nd',
  'x7qv3zl','x8la8te','x8mb2gf','x8nb7cz','x8od5lp',
  'x7r5qyz','x8pa4nt','x8qb6mr','x8ra7kl','x8sb9np',
  'x7s6rxy','x8tc8om','x8ud7pl','x8ve6nk','x8wf5mj',
  'x7u7swv','x8xi4lh','x8yj3kg','x8zk2jf','x90l1ie',
  'x7v8tvt','x91m0hd','x92n9gc','x93o8fb','x94p7ea',
];

const DM_BY_CELEB = {
  'Johnny Depp':       ['x8cv12l','x8jmte8','x7xnqe1'],
  'Keanu Reeves':      ['x8k8o8e','x8crzol','x8c8poe'],
  'Will Smith':        ['x7yp00e','x8jq9hy','x8l5fco'],
  'Tom Cruise':        ['x8lf9t3','x8bh8oc','x7vl3c7'],
  'Beyoncé':           ['x8a4d9z','x7skm8v','x8c3xw1'],
  'Leonardo DiCaprio': ['x8dqkmy','x8eo9j3','x7zlczf'],
  'Morgan Freeman':    ['x8f8gmy','x8g3cnb','x7t4phl'],
  'Dwayne Johnson':    ['x8h1bmk','x8i0kp2','x8jk7na'],
  'Brad Pitt':         ['x8kp2nd','x7qv3zl','x8la8te'],
  'Rihanna':           ['x8mb2gf','x8nb7cz','x8od5lp'],
  'Drake':             ['x7r5qyz','x8pa4nt','x8qb6mr'],
  'Taylor Swift':      ['x8ra7kl','x8sb9np','x7s6rxy'],
};

function getDMIds(celebName) {
  const exact = DM_BY_CELEB[celebName];
  if (exact) return exact;
  const key = Object.keys(DM_BY_CELEB).find(k => celebName.includes(k.split(' ')[0]));
  return key ? DM_BY_CELEB[key] : DM_IDS.slice(0, 3);
}

const POST_CAPS = [
  "Can't believe this is real life. Thank you all ❤️",
  "Behind the scenes of something special 🎬",
  "This is what hard work looks like ✨",
  "New era. New energy. Let's go 🔥",
  "Grateful every single day 🙏",
  "For the fans. Always and forever 👑",
  "This one is personal 🖤",
  "The journey continues 🚀",
  "Living the dream, making it count 💫",
  "To the ones who believed from day one 🌟",
  "No words. Just feeling all of this 😭",
  "The work speaks for itself 💯",
];

// ─── Dailymotion player ───────────────────────────────────────────────────────
function DMPlayer({ dmId }) {
  const [muted, setMuted] = useState(true);
  const src = `https://www.dailymotion.com/embed/video/${dmId}?autoplay=0&mute=1&queue-enable=false&sharing-enable=false&ui-logo=false`;
  return (
    <div style={{ position:'relative', paddingTop:'56.25%', background:'#000' }}>
      <iframe
        key={muted ? 'muted' : 'unmuted'}
        src={muted ? src : src.replace('mute=1','mute=0')}
        title="Celebrity video"
        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
      <button onClick={() => setMuted(m => !m)} style={{
        position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,0.7)',
        border:'1px solid rgba(255,255,255,0.2)', borderRadius:6,
        color:'#fff', fontSize:11, fontWeight:600, padding:'4px 10px',
        cursor:'pointer', fontFamily:'inherit', zIndex:10,
      }}>
        {muted ? '🔇 Tap to unmute' : '🔊 Muted'}
      </button>
    </div>
  );
}

// ─── Grid photo cell ──────────────────────────────────────────────────────────
function GridCell({ post, celebMain, onExpand }) {
  const [src, setSrc] = useState(post.image || celebMain);
  return (
    <div onClick={() => onExpand(post)}
      style={{ position:'relative', aspectRatio:'1', overflow:'hidden', cursor:'pointer', background:'#111' }}>
      <img src={src} alt=""
        style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top center', display:'block' }}
        loading="lazy"
        onError={() => setSrc(celebMain)}
      />
      {post.isVideo && (
        <div style={{ position:'absolute', top:6, right:6 }}>
          <Play size={13} fill="white" color="white" />
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════
export default function CelebrityProfile() {
  const { id } = useParams();
  const { celebrities, loading, phase } = useCelebContext();
  const { isFollowing, toggleFollow, isLiked, toggleLike, user } = useAuth();
  const navigate = useNavigate();

  const celeb = useMemo(() =>
    findCelebrity(celebrities, id), [celebrities, id]);

  const isMemorial = !!celeb?.isMemorial;

  const [tab,            setTab]            = useState('posts');
  const [expandedPost,   setExpandedPost]   = useState(null);
  const [showFollowers,  setShowFollowers]  = useState(false);
  const [wikiBio,        setWikiBio]        = useState('');
  const [gridPhotos,   setGridPhotos]   = useState([]);
  const [photosLoading,setPhotosLoading]= useState(true);
  const [shareCopied,  setShareCopied]  = useState(false);
  const [followPrompt, setFollowPrompt] = useState(false);

  // Tributes state (for memorial accounts)
  const [tributes,     setTributes]     = useState(() => celeb ? loadTributes(celeb.id) : []);
  const [tributeText,  setTributeText]  = useState('');
  const [tributeSent,  setTributeSent]  = useState(false);

  // Dynamic SEO — when you share a celebrity profile link it shows their photo + bio
  useMeta({
    title:       celeb ? `${celeb.name} — ${celeb.category}` : 'Celebrity Profile',
    description: celeb ? `Message ${celeb.name} directly on Starmeet. ${(wikiBio || celeb?.bio || '').slice(0, 100)}` : undefined,
    image:       celeb?.image,
    url:         window.location.href,
  }); // show "message?" after following

  // Fetch real Wikipedia photos + bio
  useEffect(() => {
    if (!celeb) return;
    setPhotosLoading(true);
    setWikiBio('');
    // Fetch photos and bio in parallel
    Promise.all([
      fetchCelebPhotos(celeb.name, 20),
      fetchCelebBio(celeb.name),
    ]).then(([photos, bio]) => {
      setGridPhotos(dedupePhotoUrls(photos));
      if (bio) setWikiBio(bio);
      setPhotosLoading(false);
    }).catch(() => setPhotosLoading(false));
  }, [celeb?.name]);

  const seed = useMemo(() => {
    if (!celeb) return 1;
    return String(celeb.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 1;
  }, [celeb]);

  const fakeFans   = useMemo(() => getSomeFans(9999, seed % 5000), [seed]);
  const followerCount = getFollowerCount(celeb?.name || '');
  const dmIds      = useMemo(() => celeb ? getDMIds(celeb.name) : [], [celeb]);

  // Build grid — one post per unique photo only (never repeat the same image)
  const uniquePhotos = useMemo(() => {
    const merged = dedupePhotoUrls([
      ...gridPhotos,
      ...(celeb?.image ? [celeb.image] : []),
    ]);
    return merged;
  }, [gridPhotos, celeb?.image]);

  const gridPosts = useMemo(() => {
    if (!celeb || !uniquePhotos.length) return [];
    return uniquePhotos.map((image, i) => {
      const r = seeded(seed * 31 + i * 97);
      return {
        id:      `gp_${i}`,
        image,
        isVideo: false,
        likes:   ri(10000, 900000, r),
        commCnt: ri(100, 5000, r),
        caption: POST_CAPS[i % POST_CAPS.length],
        time:    ['1h','3h','8h','1d','2d','4d','1w','2w','3w','1mo','2mo','3mo','4mo','5mo','6mo','8mo','10mo','1y','1.5y','2y'][i] + ' ago',
        comments: getSomeFans(20, seed + i * 13).map((fan, j) => ({
          id: `c${i}_${j}`, user: fan.username, avatar: fan.avatar,
          text: ['Amazing! 🔥','Iconic ❤️','We love you!!','GOAT 👑','This is everything 😭',
            'Been a fan for years ✨','Crying rn fr 😭','Greatest of all time 🐐',
            'You changed my life 💙','LEGEND 👑🔥'][j % 10],
          time: ['1m','5m','12m','1h','2h'][j % 5],
        })),
      };
    });
  }, [celeb, seed, uniquePhotos]);

  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=aaa&size=200`;
  const following = isFollowing(celeb?.id);
  const catalogLoading = loading || (phase !== 'done' && celebrities.length < 300);

  if (!celeb && catalogLoading) {
    return (
      <div style={{ minHeight:'100vh', background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
        <div style={{ width:32, height:32, border:'2px solid #333', borderTopColor:'#0095f6', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
        <div style={{ fontSize:13, color:'#555' }}>Loading profile…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!celeb) {
    return (
      <div className="sm-empty">
        <div className="sm-empty-icon">?</div>
        <h1 className="sm-empty-title">Celebrity not found</h1>
        <p className="sm-empty-text">Try searching in Explore — we have 1,300+ profiles.</p>
        <Link to="/explore" className="sm-btn sm-btn-primary">Browse all stars</Link>
      </div>
    );
  }

  return (
    <div className="sm-celeb-profile">

      {/* Memorial banner */}
      {isMemorial && (
        <div className="sm-celeb-profile-banner" style={{ background:'linear-gradient(90deg,#1a1200,#2a1e00)', borderBottom:'1px solid #3a2e00' }}>
          <span style={{ fontSize:22 }}>🕯️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, color:'#fbbf24', fontWeight:700 }}>In Memory of {celeb.name}</div>
            <div style={{ fontSize:12, color:'#92700a', marginTop:2 }}>This is a memorial account. Messages are not active — but you can leave a tribute below.</div>
          </div>
        </div>
      )}

      {/* Guest banner — shown to non-logged-in visitors (non-memorial only) */}
      {!user && !isMemorial && (
        <div className="sm-celeb-profile-banner" style={{ background:'linear-gradient(90deg,#1e3a5f,#2d1b69)', borderBottom:'1px solid #1a3a6f', justifyContent:'space-between' }}>
          <div>
            <span style={{ fontSize:14, color:'#93c5fd', fontWeight:600 }}>💬 Message {celeb?.name?.split(' ')[0]} directly</span>
            <span style={{ fontSize:13, color:'#6b9fd4', marginLeft:8 }}>— Join free to start a conversation</span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/signup" style={{ padding:'8px 18px', background:'#0095f6', color:'#fff', borderRadius:8, fontWeight:700, fontSize:13, textDecoration:'none' }}>
              Sign up free
            </Link>
            <Link to="/login" style={{ padding:'8px 14px', background:'transparent', color:'#93c5fd', borderRadius:8, fontWeight:600, fontSize:13, textDecoration:'none', border:'1px solid #2a4a7f' }}>
              Log in
            </Link>
          </div>
        </div>
      )}

      {/* Back bar */}
      <div className="sm-celeb-profile-back">
        <Link to="/explore" style={{ color:'#aaa', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, fontSize:14 }}>
          <ChevronLeft size={18} /> Back
        </Link>
      </div>

      <div className="sm-celeb-profile-inner">

        <div className="sm-celeb-profile-header">
          <div className="sm-celeb-profile-top">
            {/* Avatar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:90, height:90, borderRadius:'50%', padding:3, background: isMemorial ? 'linear-gradient(135deg,#92400e,#fbbf24)' : 'linear-gradient(135deg,#0095f6,#8b5cf6)' }}>
                <div style={{ width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden', border:'3px solid #000', filter: isMemorial ? 'grayscale(0.4)' : 'none' }}>
                  <CelebImage celeb={celeb} alt={celeb.name} px={440}
                    style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 22%' }}
                  />
                </div>
              </div>
              {isMemorial ? (
                <div style={{ position:'absolute', bottom:2, right:2, width:22, height:22, borderRadius:'50%', background:'#92400e', border:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
                  🕯️
                </div>
              ) : (
                <div style={{ position:'absolute', bottom:2, right:2, width:22, height:22, borderRadius:'50%', background:'#0095f6', border:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={11} strokeWidth={3} color="white" />
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ flex:1 }}>
              <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:3 }}>{celeb.name}</div>
              <div style={{ fontSize:12, color:'#0095f6', fontWeight:600, marginBottom:10 }}>{celeb.category}</div>
              <div className="sm-celeb-profile-stats">
                {[
                  { label:'Posts',     val: photosLoading ? '…' : String(uniquePhotos.length || 0), onClick: null },
                  { label:'Followers', val: fmtNum(followerCount + (following ? 1 : 0)), onClick: () => setShowFollowers(true) },
                  { label:'Following', val: fmtNum(ri(200, 800, seeded(seed + 5))),       onClick: null },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', cursor: s.onClick ? 'pointer' : 'default' }}
                    onClick={s.onClick || undefined}>
                    <div style={{ fontSize:16, fontWeight:700, color: s.onClick ? '#60a5fa' : '#fff', textDecoration: s.onClick ? 'underline' : 'none', textUnderlineOffset:2 }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'#555' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="sm-celeb-profile-actions">
                <button onClick={() => {
                  const wasFollowing = following;
                  toggleFollow(celeb.id);
                  if (!wasFollowing && !isMemorial) {
                    setFollowPrompt(true);
                    setTimeout(() => setFollowPrompt(false), 8000);
                  }
                }} style={{
                  flex:1, padding:'9px 0', border:'none', borderRadius:8,
                  background: following ? '#1a1a1a' : (isMemorial ? '#92400e' : '#0095f6'),
                  color: following ? '#aaa' : '#fff',
                  fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
                  outline: following ? '1px solid #333' : 'none',
                  transition:'all 0.15s',
                }}>
                  {following ? 'Following ✓' : (isMemorial ? '🕯️ Follow Memory' : 'Follow')}
                </button>

                {/* Message button — hidden for memorial accounts */}
                {!isMemorial && (
                  <button onClick={() => navigate(`/messages?with=celeb_${celeb.id}`)}
                    style={{ flex:1, padding:'9px 0', border:'1px solid #333', borderRadius:8, background:'transparent', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    Message
                  </button>
                )}

                {/* Leave Tribute button — only for memorial */}
                {isMemorial && (
                  <button onClick={() => setTab('tributes')}
                    style={{ flex:1, padding:'9px 0', border:'1px solid #92400e', borderRadius:8, background:'transparent', color:'#fbbf24', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                    Leave a Tribute
                  </button>
                )}

                {/* Share button */}
                <button onClick={() => {
                  navigator.clipboard?.writeText(window.location.href).catch(() => {});
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2000);
                }} style={{
                  width:38, padding:'9px 0', border:'1px solid #333', borderRadius:8,
                  background:'transparent', color: shareCopied ? '#22c55e' : '#666',
                  fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'color 0.15s', flexShrink:0,
                }} title="Copy link">
                  <Share2 size={15} />
                </button>
              </div>

              {/* Post-follow CTA (non-memorial only) */}
              {followPrompt && !isMemorial && (
                <div style={{
                  marginTop:10, padding:'12px 14px', background:'#0f1e3a',
                  border:'1px solid #0095f640', borderRadius:10,
                  display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
                }}>
                  <div style={{ fontSize:13, color:'#93c5fd' }}>
                    🎉 You're following <strong style={{ color:'#fff' }}>{celeb.name}</strong>! Send them a message?
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={() => navigate(`/messages?with=celeb_${celeb.id}`)} style={{
                      padding:'7px 14px', background:'#0095f6', border:'none', borderRadius:7,
                      color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                    }}>Message ✉️</button>
                    <button onClick={() => setFollowPrompt(false)} style={{
                      background:'none', border:'none', cursor:'pointer', color:'#555', padding:'4px 6px',
                    }}><X size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Short bio under header — use Wikipedia text if loaded, else celeb.bio */}
          {(wikiBio || celeb.bio) && (
            <p style={{ fontSize:13, color:'#999', lineHeight:1.6, marginBottom:14, paddingBottom:14, borderBottom:'1px solid #111' }}>
              {(wikiBio || celeb.bio).slice(0, 260)}
              {(wikiBio || celeb.bio).length > 260 ? (
                <span style={{ color:'#0095f6', cursor:'pointer', marginLeft:4 }} onClick={() => setTab('about')}>…more</span>
              ) : ''}
            </p>
          )}

          {/* Followers preview strip */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ display:'flex' }}>
              {fakeFans.slice(0, 6).map((fan, i) => (
                <Link key={fan.id} to={`/fan/${fan.id}`}>
                  <img src={fan.avatar} alt={fan.username}
                    style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #000', marginLeft: i > 0 ? -8 : 0, objectFit:'cover' }}
                  />
                </Link>
              ))}
            </div>
            <span style={{ fontSize:12, color:'#666', cursor:'pointer' }} onClick={() => setShowFollowers(true)}>
              Followed by{' '}
              <span style={{ color:'#aaa', fontWeight:600 }}>{fakeFans[0]?.username}</span>{' '}
              and{' '}
              <span style={{ color:'#60a5fa', fontWeight:600, textDecoration:'underline', textUnderlineOffset:2 }}>
                {fmtNum(followerCount - 1)} others
              </span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderTop:'1px solid #111', borderBottom:'1px solid #111', marginBottom:2 }}>
          {[
            { key:'posts',    icon:<Grid3x3 size={15} />,  label:'Posts'    },
            { key:'videos',   icon:<Play size={15} />,     label:'Videos'   },
            { key:'about',    icon:<Info size={15} />,     label:'About'    },
            ...(isMemorial ? [{ key:'tributes', icon:<span style={{fontSize:14}}>🕯️</span>, label:'Tributes' }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              padding:'12px 0', border:'none', background:'transparent',
              color: tab === t.key ? (isMemorial && t.key === 'tributes' ? '#fbbf24' : '#fff') : '#555',
              fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              borderBottom: tab === t.key ? `2px solid ${isMemorial && t.key === 'tributes' ? '#fbbf24' : '#fff'}` : '2px solid transparent',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Posts grid ── */}
        {tab === 'posts' && (
          <>
            {photosLoading && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
                {[...Array(12)].map((_,i) => (
                  <div key={i} style={{ aspectRatio:'1', background:'linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite' }} />
                ))}
              </div>
            )}
            {!photosLoading && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2 }}>
                {gridPosts.map(p => (
                  <GridCell key={p.id} post={p} celebMain={celebDisplayImage(celeb, 640)} onExpand={setExpandedPost} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Videos tab ── */}
        {tab === 'videos' && (
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:16 }}>
            {dmIds.map((dmId, i) => (
              <div key={dmId} style={{ borderRadius:12, overflow:'hidden', background:'#0a0a0a', border:'1px solid #1a1a1a' }}>
                <DMPlayer dmId={dmId} />
                <div style={{ padding:'10px 14px' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>
                    {celeb.name} — {['Full Interview','Behind the Scenes','Live Moments','Fan Q&A'][i % 4]}
                  </div>
                  <div style={{ fontSize:11, color:'#555', marginTop:3 }}>
                    {fmtNum(ri(200000, 8000000, seeded(seed + i * 31)))} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── About tab ── */}
        {tab === 'about' && (
          <div style={{ padding:'20px 16px' }}>

            {/* Wikipedia bio card */}
            <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14, padding:20, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>About {celeb.name}</h3>
                <span style={{ fontSize:11, color:'#555', background:'#111', border:'1px solid #222', borderRadius:4, padding:'2px 7px' }}>Wikipedia</span>
              </div>

              {/* Loading skeleton */}
              {!wikiBio && photosLoading && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {[100,85,92,78,90,60].map((w,i) => (
                    <div key={i} style={{ height:12, background:'#1a1a1a', borderRadius:4, width:`${w}%`, animation:'shimmer 1.4s ease-in-out infinite' }} />
                  ))}
                </div>
              )}

              {/* Real Wikipedia text */}
              {(wikiBio || !photosLoading) && (
                <div style={{ fontSize:14, color:'#aaa', lineHeight:1.8 }}>
                  {(wikiBio || celeb.bio || `${celeb.name} is a world-renowned ${celeb.category?.toLowerCase()} celebrated for their extraordinary talent and global influence.`)
                    .split('\n\n')
                    .filter(p => p.trim().length > 20)
                    .map((para, i) => (
                      <p key={i} style={{ marginBottom:12 }}>{para.trim()}</p>
                    ))
                  }
                  {wikiBio && (
                    <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(celeb.name)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:12, color:'#0095f6', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>
                      Read full article on Wikipedia ↗
                    </a>
                  )}
                </div>
              )}

              {/* Quick facts */}
              <div style={{ marginTop:16, borderTop:'1px solid #111' }}>
                {[
                  { label:'Category',  val: celeb.category },
                  { label:'Followers', val: fmtNum(followerCount), click: () => setShowFollowers(true) },
                  { label:'Verified',  val: '✓ ID verified by Starmeet' },
                ].map(r => (
                  <div key={r.label} onClick={r.click}
                    style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #111', cursor: r.click ? 'pointer' : 'default' }}>
                    <span style={{ fontSize:13, color:'#555' }}>{r.label}</span>
                    <span style={{ fontSize:13, color: r.click ? '#60a5fa' : '#ccc', fontWeight:600 }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Followers preview */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Followers</h3>
              <button onClick={() => setShowFollowers(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#0095f6', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
                See all {fmtNum(followerCount)} →
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              {fakeFans.slice(0, 20).map(fan => (
                <Link key={fan.id} to={`/fan/${fan.id}`}
                  style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', padding:'9px 0', borderBottom:'1px solid #0d0d0d' }}>
                  <img src={fan.avatar} alt={fan.username}
                    style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{fan.name}</div>
                    <div style={{ fontSize:11, color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>@{fan.username} · {fan.bio}</div>
                  </div>
                  <span style={{ fontSize:11, color:'#0095f6', fontWeight:600, flexShrink:0 }}>View →</span>
                </Link>
              ))}
              <button onClick={() => setShowFollowers(true)} style={{
                width:'100%', padding:'12px 0', marginTop:8,
                background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:10,
                color:'#0095f6', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>
                View all {fmtNum(followerCount)} followers
              </button>
            </div>
          </div>
        )}

        {/* ── Tributes tab (memorial accounts only) ── */}
        {tab === 'tributes' && isMemorial && (
          <div style={{ padding:'20px 16px' }}>

            {/* Leave tribute form */}
            <div style={{ background:'#0d0800', border:'1px solid #3a2e00', borderRadius:16, padding:20, marginBottom:24 }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#fbbf24', marginBottom:6 }}>🕯️ Leave a tribute</h3>
              <p style={{ fontSize:13, color:'#92700a', marginBottom:14, margin:'0 0 14px' }}>
                Share a memory, a thank you, or what {celeb.name} meant to you.
              </p>
              <textarea
                value={tributeText}
                onChange={e => setTributeText(e.target.value)}
                maxLength={300}
                placeholder={`What did ${celeb.name} mean to you?`}
                style={{
                  width:'100%', minHeight:90, background:'#111', border:'1px solid #3a2e00',
                  borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13,
                  fontFamily:'Inter,sans-serif', resize:'vertical', outline:'none',
                  boxSizing:'border-box', lineHeight:1.6,
                }}
              />
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
                <span style={{ fontSize:11, color:'#444' }}>{tributeText.length}/300</span>
                <button
                  disabled={!tributeText.trim()}
                  onClick={() => {
                    if (!tributeText.trim()) return;
                    const newTribute = {
                      id: Date.now(),
                      name: user?.name || user?.username || 'Anonymous fan',
                      avatar: user?.avatar || `https://ui-avatars.com/api/?name=Fan&background=1a1a1a&color=aaa&size=80`,
                      text: tributeText.trim(),
                      time: 'Just now',
                      ts: Date.now(),
                    };
                    const updated = [newTribute, ...tributes];
                    setTributes(updated);
                    saveTributes(celeb.id, updated);
                    setTributeText('');
                    setTributeSent(true);
                    setTimeout(() => setTributeSent(false), 3000);
                  }}
                  style={{
                    padding:'9px 20px', background: tributeText.trim() ? '#92400e' : '#1a1a1a',
                    border:'none', borderRadius:8, color: tributeText.trim() ? '#fbbf24' : '#444',
                    fontSize:13, fontWeight:700, cursor: tributeText.trim() ? 'pointer' : 'not-allowed',
                    fontFamily:'inherit', transition:'all 0.15s',
                  }}>
                  Post tribute 🕯️
                </button>
              </div>
              {tributeSent && (
                <div style={{ marginTop:10, padding:'10px 14px', background:'#1a1200', border:'1px solid #92400e', borderRadius:8, fontSize:13, color:'#fbbf24' }}>
                  ✨ Your tribute has been shared. Thank you for remembering {celeb.name}.
                </div>
              )}
            </div>

            {/* Tribute count */}
            <div style={{ fontSize:13, color:'#555', marginBottom:14 }}>
              {tributes.length > 0 ? `${tributes.length} tribute${tributes.length !== 1 ? 's' : ''} left` : 'Be the first to leave a tribute.'}
            </div>

            {/* Tributes list */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {tributes.map(t => (
                <div key={t.id} style={{ background:'#080500', border:'1px solid #2a1e00', borderRadius:14, padding:'14px 16px' }}>
                  <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <img src={t.avatar} alt={t.name}
                      style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}
                      onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1a1a1a&color=aaa&size=80`; }}
                    />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#d97706' }}>{t.name}</span>
                        <span style={{ fontSize:11, color:'#444' }}>{t.time}</span>
                      </div>
                      <p style={{ fontSize:13, color:'#bbb', lineHeight:1.65, margin:0 }}>{t.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {tributes.length === 0 && (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#333' }}>
                  <div style={{ fontSize:36, marginBottom:12 }}>🕯️</div>
                  <div style={{ fontSize:14, color:'#444' }}>No tributes yet. Be the first to share a memory.</div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Followers modal ── */}
      {showFollowers && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:1100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowFollowers(false)}>
          <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:'20px 20px 0 0', width:'100%', maxWidth:600, maxHeight:'85vh', display:'flex', flexDirection:'column' }}
            onClick={e => e.stopPropagation()}>
            {/* Handle + header */}
            <div style={{ padding:'12px 16px 0', textAlign:'center' }}>
              <div style={{ width:36, height:4, background:'#333', borderRadius:2, margin:'0 auto 14px' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>
                  Followers · {fmtNum(followerCount)}
                </h3>
                <button onClick={() => setShowFollowers(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:4, lineHeight:0 }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* Scrollable fan list — 1,000 fans */}
            <div style={{ overflowY:'auto', flex:1, padding:'0 16px 24px' }}>
              {getFakeFans(10000).slice(0, 1000).map(fan => (
                <Link key={fan.id} to={`/fan/${fan.id}`} onClick={() => setShowFollowers(false)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #0d0d0d', textDecoration:'none' }}>
                  <img src={fan.avatar} alt={fan.username}
                    style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{fan.name}</div>
                    <div style={{ fontSize:11, color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>@{fan.username} · {fan.bio}</div>
                  </div>
                  <span style={{ fontSize:11, color:'#0095f6', fontWeight:600, flexShrink:0 }}>View →</span>
                </Link>
              ))}
              <div style={{ textAlign:'center', padding:'14px 0', color:'#444', fontSize:12 }}>
                Showing 1,000 of {fmtNum(followerCount)} followers
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded post modal */}
      {expandedPost && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.94)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setExpandedPost(null)}>
          <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, width:'100%', maxWidth:480, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderBottom:'1px solid #111' }}>
              <img src={celeb.image} alt={celeb.name}
                style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
                onError={e => { e.currentTarget.src = av(celeb.name); }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{celeb.name}</div>
                <div style={{ fontSize:11, color:'#555' }}>{expandedPost.time}</div>
              </div>
              <button onClick={() => setExpandedPost(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:4, lineHeight:0 }}>
                <X size={20} />
              </button>
            </div>
            <img src={expandedPost.image || celeb.image} alt=""
              style={{ width:'100%', aspectRatio:'1', objectFit:'cover', objectPosition:'top center', display:'block' }}
              onError={e => { e.currentTarget.src = celeb.image; }} />
            <div style={{ padding:'10px 14px', fontSize:13, color:'#bbb', borderBottom:'1px solid #111' }}>{expandedPost.caption}</div>
            <div style={{ padding:'8px 14px', display:'flex', gap:14, alignItems:'center', borderBottom:'1px solid #111' }}>
              <button onClick={() => toggleLike(expandedPost.id)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, padding:0, color: isLiked(expandedPost.id) ? '#e05252' : '#666', fontFamily:'inherit' }}>
                <Heart size={18} fill={isLiked(expandedPost.id) ? '#e05252' : 'none'} color={isLiked(expandedPost.id) ? '#e05252' : '#666'} />
                <span style={{ fontSize:12, fontWeight:600 }}>{fmtNum(expandedPost.likes)}</span>
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:5, color:'#666' }}>
                <MessageCircle size={18} color="#666" />
                <span style={{ fontSize:12, fontWeight:600 }}>{fmtNum(expandedPost.commCnt)}</span>
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'6px 14px' }}>
              {expandedPost.comments.map(cm => (
                <div key={cm.id} style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid #0f0f0f' }}>
                  <img src={cm.avatar} alt={cm.user}
                    style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, objectFit:'cover' }}
                    onError={e => { e.currentTarget.src = av(cm.user); }} />
                  <div>
                    <span style={{ fontSize:12, fontWeight:700, color:'#aaa' }}>{cm.user} </span>
                    <span style={{ fontSize:12, color:'#ccc' }}>{cm.text}</span>
                    <div style={{ fontSize:10, color:'#444', marginTop:2 }}>{cm.time} ago</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
    </div>
  );
}
