// ─── Fake Fan Generator ───────────────────────────────────────────────────────
// Generates 10,000 deterministic fake fan profiles (no randomness — same every run)

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

const FIRST_NAMES = [
  // American
  'James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles',
  'Emily','Emma','Olivia','Ava','Isabella','Sophia','Mia','Charlotte','Amelia','Harper',
  // Nigerian
  'Chidi','Emeka','Adaeze','Ngozi','Tunde','Bola','Kemi','Yemi','Seun','Funke',
  // Brazilian
  'Gabriel','Matheus','Lucas','Pedro','João','Guilherme','Ana','Beatriz','Larissa','Camila',
  // Indian
  'Arjun','Rahul','Priya','Ananya','Vikram','Deepa','Rohan','Neha','Aditya','Kavya',
  // French
  'Pierre','Louis','Hugo','Léa','Camille','Manon','Inès','Chloé','Antoine','Baptiste',
  // British
  'Oliver','Harry','George','Alfie','Freya','Poppy','Isla','Rosie','Jack','Charlie',
  // Arabic
  'Mohamed','Ahmed','Ali','Omar','Fatima','Aisha','Nour','Sara','Hassan','Yusuf',
  // Korean
  'Minjun','Jiwoo','Seoyeon','Hyun','Jae','Yuna','Sohee','Taehyung','Jimin','Yoongi',
];

const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor',
  'Okafor','Adeyemi','Nwankwo','Ibrahim','Silva','Santos','Ferreira','Costa','Sharma','Patel',
  'Kumar','Singh','Martin','Bernard','Dubois','Petit','Thomas','Laurent','Anderson','Jackson',
  'Thompson','White','Harris','Martinez','Robinson','Clark','Rodriguez','Lewis','Lee','Walker',
  'Hall','Allen','Young','Hernandez','King','Wright','Lopez','Hill','Scott','Green',
];

const BIOS = [
  'Fan since day 1 ❤️', 'Living for this celebrity 🔥', 'Biggest fan you\'ll ever meet 👑',
  'Music is my life 🎵', 'Film lover & celeb stan 🎬', 'Just here to support my faves ⭐',
  'Superfan account | DMs open 💌', 'Following since the beginning 🙏',
  'Can\'t stop won\'t stop stanning 🚀', 'Certified lover of greatness 💯',
  'Their work changed my life fr 😭', 'Spreading positivity & fan love 🌟',
  'Professional fangirl/fanboy 😂', 'Here for the vibes only ✨',
  'Fan account | Not affiliated', 'Daily fan updates on this page 📲',
  'Been a fan for 10+ years 🎉', 'Proud supporter always 💪',
  'Obsessed and I\'m not sorry 🥰', 'My fave could drop anything & I\'d stream it',
];

let _cache = null;

export function getFakeFans(count = 10000) {
  if (_cache) return _cache;

  const fans = [];
  for (let i = 0; i < count; i++) {
    const rng       = seeded(i * 7919 + 1337);
    const firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    const lastName  = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    const num       = Math.floor(rng() * 9999);
    const username  = `${firstName.toLowerCase()}${lastName.toLowerCase().slice(0,4)}${num}`;
    const bio       = BIOS[Math.floor(rng() * BIOS.length)];
    const bgColor   = ['1a1a2e','16213e','0f3460','533483','2b2d42','1b1b2f','162447','1f4068'][Math.floor(rng() * 8)];
    const fgColor   = ['60a5fa','a78bfa','34d399','f472b6','fb923c','facc15','4ade80','38bdf8'][Math.floor(rng() * 8)];

    fans.push({
      id:       `fan_${i}`,
      name:     `${firstName} ${lastName}`,
      username,
      bio,
      avatar:   `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=${bgColor}&color=${fgColor}&size=200&bold=true`,
    });
  }

  _cache = fans;
  return fans;
}

// Get N fake fans quickly (subset)
export function getSomeFans(count = 50, offset = 0) {
  const all = getFakeFans();
  const start = offset % all.length;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(all[(start + i) % all.length]);
  }
  return result;
}
