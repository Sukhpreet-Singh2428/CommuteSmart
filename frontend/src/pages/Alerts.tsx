import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { alertsAPI, getSocketUrl } from '../lib/api';
import { io, Socket } from 'socket.io-client';

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

// Helper functions for alert display
const getAlertIcon = (type: string) => {
  const iconMap: { [key: string]: string } = {
    'traffic': 'traffic',
    'delay': 'schedule',
    'accident': 'warning',
    'info': 'info',
    'clear': 'verified',
    'default': 'notifications'
  };
  return iconMap[type] || iconMap.default;
};

const getAlertIconColor = (type: string) => {
  const colorMap: { [key: string]: string } = {
    'traffic': 'text-red-500',
    'delay': 'text-yellow-500',
    'accident': 'text-orange-500',
    'info': 'text-[#0fb880]',
    'clear': 'text-[#0fb880]',
    'default': 'text-gray-400'
  };
  return colorMap[type] || colorMap.default;
};

const formatTimeAgo = (createdAt: string) => {
  const now = new Date();
  const alertTime = new Date(createdAt);
  const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const filterOptions = [
  { id: 'all', label: 'All Updates', icon: 'dynamic_feed' },
  { id: 'verified', label: 'Verified', icon: 'verified', count: 12 },
  { id: 'nearby', label: 'Nearby', icon: 'location_on' },
  { id: 'recent', label: 'Recent', icon: 'history' },
];

export function Alerts() {
  const [filter, setFilter] = useState<'all' | 'verified' | 'nearby' | 'recent'>('all');
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [upvotedAlerts, setUpvotedAlerts] = useState<Set<string>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newAlert, setNewAlert] = useState({ message: '', lat: 30.73, long: 76.78 }); // Default Chandigarh

  // CONNECTED TO BACKEND: Initialize Socket.io for real-time alerts
  useEffect(() => {
    let newSocket: Socket | null = null;
    
    try {
      newSocket = io(getSocketUrl(), {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('Connected to alerts Socket.io server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from alerts Socket.io server');
      });

      // CONNECTED TO BACKEND: Listen for new alerts
      newSocket.on('newAlert', (alert: any) => {
        console.log('Received new alert:', alert);
        setAlerts(prev => {
          // Prevent duplicates
          const exists = prev.some(existing => existing._id === alert._id);
          if (!exists) {
            toast.success('New alert reported! 🚨');
            return [alert, ...prev];
          }
          return prev;
        });
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  // CONNECTED TO BACKEND: Fetch alerts from API
  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await alertsAPI.getAlerts();
      if (response.data.success && response.data.alerts) {
        setAlerts(response.data.alerts);
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  };

  // Load alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  // CONNECTED TO BACKEND: Handle upvote with API call
  const handleUpvote = async (alertId: string) => {
    try {
      await alertsAPI.upvoteAlert(alertId);
      
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

      // Update alert upvote count locally
      setAlerts(prev => prev.map(alert => 
        alert._id === alertId 
          ? { ...alert, upvotes: upvotedAlerts.has(alertId) ? alert.upvotes - 1 : alert.upvotes + 1 }
          : alert
      ));
    } catch (error: any) {
      console.error('Error upvoting alert:', error);
      toast.error('Failed to upvote alert');
    }
  };

  // CONNECTED TO BACKEND: Handle new alert submission
  const handleReportAlert = async () => {
    if (!newAlert.message.trim()) {
      toast.error('Please enter an alert message');
      return;
    }

    try {
      const response = await alertsAPI.createAlert(newAlert.message, newAlert.lat, newAlert.long);
      if (response.data.success) {
        toast.success('Alert reported successfully! 🎉');
        setShowReportModal(false);
        setNewAlert({ message: '', lat: 30.73, long: 76.78 });
        fetchAlerts(); // Refresh alerts
      }
    } catch (error: any) {
      console.error('Error creating alert:', error);
      toast.error('Failed to report alert');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'verified') return alert.verified;
    if (filter === 'nearby') return alert.location && (alert.location.includes('Chandigarh') || alert.location.includes('Sector'));
    if (filter === 'recent') {
      // Calculate if alert is recent (within 30 minutes)
      const alertTime = new Date(alert.createdAt);
      const now = new Date();
      const diffMinutes = (now.getTime() - alertTime.getTime()) / (1000 * 60);
      return diffMinutes <= 30;
    }
    return true;
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a1411]">
      {/* Navigation */}
      <nav className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-[#0a1411]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-icons text-white text-lg">directions_bus</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CommuteSmart</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/dashboard">Dashboard</Link>
          <Link className="text-[#0fb880] border-b-2 border-[#0fb880] h-16 flex items-center text-sm font-medium" to="/alerts">Community</Link>
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/profile">Profile</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Punjab Eco-Rank</span>
            <span className="text-sm font-bold text-[#0fb880]">#{user?.points || 142} Chandigarh</span>
          </div>
          <div className="h-9 w-9 rounded-full border-2 border-[#0fb880]/30 p-0.5">
            <div className="w-full h-full rounded-full bg-[#0fb880]/30 flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
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
                onClick={() => setShowReportModal(true)}
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
                      key={alert._id}
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
                      <span className={`material-symbols-outlined ${getAlertIconColor(alert.type)}`}>{getAlertIcon(alert.type)}</span>
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
                        <p className="text-gray-400 text-sm mb-2">{alert.message}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {alert.location}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{formatTimeAgo(alert.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                          {alert.reporter?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <span className="text-xs text-gray-400">Reported by {alert.reporter?.email || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(alert._id);
                          }}
                          className={`flex items-center gap-1.5 transition-colors ${
                            upvotedAlerts.has(alert._id) ? 'text-[#0fb880]' : 'text-gray-400 hover:text-[#0fb880]'
                          } group`}
                        >
                          <motion.span 
                            className="material-symbols-outlined text-lg"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            {upvotedAlerts.has(alert._id) ? 'favorite' : 'favorite_border'}
                          </motion.span>
                          <span className="text-xs font-medium">{alert.upvotes || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors group">
                          <motion.span 
                            className="material-symbols-outlined text-lg"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            chat_bubble_outline
                          </motion.span>
                          <span className="text-xs font-medium">{alert.comments || 0}</span>
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

      {/* CONNECTED TO BACKEND: Report Alert Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a1411] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Report Alert</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alert Message
                  </label>
                  <textarea
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70 resize-none"
                    rows={4}
                    placeholder="Describe the traffic condition, delay, or incident..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location (Chandigarh area)
                  </label>
                  <select
                    value={`${newAlert.lat},${newAlert.long}`}
                    onChange={(e) => {
                      const [lat, long] = e.target.value.split(',').map(Number);
                      setNewAlert({ ...newAlert, lat, long });
                    }}
                    className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70"
                  >
                    <option value="30.74,76.78">Sector 17, Chandigarh</option>
                    <option value="30.73,76.79">Sector 22, Chandigarh</option>
                    <option value="30.69,76.78">Sector 34, Chandigarh</option>
                    <option value="30.71,76.71">Mohali</option>
                    <option value="30.65,76.81">Zirakpur</option>
                    <option value="30.38,76.78">Ambala</option>
                    <option value="30.34,76.39">Patiala</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportAlert}
                  className="flex-1 bg-[#0fb880] hover:bg-[#0fb880]/90 text-white font-medium py-3 rounded-xl transition-all"
                >
                  Report Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
