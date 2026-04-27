import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { leaderboardAPI, userAPI } from '../lib/api';
import { PageNavbar } from '../components/PageNavbar';
import { useUserStats } from '../hooks/useUserStats';

const achievements = [
  { title: 'Smog Fighter', icon: 'workspace_premium', description: 'Avoided 50kg+ CO2', progress: 100, unlocked: true },
  { title: 'Bus Pro', icon: 'commute', description: '100+ public transit trips', progress: 100, unlocked: true },
  { title: 'Route Scout', icon: 'explore', description: 'Discover 20 new routes', progress: 65, unlocked: false },
  { title: 'Green King', icon: 'eco', description: 'Top eco-rank for 30 days', progress: 40, unlocked: false },
  { title: 'Community Hero', icon: 'volunteer_activism', description: '50+ helpful reports', progress: 80, unlocked: false },
  { title: 'Speed Demon', icon: 'speed', description: 'Fastest route optimizer', progress: 25, unlocked: false },
];

const recentActivity = [
  { type: 'commute', icon: 'directions_bus', title: 'CTU Bus to Sector 17', time: '2 hours ago', impact: '+2.5 kg CO2 saved' },
  { type: 'report', icon: 'report', title: 'Reported traffic jam', time: '5 hours ago', impact: '+15 XP' },
  { type: 'achievement', icon: 'emoji_events', title: 'Earned Bus Pro badge', time: '1 day ago', impact: '+50 XP' },
  { type: 'commute', icon: 'train', title: 'Metro ride to Patiala', time: '2 days ago', impact: '+1.8 kg CO2 saved' },
];

const settingsOptions = [
  { category: 'Notifications', items: [
    { label: 'Traffic Alerts', description: 'Real-time traffic updates', enabled: true },
    { label: 'Achievement Notifications', description: 'Celebrate your milestones', enabled: true },
    { label: 'Community Updates', description: 'Reports from your area', enabled: false },
  ]},
  { category: 'Privacy', items: [
    { label: 'Location Sharing', description: 'Share your location anonymously', enabled: true },
    { label: 'Profile Visibility', description: 'Show profile in leaderboards', enabled: true },
    { label: 'Data Analytics', description: 'Help improve our service', enabled: true },
  ]},
];

