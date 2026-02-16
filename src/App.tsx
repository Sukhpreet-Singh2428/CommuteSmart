import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Alerts } from './pages/Alerts';
import { Profile } from './pages/Profile';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <AnimatedLayout>
            <Navbar />
            <Dashboard />
          </AnimatedLayout>
        }
      />
      <Route
        path="/alerts"
        element={
          <AnimatedLayout>
            <Alerts />
          </AnimatedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <AnimatedLayout>
            <Profile />
          </AnimatedLayout>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <AppRoutes />
        </AnimatePresence>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: 'rgba(15, 23, 42, 0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
