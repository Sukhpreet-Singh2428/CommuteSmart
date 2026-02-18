import { useState } from 'react';
import { motion } from 'framer-motion';

interface AlertCardProps {
  title: string;
  description: string;
  location?: string;
  timeAgo: string;
  reporter: string;
  type: 'traffic' | 'delay' | 'clear' | 'accident';
  verified?: boolean;
  upvotes?: number;
  comments?: number;
  mapSnippet?: boolean;
}

const typeConfig = {
  traffic: { icon: '🔴', bg: 'bg-red-500/20', tag: 'Traffic' },
  delay: { icon: '🕐', bg: 'bg-yellow-500/20', tag: 'Delay' },
  clear: { icon: '✅', bg: 'bg-green-500/20', tag: 'Clear' },
  accident: { icon: '⚠️', bg: 'bg-orange-500/20', tag: 'Accident' },
};

export function AlertCard({
  title,
  description,
  location,
  timeAgo,
  reporter,
  type,
  verified = false,
  upvotes = 0,
  comments = 0,
  mapSnippet = false,
}: AlertCardProps) {
  const [upvoted, setUpvoted] = useState(false);
  const config = typeConfig[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-2xl mb-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-3 flex-1">
          <span className="text-2xl flex-shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{title}</h3>
              {verified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-eco-emerald/30 text-eco-emerald">
                  VERIFIED
                </span>
              )}
            </div>
            <p className="text-white/70 text-sm mt-1">{description}</p>
            {location && (
              <p className="text-white/50 text-xs mt-2 flex items-center gap-1">
                📍 {location}
              </p>
            )}
          </div>
        </div>
        <span className="text-white/40 text-xs whitespace-nowrap">{timeAgo}</span>
      </div>

      {mapSnippet && (
        <div className="mt-3 h-20 rounded-xl bg-white/5 flex items-center justify-center">
          <span className="text-white/30 text-sm">Map preview</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <p className="text-white/50 text-xs">Reported by {reporter}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setUpvoted(!upvoted)}
            className={`flex items-center gap-1 text-sm ${upvoted ? 'text-eco-emerald' : 'text-white/50'}`}
          >
            ❤️ {upvotes + (upvoted ? 1 : 0)}
          </button>
          <span className="flex items-center gap-1 text-white/50 text-sm">💬 {comments}</span>
          <span className="text-white/50 text-sm">↗</span>
        </div>
      </div>
    </motion.div>
  );
}
