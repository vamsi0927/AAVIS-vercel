import React, { useEffect, useState } from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { HazardLevel } from '../lib/types';
interface ScoreRingProps {
  score: number;
  verdict: HazardLevel;
  size?: number;
}
export function ScoreRing({ score, verdict, size = 160 }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);
  const getColor = (v: HazardLevel) => {
    switch (v) {
      case 'safe':
        return '#10b981';
      case 'mild':
        return '#eab308';
      case 'moderate':
        return '#f59e0b';
      case 'caution':
      case 'harmful':
        return '#fb7185';
      case 'hazardous':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };
  const color = getColor(verdict);
  const data = [
  {
    name: 'Score',
    value: animatedScore,
    fill: color
  }];

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size
      }}>
      
      <RadialBarChart
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        innerRadius="75%"
        outerRadius="100%"
        barSize={size * 0.08}
        data={data}
        startAngle={90}
        endAngle={-270}>
        
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          angleAxisId={0}
          tick={false} />
        
        <RadialBar
          background={{
            fill: '#1f2335'
          }}
          dataKey="value"
          cornerRadius={size * 0.04}
          animationDuration={1500}
          animationEasing="ease-out" />
        
      </RadialBarChart>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="text-4xl font-display font-bold text-content-primary"
          style={{
            color
          }}>
          
          {Math.round(animatedScore)}
        </span>
        <span className="text-xs text-content-secondary uppercase tracking-wider mt-1">
          Score
        </span>
      </div>
    </div>);

}