import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OfflineBanner — Shows a sticky banner when the user goes offline.
 * Automatically hides when back online.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
        >
          <WifiOff className="w-4 h-4" />
          You're offline. Some features may not work.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
