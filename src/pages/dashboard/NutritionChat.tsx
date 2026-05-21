import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { askGeminiChat } from '../../lib/geminiAnalysis';
import { motion } from 'framer-motion';

type Message = {
  role: 'user' | 'model';
  text: string;
};

export function NutritionChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([{
    role: 'model',
    text: "Hi! I'm Aavis AI. What nutrition questions or food myths can I help you clear up today?"
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      // Map existing messages to Gemini format (excluding the very first greeting if we want to save tokens, but here we pass all)
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

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800 bg-navy-900/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-content-secondary hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
            <Sparkles className="w-4 h-4 text-brand-primary" />
          </div>
          <h1 className="font-display font-bold text-lg">AI Nutritionist</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-brand-primary" />
              </div>
            )}
            
            <div className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-brand-primary text-white rounded-tr-sm' 
                : 'bg-navy-800 text-content-primary rounded-tl-sm border border-navy-700'
            }`}>
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="bg-navy-800 rounded-2xl rounded-tl-sm p-4 border border-navy-700 flex gap-1 items-center">
              <div className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 rounded-full bg-brand-primary/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        )}
        
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-navy-900 border-t border-navy-800 pb-safe">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about ingredients, diets, myths..."
            className="flex-1 bg-navy-800 border border-navy-700 rounded-full px-5 py-3.5 text-sm text-white placeholder:text-content-secondary focus:outline-none focus:border-brand-primary"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-12 h-12 rounded-full bg-brand-primary disabled:opacity-50 flex items-center justify-center text-white transition-transform active:scale-95 flex-shrink-0"
          >
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
