import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { AnimatedButton } from '../components/AnimatedButton';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      setShowConfetti(true);
      toast.success('Account created! Welcome to CommuteSmart.');
      setTimeout(() => setShowConfetti(false), 2500);
      navigate('/dashboard');
    } catch {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-eco-darker" />
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
          <h1 className="text-2xl font-bold mb-2">Create account</h1>
          <p className="text-white/60 mb-6">Join Punjab's green mobility movement</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-eco-emerald"
                placeholder="Bilal Ahmed"
              />
            </div>
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
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-eco-emerald"
                placeholder="••••••••"
              />
            </div>
            <AnimatedButton type="submit" className="w-full justify-center">
              {loading ? 'Creating account...' : 'Get Started'}
            </AnimatedButton>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-eco-emerald hover:underline">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
