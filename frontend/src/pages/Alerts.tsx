import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const punjabAlerts = [
  {
    id: 1,
    title: 'Heavy Traffic on Sector 17 Chowk',
    description: 'Standstill traffic near the market due to construction work. Expect delays of 20-30 mins.',
    location: 'Sector 17, Chandigarh',
    timeAgo: '2m ago',
    reporter: 'Amanjeet S.',
    avatar: 'AS',
    type: 'traffic',
    icon: 'traffic',
    iconColor: 'text-red-500',
    verified: true,
    upvotes: 24,
    comments: 5,
    liked: false,
  },
  {
    id: 2,
    title: 'CTU Bus 45 Delayed',
    description: 'Bus number PB-10-CX-4421 is running 15 minutes late from Rajpura bypass stop.',
    location: 'Rajpura Bypass',
    timeAgo: '8m ago',
    reporter: 'Gurpreet K.',
    avatar: 'GK',
    type: 'delay',
    icon: 'schedule',
    iconColor: 'text-yellow-500',
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
    avatar: 'SYS',
    isSystem: true,
    type: 'clear',
    icon: 'verified',
    iconColor: 'text-[#0fb880]',
    upvotes: 42,
  },
  {
    id: 4,
    title: 'Minor Accident on Ambala Highway',
    description: 'Two cars involved near Zirakpur. Left lane blocked.',
    location: 'Ambala Highway',
    timeAgo: '25m ago',
    reporter: 'Harpreet S.',
    avatar: 'HS',
    type: 'accident',
    icon: 'warning',
    iconColor: 'text-orange-500',
    upvotes: 8,
    comments: 1,
    liked: false,
  },
  {
    id: 5,
    title: 'Metro Train On Time',
    description: 'Chandigarh Metro running on schedule. All platforms operational.',
    location: 'Sector 34 Metro Station',
    timeAgo: '30m ago',
    reporter: 'Simranjeet K.',
    avatar: 'SK',
    type: 'info',
    icon: 'train',
    iconColor: 'text-[#0fb880]',
    upvotes: 18,
    comments: 3,
    liked: true,
  },
];

const topContributors = [
  { name: 'Amanjeet S.', reports: 142, xp: '+450 XP', rank: 1, avatar: 'AS' },
  { name: 'Gurpreet K.', reports: 98, xp: '+210 XP', rank: 2, avatar: 'GK' },
  { name: 'Harpreet S.', reports: 85, xp: '+180 XP', rank: 3, avatar: 'HS' },
];

const filterOptions = [
  { id: 'all', label: 'All Updates', icon: 'dynamic_feed' },
  { id: 'verified', label: 'Verified', icon: 'verified', count: 12 },
  { id: 'nearby', label: 'Nearby', icon: 'location_on' },
  { id: 'recent', label: 'Recent', icon: 'history' },
];

