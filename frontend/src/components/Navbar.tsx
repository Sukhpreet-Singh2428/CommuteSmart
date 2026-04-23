import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/alerts', label: 'Community', icon: 'forum' },
  { path: '/profile', label: 'Profile', icon: 'person' },
];

export function Navbar() {
  const { user, isAuthenticated } = useAuth();

  // POLISHED: Enhanced hover states and transitions

  return (
    <>
      {/* Desktop top navbar */}
      <motion.nav 
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 px-4 md:px-8 items-center justify-between glass-card-light border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <NavLink to="/" className="flex items-center gap-2 group">
            <motion.div 
              className="w-9 h-9 rounded-lg bg-[#0fb880] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(15,184,128,0.4)] group-hover:shadow-[0_0_25px_rgba(15,184,128,0.6)] transition-all duration-300"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              CS
            </motion.div>
            <span className="font-semibold text-white group-hover:text-[#0fb880] transition-colors duration-300">CommuteSmart</span>
          </NavLink>
        </motion.div>
        <div className="flex items-center gap-6">
          {[
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/alerts', label: 'Community' },
            { to: '/profile', label: 'Profile' },
          ].map((item) => (
            <motion.div key={item.to} whileHover={{ y: -2 }}>
              <NavLink 
                to={item.to} 
                className={({ isActive }) =>
                  `relative px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-[#0fb880]' 
                      : 'text-white/80 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0fb880] rounded-full"
                        layoutId="navbar-indicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.span 
                className="text-[#0fb880] font-medium text-sm"
                whileHover={{ scale: 1.1 }}
              >
                {user.points || 0} XP
              </motion.span>
              <motion.div 
                className="w-9 h-9 rounded-full bg-[#0fb880]/30 flex items-center justify-center font-medium text-white border-2 border-[#0fb880]/50 cursor-pointer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </motion.div>
            </motion.div>
          )}
          {!isAuthenticated && (
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
                <NavLink to="/login" className="text-white/80 hover:text-white text-sm font-medium transition-colors duration-300">
                  Login
                </NavLink>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <NavLink
                  to="/register"
                  className="bg-[#0fb880] hover:bg-[#0fb880]/90 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 shadow-lg shadow-[#0fb880]/20 hover:shadow-[#0fb880]/30"
                >
                  Get App
                </NavLink>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Mobile bottom navbar */}
      <motion.nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe glass-card-light border-t border-white/10"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <motion.div key={item.path} whileHover={{ y: -3 }} whileTap={{ y: 0 }}>
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all duration-300 relative ${
                    isActive ? 'text-[#0fb880]' : 'text-white/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <motion.span 
                      className="material-symbols-outlined text-lg"
                      animate={{ 
                        scale: isActive ? [1, 1.2, 1] : 1,
                        rotate: isActive ? [0, 5, -5, 0] : 0
                      }}
                      transition={{ 
                        duration: 0.3,
                        repeat: isActive ? Infinity : 0,
                        repeatDelay: 2
                      }}
                    >
                      {item.icon}
                    </motion.span>
                    <span className="text-xs mt-0.5 font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#0fb880] rounded-full"
                        layoutId="mobile-indicator"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </motion.nav>

      {/* Spacer for fixed nav on desktop */}
      <div className="hidden md:block h-16" />
    </>
  );
}
