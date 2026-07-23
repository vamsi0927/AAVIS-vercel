import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, X, MessageCircle } from 'lucide-react';
import { askGeminiChat } from '../lib/geminiAnalysis';
import { motion, AnimatePresence } from 'framer-motion';
import aiAssistantImg from '../assets/ai-assistant.jpg';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export function GlobalAIChat() {
  const { profile } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'model',
    text: "Hi! I'm Aavis AI. What nutrition questions or food myths can I help you clear up today?"
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
  // Hide on auth screens or specific screens if needed, but for now we'll allow it anywhere
  // unless we're explicitly hiding it based on route
  const location = useLocation();
  const hideFabPaths = ['/login', '/register', '/forgot-password', '/setup-profile', '/verify-otp', '/reset-password'];
  const shouldHide = hideFabPaths.includes(location.pathname);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    // Easter Egg
    if (userMessage === '2345') {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', text: `welcome ${profile.name} chimtu "it should be secret....."` }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const reply = await askGeminiChat(chatHistory, userMessage);
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (shouldHide) return null;

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            data-testid="fab-ai-chat"
            drag
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
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
              setIsOpen(true);
            }}
            className="fixed bottom-32 right-6 z-[100] w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.6)] touch-none cursor-grab active:cursor-grabbing overflow-hidden border-2 border-brand-primary/50"
          >
            <img src={aiAssistantImg} alt="AI" className="w-full h-full object-cover pointer-events-none" draggable={false} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-up Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-50 flex flex-col bg-navy-900 md:bottom-auto md:top-[10%] md:h-[80%] md:inset-x-[10%] md:rounded-3xl md:border md:border-navy-700 md:shadow-2xl overflow-hidden"
          >
            <header className="pt-safe pt-6 px-4 pb-4 flex items-center justify-between border-b border-navy-800 bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center border border-brand-primary/30 overflow-hidden shadow-sm">
                  <img src={aiAssistantImg} alt="AI" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg leading-tight">AI Nutritionist</h1>
                  <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
              <button data-testid='btn-close-ai-chat' onClick={() => setIsOpen(false)} className="p-2 text-content-secondary hover:text-white bg-white/5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden shadow-sm">
                      <img src={aiAssistantImg} alt="AI" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand-primary text-white rounded-tr-sm' 
                      : 'bg-navy-800 text-content-primary rounded-tl-sm border border-navy-700'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    <img src={aiAssistantImg} alt="AI" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-navy-800 rounded-2xl rounded-tl-sm p-4 border border-navy-700 flex gap-1 items-center shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
              
              <div ref={endOfMessagesRef} className="h-4" />
            </div>

            <div className="p-4 bg-navy-900 border-t border-navy-800 pb-safe shadow-lg">
              <div className="flex gap-2 relative">
                <input data-testid='input-ai-chat'
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about ingredients, diets..."
                  className="flex-1 bg-navy-800 border border-navy-700 rounded-full pl-5 pr-12 py-3.5 text-sm text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button data-testid='btn-send-ai-chat' 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 top-1.5 w-10 h-10 rounded-full bg-brand-primary disabled:opacity-50 flex items-center justify-center text-white transition-transform active:scale-95 flex-shrink-0"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
