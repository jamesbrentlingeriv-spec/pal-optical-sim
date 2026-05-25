import React from "react";
import { motion } from "motion/react";
import { Briefcase, Coffee, ArrowLeft } from "lucide-react";
import { GameMode } from "../../types";

interface ModeSelectionProps {
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

export default function ModeSelection({ onSelect, onBack }: ModeSelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full bg-slate-900 relative overflow-hidden"
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,2px_100%]" />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-12 z-10"
      >
        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">
          Select Mode
        </h1>
        <p className="text-yellow-400/60 text-sm font-bold uppercase tracking-[4px]">
          Choose your simulation experience
        </p>
      </motion.div>

      <div className="flex gap-8 z-10">
        {/* Career Mode */}
        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(GameMode.CAREER)}
          className="group relative w-72 h-80 bg-gradient-to-b from-blue-900 to-slate-900 border-4 border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0_0_rgba(59,130,246,0.3)] hover:shadow-[12px_12px_0_0_rgba(59,130,246,0.5)] transition-all"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-2">
              Career Mode
            </h2>
            <p className="text-blue-300/80 text-xs leading-relaxed">
              Full simulation with clock, patience timers, revenue tracking, penalties, and day/night cycle.
            </p>
          </div>
          <div className="absolute bottom-4 text-blue-400/40 text-[8px] font-black uppercase tracking-[4px]">
            9AM - 6PM · Revenue
          </div>
        </motion.button>

        {/* Free Mode */}
        <motion.button
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(GameMode.FREE)}
          className="group relative w-72 h-80 bg-gradient-to-b from-emerald-900 to-slate-900 border-4 border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0_0_rgba(16,185,129,0.3)] hover:shadow-[12px_12px_0_0_rgba(16,185,129,0.5)] transition-all"
        >
          <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-wide mb-2">
              Free Mode
            </h2>
            <p className="text-emerald-300/80 text-xs leading-relaxed">
              Clock frozen at 9AM. No patience limits, no penalties, no revenue tracking. Explore freely.
            </p>
          </div>
          <div className="absolute bottom-4 text-emerald-400/40 text-[8px] font-black uppercase tracking-[4px]">
            NO LIMITS · SANDBOX
          </div>
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        className="mt-10 z-10 flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </motion.button>
    </motion.div>
  );
}