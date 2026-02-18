import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { usePWA, useMobileDetection } from '../hooks/usePWA';
import { useServiceWorker } from '../hooks/usePWA';

// POLISHED: PWA Install Prompt Component
export function PWAInstallPrompt() {
  const { showInstallPrompt, installApp, dismissInstallPrompt } = usePWA();

  if (!showInstallPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50"
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <div className="bg-[#0a1411]/95 backdrop-blur-lg border border-[#0fb880]/30 rounded-2xl p-4 shadow-2xl shadow-[#0fb880]/20">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0fb880]/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl text-[#0fb880]">download</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm mb-1">Install CommuteSmart</h3>
              <p className="text-gray-400 text-xs mb-3 leading-relaxed">
                Get instant access to real-time transit updates and eco-tracking. Works offline too!
              </p>
              
              <div className="flex gap-2">
                <motion.button
                  onClick={installApp}
                  className="bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Install
                </motion.button>
                
                <motion.button
                  onClick={dismissInstallPrompt}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Later
                </motion.button>
              </div>
            </div>
            
            <motion.button
              onClick={dismissInstallPrompt}
              className="text-gray-400 hover:text-white transition-colors p-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// POLISHED: iOS Install Instructions
export function IOSInstallInstructions() {
  const { isIOS, isStandalone } = useMobileDetection();
  const [showInstructions, setShowInstructions] = useState(false);

  if (!isIOS || isStandalone || !showInstructions) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowInstructions(false)}
      >
        <motion.div
          className="bg-[#0a1411] border border-[#0fb880]/30 rounded-2xl p-6 max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#0fb880]/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-3xl text-[#0fb880]">apple</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">Install on iOS</h3>
            <p className="text-gray-400 text-sm">
              Add CommuteSmart to your home screen for quick access
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-sm text-blue-500">share</span>
              </div>
              <p className="text-gray-300 text-sm">Tap the Share button in Safari</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-sm text-blue-500">add_to_home_screen</span>
              </div>
              <p className="text-gray-300 text-sm">Scroll down and tap "Add to Home Screen"</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-sm text-blue-500">check</span>
              </div>
              <p className="text-gray-300 text-sm">Tap "Add" to install the app</p>
            </div>
          </div>

          <motion.button
            onClick={() => setShowInstructions(false)}
            className="w-full bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Got it
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// POLISHED: Offline Indicator
export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <motion.div
      className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-sm text-yellow-500 animate-pulse">wifi_off</span>
        </div>
        <div className="flex-1">
          <p className="text-yellow-500 font-medium text-sm">You're offline</p>
          <p className="text-gray-400 text-xs">Some features may be unavailable</p>
        </div>
      </div>
    </motion.div>
  );
}

// POLISHED: Update Available Indicator
export function UpdateAvailable() {
  const { hasUpdate, updateServiceWorker } = useServiceWorker();

  if (!hasUpdate) return null;

  return (
    <motion.div
      className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="bg-[#0fb880]/10 border border-[#0fb880]/30 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0fb880]/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-sm text-[#0fb880] animate-spin">system_update</span>
          </div>
          <div className="flex-1">
            <p className="text-[#0fb880] font-medium text-sm">Update available</p>
            <p className="text-gray-400 text-xs">New features and improvements</p>
          </div>
          <motion.button
            onClick={updateServiceWorker}
            className="bg-[#0fb880] hover:bg-[#0fb880]/90 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Update
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