export function Alerts() {
  const [filter, setFilter] = useState<'all' | 'verified' | 'nearby' | 'recent'>('all');
  const { } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState(punjabAlerts);
  const [upvotedAlerts, setUpvotedAlerts] = useState<Set<number>>(new Set([2, 5]));

  // POLISHED: Simulate loading and add interactions
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleUpvote = (alertId: number) => {
    setUpvotedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
        toast.success('Removed upvote');
      } else {
        newSet.add(alertId);
        toast.success('Added upvote! 👍');
      }
      return newSet;
    });

    // Update alert upvote count
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, upvotes: upvotedAlerts.has(alertId) ? alert.upvotes - 1 : alert.upvotes + 1 }
        : alert
    ));
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'verified') return alert.verified;
    if (filter === 'nearby') return alert.location.includes('Chandigarh') || alert.location.includes('Sector');
    if (filter === 'recent') return parseInt(alert.timeAgo) <= 30; // Recent alerts (30 mins or less)
    return true;
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a1411]">
      {/* Navigation */}
      <nav className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-[#0a1411]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#0fb880] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(15,184,128,0.4)]">C</div>
          <span className="font-bold text-xl tracking-tight text-white">Commute<span className="text-[#0fb880]">Smart</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/dashboard">Dashboard</Link>
          <Link className="text-[#0fb880] border-b-2 border-[#0fb880] h-16 flex items-center text-sm font-medium" to="/alerts">Community</Link>
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/profile">Profile</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Punjab Eco-Rank</span>
            <span className="text-sm font-bold text-[#0fb880]">#142 Chandigarh</span>
          </div>
          <div className="h-9 w-9 rounded-full border-2 border-[#0fb880]/30 p-0.5">
            <div className="w-full h-full rounded-full bg-[#0fb880]/30 flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe glass-panel border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          <Link to="/dashboard" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-gray-400">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-xs mt-0.5">Dashboard</span>
          </Link>
          <Link to="/alerts" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-[#0fb880]">
            <span className="material-symbols-outlined text-lg">forum</span>
            <span className="text-xs mt-0.5">Community</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-gray-400">
            <span className="material-symbols-outlined text-lg">person</span>
            <span className="text-xs mt-0.5">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 pb-20 md:pb-4">
        {/* Left Sidebar - Stats */}
        <div className="col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">analytics</span>
              Live Statistics
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Active Alerts', value: '24', color: 'text-white', delay: 0 },
                { label: 'Verified', value: '12', color: 'text-[#0fb880]', delay: 0.1 },
                { label: 'Contributors', value: '156', color: 'text-white', delay: 0.2 },
                { label: 'Response Time', value: '2.3m', color: 'text-yellow-500', delay: 0.3 },
              ].map((stat) => (
                <motion.div 
                  key={stat.label}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: stat.delay }}
                >
                  <span className="text-xs text-gray-400">{stat.label}</span>
                  <motion.span 
                    className={`text-lg font-bold ${stat.color}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: stat.delay + 0.2, type: 'spring', stiffness: 500 }}
                  >
                    {stat.value}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">emoji_events</span>
              Top Contributors
            </h2>
            <div className="space-y-4">
              {topContributors.map((contributor, index) => (
                <motion.div 
                  key={contributor.name} 
                  className="flex items-center gap-3 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                      {contributor.avatar}
                    </div>
                    <div className={`absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded shadow-sm ${
                      contributor.rank === 1 ? 'bg-yellow-500 text-black' : 
                      contributor.rank === 2 ? 'bg-gray-400 text-black' : 
                      'bg-orange-700 text-white'
                    }`}>
                      {contributor.rank}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{contributor.name}</p>
                    <p className="text-xs text-gray-500">{contributor.reports} Reports</p>
                  </div>
                  <span className="text-xs font-bold text-[#0fb880] group-hover:scale-110 transition-transform inline-block">{contributor.xp}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="col-span-6 space-y-4">
          {/* Filter Tabs */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-red-400 text-xl">forum</span>
                Community Feed
              </h2>
              <button 
                onClick={() => toast.success('Report feature coming soon!')}
                className="bg-[#0fb880]/20 hover:bg-[#0fb880]/30 text-[#0fb880] text-[10px] font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
              >
                REPORT +
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {filterOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => setFilter(option.id as any)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    filter === option.id 
                      ? 'bg-[#0fb880] text-white shadow-lg shadow-[#0fb880]/20' 
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="material-symbols-outlined text-sm">{option.icon}</span>
                  {option.label}
                  {option.count && (
                    <motion.span 
                      className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {option.count}
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Alert Cards */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-panel rounded-2xl p-5">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/10 animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                          <div className="h-3 bg-white/5 rounded w-full animate-pulse"></div>
                          <div className="h-3 bg-white/5 rounded w-2/3 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : filteredAlerts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#0fb880]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-[#0fb880]">search_off</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No alerts found</h3>
                  <p className="text-gray-400 mb-6">No {filter === 'all' ? '' : filter} alerts available right now. Check back later!</p>
                  <button 
                    onClick={() => setFilter('all')}
                    className="bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-6 py-2 rounded-full transition-colors"
                  >
                    View All Alerts
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filteredAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-panel rounded-2xl p-5 hover:border-[#0fb880]/20 transition-all cursor-pointer group"
                      whileHover={{ scale: 1.01, y: -2 }}
                    >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/20`}>
                      <span className={`material-symbols-outlined ${alert.iconColor}`}>{alert.icon}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white text-lg">{alert.title}</h3>
                          {alert.verified && (
                            <span className="bg-[#0fb880]/20 text-[#0fb880] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border border-[#0fb880]/20">Verified</span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{alert.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {alert.location}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{alert.timeAgo}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        {alert.isSystem ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-[#0fb880]/20 flex items-center justify-center text-[8px] font-black text-[#0fb880] border border-[#0fb880]/20 uppercase">
                              {alert.avatar}
                            </div>
                            <span className="text-xs text-gray-400">System Update</span>
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                              {alert.avatar}
                            </div>
                            <span className="text-xs text-gray-400">Reported by {alert.reporter}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(alert.id);
                          }}
                          className={`flex items-center gap-1.5 transition-colors ${
                            upvotedAlerts.has(alert.id) ? 'text-[#0fb880]' : 'text-gray-400 hover:text-[#0fb880]'
                          } group`}
                        >
                          <motion.span 
                            className="material-symbols-outlined text-lg"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            {upvotedAlerts.has(alert.id) ? 'favorite' : 'favorite_border'}
                          </motion.span>
                          <span className="text-xs font-medium">{alert.upvotes}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors group">
                          <motion.span 
                            className="material-symbols-outlined text-lg"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            chat_bubble_outline
                          </motion.span>
                          <span className="text-xs font-medium">{alert.comments ?? 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors group">
                          <motion.span 
                            className="material-symbols-outlined text-lg"
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            share
                          </motion.span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {!isLoading && filteredAlerts.length > 0 && (
            <motion.button 
              onClick={() => toast.success('Loading more alerts...')}
              className="w-full py-3 rounded-xl glass-panel hover:border-[#0fb880]/20 flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">expand_more</span>
              Load More Alerts
            </motion.button>
          )}
        </div>

        {/* Right Sidebar - Map & Info */}
        <div className="col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-5 h-64 relative overflow-hidden">
            <div className="absolute inset-0 map-bg opacity-20"></div>
            <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '75ms' }}></div>
            <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
            <div className="relative z-10">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[#0fb880] text-xl">map</span>
                Live Map
              </h3>
              <div className="flex items-center justify-between text-xs text-white">
                <span className="font-semibold">Active Incidents</span>
                <span className="text-[#0fb880] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#0fb880] animate-pulse"></span> 
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">trending_up</span>
              Trending Areas
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Sector 17</span>
                <span className="text-xs font-bold text-red-500">High</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Rajpura Bypass</span>
                <span className="text-xs font-bold text-yellow-500">Medium</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Patiala Road</span>
                <span className="text-xs font-bold text-[#0fb880]">Clear</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Ambala Highway</span>
                <span className="text-xs font-bold text-orange-500">Low</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0fb880]/20 to-[#0fb880]/5 rounded-2xl p-5 border border-[#0fb880]/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#0fb880]">eco</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Eco-Challenge</h4>
                <p className="text-xs text-gray-300 mb-3">Report 5 verified incidents this week to earn the "Green Guardian" badge.</p>
                <button 
                  onClick={() => toast.success('Challenge joined!')}
                  className="text-xs bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-3 py-1.5 rounded transition-colors"
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
