import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Heart, Users } from 'lucide-react';
import { getFakeFans } from '../services/fakeFans';
import { useCelebContext } from '../context/CelebContext';
import { celebPath } from '../utils/celebrity';
import CelebImage from '../components/CelebImage';
import './Profile.css';

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function ri(min, max, rng) { return min + Math.floor(rng() * (max - min + 1)); }
function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}

const POST_CAPS = [
  'Just saw this and I am not okay 😭❤️',
  'The greatest of all time. No debate 🐐',
  'Living for this content every day 🔥',
  'Obsessed and I\'m not sorry 💅',
  'This made my entire week better ✨',
  'Can\'t stop rewatching this 💀',
];

export default function FanProfile() {
  const { fanId } = useParams();
  const { celebrities } = useCelebContext();

  const fanIndex = parseInt(fanId?.replace('fan_', '') || '0');
  const allFans  = useMemo(() => getFakeFans(), []);
  const fan      = allFans[fanIndex] || allFans[0];

  const rng = useMemo(() => seeded(fanIndex * 7919 + 1337), [fanIndex]);

  const followCount  = ri(5, 12, seeded(fanIndex * 31));
  const followedCelebs = useMemo(() => {
    if (!celebrities.length) return [];
    const r = seeded(fanIndex * 53);
    const picks = new Set();
    while (picks.size < Math.min(followCount, celebrities.length)) {
      picks.add(Math.floor(r() * celebrities.length));
    }
    return [...picks].map(i => celebrities[i]);
  }, [celebrities, fanIndex, followCount]);

  const likedPosts = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const r  = seeded(fanIndex * 41 + i * 97);
      const ci = Math.floor(r() * Math.max(1, celebrities.length));
      const celeb = celebrities[ci] || null;
      return {
        id:     `lp_${i}`,
        celeb,
        image:  celeb ? celebDisplayImage(celeb, 480) : `https://picsum.photos/seed/fp${fanIndex + i}/300/300`,
        cap:    POST_CAPS[i % POST_CAPS.length],
        likes:  ri(10000, 500000, r),
      };
    });
  }, [celebrities, fanIndex]);

  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=aaa&size=200`;

  if (!fan) {
    return (
      <div className="sm-profile" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--sm-text-faint)' }}>
        Fan not found — <Link to="/explore" style={{ color:'var(--sm-accent)', marginLeft:8 }}>Browse celebrities</Link>
      </div>
    );
  }

  return (
    <div className="sm-profile">
      <div className="sm-profile-bar">
        <button type="button" onClick={() => history.back()} className="sm-profile-back">
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      <div className="sm-profile-wrap">
        <div className="sm-profile-card">
          <img src={fan.avatar} alt={fan.username} className="sm-profile-avatar" />
          <div className="sm-profile-name">{fan.name}</div>
          <div className="sm-profile-handle">@{fan.username}</div>
          <p className="sm-profile-bio">{fan.bio}</p>

          <div className="sm-profile-stats">
            {[
              { icon:<Users size={13}/>,  label:'Following', val: followCount    },
              { icon:<Heart size={13}/>,  label:'Likes',     val: ri(12, 200, seeded(fanIndex)) },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div className="sm-profile-stat-val">{s.val}</div>
                <div className="sm-profile-stat-label">
                  <span style={{ color:'var(--sm-text-faint)' }}>{s.icon}</span>{s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="sm-profile-section">Following</h2>
        {followedCelebs.length === 0 ? (
          <div className="sm-profile-empty">Loading celebrities...</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
            {followedCelebs.map(c => (
              <Link key={c.id} to={celebPath(c)} className="sm-profile-follow-row">
                <CelebImage celeb={c} alt={c.name} px={440} />
                <div style={{ flex:1 }}>
                  <div className="sm-profile-follow-name">{c.name}</div>
                  <div className="sm-profile-follow-cat">{c.category}</div>
                </div>
                <span className="sm-profile-follow-link">View →</span>
              </Link>
            ))}
          </div>
        )}

        <h2 className="sm-profile-section">Liked Posts</h2>
        <div className="sm-profile-grid">
          {likedPosts.map(p => (
            <div key={p.id} className="sm-profile-grid-item">
              <img
                src={p.image}
                alt=""
                loading="lazy"
                decoding="async"
                onError={e => { e.currentTarget.src = av(p.celeb?.name || 'fan'); }}
              />
              <div className="sm-profile-grid-overlay">
                <Heart size={11} fill="#e05252" color="#e05252" />
                <span style={{ fontSize:10, color:'#fff', fontWeight:600 }}>{fmtNum(p.likes)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
