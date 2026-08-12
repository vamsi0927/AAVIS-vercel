import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
export function RatingPrompt() {
  const { scanCount, hasRated, setHasRated } = useAppContext();
  const [isVisible, setIsVisible] = useState(scanCount >= 5 && !hasRated);
  const [rating, setRating] = useState(0);
  if (!isVisible) return null;
  const handleDismiss = () => {
    setIsVisible(false);
    setHasRated();
  };
  const handleRate = (val: number) => {
    setRating(val);
    setTimeout(() => {
      setIsVisible(false);
      setHasRated();
      // In a real app, this would redirect to app store
    }, 800);
  };
  return (
    <AnimatePresence>
      {isVisible &&
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
          initial={{
            scale: 0.9,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          exit={{
            scale: 0.9,
            opacity: 0
          }}
          className="bg-navy-800 rounded-3xl p-6 w-full max-w-sm border border-navy-600 shadow-2xl relative">
          
            <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-content-secondary hover:text-content-primary p-1">
            
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6 mt-2">
              <h3 className="text-2xl font-display font-bold mb-2">
                Enjoying Aavis?
              </h3>
              <p className="text-content-secondary text-sm">
                You've scanned {scanCount} products! Take a moment to rate us.
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) =>
            <button
              key={star}
              onClick={() => handleRate(star)}
              className="p-2 transition-transform hover:scale-110 active:scale-95">
              
                  <Star
                className={`w-8 h-8 ${rating >= star ? 'fill-brand-caution text-brand-caution' : 'text-navy-600'}`} />
              
                </button>
            )}
            </div>

            {rating > 0 &&
          <motion.p
            initial={{
              opacity: 0,
              y: 10
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            className="text-center text-brand-safe font-medium text-sm">
            
                Thank you for your feedback!
              </motion.p>
          }
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}