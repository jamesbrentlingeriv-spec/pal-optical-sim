import React from "react";
import { motion } from "motion/react";
import { DollarSign, AlertTriangle, TrendingUp, ArrowRight, Home } from "lucide-react";
import { DayFinancials } from "../../types";

interface DayEndOverlayProps {
  cashRevenue: number;
  cardRevenue: number;
  penalties: number;
  onNextDay: () => void;
  onReturnToMenu: () => void;
}

export default function DayEndOverlay({
  cashRevenue,
  cardRevenue,
  penalties,
  onNextDay,
  onReturnToMenu,
}: DayEndOverlayProps) {
  const totalRevenue = cashRevenue + cardRevenue;
  const netProfit = totalRevenue - penalties;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 bg-black/90 backdrop-blur-xl flex items-center justify-center p-8"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-slate-950 border-4 border-yellow-500 shadow-[0_0_60px_rgba(234,179,8,0.3)] w-full max-w-lg rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-yellow-500 p-6 text-center">
          <h1 className="text-3xl font-black text-slate-950 uppercase tracking-tighter">
            6:00 PM - Day Complete
          </h1>
          <p className="text-slate-800/60 text-xs font-bold tracking-widest mt-1">
            FINANCIAL SUMMARY
          </p>
        </div>

        {/* Financial Breakdown */}
        <div className="p-8 space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold">Cash Revenue</div>
                <div className="text-lg font-black text-green-400">${cashRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold">Card Revenue</div>
                <div className="text-lg font-black text-blue-400">${cardRevenue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-900/50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold">Penalties Accrued</div>
                <div className="text-lg font-black text-red-400">-${penalties.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-slate-800 pt-4 mt-4">
            <div className="flex justify-between items-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold">Total Revenue</div>
                  <div className="text-lg font-black text-yellow-400">${totalRevenue.toFixed(2)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 font-bold">Net Profit</div>
                <div className={`text-2xl font-black ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  ${netProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextDay}
            className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[4px_4px_0_0_rgba(234,179,8,0.3)]"
          >
            <ArrowRight className="w-5 h-5" />
            Start Next Day
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnToMenu}
            className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-sm rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <Home className="w-5 h-5" />
            Return to Menu
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}