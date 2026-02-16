import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useState } from 'react';

interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  color?: 'green' | 'blue' | 'grey';
}

export function AchievementBadge({
  icon,
  title,
  description,
  unlocked,
  color = 'grey',
}: AchievementBadgeProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const colorClasses = {
    green: unlocked ? 'border-eco-emerald bg-eco-emerald/10' : 'border-white/20',
    blue: unlocked ? 'border-blue-500 bg-blue-500/10' : 'border-white/20',
    grey: 'border-white/20 opacity-60',
  };

  const handleClick = () => {
    if (unlocked) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ scale: unlocked ? 1.02 : 1 }}
      whileTap={{ scale: 0.98 }}
      className={`glass-card p-4 rounded-xl border-2 cursor-pointer transition-all ${colorClasses[color]}`}
    >
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={100}
        />
      )}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 ${
          unlocked ? (color === 'green' ? 'bg-eco-emerald/30' : color === 'blue' ? 'bg-blue-500/30' : '') : 'bg-white/10'
        }`}
      >
        {icon}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-white/60 text-xs">{description}</p>
      <span
        className={`text-xs font-medium mt-1 inline-block ${
          unlocked ? (color === 'green' ? 'text-eco-emerald' : color === 'blue' ? 'text-blue-400' : '') : 'text-white/40'
        }`}
      >
        {unlocked ? 'UNLOCKED' : 'LOCKED'}
      </span>
    </motion.div>
  );
}
