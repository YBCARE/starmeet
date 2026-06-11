import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, authLoading } = useAuth();
  const location = useLocation();

  // Wait for Firebase Auth to determine session before redirecting
  // But if we already have a cached user, skip the spinner (no flicker for returning users)
  if (authLoading && !isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #222', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color: '#555', fontSize: 13, fontFamily: 'Inter,sans-serif' }}>Loading…</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
