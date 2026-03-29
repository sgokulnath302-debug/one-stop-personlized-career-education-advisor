import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { 
  Upload, Brain, TrendingUp, Lightbulb, ShieldCheck, 
  ChevronRight, Loader2, RotateCcw, Info, 
  Award, Briefcase, Target, Sparkles, 
  Zap, Rocket, BarChart3, Users, Save, History, CheckCircle2, Check, ChevronDown, Plus, Trash2, Tag, Bookmark, ExternalLink, Search, X
} from 'lucide-react';
import { performCareerGapAnalysis, analyzeResume, getCareerCoaching, getSkillAlignmentFeedback } from '../services/gemini';
import HistoryView from './HistoryView';
import ComparisonView from './ComparisonView';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, db, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp, createNotification } from '../firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExpertHubProps {
  onAnalysisComplete?: (analysis: any) => void;
  initialAnalysis?: any;
}

interface Trajectory {
  title: string;
  description: string;
  level: 'Junior' | 'Senior' | 'Executive';
  metrics: {
    stability: number;
    growth: number;
    innovation: number;
  };
}

interface ExpertAnalysis {
  analysis: string;
  trajectories: Trajectory[];
  metrics: {
    stability: number;
    growth: number;
    innovation: number;
  };
}

interface CoachingResult {
  coaching_summary: string;
  action_items: { title: string; description: string }[];
  market_insights: string;
  recommended_resources: string[];
}

const Tooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block ml-2 align-middle">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-slate-500 hover:text-brand-primary transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-[#0a0a0a] border border-white/[0.05] rounded-xl shadow-2xl text-[10px] text-slate-300 leading-relaxed pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0a0a0a]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ExpertHub({ onAnalysisComplete, initialAnalysis }: ExpertHubProps) {
  const [currentRole, setCurrentRole] = useState('');
  const [experience, setExperience] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [skills, setSkills] = useState('');
  const [highThinking, setHighThinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ExpertAnalysis | null>(initialAnalysis || null);
  const [coaching, setCoaching] = useState<CoachingResult | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'analysis' | 'coaching' | 'skills' | 'network'>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<{ item1: any; item2: any } | null>(null);

  // Skill Alignment State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillFeedback, setSkillFeedback] = useState<any>(null);
  const [skillLoading, setSkillLoading] = useState(false);

  // Network State
  const [network, setNetwork] = useState<any[]>([]);
  const [newConnection, setNewConnection] = useState({ name: '', role: '', category: 'Aspiring', notes: '', link: '' });
  const [isAddingConnection, setIsAddingConnection] = useState(false);

  useEffect(() => {
    if (initialAnalysis) {
      setAnalysis(initialAnalysis);
      setActiveTab('analysis');
    }
  }, [initialAnalysis]);

  useEffect(() => {
    if (auth.currentUser) {
      const q = query(collection(db, 'network'), where('userId', '==', auth.currentUser.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setNetwork(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, []);

  const handleAddSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleGetSkillFeedback = async () => {
    if (selectedSkills.length === 0 || !targetRole) return;
    setSkillLoading(true);
    try {
      const result = await getSkillAlignmentFeedback(selectedSkills, targetRole, currentRole);
      setSkillFeedback(result);
      
      // Trigger notification if user is logged in
      if (auth.currentUser) {
        createNotification(
          auth.currentUser.uid,
          'Skill Analysis Complete',
          `AI has analyzed your alignment for ${targetRole}. Score: ${result.alignment_score}%.`,
          'info'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSkillLoading(false);
    }
  };

  const handleAddConnection = async () => {
    if (!auth.currentUser || !newConnection.name) return;
    try {
      await addDoc(collection(db, 'network'), {
        ...newConnection,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewConnection({ name: '', role: '', category: 'Aspiring', notes: '', link: '' });
      setIsAddingConnection(false);
      
      // Trigger notification if user is logged in
      if (auth.currentUser) {
        createNotification(
          auth.currentUser.uid,
          'Network Updated',
          `Successfully added ${newConnection.name} to your professional network.`,
          'success'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'network', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = () => {
    if (!analysis) return;
    setSaveStatus('saving');
    
    const history = JSON.parse(localStorage.getItem('expert_history') || '[]');
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      formData: {
        currentRole,
        experience,
        targetRole,
        skills
      },
      analysis
    };
    
    localStorage.setItem('expert_history', JSON.stringify([newItem, ...history].slice(0, 10)));
    
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleRestore = (item: any) => {
    setCurrentRole(item.formData.currentRole);
    setExperience(item.formData.experience);
    setTargetRole(item.formData.targetRole);
    setSkills(item.formData.skills);
    setAnalysis(item.analysis);
    setActiveTab('analysis');
    setIsHistoryOpen(false);
  };

  const handleCompare = (item1: any, item2: any) => {
    setComparisonItems({ item1, item2 });
    setIsComparisonOpen(true);
  };

  const handleHistoryToggle = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const result = await analyzeResume(base64, file.type);
        
        if (result.currentRole) setCurrentRole(result.currentRole);
        if (result.experience) setExperience(String(result.experience));
        if (result.skills) setSkills(result.skills);
        
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to process resume");
      } finally {
        setResumeLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!currentRole || !experience || !targetRole || !skills) {
      setError("Please fill in all fields or upload a resume.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await performCareerGapAnalysis({
        currentRole,
        experience,
        targetRole,
        skills
      }, highThinking);
      setAnalysis(result);
      onAnalysisComplete?.(result);
      setActiveTab('analysis');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to analyze profile");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCoaching = async () => {
    if (!currentRole || !experience || !targetRole || !skills) return;

    setCoachingLoading(true);
    setError(null);
    try {
      const result = await getCareerCoaching({
        currentRole,
        experience,
        targetRole,
        skills
      }, highThinking);
      setCoaching(result);
      setActiveTab('coaching');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate coaching");
    } finally {
      setCoachingLoading(false);
    }
  };

  const handleClear = () => {
    setCurrentRole('');
    setExperience('');
    setTargetRole('');
    setSkills('');
    setAnalysis(null);
    setCoaching(null);
    setActiveTab('profile');
    setError(null);
  };

  const radarData = analysis ? [
    { subject: 'Stability', value: analysis.metrics.stability, fullMark: 100 },
    { subject: 'Growth', value: analysis.metrics.growth, fullMark: 100 },
    { subject: 'Innovation', value: analysis.metrics.innovation, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-8">
      {/* History & Comparison Modals */}
      <HistoryView 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        storageKey="expert_history"
        onRestore={handleRestore}
        onCompare={handleCompare}
        title="Professional"
      />

      <ComparisonView 
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        item1={comparisonItems?.item1}
        item2={comparisonItems?.item2}
      />

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-5 space-y-10"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">Professional Profile</h3>
          <p className="text-slate-500 text-sm max-w-sm">Define your professional trajectory to receive a high-fidelity career gap analysis.</p>
        </div>

        <div className="glass-card p-10 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[80px] rounded-full -mr-32 -mt-32" />
          
          <div className="flex items-center justify-between">
            <h4 className="micro-label">Strategic Parameters</h4>
            <div className="flex gap-2">
              <button 
                onClick={handleHistoryToggle}
                className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-slate-400 hover:text-white transition-all"
                title="View History"
              >
                <History className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSave}
                disabled={saveStatus !== 'idle'}
                className={cn(
                  "p-2 border rounded-xl transition-all flex items-center gap-2",
                  saveStatus === 'saved' ? "bg-brand-secondary/20 border-brand-secondary/30 text-brand-secondary" :
                  saveStatus === 'saving' ? "bg-white/[0.03] border border-white/[0.05] text-slate-400" :
                  "bg-white/[0.03] border border-white/[0.05] text-slate-400 hover:text-white"
                )}
                title="Save Analysis"
              >
                {saveStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleClear}
                className="p-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-slate-400 hover:text-brand-accent transition-all"
                title="Reset Form"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Resume Upload */}
            <div className="space-y-3">
              <label className="micro-label">Professional Document Ingestion</label>
              <label className="relative flex flex-col items-center justify-center w-full h-32 bg-white/[0.02] border-2 border-dashed border-white/[0.05] rounded-3xl cursor-pointer hover:bg-white/[0.05] hover:border-brand-primary/30 transition-all group overflow-hidden">
                {resumeLoading ? (
                  <div className="flex flex-col items-center gap-3 w-full px-8 text-center">
                    <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Extracting Intelligence...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-white/[0.03] rounded-2xl group-hover:bg-brand-primary/10 transition-all">
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-brand-primary" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Upload PDF/DOCX to auto-fill profile</span>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleResumeUpload} accept=".pdf,.doc,.docx" disabled={resumeLoading} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="micro-label">Current Designation</label>
                <input 
                  type="text"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  placeholder="e.g. Senior Developer"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-3">
                <label className="micro-label">Experience Tenure</label>
                <input 
                  type="number"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Years"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="micro-label">Target Trajectory</label>
              <input 
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. CTO or Engineering Manager"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-3">
              <label className="micro-label">Core Competencies</label>
              <textarea 
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React, Node.js, System Design, Leadership"
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-all resize-none placeholder:text-slate-600"
              />
            </div>

            <div className="flex items-center justify-between p-5 bg-white/[0.02] rounded-3xl border border-white/[0.05]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center shadow-inner">
                  <Brain className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">High-Thinking Mode</p>
                  <p className="micro-label text-[8px] opacity-60">Deep Strategic Analysis</p>
                </div>
              </div>
              <button 
                onClick={() => setHighThinking(!highThinking)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  highThinking ? "bg-brand-primary shadow-[0_0_15px_rgba(0,255,255,0.2)]" : "bg-slate-800"
                )}
              >
                <motion.div 
                  animate={{ x: highThinking ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
                />
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={loading || resumeLoading}
                className="flex-1 bg-brand-primary hover:bg-brand-secondary text-black font-bold py-4.5 rounded-2xl shadow-xl shadow-brand-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                Analyze Career Gap
              </button>
              <button
                onClick={handleGetCoaching}
                disabled={coachingLoading || !currentRole || !experience || !targetRole || !skills}
                className="flex-1 bg-white/[0.03] hover:bg-white/[0.05] text-white font-bold py-4.5 rounded-2xl border border-white/[0.05] transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {coachingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
                Get Coaching
              </button>
            </div>

            {error && (
              <p className="text-sm text-brand-accent text-center font-medium bg-brand-accent/10 p-3 rounded-xl border border-brand-accent/20">
                {error}
              </p>
            )}
          </div>
        </div>
      </motion.div>

        {/* Results Section */}
        <div className="lg:col-span-7 space-y-10">
          <div className="flex gap-2 p-1.5 bg-white/[0.03] rounded-[1.25rem] border border-white/[0.05] shadow-inner overflow-x-auto custom-scrollbar">
            {['profile', 'analysis', 'coaching', 'skills', 'network'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab as any);
                  if (tab === 'coaching' && !coaching) handleGetCoaching();
                }}
                className={cn(
                  "min-w-[100px] py-3 rounded-xl text-xs font-bold capitalize transition-all tracking-widest",
                  activeTab === tab 
                    ? "bg-white/10 text-white shadow-lg ring-1 ring-white/10" 
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                {!analysis ? (
                  <div className="glass-card p-20 text-center flex flex-col items-center justify-center min-h-[500px]">
                    <div className="w-24 h-24 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner relative">
                      <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full animate-pulse" />
                      <Rocket className="w-10 h-10 text-brand-primary relative z-10" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Strategic Readiness</h3>
                    <p className="text-slate-500 max-w-sm leading-relaxed">Input your professional parameters to unlock high-fidelity career intelligence and strategic roadmaps.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8">
                    <div className="glass-card p-10">
                      <div className="flex items-center justify-between mb-10">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <BarChart3 className="w-6 h-6 text-brand-primary" />
                          Market Readiness
                        </h3>
                        <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-[10px] font-black text-brand-primary uppercase tracking-widest">
                          Live Analysis
                        </div>
                      </div>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#ffffff08" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              name="Metrics"
                              dataKey="value"
                              stroke="var(--color-brand-primary)"
                              fill="var(--color-brand-primary)"
                              fillOpacity={0.2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'analysis' && (
              <motion.div
                key="analysis-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                {analysis ? (
                  <>
                    <div className="glass-card p-10 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          <ShieldCheck className="w-6 h-6 text-brand-accent" />
                          Strategic Gap Analysis
                        </h3>
                        <div className="px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[10px] font-black text-brand-accent uppercase tracking-widest">
                          Optimized Roadmap
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-lg font-medium italic">"{analysis.analysis}"</p>
                    </div>

                    <div className="space-y-6">
                      <h3 className="micro-label text-slate-400">Potential Trajectories</h3>
                      <div className="grid grid-cols-1 gap-6">
                        {analysis.trajectories.map((t: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-8 hover:border-brand-primary/30 transition-all group relative overflow-hidden"
                          >
                             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-brand-primary/10 transition-all" />
                            <div className="flex justify-between items-start mb-6 relative z-10">
                              <div>
                                <h4 className="text-xl font-bold text-white group-hover:text-brand-primary transition-colors mb-2">{t.title}</h4>
                                <span className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded text-[10px] font-black text-brand-primary uppercase tracking-widest">
                                  {t.level}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="micro-label text-slate-500 mb-1">Market Growth</p>
                                <p className="text-xl font-black text-brand-accent">{t.metrics.growth}%</p>
                              </div>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed relative z-10">{t.description}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="glass-card p-20 text-center flex flex-col items-center justify-center min-h-[500px]">
                    <div className="w-24 h-24 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner relative">
                      <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full animate-pulse" />
                      <Target className="w-10 h-10 text-brand-primary relative z-10" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Strategic Trajectories</h3>
                    <p className="text-slate-500 max-w-sm leading-relaxed">Run an analysis to visualize potential career paths and strategic market growth metrics.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'coaching' && (
              <motion.div
                key="coaching-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                {coaching ? (
                  <>
                    <div className="glass-card p-10 space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-secondary/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                      <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-brand-secondary/10 flex items-center justify-center border border-white/10 shadow-inner">
                          <Award className="w-7 h-7 text-brand-secondary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Executive Coaching</h3>
                          <p className="micro-label text-brand-secondary">AI Mentor Active</p>
                        </div>
                      </div>
                      <p className="text-slate-200 text-lg leading-relaxed italic font-medium relative z-10">"{coaching.coaching_summary}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {coaching.action_items.map((item: any, i: number) => (
                        <div key={i} className="glass-card p-8 space-y-4 hover:bg-white/[0.04] transition-all group">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-brand-primary group-hover:scale-125 transition-transform" />
                            <h4 className="micro-label text-brand-primary">{item.title}</h4>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="glass-card p-10 space-y-8">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">Industry Insights</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{coaching.market_insights}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {coaching.recommended_resources.map((res: string, i: number) => (
                          <span key={i} className="px-4 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-default">
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="glass-card p-20 text-center flex flex-col items-center justify-center min-h-[500px]">
                    <div className="w-24 h-24 bg-brand-secondary/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner relative">
                      <div className="absolute inset-0 bg-brand-secondary/20 blur-2xl rounded-full animate-pulse" />
                      <Users className="w-10 h-10 text-brand-secondary relative z-10" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Expert Mentorship</h3>
                    <p className="text-slate-500 max-w-sm leading-relaxed">Engage with our AI-driven executive coaching to refine your professional presence and strategic execution.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div
                key="skills-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="glass-card p-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Zap className="w-6 h-6 text-brand-accent" />
                      Skill Alignment AI
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="micro-label">Select Skills for Analysis</label>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'Node.js', 'Python', 'AWS', 'System Design', 'Leadership', 'Agile', 'Product Strategy', 'TypeScript', 'Docker'].map(skill => (
                        <button
                          key={skill}
                          onClick={() => handleAddSkill(skill)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                            selectedSkills.includes(skill)
                              ? "bg-brand-primary/20 border-brand-primary/50 text-brand-primary"
                              : "bg-white/5 border-white/10 text-slate-500 hover:bg-white/10"
                          )}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                      {selectedSkills.map(skill => (
                        <span key={skill} className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold">
                          {skill}
                          <button onClick={() => handleRemoveSkill(skill)}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleGetSkillFeedback}
                    disabled={skillLoading || selectedSkills.length === 0 || !targetRole}
                    className="w-full bg-brand-primary text-black font-bold py-4 rounded-2xl shadow-xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {skillLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Analyze Skill Alignment
                  </button>
                </div>

                {skillFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="glass-card p-10 flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alignment Score</h4>
                        <p className="text-5xl font-black text-white">{skillFeedback.alignment_score}%</p>
                      </div>
                      <div className="w-20 h-20 rounded-3xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                        <TrendingUp className="w-10 h-10 text-brand-primary" />
                      </div>
                    </div>

                    <div className="glass-card p-10 space-y-6">
                      <h4 className="text-xl font-bold text-white">AI Evaluation</h4>
                      <p className="text-slate-300 leading-relaxed italic">"{skillFeedback.explanation}"</p>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">{skillFeedback.role_mapping}</p>
                      </div>
                    </div>

                    <div className="glass-card p-10 space-y-6">
                      <h4 className="text-xl font-bold text-white">Recommended Complementary Skills</h4>
                      <div className="flex flex-wrap gap-3">
                        {skillFeedback.complementary_skills.map((skill: string, i: number) => (
                          <span key={i} className="px-4 py-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-xs font-bold text-brand-accent">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'network' && (
              <motion.div
                key="network-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Users className="w-6 h-6 text-brand-primary" />
                    My Professional Network
                  </h3>
                  <button
                    onClick={() => setIsAddingConnection(!isAddingConnection)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-secondary transition-all"
                  >
                    {isAddingConnection ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAddingConnection ? 'Cancel' : 'Add Profile'}
                  </button>
                </div>

                <AnimatePresence>
                  {isAddingConnection && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="glass-card p-8 space-y-6 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="micro-label">Name</label>
                          <input
                            type="text"
                            value={newConnection.name}
                            onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3 px-4 text-white text-sm"
                            placeholder="Professional Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="micro-label">Role</label>
                          <input
                            type="text"
                            value={newConnection.role}
                            onChange={(e) => setNewConnection({ ...newConnection, role: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3 px-4 text-white text-sm"
                            placeholder="Current Role"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="micro-label">Category</label>
                          <select
                            value={newConnection.category}
                            onChange={(e) => setNewConnection({ ...newConnection, category: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3 px-4 text-white text-sm appearance-none"
                          >
                            <option value="Aspiring">Aspiring</option>
                            <option value="Mentor">Mentor</option>
                            <option value="Peer">Peer</option>
                            <option value="Industry Leader">Industry Leader</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="micro-label">LinkedIn / Portfolio Link</label>
                          <input
                            type="text"
                            value={newConnection.link}
                            onChange={(e) => setNewConnection({ ...newConnection, link: e.target.value })}
                            className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3 px-4 text-white text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="micro-label">Strategic Notes</label>
                        <textarea
                          value={newConnection.notes}
                          onChange={(e) => setNewConnection({ ...newConnection, notes: e.target.value })}
                          className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl py-3 px-4 text-white text-sm h-24 resize-none"
                          placeholder="Why do you admire this professional?"
                        />
                      </div>
                      <button
                        onClick={handleAddConnection}
                        className="w-full bg-brand-primary text-black font-bold py-3 rounded-xl hover:bg-brand-secondary transition-all"
                      >
                        Save to Network
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {network.length > 0 ? (
                    network.map((person) => (
                      <div key={person.id} className="glass-card p-6 group hover:border-brand-primary/30 transition-all relative">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xl">
                              {person.name[0]}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">{person.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">{person.role}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteConnection(person.id)}
                            className="p-2 text-slate-600 hover:text-brand-accent transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex gap-2 mb-4">
                          <span className="px-2 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded text-[10px] font-black text-brand-primary uppercase tracking-widest">
                            {person.category}
                          </span>
                          {person.link && (
                            <a href={person.link} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-500 hover:text-white transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 italic">
                          "{person.notes}"
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full glass-card p-20 text-center flex flex-col items-center justify-center">
                      <Bookmark className="w-12 h-12 text-slate-700 mb-4" />
                      <p className="text-slate-500 font-medium">Your professional network is empty. Start adding profiles you admire.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
