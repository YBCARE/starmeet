import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Check, Play, Send, X,
         Volume2, VolumeX, Pause, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCelebContext } from '../context/CelebContext';
import { useAuth } from '../context/AuthContext';
import { useFanPosts } from '../context/FanPostContext';
import { getSomeFans } from '../services/fakeFans';
import { useMeta } from '../hooks/useMeta';
import { celebPath } from '../utils/celebrity';
import { groupStories, subscribeStories, getOwnStoryGroup } from '../services/storyStore';
import CreateStoryModal from '../components/CreateStoryModal';
import './Feed.css';

// ─── Priority celebrities shown first ────────────────────────────────────────
const PRIORITY_NAMES = [
  'Johnny Depp','Keanu Reeves','Will Smith','Tom Cruise',
  'Morgan Freeman','Dwayne Johnson','Brad Pitt','Leonardo DiCaprio',
  'Beyoncé','Taylor Swift','Cristiano Ronaldo','Jason Momoa',
  'Can Yaman','Paul Wesley','Zendaya','Margot Robbie',
];

const VIDEO_DURATIONS = ['2:34','3:12','4:05','1:48','5:22','2:58','3:44','6:10','1:30','4:27'];

// ─── Category-specific post captions ─────────────────────────────────────────
const POSTS_BY_CATEGORY = {
  Actor: [
    "On set at 4am. This role is breaking me open in the best way possible. 🎬",
    "Just finished the most emotionally demanding scene of my entire career. Wow.",
    "Table read today. The script is unlike anything I've ever been handed. 👀",
    "The costume department transformed me. I barely recognise myself. ✨",
    "Wrapped principal photography. I'm going to miss this cast every single day. 🎬",
    "Method acting means you bring the character home. My family noticed. 👁",
    "The director pushed me further than I thought I could go today. Grateful.",
    "Premiere night. All the nerves, all the joy, all the love in one room. 🌟",
    "Award season. However it goes, this project means everything to me.",
    "This character lives in me now. Some roles you never fully leave. 🖤",
  ],
  Actress: [
    "On set at 4am. This role is breaking me open in the best way possible. 🎬",
    "Just finished the most emotionally demanding scene of my entire career. Wow.",
    "Table read today. The script is unlike anything I've ever been handed. 👀",
    "The costume department transformed me. I barely recognise myself. ✨",
    "Wrapped principal photography. I'm going to miss this cast every single day. 🎬",
    "Method acting means you bring the character home. My family noticed. 👁",
    "The director pushed me further than I thought I could go today. Grateful.",
    "Premiere night. All the nerves, all the joy, all the love in one room. 🌟",
    "Award season. However it goes, this project means everything to me.",
    "This character lives in me now. Some roles you never fully leave. 🖤",
  ],
  Musician: [
    "3am in the studio and we just made something that made us both cry. 🎵",
    "New music is almost ready. I've been sitting on this for 8 months. Soon. 👀",
    "Tour rehearsals. The production is insane this year. You are not ready. 🚀",
    "Wrote today's track in 12 minutes. Sometimes songs just arrive fully formed. 🎶",
    "This album has been the most vulnerable I've ever been. No safety nets.",
    "Sold out night two. Every single one of you showed up. I can't breathe. 😭",
    "Platinum. I'm sitting here crying and I don't care who sees it. ❤️",
    "Live version hits different. Might release the concert recording. 🎤",
    "Collaboration I never thought would happen is happening. Drop incoming. 🔥",
    "Mixing the final track tonight. This journey took two years. Thank you. 🌙",
  ],
  Athlete: [
    "5am. Ice bath. Film session. Repeat. Championship doesn't wait. 💪",
    "Pre-game ritual. This one's for everyone who believed when I didn't. 🏆",
    "365 consecutive training days. Nobody gives you what you don't take. ⚡",
    "Post-game. Left everything on the field. That's all I know how to do. 🙏",
    "Injury update: I'll be back earlier than they said. Book it. 💯",
    "Draft day flashback hit me today. Look how far we've come. 🏅",
    "Diet, sleep, discipline. No shortcuts. That's the whole secret. 🥗",
    "Team first. Always has been. Always will be. 🤝",
    "Personal record broken today. I wasn't even trying for it. 📈",
    "The off-season isn't off. It's just preparation with less audience. 🔒",
  ],
  Director: [
    "Day 47 of principal photography. Every single shot is a decision. 🎥",
    "Watching the rough cut alone at midnight. Something special is here.",
    "The hardest part of directing: knowing when to stop and trust your cast.",
    "Sundance submission sent. Whatever happens, this film exists. That matters.",
    "Casting is 80% of the work. The right actor changes everything. 🎬",
    "Sound mix today. You forget how much emotion lives in the silence. 🔈",
    "This script took 4 years. The film will take 2 more. Worth every minute.",
    "Cannes. A decade ago I watched this festival from my bedroom floor. 🌴",
    "Cut 40 minutes today. It hurt. It was right. Trust the edit.",
    "My crew deserves every award. I'm just the one people photograph. 🏆",
  ],
  'Movie Producer': [
    "Just greenlit something that's going to change the conversation. 🎬",
    "Box office number just came in. I had to sit down for a minute. 📊",
    "Assembling a cast that hasn't been in the same room before. Watch this.",
    "Development is the invisible work nobody talks about. It's everything.",
    "First-look deal signed. The next chapter starts now. 📝",
    "Some projects take a decade to get made. This one was worth every rejection.",
    "Screening tonight. Two years of work in two hours. Terrifying and beautiful.",
    "The business is changing fast. We're changing with it. 🔄",
    "Finding new voices is the most important thing I do. Full stop.",
    "Wrap party. The crew made this. I just wrote the cheques. 🥂",
  ],
  Comedian: [
    "Tried a new bit last night. The audience told me everything I needed to know.",
    "Writing room at 2am. Comedy is just pain with better timing. 😂",
    "Sold out three shows in 6 minutes. I actually screamed alone in my kitchen.",
    "The best heckle I've had in a decade happened last Tuesday. I loved it.",
    "New Netflix special is filmed. Now we wait. The waiting is the hardest part. 📺",
    "Crowd work at its finest tonight. You cannot write what happened. 💀",
    "My therapist says I'm processing. My audience says I'm hilarious. Balance.",
    "Tour announcement coming this week. Start making plans. 🗺️",
    "Comedy Central taping done. I left nothing on the stage and I mean nothing.",
    "A joke took me 3 years to get right. Landed perfectly tonight. Worth it. 🎤",
  ],
  Model: [
    "Paris Fashion Week. The show ran 45 minutes late and it was still perfect. 👗",
    "Cover shoot today. 12 hours. Worth every second of it. 📸",
    "Just closed the show. Walking back, the crowd felt like a wave. ✨",
    "Behind the scenes on the campaign. The team made this something else entirely.",
    "New editorial is out. I've never felt more myself in front of a camera.",
    "Vogue. Honestly still can't say it without feeling something. 🙏",
    "The fashion industry is changing and I'm here for every bit of it. 🌍",
    "Off-duty. Sometimes this face needs a day with no one looking at it. 😌",
    "Design collaboration dropping next month. This one is personal. 🖤",
    "10 years in this industry. The girl who showed up to her first casting has no idea.",
  ],
  Creator: [
    "We just hit 10 million. I'm genuinely shaking. Thank you. Every single one of you. 😭",
    "New video goes live Sunday. Worked on this one for 6 weeks. 🎥",
    "Collaboration with someone I've watched for years just went live. Go watch it.",
    "Comments section tonight restored my faith in people. Legitimately. ❤️",
    "Behind the camera it's just me, a ring light, and a promise to show up. 🔆",
    "Brands keep calling. I keep choosing the ones that won't embarrass you. 🤝",
    "The algorithm buried this video. 2 million of you found it anyway. 🙌",
    "New series starts this Friday. Different from everything I've done before.",
    "I almost quit last year. I'm so glad I didn't. Thank you for staying. 🌱",
    "Editing at midnight because daytime me is somehow worse at it. 🌙",
  ],
};

