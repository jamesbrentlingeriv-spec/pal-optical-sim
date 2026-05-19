import React from "react";
import { motion } from "motion/react";
import { Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { useWindowSize } from "../../hooks/useWindowSize";

interface OptionsProps {
  settings: {
    volume: number;
    muted: boolean;
  };
  onUpdate: (settings: { volume: number; muted: boolean }) => void;
  onBack: () => void;
  key?: string;
}

export default function Options({ settings, onUpdate, onBack }: OptionsProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 500) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center h-full bg-[#1a1a1a] px-4 relative overflow-hidden"
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
        className="relative"
      >
        <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,2px_100%]"></div>

        <div className="bg-black border-4 border-white p-8 md:p-12 shadow-[12px_12px_0_0_rgba(59,130,246,1)] w-full max-w-md pixel-border">
          <div className="flex items-center gap-6 mb-12 border-b-4 border-white pb-6">
            <button
              onClick={onBack}
              className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
              OPTIONS_MGMT
            </h2>
          </div>

          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
                  MASTER_VOL
                </label>
                <span className="text-white text-[8px] font-black">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <div className="relative h-6 flex items-center">
                <div className="absolute inset-0 bg-white/20 border-2 border-white/10" />
                <div
                  className="absolute inset-y-0 left-0 bg-blue-500 shadow-[2px_0_0_0_white]"
                  style={{ width: `${settings.volume * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.volume}
                  onChange={(e) =>
                    onUpdate({
                      ...settings,
                      volume: parseFloat(e.target.value),
                    })
                  }
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
                  SFX_CHANNEL_01
                </label>
                <span className="text-white text-[8px] font-black">85%</span>
              </div>
              <div className="relative h-6 flex items-center">
                <div className="absolute inset-0 bg-white/20 border-2 border-white/10" />
                <div
                  className="absolute inset-y-0 left-0 bg-yellow-500 shadow-[2px_0_0_0_white]"
                  style={{ width: "85%" }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-4 border-white/20 hover:border-white transition-all">
              <div className="flex items-center gap-3">
                <Volume2
                  className={`w-4 h-4 ${settings.muted ? "text-red-500" : "text-blue-500"}`}
                />
                <span className="font-black text-white uppercase text-[8px] tracking-widest">
                  MUTE_BG_MUSIC
                </span>
              </div>
              <button
                onClick={() =>
                  onUpdate({ ...settings, muted: !settings.muted })
                }
                className={`w-12 h-6 border-2 border-white transition-all p-1 ${settings.muted ? "bg-red-600" : "bg-green-600"}`}
              >
                <div
                  className={`h-full w-1/2 bg-white ${settings.muted ? "translate-x-full" : ""} transition-transform`}
                />
              </button>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full mt-12 py-6 bg-white text-black font-black hover:bg-blue-600 hover:text-white transition-all shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-[10px]"
          >
            SAVE_CHANGES
          </button>
        </div>
      </div>
    </motion.div>
  );
}
