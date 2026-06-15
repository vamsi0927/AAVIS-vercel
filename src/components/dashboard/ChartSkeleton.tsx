import React from 'react';

export function ChartSkeleton() {
  const bars = [4, 7, 3, 8, 6, 2, 5]; // relative heights for visual variety

  return (
    <div className="animate-pulse w-full h-48 flex flex-col justify-end gap-0">
      {/* Y-axis shimmer */}
      <div className="flex items-end gap-2 h-full">
        <div className="flex flex-col justify-between h-full pb-6 pr-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-6 h-2 bg-white/10 rounded" />
          ))}
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end justify-around gap-2 h-full pb-6">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full bg-white/10"
              style={{ height: `${h * 10}%` }}
            />
          ))}
        </div>
      </div>
      {/* X-axis shimmer */}
      <div className="flex justify-around gap-2 mt-2">
        {bars.map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 h-2 bg-white/10 rounded" />
            <div className="w-6 h-1.5 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
