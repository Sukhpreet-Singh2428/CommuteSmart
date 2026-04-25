import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { alertsAPI, getSocketUrl } from '../lib/api';
import { io, Socket } from 'socket.io-client';
import { PageNavbar } from '../components/PageNavbar';
import { useLiveStats, useTrendingAreas, useTopContributors } from '../hooks/useLiveStats';
import { useLocationService } from '../hooks/useLocationService';
import { ReportAlertModal } from '../components/ReportAlertModal';
import type { LeaderboardEntry, TrendingArea as TrendingAreaType } from '../types';

// Helper to calculate distance between two coordinates
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') return Infinity;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Safe helper to always get upvote count as a number
const getLikeCount = (upvotes: any): number => {
  if (typeof upvotes === 'number') return upvotes;
  if (Array.isArray(upvotes)) return upvotes.length;
  return 0;
};

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
  { id: 'verified', label: 'Verified', icon: 'verified' },
  { id: 'nearby', label: 'Nearby', icon: 'location_on' },
  { id: 'recent', label: 'Recent', icon: 'history' },
];

export function Alerts() {
  const [filter, setFilter] = useState<'all' | 'verified' | 'nearby' | 'recent'>('all');
  const { user } = useAuth();
  const { userLocation } = useLocationService();
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>(punjabAlerts); // Start with mock data
  const [upvotedAlerts, setUpvotedAlerts] = useState<Set<string>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  
  // PHASE 3: Comments State
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [alertComments, setAlertComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [challengeJoined, setChallengeJoined] = useState(() => {
    try { return JSON.parse(localStorage.getItem('commuteSmart_challenge') || 'false'); } catch { return false; }
  });
  const [shareCopied, setShareCopied] = useState<string | null>(null);

  // CONNECTED TO BACKEND: Live data hooks
  const { stats: liveStats, loading: statsLoading } = useLiveStats();
  const { areas: trendingAreas, loading: trendingLoading } = useTrendingAreas();
  const { contributors: topContributors, loading: contributorsLoading } = useTopContributors(3);

  // Dynamic verified count from fetched alerts
  const verifiedCount = alerts.filter((a: any) => a.verified === true).length;

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

      // PHASE 3: Listen for upvote updates
      newSocket.on('alert:upvoted', (data: any) => {
        setAlerts(prev => prev.map(a => 
          (a._id || a.id) === data.alertId ? { ...a, upvotes: data.upvoteCount } : a
        ));
      });

      // PHASE 3: Listen for comment updates
      newSocket.on('alert:comment:new', (data: any) => {
        setAlerts(prev => prev.map(a => 
          (a._id || a.id) === data.alertId ? { ...a, comments: data.totalComments } : a
        ));
        
        setAlertComments(prev => {
          if (prev[data.alertId]) {
            // Prevent duplicate comments in local state
            const exists = prev[data.alertId].some((c: any) => 
              c.createdAt === data.comment.createdAt && c.userId === data.comment.userId
            );
            if (!exists) {
              return {
                ...prev,
                [data.alertId]: [...prev[data.alertId], data.comment]
              };
            }
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
          verified: getLikeCount(alert.upvotes) >= 5,
          upvotes: getLikeCount(alert.upvotes),
          comments: Array.isArray(alert.comments) ? alert.comments.length : (alert.commentsCount || 0),
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
    if (filter === 'nearby') {
      // Defensive check
      if (userLocation && alert.location && typeof alert.location === 'object' && alert.location.coordinates) {
        const dist = getDistanceKm(userLocation[0], userLocation[1], alert.location.coordinates[1], alert.location.coordinates[0]);
        return dist <= 8; // within 8 km
      } else if (alert.lat && alert.long && userLocation) {
        const dist = getDistanceKm(userLocation[0], userLocation[1], alert.lat, alert.long);
        return dist <= 8;
      }
      
      const locStr = typeof alert.location === 'string' ? alert.location : (alert.locationText || '');
      return locStr.includes('Chandigarh') || locStr.includes('Sector');
    }
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
      const response = await alertsAPI.upvoteAlert(alertId);
      const { upvotes, userUpvoted } = response.data;

      setUpvotedAlerts(prev => {
        const newSet = new Set(prev);
        if (userUpvoted) {
          newSet.add(alertId);
        } else {
          newSet.delete(alertId);
        }
        return newSet;
      });

      // Update alert upvote count using the integer returned from backend
      setAlerts(prev => prev.map(alert => 
        (alert._id || alert.id) === alertId 
          ? { ...alert, upvotes: typeof upvotes === 'number' ? upvotes : getLikeCount(upvotes) }
          : alert
      ));
    } catch (error: any) {
      console.error('Error upvoting alert:', error);
      toast.error('Failed to upvote alert');
    }
  };

  // Share alert via Web Share API or clipboard fallback
  const handleShare = async (alert: any) => {
    const alertType = alert.alertType || alert.type || 'Alert';
    const typeLabel = alertType.charAt(0).toUpperCase() + alertType.slice(1);
    const message = alert.message || alert.title || 'Traffic alert';
    const area = alert.area || (typeof alert.location === 'string' ? alert.location : '') || 'Punjab';
    const shareText = `\u{1F6A8} ${typeLabel} Alert in ${area}: ${message} — Reported on CommuteSmart`;
    const shareUrl = `${window.location.origin}/alerts`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `CommuteSmart Alert — ${typeLabel}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error('Share error:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setShareCopied(alert._id || alert.id);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setShareCopied(null), 2000);
      } catch {
        console.warn('Clipboard not available');
      }
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

  // PHASE 3: Commenting Handlers
  const toggleComments = async (alertId: string) => {
    if (expandedAlertId === alertId) {
      setExpandedAlertId(null);
    } else {
      setExpandedAlertId(alertId);
      // Fetch comments if not loaded
      if (!alertComments[alertId]) {
        try {
          const response = await alertsAPI.getComments(alertId);
          if (response.data.success) {
            setAlertComments(prev => ({ ...prev, [alertId]: response.data.comments }));
          }
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
      }
    }
  };

  const handleAddComment = async (alertId: string) => {
    if (!commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const response = await alertsAPI.addComment(alertId, commentText);
      if (response.data.success) {
        setAlertComments(prev => ({
          ...prev,
          [alertId]: [...(prev[alertId] || []), response.data.comment]
        }));
        
        // Update comments count on alert locally
        setAlerts(prev => prev.map(a => 
          a._id === alertId ? { ...a, comments: response.data.totalComments } : a
        ));
        
        setCommentText('');
        toast.success('Comment added!');
      }
    } catch (error: any) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // CONNECTED TO BACKEND: Handle new alert submission (now handled by ReportAlertModal)

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
                  {option.id === 'verified' && verifiedCount > 0 && (
                    <motion.span 
                      className="text-xs bg-white/10 px-1.5 py-0.5 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {verifiedCount}
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
                        <span className="text-xs text-gray-400">Reported by {alert.reporter?.name || alert.reporter?.username || alert.reporter?.email?.split('@')[0] || 'Anonymous'}</span>
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
                          <span className="text-xs font-medium">{getLikeCount(alert.upvotes)}</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComments(alert._id);
                          }}
                          className={`flex items-center gap-1.5 transition-colors group ${
                            expandedAlertId === alert._id ? 'text-[#0fb880]' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <motion.span 
                            className="material-symbols-outlined text-lg"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            chat_bubble_outline
                          </motion.span>
                          <span className="text-xs font-medium">{alert.comments || 0}</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(alert);
                          }}
                          className={`flex items-center gap-1.5 transition-colors group ${
                            shareCopied === (alert._id || alert.id) ? 'text-[#0fb880]' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <motion.span 
                            className="material-symbols-outlined text-lg"
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            whileTap={{ scale: 0.8 }}
                          >
                            {shareCopied === (alert._id || alert.id) ? 'check_circle' : 'share'}
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

                    {/* PHASE 3: Comments Section */}
                    <AnimatePresence>
                      {expandedAlertId === alert._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-white/10"
                        >
                          <div className="space-y-3 mb-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {(!alertComments[alert._id] || alertComments[alert._id].length === 0) ? (
                              <p className="text-xs text-gray-500 text-center py-2">No comments yet. Be the first to comment!</p>
                            ) : (
                              alertComments[alert._id].map((comment: any, i: number) => (
                                <div key={i} className="bg-white/5 rounded-lg p-2.5">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs font-bold text-[#0fb880]">{comment.userName}</span>
                                    <span className="text-[10px] text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                                  </div>
                                  <p className="text-xs text-gray-300">{comment.text}</p>
                                </div>
                              ))
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0fb880]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddComment(alert._id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddComment(alert._id);
                              }}
                              disabled={!commentText.trim() || isSubmittingComment}
                              className="bg-[#0fb880] hover:bg-[#0fb880]/90 disabled:opacity-50 text-white rounded-xl px-3 flex items-center justify-center transition-colors"
                            >
                              {isSubmittingComment ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              ) : (
                                <span className="material-symbols-outlined text-sm">send</span>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
      <ReportAlertModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
