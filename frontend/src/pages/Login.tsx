import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
      // CONNECTED TO BACKEND: Redirect to dashboard on successful login
      navigate('/dashboard');
    } catch (error: any) {
      // CONNECTED TO BACKEND: Show specific backend error message
      const errorMessage = error.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-background-dark text-gray-100 font-display antialiased h-screen overflow-hidden auth-grid">
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={150} />
      )}
      
      <div className="w-full lg:w-[450px] xl:w-[550px] flex flex-col justify-center p-8 lg:p-16 z-20 relative bg-background-dark/80 backdrop-blur-sm border-r border-white/5">
        <div className="w-full max-w-md mx-auto my-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-icons text-white text-lg">directions_bus</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CommuteSmart</span>
          </div>
          
          <div className="mb-3">
            <h2 className="text-3xl font-bold text-white mb-2">Access Portal</h2>
            <p className="text-gray-400">Join data-driven transit revolution in Punjab.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="name@punjab.gov.in"
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-gray-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary-dark transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="•••••"
              />
            </div>
            
            <div className="flex items-center py-1">
              <input
                type="checkbox"
                id="remember-me"
                name="remember-me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-background-dark text-primary focus:ring-primary"
              />
              <label className="ml-2 block text-sm text-gray-400" htmlFor="remember-me">
                Keep me logged in
              </label>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl btn-glow transition-all flex items-center justify-center gap-2 group"
              >
                <span>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">login</span>
              </button>
            </div>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="px-4 bg-background-dark text-gray-500">Secure Authentication</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNabNVjB4_nVypd9t6NsGfO82P0sCcoj7IH07BVTb6Wzp5Ek3BVuqDfxz2moQckXBvLhniXOSPfaBXpwLiAMhl2bdtWpwpfod7htNLn-nJq02sn_yHOE6agmrTvo7Ya9e3NBbMrIEIBmWIOj2AiqBK7FWhr9wczmAj3bwupgTzo6rlN3E5DxBtBOLCKtIBbX6WOSbJWXyo9DCz4y5rHcDC5JTQNrMJ0qjAyLJxlmAGY-SPcSqclORKCXMl6EoK32A9lyW-0RngYcw"/>
              <span className="text-sm font-medium text-gray-300">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
              <span className="material-icons text-xl text-gray-300">apple</span>
              <span className="text-sm font-medium text-gray-300">Apple</span>
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500">
            New to CommuteSmart? 
            <Link to="/register" className="text-primary font-bold hover:text-primary-dark transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
      
      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-[#050c0a]">
        <div className="topo-grid opacity-30"></div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <svg className="w-full h-full opacity-60" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
            <defs>
              <filter height="200%" id="neon-glow" width="200%" x="-50%" y="-50%">
                <feGaussianBlur result="blur" stdDeviation="4"></feGaussianBlur>
                <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
              </filter>
              <linearGradient id="route-grad-1" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#0fb880" stopOpacity="0"></stop>
                <stop offset="50%" stopColor="#0fb880" stopOpacity="1"></stop>
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            <path className="map-line" d="M -100 200 Q 250 150 500 400 T 1100 600" fill="none" filter="url(#neon-glow)" stroke="url(#route-grad-1)" strokeWidth="2"></path>
            <path className="map-line" d="M -100 500 Q 300 450 600 700 T 1100 300" fill="none" filter="url(#neon-glow)" stroke="url(#route-grad-1)" strokeWidth="3" style={{animationDelay: '-2s'}}></path>
            <path className="map-line" d="M 200 -100 Q 400 300 100 600 T 800 1100" fill="none" filter="url(#neon-glow)" stroke="url(#route-grad-1)" strokeWidth="2" style={{animationDelay: '-5s'}}></path>
            <path className="map-line" d="M 800 -100 Q 600 400 900 700 T 400 1100" fill="none" filter="url(#neon-glow)" stroke="url(#route-grad-1)" strokeWidth="1.5" style={{animationDelay: '-7s'}}></path>
            <circle className="animate-pulse" cx="500" cy="400" fill="#0fb880" r="4"></circle>
            <circle className="animate-ping" cx="500" cy="400" fill="none" r="10" stroke="#0fb880" strokeWidth="1" style={{animationDuration: '3s'}}></circle>
            <circle className="animate-pulse" cx="600" cy="700" fill="#0ea5e9" r="4" style={{animationDelay: '1s'}}></circle>
            <circle className="animate-pulse" cx="100" cy="600" fill="#0fb880" r="4"></circle>
          </svg>
        </div>
        
        <div className="absolute inset-0 p-16 flex flex-col justify-between z-20">
          <div className="flex justify-between items-start">
            <div className="glass-card p-6 rounded-3xl w-64 transform hover:scale-105 transition-transform duration-500">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">directions_bus</span>
                </div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Fleet</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white leading-none">1,284</span>
                <span className="text-primary text-xs font-medium mb-1">+12%</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Live tracking across Punjab districts</p>
            </div>
            
            <div className="glass-card p-6 rounded-3xl w-64 transform hover:scale-105 transition-transform duration-500 delay-75">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">groups</span>
                </div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Live Commuters</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white leading-none">42.5k</span>
                <span className="text-secondary text-xs font-medium mb-1">Peak</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Current active network participation</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <div className="glass-card p-8 rounded-[2rem] w-full max-w-lg border-t-primary/30 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Sustainability Impact
                  </span>
                  <h4 className="text-3xl font-extrabold text-white">18.4 Tons CO₂</h4>
                  <p className="text-gray-400 text-sm">Total emissions prevented today via smart pooling</p>
                </div>
                <div className="hidden sm:block">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">eco</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-xs font-medium text-gray-500 tracking-wider uppercase">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Live Traffic
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Public Transit
              </span>
            </div>
            <span className="glass-card px-4 py-2 rounded-full text-[10px] border-white/5">
              System Status: <span className="text-primary">Optimal</span>
            </span>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#050c0a] via-transparent to-transparent opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-[#050c0a]/40 via-transparent to-transparent opacity-40"></div>
      </div>
    </div>
  );
}
