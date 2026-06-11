import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Heart, Users } from 'lucide-react';
import { getFakeFans } from '../services/fakeFans';
import { useCelebContext } from '../context/CelebContext';

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

  // Parse fan index from id string "fan_N"
  const fanIndex = parseInt(fanId?.replace('fan_', '') || '0');
  const allFans  = useMemo(() => getFakeFans(), []);
  const fan      = allFans[fanIndex] || allFans[0];

  const rng = useMemo(() => seeded(fanIndex * 7919 + 1337), [fanIndex]);

  // Pick 5–12 celebrities this fan follows
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

  // Generate 6 liked posts (each shows a celeb photo + caption)
  const likedPosts = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const r  = seeded(fanIndex * 41 + i * 97);
      const ci = Math.floor(r() * Math.max(1, celebrities.length));
      const celeb = celebrities[ci] || null;
      return {
        id:     `lp_${i}`,
        celeb,
        image:  celeb?.image || `https://picsum.photos/seed/fp${fanIndex + i}/300/300`,
        cap:    POST_CAPS[i % POST_CAPS.length],
        likes:  ri(10000, 500000, r),
      };
    });
  }, [celebrities, fanIndex]);

  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=aaa&size=200`;

  if (!fan) {
    return (
      <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}>
        Fan not found — <Link to="/explore" style={{ color:'#3b82f6', marginLeft:8 }}>Browse celebrities</Link>
      </div>
    );
  }

  return (
    <div style={{ background:'#000', minHeight:'100vh', color:'#fff', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Back */}
      <div style={{ position:'sticky', top:56, zIndex:40, background:'#000', borderBottom:'1px solid #111', padding:'10px 14px' }}>
        <button onClick={() => history.back()} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', display:'inline-flex', alignItems:'center', gap:4, fontSize:14, fontFamily:'inherit' }}>
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      <div style={{ maxWidth:540, margin:'0 auto', padding:'20px 16px 60px' }}>

        {/* Fan header card */}
        <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, padding:20, marginBottom:20, textAlign:'center' }}>
          <img src={fan.avatar} alt={fan.username}
            style={{ width:80, height:80, borderRadius:'50%', objectFit:'cover', margin:'0 auto 12px', display:'block', border:'3px solid #1a1a1a' }}
          />
          <div style={{ fontSize:18, fontWeight:700, color:'#fff', marginBottom:4 }}>{fan.name}</div>
          <div style={{ fontSize:13, color:'#555', marginBottom:8 }}>@{fan.username}</div>
          <div style={{ fontSize:13, color:'#888', lineHeight:1.6, marginBottom:16, maxWidth:340, margin:'0 auto 16px' }}>{fan.bio}</div>

          {/* Stats */}
          <div style={{ display:'flex', justifyContent:'center', gap:32, paddingTop:14, borderTop:'1px solid #111' }}>
            {[
              { icon:<Users size={13}/>,  label:'Following', val: followCount    },
              { icon:<Heart size={13}/>,  label:'Likes',     val: ri(12, 200, seeded(fanIndex)) },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'#555', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ color:'#444' }}>{s.icon}</span>{s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Following */}
        <h2 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'#fff' }}>Following</h2>
        {followedCelebs.length === 0 ? (
          <div style={{ color:'#555', fontSize:13, marginBottom:20 }}>Loading celebrities...</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
            {followedCelebs.map(c => (
              <Link key={c.id} to={`/celebrity/${c.id}`} style={{ display:'flex', alignItems:'center', gap:12, background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, padding:'10px 14px', textDecoration:'none' }}>
                <img src={c.image} alt={c.name}
                  style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', objectPosition:'top', flexShrink:0 }}
                  onError={e => { e.currentTarget.src = av(c.name); }}
                />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{c.name}</div>
                  <div style={{ fontSize:11, color:'#555' }}>{c.category}</div>
                </div>
                <span style={{ fontSize:11, color:'#3b82f6', fontWeight:600 }}>View →</span>
              </Link>
            ))}
          </div>
        )}

        {/* Liked posts grid */}
        <h2 style={{ fontSize:15, fontWeight:700, marginBottom:12, color:'#fff' }}>Liked Posts</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
          {likedPosts.map(p => (
            <div key={p.id} style={{ position:'relative', aspectRatio:'1', overflow:'hidden', background:'#111', borderRadius:4 }}>
              <img
                src={p.image}
                alt=""
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top', display:'block' }}
                loading="lazy"
                onError={e => { e.currentTarget.src = av(p.celeb?.name || 'fan'); }}
              />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent)', padding:'6px 6px 5px', display:'flex', alignItems:'center', gap:3 }}>
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
