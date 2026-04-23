import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';

interface PageNavbarProps {
  activePage: 'dashboard' | 'alerts' | 'profile';
}

/**
 * Shared page navbar matching the Dashboard's inline nav style.
 * Uses UserMenu in the right slot and Link-based nav items in the center.
 */
export function PageNavbar({ activePage }: PageNavbarProps) {
  const linkClass = (page: string) =>
    page === activePage
      ? 'text-[#0fb880] border-b-2 border-[#0fb880] h-16 flex items-center text-sm font-medium'
      : 'text-gray-400 hover:text-white transition-colors text-sm font-medium';

  const mobileLinkClass = (page: string) =>
    page === activePage
      ? 'flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-[#0fb880]'
      : 'flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-gray-400';

  return (
    <>
      {/* Desktop Navigation — matches Dashboard.tsx exactly */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-primary/20 bg-[#0a1411]/80 backdrop-blur-md z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-icons text-white text-lg">directions_bus</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CommuteSmart</span>
        </div>
        <div className="hidden md:flex items-center justify-center flex-1 gap-12">
          <Link className={linkClass('dashboard')} to="/dashboard">Dashboard</Link>
          <Link className={linkClass('alerts')} to="/alerts">Community</Link>
          <Link className={linkClass('profile')} to="/profile">Profile</Link>
        </div>
        <div className="flex items-center justify-end">
          <div className="relative z-[100]">
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation — matches Dashboard.tsx exactly */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe glass-panel border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          <Link to="/dashboard" className={mobileLinkClass('dashboard')}>
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-xs mt-0.5">Dashboard</span>
          </Link>
          <Link to="/alerts" className={mobileLinkClass('alerts')}>
            <span className="material-symbols-outlined text-lg">forum</span>
            <span className="text-xs mt-0.5">Community</span>
          </Link>
          <Link to="/profile" className={mobileLinkClass('profile')}>
            <span className="material-symbols-outlined text-lg">person</span>
            <span className="text-xs mt-0.5">Profile</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
