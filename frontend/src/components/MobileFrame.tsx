import React from 'react';

export function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-dvh bg-navy-900 overflow-hidden relative flex flex-col">
      {children}
    </div>
  );
}