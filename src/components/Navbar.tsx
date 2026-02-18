import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/alerts', label: 'Community', icon: '🔔' },
  { path: '/profile', label: 'Profile & Impact', icon: '👤' },
];

export function Navbar() {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      {/* Desktop top navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 px-4 md:px-8 items-center justify-between glass-card-light border-b border-white/10">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-eco flex items-center justify-center text-white font-bold text-sm">
            CS
          </div>
          <span className="font-semibold">CommuteSmart</span>
        </NavLink>
        <div className="flex items-center gap-6">
          <NavLink to="/dashboard" className="text-white/80 hover:text-white">Dashboard</NavLink>
          <NavLink to="/alerts" className="text-white/80 hover:text-white">Community</NavLink>
          <NavLink to="/profile" className="text-white/80 hover:text-white">Profile & Impact</NavLink>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <>
              <span className="text-eco-emerald font-medium">{user.xp} XP</span>
              <div className="w-9 h-9 rounded-full bg-eco-emerald/30 flex items-center justify-center font-medium">
                {user.name.charAt(0)}
              </div>
            </>
          )}
          {!isAuthenticated && (
            <>
              <NavLink to="/login" className="text-white/80 hover:text-white">Login</NavLink>
              <NavLink
                to="/register"
                className="gradient-eco px-4 py-2 rounded-lg text-white font-medium"
              >
                Get App
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Mobile bottom navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe glass-card-light border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-colors ${
                  isActive ? 'text-eco-emerald bg-eco-emerald/10' : 'text-white/70'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Spacer for fixed nav on desktop */}
      <div className="hidden md:block h-16" />
    </>
  );
}
