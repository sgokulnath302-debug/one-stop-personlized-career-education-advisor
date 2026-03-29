import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRightLeft, TrendingUp, Target, Award, Zap, ChevronRight, Brain } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ComparisonViewProps {
  isOpen: boolean;
  onClose: () => void;
  item1: any;
  item2: any;
}

export default function ComparisonView({ isOpen, onClose, item1, item2 }: ComparisonViewProps) {
  if (!item1 || !item2) return null;

  const getMetricsData = (item: any) => [
    { name: 'Stability', value: item.analysis?.metrics?.stability || 0, color: '#3B82F6' },
    { name: 'Growth', value: item.analysis?.metrics?.growth || 0, color: '#F43F5E' },
    { name: 'Innovation', value: item.analysis?.metrics?.innovation || 0, color: '#10B981' }
  ];

  const metrics1 = getMetricsData(item1);
  const metrics2 = getMetricsData(item2);

  const ComparisonCard = ({ item, metrics, title }: { item: any; metrics: any[]; title: string }) => {
    const isExpert = !!item.formData;
    const isStudent = !!item.studentType;

    return (
      <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col">
        <div className="space-y-1">
          <h4 className="text-xl font-bold text-white">
            {isExpert ? item.formData.currentRole : (item.studentType === 'college' ? 'College Student' : item.studentType.replace('school_', '') + ' Standard')}
          </h4>
          <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">
            {isExpert ? `Target: ${item.formData.targetRole}` : `Dept: ${item.department}`}
          </p>
        </div>

        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics} layout="vertical" margin={{ left: 40, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {metrics.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4 flex-1">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              Strategic Summary
            </h5>
            <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
              {isExpert ? item.analysis?.analysis : item.analysis?.analysis_text}
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-3 h-3 text-rose-400" />
              {isExpert ? 'Top Trajectory' : 'Primary Suggestion'}
            </h5>
            <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              <p className="text-sm font-bold text-white">
                {isExpert ? item.analysis?.trajectories?.[0]?.title : item.analysis?.suggestions?.[0]}
              </p>
              {isExpert && <p className="text-xs text-slate-400 mt-1">{item.analysis?.trajectories?.[0]?.description}</p>}
              {!isExpert && <p className="text-xs text-slate-400 mt-1">{item.analysis?.strategic_profile}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <ArrowRightLeft className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Profile Comparison</h3>
                  <p className="text-sm text-slate-400">Side-by-side analysis of professional trajectories</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white hover:rotate-90"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-8 items-stretch">
                <ComparisonCard item={item1} metrics={metrics1} title="Profile A" />
                
                <div className="hidden md:flex flex-col items-center justify-center">
                  <div className="w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 bg-[#0f172a] border border-white/10 rounded-full text-blue-400 font-bold text-xs">
                      VS
                    </div>
                  </div>
                </div>

                <ComparisonCard item={item2} metrics={metrics2} title="Profile B" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5 flex justify-center">
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Brain className="w-3 h-3" />
                Comparative analysis generated by CareerPath AI
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
