import React from 'react';
import { BoxIcon } from 'lucide-react';
interface EmptyStateProps {
  icon: BoxIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}
export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-20 h-20 bg-navy-800 rounded-full flex items-center justify-center mb-6 shadow-lg border border-navy-600">
        <Icon className="w-10 h-10 text-brand-primary opacity-80" />
      </div>
      <h3 className="text-xl font-display font-bold text-content-primary mb-2">
        {title}
      </h3>
      <p className="text-content-secondary mb-8 max-w-[250px]">{description}</p>
      {action}
    </div>);

}