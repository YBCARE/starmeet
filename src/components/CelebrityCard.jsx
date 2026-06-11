import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Check } from 'lucide-react';

export default function CelebrityCard({ celebrity: c, index = 0 }) {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=111827&color=3B82F6&size=400`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      whileHover={{ y: -4, scale: 1.01 }}
    >
      <Link to={`/celebrity/${c.id}`}>
        <div className="glow-card bg-[#111] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group">

          {/* Cover strip */}
          <div className="relative h-24 overflow-hidden bg-gradient-to-r from-blue-900/40 to-black">
            <img src={c.cover} alt=""
              className="w-full h-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
          </div>

          <div className="px-4 pb-4 -mt-6 relative">
            <div className="flex items-end gap-3">
              {/* Avatar with verified badge bottom-left */}
              <div className="relative flex-shrink-0">
                <img src={c.image} alt={c.name}
                  className="w-14 h-14 rounded-xl border-2 border-[#111] object-cover object-top"
                  onError={e => { e.currentTarget.src = fallback; }}
                />
                {/* Blue verified badge — bottom-left corner */}
                <div className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-blue-500
                  flex items-center justify-center border-2 border-[#111]
                  shadow-sm shadow-blue-500/50">
                  <Check size={10} strokeWidth={3} color="white" />
                </div>
              </div>

              <div className="pb-1 min-w-0">
                <div className="font-semibold text-white text-sm leading-tight truncate">{c.name}</div>
                <span className="text-xs text-blue-400 font-medium">{c.category}</span>
              </div>
            </div>

            {c.bio && (
              <p className="mt-2 text-white/35 text-xs leading-relaxed line-clamp-2">{c.bio}</p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 text-white/40 text-xs">
                <Users size={11} /><span>{c.followers}</span>
              </div>
              <button className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium">
                Follow
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
