import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CelebProvider, useCelebContext } from './context/CelebContext';
import { AuthProvider } from './context/AuthContext';
import { FanPostProvider } from './context/FanPostContext';
import { AdminProvider } from './context/AdminContext';
import { TopLoadingBar } from './components/LoadingProgress';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Explore from './pages/Explore';
import CelebrityProfile from './pages/CelebrityProfile';
import Feed from './pages/Feed';
import Messages from './pages/Messages';
import Login from './pages/Login';
import Admin from './pages/Admin';
import UserProfile from './pages/UserProfile';
import FanProfile from './pages/FanProfile';
import CreatePost from './pages/CreatePost';
import Onboarding from './pages/Onboarding';
import UpgradeSuccess from './pages/UpgradeSuccess';

const pv = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0,       transition: { duration: 0.12 } },
};

function AnimatedRoutes() {
  const location = useLocation();
  const noNavbar = ['/', '/login', '/signup', '/onboarding', '/upgrade-success'].includes(location.pathname) ||
                   location.pathname.startsWith('/admin');

  return (
    <>
      {!noNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} variants={pv} initial="initial" animate="animate" exit="exit">
          <Routes location={location}>
            {/* Public */}
            <Route path="/"       element={<Landing />} />
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Login />} />
            <Route path="/admin"  element={<Admin />} />

            {/* Protected */}
            <Route path="/explore"       element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/celebrity/:id" element={<CelebrityProfile />} />
            <Route path="/feed"          element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/messages"      element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/user/:fanId"   element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/fan/:fanId"    element={<ProtectedRoute><FanProfile /></ProtectedRoute>} />
            <Route path="/create-post"   element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/onboarding"       element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/upgrade-success" element={<ProtectedRoute><UpgradeSuccess /></ProtectedRoute>} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

function AppShell() {
  const { phase } = useCelebContext();
  return (
    <>
      <TopLoadingBar phase={phase} />
      <BrowserRouter><AnimatedRoutes /></BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AuthProvider>
        <FanPostProvider>
          <CelebProvider>
            <AppShell />
          </CelebProvider>
        </FanPostProvider>
      </AuthProvider>
    </AdminProvider>
  );
}
