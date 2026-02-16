import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const alertsData = [
  {
    id: 1,
    title: 'Heavy Traffic on Sector 17 Chowk',
    description: 'Standstill traffic near the market due to construction work. Expect delays of 20-30 mins.',
    location: 'Sector 17, Chandigarh',
    timeAgo: '2m ago',
    reporter: 'Rajan K.',
    reporterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWjWVhduUZ5dT74ZJ4Nk7Y8u2epHWUVJmgFz3abqNk3hNRW0Eu4prEHuOigoKm_XvcU_IKNifIpuWdkpJG9GJrthbUGaHoxjusghonq7iUTpx92X0u-Lr7ZrGMp7lUp3l-Cfb8XMJP6S6Pi34WsP6C6BgI6M3-r9PRUHkFhtZtOO4BwC4G-LRtnFyzHjp4Ox2PnUckoyb2oZT7iAjnbsBoVYhtBvdewHuvNsXMtXe3QlVEku5CA4H39E8d_o5gkjR9eHzfB2vgNSE',
    type: 'traffic',
    icon: 'traffic',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
    iconBorder: 'border-red-500/20',
    verified: true,
    upvotes: 24,
    comments: 5,
    liked: false,
    mapImg: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    mapPinColor: 'text-red-400',
  },
  {
    id: 2,
    title: 'CTU Bus 45 Delayed',
    description: 'Bus number PB-10-CX-4421 is running 15 minutes late from Rajpura bypass stop.',
    timeAgo: '8m ago',
    reporter: 'Priya S.',
    reporterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDLU1E4mTM_zBlAurkEtheVz6H7fZVyvo8r-DzyfG0BcS7o5ir5sn1yuKoHgnmSvCDEuF0I32YpA-gTxtMvElezYQAC8jAUbZZPVxz5vJZIj9_a2XkYKB0YE70Qgjn_fMaE9S9mXUZdwDW_hOXEsOVfbIHIzqMnGvea0vgkq7HKDij0RRkI0zrjNB3Ji5FxEnvtG0nGzRydkuRAc4x654VKcQYXkusKrJ5hU0RuRMFliRHegfaAtpXzENqHM8TWwKsgobf6q9c30aQ',
    type: 'delay',
    icon: 'schedule',
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10',
    iconBorder: 'border-yellow-500/20',
    upvotes: 15,
    comments: 2,
    liked: true,
  },
  {
    id: 3,
    title: 'Route Clear: Patiala Road',
    description: 'Traffic cleared up near Patiala extension. Smooth sailing for evening commuters.',
    location: 'Patiala Road, Rajpura',
    timeAgo: '15m ago',
    reporter: 'System Update',
    isSystem: true,
    type: 'clear',
    icon: 'verified',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    iconBorder: 'border-primary/20',
    upvotes: 42,
    borderL: true,
    mapImg: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    mapPinColor: 'text-primary',
  },
  {
    id: 4,
    title: 'Minor Accident on Ambala Highway',
    description: 'Two cars involved near Zirakpur. Left lane blocked.',
    timeAgo: '25m ago',
    reporter: 'Aman J.',
    reporterAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoCUy1a3qqMXewVtotUBtqkRnLtjgMZp9ld-lUxNn2G8-YTz0T27fWhvka-7RAR2mIujRAxbP9Kmv5y2cAbDmj5WQBNSIa00uevpYpvdYl0O2KSpZe1EXokOlJhcsByGjN9XOL91q-JcAAa7AIRqFnBRkpNwU_EPlCYIqqkGSZH4CpeNxXFs3gkO7ltByqfn3AJ0D0RIB2JDF0a_4_yOJeov0pRLtmWdB2o1jY-8HUcaHndXhdDV1b0Z0vfJ81LE4FGZ0dN29dzks',
    type: 'accident',
    icon: 'warning',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/10',
    iconBorder: 'border-orange-500/20',
    upvotes: 8,
    comments: 1,
    liked: false,
  },
];

