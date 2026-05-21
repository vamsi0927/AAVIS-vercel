import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Medal, Star, Flame, Target, Award, ShieldCheck, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export function Achievements() {
  const navigate = useNavigate();

  const achievements = [
    { id: 1, title: "First Scan", desc: "Scanned your very first product.", icon: Camera, color: "text-blue-400", bg: "bg-blue-400/20", border: "border-blue-400/30", unlocked: true, date: "Oct 12, 2023" },
    { id: 2, title: "Healthy Choice", desc: "Scanned a product with an 'A' grade.", icon: ShieldCheck, color: "text-brand-safe", bg: "bg-brand-safe/20", border: "border-brand-safe/30", unlocked: true, date: "Oct 15, 2023" },
    { id: 3, title: "Streak Master", desc: "Maintained a 7-day scanning streak.", icon: Flame, color: "text-orange-400", bg: "bg-orange-400/20", border: "border-orange-400/30", unlocked: true, date: "Nov 02, 2023" },
    { id: 4, title: "Label Expert", desc: "Read 50 additive descriptions.", icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30", unlocked: false, progress: 34, total: 50 },
    { id: 5, title: "Health Guru", desc: "Achieve an 'A' grade average for a month.", icon: Award, color: "text-purple-400", bg: "bg-purple-400/20", border: "border-purple-400/30", unlocked: false, progress: 1, total: 1 },
    { id: 6, title: "Centurion", desc: "Scan 100 products.", icon: Target, color: "text-brand-primary", bg: "bg-brand-primary/20", border: "border-brand-primary/30", unlocked: false, progress: 68, total: 100 },
  ];

  return (
    <div className="flex flex-col h-full bg-navy-900">
      <header className="pt-safe pt-6 px-4 pb-4 flex items-center border-b border-navy-800 bg-navy-900/90 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-content-secondary hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-lg ml-2">Badges & Achievements</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        
        {/* Header Stats */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 bg-gradient-to-br from-navy-800 to-navy-700 border border-navy-600 rounded-3xl p-5 flex flex-col items-center justify-center text-center">
            <Medal className="w-8 h-8 text-yellow-400 mb-2" />
            <div className="text-3xl font-display font-bold text-white mb-1">3<span className="text-lg text-content-secondary font-sans">/6</span></div>
            <div className="text-xs text-content-secondary uppercase tracking-widest font-medium">Unlocked</div>
          </div>
          
          <div className="flex-1 bg-gradient-to-br from-navy-800 to-navy-700 border border-navy-600 rounded-3xl p-5 flex flex-col items-center justify-center text-center">
            <Flame className="w-8 h-8 text-orange-400 mb-2" />
            <div className="text-3xl font-display font-bold text-white mb-1">12</div>
            <div className="text-xs text-content-secondary uppercase tracking-widest font-medium">Day Streak</div>
          </div>
        </div>

        <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-4 pl-1">Your Journey</h3>

        <div className="space-y-4 pb-8">
          {achievements.map((item) => (
            <motion.div
              whileHover={{ scale: 1.02 }}
              key={item.id}
              className={`rounded-2xl p-5 border relative overflow-hidden flex gap-4 ${
                item.unlocked ? 'bg-navy-800 border-navy-600' : 'bg-navy-800/40 border-navy-700/50 grayscale-[0.5] opacity-70'
              }`}
            >
              {item.unlocked && (
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-10 -mt-10 ${item.bg}`}></div>
              )}

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border ${item.bg} ${item.border} ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1 min-w-0 py-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-white text-base truncate">{item.title}</h4>
                  {item.unlocked && <span className="text-[10px] text-content-secondary bg-navy-900 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">{item.date}</span>}
                </div>
                <p className="text-xs text-content-secondary mb-3">{item.desc}</p>
                
                {!item.unlocked && item.progress !== undefined && item.total && (
                  <div>
                    <div className="flex justify-between text-[10px] text-content-secondary mb-1.5 font-medium uppercase tracking-wider">
                      <span>Progress</span>
                      <span>{item.progress} / {item.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-navy-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.bg.replace('/20', '')}`} 
                        style={{ width: `${(item.progress / item.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