const DEFAULT_POSTS = [
  "Grateful for every single one of you. This journey means everything ❤️",
  "Behind the scenes today. This is where the real magic happens ✨",
  "The grind never stops. Every day is an opportunity to grow 🙏",
  "Can't believe how far we've come together. Thank you all so much 🌟",
  "First look. No caption needed. Just feel it 🖤",
  "Raw, unfiltered, real. This is me 😤",
  "The best is yet to come. Believe that 🙌",
  "To everyone who said it couldn't be done — here we are 🏆",
  "Silence before the storm. Trust the process 🌊",
  "Hard work in silence, let success make the noise. Always 💎",
];

// Story captions per category
const STORY_CAPTIONS = {
  Actor:    ["On set today 🎬", "Character prep 🎭", "Award season ✨", "Filming in progress", "Behind the scenes 🎥"],
  Actress:  ["On set today 🎬", "Character prep 🎭", "Award season ✨", "Filming in progress", "Behind the scenes 🎥"],
  Musician: ["Studio session 🎵", "Tour life 🎤", "New music coming 👀", "Backstage vibes 🎶", "Recording day 🎧"],
  Athlete:  ["Game day 🏆", "Training session 💪", "Pre-game rituals ⚡", "Post-match 🙏", "Champions train harder"],
  Director: ["On set 🎥", "Reviewing rushes", "Casting sessions 🎬", "Edit suite 🖥️", "Production day"],
  Comedian: ["Tour life 😂", "Writing session 📝", "Stage time tonight 🎤", "New material loading", "Club set done 🔥"],
  Model:    ["Photoshoot day 📸", "Fashion week 👗", "On the runway ✨", "New campaign 💫", "Editorial day"],
  Creator:  ["Filming day 🎥", "Behind the video 📱", "New video out Sunday", "Collab dropping soon 🤝", "Studio time 💡"],
  default:  ["New post ✨", "Behind the scenes", "Update coming soon", "Live moments", "Today's vibe"],
};

