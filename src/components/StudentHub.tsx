import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { Upload, Brain, TrendingUp, Lightbulb, ShieldCheck, ChevronRight, ChevronDown, Loader2, Plus, Trash2, Save, CheckCircle2, RotateCcw, Info, History, Award, User, GraduationCap, MapPin, BrainCircuit, AlertCircle, Activity, Compass, Target, Sparkles, Zap, GripVertical, LayoutDashboard, X, FileText, Building2 } from 'lucide-react';
import { analyzeStudentProfile, performOCR, getStudentGuidance, getSubjectSuggestions, getSubjectInfo, calculateCareerMatch, getTrendingCareers, CareerMatchResult } from '../services/gemini';
import { PersonalityQuiz, QuizResult } from './PersonalityQuiz';
import HistoryView from './HistoryView';
import ComparisonView from './ComparisonView';
import { auth, createNotification } from '../firebase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SubjectMark {
  id: string;
  name: string;
  value: string;
}

const SUBJECT_MAPPING: Record<string, string> = {
  'math': 'Mathematics',
  'maths': 'Mathematics',
  'mathematics': 'Mathematics',
  'business maths': 'Business Mathematics',
  'business mathematics': 'Business Mathematics',
  'phy': 'Physics',
  'physics': 'Physics',
  'chem': 'Chemistry',
  'chemistry': 'Chemistry',
  'bio': 'Biology',
  'biology': 'Biology',
  'cs': 'Computer Science',
  'comp sci': 'Computer Science',
  'computer science': 'Computer Science',
  'prog': 'Programming',
  'programming': 'Programming',
  'ds': 'Data Structures',
  'data structures': 'Data Structures',
  'algo': 'Algorithms',
  'algorithms': 'Algorithms',
  'db': 'Database',
  'database': 'Database',
  'web': 'Web Tech',
  'web tech': 'Web Tech',
  'net': 'Networking',
  'networking': 'Networking',
  'acc': 'Accountancy',
  'accountancy': 'Accountancy',
  'eco': 'Economics',
  'economics': 'Economics',
  'comm': 'Commerce',
  'commerce': 'Commerce',
  'eng': 'English',
  'english': 'English',
  'social': 'Social Science',
  'social science': 'Social Science',
  'lang 1': 'Language 1',
  'lang 2': 'Language 2',
};

const normalizeSubjectName = (name: string) => {
  const lower = name.toLowerCase().trim();
  return SUBJECT_MAPPING[lower] || name;
};

const DEPARTMENT_SUBJECTS: Record<string, string[]> = {
  // 10th Standard
  'General Curriculum': ['Mathematics', 'Science', 'Social Science', 'Language 1', 'Language 2'],

  // School Departments (11th & 12th)
  'Computer Science': ['Mathematics', 'Physics', 'Chemistry', 'Computer Science'],
  'Maths Biology': ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
  'Commerce': ['Accountancy', 'Economics', 'Commerce', 'Business Mathematics'],
  'History': ['History', 'Geography', 'Economics', 'Political Science'],
  'Computer Application': ['Computer Application', 'Mathematics', 'Physics', 'Chemistry'],
  'Psychology': ['Psychology', 'Sociology', 'Biology', 'English'],
  'Pure Science': ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  'Vocational': ['Vocational Subject', 'Mathematics', 'Physics', 'Chemistry'],
  
  // College Departments
  'Computer Science (B.Sc/B.E)': ['Programming', 'Data Structures', 'Algorithms', 'Mathematics'],
  'Computer Applications (BCA)': ['Database', 'Web Tech', 'Networking', 'Java'],
  'Commerce (B.Com)': ['Financial Accounting', 'Cost Accounting', 'Corporate Law', 'Economics'],
  'Psychology (College)': ['General Psychology', 'Statistics', 'Social Psychology', 'Biology'],
  'B.Sc Maths': ['Calculus', 'Real Analysis', 'Abstract Algebra', 'Differential Equations'],
  'Business Administration (BBA)': ['Management', 'Marketing', 'Finance', 'HR'],
  'Economics': ['Microeconomics', 'Macroeconomics', 'Econometrics', 'Statistics'],
  'Literature': ['English Literature', 'Literary Criticism', 'History of English', 'Drama']
};

interface StudentHubProps {
  onAnalysisComplete?: (analysis: any, marks: SubjectMark[]) => void;
  initialAnalysis?: any;
}

