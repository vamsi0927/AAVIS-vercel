import React from 'react';
export function MobileFrame({ children }: {children: ReactNode;}) {
  return (
    <div className="min-h-screen bg-navy-900 md:bg-[#05060a] flex justify-center items-center md:p-4">
      <div className="w-full h-full min-h-screen md:min-h-[850px] md:h-[850px] md:max-w-[430px] bg-navy-900 md:rounded-[2.5rem] md:shadow-2xl md:ring-1 md:ring-white/10 overflow-hidden relative flex flex-col">
        {children}
      </div>
    </div>);

}