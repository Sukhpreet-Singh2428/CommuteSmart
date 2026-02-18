import { motion, AnimatePresence } from 'framer-motion';
import { FactTooltip } from '../components/FactTooltip';

interface CarbonModalProps {
  open: boolean;
  onClose: () => void;
  co2Saved?: number;
}

export function CarbonModal({ open, onClose, co2Saved = 2.4 }: CarbonModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
          >
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  🌱 Carbon Impact
                  <FactTooltip>
                    <span className="text-eco-emerald cursor-help text-sm">ⓘ</span>
                  </FactTooltip>
                </h2>
                <button
                  onClick={onClose}
                  className="text-white/50 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-32 h-32 mx-auto rounded-full border-4 border-eco-emerald/50 flex items-center justify-center mb-4"
                >
                  <span className="text-3xl font-bold gradient-text">{co2Saved} kg</span>
                </motion.div>
                <p className="text-white/70">CO2 saved today</p>
                <p className="text-eco-emerald text-sm mt-2">Equivalent to ~12 km by car</p>
              </div>
              <p className="text-white/50 text-sm text-center">
                Every trip you take on public transport helps reduce the region&apos;s carbon footprint.
              </p>
              <button
                onClick={onClose}
                className="w-full mt-6 py-3 rounded-xl gradient-eco text-white font-medium"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
