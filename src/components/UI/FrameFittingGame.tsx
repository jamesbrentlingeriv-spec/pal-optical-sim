import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Ruler } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';

interface FrameFittingGameProps {
  patientName: string;
  targetMeasurements: {
    frameWidth: number;
    bridgeWidth: number;
    templeLength: number;
  };
  onClose: () => void;
  onComplete: () => void;
}

export const FrameFittingGame: React.FC<FrameFittingGameProps> = ({ 
  patientName, 
  targetMeasurements, 
  onClose, 
  onComplete 
}) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 700) : 1;

  const [measurements, setMeasurements] = useState({
    frameWidth: 50,
    bridgeWidth: 50,
    templeLength: 50,
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const diffs = useMemo(() => ({
    frame: Math.abs(measurements.frameWidth - targetMeasurements.frameWidth),
    bridge: Math.abs(measurements.bridgeWidth - targetMeasurements.bridgeWidth),
    temple: Math.abs(measurements.templeLength - targetMeasurements.templeLength),
  }), [measurements, targetMeasurements]);

  const isPerfectFit = diffs.frame < 5 && diffs.bridge < 5 && diffs.temple < 5;

  const handleFinish = () => {
    if (isPerfectFit) {
      setShowSuccess(true);
      setTimeout(onComplete, 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-110 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      <div 
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        className="relative w-full max-w-4xl bg-[#1a1a1a] border-8 border-white shadow-[16px_16px_0_0_rgba(59,130,246,0.5)] p-8 pixel-border overflow-hidden"
      >
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,2px_100%]"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-60"
        >
          <X size={32} />
        </button>

        <div className="flex flex-col md:flex-row gap-8 relative z-10">
          {/* Fitting Lab Visual */}
          <div className="flex-1 bg-black border-4 border-white aspect-square relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Patient Placeholder */}
            <div className="w-64 h-64 bg-slate-800 rounded-full border-4 border-slate-700 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-slate-700/50 rounded-full blur-xl" />
                {/* Eyes */}
                <div className="absolute top-28 left-16 w-8 h-4 bg-slate-900 rounded-full" />
                <div className="absolute top-28 right-16 w-8 h-4 bg-slate-900 rounded-full" />
            </div>

            {/* The Glasses Frames (Visualized based on state) */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                    animate={{ 
                        scale: 0.8 + (measurements.frameWidth / 200),
                    }}
                    className="relative flex items-center justify-center"
                >
                    {/* Left Eye Wire */}
                    <div 
                        className="border-4 border-blue-400 rounded-[20%] relative"
                        style={{ 
                            width: 60 + measurements.frameWidth / 2, 
                            height: 50,
                            marginRight: measurements.bridgeWidth / 4 
                        }}
                    >
                         <div className="absolute top-0 right-0 w-8 h-1 bg-white/20 -rotate-45" />
                    </div>

                    {/* Bridge */}
                    <div 
                        className="h-2 bg-blue-400"
                        style={{ width: 10 + measurements.bridgeWidth / 2 }}
                    />

                    {/* Right Eye Wire */}
                    <div 
                        className="border-4 border-blue-400 rounded-[20%] relative"
                        style={{ 
                            width: 60 + measurements.frameWidth / 2, 
                            height: 50,
                            marginLeft: measurements.bridgeWidth / 4 
                        }}
                    >
                         <div className="absolute top-0 right-0 w-8 h-1 bg-white/20 -rotate-45" />
                    </div>

                    {/* Temple Length Visual (Side View Indicator for the fitter) */}
                    <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4">
                        <div className="text-[10px] text-blue-400 font-black tracking-widest uppercase">Temple Alignment</div>
                        <div className="w-32 h-2 bg-slate-800 border border-slate-600 rounded-full overflow-hidden">
                            <motion.div 
                                animate={{ x: (measurements.templeLength - 50) + '%' }}
                                className="w-4 h-full bg-blue-400" 
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Alignment Guides */}
            <div className="absolute left-4 top-4 text-[10px] text-blue-400/50 font-black uppercase tracking-tighter">
                FITTING_LAB_V01.0
            </div>
          </div>

          {/* Controls */}
          <div className="w-full md:w-80 flex flex-col gap-6">
            <div className="border-b-4 border-white pb-4">
              <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Final Fitting</h2>
              <p className="text-blue-400 font-black text-xs uppercase tracking-widest mt-1">Patient: {patientName}</p>
            </div>

            <div className="flex flex-col gap-8">
              {/* Frame Width */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={14} className="text-blue-400" />
                    Frame Width
                  </label>
                  <span className={`text-xl font-black ${diffs.frame < 5 ? 'text-green-400' : 'text-white'}`}>
                    {measurements.frameWidth}mm
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={measurements.frameWidth}
                  onChange={(e) => setMeasurements(m => ({ ...m, frameWidth: parseInt(e.target.value) }))}
                  className="w-full h-4 bg-slate-800 appearance-none cursor-pointer border-2 border-white accent-blue-500"
                />
              </div>

              {/* Bridge Fit */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={14} className="text-blue-400" />
                    Bridge Size
                  </label>
                  <span className={`text-xl font-black ${diffs.bridge < 5 ? 'text-green-400' : 'text-white'}`}>
                    {measurements.bridgeWidth}mm
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={measurements.bridgeWidth}
                  onChange={(e) => setMeasurements(m => ({ ...m, bridgeWidth: parseInt(e.target.value) }))}
                  className="w-full h-4 bg-slate-800 appearance-none cursor-pointer border-2 border-white accent-blue-500"
                />
              </div>

              {/* Temple Length */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={14} className="text-blue-400" />
                    Temple Length
                  </label>
                  <span className={`text-xl font-black ${diffs.temple < 5 ? 'text-green-400' : 'text-white'}`}>
                    {measurements.templeLength}mm
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={measurements.templeLength}
                  onChange={(e) => setMeasurements(m => ({ ...m, templeLength: parseInt(e.target.value) }))}
                  className="w-full h-4 bg-slate-800 appearance-none cursor-pointer border-2 border-white accent-blue-500"
                />
              </div>
            </div>

            <button 
              onClick={handleFinish}
              disabled={!isPerfectFit}
              className={`mt-4 w-full py-6 font-black text-xl uppercase tracking-tighter border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all ${
                isPerfectFit 
                ? 'bg-blue-600 text-white hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)]' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isPerfectFit ? 'COMPLETE FITTING' : 'ADJUST FOR PERFECT FIT'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-100 flex items-center justify-center bg-blue-600 border-8 border-white p-12 text-center"
            >
              <div className="flex flex-col items-center gap-6">
                <CheckCircle2 size={120} className="text-white" />
                <h3 className="text-6xl font-black italic text-white uppercase tracking-tighter">Perfect Fit!</h3>
                <p className="text-white font-bold opacity-80 uppercase tracking-widest">The patient loves their new look.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
