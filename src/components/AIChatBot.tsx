import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Loader2, Sparkles, Trash2, MessageSquare, Zap, Map, Image as ImageIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getChatResponse, generateCareerRoadmap, generateSpeech } from '../services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isRoadmap?: boolean;
  image?: string;
}

interface AIChatBotProps {
  context: {
    user: any;
    expertAnalysis: any;
    studentAnalysis: any;
  };
}

export default function AIChatBot({ context }: AIChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [highThinking, setHighThinking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const user = context.user;
      let initialMessage = `Greetings, **${user?.name || 'User'}**. I am your **CareerPath AI Assistant**. `;
      
      if (context.expertAnalysis || context.studentAnalysis) {
        initialMessage += "I've synchronized with your latest profile data. How can I assist with your strategic growth today?";
      } else {
        initialMessage += "I'm ready to help you architect your professional future. Shall we begin by analyzing your current trajectory?";
      }

      setMessages([{
        role: 'assistant',
        content: initialMessage,
        timestamp: new Date()
      }]);
    }
  }, [context]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await getChatResponse(input, context, highThinking, userMessage.image);
      const assistantMessage: Message = {
        role: 'assistant',
        content: response || "I apologize, but I encountered an error processing your request.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setIsLoading(true);
    try {
      const roadmap = await generateCareerRoadmap(context, highThinking);
      const assistantMessage: Message = {
        role: 'assistant',
        content: roadmap || "Failed to generate roadmap.",
        timestamp: new Date(),
        isRoadmap: true
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Roadmap error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioData = await generateSpeech(text.replace(/[#*`]/g, ''));
      if (audioData) {
        const audio = new Audio(`data:audio/mpeg;base64,${audioData}`);
        audio.onended = () => setIsSpeaking(false);
        await audio.play();
      }
    } catch (error) {
      console.error("Speech error:", error);
      setIsSpeaking(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Chat Header */}
      <div className="pb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-white tracking-tight">AI Prometheus</h2>
              <span className="px-2 py-0.5 bg-brand-primary/20 border border-brand-primary/30 rounded-full text-[9px] font-black text-brand-primary uppercase tracking-widest">v2.5</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Context-aware career advisor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
            Data Link
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-8 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-3xl",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-brand-primary" />
              </div>
            )}

            <div className={cn(
              "space-y-2",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "p-6 rounded-[2rem] text-sm leading-relaxed shadow-xl",
                msg.role === 'user' 
                  ? "bg-brand-primary text-black font-bold" 
                  : "bg-white/[0.03] border border-white/[0.05] text-slate-300"
              )}>
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] p-6 rounded-[2rem]">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-8">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Prometheus anything about your career path..."
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-[2rem] py-6 px-8 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 transition-all shadow-inner"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className="w-12 h-12 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-black rounded-2xl transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
