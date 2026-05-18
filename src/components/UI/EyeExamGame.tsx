import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Check, X } from 'lucide-react';

interface EyeExamGameProps {
  onClose: () => void;
  onComplete?: (amount: number) => void;
  patient?: any;
}

const SNELLEN_ROWS = [
  'E',
  'F P',
  'T O Z',
  'L P E D',
  'P E C F D',
  'E D F C Z P',
  'F E L O P Z D',
  'D E F P O T E C'
];

const ROUND_BLUR_CONFIGS = [
  { lens1: 10, lens2: 6 },   // Round 1: very blurry vs blurry
  { lens1: 7, lens2: 4 },    // Round 2: blurry vs somewhat blurry
  { lens1: 5, lens2: 2.5 },  // Round 3: somewhat blurry vs slightly blurry
  { lens1: 3, lens2: 1 },    // Round 4: slightly blurry vs barely blurry
  { lens1: 1.5, lens2: 0 },  // Round 5: barely blurry vs clear
];

const ROUND_MESSAGES = [
  `"Let's start. Which lens looks clearer to you?"`,
  `"Good. Now try these two..."`,
  `"Getting there. Which is better now?"`,
  `"Almost done. Compare these two..."`,
  `"Last one! Which is more clear?"`,
];

export const EyeExamGame: React.FC<EyeExamGameProps> = ({ onClose, onComplete, patient }) => {
  const [round, setRound] = useState(0);
  const patientName = patient?.name || "James";
  const [message, setMessage] = useState(`"${patientName}, have a seat. Let's check your prescription."`);
  const [phase, setPhase] = useState<'INTRO' | 'COMPARING' | 'RIGHT' | 'WRONG' | 'COMPLETE'>('INTRO');
  const [correctCount, setCorrectCount] = useState(0);

  const handleStart = () => {
    setRound(0);
    setPhase('COMPARING');
    setMessage(ROUND_MESSAGES[0]);
  };

  const handleLensSelection = (lens: 1 | 2) => {
    // Lens 2 is always the clearer one per the config
    if (lens === 2) {
      // Correct choice
      setPhase('RIGHT');
      const newCorrectCount = correctCount + 1;
      setCorrectCount(newCorrectCount);
      
      if (round >= 4) {
        setTimeout(() => {
          setPhase('COMPLETE');
          setMessage(`"Excellent work, ${patientName}! Your prescription is solid."`);
        }, 1500);
      } else {
        setTimeout(() => {
          const nextRound = round + 1;
          setRound(nextRound);
          setPhase('COMPARING');
          setMessage(ROUND_MESSAGES[nextRound]);
        }, 1500);
      }
    } else {
      // Wrong choice
      setPhase('WRONG');
      setTimeout(() => {
        setPhase('COMPARING');
        setMessage(`"Try again. Take a good look at both..."`);
      }, 1500);
    }
  };

  const finishExam = () => {
    if (onComplete) {
      const noIns = !patient?.insurance || patient?.insurance === 'None' || patient?.insurance === 'Medicaid';
      const amount = noIns ? 75 : 50;
      onComplete(amount);
    } else {
      onClose();
    }
  };

  if (phase === 'COMPLETE') {
    return (
      <div className="fixed inset-0 z-300 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-slate-200"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">EXAM COMPLETE</h2>
          <p className="text-slate-600 mb-8 font-medium">
            {message}
          </p>
          <button 
            onClick={finishExam}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-600 transition-colors"
          >
            FINISH EXAM
          </button>
        </motion.div>
      </div>
    );
  }

  const currentBlur = ROUND_BLUR_CONFIGS[round] || ROUND_BLUR_CONFIGS[0];

  return (
    <div className="fixed inset-0 z-300 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border-8 border-slate-800">
        
        {/* Left: The Chart with dual lens view */}
        <div className="flex-1 bg-white p-8 flex items-center justify-center relative border-b-8 md:border-b-0 md:border-r-8 border-slate-100">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-slate-400">
            <Eye className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest">SNELLEN_OPTICAL_CHART_V1</span>
          </div>

          {phase === 'COMPARING' && (
            <div className="flex flex-col md:flex-row gap-4 w-full items-center justify-center">
              {/* Lens 1 View */}
              <div className="flex-1 max-w-100 bg-slate-50 p-4 rounded-2xl border-4 border-blue-200">
                <div className="text-center text-xs font-black text-blue-500 mb-4 tracking-widest">LENS ONE</div>
                <motion.img
                  src="/objects/snellen.png"
                  alt="Snellen Chart - Lens 1"
                  animate={{ filter: `blur(${currentBlur.lens1}px)` }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-auto object-contain pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="bg-slate-900 text-white px-4 py-2 rounded-full font-black text-lg shadow-xl">
                  VS
                </div>
              </div>

              {/* Lens 2 View */}
              <div className="flex-1 max-w-100 bg-slate-50 p-4 rounded-2xl border-4 border-blue-200">
                <div className="text-center text-xs font-black text-blue-500 mb-4 tracking-widest">LENS TWO</div>
                <motion.img
                  src="/objects/snellen.png"
                  alt="Snellen Chart - Lens 2"
                  animate={{ filter: `blur(${currentBlur.lens2}px)` }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-auto object-contain pixelated"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            </div>
          )}

          {(phase === 'RIGHT' || phase === 'WRONG') && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center justify-center"
            >
              {phase === 'RIGHT' ? (
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-500">
                  <Check className="w-12 h-12 text-green-600" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-500">
                  <X className="w-12 h-12 text-red-600" />
                </div>
              )}
            </motion.div>
          )}

          {phase === 'INTRO' && (
            <div className="flex flex-col items-center justify-center">
              <img
                src="/objects/snellen.png"
                alt="Snellen Chart"
                className="w-full max-w-md h-auto object-contain pixelated opacity-40"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}

          {/* Red/Green Lines */}
          <div className="w-full max-w-xs mt-12 space-y-4 opacity-50">
            <div className="h-1 bg-red-500 w-full" />
            <div className="h-1 bg-green-500 w-full" />
          </div>

          {/* Round indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <div 
                key={idx}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx < round ? 'bg-green-500' :
                  idx === round && phase === 'COMPARING' ? 'bg-blue-500 scale-125' :
                  idx === round ? 'bg-yellow-400' :
                  'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right: Controls & Dialogue */}
        <div className="w-full md:w-100 bg-slate-50 flex flex-col p-8">
          <div className="flex-1">
            <div className="bg-white p-6 rounded-2xl border-4 border-slate-200 mb-8 relative">
                <div className="absolute -left-2 top-8 w-4 h-4 bg-white rotate-45 border-l-4 border-b-4 border-slate-200" />
                <div className="text-xs font-black text-slate-400 mb-2 uppercase tracking-tighter">
                  Dr. Robbins <span className="text-blue-500 ml-2">Round {round + 1}/5</span>
                </div>
                <div className="text-xl font-bold text-slate-800 leading-tight">
                    {message}
                </div>
            </div>

            {phase === 'INTRO' && (
              <button 
                onClick={handleStart}
                className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl hover:bg-blue-600 transition-all active:scale-95 shadow-xl"
              >
                START EXAM
              </button>
            )}

            {phase === 'COMPARING' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleLensSelection(1)}
                    className="py-8 rounded-2xl font-black text-2xl transition-all border-4 bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-xl"
                  >
                    <div className="text-sm font-bold text-slate-400 mb-1">LENS</div>
                    ONE
                  </button>
                  <button 
                    onClick={() => handleLensSelection(2)}
                    className="py-8 rounded-2xl font-black text-2xl transition-all border-4 bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-xl"
                  >
                    <div className="text-sm font-bold text-slate-400 mb-1">LENS</div>
                    TWO
                  </button>
                </div>
                <p className="text-center text-xs font-bold text-slate-400">
                  Which lens makes the letters look clearer?
                </p>
              </div>
            )}

            {(phase === 'RIGHT') && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-100 border-4 border-green-500 p-6 rounded-2xl text-center"
              >
                <Check className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <div className="font-black text-green-800 text-lg">Correct!</div>
                <div className="text-sm font-bold text-green-600">
                  {round < 4 ? 'Moving to next round...' : 'Calculating results...'}
                </div>
              </motion.div>
            )}

            {phase === 'WRONG' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-100 border-4 border-red-500 p-6 rounded-2xl text-center"
              >
                <X className="w-10 h-10 text-red-600 mx-auto mb-2" />
                <div className="font-black text-red-800 text-lg mb-1">Not quite</div>
                <div className="text-sm font-bold text-red-600">
                  Try comparing the two lenses again...
                </div>
              </motion.div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 font-bold text-sm hover:text-red-500 transition-colors mt-auto flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> LEAVE EXAM
          </button>
        </div>
      </div>
    </div>
  );
};