import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const badges = [
  { title: 'Smog Fighter', icon: 'workspace_premium', borderClass: 'border-emerald-500', iconClass: 'bg-emerald-500/20 text-emerald-500', unlocked: true },
  { title: 'Bus Pro', icon: 'commute', borderClass: 'border-teal-500', iconClass: 'bg-teal-500/20 text-teal-500', unlocked: true },
  { title: 'Route Scout', icon: 'lock', borderClass: 'border-emerald-400', iconClass: 'bg-emerald-100 dark:bg-white/5 text-gray-400', unlocked: false },
  { title: 'Green King', icon: 'lock', borderClass: 'border-teal-400', iconClass: 'bg-emerald-100 dark:bg-white/5 text-gray-400', unlocked: false },
];

export function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'impact' | 'achievements' | 'settings'>('impact');
  const [trafficAlerts, setTrafficAlerts] = useState(true);
  const [impactMilestones, setImpactMilestones] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="font-display min-h-screen flex antialiased selection:bg-primary selection:text-white overflow-hidden bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex flex-col border-r border-gray-200 dark:border-primary/10 bg-white dark:bg-background-dark h-screen fixed left-0 top-0 z-50 transition-all duration-300">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-100 dark:border-primary/10">
          <Link to="/" className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
              CS
            </div>
            <span className="ml-3 font-bold text-xl hidden lg:block tracking-tight text-gray-900 dark:text-white">CommuteSmart</span>
          </Link>
        </div>
        <nav className="flex-1 py-6 space-y-1 px-2 lg:px-4">
          <Link to="/dashboard" className="flex items-center px-2 lg:px-4 py-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-primary/5 transition-all group">
            <span className="material-icons group-hover:scale-110">dashboard</span>
            <span className="ml-3 hidden lg:block font-medium">Dashboard</span>
          </Link>
          <Link to="/dashboard" className="flex items-center px-2 lg:px-4 py-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-primary/5 transition-all group">
            <span className="material-icons group-hover:scale-110">map</span>
            <span className="ml-3 hidden lg:block font-medium">Route Planner</span>
          </Link>
          <Link to="/profile" className="flex items-center px-2 lg:px-4 py-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-primary/5 transition-all group">
            <span className="material-icons group-hover:scale-110">leaderboard</span>
            <span className="ml-3 hidden lg:block font-medium">Leaderboard</span>
          </Link>
          <Link to="/profile" className="flex items-center px-2 lg:px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold group relative">
            <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500 rounded-r" />
            <span className="material-icons">person</span>
            <span className="ml-3 hidden lg:block">Profile & Impact</span>
          </Link>
          <Link to="/alerts" className="flex items-center px-2 lg:px-4 py-3 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-primary/5 transition-all group">
            <span className="material-icons group-hover:scale-110">forum</span>
            <span className="ml-3 hidden lg:block font-medium">Community</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-primary/10 space-y-2">
          <div className="flex items-center justify-between px-2 lg:px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-xl lg:rounded-lg">
            <span className="material-icons text-gray-500 dark:text-gray-400 text-lg hidden lg:block">dark_mode</span>
            <button type="button" onClick={() => setDarkMode(!darkMode)} className="w-10 h-5 bg-emerald-500/30 rounded-full relative flex items-center transition-all">
              <div className={`w-4 h-4 bg-emerald-500 rounded-full absolute transition-all duration-300 left-0.5 shadow-sm ${darkMode ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 h-screen overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Hub</h1>
            <nav className="flex gap-6 mt-4 border-b border-gray-200 dark:border-primary/10">
              <button type="button" onClick={() => setActiveTab('impact')} className={`pb-2 border-b-2 px-1 transition-all ${activeTab === 'impact' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold' : 'border-transparent text-gray-500 hover:text-emerald-500'}`}>
                Impact & Profile
              </button>
              <button type="button" onClick={() => setActiveTab('achievements')} className={`pb-2 border-b-2 px-1 transition-all ${activeTab === 'achievements' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold' : 'border-transparent text-gray-500 hover:text-emerald-500'}`}>
                Achievements
              </button>
              <button type="button" onClick={() => setActiveTab('settings')} className={`pb-2 border-b-2 px-1 transition-all ${activeTab === 'settings' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold' : 'border-transparent text-gray-500 hover:text-emerald-500'}`}>
                Settings
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Chandigarh AQI: 142</span>
            </div>
            <button type="button" className="p-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-primary/10 text-gray-600 dark:text-gray-400 hover:text-emerald-500">
              <span className="material-icons">notifications_active</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-card-profile rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700" />
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-4 group/avatar">
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-emerald-500 to-teal-400">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-4 border-white dark:border-background-dark shadow-xl text-white text-3xl font-bold">
                      {user?.name?.charAt(0) ?? 'U'}
                    </div>
                  </div>
                  <button type="button" className="absolute bottom-1 right-1 bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white p-2 rounded-full shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity border border-emerald-100 dark:border-emerald-400">
                    <span className="material-icons text-sm">edit</span>
                  </button>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name ?? 'User'}</h2>
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mb-4 bg-emerald-500/10 px-3 py-1 rounded-full inline-block">Pro Commuter • Chandigarh</p>
                <div className="w-full space-y-2 mt-4">
                  <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    <span>Level 14</span>
                    <span>2,850 / 3,000 XP</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-emerald-500/10 rounded-full h-3 overflow-hidden p-0.5 border border-gray-300 dark:border-emerald-500/20">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full shadow-sm shadow-emerald-500/30" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card-profile rounded-2xl p-6 space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-icons text-emerald-500">eco</span>
                Personalized Eco-Impact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase">Trees Saved</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">4.2</p>
                </div>
                <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 uppercase">Clean Air Rank</p>
                  <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">#12</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">&quot;Your commute this month avoided as much smog as taking 5 rickshaws off Madhya Marg!&quot;</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card-profile rounded-2xl p-6 glass-card-hover transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <span className="material-icons text-3xl">directions_bus</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">PUBLIC TRANSIT</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">1,248<span className="text-lg font-normal text-gray-500 ml-1">km</span></p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Distance Traveled</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="material-icons text-sm">trending_up</span>
                  <span>+15% from last month</span>
                </div>
              </div>
              <div className="glass-card-profile rounded-2xl p-6 glass-card-hover transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-teal-500/10 rounded-xl text-teal-500">
                    <span className="material-icons text-3xl">cloud_off</span>
                  </div>
                  <span className="text-xs font-bold text-teal-500 bg-teal-500/10 px-2 py-1 rounded">EMISSIONS AVOIDED</span>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">215<span className="text-lg font-normal text-gray-500 ml-1">kg</span></p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">Car Emissions Saved</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-sm text-teal-600 dark:text-teal-400 font-medium">
                  <span className="material-icons text-sm">check_circle</span>
                  <span>Equivalent to 45 gallons of fuel</span>
                </div>
              </div>
            </section>

            <section className="glass-card-profile rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-emerald-500/10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-icons text-emerald-500">settings</span>
                  Preferences & Settings
                </h3>
              </div>
              <div className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Real-time Traffic Alerts</span>
                          <span className="text-xs text-gray-500">Get notified about traffic jams</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={trafficAlerts} onChange={() => setTrafficAlerts(!trafficAlerts)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Impact Milestones</span>
                          <span className="text-xs text-gray-500">Celebrate your eco-achievements</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={impactMilestones} onChange={() => setImpactMilestones(!impactMilestones)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">System & Data</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Appearance Mode</span>
                          <span className="text-xs text-gray-500">Dark mode is easier on your battery</span>
                        </div>
                        <button type="button" onClick={() => setDarkMode(!darkMode)} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                          Toggle
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 dark:text-gray-200">Offline Maps</span>
                          <span className="text-xs text-gray-500">Store local route data</span>
                        </div>
                        <button type="button" className="px-4 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold">
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-emerald-500/10">
                  <button type="button" className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform">
                    Save Changes
                  </button>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((b) => (
                <div key={b.title} className={`glass-card-profile rounded-2xl p-4 flex flex-col items-center text-center border-b-4 ${b.borderClass} ${!b.unlocked ? 'opacity-60' : ''}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${b.iconClass}`}>
                    <span className="material-icons">{b.icon}</span>
                  </div>
                  <span className={`text-xs font-bold ${b.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{b.title}</span>
                </div>
              ))}
            </section>
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-gray-500 dark:text-gray-600 pb-8">
          <p>CommuteSmart © 2024. Optimizing your journey for a greener commute.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a className="hover:text-emerald-500" href="#">Terms of Service</a>
            <a className="hover:text-emerald-500" href="#">Privacy Policy</a>
            <a className="hover:text-emerald-500" href="#">Help Center</a>
          </div>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe glass-panel border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          <Link to="/dashboard" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-white/70 hover:text-primary transition-colors">
            <span className="material-icons text-xl">dashboard</span>
            <span className="text-xs mt-0.5">Dashboard</span>
          </Link>
          <Link to="/alerts" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-white/70 hover:text-primary transition-colors">
            <span className="material-icons text-xl">forum</span>
            <span className="text-xs mt-0.5">Community</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-primary bg-primary/10 transition-colors">
            <span className="material-icons text-xl">person</span>
            <span className="text-xs mt-0.5">Profile</span>
          </Link>
        </div>
      </nav>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
