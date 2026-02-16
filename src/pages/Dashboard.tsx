import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapView } from '../components/MapView';
import { CarbonCalc } from '../components/CarbonCalc';
import { CarbonModal } from '../pages/CarbonModal';
import { AnimatedButton } from '../components/AnimatedButton';
import toast from 'react-hot-toast';

const reports = [
  { name: 'Rahul M.', time: '2m ago', text: 'Heavy traffic near Sector 17 flyover. Avoid if possible! 🚗', tag: 'Traffic', tagColor: 'bg-red-500/20 text-red-400' },
  { name: 'Priya K.', time: '5m ago', text: 'CTU Bus 14 AC is not working. Very hot! 🥵', tag: 'Facility', tagColor: 'bg-yellow-500/20 text-yellow-400' },
  { name: 'System', time: '12m ago', text: 'Chandigarh Metro running on schedule.', tag: null, tagColor: '' },
];

export function Dashboard() {
  const [from, setFrom] = useState('Sector 17, Chandigarh');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState<'bus' | 'metro' | 'bike'>('bus');
  const [liveTracking, setLiveTracking] = useState(true);
  const [carbonModalOpen, setCarbonModalOpen] = useState(false);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="grid md:grid-cols-12 gap-4 md:gap-6 p-4 md:p-6">
        {/* Left panel */}
        <div className="md:col-span-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4 md:p-6"
          >
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              🌱 Plan Your Journey
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/50">From</label>
                <input
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white mt-1"
                  placeholder="From"
                />
              </div>
              <div>
                <label className="text-xs text-white/50">To</label>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white mt-1"
                  placeholder="Where to?"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {(['bus', 'metro', 'bike'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    mode === m ? 'gradient-eco text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <AnimatedButton className="w-full mt-4 justify-center" icon={<span>→</span>}>
              Find Best Route
            </AnimatedButton>
          </motion.div>

          <div onClick={() => setCarbonModalOpen(true)} className="cursor-pointer">
            <CarbonCalc co2Saved={2.4} dailyGoal={3.0} />
          </div>
          <CarbonModal open={carbonModalOpen} onClose={() => setCarbonModalOpen(false)} co2Saved={2.4} />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">🎯 Live Tracking</h3>
                <p className="text-white/50 text-sm">Share with friends</p>
              </div>
              <button
                onClick={() => {
                  setLiveTracking(!liveTracking);
                  toast.success(liveTracking ? 'Tracking off' : 'Tracking on');
                }}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  liveTracking ? 'gradient-eco' : 'bg-white/20'
                }`}
              >
                <motion.div
                  animate={{ x: liveTracking ? 24 : 4 }}
                  className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
                />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Map */}
        <div className="md:col-span-5 min-h-[300px] md:min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full rounded-2xl overflow-hidden"
          >
            <MapView />
          </motion.div>
        </div>

        {/* Right panel - Live Reports */}
        <div className="md:col-span-3 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                Live Reports <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </h3>
              <Link to="/alerts" className="text-eco-emerald text-sm">View All</Link>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {reports.map((r) => (
                <div key={r.name + r.time} className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-eco-emerald/30 flex items-center justify-center text-sm font-medium">
                      {r.name.charAt(0)}
                    </div>
                    <span className="font-medium text-sm">{r.name}</span>
                    <span className="text-white/40 text-xs ml-auto">{r.time}</span>
                  </div>
                  <p className="text-white/80 text-sm">{r.text}</p>
                  {r.tag && (
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${r.tagColor}`}>
                      {r.tag}
                    </span>
                  )}
                  {r.name === 'System' && (
                    <button className="mt-2 px-3 py-1 rounded-lg gradient-eco text-white text-xs">
                      Update
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => toast('Alert nearby!')}
              className="w-full mt-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-sm"
            >
              🔔 Report Incident
            </button>
          </motion.div>
        </div>
      </div>

      {/* Map controls - bottom right */}
      <div className="fixed bottom-24 md:bottom-6 right-6 flex flex-col gap-2 z-40">
        <button className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-lg">+</button>
        <button className="w-10 h-10 rounded-xl glass-card flex items-center justify-center text-lg">−</button>
        <button className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">↑</button>
      </div>
    </div>
  );
}
