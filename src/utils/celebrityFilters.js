/**
 * Keep only living, real celebrities in the public catalog.
 * Excludes: memorial accounts, synthetic demo celebs, known deceased figures.
 */

/** Fake demo celebrities from src/data/celebrities.js */
export const SYNTHETIC_CELEBRITY_NAMES = new Set([
  'Zara Voss', 'Marcus Cole', 'Sofia Reyes', 'Drake West', 'Lena Hart',
  'James Okafor', 'Nina Cruz', 'Theo Banks', 'Aria Moon', 'Kai Rivera',
  'Priya Sharma', 'Leo Storm',
]);

/** Known deceased — exact Wikipedia title match */
export const DECEASED_CELEBRITY_NAMES = new Set([
  'Robin Williams', 'Paul Walker', 'Alan Rickman', 'Heath Ledger',
  'Philip Seymour Hoffman', 'Christopher Plummer', 'James Earl Jones',
  'Bernie Mac', 'Richard Pryor', 'Audrey Hepburn', 'Sidney Poitier',
  'Betty White', 'Bob Saget', 'Chadwick Boseman', 'Luke Perry',
  'Cameron Boyce', 'Matthew Perry', 'Angus Cloud', 'Brittany Murphy',
  'Elvis Presley', 'Michael Jackson', 'Prince', 'Whitney Houston',
  'Freddie Mercury', 'David Bowie', 'Kurt Cobain', 'Amy Winehouse',
  'Jimi Hendrix', 'Janis Joplin', 'Jim Morrison', 'Aretha Franklin',
  'Marvin Gaye', 'Ray Charles', 'Sam Cooke', 'Otis Redding',
  'John Lennon', 'George Harrison', 'Tom Petty', 'Chester Bennington',
  'Lil Peep', 'Juice Wrld', 'Mac Miller', 'XXXTentacion',
  'Aaliyah', 'Bob Marley', 'Frank Sinatra', 'Ella Fitzgerald',
  'Billie Holiday', 'Nina Simone', 'James Brown', 'B.B. King',
  'Muddy Waters', 'Johnny Cash', 'Luther Vandross',
  'Muhammad Ali', 'Pelé', 'Diego Maradona', 'Ayrton Senna',
  'Alfred Hitchcock', 'Stanley Kubrick', 'Orson Welles', 'Akira Kurosawa',
  'Ingmar Bergman', 'Federico Fellini', 'Jean-Luc Godard', 'François Truffaut',
  'Billy Wilder', 'George Carlin', 'Marilyn Monroe',
]);

export function isSyntheticCelebrity(celeb) {
  return celeb?.name && SYNTHETIC_CELEBRITY_NAMES.has(celeb.name);
}

export function isDeceasedCelebrity(celeb) {
  if (!celeb?.name) return false;
  if (celeb.isMemorial) return true;
  if (DECEASED_CELEBRITY_NAMES.has(celeb.name)) return true;
  const base = celeb.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return base !== celeb.name && DECEASED_CELEBRITY_NAMES.has(base);
}

export function isLiveCelebrity(celeb, overrides = {}) {
  if (!celeb?.name) return false;
  if (overrides[celeb.id]?._deleted) return false;
  if (isSyntheticCelebrity(celeb)) return false;
  if (isDeceasedCelebrity(celeb)) return false;
  return true;
}

export function filterCelebrityCatalog(celebs, overrides = {}) {
  if (!Array.isArray(celebs)) return [];
  return celebs.filter(c => isLiveCelebrity(c, overrides));
}
