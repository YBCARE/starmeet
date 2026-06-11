import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Users, Loader2 } from 'lucide-react';

const PHASE_LABELS = {
  init:        { text: 'Initialising…',                      pct: 2  },
  seeds:       { text: 'Loading featured celebrities…',       pct: 15 },
  discovering: { text: 'Discovering celebrities worldwide…',  pct: 50 },
  enriching:   { text: 'Fetching photos & bios…',            pct: 85 },
  done:        { text: 'Done',                                pct: 100},
};

/** Mini bar shown at the top of the page during background loading */
export function TopLoadingBar({ phase }) {
  if (phase === 'done' || phase === 'init') return null;
  const { pct, text } = PHASE_LABELS[phase] || PHASE_LABELS.init;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-white/5">
      <motion.div
        className="h-full bg-blue-500"
        initial={{ width: '0%' }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

/** Full-screen splash for first-ever load (no cached data yet) */
export function FullLoadingScreen({ phase, fetched }) {
  const { text, pct } = PHASE_LABELS[phase] || PHASE_LABELS.init;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-8">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center">
          <Zap size={28} fill="white" color="white" />
        </div>
        <span className="heading text-5xl text-white tracking-wider">STARMEET</span>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-8 text-white/40 text-sm"
      >
        <span className="flex items-center gap-1.5"><Users size={14} /> {fetched.toLocaleString()} loaded</span>
        <span className="flex items-center gap-1.5"><Star size={14} /> up to 2,000 celebrities</span>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-72"
      >
        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-white/30">
          <span className="flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            {text}
          </span>
          <span>{pct}%</span>
        </div>
      </motion.div>

      {/* Subtitle */}
      <p className="text-white/20 text-xs text-center max-w-xs">
        Fetching real data from Wikipedia — first load only.<br />
        Future visits load instantly from cache.
      </p>
    </div>
  );
}
