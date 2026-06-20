import { useState, useMemo } from 'react';
import { Search, Check, Users, TrendingUp, Zap, Clock, ArrowUpDown, X } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useCelebContext } from '../context/CelebContext';
import { useAuth } from '../context/AuthContext';
import { celebPath } from '../utils/celebrity';
import CelebImage from '../components/CelebImage';

const CATS = ['All','Actor','Actress','Musician','Director','Movie Producer','Comedian','Model','Athlete','Creator'];

// Deterministic "activity" signal per celebrity — makes each one feel alive
const ACTIVITY_LABELS = [
  'Posted today', 'Posted 2h ago', 'Posted 4h ago', 'Active today',
  'Posted yesterday', 'Posted 2d ago', 'Posted 3d ago', 'Active this week',
];
const HOT_THRESHOLDS = { trending: 0.15, active: 0.45, recent: 0.72, replyFast: 0.25 }; // fraction of celebs

function seededRand(seed) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return (s >>> 0) / 0xffffffff;
}

function getCelebMeta(c, index) {
  const r1 = seededRand(index * 31 + 7);
  const r2 = seededRand(index * 53 + 13);
  const r3 = seededRand(index * 73 + 17);
  const activityLabel = ACTIVITY_LABELS[Math.floor(r1 * ACTIVITY_LABELS.length)];
  const isTrending    = r2 < HOT_THRESHOLDS.trending;
  const isActive      = !isTrending && r2 < HOT_THRESHOLDS.active;
  const isNew         = !isTrending && !isActive && r2 < HOT_THRESHOLDS.recent;
  const isReplyFast   = r3 < HOT_THRESHOLDS.replyFast; // "Replying fast today"
  return { activityLabel, isTrending, isActive, isNew, isReplyFast };
}

function fmtNum(n) {
  if (!n) return '0';
  if (typeof n === 'string') return n;
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000)     return (n/1_000).toFixed(0)+'K';
  return String(n);
}

