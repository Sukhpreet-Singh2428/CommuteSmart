import { motion } from 'framer-motion';
import { FactTooltip } from './FactTooltip';

interface CarbonCalcProps {
  co2Saved: number;
  dailyGoal?: number;
  label?: string;
  compact?: boolean;
}

export function CarbonCalc({
  co2Saved = 2.4,
  dailyGoal = 3.0,
  label = 'CO2 Saved Today',
  compact = false,
}: CarbonCalcProps) {
  const percent = Math.min(100, (co2Saved / dailyGoal) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 md:p-6"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-semibold">{label}</span>
          <FactTooltip>
            <span className="text-eco-emerald cursor-help text-sm">ⓘ</span>
          </FactTooltip>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold gradient-text">{co2Saved} kg</span>
      </div>
      {!compact && (
        <>
          <p className="text-white/60 text-sm mt-1">Daily Goal: {dailyGoal} kg</p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full gradient-eco"
            />
          </div>
          <p className="text-white/50 text-xs mt-1 text-right">{Math.round(percent)}%</p>
        </>
      )}
    </motion.div>
  );
}
