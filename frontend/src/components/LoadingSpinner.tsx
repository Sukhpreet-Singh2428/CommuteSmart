import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'secondary';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-[#0fb880]/30 border-t-[#0fb880]',
    white: 'border-white/30 border-t-white',
    secondary: 'border-[#0ea5e9]/30 border-t-[#0ea5e9]'
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 rounded-full animate-spin`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      {text && (
        <motion.p 
          className="text-sm text-gray-400"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// POLISHED: Skeleton loader component
interface SkeletonProps {
  lines?: number;
  className?: string;
}

export function SkeletonLoader({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="bg-white/10 rounded h-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

// POLISHED: Full page loader
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-[#0a1411] flex items-center justify-center z-50">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-16 h-16 rounded-full bg-[#0fb880] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(15,184,128,0.4)]">
          <span className="text-white text-2xl font-bold">CS</span>
        </div>
        <LoadingSpinner size="lg" text="Loading CommuteSmart..." />
      </motion.div>
    </div>
  );
}
