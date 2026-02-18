import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// POLISHED: Enhanced PWA hook with install prompts and offline detection
export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // POLISHED: Listen for install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      
      // Show install prompt after a delay
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // POLISHED: Listen for app install
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
      toast.success('CommuteSmart installed successfully! 🎉');
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // POLISHED: Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored! 🌐');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost. Some features may be unavailable. 📵');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // POLISHED: Install PWA
  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      toast.error('Installation not available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('Installing CommuteSmart... 📱');
      } else {
        toast.success('Installation cancelled');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
      toast.error('Failed to install app');
    }
  }, [deferredPrompt]);

  // POLISHED: Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    // Store dismissal to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  // POLISHED: Check if previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const timeSinceDismissal = Date.now() - parseInt(dismissed);
      // Don't show prompt for 7 days after dismissal
      if (timeSinceDismissal < 7 * 24 * 60 * 60 * 1000) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    showInstallPrompt,
    installApp,
    dismissInstallPrompt,
  };
}

// POLISHED: Hook for service worker management
export function useServiceWorker() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setSwRegistration(registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setHasUpdate(true);
                toast.success('New version available! 🔄');
              }
            });
          }
        });
      });
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [swRegistration]);

  return {
    hasUpdate,
    updateServiceWorker,
  };
}

// POLISHED: Hook for mobile app detection
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const android = /android/.test(userAgent);
    const mobile = /mobile|android|iphone|ipad|ipod/.test(userAgent);
    
    // Check if running in standalone mode (PWA)
    const standalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
    const isInWebAppiOS = (userAgent.includes('safari') && !standalone) || (standalone && !userAgent.includes('safari'));
    const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;

    setIsMobile(mobile);
    setIsIOS(ios);
    setIsAndroid(android);
    setIsStandalone(standalone || isInWebAppiOS || isInWebAppChrome);
  }, []);

  return {
    isMobile,
    isIOS,
    isAndroid,
    isStandalone,
  };
}

// POLISHED: Hook for safe area handling (notches, etc.)
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    
    return () => {
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return safeArea;
}
