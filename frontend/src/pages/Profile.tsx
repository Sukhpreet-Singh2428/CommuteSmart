import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
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

  // POLISHED: Animate stats on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const targetStats = {
        co2: 12.8,
        trees: 4.2,
        trips: 248,
        distance: 1248,
        level: 14,
        xp: 2850
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
  }, [isLoading]);

  const handleSettingToggle = (label: string) => {
    setSettings(prev => ({ ...prev, [label]: !prev[label] }));
    toast.success(`${label} ${!settings[label] ? 'enabled' : 'disabled'}`);
  };

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
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/alerts">Community</Link>
          <Link className="text-[#0fb880] border-b-2 border-[#0fb880] h-16 flex items-center text-sm font-medium" to="/profile">Profile</Link>
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
          <Link to="/alerts" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-gray-400">
            <span className="material-symbols-outlined text-lg">forum</span>
            <span className="text-xs mt-0.5">Community</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-[#0fb880]">
            <span className="material-symbols-outlined text-lg">person</span>
            <span className="text-xs mt-0.5">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 pb-20 md:pb-4">
        {/* Left Sidebar - Profile Info */}
        <div className="col-span-3 space-y-4">
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0fb880] to-[#0ea5e9] flex items-center justify-center border-4 border-white/20 shadow-xl text-white text-2xl font-bold">
                  {user?.name?.charAt(0) ?? 'U'}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0fb880] rounded-full flex items-center justify-center border-2 border-[#0a1411]">
                  <span className="material-symbols-outlined text-sm text-white">edit</span>
                </div>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">{user?.name ?? 'User'}</h2>
              <p className="text-[#0fb880] text-sm font-medium mb-4">Pro Commuter • Chandigarh</p>
              
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>Level {animatedStats.level}</span>
                  <span>{animatedStats.xp.toLocaleString()} / 3,000 XP</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#0fb880] to-[#0ea5e9] rounded-full shadow-[0_0_8px_rgba(15,184,128,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: '95%' }}
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
                  #12
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
                  A+
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
                  47
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
                  6
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
                    <span>45 gallons fuel equivalent</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[#0fb880] text-xl">insights</span>
                  Monthly Progress
                </h3>
                <div className="space-y-3">
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => (
                    <div key={week} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-12">{week}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#0fb880] to-[#0ea5e9] rounded-full"
                          style={{ width: `${75 + index * 5}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{75 + index * 5}%</span>
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
              {[
                { rank: 1, name: 'Amanjeet S.', xp: 2850, trend: 'up' },
                { rank: 2, name: 'Gurpreet K.', xp: 2720, trend: 'up' },
                { rank: 3, name: 'Harpreet S.', xp: 2650, trend: 'down' },
                { rank: 12, name: 'You', xp: 2850, trend: 'up', highlight: true },
              ].map((user) => (
                <div key={user.rank} className={`flex items-center gap-3 p-2 rounded-lg ${user.highlight ? 'bg-[#0fb880]/10' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${
                    user.rank === 1 ? 'bg-yellow-500 text-black' : 
                    user.rank === 2 ? 'bg-gray-400 text-black' : 
                    user.rank === 3 ? 'bg-orange-700 text-white' :
                    user.highlight ? 'bg-[#0fb880] text-white' : 'bg-gray-600 text-white'
                  }`}>
                    {user.rank}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${user.highlight ? 'text-[#0fb880]' : 'text-white'}`}>{user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">{user.xp} XP</p>
                    <span className={`material-symbols-outlined text-xs ${
                      user.trend === 'up' ? 'text-[#0fb880]' : 'text-red-500'
                    }`}>
                      {user.trend === 'up' ? 'trending_up' : 'trending_down'}
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
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                >
                  7 🔥
                </motion.span>
              </div>
              <p className="text-xs text-gray-400 mb-3">Days of green commuting</p>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#0fb880] to-orange-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  transition={{ delay: 1.3, duration: 1, ease: 'easeOut' }}
                ></motion.div>
              </div>
              <p className="text-xs text-gray-400 mt-2">3 days to next milestone</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0fb880]/20 to-[#0fb880]/5 rounded-2xl p-5 border border-[#0fb880]/20">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#0fb880]">tips_and_updates</span>
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Pro Tip</h4>
                <p className="text-xs text-gray-300 mb-3">Use the metro during peak hours to avoid traffic and earn double XP!</p>
                <button 
                  onClick={() => toast.success('Tip noted!')}
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
