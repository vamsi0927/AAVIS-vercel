import React from 'react';
import { HazardLevel } from '../lib/types';
import { CheckCircle, AlertTriangle, XOctagon } from 'lucide-react';
interface VerdictBannerProps {
  verdict: HazardLevel;
}
export function VerdictBanner({ verdict }: VerdictBannerProps) {
  const config = {
    safe: {
      color: 'bg-brand-safe/10 text-brand-safe border-brand-safe/20',
      icon: CheckCircle,
      label: 'Safe to Consume',
      emoji: '✅'
    },
    mild: {
      color: 'bg-yellow-400/10 text-yellow-500 border-yellow-400/20',
      icon: CheckCircle,
      label: 'Mild Concern',
      emoji: '🟡'
    },
    moderate: {
      color: 'bg-brand-caution/10 text-brand-caution border-brand-caution/20',
      icon: AlertTriangle,
      label: 'Moderate Concern',
      emoji: '⚡'
    },
    caution: {
      color: 'bg-brand-caution/10 text-brand-caution border-brand-caution/20',
      icon: AlertTriangle,
      label: 'Consume with Caution',
      emoji: '⚠️'
    },
    harmful: {
      color: 'bg-brand-caution/10 text-brand-caution border-brand-caution/20',
      icon: AlertTriangle,
      label: 'Harmful - Avoid',
      emoji: '⚠️'
    },
    hazardous: {
      color:
      'bg-brand-hazardous/10 text-brand-hazardous border-brand-hazardous/20',
      icon: XOctagon,
      label: 'Hazardous - Avoid',
      emoji: '🚨'
    }
  };
  const { color, icon: Icon, label, emoji } = config[verdict];
  return (
    <div
      className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border ${color}`}>
      
      <Icon className="w-6 h-6" />
      <span className="font-display font-bold text-lg tracking-wide uppercase">
        {label} {emoji}
      </span>
    </div>);

}