import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  // Get user initials from email
  const getUserInitials = () => {
    const email = user.email;
    const namePart = email.split('@')[0];
    const parts = namePart.split(/[._-]/);
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return namePart.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 hover:bg-white/5 rounded-xl p-2 transition-colors"
      >
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-white">{user.email}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Points:</span>
            <span className="text-xs font-bold text-[#0fb880]">{user.points}</span>
          </div>
        </div>
        <div className="h-9 w-9 rounded-full border-2 border-[#0fb880]/30 p-0.5">
          <div className="w-full h-full rounded-full bg-[#0fb880] flex items-center justify-center text-white font-bold text-sm">
            {getUserInitials()}
          </div>
        </div>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a2f2a] border border-[#0fb880]/20 rounded-xl shadow-xl overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">Level:</span>
              <span className="text-xs font-bold text-[#0fb880]">{Math.floor(user.points / 100) + 1}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-bold text-yellow-500">{user.points} pts</span>
            </div>
          </div>
          
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-lg">person</span>
              Profile
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
