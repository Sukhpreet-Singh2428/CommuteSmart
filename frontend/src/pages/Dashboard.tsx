import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapView } from '../components/MapView';
import toast from 'react-hot-toast';

const punjabReports = [
  { 
    name: 'Amanjeet S.', 
    time: '2m ago', 
    text: 'CTU Bus 42 delayed at Sector 22 intersection. Technical fault reported. Expect +15m. ⚠️',
    avatar: 'AS'
  },
  { 
    name: 'Gurpreet K.', 
    time: '12m ago', 
    text: 'Patiala Road super clean today! AC is working perfectly. Nice work CommuteSmart! ❄️✨',
    avatar: 'GK'
  },
  { 
    name: 'System Update', 
    time: '45m ago', 
    text: 'New bicycle docking station added at Rajpura highway intersection. 🚲',
    avatar: 'SYS',
    isSystem: true
  },
  { 
    name: 'Harpreet S.', 
    time: '1h ago', 
    text: 'Metro train on time at Sector 34 station. Great service today! 🚇',
    avatar: 'HS'
  },
  { 
    name: 'Simranjeet K.', 
    time: '2h ago', 
    text: 'Heavy traffic near Ambala Cantt due to festival season. Plan accordingly. 🎉',
    avatar: 'SK'
  },
];

const transportModes = [
  { id: 'bus', icon: 'directions_bus', label: 'BUS' },
  { id: 'metro', icon: 'train', label: 'METRO' },
  { id: 'bike', icon: 'directions_bike', label: 'CYCLE' },
];

