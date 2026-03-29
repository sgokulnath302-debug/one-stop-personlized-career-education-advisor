import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  BookOpen, 
  Target, 
  Brain, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Compass,
  User,
  Building2,
  GraduationCap,
  Briefcase,
  Activity,
  BarChart3
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalysisResultProps {
  analysis: any;
  marks: { name: string; value: string }[];
  onBack: () => void;
}

export default function AnalysisResult({ analysis, marks, onBack }: AnalysisResultProps) {
  if (!analysis) return null;

  const strengths = marks
    .filter(m => parseInt(m.value) >= 80)
    .sort((a, b) => parseInt(b.value) - parseInt(a.value));

  const weaknesses = marks
    .filter(m => parseInt(m.value) < 60)
    .sort((a, b) => parseInt(a.value) - parseInt(b.value));

  const performanceScore = analysis.core_metrics?.percentage || 0;
  const gpa = analysis.core_metrics?.gpa || 0;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <button
          onClick={onBack}
          className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-slate-400 hover:text-white group micro-label"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Go Back to Student Hub
        </button>
        <div className="flex items-center gap-3 px-6 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-brand-primary shadow-[0_0_20px_rgba(0,255,255,0.1)]">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="micro-label font-black">AI Strategic Analysis</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          {analysis.student_name && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300">
              <User className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-bold uppercase tracking-wider">{analysis.student_name}</span>
            </div>
          )}
          {analysis.institution && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300">
              <Building2 className="w-4 h-4 text-brand-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">{analysis.institution}</span>
            </div>
          )}
          {analysis.level && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300">
              <GraduationCap className="w-4 h-4 text-brand-secondary" />
              <span className="text-sm font-bold uppercase tracking-wider">{analysis.level.replace('_', ' ')}</span>
            </div>
          )}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase italic font-display">
          Academic <span className="text-brand-primary">Intelligence</span> Report
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl">
          A comprehensive evaluation of your academic trajectory and strategic growth potential.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card p-8 sm:p-12 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
            <Award className="w-48 h-48 sm:w-64 sm:h-64 text-white" />
          </div>
          
          <div className="relative z-10 space-y-10">
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-brand-primary flex items-center justify-center shadow-[0_12px_30px_rgba(0,255,255,0.2)] border border-white/20">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-black" />
              </div>
              <div>
                <p className="micro-label text-brand-primary mb-2">Strategic Persona</p>
                <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase italic font-display">
                  {analysis.strategic_profile || "Academic Profile"}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-inner">
                <p className="micro-label text-slate-500 mb-2">Performance</p>
                <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter">{performanceScore}%</p>
              </div>
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-inner">
                <p className="micro-label text-slate-500 mb-2">GPA Index</p>
                <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter">{gpa.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 shadow-inner">
                <p className="micro-label text-slate-500 mb-2">Consistency</p>
                <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter">{analysis.core_metrics?.consistency_score || 0}%</p>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <h4 className="micro-label text-brand-primary flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5" />
                Key Performance Insights
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analysis.summary?.map((point: string, i: number) => (
                  <li key={i} className="text-sm sm:text-base text-slate-300 flex items-start gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-brand-primary shrink-0 shadow-[0_0_8px_rgba(0,255,255,0.4)]" />
                    <span className="font-medium leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="16"
                className="text-white/5"
              />
              <motion.circle
                cx="112"
                cy="112"
                r="100"
                fill="none"
                stroke="currentColor"
                strokeWidth="16"
                strokeDasharray={628}
                initial={{ strokeDashoffset: 628 }}
                animate={{ strokeDashoffset: 628 - (628 * performanceScore) / 100 }}
                transition={{ duration: 2, ease: "circOut" }}
                className="text-brand-primary"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl sm:text-7xl font-black text-white font-display tracking-tighter">{performanceScore}</span>
              <span className="micro-label text-slate-500">Strategic Score</span>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="micro-label text-slate-400">Academic Standing</h3>
            <p className={cn(
              "text-3xl sm:text-4xl font-black uppercase italic tracking-tight font-display",
              performanceScore >= 90 ? "text-brand-accent" :
              performanceScore >= 75 ? "text-brand-primary" :
              performanceScore >= 60 ? "text-brand-accent" : "text-brand-accent"
            )}>
              {performanceScore >= 90 ? "Elite (A+)" :
               performanceScore >= 80 ? "Superior (A)" :
               performanceScore >= 70 ? "Advanced (B+)" :
               performanceScore >= 60 ? "Proficient (B)" :
               performanceScore >= 50 ? "Standard (C)" : "Critical (D)"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* AI Detailed Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8 sm:p-12 space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand-accent/10 border border-brand-accent/20">
            <Brain className="w-6 h-6 text-brand-accent" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">AI Deep Intelligence Analysis</h3>
        </div>
        <div className="relative">
          <div className="absolute -left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-accent to-transparent rounded-full opacity-50" />
          <p className="text-slate-300 leading-relaxed text-xl sm:text-2xl font-light italic pl-4">
            "{analysis.analysis_text}"
          </p>
        </div>
      </motion.div>

      {/* Domain Mastery Metrics */}
      {analysis.metrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-8 sm:p-12 space-y-10"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
              <BarChart3 className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Domain Mastery Metrics</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {Object.entries(analysis.metrics).map(([key, value]: [string, any], i) => (
              <div key={key} className="flex flex-col items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-all group">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/5" />
                    <motion.circle
                      cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6"
                      strokeDasharray={220}
                      initial={{ strokeDashoffset: 220 }}
                      animate={{ strokeDashoffset: 220 - (220 * (value || 0)) / 100 }}
                      transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                      className={cn(
                        i % 3 === 0 ? "text-brand-primary" : 
                        i % 3 === 1 ? "text-brand-accent" : "text-brand-secondary"
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-white font-mono">{value}%</span>
                  </div>
                </div>
                <span className="micro-label text-slate-500 uppercase tracking-widest text-center">{key.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-brand-accent/5 border border-brand-accent/20 rounded-[2.5rem] p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-accent/10">
              <TrendingUp className="w-8 h-8 text-brand-accent" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Strategic Strengths</h3>
          </div>
          <div className="space-y-4">
            {strengths.length > 0 ? strengths.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-brand-accent/10 rounded-3xl border border-brand-accent/20 hover:bg-brand-accent/15 transition-all group">
                <span className="text-lg font-bold text-white group-hover:translate-x-1 transition-transform">{s.name}</span>
                <span className="text-2xl font-black text-brand-accent font-mono tracking-tighter">{s.value}%</span>
              </div>
            )) : (
              <p className="text-slate-500 italic text-center py-10">No major strengths identified in current metrics.</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-brand-primary/5 border border-brand-primary/20 rounded-[2.5rem] p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-primary/10">
              <TrendingDown className="w-8 h-8 text-brand-primary" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Critical Gaps</h3>
          </div>
          <div className="space-y-4">
            {weaknesses.length > 0 ? weaknesses.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-brand-primary/10 rounded-3xl border border-brand-primary/20 hover:bg-brand-primary/15 transition-all group">
                <span className="text-lg font-bold text-white group-hover:translate-x-1 transition-transform">{s.name}</span>
                <span className="text-2xl font-black text-brand-primary font-mono tracking-tighter">{s.value}%</span>
              </div>
            )) : (
              <p className="text-slate-500 italic text-center py-10">No critical weaknesses identified. Optimized performance!</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Career Paths & Recommended Institutions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
        {/* Career Paths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-primary/10">
              <Target className="w-8 h-8 text-brand-primary" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Strategic Career Trajectories</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.suggestions?.map((career: string, i: number) => (
              <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-brand-primary/50 hover:bg-white/[0.08] transition-all group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-black transition-all shadow-lg">
                    <Compass className="w-5 h-5" />
                  </div>
                  <span className="text-base font-black text-white uppercase tracking-tight">{career}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recommended Institutions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-accent/10">
              <Building2 className="w-8 h-8 text-brand-accent" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Target Institutions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.institutions?.map((inst: string, i: number) => (
              <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-brand-accent/50 hover:bg-white/[0.08] transition-all group cursor-default">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-black transition-all shadow-lg">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className="text-base font-black text-white uppercase tracking-tight">{inst}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Strategic Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* Recommended Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-secondary/10">
              <BookOpen className="w-8 h-8 text-brand-secondary" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Knowledge Assets</h3>
          </div>
          <div className="space-y-4">
            {analysis.recommendations?.courses?.map((course: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-brand-secondary/50 transition-all group">
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{course}</span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-secondary group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Internships */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-primary/10">
              <Briefcase className="w-8 h-8 text-brand-primary" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Vocational Focus</h3>
          </div>
          <div className="space-y-4">
            {analysis.recommendations?.internships?.map((intern: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-brand-primary/50 transition-all group">
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{intern}</span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Extracurriculars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-8 sm:p-10 space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-accent/10">
              <Activity className="w-8 h-8 text-brand-accent" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">Growth Catalysts</h3>
          </div>
          <div className="space-y-4">
            {analysis.recommendations?.extracurriculars?.map((activity: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-brand-accent/50 transition-all group">
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{activity}</span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer Action */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center pt-12"
      >
        <button
          onClick={onBack}
          className="px-12 py-6 bg-brand-primary rounded-3xl font-black text-black shadow-[0_20px_50px_rgba(0,255,255,0.2)] hover:shadow-[0_30px_70px_rgba(0,255,255,0.4)] hover:-translate-y-2 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-sm italic"
        >
          <ChevronLeft className="w-6 h-6" />
          Return to Hub
        </button>
      </motion.div>
    </div>
  );
}
