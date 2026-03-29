import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, X, Trash2, ExternalLink, Clock, Calendar, ArrowRightLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryItem {
  id: number;
  timestamp: string;
  [key: string]: any;
}

interface HistoryViewProps {
  storageKey: string;
  onRestore: (item: any) => void;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onCompare?: (item1: any, item2: any) => void;
}

export default function HistoryView({ storageKey, onRestore, isOpen, onClose, title, onCompare }: HistoryViewProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setHistory(saved);
      setSelectedItems([]);
    }
  }, [isOpen, storageKey]);

  const toggleSelection = (id: number) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedItems.length === 2 && onCompare) {
      const item1 = history.find(h => h.id === selectedItems[0]);
      const item2 = history.find(h => h.id === selectedItems[1]);
      onCompare(item1, item2);
    }
  };

  const deleteItem = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setHistory(updated);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-bottom border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <History className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{title} History</h3>
                  <p className="text-xs text-slate-400">View and restore your previous strategic analyses</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
                  <History className="w-12 h-12 opacity-20" />
                  <p>No saved analyses found in this session.</p>
                </div>
              ) : (
                history.map((item) => {
                  const { date, time } = formatDate(item.timestamp);
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "group bg-white/5 border rounded-2xl p-4 transition-all cursor-pointer",
                        isSelected ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]" : "border-white/5 hover:bg-white/10 hover:border-white/10"
                      )}
                      onClick={() => onCompare && toggleSelection(item.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {onCompare && (
                            <div className={cn(
                              "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                              isSelected ? "bg-blue-500 border-blue-500" : "border-white/20 bg-white/5"
                            )}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-bold">
                                {item.studentType ? (item.studentType === 'school_10th' ? '10th Std' : item.studentType === 'school_12th' ? '12th Std' : 'College') : item.formData?.currentRole || 'Analysis'}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                {item.department || item.formData?.targetRole || 'Profile'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {date}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {time}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onRestore(item)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/30 transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Restore
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Delete from history"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer / Compare Action */}
            {onCompare && history.length > 0 && (
              <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  {selectedItems.length === 0 ? 'Select two profiles to compare' : 
                   selectedItems.length === 1 ? 'Select one more profile' : 'Ready to compare'}
                </p>
                <button
                  disabled={selectedItems.length !== 2}
                  onClick={handleCompare}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-bold hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Compare Selected
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
