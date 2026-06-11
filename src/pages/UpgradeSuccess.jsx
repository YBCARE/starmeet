// Stripe redirects here after successful payment
import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Star, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UpgradeSuccess() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { upgradeToPro, isPro, user } = useAuth();
  const [activated, setActivated] = useState(false);

  const plan = searchParams.get('plan') || 'pro';

  useEffect(() => {
    // Activate Pro status on this device
    if (!isPro) {
      upgradeToPro(plan);
    }
    setActivated(true);

    // Auto-redirect to feed after 5s
    const t = setTimeout(() => navigate('/feed', { replace: true }), 5000);
    return () => clearTimeout(t);
  }, []);

  const [countdown, setCountdown] = useState(5);
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: '#000', minHeight: '100vh', color: '#fff',
      fontFamily: 'Inter,system-ui,sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <style>{`
        @keyframes scaleIn { from { transform:scale(0.5); opacity:0 } to { transform:scale(1); opacity:1 } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: 440 }}>

        {/* Success ring */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'scaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 0 60px rgba(59,130,246,0.4)',
          }}>
            <Check size={48} strokeWidth={2.5} color="white" />
          </div>
          {/* Orbit dots */}
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: 8, height: 8, borderRadius: '50%',
              background: ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#22c55e'][i],
              transform: `rotate(${i * 72}deg) translateX(62px) translateY(-50%)`,
              animation: `pulse 1.5s ${i * 0.3}s ease-in-out infinite`,
            }} />
          ))}
        </div>

        <div style={{ animation: 'fadeUp 0.5s 0.2s ease both' }}>
          <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Payment successful
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-1px' }}>
            Welcome to Pro! ⭐
          </h1>
          <p style={{ fontSize: 16, color: '#888', lineHeight: 1.6, margin: '0 0 32px' }}>
            {user?.name ? `${user.name.split(' ')[0]}, you're` : "You're"} now a Pro member. Unlimited messages with any celebrity, starting right now.
          </p>

          {/* Features unlocked */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              Just unlocked for you
            </div>
            {[
              { icon: '💬', text: 'Unlimited direct messages with any celebrity' },
              { icon: '⚡', text: 'Priority replies — celebrities see your messages first' },
              { icon: '⭐', text: 'Pro badge visible on your profile' },
              { icon: '🔒', text: 'Access to exclusive celebrity content' },
              { icon: '🎉', text: 'Early access to every new feature' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 4 ? 10 : 0 }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ fontSize: 14, color: '#ccc' }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link to="/messages" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '15px 32px', background: '#3b82f6', color: '#fff',
            borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: 'none',
            marginBottom: 14, boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
          }}>
            <Zap size={18} fill="white" />
            Start messaging celebrities now
          </Link>

          <div style={{ fontSize: 13, color: '#444' }}>
            Redirecting to your feed in {countdown}s…
          </div>
        </div>
      </div>
    </div>
  );
}
