import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms) {
      toast.error('Please accept the terms and conditions');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      setShowConfetti(true);
      toast.success('Green account created! Welcome to CommuteSmart.');
      setTimeout(() => setShowConfetti(false), 2500);
      // Navigate to dashboard on successful signup
      navigate('/dashboard');
    } catch (error: any) {
      // Show specific backend error message
      const errorMessage = error.message || 'Registration failed';
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
        <div className="w-full max-w-md mx-auto my-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-icons text-white text-lg">directions_bus</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CommuteSmart</span>
          </div>
          
          <div className="mb-2">
            <h2 className="text-3xl font-bold text-white mb-2">Join the Movement</h2>
            <p className="text-gray-400">Create your account to start commuting sustainably across Punjab.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="name@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-surface-dark/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex items-center py-1">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                required
                className="h-4 w-4 rounded border-white/10 bg-background-dark text-primary focus:ring-primary"
              />
              <label className="ml-2 block text-sm text-gray-400" htmlFor="terms">
                I agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </label>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-xl btn-glow transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
              >
                <span>{loading ? 'Creating...' : 'Create Green Account'}</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">energy_savings_leaf</span>
              </button>
            </div>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="px-4 bg-background-dark text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <button className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
              <img alt="Google" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnkwxTICOpYJ_7PcJ_VspbSbBjNd52AFRLZiEgJUoyVc5vaBdQCoC67PN46ye8DBHuDDl55WWdUwdAwMVn3ERHNsRI1Z85f56s1PmNtYewlRe6ArGMg_oVgA-zGMUPHks8c3M-mHsOpFhNPwUJu4Q7mmtxkBTAAHv2QbLMgKuopJPBQwgaZHqqOy0aQEzxdZs3gxucaTqJFpgkWFSpMAM7G02H7v-S4Xr_6aVvAh9nxz89LnmrzniLXEgon_aynvFJTJ5HKogtnGU"/>
              <span className="text-sm font-medium text-gray-300">Google</span>
            </button>
            <button className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
              <span className="material-icons text-xl text-gray-300">apple</span>
              <span className="text-sm font-medium text-gray-300">Apple</span>
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500">
            Already have an account? 
            <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
      
      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-[#050c0a]">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(#0fb880 1px, transparent 1px), linear-gradient(90deg, #0fb880 1px, transparent 1px)', backgroundSize: '60px 60px'}}></div>
        <div className="absolute inset-0 flex items-center justify-center isometric-container overflow-visible">
          <div className="city-scene w-[800px] h-[800px] relative">
            <div className="building w-20 h-20 bottom-[400px] left-[300px]" style={{transform: 'translateZ(100px)', height: '160px'}}></div>
            <div className="building w-16 h-16 bottom-[350px] left-[450px]" style={{transform: 'translateZ(80px)', height: '120px'}}></div>
            <div className="building w-24 h-24 bottom-[500px] left-[400px]" style={{transform: 'translateZ(60px)', height: '100px'}}></div>
            <div className="building w-12 h-12 bottom-[300px] left-[200px]" style={{transform: 'translateZ(120px)', height: '200px'}}></div>
            <div className="building w-20 h-20 bottom-[550px] left-[200px]" style={{transform: 'translateZ(40px)', height: '80px'}}></div>
            <div className="building w-16 h-16 bottom-[450px] left-[600px]" style={{transform: 'translateZ(90px)', height: '140px'}}></div>
            <svg className="absolute inset-0 w-full h-full" style={{transform: 'translateZ(2px)'}} viewBox="0 0 800 800">
              <path className="artery opacity-60" d="M 0 400 L 800 400" fill="none" stroke="#0fb880" strokeWidth="6" style={{strokeDasharray: '10 5'}}></path>
              <path className="artery opacity-40" d="M 400 0 L 400 800" fill="none" stroke="#0fb880" strokeWidth="4" style={{strokeDasharray: '15 10'}}></path>
              <path className="artery opacity-30" d="M 200 200 L 600 600" fill="none" stroke="#0fb880" strokeWidth="3"></path>
              <circle className="animate-pulse" fill="#fff" r="4">
                <animateMotion dur="4s" path="M 0 400 L 800 400" repeatCount="indefinite"></animateMotion>
              </circle>
              <circle className="animate-pulse" fill="#0ea5e9" r="3">
                <animateMotion dur="6s" path="M 400 0 L 400 800" repeatCount="indefinite"></animateMotion>
              </circle>
              <circle className="animate-pulse" fill="#0fb880" r="5">
                <animateMotion dur="5s" path="M 200 200 L 600 600" repeatCount="indefinite"></animateMotion>
              </circle>
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 p-16 flex flex-col justify-between z-20">
          <div className="flex justify-between items-start">
            <div className="glass-card p-6 rounded-3xl w-64 transform hover:translate-y-[-5px] transition-all duration-500">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">diversity_3</span>
                </div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Community Reach</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white leading-none">10k+</span>
                <span className="text-primary text-xs font-medium mb-1">Live</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Verified Green Neighbors in Punjab</p>
            </div>
            <div className="glass-card p-6 rounded-3xl w-64 transform hover:translate-y-[-5px] transition-all duration-500 delay-75">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">verified</span>
                </div>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Efficiency</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white leading-none">98%</span>
                <span className="text-secondary text-xs font-medium mb-1">Target</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">On-Time Reliability Index</p>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="glass-card p-8 rounded-[2.5rem] w-full max-w-lg border-t-primary/30 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Ecosystem Health
                  </span>
                  <h4 className="text-3xl font-extrabold text-white">Smart Punjab Network</h4>
                  <p className="text-gray-400 text-sm">Synchronizing transit data across 5 major districts</p>
                </div>
                <div className="hidden sm:block">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">hub</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-gray-500 tracking-wider uppercase">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Green Arteries
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                Active Commuters
              </span>
            </div>
            <span className="glass-card px-4 py-2 rounded-full text-[10px] border-white/5">
              Simulation: <span className="text-primary">Real-time</span>
            </span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050c0a] via-transparent to-transparent opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#050c0a] via-transparent to-transparent opacity-50"></div>
      </div>
    </div>
  );
}