function CelebCard({ c, index }) {
  const { isFollowing, toggleFollow } = useAuth();
  const following = isFollowing(c.id);
  const meta = useMemo(() => getCelebMeta(c, index), [c.id, index]);

  return (
    <div className="sm-card card-glow" style={{ cursor:'pointer', position:'relative' }}>
      <Link to={celebPath(c)} style={{ textDecoration:'none', display:'block' }}>
        <div style={{ aspectRatio:'3/4', overflow:'hidden', background:'#111', position:'relative' }}>
          <CelebImage celeb={c} px={440} alt={c.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 22%', display:'block' }}
          />
          {/* Gradient */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'58%', background:'linear-gradient(to top,rgba(0,0,0,0.95) 0%,transparent 100%)' }} />

          {/* Trending badge */}
          {meta.isTrending && (
            <div style={{ position:'absolute', top:8, left:8, background:'linear-gradient(90deg,#7c3aed,#ec4899)', borderRadius:999, padding:'3px 9px', display:'flex', alignItems:'center', gap:3 }}>
              <TrendingUp size={10} color="white" />
              <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>Trending</span>
            </div>
          )}

          {/* New badge */}
          {meta.isNew && !meta.isTrending && (
            <div style={{ position:'absolute', top:8, left:8, background:'#22c55e', borderRadius:999, padding:'3px 9px' }}>
              <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>New</span>
            </div>
          )}

          {/* Replying fast badge — hidden for memorial */}
          {meta.isReplyFast && !c.isMemorial && (
            <div style={{ position:'absolute', bottom:38, left:8, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', borderRadius:999, padding:'3px 8px', display:'flex', alignItems:'center', gap:4, border:'1px solid rgba(34,197,94,0.4)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
              <span style={{ fontSize:9, fontWeight:700, color:'#22c55e' }}>Replying fast today</span>
            </div>
          )}

          {/* Memorial candle badge */}
          {c.isMemorial && (
            <div style={{ position:'absolute', bottom:38, left:8, background:'rgba(20,12,0,0.85)', backdropFilter:'blur(6px)', borderRadius:999, padding:'3px 8px', display:'flex', alignItems:'center', gap:4, border:'1px solid rgba(251,191,36,0.4)' }}>
              <span style={{ fontSize:10 }}>🕯️</span>
              <span style={{ fontSize:9, fontWeight:700, color:'#fbbf24' }}>In Memory</span>
            </div>
          )}

          {/* Verified badge */}
          <div style={{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:'50%', background: c.isMemorial ? '#92400e' : '#0095f6', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: c.isMemorial ? '0 2px 8px rgba(146,64,14,0.5)' : '0 2px 8px rgba(0,149,246,0.5)' }}>
            {c.isMemorial ? <span style={{ fontSize:11 }}>🕯️</span> : <Check size={11} strokeWidth={3} color="white" />}
          </div>

          {/* Name + category + activity */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 10px 10px' }}>
            <div style={{ fontSize:13, fontWeight:700, color: c.isMemorial ? '#fbbf24' : '#fff', lineHeight:1.2 }}>{c.name}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{c.category}</div>
            {!c.isMemorial && (
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background: meta.isTrending ? '#ec4899' : meta.isActive ? '#22c55e' : '#555', flexShrink:0 }} />
                <span style={{ fontSize:10, color: meta.isTrending ? '#ec4899' : meta.isActive ? '#22c55e' : '#444' }}>
                  {meta.activityLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Footer */}
      <div style={{ padding:'8px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:4, color:'#555', fontSize:11 }}>
          <Users size={11} />{fmtNum(c.followers)}
        </div>
        <button onClick={() => toggleFollow(c.id)} style={{
          fontSize:11, padding:'5px 13px', borderRadius:999,
          background: following ? '#1a1a1a' : '#0095f6',
          color:      following ? '#777'    : '#fff',
          border:     following ? '1px solid #333' : 'none',
          fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          transition:'all 0.15s',
        }}>
          {following ? 'Following' : 'Follow'}
        </button>
      </div>
    </div>
  );
}

// Horizontal scrolling celeb row (used for Trending / New sections)
function CelebRow({ celebrities, label, icon, labelColor }) {
  const { isFollowing, toggleFollow } = useAuth();
  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=aaa&size=300`;

  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        {icon}
        <span style={{ fontSize:15, fontWeight:800, color: labelColor || '#fff' }}>{label}</span>
      </div>
      <div style={{ display:'flex', gap:12, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4 }}>
        {celebrities.map((c, i) => {
          const following = isFollowing(c.id);
          return (
            <div key={c.id} style={{ flexShrink:0, width:130 }}>
              <Link to={celebPath(c)} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ width:130, height:170, borderRadius:12, overflow:'hidden', background:'#111', position:'relative', marginBottom:8 }}>
                  <CelebImage celeb={c} alt={c.name} px={440}
                    style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 22%' }}
                  />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 60%)' }} />
                  <div style={{ position:'absolute', bottom:8, left:8, right:8 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#fff', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  </div>
                </div>
              </Link>
              <button onClick={() => toggleFollow(c.id)} style={{
                width:'100%', padding:'5px 0', borderRadius:8,
                background: following ? '#1a1a1a' : '#0095f6',
                color:      following ? '#666' : '#fff',
                border:     following ? '1px solid #222' : 'none',
                fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>
                {following ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Explore() {
  const { celebrities, loading, fetched } = useCelebContext();
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [cat,   setCat]   = useState(searchParams.get('cat') || 'All');
  const [sort,  setSort]  = useState('default'); // 'default' | 'followers' | 'newest' | 'active'
  const [showSort, setShowSort] = useState(false);

  // Trending = first 15% by seeded score, New = last joined slice
  const { trendingCelebs, newCelebs } = useMemo(() => {
    if (!celebrities.length) return { trendingCelebs: [], newCelebs: [] };
    const scored  = celebrities.map((c, i) => ({ c, score: seededRand(i * 31 + 7) }));
    const trending = scored.filter(s => s.score < HOT_THRESHOLDS.trending).slice(0, 12).map(s => s.c);
    const newOnes  = celebrities.slice(-10).reverse(); // last added = newest
    return { trendingCelebs: trending, newCelebs: newOnes };
  }, [celebrities]);

  const filtered = useMemo(() => {
    let result = celebrities.filter(c => {
      const matchCat = cat === 'All'
        || c.category?.toLowerCase() === cat.toLowerCase()
        || c.category?.toLowerCase().includes(cat.toLowerCase().replace(/s$/,''));
      const q = query.toLowerCase();
      const matchQ = !q
        || c.name.toLowerCase().includes(q)
        || c.category?.toLowerCase().includes(q)
        || c.bio?.toLowerCase().includes(q);
      return matchCat && matchQ;
    });

    // Sort
    if (sort === 'followers') {
      result = [...result].sort((a, b) => {
        const toNum = s => parseFloat(String(s).replace('M','000000').replace('K','000')) || 0;
        return toNum(b.followers) - toNum(a.followers);
      });
    } else if (sort === 'active') {
      result = [...result].sort((a, i) => seededRand(celebrities.indexOf(a) * 31 + 7) - 0.5);
    } else if (sort === 'newest') {
      result = [...result].reverse();
    }

    return result.slice(0, 200);
  }, [celebrities, cat, query, sort]);

  const catCounts = useMemo(() => {
    const counts = {};
    celebrities.forEach(c => {
      const key = c.category || 'Other';
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [celebrities]);

  const SORT_OPTIONS = [
    { value:'default',   label:'Default' },
    { value:'followers', label:'Most followers' },
    { value:'active',    label:'Most active' },
    { value:'newest',    label:'Newest' },
  ];

  const isSearching = query.length > 0 || cat !== 'All';

  return (
    <div style={{ background:'#000', minHeight:'100vh', color:'#fff', fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px 16px 60px' }}>

        {/* Title */}
        <div style={{ marginBottom:20 }}>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#fff', marginBottom:4, letterSpacing:'-0.5px' }}>Explore</h1>
          <div style={{ fontSize:13, color:'#444' }}>
            {loading ? 'Loading celebrities…' : `${fetched.toLocaleString()} verified celebrities`}
          </div>
        </div>

        {/* Search + sort row */}
        <div style={{ display:'flex', gap:10, marginBottom:14 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:10, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:12, padding:'11px 16px' }}>
            <Search size={17} color="#555" style={{ flexShrink:0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, category or bio..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:14, color:'#fff', fontFamily:'inherit' }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:0, lineHeight:0 }}>
                <X size={15}/>
              </button>
            )}
          </div>

          {/* Sort button */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowSort(s=>!s)} style={{
              background: sort !== 'default' ? '#1e3a5f' : '#0d0d0d',
              border: `1px solid ${sort !== 'default' ? '#0095f6' : '#1a1a1a'}`,
              borderRadius:12, padding:'11px 14px', cursor:'pointer', color: sort !== 'default' ? '#60a5fa' : '#666',
              display:'flex', alignItems:'center', gap:6, fontFamily:'inherit', fontWeight:600, fontSize:13,
            }}>
              <ArrowUpDown size={15}/>
              <span>Sort</span>
            </button>
            {showSort && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:12, minWidth:170, zIndex:100, overflow:'hidden' }}>
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => { setSort(o.value); setShowSort(false); }}
                    style={{ width:'100%', padding:'11px 14px', background: sort===o.value ? '#1a2a3a' : 'transparent', border:'none', cursor:'pointer', color: sort===o.value ? '#60a5fa' : '#aaa', fontSize:13, fontWeight: sort===o.value ? 700 : 400, textAlign:'left', fontFamily:'inherit' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category pills with counts */}
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:24, scrollbarWidth:'none' }}>
          {CATS.map(c => {
            const count = c === 'All' ? celebrities.length : (catCounts[c] || 0);
            return (
              <button key={c} onClick={() => setCat(c)} style={{
                flexShrink:0, padding:'6px 14px', borderRadius:999, fontSize:13, fontWeight:600,
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                background: cat === c ? '#0095f6' : '#0d0d0d',
                color:      cat === c ? '#fff'    : '#555',
                border:     cat === c ? 'none'    : '1px solid #1a1a1a',
                display:'flex', alignItems:'center', gap:5,
              }}>
                {c}
                {count > 0 && <span style={{ fontSize:10, opacity:0.7 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Trending + New sections — only when not filtering */}
        {!isSearching && celebrities.length > 0 && (
          <>
            <CelebRow
              celebrities={trendingCelebs}
              label="Trending this week"
              icon={<TrendingUp size={16} color="#ec4899" />}
              labelColor="#fff"
            />
            <CelebRow
              celebrities={newCelebs}
              label="Just joined"
              icon={<Zap size={16} color="#22c55e" />}
              labelColor="#fff"
            />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontSize:15, fontWeight:800, color:'#fff' }}>All celebrities</span>
              <span style={{ fontSize:12, color:'#444' }}>{celebrities.length.toLocaleString()} total</span>
            </div>
          </>
        )}

        {/* Results count when filtering */}
        {isSearching && (
          <div style={{ fontSize:13, color:'#555', marginBottom:14 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {query ? ` for "${query}"` : ''}
            {cat !== 'All' ? ` in ${cat}` : ''}
          </div>
        )}

        {/* Grid */}
        {celebrities.length === 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
            {[...Array(16)].map((_,i) => (
              <div key={i} style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:14, overflow:'hidden' }}>
                <div style={{ aspectRatio:'3/4', background:'#111' }} />
                <div style={{ padding:10 }}>
                  <div style={{ height:11, background:'#1a1a1a', borderRadius:5, width:'75%', marginBottom:6 }} />
                  <div style={{ height:9,  background:'#141414', borderRadius:5, width:'50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#555' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#888', marginBottom:6 }}>No results found</div>
            <div style={{ fontSize:13 }}>Try a different name or category</div>
            <button onClick={() => { setQuery(''); setCat('All'); }} style={{ marginTop:16, background:'#1a1a1a', border:'1px solid #222', borderRadius:10, color:'#aaa', fontSize:13, padding:'8px 18px', cursor:'pointer', fontFamily:'inherit' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
            {filtered.map((c, i) => <CelebCard key={c.id} c={c} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
