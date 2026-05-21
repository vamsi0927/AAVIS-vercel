import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
const FAQS = [
{
  q: 'How does Aavis analyze food?',
  a: 'Aavis uses on-device OCR to read ingredient labels and cross-references them against our database of additives, then calculates a personalized health score based on your profile.'
},
{
  q: 'Is my data private?',
  a: 'Yes. All your personal health data, scan history, and preferences are stored locally on your device. We never upload them to a server.'
},
{
  q: 'How accurate are the health scores?',
  a: 'Scores are based on widely accepted nutritional guidelines and additive safety data. They are informational and should not replace professional medical advice.'
},
{
  q: 'Can I edit my profile?',
  a: 'Yes. Go to the Profile tab and tap any field to update your diet, allergens, or health conditions at any time.'
},
{
  q: 'How do I delete my account?',
  a: 'Go to Settings → Sign Out, then clear local data from your browser settings. We do not store any of your data on servers.'
},
{
  q: 'Why did a product show as "Hazardous" for me?',
  a: 'Hazardous verdicts can be triggered by harmful additives, allergen matches with your profile, or severe nutritional concerns relative to your health conditions.'
}];

export function Help() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white">
          
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">Help & FAQ</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
              
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-navy-700/50">
                
                <span className="font-medium pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-content-secondary flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                
              </button>
              <AnimatePresence>
                {isOpen &&
                <motion.div
                  initial={{
                    height: 0
                  }}
                  animate={{
                    height: 'auto'
                  }}
                  exit={{
                    height: 0
                  }}
                  transition={{
                    duration: 0.2
                  }}
                  className="overflow-hidden">
                  
                    <p className="px-4 pb-4 text-sm text-content-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                }
              </AnimatePresence>
            </div>);

        })}
      </div>
    </div>);

}