const topReporters = [
  { name: 'Harpreet S.', reports: 142, xp: '+450 XP', rank: 1, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApbK5DQRwgcHV7yUkhrfCUSax7gg_pmqCg6-1JoiVGcHi-zgk6Zr5SW_wzukAlYFVHdoiS1GQ2Xe2NpX7gINENg9MgVGmu0n96eqgoD94tGH2bnOzGqgUr1s51-Vyan-LckGTtfdWoC9RLg7IPb44MKFdy6-ZNYkphNHMIbtvrCqx5hraY3CI4lcCkrpeFqXe6dlg1vaJwnODBQOY5oXxQ0LG_BYvcTIOrH1ea-hbQQ3GtU62DEW5SnSthEkct9aLYNssdgicpbzo' },
  { name: 'Simran K.', reports: 98, xp: '+210 XP', rank: 2, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhK3Wj2t9RZyW5Q-2tM4AiPe3uLt2OL1mOfq7es_Obv52vx5DCS5l6IznBkEcwOG-SnsRTNQuEXUhm4x43zHuYUMQhcaFAUXMyb4HicVbEqAUS_6xZX1i2juV7yQEhJrqTrot-FA2x5vFm2ITVtQXcn3FPxDpokbbVsO_l8H8wrj_WYBU-yo8Ui0RP1OQYW8CcKW9P_QTZsdud4RrGzckS1mjDLYDu8zyQVIwBE42sqrKbijvr-f6lhhzE1eBZkQyMdV1-9Kda21A' },
  { name: 'Rahul M.', reports: 85, xp: '+180 XP', rank: 3, avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWSzom0b8-vam0wqZXrxm0RmEH-bvy1YswbNfeRHteghSbb7MWUbotLa4HtL49wkBOK9NZIZFM2fZlkHkb_l7HhE5N9IUAL6x9ITFjz0m4hQIu6zYvfqhlPP1ZHVvv17Rb3V8mqBhFFK499-Fiy8bG9BPR9bZKAtxSCe6kRUEjRiTGvIBQQpJxFSbLm3YqSWmPpklIoRv-oEc_Ork7nV2jBBnc2Ctc0hzDbZfEzd9ahg3i9441oMKkKpgvQj5-_cbM9ECc5xasXcc' },
];

export function Alerts() {
  const [filter, setFilter] = useState<'all' | 'verified' | 'nearby' | 'recent'>('all');
  const { user } = useAuth();

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display min-h-screen flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="h-16 border-b border-gray-200 dark:border-white/5 glass-panel sticky top-0 z-40 flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-icons">directions_bus</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-primary">CommuteSmart</h1>
        </Link>
        <div className="hidden md:flex items-center bg-black/20 dark:bg-white/5 rounded-full px-4 py-2 w-96 border border-transparent focus-within:border-primary/50 transition-colors">
          <span className="material-icons text-gray-400 text-sm mr-2">search</span>
          <input className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-500 text-gray-200 focus:ring-0" placeholder="Search routes, stops, or areas..." type="text" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <span className="material-icons text-primary text-sm">emoji_events</span>
            <span className="text-sm font-semibold text-primary">{user?.xp?.toLocaleString() ?? '1,240'} XP</span>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-primary/30">
            <span className="w-full h-full flex items-center justify-center text-white font-bold">{user?.name?.charAt(0) ?? 'U'}</span>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background-dark" />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:flex flex-col border-r border-gray-200 dark:border-white/5 pt-6 pb-6 bg-background-light/50 dark:bg-background-dark/50">
          <nav className="flex-1 px-4 space-y-1">
            <Link to="/alerts" className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg text-primary bg-primary/10">
              <span className="material-icons text-xl">dynamic_feed</span>
              Live Alerts
            </Link>
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <span className="material-icons text-xl">map</span>
              My Routes
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <span className="material-icons text-xl">leaderboard</span>
              Leaderboard
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <span className="material-icons text-xl">settings</span>
              Settings
            </Link>
          </nav>
          <div className="px-6">
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Impact</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">CO2 Saved</span>
                <span className="text-sm font-bold text-primary">12.5 kg</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: '70%' }} />
              </div>
              <p className="text-xs text-gray-500 text-right">Goal: 20kg</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto w-full">
            {/* Feed Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Community Alerts</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time updates from commuters in Chandigarh, Rajpura, Patiala & Ambala</p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
                <button onClick={() => setFilter('all')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}>
                  All Updates
                </button>
                <button onClick={() => setFilter('verified')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${filter === 'verified' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}>
                  Verified
                  <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full">12</span>
                </button>
                <button onClick={() => setFilter('nearby')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === 'nearby' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}>
                  Nearby
                </button>
                <button onClick={() => setFilter('recent')} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${filter === 'recent' ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'}`}>
                  <span className="material-icons text-sm align-middle mr-1">history</span> Recent
                </button>
              </div>
            </div>

            {/* Alert Cards */}
            <div className="space-y-4 pb-24">
              {alertsData.map((alert) => (
                <div key={alert.id} className={`glass-card-feed rounded-xl p-5 relative group ${alert.borderL ? 'border-l-4 border-l-primary' : ''}`}>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg ${alert.iconBg} flex items-center justify-center border ${alert.iconBorder}`}>
                        <span className={`material-icons ${alert.iconColor}`}>{alert.icon}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white text-lg">{alert.title}</h3>
                            {alert.verified && (
                              <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-primary/20">Verified</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{alert.description}</p>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{alert.timeAgo}</span>
                      </div>
                      {alert.mapImg && alert.location && (
                        <div className="h-24 w-full rounded-lg overflow-hidden relative mb-4 border border-white/5">
                          <img alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" src={alert.mapImg} />
                          <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent" />
                          <div className="absolute bottom-2 left-3 flex items-center gap-1 text-xs text-white font-medium">
                            <span className={`material-icons text-sm ${alert.mapPinColor}`}>{alert.type === 'clear' ? 'check_circle' : 'place'}</span>
                            {alert.location}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {alert.isSystem ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">CS</div>
                              <span className="text-xs text-gray-400">System Update</span>
                            </>
                          ) : (
                            <>
                              <img alt="" className="w-6 h-6 rounded-full border border-gray-600 object-cover" src={alert.reporterAvatar} />
                              <span className="text-xs text-gray-400">Reported by {alert.reporter}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button className={`flex items-center gap-1.5 transition-colors group/btn ${alert.liked ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
                            <span className="material-icons text-lg group-active/btn:scale-125 transition-transform">{alert.liked ? 'favorite' : 'favorite_border'}</span>
                            <span className="text-xs font-medium">{alert.upvotes}</span>
                          </button>
                          <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                            <span className="material-icons text-lg">chat_bubble_outline</span>
                            <span className="text-xs font-medium">{alert.comments ?? 0}</span>
                          </button>
                          <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors">
                            <span className="material-icons text-lg">share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Widgets */}
          <aside className="w-80 hidden xl:block border-l border-gray-200 dark:border-white/5 p-6 space-y-6 overflow-y-auto">
            <div className="rounded-xl overflow-hidden h-64 relative border border-white/10 shadow-lg">
              <img alt="" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '75ms' }} />
              <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" />
              <div className="absolute bottom-4 left-4 right-4 glass-panel p-3 rounded-lg">
                <div className="flex justify-between items-center text-xs text-white">
                  <span className="font-semibold">Live Traffic</span>
                  <span className="text-primary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Active</span>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Top Reporters</h3>
                <span className="text-xs text-primary cursor-pointer hover:underline">View All</span>
              </div>
              <div className="space-y-4">
                {topReporters.map((r) => (
                  <div key={r.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img alt="" className="w-8 h-8 rounded-full object-cover" src={r.avatar} />
                        <div className={`absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded shadow-sm ${r.rank === 1 ? 'bg-yellow-500 text-black' : r.rank === 2 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'}`}>{r.rank}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.reports} Reports</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary">{r.xp}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-5 border border-primary/20">
              <div className="flex items-start gap-3">
                <span className="material-icons text-primary">eco</span>
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">Eco-Commuter Challenge</h4>
                  <p className="text-xs text-gray-300 mb-3">Report 5 verified incidents this week to earn the &quot;Green Guardian&quot; badge.</p>
                  <button className="text-xs bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded transition-colors">Join Now</button>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* FAB */}
      <button className="absolute bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 hover:scale-110 hover:shadow-primary/60 transition-all duration-300 group" aria-label="Report Issue">
        <span className="material-icons text-2xl group-hover:rotate-90 transition-transform duration-300">add</span>
      </button>
      <div className="absolute bottom-8 right-24 z-50 pointer-events-none opacity-0 lg:opacity-100 transition-opacity">
        <span className="bg-black/80 text-white text-xs py-1 px-3 rounded backdrop-blur-sm border border-white/10">Report Issue</span>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe glass-panel border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          <Link to="/dashboard" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-white/70 hover:text-primary transition-colors">
            <span className="material-icons text-xl">dashboard</span>
            <span className="text-xs mt-0.5">Dashboard</span>
          </Link>
          <Link to="/alerts" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-primary bg-primary/10 transition-colors">
            <span className="material-icons text-xl">dynamic_feed</span>
            <span className="text-xs mt-0.5">Community</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-white/70 hover:text-primary transition-colors">
            <span className="material-icons text-xl">person</span>
            <span className="text-xs mt-0.5">Profile</span>
          </Link>
        </div>
      </nav>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
