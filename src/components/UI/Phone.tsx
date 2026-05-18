
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone as PhoneIcon, X, User, Send } from 'lucide-react';
import { PHONE_SCENARIOS } from '../../phoneScenarios';
import { useWindowSize } from '../../hooks/useWindowSize';

interface PhoneProps {
  onClose: () => void;
}

export default function Phone({ onClose }: PhoneProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 550) : 1;

  const [currentScenario] = useState(() => {
    const s = PHONE_SCENARIOS[Math.floor(Math.random() * PHONE_SCENARIOS.length)];
    return {
      question: s.q,
      options: s.a.map((text, i) => ({ text, correct: s.c[i] }))
    };
  });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOptionClick = (index: number, correct: boolean) => {
    setSelectedOption(index);
    setFeedback(correct ? "Great answer! The patient is satisfied." : "That's not quite right. Try to be more helpful.");
    
    setTimeout(() => {
        if (correct) onClose();
        else {
            setFeedback(null);
            setSelectedOption(null);
        }
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div 
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        className="w-full max-w-lg bg-black border-4 border-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] pixel-border"
      >
        {/* Header */}
        <div className="bg-black p-6 flex justify-between items-center border-b-4 border-white">
            <div className="flex items-center gap-3">
                <div className="p-2 border-2 border-white bg-blue-600 animate-pulse">
                    <PhoneIcon className="text-white w-6 h-6" />
                </div>
                <div>
                    <div className="text-white font-black text-[10px]">INCOMING_CALL</div>
                    <div className="text-blue-400 text-[6px] font-black underline uppercase">Channel_01_Active</div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-white hover:text-red-500 border-2 border-transparent hover:border-red-500">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-4">
                <div className="text-[6px] text-blue-400 font-black tracking-[4px]">CALLER:</div>
                <div className="bg-black p-6 border-4 border-white relative shadow-inner">
                    <p className="text-white font-black text-sm italic leading-relaxed">"{currentScenario.question}"</p>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white" />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t-2 border-white/20">
                <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest px-2">Select Response</p>
                {currentScenario.options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleOptionClick(i, opt.correct)}
                        disabled={selectedOption !== null}
                        className={`w-full p-5 text-left font-black text-[8px] transition-all border-4 flex items-center justify-between group ${
                            selectedOption === i 
                                ? (opt.correct ? 'bg-green-600 border-white text-white' : 'bg-red-600 border-white text-white')
                                : 'bg-black border-white/20 hover:border-white text-white hover:scale-[1.02]'
                        }`}
                    >
                        <span>{'>'} {opt.text}</span>
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {feedback && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 border-4 border-white text-center font-black text-[8px] uppercase tracking-widest ${feedback.includes('Great') ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        {feedback}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