// ─── Multilingual comment pool ────────────────────────────────────────────────
const COMMENTS = [
  'GOAT 🐐🔥','Legend 👑','Love you so much!!','Iconic forever','W post','Unreal talent',
  'This is everything 😭','Always the best','No one does it like you','Absolute legend',
  'You literally changed my life, I can\'t explain how much your work means to me 😭❤️',
  'Been a fan for 10 years and you never once disappointed. Thank you for existing.',
  'I was going through the hardest time of my life and your work saved me. Facts.',
  'My daughter cried watching this. She wants to be just like you when she grows up 🙏',
  'OMG I CANNOT BELIEVE THIS!!! I\'M SCREAMING 😱😱😱',
  'Wait WHAT?? I was not ready for this at ALL 💀',
  'The way I dropped everything to like and comment IMMEDIATELY 😭',
  'I\'ve watched this 47 times already and it gets better EVERY TIME',
  'Okay but can we just appreciate how consistently incredible this person is?? Every single thing they do is better than the last. The dedication, the craft, the passion — unmatched. Genuinely unmatched.',
  'I remember watching your very first project and thinking "this person is going to be the biggest star in the world" and look at you now. So proud even though you don\'t know I exist 😂❤️',
  'Eres increíble!! Te amo muchísimo 😭❤️','Dios mío qué talento tan grande 🔥',
  'El mejor de todos los tiempos sin duda 👑','Nunca me canso de verte trabajar ✨',
  'Tu es incroyable !! Je t\'adore 🔥','Légende absolue 👑 personne ne te dépasse',
  'Mon artiste préféré depuis toujours ❤️',
  'Você é incrível demais!! Te amo muito 😭','Meu ídolo de todos os tempos 👑🔥',
  'أنت أسطورة حقيقية 🔥👑','أحبك كثيراً يا بطل ❤️','الأفضل على الإطلاق بلا منافس',
  '🔥🔥🔥🔥🔥','❤️❤️❤️','👑👑👑','😭😭😭💀','✨✨✨🌟','💯💯💯',
  'Not me crying at 2am watching this AGAIN 💀❤️',
  'The algorithm knew I needed this today fr fr 🙏',
  'I showed this to my mum and now she\'s a fan too 😂❤️',
  'Rent free in my head FOREVER and I am not complaining',
  'The way this made me feel things I can\'t even describe 😭✨',
  'Already sent this to my entire contact list no cap 📲',
  'Living breathing proof that excellence is a standard not a goal 👑',
];

