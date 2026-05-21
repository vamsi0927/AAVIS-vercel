import React from 'react';
import { Info, AlertTriangle, Lightbulb, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function PersonalizedInsights() {
  const { profile } = useAppContext();
  const { diet, allergens, conditions } = profile;

  // Generate dynamic insights based on profile
  const insights = [];

  if (conditions.includes('Diabetes') || conditions.includes('Diabetic')) {
    insights.push({
      id: 'diabetes',
      icon: <AlertTriangle className="w-5 h-5 text-brand-hazardous" />,
      title: 'Diabetic Precaution',
      desc: 'Keep an eye on "hidden sugars" like Maltodextrin and High Fructose Corn Syrup in packaged snacks.',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
    });
  }

  if (allergens.length > 0) {
    insights.push({
      id: 'allergens',
      icon: <ShieldCheck className="w-5 h-5 text-brand-primary" />,
      title: 'Active Allergen Filters',
      desc: `We are scanning all ingredients for ${allergens.join(', ')}.`,
      bgColor: 'bg-brand-primary/10',
      borderColor: 'border-brand-primary/20',
    });
  }

  if (diet === 'Vegan') {
    insights.push({
      id: 'vegan',
      icon: <Lightbulb className="w-5 h-5 text-brand-safe" />,
      title: 'Vegan Tip',
      desc: 'Watch out for E120 (Carmine), which is derived from insects and is not vegan.',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    });
  } else if (diet === 'Vegetarian') {
    insights.push({
      id: 'veg',
      icon: <Info className="w-5 h-5 text-blue-400" />,
      title: 'Vegetarian Check',
      desc: 'We automatically flag hidden animal-derived additives like gelatin or certain emulsifiers.',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'general',
      icon: <Lightbulb className="w-5 h-5 text-brand-primary" />,
      title: 'Smart Scanning',
      desc: 'Update your health conditions or allergies in settings to get personalized warnings and tips.',
      bgColor: 'bg-navy-800',
      borderColor: 'border-navy-700',
    });
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-content-secondary uppercase tracking-wider mb-3">
        Personalized Insights
      </h3>
      <div className="flex overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 snap-x gap-4 hide-scrollbar">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`flex-shrink-0 w-[280px] p-4 rounded-2xl border ${insight.bgColor} ${insight.borderColor} snap-start`}
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="mt-0.5">{insight.icon}</div>
              <h4 className="font-semibold text-white">{insight.title}</h4>
            </div>
            <p className="text-sm text-content-secondary leading-relaxed pl-8">
              {insight.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
