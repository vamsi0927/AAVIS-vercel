import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const data = [
  { name: 'Mon', calories: 2000, sugar: 40, fat: 60 },
  { name: 'Tue', calories: 2200, sugar: 55, fat: 65 },
  { name: 'Wed', calories: 1800, sugar: 30, fat: 50 },
  { name: 'Thu', calories: 2400, sugar: 60, fat: 70 },
  { name: 'Fri', calories: 2100, sugar: 45, fat: 55 },
  { name: 'Sat', calories: 2600, sugar: 75, fat: 80 },
  { name: 'Sun', calories: 2300, sugar: 50, fat: 65 },
];

export function NutritionIntake() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-navy-900 pb-24">
      <header className="pt-safe pt-8 px-6 pb-4 flex items-center gap-4 border-b border-navy-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-navy-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-bold">Nutrition Intake</h1>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-8">
        <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">Sugar Intake (g)</h2>
            <PieChart className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#2a2f45' }}
                  contentStyle={{ backgroundColor: '#1f2335', borderColor: '#2a2f45', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Bar dataKey="sugar" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-navy-800 rounded-2xl p-6 border border-navy-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">Calorie Intake (kcal)</h2>
            <PieChart className="w-5 h-5 text-brand-safe" />
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#2a2f45' }}
                  contentStyle={{ backgroundColor: '#1f2335', borderColor: '#2a2f45', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="calories" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
