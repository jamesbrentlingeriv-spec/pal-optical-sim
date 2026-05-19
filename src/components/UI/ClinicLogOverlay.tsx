import React from "react";
import { motion } from "motion/react";
import { INCOMPLETE_TASKS } from "../../constants";

interface ClinicLogOverlayProps {
  revenue: number;
  tasks: { [key: string]: boolean };
  onClose: () => void;
}

function getIncompleteTasks(tasks: { [key: string]: boolean }) {
  return INCOMPLETE_TASKS.filter((t) => !tasks[t.stateKey]);
}

const ClinicLogOverlay: React.FC<ClinicLogOverlayProps> = ({
  revenue,
  tasks,
  onClose,
}) => {
  const incompleteTasks = getIncompleteTasks(tasks);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-200 bg-black/70"
        onClick={onClose}
      />

      {/* Overlay panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed inset-0 z-210 flex items-center justify-center pointer-events-none"
      >
        <div
          className="pointer-events-auto bg-black border-8 border-white p-6 shadow-[16px_16px_0_0_rgba(0,0,0,1)] w-105 max-w-[90vw] pixel-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b-4 border-blue-500 pb-3">
            <div>
              <div className="text-[10px] text-blue-400 font-black tracking-[4px] uppercase">
                CLINIC LOG
              </div>
              <div className="text-[20px] font-black text-white mt-1">
                Daily Report
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-red-600 text-white px-4 py-2 border-2 border-white font-black text-[10px] hover:bg-red-500 transition-colors"
            >
              CLOSE [X]
            </button>
          </div>

          {/* Total Earnings */}
          <div className="mb-6 bg-slate-900 border-2 border-yellow-500 p-4">
            <div className="text-[8px] text-yellow-400 font-black tracking-[3px] uppercase mb-1">
              Total Store Earnings
            </div>
            <div className="text-[32px] font-black text-yellow-300 font-mono tracking-tight">
              ${revenue.toLocaleString()}
            </div>
          </div>

          {/* Incomplete Tasks */}
          <div>
            <div className="text-[8px] text-red-400 font-black tracking-[3px] uppercase mb-3">
              Incomplete Tasks ({incompleteTasks.length})
            </div>
            {incompleteTasks.length === 0 ? (
              <div className="text-[12px] text-green-400 font-black italic">
                ✓ All tasks completed! Great work!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {incompleteTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 bg-red-900/40 border-2 border-red-800 p-3"
                  >
                    <div className="w-4 h-4 bg-red-600 border-2 border-red-400 rounded-sm flex items-center justify-center">
                      <div className="w-2 h-2 bg-red-300 rounded-sm" />
                    </div>
                    <span className="text-[12px] font-black text-red-200">
                      {task.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t-2 border-white/20">
            <div className="text-[6px] text-slate-500 font-black tracking-[2px] uppercase">
              Press [ESC] or click outside to close
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ClinicLogOverlay;