import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Star, Film, MessageCircle, Heart,
  Video, Settings, LogOut, Search, Plus, Trash2, Edit2, Check,
  ToggleLeft, ToggleRight, ChevronRight, X, Upload, Eye, EyeOff,
  Save, RefreshCw, AlertTriangle, BarChart2, Shield, Send,
} from 'lucide-react';
import { useCelebContext } from '../context/CelebContext';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useFanPosts } from '../context/FanPostContext';
import {
  loadAll, saveAll, appendMessage, updateConvoStatus, uid as msUid,
  setHumanTakeover, syncAllConvosFromFirestore, subscribeToAllConvos, isAutoReplyEnabled,
} from '../services/messageStore';
import './Admin.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  if (n >= 1_000)     return (n/1_000).toFixed(0)+'K';
  return String(n);
}

const CATEGORIES = ['Actor','Actress','Musician','Director','Movie Producer','Comedian','Model','Athlete','Creator','Presenter','Author'];

const s = { // shared inline styles
  card:    { background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:12, padding:20 },
  input:   { width:'100%', background:'#111', border:'1px solid #222', borderRadius:8, padding:'9px 12px', color:'#fff', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box', display:'block' },
  label:   { fontSize:12, color:'#666', fontWeight:600, marginBottom:5, display:'block' },
  btn:     (bg='#0095f6') => ({ background:bg, border:'none', borderRadius:8, color:'#fff', fontSize:13, fontWeight:600, padding:'9px 16px', cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6 }),
  btnGhost:{ background:'transparent', border:'1px solid #222', borderRadius:8, color:'#888', fontSize:13, padding:'8px 14px', cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 },
};

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin() {
  const { adminLogin } = useAdmin();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [showP, setShowP] = useState(false);
  const [err, setErr] = useState('');

  function submit(e) {
    e.preventDefault();
    const res = adminLogin(u, p);
    if (res.error) setErr(res.error);
  }

  return (
    <div className="sm-admin-login">
      <div className="sm-admin-login-card">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <div className="sm-admin-login-icon">
            <Shield size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>Admin Panel</div>
            <div style={{ fontSize:12, color:'#555' }}>Starmeet Control Center</div>
          </div>
        </div>

        {err && <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', borderRadius:8, padding:'9px 12px', marginBottom:14, fontSize:13, color:'#e05252' }}>{err}</div>}

        <form onSubmit={submit}>
          <label style={s.label}>Username</label>
          <input value={u} onChange={e=>setU(e.target.value)} required style={{ ...s.input, marginBottom:12 }} />
          <label style={s.label}>Password</label>
          <div style={{ position:'relative', marginBottom:16 }}>
            <input type={showP?'text':'password'} value={p} onChange={e=>setP(e.target.value)} required style={{ ...s.input, paddingRight:40 }} />
            <button type="button" onClick={()=>setShowP(x=>!x)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#555', lineHeight:0 }}>
              {showP ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
          <button type="submit" style={{ ...s.btn(), width:'100%', justifyContent:'center', padding:12 }}>Sign In as Admin</button>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { key:'dashboard',   label:'Dashboard',   icon:LayoutDashboard },
  { key:'celebrities', label:'Celebrities', icon:Star },
  { key:'posts',       label:'Posts',       icon:Film },
  { key:'likes',       label:'Likes',       icon:Heart },
  { key:'comments',    label:'Comments',    icon:MessageCircle },
  { key:'videos',      label:'Videos',      icon:Video },
  { key:'fans',        label:'Fans',        icon:Users },
  { key:'messages',    label:'Messages',    icon:MessageCircle },
  { key:'settings',    label:'Settings',    icon:Settings },
];

function Sidebar({ active, setActive, onLogout }) {
  return (
    <div style={{ width:220, flexShrink:0, background:'#050505', borderRight:'1px solid #111', display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0 }}>
      <div style={{ padding:'20px 16px 14px', borderBottom:'1px solid #111' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'#0095f6', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={15} color="white" />
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>Admin Panel</div>
            <div style={{ fontSize:10, color:'#555' }}>Starmeet</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:'10px 8px', overflowY:'auto' }}>
        {NAV.map(n => (
          <button key={n.key} onClick={()=>setActive(n.key)} style={{
            width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8,
            background: active===n.key ? '#1a1a1a' : 'transparent',
            border:'none', color: active===n.key ? '#fff' : '#666', cursor:'pointer',
            fontSize:13, fontWeight: active===n.key ? 600 : 400, textAlign:'left',
            fontFamily:'inherit', marginBottom:2,
          }}>
            <n.icon size={16} /> {n.label}
          </button>
        ))}
      </nav>
      <div style={{ padding:'10px 8px', borderTop:'1px solid #111' }}>
        <button onClick={onLogout} style={{ ...s.btnGhost, width:'100%', justifyContent:'center', color:'#e05252' }}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ celebrities, fans, fanPosts, adminPosts, overrides }) {
  const liveCelebs = celebrities.filter(c => !overrides[c.id]?._deleted);
  const totalLikes = [...fanPosts, ...adminPosts].reduce((a,p)=>a+(p.likes||0),0);

  const stats = [
    { label:'Total Celebrities', val: fmtNum(liveCelebs.length), icon:Star,          color:'#0095f6', sub:'Wikipedia + admin added' },
    { label:'Registered Fans',   val: fmtNum(fans.length),       icon:Users,         color:'#8b5cf6', sub:'Active accounts' },
    { label:'Total Posts',       val: fmtNum(fanPosts.length + adminPosts.length), icon:Film, color:'#10b981', sub:'Fan + admin posts' },
    { label:'Total Likes',       val: fmtNum(totalLikes),        icon:Heart,         color:'#e05252', sub:'Across all posts' },
  ];

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>Dashboard</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14, marginBottom:28 }}>
        {stats.map(st => (
          <div key={st.label} style={{ ...s.card }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${st.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <st.icon size={18} color={st.color} />
              </div>
              <span style={{ fontSize:12, color:'#555', fontWeight:500 }}>{st.label}</span>
            </div>
            <div style={{ fontSize:28, fontWeight:800, color:'#fff', marginBottom:2 }}>{st.val}</div>
            <div style={{ fontSize:11, color:'#555' }}>{st.sub}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', marginBottom:12 }}>Quick Actions</h2>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          { label:'Add Celebrity', color:'#0095f6', icon:Plus },
          { label:'Create Post',   color:'#8b5cf6', icon:Film },
          { label:'View Fans',     color:'#10b981', icon:Users },
          { label:'Settings',      color:'#f59e0b', icon:Settings },
        ].map(a => (
          <button key={a.label} style={{ ...s.btn(a.color), padding:'10px 20px' }}>
            <a.icon size={15} /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Celebrity Management ─────────────────────────────────────────────────────
function CelebrityManagement({ celebrities, overrides, addedCelebs, updateCeleb, deleteCeleb, addCeleb }) {
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('All');
  const [editing,  setEditing]  = useState(null); // celeb object being edited
  const [adding,   setAdding]   = useState(false);
  const [editForm, setEditForm] = useState({});
  const [addForm,  setAddForm]  = useState({ name:'', category:'Actor', bio:'', followers:'1000000', verified:true, image:'', photos:[], videos:[] });
  const photoRef = useRef(null);
  const addPhotoRef = useRef(null);

  const allCelebs = useMemo(() => {
    const base = [...addedCelebs, ...celebrities].filter(c => !overrides[c.id]?._deleted);
    return base.map(c => ({ ...c, ...(overrides[c.id] || {}) }));
  }, [celebrities, addedCelebs, overrides]);

  const filtered = useMemo(() => {
    return allCelebs.filter(c => {
      const q = search.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q);
      const matchC = catFilter === 'All' || c.category?.toLowerCase().includes(catFilter.toLowerCase());
      return matchQ && matchC;
    });
  }, [allCelebs, search, catFilter]);

  function openEdit(c) {
    setEditForm({
      name:      c.name,
      category:  c.category || 'Actor',
      bio:       c.bio || '',
      followers: String(c.followers || '1000000'),
      verified:  c.verified !== false,
      image:     c.image || '',
    });
    setEditing(c);
  }

  function saveEdit() {
    updateCeleb(editing.id, {
      name:      editForm.name,
      category:  editForm.category,
      bio:       editForm.bio,
      followers: editForm.followers,
      verified:  editForm.verified,
      ...(editForm.image && editForm.image !== editing.image ? { image: editForm.image } : {}),
    });
    setEditing(null);
  }

  function readFile(e, cb) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => cb(ev.target.result);
    r.readAsDataURL(file);
  }

  function handleAddCeleb(e) {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    addCeleb({
      name: addForm.name, category: addForm.category, bio: addForm.bio,
      followers: addForm.followers, verified: addForm.verified,
      image: addForm.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(addForm.name)}&background=1a1a1a&color=aaa&size=400`,
      photos: addForm.photos, videos: addForm.videos,
    });
    setAddForm({ name:'', category:'Actor', bio:'', followers:'1000000', verified:true, image:'', photos:[], videos:[] });
    setAdding(false);
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#fff' }}>Celebrities <span style={{ fontSize:14, color:'#555', fontWeight:400 }}>({filtered.length.toLocaleString()} shown)</span></h1>
        <button onClick={()=>setAdding(true)} style={s.btn()}><Plus size={15}/> Add Celebrity</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:10, padding:'8px 12px', flex:1, minWidth:220 }}>
          <Search size={15} color="#555" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search celebrities..."
            style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:13, fontFamily:'inherit' }} />
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
          style={{ ...s.input, width:'auto', minWidth:140, colorScheme:'dark' }}>
          <option>All</option>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ ...s.card, padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #111' }}>
                {['Photo','Name','Category','Followers','Verified','Memorial','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#555', fontWeight:600, fontSize:12, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,100).map(c => (
                <tr key={c.id} style={{ borderBottom:'1px solid #0d0d0d', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#0a0a0a'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'10px 16px' }}>
                    <img src={c.image} alt="" style={{ width:38, height:38, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
                      onError={e=>{e.currentTarget.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=111&color=aaa&size=80`}} />
                  </td>
                  <td style={{ padding:'10px 16px', color:'#fff', fontWeight:600 }}>{c.name}</td>
                  <td style={{ padding:'10px 16px', color:'#666' }}>{c.category}</td>
                  <td style={{ padding:'10px 16px', color:'#aaa' }}>{fmtNum(parseInt(c.followers)||0)}</td>
                  <td style={{ padding:'10px 16px' }}>
                    <button onClick={()=>updateCeleb(c.id,{verified:!c.verified})} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                      {c.verified!==false ? <ToggleRight size={22} color="#0095f6"/> : <ToggleLeft size={22} color="#333"/>}
                    </button>
                  </td>
                  <td style={{ padding:'10px 16px' }}>
                    <button onClick={()=>updateCeleb(c.id,{isMemorial:!c.isMemorial})}
                      title={c.isMemorial ? 'Remove memorial status' : 'Mark as memorial (deceased)'}
                      style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:4 }}>
                      {c.isMemorial
                        ? <span style={{ fontSize:18 }}>🕯️</span>
                        : <span style={{ fontSize:18, opacity:0.25 }}>🕯️</span>
                      }
                    </button>
                  </td>
                  <td style={{ padding:'10px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>openEdit(c)} style={{ ...s.btnGhost, padding:'5px 10px', fontSize:12 }}><Edit2 size={12}/> Edit</button>
                      <button onClick={()=>{ if(confirm(`Delete ${c.name}?`)) deleteCeleb(c.id); }} style={{ ...s.btnGhost, padding:'5px 10px', fontSize:12, color:'#e05252', borderColor:'rgba(224,82,82,0.3)' }}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && <div style={{ padding:'10px 16px', fontSize:12, color:'#555', borderTop:'1px solid #111' }}>Showing first 100 of {filtered.length}. Use search to narrow down.</div>}
      </div>

      {/* Edit Modal */}
      {editing && (
        <Modal title={`Edit: ${editing.name}`} onClose={()=>setEditing(null)}>
          <div style={{ display:'grid', gap:12 }}>
            <div>
              <label style={s.label}>Photo</label>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <img src={editForm.image||editing.image} alt="" style={{ width:60, height:60, borderRadius:10, objectFit:'cover', objectPosition:'top', background:'#111' }}
                  onError={e=>{e.currentTarget.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(editing.name)}&background=111&color=aaa&size=120`}} />
                <button onClick={()=>photoRef.current?.click()} style={s.btnGhost}><Upload size={14}/> Upload new</button>
                <input ref={photoRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>readFile(e,v=>setEditForm(p=>({...p,image:v})))} />
              </div>
            </div>
            <Field label="Name" value={editForm.name} onChange={v=>setEditForm(p=>({...p,name:v}))} />
            <div>
              <label style={s.label}>Category</label>
              <select value={editForm.category} onChange={e=>setEditForm(p=>({...p,category:e.target.value}))}
                style={{ ...s.input, colorScheme:'dark' }}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Bio" value={editForm.bio} onChange={v=>setEditForm(p=>({...p,bio:v}))} multiline />
            <Field label="Followers (number)" value={editForm.followers} onChange={v=>setEditForm(p=>({...p,followers:v}))} />
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <label style={{ ...s.label, marginBottom:0 }}>Verified badge</label>
              <button onClick={()=>setEditForm(p=>({...p,verified:!p.verified}))} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                {editForm.verified ? <ToggleRight size={24} color="#0095f6"/> : <ToggleLeft size={24} color="#333"/>}
              </button>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={saveEdit} style={{ ...s.btn(), flex:1, justifyContent:'center' }}><Save size={14}/> Save Changes</button>
              <button onClick={()=>setEditing(null)} style={{ ...s.btnGhost, flex:1, justifyContent:'center' }}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Celebrity Modal */}
      {adding && (
        <Modal title="Add New Celebrity" onClose={()=>setAdding(false)} wide>
          <form onSubmit={handleAddCeleb}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1', display:'flex', gap:14, alignItems:'center' }}>
                <div style={{ width:72, height:72, borderRadius:14, background:'#111', overflow:'hidden', border:'1px solid #222' }}>
                  {addForm.image ? <img src={addForm.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#555' }}><Upload size={20}/></div>}
                </div>
                <div>
                  <button type="button" onClick={()=>addPhotoRef.current?.click()} style={s.btnGhost}><Upload size={14}/> Profile Photo</button>
                  <input ref={addPhotoRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>readFile(e,v=>setAddForm(p=>({...p,image:v})))} />
                  <div style={{ fontSize:11, color:'#555', marginTop:4 }}>JPG, PNG (max 5MB)</div>
                </div>
              </div>
              <div><label style={s.label}>Name *</label><input value={addForm.name} onChange={e=>setAddForm(p=>({...p,name:e.target.value}))} required style={s.input} /></div>
              <div>
                <label style={s.label}>Category *</label>
                <select value={addForm.category} onChange={e=>setAddForm(p=>({...p,category:e.target.value}))} style={{ ...s.input, colorScheme:'dark' }}>
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}><label style={s.label}>Bio</label><textarea value={addForm.bio} onChange={e=>setAddForm(p=>({...p,bio:e.target.value}))} rows={3} style={{ ...s.input, resize:'vertical' }} /></div>
              <div><label style={s.label}>Follower Count</label><input type="number" value={addForm.followers} onChange={e=>setAddForm(p=>({...p,followers:e.target.value}))} style={s.input} /></div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <label style={{ ...s.label, marginBottom:0 }}>Verified</label>
                <button type="button" onClick={()=>setAddForm(p=>({...p,verified:!p.verified}))} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                  {addForm.verified ? <ToggleRight size={24} color="#0095f6"/> : <ToggleLeft size={24} color="#333"/>}
                </button>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button type="submit" style={{ ...s.btn(), flex:1, justifyContent:'center' }}><Plus size={14}/> Add Celebrity</button>
              <button type="button" onClick={()=>setAdding(false)} style={{ ...s.btnGhost, flex:1, justifyContent:'center' }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Post Management ──────────────────────────────────────────────────────────
function PostManagement({ celebrities, adminPosts, addAdminPost, updatePost, deletePost, postOvr }) {
  const [adding,   setAdding]   = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form, setForm] = useState({ celebId:'', caption:'', likes:100000, media:'', mediaType:'photo' });
  const [editForm, setEditForm] = useState({});
  const mediaRef = useRef(null);
  const editMediaRef = useRef(null);

  function readFile(e, cb) { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>cb(ev.target.result); r.readAsDataURL(f); }

  const allPosts = useMemo(() => {
    return adminPosts.filter(p => !postOvr[p.id]?._deleted).map(p => ({ ...p, ...(postOvr[p.id]||{}) }));
  }, [adminPosts, postOvr]);

  const celebMap = useMemo(() => Object.fromEntries(celebrities.map(c=>[c.id,c])), [celebrities]);

  function handleAdd(e) {
    e.preventDefault();
    const celeb = celebrities.find(c=>String(c.id)===String(form.celebId));
    if (!celeb) return;
    addAdminPost({ celebId: celeb.id, celebName: celeb.name, celebImage: celeb.image, celebCategory: celeb.category, caption: form.caption, likes: Number(form.likes), media: form.media, mediaType: form.mediaType });
    setForm({ celebId:'', caption:'', likes:100000, media:'', mediaType:'photo' });
    setAdding(false);
  }

  function openEdit(p) { setEditForm({ caption: p.caption, likes: p.likes, media: p.media }); setEditing(p); }
  function saveEdit()  { updatePost(editing.id, { caption: editForm.caption, likes: Number(editForm.likes), ...(editForm.media?{media:editForm.media}:{}) }); setEditing(null); }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#fff' }}>Posts <span style={{ fontSize:14, color:'#555', fontWeight:400 }}>({allPosts.length})</span></h1>
        <button onClick={()=>setAdding(true)} style={s.btn()}><Plus size={15}/> Add Post</button>
      </div>

      {allPosts.length === 0 ? (
        <div style={{ ...s.card, textAlign:'center', padding:40, color:'#555' }}>
          <Film size={36} color="#333" style={{ margin:'0 auto 12px' }} />
          <div style={{ fontSize:15, fontWeight:600, color:'#888', marginBottom:6 }}>No admin posts yet</div>
          <div style={{ fontSize:13, marginBottom:16 }}>Create posts for any celebrity</div>
          <button onClick={()=>setAdding(true)} style={s.btn()}><Plus size={14}/> Create First Post</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {allPosts.map(p => {
            const c = celebMap[p.celebId];
            return (
              <div key={p.id} style={{ ...s.card, padding:0, overflow:'hidden' }}>
                {p.media && <img src={p.media} alt="" style={{ width:'100%', aspectRatio:'4/3', objectFit:'cover', display:'block' }} />}
                {!p.media && (
                  <div style={{ width:'100%', aspectRatio:'4/3', background:'#111', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Film size={28} color="#333" />
                  </div>
                )}
                <div style={{ padding:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    {c && <img src={c.image} alt="" style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }} onError={e=>{e.currentTarget.style.display='none'}} />}
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{p.celebName || 'Unknown'}</span>
                  </div>
                  <p style={{ fontSize:12, color:'#888', marginBottom:8, lineHeight:1.5 }}>{p.caption?.slice(0,80)}{p.caption?.length>80?'…':''}</p>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, color:'#555' }}>❤️ {fmtNum(p.likes)}</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>openEdit(p)} style={{ ...s.btnGhost, padding:'4px 8px', fontSize:11 }}><Edit2 size={11}/></button>
                      <button onClick={()=>{ if(confirm('Delete this post?')) deletePost(p.id); }} style={{ ...s.btnGhost, padding:'4px 8px', fontSize:11, color:'#e05252', borderColor:'rgba(224,82,82,0.2)' }}><Trash2 size={11}/></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add post modal */}
      {adding && (
        <Modal title="Add New Post" onClose={()=>setAdding(false)} wide>
          <form onSubmit={handleAdd}>
            <div style={{ display:'grid', gap:12 }}>
              <div>
                <label style={s.label}>Celebrity *</label>
                <select value={form.celebId} onChange={e=>setForm(p=>({...p,celebId:e.target.value}))} required style={{ ...s.input, colorScheme:'dark' }}>
                  <option value="">Select celebrity...</option>
                  {celebrities.slice(0,200).map(c=><option key={c.id} value={c.id}>{c.name} — {c.category}</option>)}
                </select>
              </div>
              <Field label="Caption" value={form.caption} onChange={v=>setForm(p=>({...p,caption:v}))} multiline />
              <Field label="Likes count" value={String(form.likes)} onChange={v=>setForm(p=>({...p,likes:v}))} />
              <div>
                <label style={s.label}>Photo / Video</label>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {form.media && <img src={form.media} alt="" style={{ width:60, height:60, objectFit:'cover', borderRadius:8, background:'#111' }} />}
                  <button type="button" onClick={()=>mediaRef.current?.click()} style={s.btnGhost}><Upload size={14}/> Upload Media</button>
                  <input ref={mediaRef} type="file" accept="image/*,video/*" style={{display:'none'}} onChange={e=>readFile(e,v=>setForm(p=>({...p,media:v,mediaType:e.target.files[0]?.type.startsWith('video')?'video':'photo'})))} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" style={{ ...s.btn(), flex:1, justifyContent:'center' }}><Plus size={14}/> Publish Post</button>
                <button type="button" onClick={()=>setAdding(false)} style={{ ...s.btnGhost, flex:1, justifyContent:'center' }}>Cancel</button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit post modal */}
      {editing && (
        <Modal title="Edit Post" onClose={()=>setEditing(null)}>
          <div style={{ display:'grid', gap:12 }}>
            <Field label="Caption" value={editForm.caption} onChange={v=>setEditForm(p=>({...p,caption:v}))} multiline />
            <Field label="Likes count" value={String(editForm.likes)} onChange={v=>setEditForm(p=>({...p,likes:v}))} />
            <div>
              <label style={s.label}>Replace Photo</label>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                {editForm.media && <img src={editForm.media} alt="" style={{ width:50, height:50, objectFit:'cover', borderRadius:8 }} />}
                <button type="button" onClick={()=>editMediaRef.current?.click()} style={s.btnGhost}><Upload size={14}/> New Photo</button>
                <input ref={editMediaRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>readFile(e,v=>setEditForm(p=>({...p,media:v})))} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={saveEdit} style={{ ...s.btn(), flex:1, justifyContent:'center' }}><Save size={14}/> Save</button>
              <button onClick={()=>setEditing(null)} style={{ ...s.btnGhost, flex:1, justifyContent:'center' }}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Likes Manager ────────────────────────────────────────────────────────────
function LikesManager({ adminPosts, updatePost, postOvr, updateSettings, settings }) {
  const [min, setMin] = useState(String(settings.minLikes));
  const [max, setMax] = useState(String(settings.maxLikes));
  const [bulkLikes, setBulkLikes] = useState('500000');
  const [postId, setPostId] = useState('');
  const [customLikes, setCustomLikes] = useState('');

  const allPosts = adminPosts.filter(p=>!postOvr[p.id]?._deleted).map(p=>({...p,...(postOvr[p.id]||{})}));

  function bulkUpdate() {
    if (!confirm(`Set all ${allPosts.length} admin posts to ${bulkLikes} likes?`)) return;
    allPosts.forEach(p => updatePost(p.id, { likes: Number(bulkLikes) }));
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>Likes Manager</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>

        <div style={s.card}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Like Range Settings</h3>
          <label style={s.label}>Minimum Likes</label>
          <input type="number" value={min} onChange={e=>setMin(e.target.value)} style={{ ...s.input, marginBottom:10 }} />
          <label style={s.label}>Maximum Likes</label>
          <input type="number" value={max} onChange={e=>setMax(e.target.value)} style={{ ...s.input, marginBottom:14 }} />
          <button onClick={()=>updateSettings({minLikes:Number(min),maxLikes:Number(max)})} style={s.btn()}>
            <Save size={14}/> Save Range
          </button>
        </div>

        <div style={s.card}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Bulk Update All Posts</h3>
          <label style={s.label}>Set likes count for ALL admin posts</label>
          <input type="number" value={bulkLikes} onChange={e=>setBulkLikes(e.target.value)} style={{ ...s.input, marginBottom:14 }} />
          <button onClick={bulkUpdate} style={s.btn('#8b5cf6')}>
            <RefreshCw size={14}/> Bulk Update ({allPosts.length} posts)
          </button>
        </div>

        <div style={s.card}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Update Specific Post</h3>
          <label style={s.label}>Post ID</label>
          <select value={postId} onChange={e=>setPostId(e.target.value)} style={{ ...s.input, marginBottom:10, colorScheme:'dark' }}>
            <option value="">Select post...</option>
            {allPosts.map(p=><option key={p.id} value={p.id}>{p.celebName} — {p.caption?.slice(0,30)||p.id}</option>)}
          </select>
          <label style={s.label}>New likes count</label>
          <input type="number" value={customLikes} onChange={e=>setCustomLikes(e.target.value)} style={{ ...s.input, marginBottom:14 }} />
          <button onClick={()=>{ if(postId&&customLikes) updatePost(postId,{likes:Number(customLikes)}); }} style={s.btn('#10b981')}>
            <Save size={14}/> Update Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Comments Manager ─────────────────────────────────────────────────────────
function CommentsManager() {
  const { comments, addComment, user } = useAuth();
  const [postId, setPostId] = useState('');
  const [text, setText] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkCount, setBulkCount] = useState('10');

  const FAKE_COMMENTS = ['Amazing!! 🔥','Legend 👑','Love this so much ❤️','GOAT 🐐','This is everything 😭','Iconic era ✨','We love you!! 💙','Absolutely incredible 🌟'];

  function addSingle() {
    if (!postId || !text.trim()) return;
    addComment(postId, text.trim());
    setText('');
  }

  function addBulk() {
    if (!postId) return;
    const count = Math.min(Number(bulkCount), 50);
    for (let i = 0; i < count; i++) {
      const t = bulkText.trim() || FAKE_COMMENTS[i % FAKE_COMMENTS.length];
      addComment(postId, t + (bulkText ? ` ${i+1}` : ''));
    }
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>Comments Manager</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        <div style={s.card}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Add Single Comment</h3>
          <label style={s.label}>Post ID</label>
          <input value={postId} onChange={e=>setPostId(e.target.value)} placeholder="e.g. post_42" style={{ ...s.input, marginBottom:10 }} />
          <Field label="Comment text" value={text} onChange={setText} multiline />
          <button onClick={addSingle} style={{ ...s.btn(), marginTop:8 }}><Plus size={14}/> Add Comment</button>
        </div>

        <div style={s.card}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Bulk Add Comments</h3>
          <label style={s.label}>Post ID</label>
          <input value={postId} onChange={e=>setPostId(e.target.value)} placeholder="e.g. post_42" style={{ ...s.input, marginBottom:10 }} />
          <label style={s.label}>Comment template (leave blank for varied)</label>
          <input value={bulkText} onChange={e=>setBulkText(e.target.value)} placeholder="Leave blank for auto-varied" style={{ ...s.input, marginBottom:10 }} />
          <Field label="How many comments" value={bulkCount} onChange={setBulkCount} />
          <button onClick={addBulk} style={{ ...s.btn('#8b5cf6'), marginTop:8 }}><RefreshCw size={14}/> Add {bulkCount} Comments</button>
        </div>

        <div style={{ ...s.card, gridColumn:'1/-1' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Recent Comments ({comments.length})</h3>
          <div style={{ maxHeight:300, overflowY:'auto' }}>
            {comments.slice(0,50).map(c => (
              <div key={c.id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid #111' }}>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#aaa' }}>{c.user} </span>
                  <span style={{ fontSize:12, color:'#666' }}>{c.text.slice(0,80)}</span>
                  <div style={{ fontSize:10, color:'#333', marginTop:2 }}>Post: {c.postId}</div>
                </div>
              </div>
            ))}
            {comments.length === 0 && <div style={{ color:'#555', fontSize:13, textAlign:'center', padding:20 }}>No comments yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Video Manager ────────────────────────────────────────────────────────────
function VideoManager({ celebrities, updateCeleb, overrides }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const fileRef = useRef(null);

  const celebs = useMemo(() => celebrities.slice(0,200).map(c=>({...c,...(overrides[c.id]||{})})), [celebrities, overrides]);
  const filtered = useMemo(() => celebs.filter(c=>!search||c.name.toLowerCase().includes(search.toLowerCase())), [celebs, search]);

  function addVideoUrl() {
    if (!selected || !videoUrl.trim()) return;
    const current = selected.videos || [];
    updateCeleb(selected.id, { videos: [...current, { url: videoUrl.trim(), type:'url' }] });
    setVideoUrl('');
  }

  function readFile(e) {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ev => {
      const current = selected?.videos || [];
      updateCeleb(selected.id, { videos: [...current, { url: ev.target.result, type:'upload', name: f.name }] });
    };
    r.readAsDataURL(f);
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>Video Manager</h1>
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:14 }}>
        <div style={{ ...s.card, padding:0, overflow:'hidden', alignSelf:'start' }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid #111' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#111', borderRadius:8, padding:'7px 10px' }}>
              <Search size={13} color="#555" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search celebrities..." style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:12, fontFamily:'inherit' }} />
            </div>
          </div>
          <div style={{ maxHeight:400, overflowY:'auto' }}>
            {filtered.slice(0,60).map(c => (
              <div key={c.id} onClick={()=>setSelected(c)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', cursor:'pointer', background: selected?.id===c.id ? '#1a1a1a' : 'transparent', borderBottom:'1px solid #0d0d0d' }}>
                <img src={c.image} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }} onError={e=>{e.currentTarget.style.display='none'}} />
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:'#fff' }}>{c.name}</div>
                  <div style={{ fontSize:10, color:'#555' }}>{(c.videos||[]).length} videos</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!selected ? (
            <div style={{ ...s.card, textAlign:'center', padding:40, color:'#555' }}>
              <Video size={32} color="#333" style={{ margin:'0 auto 10px' }} />
              <div>Select a celebrity to manage their videos</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={s.card}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Add Video for {selected.name}</h3>
                <label style={s.label}>Video URL (YouTube, Vimeo, direct link)</label>
                <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                  <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="https://..." style={{ ...s.input, marginBottom:0, flex:1 }} />
                  <button onClick={addVideoUrl} style={s.btn()}>Add</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ color:'#555', fontSize:12 }}>or</span>
                  <button onClick={()=>fileRef.current?.click()} style={s.btnGhost}><Upload size={14}/> Upload Video File</button>
                  <input ref={fileRef} type="file" accept="video/*" style={{display:'none'}} onChange={readFile} />
                </div>
              </div>

              {(selected.videos||[]).length > 0 && (
                <div style={s.card}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:'#fff', marginBottom:12 }}>Existing Videos ({(selected.videos||[]).length})</h3>
                  {(selected.videos||[]).map((v,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #111' }}>
                      <Video size={16} color="#555" style={{ flexShrink:0 }} />
                      <span style={{ flex:1, fontSize:12, color:'#aaa', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.name || v.url}</span>
                      <button onClick={()=>{
                        const vids = (selected.videos||[]).filter((_,j)=>j!==i);
                        updateCeleb(selected.id, {videos:vids});
                        setSelected(s=>({...s,videos:vids}));
                      }} style={{ background:'none', border:'none', cursor:'pointer', color:'#e05252', padding:0, lineHeight:0 }}><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fan Manager ──────────────────────────────────────────────────────────────
function FanManager() {
  const { fansDb } = useAuth();
  const [search, setSearch] = useState('');
  const [banned, setBanned] = useState(() => { try { return JSON.parse(localStorage.getItem('sm_banned_fans')||'[]'); } catch { return []; }});

  function banFan(id) {
    const next = [...banned, id];
    setBanned(next);
    localStorage.setItem('sm_banned_fans', JSON.stringify(next));
  }

  const filtered = useMemo(() => {
    if (!search) return fansDb;
    const q = search.toLowerCase();
    return fansDb.filter(f => f.username?.includes(q) || f.name?.toLowerCase().includes(q) || f.email?.includes(q));
  }, [fansDb, search]);

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>
        Fans / Users <span style={{ fontSize:14, color:'#555', fontWeight:400 }}>({fansDb.length} registered)</span>
      </h1>

      <div style={{ display:'flex', alignItems:'center', gap:8, background:'#0d0d0d', border:'1px solid #1a1a1a', borderRadius:10, padding:'8px 12px', marginBottom:16, maxWidth:360 }}>
        <Search size={15} color="#555" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search fans..."
          style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontSize:13, fontFamily:'inherit' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...s.card, textAlign:'center', padding:40, color:'#555' }}>
          <Users size={32} color="#333" style={{ margin:'0 auto 10px' }} />
          <div>{fansDb.length === 0 ? 'No registered fans yet' : 'No fans match your search'}</div>
        </div>
      ) : (
        <div style={{ ...s.card, padding:0 }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'1px solid #111' }}>
                {['Avatar','Username','Name','Email','Joined','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', color:'#555', fontWeight:600, fontSize:11, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(fan => {
                const isBanned = banned.includes(fan.id);
                const av = `https://ui-avatars.com/api/?name=${encodeURIComponent(fan.name||fan.username)}&background=111&color=aaa&size=80`;
                return (
                  <tr key={fan.id} style={{ borderBottom:'1px solid #0d0d0d' }}>
                    <td style={{ padding:'9px 14px' }}><img src={fan.avatar||av} alt="" style={{ width:32, height:32, borderRadius:'50%', objectFit:'cover' }} onError={e=>{e.currentTarget.src=av}} /></td>
                    <td style={{ padding:'9px 14px', color:'#aaa', fontWeight:500 }}>@{fan.username}</td>
                    <td style={{ padding:'9px 14px', color:'#fff' }}>{fan.name}</td>
                    <td style={{ padding:'9px 14px', color:'#666', fontSize:12 }}>{fan.email}</td>
                    <td style={{ padding:'9px 14px', color:'#555', fontSize:11 }}>{fan.createdAt ? new Date(fan.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding:'9px 14px' }}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:999, background: isBanned?'rgba(224,82,82,0.1)':'rgba(16,185,129,0.1)', color:isBanned?'#e05252':'#10b981', border:`1px solid ${isBanned?'rgba(224,82,82,0.2)':'rgba(16,185,129,0.2)'}` }}>
                        {isBanned?'Banned':'Active'}
                      </span>
                    </td>
                    <td style={{ padding:'9px 14px' }}>
                      {!isBanned && (
                        <button onClick={()=>{ if(confirm(`Ban ${fan.username}?`)) banFan(fan.id); }} style={{ ...s.btnGhost, padding:'4px 10px', fontSize:11, color:'#e05252', borderColor:'rgba(224,82,82,0.2)' }}>
                          <AlertTriangle size={11}/> Ban
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Site Settings ────────────────────────────────────────────────────────────
function SiteSettings({ settings, updateSettings }) {
  const [form, setForm] = useState({ ...settings });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  function save(e) {
    e.preventDefault();
    updateSettings(form);
    alert('Settings saved!');
  }

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:20 }}>Site Settings</h1>
      <form onSubmit={save}>
        <div style={{ display:'grid', gap:14, maxWidth:560 }}>
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>General</h3>
            <Field label="Site Name" value={form.siteName} onChange={v=>set('siteName',v)} />
            <Field label="Homepage Headline" value={form.heroHeadline} onChange={v=>set('heroHeadline',v)} />
          </div>

          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Maintenance Mode</h3>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <button type="button" onClick={()=>set('maintenanceMode',!form.maintenanceMode)} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                {form.maintenanceMode ? <ToggleRight size={28} color="#e05252"/> : <ToggleLeft size={28} color="#333"/>}
              </button>
              <span style={{ fontSize:14, color: form.maintenanceMode?'#e05252':'#555' }}>
                {form.maintenanceMode ? 'Maintenance mode ON — site is offline to users' : 'Site is live and accessible'}
              </span>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Like Range</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <Field label="Min Likes" value={String(form.minLikes)} onChange={v=>set('minLikes',Number(v))} />
              <Field label="Max Likes" value={String(form.maxLikes)} onChange={v=>set('maxLikes',Number(v))} />
            </div>
          </div>

          <button type="submit" style={{ ...s.btn(), alignSelf:'start', padding:'11px 28px' }}><Save size={15}/> Save All Settings</button>
        </div>
      </form>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function Field({ label, value, onChange, multiline }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={s.label}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} style={{ ...s.input, resize:'vertical', lineHeight:1.5 }} />
        : <input value={value} onChange={e=>onChange(e.target.value)} style={s.input} />
      }
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:16, width:'100%', maxWidth: wide?560:420, maxHeight:'90vh', overflow:'auto' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #111' }}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', cursor:'pointer', lineHeight:0 }}><X size={20}/></button>
        </div>
        <div style={{ padding:'20px' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Admin Messages helpers ───────────────────────────────────────────────────
function av(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||'?')}&background=111&color=aaa&size=100&bold=true`;
}
function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts), now = new Date();
  if (now - d < 60000)   return 'just now';
  if (now - d < 3600000) return Math.floor((now-d)/60000) + 'm ago';
  if (now.toDateString() === d.toDateString()) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString([],{month:'short',day:'numeric'});
}

function isCelebConvo(c) {
  return c?.with?.type === 'celeb';
}

// ─── Admin Messages Control ───────────────────────────────────────────────────
function AdminMessages({ celebrities }) {
  const [allConvos,  setAllConvos]  = useState(() => Object.values(loadAll()).filter(isCelebConvo));
  const [activeConvo, setActive]    = useState(null);
  const [replyText,   setReplyText] = useState('');
  const [tab,         setTab]       = useState('all');
  const [broadcastCeleb, setBCeleb] = useState('');
  const [broadcastText,  setBText]  = useState('');
  const [typing,      setTyping]    = useState(false);
  const [syncing,     setSyncing]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    setSyncing(true);
    syncAllConvosFromFirestore().then(convos => {
      if (!cancelled) {
        setAllConvos(convos.filter(isCelebConvo).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        setSyncing(false);
      }
    });
    const unsub = subscribeToAllConvos(convos => {
      if (!cancelled) {
        const sorted = convos.filter(isCelebConvo).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setAllConvos(sorted);
        setSyncing(false);
      }
    });
    return () => { cancelled = true; unsub(); };
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    const fresh = allConvos.find(c => c.id === activeConvo.id);
    if (fresh) setActive(fresh);
  }, [allConvos, activeConvo?.id]);

  function refresh() {
    syncAllConvosFromFirestore().then(convos => {
      setAllConvos(convos.filter(isCelebConvo).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
    });
  }

  function replyAsCeleb() {
    if (!activeConvo || !replyText.trim()) return;
    const cid = activeConvo.id;
    setHumanTakeover(cid, true);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const msg = { id: msUid(), from:'them', text: replyText.trim(), timestamp: Date.now() };
      const updated = appendMessage(cid, msg);
      setReplyText('');
      if (updated) setActive(updated);
    }, 2000);
  }

  function resumeAutoReply(cid) {
    const updated = setHumanTakeover(cid, false);
    if (updated) setActive(updated);
  }

  function acceptRequest(cid) {
    updateConvoStatus(cid, 'active');
    refresh();
  }
  function declineRequest(cid) {
    updateConvoStatus(cid, 'declined');
    refresh();
    setActive(null);
  }

  function broadcast() {
    if (!broadcastCeleb || !broadcastText.trim()) return;
    const celeb = celebrities.find(c=>String(c.id)===String(broadcastCeleb));
    if (!celeb) return;
    const all = loadAll();
    let count = 0;
    Object.values(all).forEach(c => {
      if (c.with?.id === celeb.id && c.with?.type === 'celeb') {
        appendMessage(c.id, { id: msUid(), from:'them', text: broadcastText.trim(), timestamp: Date.now() });
        count++;
      }
    });
    alert(`Broadcast sent to ${count} conversation(s) as ${celeb.name}`);
    setBText('');
  }

  const requests = allConvos.filter(c => c.status === 'request');
  const active   = allConvos.filter(c => c.status !== 'declined');
  const live     = active.filter(c => c.humanTakeover);
  const shown    = tab === 'requests' ? requests : active;

  return (
    <div>
      <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:8 }}>Messages Control</h1>
      <p style={{ fontSize:13, color:'#666', marginBottom:16 }}>
        Auto-reply runs until you send a manual reply. Then you control the chat.
        {syncing ? ' Syncing from cloud…' : ` ${active.length} conversations · ${live.length} live`}
      </p>

      {/* Tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20, borderBottom:'1px solid #111', paddingBottom:12, flexWrap:'wrap' }}>
        {[['all',`All (${active.length})`],['requests',`Requests (${requests.length})`],['broadcast','Broadcast']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600,
            background: tab===k ? '#0095f6' : '#1a1a1a', color: tab===k ? '#fff' : '#666',
          }}>{l}</button>
        ))}
        <button onClick={refresh} style={{ ...s.btnGhost, marginLeft:'auto', padding:'7px 12px' }}><RefreshCw size={13}/></button>
      </div>

      {tab === 'broadcast' ? (
        <div style={{ maxWidth:480 }}>
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:14 }}>Send Broadcast Message</h3>
            <p style={{ fontSize:13, color:'#666', marginBottom:14 }}>Send a message FROM a celebrity to ALL fans who have messaged them.</p>
            <div style={{ marginBottom:10 }}>
              <label style={s.label}>Send as celebrity</label>
              <select value={broadcastCeleb} onChange={e=>setBCeleb(e.target.value)} style={{ ...s.input, colorScheme:'dark' }}>
                <option value="">Select celebrity...</option>
                {celebrities.slice(0,200).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={s.label}>Message</label>
              <textarea value={broadcastText} onChange={e=>setBText(e.target.value)} rows={4} style={{ ...s.input, resize:'vertical' }} placeholder="Write your broadcast message..." />
            </div>
            <button onClick={broadcast} style={s.btn('#8b5cf6')}><Send size={14}/> Send Broadcast</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:14, height:'60vh' }}>
          {/* Convo list */}
          <div style={{ ...s.card, padding:0, overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid #111', fontSize:12, color:'#555', fontWeight:600 }}>
              {tab==='requests' ? 'MESSAGE REQUESTS' : 'ALL CONVERSATIONS'} ({shown.length})
            </div>
            <div style={{ flex:1, overflowY:'auto' }}>
              {shown.length === 0 ? (
                <div style={{ padding:24, textAlign:'center', color:'#555', fontSize:13 }}>No {tab==='requests'?'pending requests':'conversations'}</div>
              ) : shown.map(c => (
                <div key={c.id} onClick={()=>setActive(c)}
                  style={{ padding:'11px 14px', cursor:'pointer', background: activeConvo?.id===c.id?'#111':'transparent', borderBottom:'1px solid #0a0a0a' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <img src={c.with?.image||av(c.with?.name)} alt="" style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
                      onError={e=>{e.currentTarget.src=av(c.with?.name)}}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{c.with?.name}</span>
                        <span style={{
                          fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4,
                          background: c.humanTakeover ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.15)',
                          color: c.humanTakeover ? '#10b981' : '#666',
                        }}>
                          {c.humanTakeover ? 'LIVE' : 'AUTO'}
                        </span>
                      </div>
                      <div style={{ fontSize:11, color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {c.messages.filter(m=>m.from!=='system').slice(-1)[0]?.text?.slice(0,30) || 'No messages'}
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:'#444' }}>{fmtTime(c.updatedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat detail */}
          <div style={{ ...s.card, padding:0, overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
            {!activeConvo ? (
              <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#555', fontSize:13 }}>
                Select a conversation to view
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #111', display:'flex', alignItems:'center', gap:10 }}>
                  <img src={activeConvo.with?.image||av(activeConvo.with?.name)} alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
                    onError={e=>{e.currentTarget.src=av(activeConvo.with?.name)}}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{activeConvo.with?.name}</div>
                    <div style={{ fontSize:11, color: activeConvo.humanTakeover ? '#10b981' : '#888' }}>
                      {activeConvo.humanTakeover ? 'You are replying — auto-reply is OFF' : 'Auto-reply ON until you send a message'}
                      {' · '}{activeConvo.messages.length} messages
                    </div>
                  </div>
                  {activeConvo.humanTakeover ? (
                    <button onClick={() => resumeAutoReply(activeConvo.id)} style={s.btnGhost}>
                      Resume auto-reply
                    </button>
                  ) : null}
                  {activeConvo.status==='request' && (
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>acceptRequest(activeConvo.id)} style={s.btn('#10b981')}><Check size={13}/> Accept</button>
                      <button onClick={()=>declineRequest(activeConvo.id)} style={{ ...s.btnGhost, color:'#e05252', borderColor:'rgba(224,82,82,0.2)' }}><X size={13}/> Decline</button>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                  {activeConvo.messages.map(msg => (
                    <div key={msg.id} style={{ display:'flex', justifyContent: msg.from==='me'?'flex-end':msg.from==='system'?'center':'flex-start' }}>
                      {msg.from==='system' ? (
                        <div style={{ background:'#1a1a1a', border:'1px solid #222', borderRadius:8, padding:'6px 12px', fontSize:11, color:'#666' }}>{msg.text}</div>
                      ) : (
                        <div style={{
                          background: msg.from==='me'?'#1a3a5c':'#1a1a1a',
                          borderRadius:10, padding:'8px 12px', maxWidth:'70%',
                        }}>
                          <div style={{ fontSize:10, color:'#555', marginBottom:2 }}>{msg.from==='me'?'Fan':'Celebrity ('+activeConvo.with?.name+')'}</div>
                          {msg.media && <img src={msg.media} alt="" style={{ width:'100%', maxWidth:200, borderRadius:8, marginBottom:4, display:'block' }}/>}
                          {msg.text && <div style={{ fontSize:13, color:'#fff', lineHeight:1.5 }}>{msg.text}</div>}
                          <div style={{ fontSize:10, color:'#444', textAlign:'right', marginTop:2 }}>{fmtTime(msg.timestamp)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  {typing && <div style={{ display:'flex', gap:4, padding:'8px 12px', background:'#1a1a1a', borderRadius:10, width:'fit-content', alignItems:'center' }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#555', animation:`bounce 1.2s ${i*0.2}s ease-in-out infinite` }}/>)}
                    <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </div>}
                </div>

                {/* Reply as celebrity */}
                <div style={{ padding:'10px 14px', borderTop:'1px solid #111' }}>
                  <div style={{ fontSize:11, color:'#0095f6', fontWeight:600, marginBottom:6 }}>
                    Reply as {activeConvo.with?.name} — turns off auto-reply for this fan
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input value={replyText} onChange={e=>setReplyText(e.target.value)}
                      placeholder={`Type as ${activeConvo.with?.name}...`}
                      onKeyDown={e=>{ if(e.key==='Enter') replyAsCeleb(); }}
                      style={{ ...s.input, marginBottom:0, flex:1 }}/>
                    <button onClick={replyAsCeleb} style={s.btn()}>
                      {typing ? <RefreshCw size={14} style={{ animation:'spin 1s linear infinite' }}/> : <><Send size={13}/> Send</>}
                    </button>
                  </div>
                  <div style={{ fontSize:11, color:'#555', marginTop:5 }}>
                    Fan sees this as a real reply. Auto-reply stops after your first manual message.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN
// ═════════════════════════════════════════════════════════════════════════════
export default function Admin() {
  const { celebrities } = useCelebContext();
  const { fansDb }      = useAuth();
  const { fanPosts }    = useFanPosts();
  const {
    loggedIn, adminLogout, overrides, addedCelebs,
    updateCeleb, deleteCeleb, addCeleb, getCelebOverride,
    adminPosts, addAdminPost, updatePost, deletePost, postOvr,
    settings, updateSettings,
  } = useAdmin();

  const [section, setSection] = useState('dashboard');

  if (!loggedIn) return <AdminLogin />;

  const allCelebs = [...addedCelebs, ...celebrities];

  return (
    <div className="sm-admin" style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar active={section} setActive={setSection} onLogout={adminLogout} />
      <main style={{ flex:1, padding:28, overflowY:'auto' }}>
        {section==='dashboard'   && <Dashboard celebrities={allCelebs} fans={fansDb} fanPosts={fanPosts} adminPosts={adminPosts} overrides={overrides} />}
        {section==='celebrities' && <CelebrityManagement celebrities={celebrities} overrides={overrides} addedCelebs={addedCelebs} updateCeleb={updateCeleb} deleteCeleb={deleteCeleb} addCeleb={addCeleb} />}
        {section==='posts'       && <PostManagement celebrities={allCelebs} adminPosts={adminPosts} addAdminPost={addAdminPost} updatePost={updatePost} deletePost={deletePost} postOvr={postOvr} />}
        {section==='likes'       && <LikesManager adminPosts={adminPosts} updatePost={updatePost} postOvr={postOvr} updateSettings={updateSettings} settings={settings} />}
        {section==='comments'    && <CommentsManager />}
        {section==='videos'      && <VideoManager celebrities={celebrities} updateCeleb={updateCeleb} overrides={overrides} />}
        {section==='fans'        && <FanManager />}
        {section==='messages'    && <AdminMessages celebrities={allCelebs} />}
        {section==='settings'    && <SiteSettings settings={settings} updateSettings={updateSettings} />}
      </main>
    </div>
  );
}
