import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import aiAssistantImg from '../assets/ai-assistant.jpg';

export function FloatingBot() {
  const navigate = useNavigate();
  const isDragging = useRef(false);

  return (
    <motion.button
      drag
      dragElastic={0.1}
      dragMomentum={false}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onDragStart={() => {
        isDragging.current = true;
      }}
      onDragEnd={() => {
        setTimeout(() => {
          isDragging.current = false;
        }, 150);
      }}
      onClick={(e) => {
        if (isDragging.current) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        navigate('/dashboard/chat');
      }}
      className="fixed bottom-32 right-6 z-[100] w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] touch-none cursor-grab active:cursor-grabbing overflow-hidden border-2 border-brand-primary/50"
    >
      <img src={aiAssistantImg} alt="AI Assistant" className="w-full h-full object-cover pointer-events-none" draggable={false} />
    </motion.button>
  );
}