// Celeb self-replies — pinned at top of comments on their own post
const CELEB_SELF_COMMENTS = [
  "Thank you all so much. Truly ❤️",
  "The love in the comments right now 😭 you all keep me going",
  "This means more than you know 🙏",
  "Reading every comment. Every. Single. One. 💙",
  "Made this for you. Thank you for receiving it like this ✨",
  "Your support is the reason I keep going. Always. 🌟",
  "Cannot believe the response. I'm overwhelmed in the best way 😭",
  "THANK YOU. I don't have better words right now. THANK YOU 🔥",
  "Pinning this moment forever in my mind 🖤",
  "You guys are insane. I love you all so much 🫶",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function ri(min, max, rng) { return min + Math.floor(rng() * (max - min + 1)); }
function fmtNum(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}
const TIMES = ['1m','3m','7m','14m','22m','35m','1h','2h','4h','7h','12h','1d','2d','3d','5d'];

function getPostText(celeb, rng) {
  const cat   = celeb?.category || '';
  const pool  = POSTS_BY_CATEGORY[cat] || DEFAULT_POSTS;
  return pick(pool, rng);
}

/** Varied feed imagery — not the same headshot on every post */
function postImageFor(celeb, absIdx, isVideo = false) {
  const id = celeb?.id ?? absIdx;
  const seed = `sm_${id}_${absIdx}_${celeb?.category || 'post'}`;
  const w = isVideo ? 720 : 600;
  const h = isVideo ? 405 : absIdx % 5 === 2 ? 750 : 680;
  if (absIdx % 4 === 0 && celeb?.image && !String(celeb.image).includes('ui-avatars')) {
    return celeb.image;
  }
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

function shuffleCelebs(list, seed = 42) {
  const out = [...list];
  const rng = seeded(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function generatePost(celebrities, absIdx, priorityFirst) {
  let celeb;
  if (priorityFirst && absIdx < priorityFirst.length) {
    celeb = priorityFirst[absIdx];
  } else {
    const offset = priorityFirst ? priorityFirst.length : 0;
    celeb = celebrities[(absIdx - offset) % celebrities.length];
  }

  const rng      = seeded(absIdx * 7919 + (celeb?.id?.toString?.().charCodeAt?.(0) || absIdx));
  const isVideo  = (absIdx % 6 === 5);
  const videoDur = isVideo ? VIDEO_DURATIONS[absIdx % VIDEO_DURATIONS.length] : null;
  const likes    = ri(10_000, 2_000_000, rng);
  const commCnt  = ri(300, 8000, rng);

  const fakeFanList = getSomeFans(Math.min(commCnt, 50), absIdx * 13);

  // Pinned celeb self-comment always first
  const selfCrng   = seeded(absIdx * 999 + 1);
  const selfComment = {
    id:      `${absIdx}_celeb`,
    user:    celeb?.name || 'Celebrity',
    avatar:  celeb?.image,
    text:    pick(CELEB_SELF_COMMENTS, selfCrng),
    time:    pick(['1m','3m','5m','7m','10m'], selfCrng),
    isOwner: true,
  };

  const comments = [selfComment, ...Array.from({ length: Math.min(commCnt - 1, 49) }, (_, i) => {
    const crng = seeded(absIdx * 1337 + i * 97);
    const fan  = fakeFanList[i % fakeFanList.length];
    return {
      id:     `${absIdx}_c${i}`,
      user:   fan.username,
      avatar: fan.avatar,
      text:   pick(COMMENTS, crng),
      time:   pick(TIMES, crng),
      isOwner: false,
    };
  })];

  // ~1 in 5 posts is "exclusive" (Pro only) — seeded so it's consistent
  const exclusiveRng = seeded(absIdx * 12347 + 9999);
  const isExclusive  = exclusiveRng() < 0.18 && absIdx > 2; // skip first few posts

  return {
    id:      `post_${absIdx}`,
    absIdx,
    celeb,
    isVideo,
    videoDur,
    text:    getPostText(celeb, rng),
    image:   postImageFor(celeb, absIdx, isVideo),
    likes,
    commCnt,
    comments,
    time:    pick(TIMES, rng),
    showComments: false,
    isExclusive,
  };
}

function genBatch(celebrities, start, count, priorityFirst) {
  if (!celebrities.length) return [];
  return Array.from({ length: count }, (_, i) => generatePost(celebrities, start + i, priorityFirst));
}

// ─── Story Viewer (real stories from Firestore) ─────────────────────────────
function StoryViewer({ groups, startGroupIndex, onClose }) {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const DURATION = 5000;

  const group = groups[groupIdx];
  const slide = group?.slides?.[slideIdx];
  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'User')}&background=111&color=aaa&size=400`;

  function goNext() {
    if (slideIdx < (group?.slides?.length || 0) - 1) {
      setSlideIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(i => i + 1);
      setSlideIdx(0);
    } else {
      onClose();
    }
  }

  function goPrev() {
    if (slideIdx > 0) setSlideIdx(i => i - 1);
    else if (groupIdx > 0) {
      const prev = groups[groupIdx - 1];
      setGroupIdx(i => i - 1);
      setSlideIdx(Math.max(0, (prev?.slides?.length || 1) - 1));
    }
  }

  useEffect(() => {
    if (!slide) return undefined;
    setProgress(0);
    clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        goNext();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [groupIdx, slideIdx, slide?.id]);

  if (!group || !slide) return null;

  const totalBars = group.slides.length;

  return (
    <div className="feed-story-viewer"
      onClick={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.clientX < rect.width / 2 ? goPrev() : goNext();
      }}>

      <div className="feed-story-progress-row">
        {group.slides.map((_, i) => (
          <div key={i} className="feed-story-progress-bar">
            <div className="feed-story-progress-fill" style={{
              width: i < slideIdx ? '100%' : i === slideIdx ? `${progress}%` : '0%',
            }} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', zIndex:10, flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', overflow:'hidden', border:'2px solid #fff', flexShrink:0 }}>
          <img src={group.avatar || av(group.name)} alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'top' }}
            onError={e => { e.currentTarget.src = av(group.name); }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{group.name}</span>
            {group.type === 'celeb' && (
              <div style={{ width:14, height:14, borderRadius:'50%', background:'#3b82f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Check size={7} strokeWidth={3.5} color="white" />
              </div>
            )}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>
            {new Date(slide.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
            {totalBars > 1 ? ` · ${slideIdx + 1}/${totalBars}` : ''}
          </div>
        </div>
        <button type="button" onClick={e => { e.stopPropagation(); onClose(); }}
          style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', lineHeight:0, padding:8 }}>
          <X size={22} />
        </button>
      </div>

      <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#000' }}>
        {slide.mediaType === 'video' ? (
          <video src={slide.mediaUrl} autoPlay playsInline muted loop
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }} />
        ) : (
          <img src={slide.mediaUrl} alt=""
            style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
            onError={e => { e.currentTarget.src = av(group.name); }} />
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
        {slide.caption && (
          <div style={{ position:'absolute', bottom:80, left:0, right:0, padding:'0 20px', textAlign:'center' }}>
            <div style={{ display:'inline-block', background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', borderRadius:12, padding:'8px 18px', maxWidth:280 }}>
              <span style={{ fontSize:15, color:'#fff', fontWeight:600 }}>{slide.caption}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stories Row ─────────────────────────────────────────────────────────────
function StoriesRow({ user }) {
  const [rawStories, setRawStories] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [seen, setSeen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sm_stories_seen')) || {}; } catch { return {}; }
  });

  useEffect(() => {
    const unsub = subscribeStories(setRawStories);
    return unsub;
  }, []);

  const groups = useMemo(() => groupStories(rawStories, user?.id), [rawStories, user?.id]);
  const ownGroup = getOwnStoryGroup(groups, user?.id);
  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n || 'You')}&background=111&color=aaa&size=120`;

  function openStory(idx) {
    setSeen(s => {
      const next = { ...s, [groups[idx]?.id]: true };
      try { localStorage.setItem('sm_stories_seen', JSON.stringify(next)); } catch {}
      return next;
    });
    setViewing(idx);
  }

  function openOwnStory() {
    const idx = groups.findIndex(g => g.isOwn);
    if (idx >= 0) openStory(idx);
    else setShowCreate(true);
  }

  return (
    <>
      <div className="feed-stories">
        <div className="feed-stories-scroll">
          {user && (
            <div className="feed-story feed-story-yours">
              <div className={`feed-story-ring ${ownGroup && !seen[ownGroup.id] ? 'unseen' : 'seen'}`} onClick={openOwnStory}>
                <div className="feed-story-inner">
                  <img src={user.avatar || av(user.name || 'You')} alt="Your story"
                    onError={e => { e.currentTarget.src = av(user.name); }} />
                </div>
                <button type="button" className="feed-story-add-btn" aria-label="Add story"
                  onClick={e => { e.stopPropagation(); setShowCreate(true); }}>
                  <Plus size={14} strokeWidth={3} />
                </button>
              </div>
              <span className={`feed-story-name ${ownGroup ? 'unseen' : 'seen'}`}>Your story</span>
            </div>
          )}

          {groups.filter(g => !g.isOwn).map(g => {
            const idx = groups.findIndex(x => x.id === g.id);
            return (
              <div key={g.id} onClick={() => openStory(idx)} className="feed-story">
                <div className={`feed-story-ring ${seen[g.id] ? 'seen' : 'unseen'}`}>
                  <div className="feed-story-inner">
                    <img src={g.avatar || av(g.name)} alt={g.name}
                      onError={e => { e.currentTarget.src = av(g.name); }} />
                  </div>
                </div>
                <span className={`feed-story-name ${seen[g.id] ? 'seen' : 'unseen'}`}>
                  {g.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {viewing !== null && groups[viewing] && (
        <StoryViewer groups={groups} startGroupIndex={viewing} onClose={() => setViewing(null)} />
      )}

      {showCreate && user && (
        <CreateStoryModal user={user} onClose={() => setShowCreate(false)} />
      )}
    </>
  );
}

// ─── Video Player overlay ─────────────────────────────────────────────────────
function VideoPlayer({ post, onClose }) {
  const [playing,  setPlaying]  = useState(true);
  const [muted,    setMuted]    = useState(false);
  const [scrubber, setScrubber] = useState(22); // fake position %
  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=aaa&size=200`;

  // Fake scrubber advance
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setScrubber(s => s >= 99 ? 0 : s + 0.3), 200);
    return () => clearInterval(t);
  }, [playing]);

  const [totMins, totSecs] = post.videoDur ? post.videoDur.split(':').map(Number) : [3, 0];
  const totalSec = totMins * 60 + totSecs;
  const currentSec = Math.floor((scrubber / 100) * totalSec);
  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', zIndex:3000, display:'flex', flexDirection:'column' }}
      onClick={onClose}>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', flexShrink:0, zIndex:10 }}
        onClick={e=>e.stopPropagation()}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={18} color="#fff" />
        </button>
        <img src={post.celeb?.image || av(post.celeb?.name)} alt=""
          style={{ width:34, height:34, borderRadius:'50%', objectFit:'cover', objectPosition:'top' }}
          onError={e=>{e.currentTarget.src=av(post.celeb?.name)}} />
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{post.celeb?.name}</div>
          <div style={{ fontSize:11, color:'#aaa' }}>{post.celeb?.category}</div>
        </div>
      </div>

      {/* Photo as video frame */}
      <div style={{ flex:1, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}
        onClick={e=>{e.stopPropagation(); setPlaying(p=>!p);}}>
        <img src={post.image} alt=""
          style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }}
          onError={e=>{e.currentTarget.src=av(post.celeb?.name)}} />
        {/* Pause overlay */}
        {!playing && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)' }}>
            <div style={{ width:70, height:70, borderRadius:'50%', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'2px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Play size={30} fill="white" color="white" style={{ marginLeft:4 }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding:'16px 16px 28px', flexShrink:0 }} onClick={e=>e.stopPropagation()}>
        {/* Caption */}
        <p style={{ fontSize:13, color:'#ccc', lineHeight:1.6, margin:'0 0 14px' }}>{post.text}</p>

        {/* Scrubber */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontSize:11, color:'#aaa', minWidth:30 }}>{fmt(currentSec)}</span>
          <div style={{ flex:1, height:3, background:'#333', borderRadius:3, cursor:'pointer', position:'relative' }}
            onClick={e=>{
              const rect = e.currentTarget.getBoundingClientRect();
              setScrubber(((e.clientX-rect.left)/rect.width)*100);
            }}>
            <div style={{ height:'100%', width:`${scrubber}%`, background:'#fff', borderRadius:3 }} />
            <div style={{ position:'absolute', top:'50%', left:`${scrubber}%`, transform:'translate(-50%,-50%)', width:12, height:12, borderRadius:'50%', background:'#fff' }} />
          </div>
          <span style={{ fontSize:11, color:'#aaa', minWidth:30, textAlign:'right' }}>{post.videoDur}</span>
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <button onClick={()=>setPlaying(p=>!p)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:8, color:'#fff' }}>
            {playing
              ? <Pause size={26} fill="white" color="white" />
              : <Play  size={26} fill="white" color="white" />}
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <span style={{ fontSize:13, color:'#aaa' }}>❤️ {fmtNum(post.likes)}</span>
            <span style={{ fontSize:13, color:'#aaa' }}>💬 {fmtNum(post.commCnt)}</span>
            <button onClick={()=>setMuted(m=>!m)} style={{ background:'none', border:'none', cursor:'pointer' }}>
              {muted ? <VolumeX size={20} color="#666" /> : <Volume2 size={20} color="#aaa" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onToggleComments, onAddComment, liked, saved, onToggleSave, userAvatar, userName, onExpandVideo, isPro }) {
  const navigate = useNavigate();
  const c   = post.celeb;
  const [commentText, setCommentText] = useState('');
  const [likeAnim,    setLikeAnim]    = useState(false);
  const av  = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n)}&background=111&color=aaa&size=200`;

  function submitComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  }

  function handleLike() {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    onLike(post.id);
  }

  const isHot   = post.likes > 1_200_000;
  const isViral = post.likes > 1_700_000;

  return (
    <div className="feed-post">

      {isViral && (
        <div className="feed-post-viral">
          🔥 Going viral · {fmtNum(post.likes)} likes
        </div>
      )}

      <div className="feed-post-header">
        <div onClick={() => navigate(celebPath(c))} className="feed-post-avatar-wrap">
          <img src={c.image} alt={c.name} className="feed-post-avatar"
            onError={e => { e.currentTarget.src = av(c.name); }} />
          <div className="feed-verified">
            <Check size={7} strokeWidth={3} color="white" />
          </div>
        </div>
        <div className="feed-post-meta">
          <div onClick={() => navigate(celebPath(c))} className="feed-post-name">{c.name}</div>
          <div className="feed-post-sub">{c.category} · {post.time} ago</div>
        </div>
        <Link to={`/messages?with=celeb_${c.id}`} className="feed-dm-btn">
          <MessageCircle size={12} /> DM
        </Link>
      </div>

      <div className="feed-post-caption">{post.text}</div>

      {post.isVideo ? (
        <div className="feed-post-media video" onClick={() => onExpandVideo(post)}>
          <img src={post.image} alt={c.name}
            style={{ aspectRatio: '16/9', objectPosition: 'top center' }}
            onError={e => { e.currentTarget.style.objectPosition = 'center'; }} />
          <div className="feed-video-overlay" />
          <div className="feed-video-play">
            <div className="feed-video-play-btn">
              <Play size={28} fill="white" color="white" style={{ marginLeft: 4 }} />
            </div>
          </div>
          <div className="feed-video-dur">{post.videoDur}</div>
          <div className="feed-video-label">
            <Play size={10} fill="white" color="white" /> Video
          </div>
        </div>
      ) : (
        <div className="feed-post-media">
          <img src={post.image} alt=""
            style={{ filter: post.isExclusive && !isPro ? 'blur(18px) brightness(0.5)' : 'none', transition: 'filter 0.3s' }}
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          {post.isExclusive && !isPro && (
            <div className="feed-exclusive-overlay">
              <div className="feed-exclusive-lock">🔒</div>
              <div style={{ textAlign: 'center', padding: '0 24px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Pro Exclusive</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 12, lineHeight: 1.4 }}>
                  Upgrade to see this post from {c.name?.split(' ')[0]}
                </div>
                <Link to="/profile" className="feed-upgrade-link">
                  Upgrade to Pro — $9/mo
                </Link>
              </div>
            </div>
          )}
          {post.isExclusive && isPro && (
            <span className="feed-exclusive-badge">⭐ Exclusive</span>
          )}
        </div>
      )}

      <div className="feed-actions">
        <button onClick={handleLike} className={`feed-action-btn${liked ? ' liked' : ''}`}>
          <Heart size={21} fill={liked ? '#e05252' : 'none'} color={liked ? '#e05252' : 'currentColor'}
            className="heart-anim" style={{ transform: likeAnim ? 'scale(1.45)' : 'scale(1)' }} />
          <span>{fmtNum(liked ? post.likes + 1 : post.likes)}</span>
        </button>

        <button onClick={() => onToggleComments(post.id)} className={`feed-action-btn${post.showComments ? ' active' : ''}`}>
          <MessageCircle size={21} color={post.showComments ? 'var(--sm-accent)' : 'currentColor'} />
          <span>{fmtNum(post.commCnt)}</span>
        </button>

        <button className="feed-action-btn"><Share2 size={21} /></button>

        <button onClick={() => onToggleSave(post.id)} className={`feed-action-btn save${saved ? ' active' : ''}`}>
          <Bookmark size={21} fill={saved ? 'var(--sm-accent)' : 'none'} color={saved ? 'var(--sm-accent)' : 'currentColor'} />
        </button>
      </div>

      {post.showComments && (
        <>
          <div className="feed-comments">
            {post.comments.map(cm => (
              <div key={cm.id} className="feed-comment">
                <div className="feed-comment-avatar-wrap">
                  <img src={cm.avatar || av(cm.user)} alt={cm.user} className="feed-comment-avatar"
                    onError={e => { e.currentTarget.src = av(cm.user); }} />
                  {cm.isOwner && (
                    <div className="feed-comment-verified">
                      <Check size={6} strokeWidth={3.5} color="white" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="feed-comment-head">
                    <span className={`feed-comment-user ${cm.isOwner ? 'owner' : 'fan'}`}>{cm.user}</span>
                    {cm.isOwner && <span className="feed-comment-author-badge">Author</span>}
                    <span className="feed-comment-time">{cm.time} ago</span>
                  </div>
                  <div className={`feed-comment-text ${cm.isOwner ? 'owner' : 'fan'}`}>{cm.text}</div>
                </div>
              </div>
            ))}
            {post.commCnt > 50 && (
              <div className="feed-comments-more">+{fmtNum(post.commCnt - 50)} more comments</div>
            )}
          </div>

          <form onSubmit={submitComment} className="feed-comment-form">
            <img src={userAvatar || av(userName || 'Fan')} alt="" />
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="feed-comment-input"
            />
            <button type="submit" className={`feed-comment-send${commentText ? ' active' : ' inactive'}`}>
              <Send size={18} />
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// ─── Fan Post Card ────────────────────────────────────────────────────────────
function FanPostCard({ post, onLike, liked }) {
  const av = n => `https://ui-avatars.com/api/?name=${encodeURIComponent(n||'F')}&background=1a1a1a&color=aaa&size=100`;
  return (
    <div className="feed-post">
      <div className="feed-post-header">
        <Link to="/profile" className="feed-post-avatar-wrap">
          <img src={post.userAvatar || av(post.userName)} alt="" className="feed-post-avatar" />
        </Link>
        <div className="feed-post-meta">
          <div className="feed-post-name">{post.userName || post.username}</div>
          <div className="feed-post-sub">Fan · {new Date(post.createdAt).toLocaleDateString()}</div>
        </div>
        <span className="feed-fan-badge">Fan Post</span>
      </div>
      {post.caption && <div className="feed-post-caption">{post.caption}</div>}
      {post.media && (
        <div className="feed-post-media">
          <img src={post.media} alt="" style={{ aspectRatio: '4/3' }} />
        </div>
      )}
      {post.taggedCelebs?.length > 0 && (
        <div className="feed-tagged">with {post.taggedCelebs.join(', ')}</div>
      )}
      <div className="feed-actions">
        <button onClick={() => onLike(post.id)} className={`feed-action-btn${liked ? ' liked' : ''}`}>
          <Heart size={20} fill={liked ? '#e05252' : 'none'} color={liked ? '#e05252' : 'currentColor'} />
          <span>{fmtNum(post.likes || 0)}</span>
        </button>
        <button className="feed-action-btn"><MessageCircle size={20} /></button>
        <button className="feed-action-btn"><Share2 size={20} /></button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN FEED
// ═════════════════════════════════════════════════════════════════════════════
const INITIAL = 20;
const BATCH   = 15;
const MAX_DOM = 80;

export default function Feed() {
  useMeta({ title: 'Your Feed', description: 'See the latest posts from your favourite celebrities. Like, comment, and DM them directly on Starmeet.' });
  const { celebrities }   = useCelebContext();
  const { isLiked, toggleLike, addComment, user, isSaved, toggleSave, celebFollows, isPro } = useAuth();
  const { getRecentPosts } = useFanPosts();

  const [posts,      setPosts]      = useState([]);
  const [nextIdx,    setNextIdx]    = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [expandedVid,setExpandedVid] = useState(null);
  const [feedTab,    setFeedTab]    = useState('foryou'); // 'foryou' | 'following'
  const sentinelRef = useRef(null);
  const celebsRef   = useRef(celebrities);
  const priorityRef = useRef(null);
  celebsRef.current = celebrities;

  const priorityCelebs = useMemo(() => {
    if (!celebrities.length) return [];
    const result = [];
    for (const name of PRIORITY_NAMES) {
      const found = celebrities.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
      if (found && !result.find(r => r.id === found.id)) result.push(found);
    }
    return result;
  }, [celebrities]);

  useEffect(() => {
    if (!celebrities.length || posts.length > 0) return;
    priorityRef.current = priorityCelebs;
    const startOffset = Math.floor(Math.random() * Math.max(1, celebrities.length - INITIAL));
    const initial     = genBatch(celebrities, 0, INITIAL, priorityCelebs);
    const extras      = genBatch(celebrities, PRIORITY_NAMES.length + startOffset, INITIAL, priorityCelebs);
    const merged      = [...initial.slice(0, priorityCelebs.length + 3), ...extras];
    setPosts(merged.slice(0, INITIAL));
    setNextIdx(PRIORITY_NAMES.length + startOffset + INITIAL);
  }, [celebrities, priorityCelebs]);

  const loadMore = useCallback(() => {
    const celebs = celebsRef.current;
    if (!celebs.length || loading) return;
    setLoading(true);
    setTimeout(() => {
      setNextIdx(idx => {
        const batch = genBatch(celebs, idx, BATCH, priorityRef.current);
        setPosts(prev => {
          const combined = [...prev, ...batch];
          return combined.length > MAX_DOM ? combined.slice(combined.length - MAX_DOM) : combined;
        });
        return idx + BATCH;
      });
      setLoading(false);
    }, 700);
  }, [loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: '500px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  function handleToggleComments(postId) {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  }

  const fanPosts = useMemo(() => getRecentPosts(20), [getRecentPosts]);

  // Posts from celebrities the user follows (for "Following" tab)
  const followingPosts = useMemo(() => {
    if (!celebFollows.length || !posts.length) return [];
    return posts.filter(p => p.celeb && celebFollows.includes(p.celeb.id));
  }, [posts, celebFollows]);

  return (
    <div className="feed-page">
      <div className="feed-inner">

        <div className="feed-tabs">
          {[['foryou', 'For You'], ['following', 'Following']].map(([tab, label]) => (
            <button key={tab} onClick={() => setFeedTab(tab)}
              className={`feed-tab${feedTab === tab ? ' active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        <StoriesRow user={user} />

        {feedTab === 'following' && celebFollows.length === 0 && (
          <div className="feed-empty">
            <div className="feed-empty-icon">⭐</div>
            <div className="feed-empty-title">Follow your first star</div>
            <div className="feed-empty-text">
              Posts from celebrities you follow will appear here.<br />
              Discover who to follow on Explore.
            </div>
            <Link to="/explore" className="sm-btn sm-btn-primary" style={{ padding: '12px 28px' }}>
              Discover Stars →
            </Link>
          </div>
        )}

        {feedTab === 'following' && celebFollows.length > 0 && followingPosts.length === 0 && (
          <div className="feed-empty" style={{ padding: '40px 24px' }}>
            <div className="feed-empty-icon" style={{ fontSize: 32 }}>📭</div>
            <div className="feed-empty-text">Loading posts from the stars you follow…</div>
          </div>
        )}

        {feedTab === 'following' && followingPosts.length > 0 && (
          followingPosts.map(post => (
            <PostCard
              key={post.id} post={post}
              onLike={toggleLike}
              onToggleComments={handleToggleComments}
              onAddComment={addComment}
              liked={isLiked(post.id)}
              saved={isSaved ? isSaved(post.id) : false}
              onToggleSave={toggleSave || (() => {})}
              userAvatar={user?.avatar}
              userName={user?.name}
              onExpandVideo={setExpandedVid}
              isPro={isPro}
            />
          ))
        )}

        {/* ── For You tab ───────────────────────────────────────────────────── */}
        {feedTab === 'foryou' && (posts.length === 0 ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="feed-skeleton">
              <div className="feed-skeleton-head">
                <div className="feed-skeleton-avatar" />
                <div>
                  <div className="feed-skeleton-line" style={{ width: 110 }} />
                  <div className="feed-skeleton-line short" />
                </div>
              </div>
              <div className="feed-skeleton-media" />
            </div>
          ))
        ) : (() => {
          const mixed = [];
          let fi = 0;
          posts.forEach((post, i) => {
            mixed.push(post);
            if ((i + 1) % 3 === 0 && fi < fanPosts.length) {
              mixed.push({ ...fanPosts[fi++], isFanPost: true });
            }
          });
          return mixed.map(post => post.isFanPost ? (
            <FanPostCard key={post.id} post={post} onLike={toggleLike} liked={isLiked(post.id)} />
          ) : (
            <PostCard
              key={post.id} post={post}
              onLike={toggleLike}
              onToggleComments={handleToggleComments}
              onAddComment={addComment}
              liked={isLiked(post.id)}
              saved={isSaved ? isSaved(post.id) : false}
              onToggleSave={toggleSave || (() => {})}
              userAvatar={user?.avatar}
              userName={user?.name}
              onExpandVideo={setExpandedVid}
              isPro={isPro}
            />
          ));
        })())}

        <div ref={sentinelRef} style={{ height:10 }} />

        {loading && (
          <div className="feed-loading">
            <div className="feed-spinner" />
            Loading more stars...
          </div>
        )}
      </div>

      {expandedVid && (
        <VideoPlayer post={expandedVid} onClose={() => setExpandedVid(null)} />
      )}
    </div>
  );
}