interface AnalysisResult {
  student_name?: string;
  institution?: string;
  analysis_text: string;
  core_metrics: {
    percentage: number;
    gpa: number;
    consistency_score: number;
  };
  strategic_profile: string;
  summary: string[];
  suggestions: string[];
  institutions: string[];
  recommendations: {
    courses: string[];
    internships: string[];
    extracurriculars: string[];
  };
  metrics: {
    stability: number;
    growth: number;
    innovation: number;
    analytical: number;
    creative: number;
    technical: number;
  };
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

const SubjectInfoTooltip = ({ subject, department }: { subject: string; department: string }) => {
  const [show, setShow] = useState(false);
  const [info, setInfo] = useState<{ description: string; career_relevance: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleMouseEnter = async () => {
    setShow(true);
    if (!info && subject && department) {
      setLoading(true);
      try {
        const data = await getSubjectInfo(subject, department);
        setInfo(data);
      } catch (err) {
        console.error("Failed to fetch subject info:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative inline-block ml-2 align-middle">
      <button
        onMouseEnter={handleMouseEnter}
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
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[#0a0a0a] border border-white/[0.05] rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-none"
          >
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
              </div>
            ) : info ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Description</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{info.description}</p>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-1">Career Relevance</h4>
                  <p className="text-xs text-slate-300 leading-relaxed italic">{info.career_relevance}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Hover to discover subject insights...</p>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0a0a0a]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CareerMindMap = ({ profile, suggestions }: { profile: string, suggestions: string[] }) => {
  return (
    <div className="relative w-full h-[450px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5" />
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-brand-secondary/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative h-full flex items-center justify-center">
        {/* Central Node */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="z-20 bg-gradient-to-br from-brand-primary to-brand-secondary p-8 rounded-[2rem] shadow-[0_0_50px_rgba(0,255,255,0.2)] border border-white/30 text-center min-w-[200px]"
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/30">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h4 className="text-xl font-bold text-black leading-tight mb-1">{profile}</h4>
          <p className="text-[10px] text-black/70 uppercase font-black tracking-[0.2em]">Core Persona</p>
        </motion.div>

        {/* Career Nodes */}
        {suggestions.map((career, idx) => {
          const angle = (idx / suggestions.length) * 2 * Math.PI - Math.PI / 2;
          const radius = 160;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <React.Fragment key={career}>
              {/* Connection Line with Animation */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <motion.line
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${x}px)`}
                  y2={`calc(50% + ${y}px)`}
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.4 }}
                  transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--color-brand-primary)" />
                    <stop offset="100%" stopColor="var(--color-brand-secondary)" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Career Node */}
              <motion.div
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{ x, y, opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, y: y - 5 }}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.8 + idx * 0.1,
                  type: 'spring',
                  stiffness: 100
                }}
                className="absolute z-20 bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl hover:bg-white/20 hover:border-brand-primary/50 transition-all cursor-default group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-xl flex items-center justify-center text-brand-primary group-hover:text-brand-accent transition-colors border border-white/10">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block whitespace-nowrap">{career}</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Potential Path</span>
                  </div>
                </div>
                
                {/* Decorative Sparkle */}
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-3 h-3 text-brand-accent animate-pulse" />
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Legend/Info */}
      <div className="absolute bottom-6 left-8 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <Compass className="w-3 h-3" />
        Career Trajectory Mind Map
      </div>
    </div>
  );
};

export default function StudentHub({ onAnalysisComplete, initialAnalysis }: StudentHubProps) {
  const [studentType, setStudentType] = useState<'school_10th' | 'school_12th' | 'college' | ''>('');
  const [studentName, setStudentName] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis || null);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [highThinking, setHighThinking] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saveDraftStatus, setSaveDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'discovery' | 'analysis' | 'guidance'>('dashboard');
  const [guidance, setGuidance] = useState<any>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar');
  const [suggestedSubjects, setSuggestedSubjects] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [trendingCareers, setTrendingCareers] = useState<any[]>([]);
  const [selectedCareerForMatch, setSelectedCareerForMatch] = useState<string | null>(null);
  const [careerMatchResult, setCareerMatchResult] = useState<CareerMatchResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const trending = await getTrendingCareers();
        setTrendingCareers(trending);
      } catch (error) {
        console.error("Failed to fetch trending careers:", error);
      }
    };
    fetchTrending();

    // Load draft on mount
    const savedDraft = localStorage.getItem('student_hub_draft');
    if (savedDraft) {
      try {
        const { type, dept, marks } = JSON.parse(savedDraft);
        if (type) setStudentType(type);
        if (dept) setDepartment(dept);
        if (marks) setSubjectMarks(marks);
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, []);

  const handleSaveDraft = () => {
    setSaveDraftStatus('saving');
    const draft = {
      type: studentType,
      dept: department,
      marks: subjectMarks,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('student_hub_draft', JSON.stringify(draft));
    
    // Trigger notification if user is logged in
    if (auth.currentUser) {
      createNotification(
        auth.currentUser.uid,
        'Draft Saved',
        'Your subject marks and student type have been saved locally.',
        'info'
      );
    }

    setTimeout(() => {
      setSaveDraftStatus('saved');
      setTimeout(() => setSaveDraftStatus('idle'), 2000);
    }, 800);
  };

  const departmentsMap = {
    school_10th: ['General Curriculum'],
    school_12th: ['Computer Science', 'Maths Biology', 'Commerce', 'History', 'Computer Application', 'Psychology', 'Pure Science', 'Vocational'],
    college: ['Computer Science (B.Sc/B.E)', 'Computer Applications (BCA)', 'Commerce (B.Com)', 'Psychology (College)', 'B.Sc Maths', 'Business Administration (BBA)', 'Economics', 'Literature']
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (department && studentType) {
        setSuggestionsLoading(true);
        try {
          const result = await getSubjectSuggestions(studentType, department);
          const suggestions = result.subjects || [];
          setSuggestedSubjects(suggestions);
          
          // Pre-populate with first 5 if current marks are empty
          if (subjectMarks.length === 0) {
            const initial = suggestions.slice(0, 5).map(name => ({
              id: Math.random().toString(36).substr(2, 9),
              name,
              value: ''
            }));
            setSubjectMarks(initial);
          }
        } catch (err) {
          console.error("Failed to fetch suggestions:", err);
          // Fallback to static list if AI fails
          if (DEPARTMENT_SUBJECTS[department]) {
            const defaults = DEPARTMENT_SUBJECTS[department].map(name => ({ 
              id: Math.random().toString(36).substr(2, 9),
              name, 
              value: '' 
            }));
            setSubjectMarks(defaults);
          }
        } finally {
          setSuggestionsLoading(false);
        }
      } else {
        setSubjectMarks([]);
        setSuggestedSubjects([]);
      }
    };

    fetchSuggestions();
  }, [department, studentType]);

  // Debounced Live Sync for Analysis - REMOVED to save API quota
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAllFilled && department) {
        handleExecute(false);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [subjectMarks, department]);
  */

  const handleMarkChange = (index: number, value: string) => {
    const newMarks = [...subjectMarks];
    newMarks[index].value = value;
    setSubjectMarks(newMarks);
  };

  const handleSubjectNameChange = (index: number, name: string) => {
    const newMarks = [...subjectMarks];
    newMarks[index].name = name;
    setSubjectMarks(newMarks);
  };

  const addSubject = (name: string = '') => {
    setSubjectMarks([...subjectMarks, { 
      id: Math.random().toString(36).substr(2, 9),
      name, 
      value: '' 
    }]);
  };

  const removeSubject = (index: number) => {
    setSubjectMarks(subjectMarks.filter((_, i) => i !== index));
  };

  const handleStudentTypeChange = (type: 'school_10th' | 'school_12th' | 'college' | '') => {
    setStudentType(type);
    if (type === 'school_10th') {
      setDepartment('General Curriculum');
    } else {
      setDepartment('');
    }
  };

  const handleExecute = async (isManual: boolean = false) => {
    setLoading(true);
    setSaveStatus('idle');
    setError(null);
    try {
      const numericMarks = Object.fromEntries(
        subjectMarks
          .filter(sm => sm.name.trim() !== '')
          .map(sm => [sm.name, parseInt(sm.value) || 0])
      );
      const result = await analyzeStudentProfile(numericMarks, highThinking, quizResult, studentName, institution);
      setAnalysis(result);
      setActiveTab('analysis');
      
      // Trigger notification if user is logged in
      if (auth.currentUser) {
        createNotification(
          auth.currentUser.uid,
          'Analysis Complete',
          `AI has generated a new academic profile: "The ${result.strategic_profile}".`,
          'success'
        );
      }

      if (isManual) {
        onAnalysisComplete?.(result, subjectMarks);
      }
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to analyze profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCareerMatch = async (career: string) => {
    setSelectedCareerForMatch(career);
    setIsMatching(true);
    try {
      const numericMarks = Object.fromEntries(
        subjectMarks
          .filter(sm => sm.name.trim() !== '')
          .map(sm => [sm.name, parseInt(sm.value) || 0])
      );
      const profile = {
        marks: numericMarks,
        analysis,
        personality: quizResult
      };
      const result = await calculateCareerMatch(profile, career);
      setCareerMatchResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMatching(false);
    }
  };

  const handleGetGuidance = async () => {
    if (subjectMarks.length === 0) return;
    setGuidanceLoading(true);
    setError(null);
    try {
      const numericMarks = Object.fromEntries(
        subjectMarks
          .filter(sm => sm.name.trim() !== '')
          .map(sm => [sm.name, parseInt(sm.value) || 0])
      );
      const result = await getStudentGuidance(numericMarks, highThinking);
      setGuidance(result);
      setActiveTab('guidance');
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Failed to generate guidance");
    } finally {
      setGuidanceLoading(false);
    }
  };

  const handleSave = () => {
    if (!analysis) return;
    setSaveStatus('saving');
    try {
      const savedAnalyses = JSON.parse(localStorage.getItem('careerpath_student_analyses') || '[]');
      const newAnalysis = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        studentType,
        department,
        marks: subjectMarks,
        analysis
      };
      const updated = [newAnalysis, ...savedAnalyses].slice(0, 10);
      localStorage.setItem('careerpath_student_analyses', JSON.stringify(updated));
      setTimeout(() => setSaveStatus('saved'), 600);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save analysis:', error);
      setSaveStatus('idle');
    }
  };

  const handleClear = () => {
    setStudentType('');
    setDepartment('');
    setSubjectMarks([]);
    setAnalysis(null);
    setSaveStatus('idle');
  };

  const handleRestore = (item: any) => {
    setStudentType(item.studentType);
    setDepartment(item.department);
    // Ensure each mark has a unique ID for Reorder
    const marksWithIds = item.marks.map((m: any) => ({
      ...m,
      id: m.id || Math.random().toString(36).substr(2, 9)
    }));
    setSubjectMarks(marksWithIds);
    setAnalysis(item.analysis);
    setIsHistoryOpen(false);
  };

  const handleCompare = (item1: any, item2: any) => {
    setComparisonItems([item1, item2]);
    setIsComparisonOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setOcrError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const ocrResult = await performOCR(base64, file.type);
        
        if (!ocrResult || Object.keys(ocrResult).length === 0) {
          throw new Error("Could not extract data from the marksheet. Please try a clearer image.");
        }
        
        setOcrResult(ocrResult);
        
        let finalLevel = studentType;
        let finalDept = department;

        if (ocrResult.level) {
          setStudentType(ocrResult.level);
          finalLevel = ocrResult.level;
        }
        if (ocrResult.student_name) {
          setStudentName(ocrResult.student_name);
        }
        if (ocrResult.institution) {
          setInstitution(ocrResult.institution);
        }
        if (ocrResult.department) {
          setDepartment(ocrResult.department);
          finalDept = ocrResult.department;
        }

        // Calculate marks based on either existing or new department defaults
        let baseMarks: SubjectMark[] = [];
        if (ocrResult.department && DEPARTMENT_SUBJECTS[ocrResult.department]) {
          baseMarks = DEPARTMENT_SUBJECTS[ocrResult.department].map(name => ({ 
            id: Math.random().toString(36).substr(2, 9),
            name, 
            value: '' 
          }));
        } else {
          baseMarks = [...subjectMarks];
        }

        if (ocrResult.subjects) {
          Object.entries(ocrResult.subjects).forEach(([k, v]) => {
            const normalizedK = normalizeSubjectName(k);
            const existingIdx = baseMarks.findIndex(m => 
              m.name.toLowerCase() === k.toLowerCase() || 
              m.name.toLowerCase() === normalizedK.toLowerCase()
            );
            
            // Explicit conversion to Number and validation
            const markValue = Number(v);
            const finalValue = isNaN(markValue) ? '0' : String(markValue);

            if (existingIdx !== -1) {
              baseMarks[existingIdx].value = finalValue;
            } else {
              baseMarks.push({ 
                id: Math.random().toString(36).substr(2, 9),
                name: normalizedK, 
                value: finalValue 
              });
            }
          });
        }
        
        // Use a timeout to ensure the department-change useEffect doesn't overwrite our marks
        setTimeout(() => {
          setSubjectMarks(baseMarks);
          if (ocrResult.core_metrics) {
            setAnalysis(ocrResult);
            setActiveTab('analysis');
            onAnalysisComplete?.(ocrResult, baseMarks);
            
            // Trigger notification if user is logged in
            if (auth.currentUser) {
              createNotification(
                auth.currentUser.uid,
                'Marksheet Processed',
                `AI has extracted your marks and generated a profile: "The ${ocrResult.strategic_profile}".`,
                'success'
              );
            }
          }
        }, 100);
      } catch (error) {
        console.error(error);
        setOcrError(error instanceof Error ? error.message : "Failed to process marksheet");
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const radarData = subjectMarks.map(sm => ({
    subject: sm.name || '?',
    value: Number(sm.value) || 0,
    fullMark: 100
  }));

  const metricsData = analysis ? [
    { name: 'Stability', value: analysis?.metrics?.stability || 0, color: 'var(--color-brand-primary)', icon: ShieldCheck },
    { name: 'Growth', value: analysis?.metrics?.growth || 0, color: 'var(--color-brand-accent)', icon: TrendingUp },
    { name: 'Innovation', value: analysis?.metrics?.innovation || 0, color: '#10B981', icon: Lightbulb }
  ] : [];

  const getStrategicIcon = (profile: string) => {
    const p = profile.toLowerCase();
    if (p.includes('architect')) return <Brain className="w-8 h-8 text-brand-primary" />;
    if (p.includes('strategist')) return <Lightbulb className="w-8 h-8 text-brand-secondary" />;
    if (p.includes('researcher')) return <ShieldCheck className="w-8 h-8 text-brand-accent" />;
    return <Award className="w-8 h-8 text-brand-accent" />;
  };

  const isAllFilled = subjectMarks.length > 0 && subjectMarks.every(sm => {
    const num = parseInt(sm.value);
    return sm.name.trim() !== '' && sm.value !== '' && !isNaN(num) && num >= 0 && num <= 100;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Academic Profile</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveDraft}
            disabled={saveDraftStatus !== 'idle'}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all border",
              saveDraftStatus === 'saved' 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
            )}
          >
            {saveDraftStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             saveDraftStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {saveDraftStatus === 'saving' ? 'Saving Draft...' : saveDraftStatus === 'saved' ? 'Draft Saved' : 'Save Draft'}
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all text-slate-400 hover:text-brand-primary group"
          >
            <History className="w-5 h-5 group-hover:rotate-[-30deg] transition-transform" />
            <span className="font-bold text-sm">History</span>
          </button>
          {analysis && (
            <button 
              onClick={handleSave}
              disabled={saveStatus !== 'idle'}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-lg",
                saveStatus === 'saved' 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-brand-primary text-black hover:bg-brand-secondary shadow-brand-primary/20"
              )}
            >
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
               saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Analysis'}
            </button>
          )}
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-rose-500/10 hover:border-rose-500/30 transition-all text-slate-400 hover:text-rose-400 group"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-[-120deg] transition-transform" />
            <span className="font-bold text-sm">Clear</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(analysis || ocrResult) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
          >
            {/* Strategic Persona & Summary Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-brand-primary/20 via-brand-secondary/10 to-transparent backdrop-blur-xl border border-white/[0.05] rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                {getStrategicIcon(analysis?.strategic_profile || ocrResult?.strategic_profile || '')}
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        {analysis?.student_name || ocrResult?.student_name || 'Academic Profile'}
                      </h3>
                      <div className="px-2 py-0.5 bg-brand-primary/20 border border-brand-primary/30 rounded-lg text-[8px] font-black text-brand-primary uppercase tracking-widest">
                        Verified
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-brand-primary/60" />
                        <span>{analysis?.institution || ocrResult?.institution || 'Institution Not Specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/20 border border-brand-primary/30 rounded-full text-[10px] font-black text-brand-primary uppercase tracking-widest">
                    <Sparkles className="w-3 h-3" />
                    Strategic Persona
                  </div>
                  <h4 className="text-3xl font-bold text-white leading-tight">
                    The <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{analysis?.strategic_profile || ocrResult?.strategic_profile || 'Analyzing...'}</span>
                  </h4>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Strategic Summary</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(analysis?.summary || ocrResult?.summary || []).slice(0, 4).map((point: string, idx: number) => (
                      <div key={idx} className="flex gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-slate-300 leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setActiveTab('analysis')}
                  className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest hover:text-brand-secondary transition-colors pt-4"
                >
                  View Full Analysis Report <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Core Metrics Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Core Metrics</h4>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Percentage</p>
                      <p className="text-2xl font-black text-white">{analysis?.core_metrics?.percentage || ocrResult?.core_metrics?.percentage || 0}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-brand-primary" />
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">GPA</p>
                      <p className="text-2xl font-black text-brand-secondary">{analysis?.core_metrics?.gpa || ocrResult?.core_metrics?.gpa || 0}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center">
                      <Award className="w-6 h-6 text-brand-secondary" />
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Consistency</p>
                      <p className="text-2xl font-black text-brand-accent">{analysis?.core_metrics?.consistency_score || ocrResult?.core_metrics?.consistency_score || 0}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-brand-accent" />
                    </div>
                  </div>

                  {/* Strategic Persona */}
                  {(analysis?.strategic_profile || ocrResult?.strategic_profile) && (
                    <div className="p-4 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Strategic Persona</p>
                        <p className="text-xl font-black text-white tracking-tight italic">
                          {analysis?.strategic_profile || ocrResult?.strategic_profile}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-brand-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Content Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">The Gateway</h2>
          </div>

          <div className="space-y-6">
            {/* Marksheet Upload Zone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Upload Marksheet (PDF/Image)</label>
              <label className="relative flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-brand-primary/50 transition-all group overflow-hidden">
                {ocrLoading ? (
                  <div className="flex flex-col items-center gap-3 w-full px-8">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                      <span className="text-sm font-medium text-brand-primary">AI Analyzing Performance...</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-500 group-hover:text-brand-primary transition-colors" />
                    <span className="text-sm text-slate-400">Drag and drop or click to upload</span>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" disabled={ocrLoading} />
              </label>
              {ocrError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-rose-400 mt-2 text-center font-medium"
                >
                  {ocrError}
                </motion.p>
              )}
            </div>

            {/* Student Name & Institution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-brand-primary" />
                  <label className="micro-label">Student Name</label>
                </div>
                <input 
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:border-brand-primary/50 focus:bg-white/10 transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-brand-secondary" />
                  <label className="micro-label">Institution Name</label>
                </div>
                <input 
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Enter school or college name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:border-brand-secondary/50 focus:bg-white/10 transition-all outline-none"
                />
              </div>
            </div>

            {/* Student Type Options */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="flex items-center gap-2 justify-center">
                <label className="micro-label">Academic Level</label>
                <Tooltip text="Determines the academic context (e.g., grading scales, subject expectations) for the AI analysis." />
              </div>
              <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  {[
                    { value: 'school_10th', label: 'School (10th Standard)' },
                    { value: 'school_12th', label: 'School (11th & 12th)' },
                    { value: 'college', label: 'College Student' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleStudentTypeChange(opt.value as any)}
                      className={cn(
                        "w-full text-left px-6 py-4 rounded-2xl border transition-all font-bold text-sm",
                        studentType === opt.value 
                          ? "bg-brand-primary/20 border-brand-primary text-white shadow-[0_0_15px_rgba(0,255,194,0.2)]" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
              </div>
            </div>

            {/* Department Options (Conditional) */}
            {studentType && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 flex flex-col items-center"
              >
                <div className="flex items-center gap-2 justify-center">
                  <label className="micro-label">Academic Department</label>
                  <Tooltip text="Helps the AI identify your specialization to provide more relevant career trajectories and institution suggestions." />
                </div>
                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  {departmentsMap[studentType].map(dept => (
                    <button
                      key={dept}
                      onClick={() => setDepartment(dept)}
                      className={cn(
                        "w-full text-left px-6 py-4 rounded-2xl border transition-all font-bold text-sm",
                        department === dept 
                          ? "bg-brand-primary/20 border-brand-primary text-white shadow-[0_0_15px_rgba(0,255,194,0.2)]" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      {dept === 'Psychology (College)' ? 'Psychology' : dept}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Grade Input Fields (Conditional) */}
            {department && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-8 border-t border-white/[0.05]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="micro-label text-slate-400">Strategic Academic Profile</h3>
                  <span className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">Drag to prioritize</span>
                </div>

                <Reorder.Group 
                  axis="y" 
                  values={subjectMarks} 
                  onReorder={setSubjectMarks}
                  className="space-y-3"
                >
                  <AnimatePresence mode="popLayout">
                    {subjectMarks.map((sm, index) => {
                      const numValue = parseInt(sm.value);
                      const isInvalid = sm.value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100);
                      
                      return (
                        <Reorder.Item 
                          key={sm.id} 
                          value={sm}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-2xl p-3 group hover:border-brand-primary/30 transition-all shadow-lg shadow-black/20"
                        >
                          <div className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 transition-colors">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 flex items-center gap-3">
                            <div className="relative flex-1 flex items-center">
                              <input 
                                type="text"
                                placeholder="Subject"
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all placeholder:text-slate-600"
                                value={sm.name}
                                onChange={(e) => handleSubjectNameChange(index, e.target.value)}
                              />
                              {sm.name && <SubjectInfoTooltip subject={sm.name} department={department} />}
                            </div>
                            
                            <div className="relative w-24">
                              <input 
                                type="number"
                                min="0"
                                max="100"
                                placeholder="0"
                                className={cn(
                                  "w-full bg-white/5 border rounded-xl py-2 px-3 text-sm text-white text-center focus:outline-none focus:ring-2 transition-all",
                                  isInvalid 
                                    ? "border-rose-500/50 focus:ring-rose-500/50" 
                                    : "border-white/10 focus:ring-brand-primary/50"
                                )}
                                value={sm.value}
                                onChange={(e) => handleMarkChange(index, e.target.value)}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-600">%</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => removeSubject(index)}
                            className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Reorder.Item>
                      );
                    })}
                  </AnimatePresence>
                </Reorder.Group>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">AI-Driven Suggestions</h4>
                    {suggestionsLoading && <Loader2 className="w-3 h-3 text-brand-primary animate-spin" />}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 max-w-md">
                    {suggestedSubjects.length > 0 ? (
                      suggestedSubjects
                        .filter(name => !subjectMarks.some(sm => sm.name.toLowerCase() === name.toLowerCase()))
                        .map(name => (
                          <button
                            key={name}
                            onClick={() => addSubject(name)}
                            className="flex items-center gap-3 px-4 py-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-xs font-bold text-brand-primary hover:bg-brand-primary/20 transition-all group w-full"
                          >
                            <Sparkles className="w-3 h-3 group-hover:animate-pulse" />
                            {name}
                          </button>
                        ))
                    ) : !suggestionsLoading && (
                      (DEPARTMENT_SUBJECTS[department] || [])
                        .filter(name => !subjectMarks.some(sm => sm.name.toLowerCase() === name.toLowerCase()))
                        .map(name => (
                          <button
                            key={name}
                            onClick={() => addSubject(name)}
                            className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:bg-white/10 transition-all w-full"
                          >
                            <Plus className="w-3 h-3" />
                            {name}
                          </button>
                        ))
                    )}
                  </div>

                  <button 
                    onClick={() => addSubject()}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-brand-primary bg-white/5 hover:bg-white/10 border border-dashed border-white/10 hover:border-brand-primary/30 rounded-xl py-3 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    ADD CUSTOM SUBJECT
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex flex-col gap-4 mt-8">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-400 text-sm font-medium flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setHighThinking(!highThinking)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${highThinking ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/50 shadow-[0_0_15px_rgba(0,255,194,0.2)]' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                >
                  <BrainCircuit className={`w-4 h-4 ${highThinking ? 'animate-pulse' : ''}`} />
                  {highThinking ? 'Deep Thinking: On' : 'Standard Analysis'}
                </button>
                <Tooltip text="Enables advanced AI reasoning to find subtle patterns and provide more nuanced career insights." />
              </div>
              <button 
                onClick={() => handleExecute(true)}
                disabled={loading || !isAllFilled || !department}
                className="btn-primary flex-1 ml-4 py-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                {loading ? 'Analyzing...' : 'Execute Analysis'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
          <div className="flex flex-col p-1 bg-white/5 border border-white/10 rounded-2xl w-full max-w-md gap-1">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={cn(
                    "w-full px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3",
                    activeTab === 'dashboard' ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-black shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('discovery')}
                  className={cn(
                    "w-full px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3",
                    activeTab === 'discovery' ? "bg-brand-accent text-black shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Compass className="w-4 h-4" />
                  Discovery
                </button>
                <button 
                  onClick={() => setActiveTab('analysis')}
                  className={cn(
                    "w-full px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3",
                    activeTab === 'analysis' ? "bg-brand-primary text-black shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Strategic Analysis
                </button>
                <button 
                  onClick={() => {
                    handleGetGuidance();
                    setActiveTab('guidance');
                  }}
                  className={cn(
                    "w-full px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3",
                    activeTab === 'guidance' ? "bg-brand-secondary text-black shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {guidanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Personalized Guidance
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' ? (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Dashboard Header Card */}
                    <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Sparkles className="w-48 h-48 text-white" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest">
                            <Zap className="w-3 h-3" />
                            Academic Pulse
                          </div>
                          <h3 className="text-3xl font-bold text-white leading-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{analysis?.student_name || ocrResult?.student_name || 'Scholar'}</span>
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-sm font-bold text-white">{analysis?.strategic_profile || ocrResult?.strategic_profile || 'Analyzing...'}</span>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">Strategic Persona</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Overall</p>
                            <p className="text-4xl font-black text-white">{analysis?.core_metrics?.percentage || ocrResult?.core_metrics?.percentage || 0}<span className="text-lg text-slate-500">%</span></p>
                          </div>
                          <div className="w-px h-12 bg-white/10" />
                          <div className="text-center">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">GPA</p>
                            <p className="text-4xl font-black text-brand-secondary">{analysis?.core_metrics?.gpa || ocrResult?.core_metrics?.gpa || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Navigation Grid */}
                    <div className="grid grid-cols-1 gap-4 max-w-md">
                      <button 
                        onClick={() => {
                          handleGetGuidance();
                          setActiveTab('guidance');
                        }}
                        className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-all overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                          <Sparkles className="w-16 h-16 text-brand-secondary" />
                        </div>
                        <div className="relative z-10 space-y-3">
                          <div className="w-10 h-10 bg-brand-secondary/20 rounded-xl flex items-center justify-center text-brand-secondary">
                            <Compass className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">Personalized Guidance</h4>
                            <p className="text-xs text-slate-400">Get actionable steps for your academic journey</p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-brand-secondary uppercase tracking-widest pt-2">
                            Explore Now <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>

                      <button 
                        onClick={() => setActiveTab('analysis')}
                        className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 text-left hover:bg-white/10 transition-all overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-16 h-16 text-brand-primary" />
                        </div>
                        <div className="relative z-10 space-y-3">
                          <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-primary">
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">Career Trajectory</h4>
                            <p className="text-xs text-slate-400">Visualize your future professional paths</p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest pt-2">
                            View Map <ChevronRight className="w-3 h-3" />
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Recent Insights Preview */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Strategic Insights Preview</h4>
                        <div className="px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[10px] font-bold text-brand-accent">
                          Consistency: {analysis?.core_metrics?.consistency_score || ocrResult?.core_metrics?.consistency_score || 0}%
                        </div>
                      </div>
                      <div className="space-y-4">
                        {(analysis?.summary || ocrResult?.summary || []).slice(0, 2).map((point: string, idx: number) => (
                          <div key={idx} className="flex gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                            <div className="w-2 h-2 bg-brand-primary rounded-full mt-1.5 flex-shrink-0" />
                            <p className="text-sm text-slate-300 leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'discovery' ? (
                  <motion.div
                    key="discovery"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {!quizResult ? (
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                        <div className="max-w-xl mx-auto text-center space-y-6">
                          <div className="w-16 h-16 bg-brand-secondary/20 rounded-2xl flex items-center justify-center mx-auto">
                            <Sparkles className="w-8 h-8 text-brand-secondary" />
                          </div>
                          <h3 className="text-2xl font-bold text-white">Personality Discovery</h3>
                          <p className="text-slate-400">Take our quick 2-minute personality test to unlock more personalized career recommendations and insights.</p>
                          <PersonalityQuiz onComplete={setQuizResult} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Quiz Results Header */}
                        <div className="bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                          <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-24 h-24 bg-brand-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,255,194,0.4)] flex-shrink-0">
                              <Brain className="w-12 h-12 text-black" />
                            </div>
                            <div className="text-center md:text-left space-y-2">
                              <h3 className="text-3xl font-bold text-white">The {quizResult.archetype}</h3>
                              <p className="text-slate-300 text-lg leading-relaxed">{quizResult.description}</p>
                              <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                                {quizResult.traits.map(trait => (
                                  <span key={trait} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-brand-secondary">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Trending Careers Section */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-brand-accent/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-brand-accent" />
                              </div>
                              <h3 className="text-xl font-bold text-white">Trending Careers 2026</h3>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {trendingCareers.map((career, idx) => (
                              <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 group"
                              >
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-white group-hover:text-brand-accent transition-colors">{career.title}</h4>
                                  <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-full">
                                    {career.growth} Growth
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2">{career.description}</p>
                                <div className="flex flex-wrap gap-1">
                                  {career.skills.map((skill: string) => (
                                    <span key={skill} className="text-[10px] bg-white/5 px-2 py-0.5 rounded-md text-slate-300">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Salary: {career.salary}</span>
                                  <button 
                                    onClick={() => handleCareerMatch(career.title)}
                                    className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary hover:bg-brand-primary hover:text-black transition-all"
                                  >
                                    <Target className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : activeTab === 'analysis' ? (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Strategic Profile Card with Glowing Badge */}
                    <div className="bg-white/5 backdrop-blur-[15px] border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Brain className="w-24 h-24 text-white" />
                      </div>
                      
                      <div className="flex items-center gap-6 mb-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full animate-pulse" />
                          <div className="relative w-16 h-16 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,194,0.3)]">
                            {getStrategicIcon(analysis?.strategic_profile || ocrResult?.strategic_profile || '')}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white leading-tight">
                            {analysis?.strategic_profile || ocrResult?.strategic_profile || 'Strategic Analysis'}
                          </h3>
                          <p className="text-sm text-brand-primary font-medium tracking-wide uppercase">Strategic Profile Persona</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {(analysis?.summary || ocrResult?.summary || []).map((point: string, idx: number) => (
                          <div key={idx} className="flex gap-4">
                            <div className={cn(
                              "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border",
                              idx === 0 ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" : 
                              idx === 1 ? "bg-brand-secondary/10 border-brand-secondary/20 text-brand-secondary" : 
                              "bg-brand-accent/10 border-brand-accent/20 text-brand-accent"
                            )}>
                              {idx === 0 ? <Activity className="w-5 h-5" /> : 
                               idx === 1 ? <Compass className="w-5 h-5" /> : 
                               <Lightbulb className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className={cn(
                                "text-[10px] uppercase font-bold tracking-wider mb-1",
                                idx === 0 ? "text-brand-primary" : idx === 1 ? "text-brand-secondary" : "text-brand-accent"
                              )}>
                                {idx === 0 ? "Current Performance" : idx === 1 ? "Vocational Aptitude" : "Strategic Recommendation"}
                              </p>
                              <p className="text-sm text-slate-300 leading-relaxed">
                                {point}
                              </p>
                            </div>
                          </div>
                        ))}
                        {!(analysis?.summary || ocrResult?.summary) && (
                          <p className="text-sm text-slate-500 italic">Awaiting comprehensive data for strategic summary...</p>
                        )}
                      </div>
                    </div>

                    {/* Career Mind Map Visualization */}
                    {((analysis?.suggestions && analysis.suggestions.length > 0) || (ocrResult?.suggestions && ocrResult.suggestions.length > 0)) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center gap-3 px-2">
                          <div className="p-2 bg-brand-primary/20 rounded-lg">
                            <Compass className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">Career Trajectory</h3>
                            <p className="text-xs text-slate-500">Visual mind map of potential professional paths</p>
                          </div>
                        </div>
                        <CareerMindMap 
                          profile={analysis?.strategic_profile || ocrResult?.strategic_profile || 'Strategic Profile'} 
                          suggestions={analysis?.suggestions || ocrResult?.suggestions || []} 
                        />
                      </motion.div>
                    )}

                    {/* Domain Mastery Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-secondary/20 rounded-lg">
                          <Lightbulb className="w-6 h-6 text-brand-secondary" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Domain Mastery</h3>
                      </div>

                      {analysis && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Analytical Domain</span>
                              <span className="text-brand-primary font-bold">{analysis.metrics.analytical}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.metrics.analytical}%` }}
                                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Creative Domain</span>
                              <span className="text-brand-secondary font-bold">{analysis.metrics.creative}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.metrics.creative}%` }}
                                className="h-full bg-gradient-to-r from-brand-secondary to-brand-accent"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Technical Domain</span>
                              <span className="text-brand-accent font-bold">{analysis.metrics.technical}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${analysis.metrics.technical}%` }}
                                className="h-full bg-gradient-to-r from-brand-accent to-brand-primary"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {!analysis && ocrResult && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">AI Recommendation</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{ocrResult.analysis_text || ocrResult.summary?.[0]}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="guidance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {guidance ? (
                      <div className="space-y-8">
                        {/* Guidance Summary */}
                        <div className="bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 backdrop-blur-xl border border-brand-primary/20 rounded-3xl p-8">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-brand-primary rounded-lg">
                              <Compass className="w-5 h-5 text-black" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Academic Counselor Summary</h3>
                          </div>
                          <p className="text-slate-300 leading-relaxed italic text-lg">"{guidance.guidance_summary}"</p>
                        </div>

                        {/* Action Items */}
                        <div className="grid grid-cols-1 gap-4 max-w-md">
                          {guidance.action_items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                              <div className="flex items-start gap-4">
                                <div className="p-2 bg-brand-primary/20 rounded-lg group-hover:bg-brand-primary/30 transition-all">
                                  <Lightbulb className="w-5 h-5 text-brand-primary" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="font-bold text-white">{item.title}</h4>
                                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Academic Insights */}
                          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-brand-secondary" />
                              Academic Intelligence
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{guidance.academic_insights}</p>
                          </div>

                          {/* Resources */}
                          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-brand-accent" />
                              Recommended Resources
                            </h3>
                            <ul className="space-y-3">
                              {guidance.recommended_resources.map((resource: string, idx: number) => (
                                <li key={idx} className="flex items-center gap-3 text-sm text-slate-300">
                                  <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                                  {resource}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin opacity-20" />
                        <p>Synthesizing personalized guidance...</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
      {analysis && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Metrics Section */}
          <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">Core Metrics</h3>
            <div className="space-y-6">
              {metricsData.map((metric) => (
                <div key={metric.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                      <span className="text-sm font-medium text-slate-300">{metric.name}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{metric.value}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analysis Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">Strategic Profile Analysis</h3>
                <button 
                  onClick={handleSave}
                  disabled={saveStatus !== 'idle'}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                    saveStatus === 'saved' 
                      ? "bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30" 
                      : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                  )}
                >
                  {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Analysis'}
                </button>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">{analysis.analysis_text}</p>
              
              <div className="grid grid-cols-1 gap-6 max-w-md">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-brand-primary uppercase tracking-wider">Career Trajectories</h4>
                  <div className="space-y-2">
                    {analysis.suggestions.map((s: string) => (
                      <div key={s} className="flex items-center gap-2 text-white bg-white/5 p-3 rounded-xl border border-white/5">
                        <ChevronRight className="w-4 h-4 text-brand-primary" />
                        <span className="text-sm">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-brand-accent uppercase tracking-wider">Target Institutions</h4>
                  <div className="space-y-2">
                    {analysis.institutions.map((i: string) => (
                      <div key={i} className="flex items-center gap-2 text-white bg-white/5 p-3 rounded-xl border border-white/5">
                        <ChevronRight className="w-4 h-4 text-brand-accent" />
                        <span className="text-sm">{i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Strategic Roadmap Recommendations</h3>
              <div className="grid grid-cols-1 gap-6 max-w-md">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Lightbulb className="w-4 h-4" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Courses</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.recommendations?.courses.map((c: string) => (
                      <div key={c} className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-secondary">
                    <Brain className="w-4 h-4" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Internships</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.recommendations?.internships.map((i: string) => (
                      <div key={i} className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-accent">
                    <TrendingUp className="w-4 h-4" />
                    <h4 className="text-sm font-semibold uppercase tracking-wider">Extracurriculars</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.recommendations?.extracurriculars.map((e: string) => (
                      <div key={e} className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <HistoryView 
        storageKey="careerpath_student_analyses"
        title="Student"
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestore={handleRestore}
        onCompare={handleCompare}
      />

      {/* Career Match Modal */}
      <AnimatePresence>
        {selectedCareerForMatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCareerForMatch(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white">Career Match Analysis</h3>
                    <p className="text-brand-primary font-medium">{selectedCareerForMatch}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedCareerForMatch(null)}
                    className="p-2 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {isMatching ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
                    <p className="text-slate-400 animate-pulse">Calculating compatibility score...</p>
                  </div>
                ) : careerMatchResult ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-white/5"
                          />
                          <motion.circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={251.2}
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 - (251.2 * careerMatchResult.match_score) / 100 }}
                            className="text-brand-primary"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{careerMatchResult.match_score}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-white">Match Score</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">{careerMatchResult.reasoning}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-brand-secondary/10 border border-brand-secondary/20 rounded-2xl space-y-3">
                        <h5 className="text-xs font-bold text-brand-secondary uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" /> Strengths
                        </h5>
                        <ul className="space-y-2">
                          {careerMatchResult.pros.map((pro, i) => (
                            <li key={i} className="text-xs text-slate-300 flex gap-2">
                              <span className="text-brand-secondary">•</span> {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl space-y-3">
                        <h5 className="text-xs font-bold text-brand-accent uppercase tracking-wider flex items-center gap-2">
                          <Info className="w-3 h-3" /> Gaps
                        </h5>
                        <ul className="space-y-2">
                          {careerMatchResult.cons.map((con, i) => (
                            <li key={i} className="text-xs text-slate-300 flex gap-2">
                              <span className="text-brand-accent">•</span> {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-accent/20 rounded-lg">
                          <Zap className="w-4 h-4 text-brand-accent" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Salary Range</p>
                          <p className="text-sm font-bold text-white">{careerMatchResult.salary_range}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Market Demand</p>
                        <p className={cn(
                          "text-sm font-bold",
                          careerMatchResult.job_demand === 'High' ? "text-brand-secondary" :
                          careerMatchResult.job_demand === 'Medium' ? "text-brand-primary" : "text-brand-accent"
                        )}>{careerMatchResult.job_demand}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

