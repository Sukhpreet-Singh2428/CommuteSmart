import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ECO_FACTS = [
  'A single bus can replace 30 cars on the road!',
  'Punjab Metro saves ~2.4kg CO2 per trip vs car.',
  'Walking 1km instead of driving saves 0.2kg CO2.',
  'Off-peak travel reduces congestion by 40%.',
  'Cycling produces zero emissions.',
  'Carpooling cuts emissions in half.',
  'Electric buses emit 60% less CO2 than diesel.',
];

interface FactTooltipProps {
  children: React.ReactNode;
}

export function FactTooltip({ children }: FactTooltipProps) {
  const [show, setShow] = useState(false);
  const fact = useMemo(
    () => ECO_FACTS[Math.floor(Math.random() * ECO_FACTS.length)],
    []
  );

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 rounded-xl glass-card max-w-[220px] text-sm text-white/90"
          >
            <span className="text-eco-emerald font-medium">Did You Know? </span>
            {fact}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
