import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NPCS } from '../../constants';
import { CharacterSprite } from '../CharacterSprite';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';

interface CharacterSelectionProps {
  onSelect: (id: string) => void;
  onBack: () => void;
  key?: string;
}

const DIRECTIONS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east'];

export default function CharacterSelection({ onSelect, onBack }: CharacterSelectionProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 700) : 1;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rotationIndex, setRotationIndex] = useState(0);

  const employees = NPCS;
  const currentEmployee = employees[selectedIndex];

  // Auto-rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % DIRECTIONS.length);
    }, 450); // Slower, more deliberate rotation
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev - 1 + employees.length) % employees.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev + 1) % employees.length);
      } else if (e.key === 'Enter') {
        onSelect(employees[selectedIndex].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, employees, onSelect]);

  return (
    <div className="fixed inset-0 bg-[#0a0f1a] flex flex-col items-center justify-between py-12 px-8 z-100 overflow-hidden">
      <div 
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="relative"
      >
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#0a0f1a_100%)] z-10" />
        <img 
          src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover grayscale blur-sm"
          alt="background"
        />
      </div>

      {/* Header */}
      <div className="relative z-20 text-center space-y-2">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-black text-white tracking-widest uppercase italic"
        >
          EMPLOYEE SELECTION
        </motion.h1>
        <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em]"
        >
            "A dedicated staff is the backbone of any clinic."
        </motion.p>
      </div>

      {/* Main Preview Area */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentEmployee.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="relative flex flex-col items-center"
          >
            {/* Spotlight effect */}
            <div className="absolute bottom-16 w-80 h-32 bg-blue-500/20 blur-[80px] rounded-full animate-pulse" />
            
            <motion.div
                key={`${currentEmployee.id}-${rotationIndex}`}
                initial={{ opacity: 0.8, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative"
            >
                <motion.div
                    animate={{ 
                        y: [0, -10, 0],
                    }}
                    transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                >
                    <CharacterSprite 
                        spriteBase={currentEmployee.spriteBase}
                        direction={DIRECTIONS[rotationIndex]}
                        size="xxl"
                        className="drop-shadow-[0_30px_50px_rgba(0,0,0,0.8)] filter brightness-110 contrast-110"
                    />
                </motion.div>
            </motion.div>

            <div className="mt-8 text-center space-y-2 relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-px bg-linear-to-r from-transparent via-blue-500/50 to-transparent" />
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg">
                    {currentEmployee.name}
                </h2>
                <div className="text-blue-400 font-black text-xs uppercase tracking-[0.3em] bg-blue-400/10 px-4 py-1 rounded-full border border-blue-400/20">
                    {currentEmployee.role}
                </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls Overlay */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-20">
            <button 
                onClick={() => setSelectedIndex((prev) => (prev - 1 + employees.length) % employees.length)}
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group"
            >
                <ChevronLeft className="w-8 h-8 text-white/50 group-hover:text-white group-hover:scale-110" />
            </button>
            <button 
                onClick={() => setSelectedIndex((prev) => (prev + 1) % employees.length)}
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all group"
            >
                <ChevronRight className="w-8 h-8 text-white/50 group-hover:text-white group-hover:scale-110" />
            </button>
        </div>
      </div>

      {/* Bottom Carousel */}
      <div className="relative z-20 w-full max-w-4xl px-12">
        <div className="flex items-center justify-center gap-4 overflow-visible">
            {employees.map((emp, index) => {
                const isActive = index === selectedIndex;
                const offset = index - selectedIndex;
                
                return (
                    <motion.div 
                        key={emp.id}
                        onClick={() => setSelectedIndex(index)}
                        animate={{ 
                            scale: isActive ? 1.2 : 0.8,
                            opacity: isActive ? 1 : 0.4,
                            x: offset * 20,
                            zIndex: isActive ? 50 : 10
                        }}
                        className={`relative w-24 h-32 border-4 cursor-pointer transition-colors overflow-hidden group shadow-2xl ${
                            isActive ? 'border-yellow-500 bg-slate-800' : 'border-white/10 bg-slate-900 hover:border-white/30'
                        }`}
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent z-10" />
                        
                        <div className="flex items-center justify-center h-full p-2">
                             <CharacterSprite 
                                spriteBase={emp.spriteBase}
                                direction="south"
                                size="xl"
                             />
                        </div>

                        {isActive && (
                            <motion.div 
                                layoutId="selector"
                                className="absolute inset-0 border-4 border-yellow-500/50 z-20"
                            />
                        )}

                        <div className="absolute bottom-1 w-full text-center z-20">
                             <p className="text-[6px] font-black uppercase text-white truncate px-1">{emp.name}</p>
                        </div>
                    </motion.div>
                );
            })}
        </div>

        <div className="mt-12 flex justify-center gap-6">
            <button 
                onClick={onBack}
                className="px-10 py-3 bg-slate-800 border border-white/20 text-white/50 font-black text-[10px] uppercase hover:text-white hover:border-white transition-all tracking-widest"
            >
                Log Out
            </button>
            <button 
                onClick={() => onSelect(employees[selectedIndex].id)}
                className="px-16 py-3 bg-green-600 text-white font-black text-[10px] uppercase shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:bg-green-500 hover:scale-105 active:scale-95 transition-all tracking-[0.4em] flex items-center gap-3"
            >
                <Play className="w-4 h-4 fill-current" />
                Play Game
            </button>
        </div>
      </div>
    </div>
    </div>
  );
}