export function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<Array<{ rank: number; name: string; xp: number; trend: string; highlight?: boolean }>>([]);
  
  // CONNECTED TO BACKEND: Fetch user stats from /api/users/me/stats
  const { stats: userStats, loading: statsLoading, pointsAnimation } = useUserStats();
  
  const [animatedStats, setAnimatedStats] = useState({
    co2: 0,
    trees: 0,
    trips: 0,
    distance: 0,
    level: 0,
    xp: 0
  });
  const [settings, setSettings] = useState(
    settingsOptions.reduce((acc, category) => {
      category.items.forEach(item => {
        acc[item.label] = item.enabled;
      });
      return acc;
    }, {} as Record<string, boolean>)
  );

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    city: user?.city || '',
    profilePhoto: user?.profilePhoto || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        city: user.city || '',
        profilePhoto: user.profilePhoto || ''
      });
    }
  }, [user]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await userAPI.updateProfile(profileForm);
      if (response.data.success && updateUser) {
        toast.success('Profile updated successfully!');
        updateUser(response.data.user);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // POLISHED: Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // CONNECTED TO BACKEND: Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await leaderboardAPI.getLeaderboard(5);
        if (response.data.success && response.data.leaderboard) {
          const entries = response.data.leaderboard.map((entry: { userId: string; name: string; email: string; points: number; rank: number }, index: number) => ({
            rank: entry.rank || index + 1,
            name: entry.userId === user?.id ? 'You' : (entry.name || entry.email?.split('@')[0] || 'Anonymous'),
            xp: entry.points || 0,
            trend: 'up',
            highlight: entry.userId === user?.id,
          }));
          setLeaderboardData(entries);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        // Fallback to static data
        setLeaderboardData([
          { rank: 1, name: 'Amanjeet S.', xp: 2850, trend: 'up' },
          { rank: 2, name: 'Gurpreet K.', xp: 2720, trend: 'up' },
          { rank: 3, name: 'Harpreet S.', xp: 2650, trend: 'down' },
          { rank: 12, name: 'You', xp: user?.points || 0, trend: 'up', highlight: true },
        ]);
      }
    };
    fetchLeaderboard();
  }, [user?.id, user?.points]);

  useEffect(() => {
    if (!isLoading) {
      // CONNECTED TO BACKEND: Use real user stats from API
      const targetStats = {
        co2: userStats?.carbonSaved || user?.carbonSaved || 0,
        trees: userStats?.treesEquivalent || 0,
        trips: userStats?.totalTrips || 0,
        distance: userStats?.totalDistance || 0,
        level: userStats?.level || Math.floor((user?.points || 0) / 1000) + 1,
        xp: userStats?.currentLevelXP || (user?.points || 0) % 1000
      };
      
      const duration = 2000;
      const steps = 60;
      const increment = Object.keys(targetStats).reduce((acc, key) => {
        acc[key as keyof typeof targetStats] = targetStats[key as keyof typeof targetStats] / steps;
        return acc;
      }, {} as Record<string, number>);
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedStats({
          co2: Math.min(targetStats.co2, increment.co2 * currentStep),
          trees: Math.min(targetStats.trees, increment.trees * currentStep),
          trips: Math.min(targetStats.trips, Math.floor(increment.trips * currentStep)),
          distance: Math.min(targetStats.distance, Math.floor(increment.distance * currentStep)),
          level: Math.min(targetStats.level, Math.floor(increment.level * currentStep)),
          xp: Math.min(targetStats.xp, Math.floor(increment.xp * currentStep))
        });
        
        if (currentStep >= steps) clearInterval(interval);
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [isLoading, userStats, user?.carbonSaved, user?.points]);

  const handleSettingToggle = (label: string) => {
    setSettings(prev => ({ ...prev, [label]: !prev[label] }));
    // Setting changed silently (no toast for minor UI actions)
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a1411]">
      {/* UNIFIED: Shared PageNavbar component */}
      <PageNavbar activePage="profile" />

      {/* Floating Points Animation */}
      <AnimatePresence>
        {pointsAnimation && (
          <motion.div
            className="fixed top-20 right-8 z-[200] text-[#0fb880] font-black text-lg"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -40 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            +{pointsAnimation.points} pts
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 pb-20 md:pb-4">
        {/* Left Sidebar - Profile Info */}
        <div className="col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0fb880] to-[#0ea5e9] flex items-center justify-center border-4 border-white/20 shadow-xl overflow-hidden text-white text-2xl font-bold">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) ?? 'U'
                  )}
                </div>
                <div 
                  className="absolute bottom-0 right-0 w-6 h-6 bg-[#0fb880] rounded-full flex items-center justify-center border-2 border-[#0a1411] cursor-pointer"
                  onClick={() => setActiveTab('settings')}
                >
                  <span className="material-symbols-outlined text-sm text-white">edit</span>
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{user?.name || user?.username || user?.email?.split('@')[0] || 'User'}</h2>
              <p className="text-[#0fb880] text-sm font-medium mb-4">{(user?.badges?.length || 0) > 0 ? user?.badges?.[0] : 'Commuter'} • {user?.city || 'Chandigarh'}</p>
              
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Level {userStats?.level || animatedStats.level}</span>
                  <span>{userStats?.currentLevelXP || animatedStats.xp} / 1,000 XP</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#0fb880] to-[#0ea5e9] rounded-full shadow-[0_0_8px_rgba(15,184,128,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${userStats?.levelProgressPct || 0}%` }}
                    transition={{ delay: 1, duration: 1, ease: 'easeOut' }}
                  ></motion.div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">eco</span>
              Eco Impact
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">CO2 Saved</span>
                <motion.span 
                  className="text-lg font-bold text-[#0fb880]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {animatedStats.co2.toFixed(1)} kg
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Trees Equivalent</span>
                <motion.span 
                  className="text-lg font-bold text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {animatedStats.trees.toFixed(1)}
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Clean Air Rank</span>
                <motion.span 
                  className="text-lg font-bold text-yellow-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  #{userStats?.cleanAirRank || '—'}
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Green Score</span>
                <motion.span 
                  className="text-lg font-bold text-[#0fb880]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {userStats?.greenScore || 'C'}
                </motion.span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">emoji_events</span>
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Total Trips</span>
                <motion.span 
                  className="text-sm font-bold text-white"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {animatedStats.trips}
                </motion.span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Distance</span>
                <motion.span 
                  className="text-sm font-bold text-white"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {animatedStats.distance.toLocaleString()} km
                </motion.span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Reports</span>
                <motion.span 
                  className="text-sm font-bold text-white"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  {userStats?.totalReports || 0}
                </motion.span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Badges</span>
                <motion.span 
                  className="text-sm font-bold text-white"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  {user?.badges?.length || 0}
                </motion.span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-6 space-y-4">
          {/* Tabs */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex gap-2 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: 'dashboard' },
                { id: 'achievements', label: 'Achievements', icon: 'emoji_events' },
                { id: 'activity', label: 'Activity', icon: 'history' },
                { id: 'settings', label: 'Settings', icon: 'settings' },
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                    activeTab === tab.id 
                      ? 'bg-[#0fb880] text-white shadow-lg shadow-[#0fb880]/20' 
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#0fb880]/10 flex items-center justify-center text-[#0fb880]">
                      <span className="material-symbols-outlined">directions_bus</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">Public Transit</p>
                      <p className="text-xl font-black text-white">{animatedStats.distance.toLocaleString()} km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#0fb880]">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+15% from last month</span>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <span className="material-symbols-outlined">cloud_off</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase">CO2 Avoided</p>
                      <p className="text-xl font-black text-white">{animatedStats.co2.toFixed(1)} kg</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-500">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>{((userStats?.carbonSaved || 0) / 8.91).toFixed(1)} gallons fuel equivalent</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[#0fb880] text-xl">insights</span>
                  Monthly Progress
                </h3>
                <div className="space-y-3">
                  {(userStats?.weeklyProgress || [
                    { week: 'Week 1', pct: 0 },
                    { week: 'Week 2', pct: 0 },
                    { week: 'Week 3', pct: 0 },
                    { week: 'Week 4', pct: 0 }
                  ]).map((weekData, index) => (
                    <div key={weekData.week} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-12">{weekData.week}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-[#0fb880] to-[#0ea5e9] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(weekData.pct, weekData.pct > 0 ? 4 : 0)}%` }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                        ></motion.div>
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{weekData.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div 
                  key={achievement.title} 
                  className={`glass-panel rounded-2xl p-5 ${!achievement.unlocked ? 'opacity-60' : ''} group`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? 'bg-[#0fb880]/10 text-[#0fb880]' : 'bg-white/5 text-gray-500'
                      } ${achievement.unlocked ? 'group-hover:rotate-12' : ''} transition-transform duration-300`}
                      whileHover={{ scale: 1.1, rotate: achievement.unlocked ? 15 : 0 }}
                    >
                      <span className="material-symbols-outlined text-xl">{achievement.icon}</span>
                    </motion.div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white">{achievement.title}</h4>
                      <p className="text-xs text-gray-400">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gray-300">{achievement.progress}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${
                          achievement.unlocked ? 'bg-[#0fb880]' : 'bg-gray-600'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1, ease: 'easeOut' }}
                      ></motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div 
                  key={index} 
                  className="glass-panel rounded-2xl p-4 group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                      activity.type === 'commute' ? 'bg-[#0fb880]/10 text-[#0fb880]' :
                      activity.type === 'report' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-purple-500/10 text-purple-500'
                    }`}>
                      <span className="material-symbols-outlined">{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white">{activity.title}</h4>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <motion.p 
                        className="text-xs font-bold text-[#0fb880]"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        {activity.impact}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="glass-panel rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Profile Details</h3>
                <div className="space-y-4">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0fb880] to-[#0ea5e9] flex items-center justify-center border-4 border-white/20 shadow-xl overflow-hidden text-white text-2xl font-bold">
                        {profileForm.profilePhoto ? (
                          <img src={profileForm.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          user?.name?.charAt(0) ?? 'U'
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                      </div>
                      <input type="file" accept="image/jpeg, image/png, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleProfilePhotoChange} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Tap to change (Max 2MB)</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Name</label>
                      <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#0fb880] outline-none text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Username</label>
                      <input type="text" value={profileForm.username} onChange={e => setProfileForm({...profileForm, username: e.target.value})} className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#0fb880] outline-none text-white" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">City</label>
                    <input type="text" value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#0fb880] outline-none text-white" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Bio</label>
                    <textarea value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#0fb880] outline-none text-white resize-none" rows={3} maxLength={200}></textarea>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={isSavingProfile}
                      className="bg-[#0fb880] hover:bg-[#0fb880]/90 text-white font-bold py-2 px-6 rounded-xl transition-all flex items-center gap-2"
                    >
                      {isSavingProfile ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span className="material-symbols-outlined text-sm">save</span>
                      )}
                      Save Profile
                    </button>
                  </div>
                </div>
              </div>

              {settingsOptions.map((category) => (
                <div key={category.category} className="glass-panel rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{category.category}</h3>
                  <div className="space-y-3">
                    {category.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                        <motion.button
                          onClick={() => handleSettingToggle(item.label)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            settings[item.label] ? 'bg-[#0fb880]' : 'bg-gray-600'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div 
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              settings[item.label] ? 'translate-x-7' : 'translate-x-1'
                            }`}
                            layout
                          ></motion.div>
                        </motion.button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">leaderboard</span>
              Leaderboard
            </h2>
            <div className="space-y-3">
              {(leaderboardData.length > 0 ? leaderboardData : [
                { rank: 1, name: 'Amanjeet S.', xp: 2850, trend: 'up' },
                { rank: 2, name: 'Gurpreet K.', xp: 2720, trend: 'up' },
                { rank: 3, name: 'Harpreet S.', xp: 2650, trend: 'down' },
                { rank: 12, name: 'You', xp: user?.points || 0, trend: 'up', highlight: true },
              ]).map((entry) => (
                <div key={entry.rank} className={`flex items-center gap-3 p-2 rounded-lg ${entry.highlight ? 'bg-[#0fb880]/10' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${
                    entry.rank === 1 ? 'bg-yellow-500 text-black' : 
                    entry.rank === 2 ? 'bg-gray-400 text-black' : 
                    entry.rank === 3 ? 'bg-orange-700 text-white' :
                    entry.highlight ? 'bg-[#0fb880] text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {entry.rank}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${entry.highlight ? 'text-[#0fb880]' : 'text-white'}`}>{entry.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{entry.xp} XP</p>
                    <span className={`material-symbols-outlined text-xs ${
                      entry.trend === 'up' ? 'text-[#0fb880]' : 'text-red-500'
                    }`}>
                      {entry.trend === 'up' ? 'trending_up' : 'trending_down'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">local_fire_department</span>
              Current Streak
            </h2>
            <div className="text-center">
              <div className="text-4xl font-black text-white mb-2 flex items-center gap-2">
                <motion.span 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: (userStats?.currentStreak || 0) > 0 ? [0, 10, -10, 0] : 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  style={{ filter: (userStats?.currentStreak || 0) >= 7 ? 'drop-shadow(0 0 8px #f59e0b)' : 'none' }}
                >
                  {userStats?.currentStreak || 0} {(userStats?.currentStreak || 0) > 0 ? '🔥' : '💤'}
                </motion.span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {(userStats?.currentStreak || 0) === 0 
                  ? 'Start your streak today!' 
                  : 'Days of green commuting'}
              </p>
              {(() => {
                const streak = userStats?.currentStreak || 0;
                const nextMilestone = streak < 7 ? 7 : streak < 30 ? 30 : 100;
                const daysToNext = nextMilestone - streak;
                const pct = Math.min(100, (streak / nextMilestone) * 100);
                return (
                  <>
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#0fb880] to-orange-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 1.3, duration: 1, ease: 'easeOut' }}
                      ></motion.div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {streak > 0 ? `${daysToNext} days to next milestone` : 'Report an alert to start!'}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0fb880]/20 to-[#0fb880]/5 rounded-2xl p-5 border border-[#0fb880]/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#0fb880]">tips_and_updates</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Pro Tip</h4>
                <p className="text-xs text-gray-300 mb-3">Use the metro during peak hours to avoid traffic and earn double XP!</p>
                <button 
                  onClick={() => console.log('Tip acknowledged')}
                  className="text-xs bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-3 py-1.5 rounded transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
