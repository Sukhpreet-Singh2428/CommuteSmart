import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { alertsAPI, getSocketUrl } from '../lib/api';
import { io, Socket } from 'socket.io-client';
import { PageNavbar } from '../components/PageNavbar';
import { useLiveStats, useTrendingAreas, useTopContributors } from '../hooks/useLiveStats';
import type { LeaderboardEntry, TrendingArea as TrendingAreaType } from '../types';

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
  const [alerts, setAlerts] = useState<any[]>(punjabAlerts); // Start with mock data
  const [upvotedAlerts, setUpvotedAlerts] = useState<Set<string>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [challengeJoined, setChallengeJoined] = useState(() => {
    try { return JSON.parse(localStorage.getItem('commuteSmart_challenge') || 'false'); } catch { return false; }
  });
  const [newAlert, setNewAlert] = useState({ 
    message: '', 
    lat: 30.73, 
    long: 76.78, 
    type: 'traffic',
    severity: 'medium',
    location: ''
  }); // Default Chandigarh

  // CONNECTED TO BACKEND: Live data hooks
  const { stats: liveStats, loading: statsLoading } = useLiveStats();
  const { areas: trendingAreas, loading: trendingLoading } = useTrendingAreas();
  const { contributors: topContributors, loading: contributorsLoading } = useTopContributors(3);

  // CONNECTED TO BACKEND: Initialize Socket.io for real-time alerts
  useEffect(() => {
    let newSocket: Socket | null = null;
    
    try {
      newSocket = io(getSocketUrl(), {
        withCredentials: true,
        transports: ['polling'], // Start with polling to avoid WebSocket issues
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('🔌 Socket connected for real-time alerts');
      });

      newSocket.on('connect_error', (error) => {
        console.log('⚠️ Socket connection failed, continuing without real-time updates:', error.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      // CONNECTED TO BACKEND: Listen for new alerts
      newSocket.on('newAlert', (alert: any) => {
        setAlerts(prev => {
          // Prevent duplicates
          const alertId = alert._id || alert.id;
          const exists = prev.some(existing => (existing._id || existing.id) === alertId);
          if (!exists) {
            // New alert detected silently (no toast for auto-triggered events)
            return [alert, ...prev];
          }
          return prev;
        });
      });

      setSocket(newSocket);
    } catch (error) {
      console.log('⚠️ Failed to initialize socket, continuing without real-time updates:', error);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  // CONNECTED TO BACKEND: Fetch alerts from API with pagination
  const fetchAlerts = async (page: number = 1, append: boolean = false) => {
    if (!append) setIsLoading(true);
    try {
      const response = await alertsAPI.getAlerts(page);
      if (response.data.success && response.data.alerts && response.data.alerts.length > 0) {
        const backendAlerts = response.data.alerts.map((alert: any) => ({
          ...alert,
          id: alert._id,
          title: alert.message || 'Community Alert',
          description: alert.message || 'No description available',
          location: alert.location || 'Community Report',
          timeAgo: formatTimeAgo(alert.timeStamp || alert.createdAt || new Date().toISOString()),
          reporter: alert.reportedBy || { email: 'Community User' },
          avatar: alert.reportedBy?.email?.charAt(0)?.toUpperCase() || 'CU',
          type: alert.type || 'community',
          icon: getAlertIcon(alert.type || 'community'),
          iconColor: getAlertIconColor(alert.type || 'community'),
          verified: (alert.upvotes || 0) >= 5,
          upvotes: alert.upvotes || 0,
          comments: 0,
          liked: false,
          createdAt: alert.timeStamp || alert.createdAt || new Date().toISOString()
        }));
        
        if (append) {
          setAlerts(prev => [...prev, ...backendAlerts]);
        } else {
          setAlerts(backendAlerts);
        }
        setHasMorePages((response.data.pagination?.page || 1) < (response.data.pagination?.pages || 1));
      } else {
        if (!append) setAlerts(punjabAlerts);
        setHasMorePages(false);
      }
    } catch (error: any) {
      console.warn('Failed to fetch alerts from backend, using mock data:', error.message);
      if (!append) setAlerts(punjabAlerts);
      setHasMorePages(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreAlerts = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchAlerts(nextPage, true);
  };

  // Load alerts on mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  // CONNECTED TO BACKEND: Enhanced filter with user ownership check
  const filteredAlerts = alerts.filter(alert => {
    if (!alert) return false;
    
    if (filter === 'verified') return alert.verified === true;
    if (filter === 'nearby') return alert.location && (alert.location.includes('Chandigarh') || alert.location.includes('Sector'));
    if (filter === 'recent') {
      // Calculate if alert is recent (within 30 minutes)
      const alertTime = new Date(alert.createdAt || alert.timeAgo || Date.now());
      const now = new Date();
      const diffMinutes = (now.getTime() - alertTime.getTime()) / (1000 * 60);
      return diffMinutes <= 30;
    }
    return true;
  });

  // CONNECTED TO BACKEND: Handle upvote with API call
  const handleUpvote = async (alertId: string) => {
    try {
      await alertsAPI.upvoteAlert(alertId);
      
      setUpvotedAlerts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(alertId)) {
          newSet.delete(alertId);
          // Upvote removed silently (no toast for minor actions)
        } else {
          newSet.add(alertId);
          // Upvote added silently (no toast for minor actions)
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

  // CONNECTED TO BACKEND: Handle delete own alert
  const handleDeleteAlert = async (alertId: string) => {
    try {
      await alertsAPI.deleteAlert(alertId);
      
      setAlerts(prev => prev.filter(alert => alert._id !== alertId));
      toast.success('Alert deleted successfully! 🗑️');
    } catch (error: any) {
      console.error('Error deleting alert:', error);
      if (error.response?.status === 403) {
        toast.error('You can only delete your own alerts');
      } else if (error.response?.status === 404) {
        toast.error('Alert not found');
      } else {
        toast.error('Failed to delete alert');
      }
    }
  };

  // CONNECTED TO BACKEND: Handle new alert submission
  const handleReportAlert = async () => {
    if (!newAlert.message.trim()) {
      toast.error('Please enter an alert message');
      return;
    }

    try {
      const response = await alertsAPI.createAlert(
        newAlert.message, 
        newAlert.lat, 
        newAlert.long, 
        newAlert.type, 
        newAlert.severity, 
        newAlert.location
      );
      if (response.data.success) {
        toast.success('Alert reported successfully! 🎉');
        setShowReportModal(false);
        setNewAlert({ 
          message: '', 
          lat: 30.73, 
          long: 76.78, 
          type: 'traffic',
          severity: 'medium',
          location: ''
        });
        // No need to refresh alerts - Socket.io will handle real-time update
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Please login to report alerts');
      } else {
        toast.error('Failed to report alert. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a1411]">
      {/* UNIFIED: Shared PageNavbar component */}
      <PageNavbar activePage="alerts" />

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
              {(statsLoading ? [
                { label: 'Active Alerts', value: '—', color: 'text-white', delay: 0 },
                { label: 'Verified', value: '—', color: 'text-[#0fb880]', delay: 0.1 },
                { label: 'Contributors', value: '—', color: 'text-white', delay: 0.2 },
                { label: 'Response Time', value: '—', color: 'text-yellow-500', delay: 0.3 },
              ] : [
                { label: 'Active Alerts', value: String(liveStats?.activeAlerts ?? 0), color: 'text-white', delay: 0 },
                { label: 'Verified', value: String(liveStats?.verifiedAlerts ?? 0), color: 'text-[#0fb880]', delay: 0.1 },
                { label: 'Contributors', value: String(liveStats?.totalContributors ?? 0), color: 'text-white', delay: 0.2 },
                { label: 'Response Time', value: `${liveStats?.avgResponseTime ?? 0}m`, color: 'text-yellow-500', delay: 0.3 },
              ]).map((stat) => (
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
              {contributorsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-3 bg-white/10 rounded w-20 animate-pulse"></div>
                        <div className="h-2 bg-white/5 rounded w-14 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (topContributors as LeaderboardEntry[]).map((contributor, index) => (
                <motion.div 
                  key={contributor.userId || index} 
                  className="flex items-center gap-3 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                      {(contributor.name || 'A').substring(0, 2).toUpperCase()}
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
                    <p className={`text-sm font-medium ${contributor.userId === user?.id ? 'text-[#0fb880]' : 'text-white'}`}>{contributor.userId === user?.id ? 'You' : contributor.name}</p>
                    <p className="text-xs text-gray-500">{contributor.points} pts</p>
                  </div>
                  <span className="text-xs font-bold text-[#0fb880] group-hover:scale-110 transition-transform inline-block">+{contributor.points} XP</span>
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
                      key={alert._id || alert.id || `alert-${index}`}
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
                          {typeof alert.location === 'string' ? alert.location : 'Location reported'}
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
                        {/* CONNECTED TO BACKEND: Delete button for own alerts */}
                        {alert.reporter?.email === user?.email && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this alert?')) {
                                handleDeleteAlert(alert._id);
                              }
                            }}
                            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors group"
                          >
                            <motion.span 
                              className="material-symbols-outlined text-lg"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                            >
                              delete
                            </motion.span>
                          </button>
                        )}
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
          {!isLoading && filteredAlerts.length > 0 && hasMorePages && (
            <motion.button 
              onClick={loadMoreAlerts}
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
              {trendingLoading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-3 bg-white/10 rounded w-20 animate-pulse"></div>
                    <div className="h-3 bg-white/5 rounded w-10 animate-pulse"></div>
                  </div>
                ))
              ) : (trendingAreas.length > 0 ? trendingAreas : [
                { area: 'Sector 17', level: 'Clear' as const, alertCount: 0 },
                { area: 'Rajpura Bypass', level: 'Clear' as const, alertCount: 0 },
                { area: 'Patiala Road', level: 'Clear' as const, alertCount: 0 },
                { area: 'Ambala Highway', level: 'Clear' as const, alertCount: 0 }
              ]).map((area: TrendingAreaType) => (
                <div key={area.area} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{area.area}</span>
                  <span className={`text-xs font-bold ${
                    area.level === 'High' ? 'text-red-500' :
                    area.level === 'Medium' ? 'text-yellow-500' :
                    area.level === 'Low' ? 'text-orange-500' :
                    'text-[#0fb880]'
                  }`}>{area.level}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0fb880]/20 to-[#0fb880]/5 rounded-2xl p-5 border border-[#0fb880]/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#0fb880]">eco</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Eco-Challenge</h4>
                <p className="text-xs text-gray-300 mb-3">Report 5 verified incidents this week to earn the &quot;Green Guardian&quot; badge.</p>
                <button 
                  onClick={() => {
                    setChallengeJoined(true);
                    localStorage.setItem('commuteSmart_challenge', 'true');
                    toast.success('Challenge joined! Start reporting!');
                  }}
                  disabled={challengeJoined}
                  className={`text-xs px-3 py-1.5 rounded transition-colors ${
                    challengeJoined 
                      ? 'bg-[#0fb880]/30 text-[#0fb880] cursor-default' 
                      : 'bg-[#0fb880] hover:bg-[#0fb880]/90 text-white'
                  }`}
                >
                  {challengeJoined ? 'Joined ✓' : 'Join Now'}
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
                    Alert Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={newAlert.message}
                    onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                    className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70 resize-none"
                    rows={3}
                    placeholder="Describe the traffic condition, delay, or incident..."
                    maxLength={200}
                  />
                  <div className="text-right">
                    <span className="text-xs text-gray-400">{newAlert.message.length}/200</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alert Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'traffic', label: 'Traffic', icon: 'traffic' },
                      { id: 'accident', label: 'Accident', icon: 'crash_alert' },
                      { id: 'delay', label: 'Delay', icon: 'schedule' },
                      { id: 'construction', label: 'Construction', icon: 'construction' },
                      { id: 'weather', label: 'Weather', icon: 'thunderstorm' },
                      { id: 'info', label: 'Info', icon: 'info' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNewAlert({ ...newAlert, type: type.id })}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
                          newAlert.type === type.id
                            ? 'bg-[#0fb880]/20 border-[#0fb880]/30 text-[#0fb880]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-[#0fb880]/20 hover:text-[#0fb880]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{type.icon}</span>
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'low', label: 'Low', color: 'text-green-400' },
                      { id: 'medium', label: 'Medium', color: 'text-yellow-400' },
                      { id: 'high', label: 'High', color: 'text-orange-400' },
                      { id: 'critical', label: 'Critical', color: 'text-red-400' }
                    ].map((severity) => (
                      <button
                        key={severity.id}
                        onClick={() => setNewAlert({ ...newAlert, severity: severity.id })}
                        className={`p-2 rounded-xl border transition-all flex flex-col items-center ${
                          newAlert.severity === severity.id
                            ? 'bg-white/10 border-white/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span className={`text-lg font-bold ${severity.color}`}>●</span>
                        <span className="text-xs text-gray-300">{severity.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAlert.location}
                    onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                    className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70"
                    placeholder="e.g., Sector 17 Chowk, NH-44, Patiala Road"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Area (Chandigarh area)
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
