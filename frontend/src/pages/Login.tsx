import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { AnimatedButton } from '../components/AnimatedButton';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      setShowConfetti(true);
      toast.success('Welcome back!');
      setTimeout(() => setShowConfetti(false), 2500);
      navigate('/dashboard');
    } catch {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blurred map bg */}
      <div className="absolute inset-0 bg-eco-darker" />
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/75.8,30.9,10,0/800x600?access_token=pk.placeholder')] bg-cover bg-center blur-2xl" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-eco-dark/80 to-eco-darker" />

      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={150} />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card p-8 rounded-2xl">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg gradient-eco flex items-center justify-center text-white font-bold">
              CS
            </div>
            <span className="font-semibold text-lg">CommuteSmart</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-white/60 mb-6">Sign in to continue your eco-journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-eco-emerald"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-eco-emerald"
                placeholder="••••••••"
              />
            </div>
            <AnimatedButton type="submit" className="w-full justify-center">
              {loading ? 'Signing in...' : 'Sign In'}
            </AnimatedButton>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-eco-emerald hover:underline">Register</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
