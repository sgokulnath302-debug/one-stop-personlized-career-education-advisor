import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Bot, Menu, X, ChevronRight, GraduationCap, LogIn, LogOut, Bell, Zap, Terminal, Activity, Settings } from 'lucide-react';
import ExpertHub from './components/ExpertHub';
import StudentHub from './components/StudentHub';
import AIChatBot from './components/AIChatBot';
import AnalysisResult from './components/AnalysisResult';
import SettingsModal from './components/SettingsModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, db, collection, query, where, onSnapshot } from './firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Module = 'expert' | 'student' | 'chatbot' | 'student-result';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeModule, setActiveModule] = useState<Module>('student');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expertAnalysis, setExpertAnalysis] = useState<any>(null);
  const [studentAnalysis, setStudentAnalysis] = useState<any>(null);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          name: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          type: 'professional'
        });

        // Listen for notifications
        const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.uid));
        const unsubNotifications = onSnapshot(q, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNotifications(notifs.sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds));
        });

        return () => unsubNotifications();
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { id: 'student', label: 'Student Hub', icon: GraduationCap, color: 'text-slate-400', bg: 'bg-white/5' },
    { id: 'expert', label: 'Expert Hub', icon: Briefcase, color: 'text-slate-400', bg: 'bg-white/5' },
    { id: 'chatbot', label: 'AI Prometheus', icon: Zap, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  ];

  return (
    <div className="min-h-screen bg-bg-main text-slate-300 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 80 }}
        className="relative z-20 bg-black border-r border-white/[0.05] flex flex-col"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-primary/20">
            <Zap className="w-5 h-5 text-black" />
          </div>
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-display font-bold text-lg tracking-tight text-white">
                CareerPath <span className="text-white">AI</span>
              </span>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id as Module)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group relative",
                activeModule === item.id 
                  ? "bg-brand-primary/10 text-brand-primary" 
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-colors", activeModule === item.id ? "text-brand-primary" : "text-slate-600 group-hover:text-slate-400")} />
              {sidebarOpen && <span className="font-medium text-sm tracking-tight">{item.label}</span>}
              {activeModule === item.id && (
                <motion.div 
                  layoutId="active-nav-indicator"
                  className="absolute left-0 w-1 h-5 bg-brand-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          {sidebarOpen && (
            <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2">
              <p className="micro-label text-[8px] opacity-40">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">AI Engine Active</span>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-30 backdrop-blur-md"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4 rotate-180" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </motion.aside>

      {/* Intelligence Feed Column (Middle) */}
      {activeModule === 'chatbot' && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-black border-r border-white/[0.05] flex flex-col p-6 space-y-8"
        >
          <div className="space-y-6">
            <h3 className="micro-label text-slate-500">Intelligence Feed</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-brand-primary">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Student Hub</span>
                </div>
                <p className="text-xs text-slate-500">No academic data analyzed</p>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-brand-primary">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Expert Hub</span>
                </div>
                <p className="text-xs text-slate-500">No professional data analyzed</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="micro-label text-slate-500">Quick Queries</h3>
            <div className="space-y-2">
              {[
                "What colleges should I target?",
                "Expected salary for target role?",
                "Generate a career roadmap",
                "Current industry trends"
              ].map((query) => (
                <button 
                  key={query}
                  className="w-full p-3 text-left text-[11px] text-slate-400 bg-white/[0.03] border border-white/[0.05] rounded-xl hover:bg-white/[0.06] hover:text-white transition-all"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto bg-bg-main custom-scrollbar">
        {/* Background Gradients - More subtle and professional */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-primary/5 blur-[160px] rounded-full" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-secondary/5 blur-[160px] rounded-full" />
        </div>

        <div className={cn(
          "mx-auto p-12 relative z-10 transition-all duration-500",
          activeModule === 'chatbot' ? "max-w-none px-6 sm:px-20" : "max-w-7xl"
        )}>
          {/* Top Right Actions */}
          <div className="absolute top-12 right-12 z-30 flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white tracking-tight">{user.name}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] font-black text-slate-500 hover:text-brand-primary uppercase tracking-widest transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
                <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden bg-white/5 p-0.5">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover rounded-[14px]" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-primary/10 text-brand-primary">
                      <LogIn className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                {/* Settings Toggle */}
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/10"
                  title="API Settings"
                >
                  <Settings className="w-6 h-6" />
                </button>

                {/* Notifications Toggle */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all hover:bg-white/10"
                  >
                    <Bell className="w-6 h-6" />
                    {notifications.length > 0 && (
                      <span className="absolute top-2 right-2 w-3 h-3 bg-brand-accent rounded-full border-2 border-slate-950" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-4 border-b border-white/5 bg-white/5">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                                <p className="text-sm text-white font-medium mb-1">{notif.title}</p>
                                <p className="text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                                <p className="text-[10px] text-slate-600 mt-2 uppercase font-bold">
                                  {notif.createdAt?.toDate().toLocaleTimeString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <p className="text-sm text-slate-500 italic">No new notifications</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-3 px-6 py-3 bg-brand-primary text-black font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all"
              >
                <LogIn className="w-5 h-5" />
                <span>Connect with Google</span>
              </button>
            )}
          </div>

          {activeModule !== 'student-result' && (
            <header className={cn("mb-16", activeModule === 'chatbot' && "mb-8")}>
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-4"
              >
                <div className={cn("p-2 rounded-xl shadow-inner", (navItems.find(i => i.id === activeModule) || navItems.find(i => i.id === 'student'))?.bg)}>
                  {React.createElement((navItems.find(i => i.id === activeModule) || navItems.find(i => i.id === 'student'))!.icon, { className: cn("w-4 h-4", (navItems.find(i => i.id === activeModule) || navItems.find(i => i.id === 'student'))?.color) })}
                </div>
                <h1 className="micro-label">
                  {(navItems.find(i => i.id === activeModule) || navItems.find(i => i.id === 'student'))?.label}
                </h1>
              </motion.div>
              <h2 className="text-5xl font-bold text-white tracking-tight max-w-2xl leading-[1.1]">
                {activeModule === 'expert' && "Professional Strategy Hub"}
                {activeModule === 'student' && "Academic Excellence Hub"}
                {activeModule === 'chatbot' && "Conversational Intelligence"}
              </h2>
              <div className="mt-4 w-20 h-1 bg-gradient-to-r from-brand-primary to-transparent rounded-full" />
            </header>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeModule === 'expert' && <ExpertHub onAnalysisComplete={setExpertAnalysis} initialAnalysis={expertAnalysis} />}
              {activeModule === 'student' && (
                <StudentHub 
                  onAnalysisComplete={(analysis, marks) => {
                    setStudentAnalysis(analysis);
                    setStudentMarks(marks);
                    setActiveModule('student-result');
                  }} 
                  initialAnalysis={studentAnalysis} 
                />
              )}
              {activeModule === 'student-result' && (
                <AnalysisResult 
                  analysis={studentAnalysis} 
                  marks={studentMarks} 
                  onBack={() => setActiveModule('student')} 
                />
              )}
              {activeModule === 'chatbot' && <AIChatBot context={{ user, expertAnalysis, studentAnalysis }} />}
            </motion.div>
          </AnimatePresence>

          <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
      </main>
    </div>
  );
}
