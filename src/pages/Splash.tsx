import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import logoImg from '../assets/logo.png';

export function Splash() {
  const navigate = useNavigate();
  const { hasCompletedOnboarding, isAuthenticated } = useAppContext();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (!hasCompletedOnboarding) {
        navigate('/setup', { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, hasCompletedOnboarding, isAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-navy-900 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-primary/15 rounded-full blur-[100px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-60 h-60 bg-brand-secondary/10 rounded-full blur-[80px]" />

      <motion.div
        initial={{
          scale: 0.85,
          opacity: 0
        }}
        animate={{
          scale: 1,
          opacity: 1
        }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1] // Custom easeOutExpo
        }}
        className="relative z-10 flex flex-col items-center">
        
        <div className="w-28 h-28 flex items-center justify-center relative mb-6">
          <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl animate-pulse" />
          <img src={logoImg} alt="Aavis Logo" className="w-28 h-28 object-contain relative z-10" />
        </div>
        
        <motion.h1
          initial={{
            y: 15,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            delay: 0.4,
            duration: 0.8,
            ease: 'easeOut'
          }}
          className="text-4xl font-display font-black tracking-tight text-white mb-2 bg-gradient-brand bg-clip-text text-transparent">
          Aavis
        </motion.h1>
        <motion.p
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            delay: 0.6,
            duration: 0.5
          }}
          className="text-content-secondary tracking-widest uppercase text-sm font-medium">
          
          Know your food
        </motion.p>
      </motion.div>
    </div>);

}