export function Dashboard() {
  const [from, setFrom] = useState('Sector 17, Chandigarh');
  const [to, setTo] = useState('');
  const [selectedMode, setSelectedMode] = useState<'bus' | 'metro' | 'bike'>('bus');
  const [co2Offset] = useState(12.8);
  const [rewardTokens] = useState(450);
  const [weeklyProgress] = useState(75);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a1411]">
      {/* Navigation */}
      <nav className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-[#0a1411]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#0fb880] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(15,184,128,0.4)]">C</div>
          <span className="font-bold text-xl tracking-tight text-white">Commute<span className="text-[#0fb880]">Smart</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-[#0fb880] border-b-2 border-[#0fb880] h-16 flex items-center text-sm font-medium" to="/dashboard">Dashboard</Link>
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/alerts">Community</Link>
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
          <Link to="/dashboard" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-[#0fb880]">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-xs mt-0.5">Dashboard</span>
          </Link>
          <Link to="/alerts" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-gray-400">
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
      <div className="flex-1 grid grid-rows-[0.85fr_0.15fr] min-h-[calc(100vh-4rem)] pb-16 md:pb-0">
        {/* Map Section */}
        <div className="relative w-full overflow-hidden map-bg border-b border-[#0fb880]/10 min-h-[400px]">
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            <div className="glass-panel p-1 rounded-lg flex flex-col">
              <button className="w-8 h-8 flex items-center justify-center hover:text-[#0fb880] transition-colors text-white">
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
              <div className="h-px bg-[#0fb880]/10 mx-1"></div>
              <button className="w-8 h-8 flex items-center justify-center hover:text-[#0fb880] transition-colors text-white">
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
            </div>
            <button className="glass-panel w-10 h-10 rounded-lg flex items-center justify-center text-[#0fb880] hover:bg-[#0fb880] hover:text-white transition-all shadow-lg">
              <span className="material-symbols-outlined">near_me</span>
            </button>
          </div>
          <div className="absolute top-4 left-4 z-20">
            <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0fb880] shadow-[0_0_8px_#0fb880]"></span>
              <span className="text-xs font-semibold text-gray-200 uppercase tracking-widest">Live: Punjab Transit</span>
            </div>
          </div>
          
          {/* Map Component */}
          <div className="w-full h-full">
            <MapView />
          </div>
        </div>

        {/* Bottom Grid Section */}
        <div className="p-4 bg-[#0a1411] grid grid-cols-12 gap-4">
          {/* Route Planner */}
          <div className="col-span-3 glass-panel rounded-2xl p-5 flex flex-col h-full overflow-hidden">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">route</span>
              Route Planner
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <div className="relative">
                <div className="absolute left-3 top-3.5 w-1.5 h-1.5 rounded-full bg-[#0fb880]"></div>
                <div className="absolute left-[14px] top-6 bottom-4 w-0.5 bg-gray-700/50"></div>
                <input 
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white" 
                  placeholder="Enter Starting Point" 
                  type="text" 
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-4 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <input 
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white" 
                  placeholder="Where to go?" 
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 py-2">
                {transportModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id as any)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      selectedMode === mode.id 
                        ? 'bg-[#0fb880]/10 border-[#0fb880]/20 text-[#0fb880]' 
                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-[#0fb880]/20 hover:text-[#0fb880]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">{mode.icon}</span>
                    <span className="text-[10px] font-bold">{mode.label}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => toast.success('Route calculated!')}
                className="w-full bg-[#0fb880] hover:bg-[#0fb880]/90 text-white font-bold py-3 rounded-xl shadow-lg shadow-[#0fb880]/20 transition-all active:scale-95 text-sm"
              >
                Calculate Optimal Path
              </button>
            </div>
          </div>

          {/* Eco Dashboard */}
          <div className="col-span-5 glass-panel rounded-2xl p-5 flex items-center justify-between h-full gap-6">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[#0fb880] text-xl">eco</span>
                  Eco Dashboard
                </h2>
                <p className="text-xs text-gray-400">Sustainability performance since Oct 1</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0fb880]/10 flex items-center justify-center text-[#0fb880]">
                    <span className="material-symbols-outlined">cloud_off</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">CO2 Offset</p>
                    <p className="text-xl font-black text-white leading-none">{co2Offset} kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <span className="material-symbols-outlined">emoji_events</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Reward Tokens</p>
                    <p className="text-xl font-black text-white leading-none">{rewardTokens} CP</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">
                  <span>Daily Progress</span>
                  <span className="text-[#0fb880]">82% to Level Up</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0fb880]/50 to-[#0fb880] w-[82%] rounded-full shadow-[0_0_8px_rgba(15,184,128,0.4)]"></div>
                </div>
              </div>
            </div>
            <div className="w-48 h-48 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-white/5" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
                <circle 
                  className="text-[#0fb880]" 
                  cx="96" 
                  cy="96" 
                  fill="transparent" 
                  r="88" 
                  stroke="currentColor" 
                  strokeDasharray="553" 
                  strokeDashoffset={553 - (553 * weeklyProgress) / 100}
                  strokeLinecap="round" 
                  strokeWidth="12"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-gray-400 uppercase leading-none mb-1">Weekly</span>
                <span className="text-4xl font-black text-white leading-none">{weeklyProgress}%</span>
                <span className="text-[10px] text-[#0fb880] font-bold mt-1 uppercase">Target Met</span>
              </div>
            </div>
          </div>

          {/* Community Feed */}
          <div className="col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-red-400 text-xl">forum</span>
                Community Feed
              </h2>
              <button 
                onClick={() => toast.success('Report feature coming soon!')}
                className="bg-[#0fb880]/20 hover:bg-[#0fb880]/30 text-[#0fb880] text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors"
              >
                REPORT +
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {punjabReports.map((report, index) => (
                <div key={index} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#0fb880]/20 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      {report.isSystem ? (
                        <div className="w-6 h-6 rounded-full bg-[#0fb880]/20 flex items-center justify-center text-[8px] font-black text-[#0fb880] border border-[#0fb880]/20 uppercase">
                          {report.avatar}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                          {report.avatar}
                        </div>
                      )}
                      <span className="text-xs font-bold text-white">{report.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{report.time}</span>
                  </div>
                  <p className="text-xs text-gray-300">{report.text}</p>
                </div>
              ))}
              <button 
                onClick={() => toast.success('Loading more reports...')}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">expand_more</span>
                Read More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
