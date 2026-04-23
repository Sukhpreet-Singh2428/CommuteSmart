import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Shows a subtle top bar when the user goes offline.
 * Auto-hides when connectivity is restored and triggers a page-level data refresh.
 */
export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger a soft refresh of any visible data by dispatching a custom event
      window.dispatchEvent(new CustomEvent('commuteSmartOnline'));
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 bg-yellow-500/90 backdrop-blur-sm text-black text-xs font-bold uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-sm">wifi_off</span>
          You are offline — live updates paused
        </motion.div>
      )}
    </AnimatePresence>
  );
}
