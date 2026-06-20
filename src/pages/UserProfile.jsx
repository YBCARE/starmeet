// Full Instagram-style fan profile for the logged-in user OR any fan by ID
import { useState, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Camera, Edit2, Grid3x3, Heart, MessageCircle, LogOut, Check, ChevronLeft, Plus, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFanPosts } from '../context/FanPostContext';
import { useCelebContext } from '../context/CelebContext';
import { celebPath, celebDisplayImage } from '../utils/celebrity';
import './Profile.css';

function fmtNum(n) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000)     return (n/1_000).toFixed(0)+'K';
  return String(n);
}

function EditProfileModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({ name: user.name||'', username: user.username||'', bio: user.bio||'', location: user.location||'' });
  const coverRef  = useRef(null);
  const avatarRef = useRef(null);
  const [avatar, setAvatar]   = useState(user.avatar);
  const [cover,  setCover]    = useState(user.coverPhoto);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const readFile = (e, cb) => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>cb(ev.target.result); r.readAsDataURL(f); };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, width:'100%', maxWidth:440, maxHeight:'90vh', overflow:'auto' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #111', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>Edit Profile</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:20 }}>
          {/* Cover photo */}
          <div style={{ position:'relative', height:90, background:'#111', borderRadius:10, overflow:'hidden', marginBottom:40, cursor:'pointer' }} onClick={()=>coverRef.current?.click()}>
            {cover && <img src={cover} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)' }}>
              <Camera size={20} color="#fff" />
            </div>
            <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>readFile(e,setCover)} />
            {/* Avatar over cover */}
            <div style={{ position:'absolute', bottom:-30, left:20, width:60, height:60, borderRadius:'50%', border:'3px solid #0a0a0a', overflow:'hidden', background:'#222', cursor:'pointer' }}
              onClick={e=>{e.stopPropagation();avatarRef.current?.click();}}>
              {avatar ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Camera size={16} color="#666"/></div>}
              <input ref={avatarRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>readFile(e,setAvatar)} />
            </div>
          </div>

          {[['name','Display name'],['username','Username'],['bio','Bio'],['location','Location']].map(([k,ph]) => (
            k==='bio'
              ? <textarea key={k} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph} rows={3}
                  style={{ width:'100%', background:'#111', border:'1px solid #222', borderRadius:8, padding:'10px 12px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', resize:'vertical', marginBottom:10, boxSizing:'border-box' }} />
              : <input key={k} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={ph}
                  style={{ width:'100%', background:'#111', border:'1px solid #222', borderRadius:8, padding:'10px 12px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', marginBottom:10, boxSizing:'border-box', display:'block' }} />
          ))}

          <button onClick={()=>onSave({...form, avatar, coverPhoto:cover})} style={{
            width:'100%', padding:12, background:'#0095f6', border:'none', borderRadius:10,
            color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
          }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { fanId } = useParams(); // if undefined → own profile
  const { user, logout, updateProfile, getFanById, isFanFollowing, toggleFanFollow, getFanFollowers, fanFollows, follows, celebFollows, isPro, upgradeToPro } = useAuth();
  const { getPostsByUser, fanPosts } = useFanPosts();
  const { celebrities } = useCelebContext();
  const navigate = useNavigate();

  // Determine whose profile we're viewing
  const isOwnProfile = !fanId || fanId === user?.id;
  const profileUser  = isOwnProfile ? user : getFanById(fanId);

  const [editing,      setEditing]      = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);

  // Followed celebrities for own profile
  const followedCelebs = useMemo(() => {
    if (!isOwnProfile || !celebrities.length || !celebFollows?.length) return [];
    return celebrities.filter(c => celebFollows.includes(c.id));
  }, [celebrities, isOwnProfile, celebFollows]);

  if (!profileUser) {
    return (
      <div style={{ minHeight:'100vh', background:'#000', display:'flex', alignItems:'center', justifyContent:'center', color:'#555', flexDirection:'column', gap:10 }}>
        <div style={{ fontSize:32 }}>👤</div>
        <div>User not found</div>
        <Link to="/explore" style={{ color:'#0095f6', textDecoration:'none' }}>Go to Explore</Link>
      </div>
    );
  }

  const posts          = getPostsByUser(profileUser.id);
  const followingCount = isOwnProfile ? (follows.length + fanFollows.length) : (getFanFollowers(profileUser.id));
  const followersCount = isOwnProfile ? getFanFollowers(user?.id) : getFanFollowers(profileUser.id);
  const following      = !isOwnProfile && isFanFollowing(profileUser.id);

  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n||'Fan')}&background=1a1a1a&color=aaa&size=200&bold=true`;

  function handleSave(updates) {
    updateProfile(updates);
    setEditing(false);
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="sm-profile">

      {/* Back bar (for other profiles) */}
      {!isOwnProfile && (
        <div style={{ position:'sticky', top:56, zIndex:40, background:'#000', borderBottom:'1px solid #111', padding:'10px 14px' }}>
          <button onClick={()=>navigate(-1)} style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontSize:14, fontFamily:'inherit' }}>
            <ChevronLeft size={18} /> Back
          </button>
        </div>
      )}

      <div style={{ maxWidth:620, margin:'0 auto', paddingBottom:80 }}>

        {/* Cover photo */}
        <div style={{ height:160, background: profileUser.coverPhoto ? `url(${profileUser.coverPhoto}) center/cover` : 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', position:'relative' }}>
          {isOwnProfile && (
            <button onClick={() => setEditing(true)} style={{ position:'absolute', bottom:12, right:12, background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:12, fontWeight:600, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
              <Camera size={13} /> Edit cover
            </button>
          )}
        </div>

        {/* Avatar + header */}
        <div style={{ padding:'0 16px', marginTop:-40, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:12 }}>
            {/* Avatar */}
            <div style={{ position:'relative' }}>
              <div style={{ width:80, height:80, borderRadius:'50%', border:'4px solid #000', overflow:'hidden', background:'#1a1a1a' }}>
                <img src={profileUser.avatar || av(profileUser.name || profileUser.username)} alt=""
                  style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              {isOwnProfile && (
                <button onClick={() => setEditing(true)} style={{ position:'absolute', bottom:0, right:0, width:24, height:24, borderRadius:'50%', background:'#0095f6', border:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', border:'none' }}>
                  <Camera size={11} color="white" />
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:8 }}>
              {isOwnProfile ? (
                <>
                  <button onClick={() => setEditing(true)} style={{ padding:'8px 16px', background:'#1a1a1a', border:'1px solid #333', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                    <Edit2 size={13} /> Edit profile
                  </button>
                  <button onClick={handleLogout} style={{ padding:'8px 14px', background:'#1a1a1a', border:'1px solid #333', borderRadius:8, color:'#888', fontSize:13, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                    <LogOut size={13} /> Log out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => toggleFanFollow(profileUser.id)} style={{ padding:'8px 20px', background: following ? '#1a1a1a' : '#0095f6', border: following ? '1px solid #333' : 'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    {following ? 'Following' : 'Follow'}
                  </button>
                  <Link to={`/messages`} style={{ padding:'8px 14px', background:'#1a1a1a', border:'1px solid #333', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center' }}>
                    Message
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Name + username + bio */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:18, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>
              {profileUser.name || profileUser.username}
              {isOwnProfile && isPro && (
                <span className="pro-badge" style={{ fontSize:11, fontWeight:800, letterSpacing:'0.05em' }}>⭐ PRO</span>
              )}
            </div>
            <div style={{ fontSize:13, color:'#555', marginBottom:6 }}>@{profileUser.username}</div>
            {profileUser.bio && <div style={{ fontSize:14, color:'#aaa', lineHeight:1.55, marginBottom:6 }}>{profileUser.bio}</div>}
            {profileUser.location && <div style={{ fontSize:12, color:'#555' }}>📍 {profileUser.location}</div>}
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:28 }}>
            {[
              { label:'Posts',     val: posts.length },
              { label:'Followers', val: followersCount },
              { label:'Following', val: isOwnProfile ? (follows.length + fanFollows.length) : 0 },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:17, fontWeight:700, color:'#fff' }}>{fmtNum(s.val)}</div>
                <div style={{ fontSize:11, color:'#555' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade to Pro banner (own profile, not pro) */}
        {isOwnProfile && !isPro && (
          <div style={{ padding:'0 16px 12px' }}>
            <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2d1b69)', border:'1px solid #2a4a7f', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:2 }}>⭐ Upgrade to Pro</div>
                <div style={{ fontSize:11, color:'#93c5fd' }}>Unlimited messages with any celebrity</div>
              </div>
              <button onClick={() => upgradeToPro('pro')} style={{ padding:'8px 16px', background:'#0095f6', border:'none', borderRadius:8, color:'#fff', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                $9/mo
              </button>
            </div>
          </div>
        )}

        {/* Create post button (own profile) */}
        {isOwnProfile && (
          <div style={{ padding:'0 16px 16px' }}>
            <Link to="/create-post" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'11px', background:'#0d0d0d', border:'1px dashed #333', borderRadius:12,
              color:'#888', textDecoration:'none', fontSize:14, fontWeight:500,
            }}>
              <Plus size={18} /> Create new post
            </Link>
          </div>
        )}

        {/* Divider */}
        <div style={{ borderTop:'1px solid #111', display:'flex', justifyContent:'center', padding:'12px 0', marginBottom:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#fff' }}>
            <Grid3x3 size={15} /> Posts
          </div>
        </div>

        {/* Grid */}
        {posts.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 16px', color:'#555' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📷</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#888', marginBottom:8 }}>No posts yet</div>
            {isOwnProfile && (
              <Link to="/create-post" style={{ color:'#0095f6', textDecoration:'none', fontSize:14 }}>Share your first post →</Link>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2 }}>
            {posts.map(p => (
              <div key={p.id} onClick={() => setExpandedPost(p)}
                style={{ aspectRatio:'1', overflow:'hidden', cursor:'pointer', background:'#111', position:'relative' }}>
                {p.media ? (
                  <img src={p.media} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:11, color:'#555', padding:8, textAlign:'center' }}>{p.caption?.slice(0,40)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Following celebrities section (own profile) */}
      {isOwnProfile && (
        <div style={{ padding:'24px 16px 0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:14, fontWeight:700, color:'#fff' }}>
              <Star size={15} color="#f59e0b" fill="#f59e0b" /> Following
            </div>
            <Link to="/explore" style={{ fontSize:12, color:'#0095f6', textDecoration:'none', fontWeight:600 }}>Discover more →</Link>
          </div>
          {followedCelebs.length === 0 ? (
            <div style={{ background:'#0a0a0a', border:'1px dashed #222', borderRadius:12, padding:'24px 16px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>⭐</div>
              <div style={{ fontSize:14, color:'#555', marginBottom:12 }}>You're not following anyone yet</div>
              <Link to="/explore" style={{ display:'inline-block', padding:'9px 20px', background:'#0095f6', color:'#fff', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none' }}>
                Find celebrities to follow
              </Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {followedCelebs.slice(0, 8).map(c => (
                <Link key={c.id} to={celebPath(c)} style={{ display:'flex', alignItems:'center', gap:12, background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, padding:'10px 14px', textDecoration:'none' }}>
                  <img src={celebDisplayImage(c, 256)} alt={c.name}
                    style={{ width:42, height:42, borderRadius:'50%', objectFit:'cover', objectPosition:'center 22%', flexShrink:0 }}
                    onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=111&color=aaa&size=200`; }}
                  />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#555' }}>{c.category}</div>
                  </div>
                  <Link to={`/messages?with=celeb_${c.id}`} onClick={e => e.stopPropagation()} style={{ fontSize:11, color:'#0095f6', fontWeight:600, background:'#0095f618', borderRadius:6, padding:'4px 10px', textDecoration:'none', whiteSpace:'nowrap' }}>
                    Message
                  </Link>
                </Link>
              ))}
              {followedCelebs.length > 8 && (
                <Link to="/explore" style={{ textAlign:'center', padding:'10px', fontSize:13, color:'#555', textDecoration:'none', borderTop:'1px solid #111', marginTop:4 }}>
                  +{followedCelebs.length - 8} more — View all on Explore
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      {editing && isOwnProfile && (
        <EditProfileModal user={user} onSave={handleSave} onClose={() => setEditing(false)} />
      )}

      {/* Expanded post modal */}
      {expandedPost && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setExpandedPost(null)}>
          <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, width:'100%', maxWidth:460, overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            {expandedPost.media && (
              <img src={expandedPost.media} alt="" style={{ width:'100%', maxHeight:400, objectFit:'cover', display:'block' }} />
            )}
            <div style={{ padding:'12px 16px' }}>
              <div style={{ fontSize:13, color:'#ccc', lineHeight:1.6 }}>{expandedPost.caption}</div>
              {expandedPost.taggedCelebs?.length > 0 && (
                <div style={{ fontSize:12, color:'#0095f6', marginTop:6 }}>
                  Tagged: {expandedPost.taggedCelebs.join(', ')}
                </div>
              )}
              {expandedPost.location && <div style={{ fontSize:12, color:'#555', marginTop:4 }}>📍 {expandedPost.location}</div>}
              <div style={{ fontSize:11, color:'#444', marginTop:8 }}>{new Date(expandedPost.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
