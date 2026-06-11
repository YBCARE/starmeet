export const celebrities = [
  { id: 1, name: "Zara Voss", category: "Actress", followers: "4.2M", posts: 312, verified: true, image: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=400&fit=crop", bio: "Award-winning actress. Known for her transformative roles in blockbuster films. Based in LA.", trending: true, newlyJoined: false },
  { id: 2, name: "Marcus Cole", category: "Musician", followers: "8.7M", posts: 541, verified: true, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop", bio: "Grammy-nominated artist. 4x platinum albums. World tour 2025.", trending: true, newlyJoined: false },
  { id: 3, name: "Sofia Reyes", category: "Model", followers: "12.1M", posts: 890, verified: true, image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=400&fit=crop", bio: "International supermodel. Vogue cover 6x. Ambassador for luxury brands.", trending: true, newlyJoined: false },
  { id: 4, name: "Drake West", category: "Director", followers: "2.9M", posts: 198, verified: true, image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=400&fit=crop", bio: "Visionary filmmaker. 2 Oscar wins. Redefining modern cinema.", trending: false, newlyJoined: false },
  { id: 5, name: "Lena Hart", category: "Comedian", followers: "6.5M", posts: 423, verified: true, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=400&fit=crop", bio: "Stand-up comedian. Netflix special out now. Making the world laugh.", trending: true, newlyJoined: false },
  { id: 6, name: "James Okafor", category: "Athlete", followers: "9.3M", posts: 267, verified: true, image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop", bio: "3x NBA champion. MVP 2023. Off-court: entrepreneur & philanthropist.", trending: false, newlyJoined: true },
  { id: 7, name: "Nina Cruz", category: "Creator", followers: "3.8M", posts: 1204, verified: true, image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=400&fit=crop", bio: "Content creator & entrepreneur. Tech, lifestyle, & culture.", trending: false, newlyJoined: true },
  { id: 8, name: "Theo Banks", category: "Movie Producer", followers: "1.7M", posts: 89, verified: true, image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=400&fit=crop", bio: "Blockbuster producer. $2B+ box office. Building the future of entertainment.", trending: false, newlyJoined: true },
  { id: 9, name: "Aria Moon", category: "Musician", followers: "5.4M", posts: 378, verified: true, image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&h=400&fit=crop", bio: "Singer-songwriter. Indie pop meets electronic. New album dropping soon.", trending: true, newlyJoined: false },
  { id: 10, name: "Kai Rivera", category: "Athlete", followers: "7.2M", posts: 445, verified: false, image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=400&fit=crop", bio: "World champion boxer. Undefeated. Training the next generation.", trending: true, newlyJoined: true },
  { id: 11, name: "Priya Sharma", category: "Actress", followers: "11.6M", posts: 623, verified: true, image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=1200&h=400&fit=crop", bio: "Bollywood to Hollywood. Global icon. Fashion forward.", trending: true, newlyJoined: false },
  { id: 12, name: "Leo Storm", category: "Director", followers: "2.1M", posts: 134, verified: true, image: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop", cover: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1200&h=400&fit=crop", bio: "Indie director turned A-list. Sundance darling. Stories that matter.", trending: false, newlyJoined: true },
];

export const categories = ["All", "Actors", "Musicians", "Movie Producers", "Athletes", "Comedians", "Creators", "Directors", "Models"];

export const posts = [
  { id: 1, celebrityId: 1, type: "image", content: "Just wrapped filming on my next project. Cannot wait for you all to see this one. 🎬", image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop", likes: 142300, comments: 4821, time: "2h ago" },
  { id: 2, celebrityId: 2, type: "image", content: "Studio sessions with the best. New music coming sooner than you think. 🎵", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop", likes: 289100, comments: 12450, time: "4h ago" },
  { id: 3, celebrityId: 3, type: "image", content: "Paris Fashion Week was everything. Merci to everyone who made this magical ✨", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop", likes: 521000, comments: 18230, time: "6h ago" },
  { id: 4, celebrityId: 5, type: "text", content: "Just told my therapist a joke and now she's billing me for emotional damages. That's comedy folks.", image: null, likes: 98700, comments: 7342, time: "8h ago" },
  { id: 5, celebrityId: 6, type: "image", content: "Early morning grind. Championship mentality is 24/7. 💪", image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=600&h=400&fit=crop", likes: 334500, comments: 9871, time: "12h ago" },
  { id: 6, celebrityId: 9, type: "image", content: "Recording this album has been the most vulnerable I've ever been. Worth it. 🌙", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=400&fit=crop", likes: 187600, comments: 6543, time: "1d ago" },
];

export const stories = [
  { id: 1, celebrity: celebrities[0], hasNew: true },
  { id: 2, celebrity: celebrities[1], hasNew: true },
  { id: 3, celebrity: celebrities[2], hasNew: false },
  { id: 4, celebrity: celebrities[4], hasNew: true },
  { id: 5, celebrity: celebrities[5], hasNew: false },
  { id: 6, celebrity: celebrities[8], hasNew: true },
];

export const messages = [
  { id: 1, celebrity: celebrities[0], lastMsg: "Thanks for your support! 💙", time: "2m", unread: 1 },
  { id: 2, celebrity: celebrities[1], lastMsg: "Check out my new track!", time: "1h", unread: 0 },
  { id: 3, celebrity: celebrities[2], lastMsg: "You're amazing, thank you!", time: "3h", unread: 3 },
  { id: 4, celebrity: celebrities[4], lastMsg: "Haha glad you liked it 😄", time: "1d", unread: 0 },
];
