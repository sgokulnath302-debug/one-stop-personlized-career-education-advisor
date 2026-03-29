import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Target, 
  Users, 
  Wrench, 
  Palette, 
  Search,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface QuizResult {
  archetype: string;
  description: string;
  traits: string[];
  careers: string[];
  scores: Record<string, number>;
}

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    category: 'Realistic' | 'Investigative' | 'Artistic' | 'Social' | 'Enterprising' | 'Conventional';
    icon: any;
  }[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "How do you prefer to spend your free time?",
    options: [
      { text: "Building or fixing things", category: 'Realistic', icon: Wrench },
      { text: "Solving puzzles or researching", category: 'Investigative', icon: Search },
      { text: "Creating art or music", category: 'Artistic', icon: Palette },
      { text: "Helping others or volunteering", category: 'Social', icon: Users },
      { text: "Leading a team or starting a project", category: 'Enterprising', icon: Target },
      { text: "Organizing files or planning schedules", category: 'Conventional', icon: CheckCircle2 },
    ]
  },
  {
    id: 2,
    text: "Which environment makes you feel most energized?",
    options: [
      { text: "Outdoors or in a workshop", category: 'Realistic', icon: Wrench },
      { text: "A quiet library or laboratory", category: 'Investigative', icon: Search },
      { text: "A studio or creative space", category: 'Artistic', icon: Palette },
      { text: "A classroom or community center", category: 'Social', icon: Users },
      { text: "A boardroom or busy office", category: 'Enterprising', icon: Target },
      { text: "A structured, orderly office", category: 'Conventional', icon: CheckCircle2 },
    ]
  },
  {
    id: 3,
    text: "What kind of problems do you enjoy solving?",
    options: [
      { text: "Mechanical or physical problems", category: 'Realistic', icon: Wrench },
      { text: "Complex theories or data patterns", category: 'Investigative', icon: Search },
      { text: "Expressing ideas through design", category: 'Artistic', icon: Palette },
      { text: "Interpersonal or social issues", category: 'Social', icon: Users },
      { text: "Business challenges or negotiations", category: 'Enterprising', icon: Target },
      { text: "Efficiency or administrative bottlenecks", category: 'Conventional', icon: CheckCircle2 },
    ]
  },
  {
    id: 4,
    text: "If you were to write a book, what would it be about?",
    options: [
      { text: "A DIY guide or technical manual", category: 'Realistic', icon: Wrench },
      { text: "A scientific discovery or mystery", category: 'Investigative', icon: Search },
      { text: "A novel or poetry collection", category: 'Artistic', icon: Palette },
      { text: "A guide on personal growth or teaching", category: 'Social', icon: Users },
      { text: "A biography of a successful CEO", category: 'Enterprising', icon: Target },
      { text: "A book on productivity and systems", category: 'Conventional', icon: CheckCircle2 },
    ]
  },
  {
    id: 5,
    text: "What's your preferred way of working?",
    options: [
      { text: "Hands-on with tools and equipment", category: 'Realistic', icon: Wrench },
      { text: "Independent research and analysis", category: 'Investigative', icon: Search },
      { text: "Free-flowing and unstructured", category: 'Artistic', icon: Palette },
      { text: "Collaborative and people-focused", category: 'Social', icon: Users },
      { text: "Strategic and goal-oriented", category: 'Enterprising', icon: Target },
      { text: "Methodical and detail-oriented", category: 'Conventional', icon: CheckCircle2 },
    ]
  }
];

const archetypes: Record<string, any> = {
  Realistic: {
    title: "The Doer",
    description: "You enjoy hands-on work, physical activity, and working with tools or animals.",
    traits: ["Practical", "Mechanical", "Persistent"],
    careers: ["Engineer", "Pilot", "Surgeon", "Architect", "Technician"]
  },
  Investigative: {
    title: "The Thinker",
    description: "You are curious, analytical, and enjoy solving complex problems and researching.",
    traits: ["Analytical", "Curious", "Intellectual"],
    careers: ["Data Scientist", "Physicist", "Software Developer", "Psychologist", "Researcher"]
  },
  Artistic: {
    title: "The Creator",
    description: "You value self-expression, creativity, and working in unstructured environments.",
    traits: ["Creative", "Intuitive", "Expressive"],
    careers: ["Designer", "Writer", "Musician", "Art Director", "UX Researcher"]
  },
  Social: {
    title: "The Helper",
    description: "You enjoy teaching, helping, and working with people to improve their lives.",
    traits: ["Empathetic", "Patient", "Cooperative"],
    careers: ["Teacher", "Counselor", "Doctor", "HR Manager", "Social Worker"]
  },
  Enterprising: {
    title: "The Persuader",
    description: "You are energetic, ambitious, and enjoy leading others and taking risks.",
    traits: ["Ambitious", "Confident", "Strategic"],
    careers: ["Entrepreneur", "Lawyer", "Marketing Manager", "Sales Director", "Politician"]
  },
  Conventional: {
    title: "The Organizer",
    description: "You value order, accuracy, and working with data or structured systems.",
    traits: ["Organized", "Detail-oriented", "Reliable"],
    careers: ["Accountant", "Financial Analyst", "Project Manager", "Data Analyst", "Actuary"]
  }
};

interface PersonalityQuizProps {
  onComplete: (result: QuizResult) => void;
}

export const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (category: string) => {
    const newAnswers = [...answers, category];
    setAnswers(newAnswers);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (finalAnswers: string[]) => {
    const scores: Record<string, number> = {};
    finalAnswers.forEach(ans => {
      scores[ans] = (scores[ans] || 0) + 1;
    });

    const topCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const archetype = archetypes[topCategory];

    const result: QuizResult = {
      archetype: topCategory,
      description: archetype.description,
      traits: archetype.traits,
      careers: archetype.careers,
      scores
    };

    setIsFinished(true);
    onComplete(result);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Question {currentStep + 1} of {questions.length}
              </div>
              <h3 className="text-2xl font-bold text-white">{questions[currentStep].text}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions[currentStep].options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(option.category)}
                  className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/30 transition-all text-left group"
                >
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-all">
                    <option.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-slate-200 font-medium">{option.text}</span>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <div className="flex gap-2">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      idx === currentStep ? "w-8 bg-blue-500" : idx < currentStep ? "bg-blue-500/50" : "bg-white/10"
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-bold text-white">Quiz Complete!</h3>
              <p className="text-slate-400">Your personality archetype has been identified.</p>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-sm text-blue-400 font-bold uppercase tracking-widest mb-2">Your Archetype</p>
              <h4 className="text-2xl font-bold text-white mb-2">{archetypes[Object.entries(answers.reduce((acc: any, curr) => { acc[curr] = (acc[curr] || 0) + 1; return acc; }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]].title}</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {archetypes[Object.entries(answers.reduce((acc: any, curr) => { acc[curr] = (acc[curr] || 0) + 1; return acc; }, {})).sort((a: any, b: any) => b[1] - a[1])[0][0]].description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
