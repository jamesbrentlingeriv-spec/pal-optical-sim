
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, RotateCw, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';

interface LensometerProps {
  onClose: () => void;
}

export default function Lensometer({ onClose }: LensometerProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 700) : 1;
  const [rotation, setRotation] = useState(0);
  const [targetRotation] = useState(Math.floor(Math.random() * 360));
  
  // Power state (-4.00 to +4.00 diopters)
  const [power, setPower] = useState(0);
  const [targetPower] = useState(() => (Math.random() * 8 - 4).toFixed(2));
  
  const [isAligned, setIsAligned] = useState(false);

  useEffect(() => {
    const rotDiff = Math.abs((rotation % 180) - (targetRotation % 180));
    const powDiff = Math.abs(power - parseFloat(targetPower));
    
    // Aligned if within 3 degrees and 0.12 diopters
    if (rotDiff < 3 && powDiff < 0.15) {
      setIsAligned(true);
    } else {
      setIsAligned(false);
    }
  }, [rotation, targetRotation, power, targetPower]);

  // Calculate blur based on power difference
  const powerDiff = Math.abs(power - parseFloat(targetPower));
  const blurAmount = Math.min(10, powerDiff * 5); // Max 10px blur

  const handlePowerWheel = (direction: number) => {
    setPower(prev => parseFloat((prev + direction * 0.25).toFixed(2)));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <div 
        style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
        className="bg-black border-4 border-white p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] w-full max-w-4xl relative overflow-hidden pixel-border"
      >
        {/* Machine texture overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none wall-texture" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-white hover:text-red-500 transition-colors z-50 bg-black border-2 border-white"
        >
          <X className="w-8 h-8" />
        </button>

        <div className="text-center mb-10 relative">
          <h2 className="text-2xl font-black mb-2 text-white italic underline decoration-blue-500 decoration-4">PAL-9000 ANALYZER</h2>
          <p className="text-blue-400 text-[8px] uppercase tracking-widest animate-pulse">Auto-Focus Active</p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* MACHINE GRAPHIC */}
          <div className="hidden xl:block w-48 h-64 relative border-4 border-white overflow-hidden bg-white/5">
             <img 
                src="/objects/lensometer.png" 
                className="w-full h-full object-contain pixelated p-4 opacity-50" 
                alt="Lensometer Model"
             />
             <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
             <div className="absolute top-2 left-2 text-[6px] font-black text-white/40 uppercase">Ref: Model_9000</div>
          </div>

          {/* POWER WHEEL (Left side) */}
          <div className="flex flex-col items-center gap-4">
             <div className="text-[8px] font-black text-slate-500 uppercase">Power</div>
             <button 
                onClick={() => handlePowerWheel(1)}
                className="p-4 bg-black border-4 border-white text-white hover:bg-slate-900 transition-colors"
             >
                <ChevronUp className="w-8 h-8" />
             </button>
             
             {/* The actual Wheel/Drum */}
             <div className="relative w-24 h-48 bg-black border-4 border-white overflow-hidden shadow-inner flex flex-col items-center justify-center group">
                 <div className="absolute inset-x-0 h-4 bg-white/20 top-0 z-10 pointer-events-none shadow-[0_4px_0_0_black]" />
                 <div className="absolute inset-x-0 h-4 bg-white/20 bottom-0 z-10 pointer-events-none shadow-[0_-4px_0_0_black]" />
                 
                 {/* Moving scale */}
                 <motion.div 
                    animate={{ y: -power * 40 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                    className="flex flex-col gap-6"
                 >
                    {[-4.00, -3.50, -3.00, -2.50, -2.00, -1.50, -1.00, -0.50, 0, 0.50, 1.00, 1.50, 2.00, 2.50, 3.00, 3.50, 4.00].map(val => (
                        <div key={val} className={`text-sm font-black ${Math.abs(power - val) < 0.1 ? 'text-blue-400 scale-125' : 'text-slate-700'}`}>
                            {val > 0 ? '+' : ''}{val.toFixed(2)}
                        </div>
                    ))}
                 </motion.div>
                 
                 {/* Center indicator */}
                 <div className="absolute inset-x-0 h-1 bg-blue-500/50 top-1/2 -translate-y-1/2 z-20 shadow-[0_0_10px_blue]" />
             </div>

             <button 
                onClick={() => handlePowerWheel(-1)}
                className="p-4 bg-black border-4 border-white text-white hover:bg-slate-900 transition-colors"
             >
                <ChevronDown className="w-8 h-8" />
             </button>
             
             <div className="mt-2 text-xl font-bold text-blue-400 bg-black px-4 py-2 border-2 border-blue-900">
                {power > 0 ? '+' : ''}{power.toFixed(2)}
             </div>
          </div>

          {/* EYEPIECE VIEW (Center) */}
          <div className="relative group">
            <div className="relative w-80 h-80 bg-black border-12 border-white shadow-[0_0_0_4px_black,0_0_50px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                {/* RETICLE GRID */}
                <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="w-full h-1 bg-white/20" />
                    <div className="h-full w-1 bg-white/20 absolute" />
                    <div className="w-64 h-64 border-4 border-white/20" />
                    <div className="w-48 h-48 border-4 border-white/20" />
                </div>

                {/* TARGET MIRES (The Cross) - Pixelated Blur Effect */}
                <div 
                    className="absolute w-full h-full flex items-center justify-center transition-all duration-300 pointer-events-none pixelated"
                    style={{ 
                        transform: `rotate(${targetRotation}deg)`,
                        filter: `blur(${blurAmount}px) contrast(200%)`,
                        opacity: isAligned ? 1 : 0.4
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <div className="w-72 h-2 bg-green-500 shadow-[0_0_20px_green]" />
                        <div className="w-72 h-2 bg-green-500 shadow-[0_0_20px_green]" />
                        <div className="w-72 h-2 bg-green-500 shadow-[0_0_20px_green]" />
                    </div>
                </div>

                {/* ROTATING PRISM (Player Controlled Axis) */}
                <div 
                  className="absolute w-full h-full flex items-center justify-center pointer-events-none"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="flex gap-4 rotate-90">
                      <div className="h-72 w-1 bg-green-300/40 shadow-[0_0_10px_green]" />
                      <div className="h-72 w-1 bg-green-300/40 shadow-[0_0_10px_green]" />
                      <div className="h-72 w-1 bg-green-300/40 shadow-[0_0_10px_green]" />
                  </div>
                </div>

                {/* Aligned Flare - Big dramatic completion effect */}
                {isAligned && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.6, 0.3, 0.6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute w-full h-full bg-green-500 z-20"
                        />
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                        >
                            <div className="text-green-400 text-6xl font-black drop-shadow-[0_0_30px_green] animate-pulse">
                                ALIGNED
                            </div>
                        </motion.div>
                    </>
                )}

                {/* CRT Reflections */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%]" />
            </div>
          </div>

          {/* AXIS WHEEL (Right side) */}
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="text-[8px] font-black text-slate-500 uppercase mb-2 tracking-tighter">Alignment</div>
              <div className={`text-4xl font-black ${isAligned ? 'text-green-400' : 'text-blue-500'}`}>
                {Math.round(rotation % 180)}°
              </div>
            </div>

            <div className="relative group p-4 bg-black border-4 border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
              <button 
                onMouseDown={(e) => {
                  const onMouseMove = (moveEvent: MouseEvent) => {
                    setRotation(prev => prev + moveEvent.movementX * 1);
                  };
                  const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                  };
                  window.addEventListener('mousemove', onMouseMove);
                  window.addEventListener('mouseup', onMouseUp);
                }}
                onTouchStart={(e) => {
                  const initialX = e.touches[0].clientX;
                  let lastX = initialX;
                  const onTouchMove = (moveEvent: TouchEvent) => {
                    const currentX = moveEvent.touches[0].clientX;
                    setRotation(prev => prev + (currentX - lastX) * 1);
                    lastX = currentX;
                  };
                  const onTouchEnd = () => {
                    window.removeEventListener('touchmove', onTouchMove);
                    window.removeEventListener('touchend', onTouchEnd);
                  };
                  window.addEventListener('touchmove', onTouchMove);
                  window.addEventListener('touchend', onTouchEnd);
                }}
                className="relative w-40 h-40 bg-black border-4 border-white flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-900 overflow-hidden"
              >
                <div className="w-full h-full absolute flex items-center justify-center"
                  style={{ transform: `rotate(${rotation * 2}deg)` }}
                >
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute w-4 h-12 bg-white" style={{ transform: `rotate(${i * 45}deg) translateY(-60px)` }} />
                    ))}
                </div>
                <RotateCw className="w-10 h-10 text-white animate-spin-slow" />
              </button>
            </div>
            
            <p className="text-[6px] text-slate-500 uppercase font-black">Drag Wheel</p>
          </div>
        </div>

        {/* HUD FOOTER */}
        <div className="mt-12 flex justify-between items-end border-t-4 border-white pt-8">
            <div className="space-y-2">
                <div className="text-[8px] font-black text-slate-600 uppercase">Status</div>
                <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${isAligned ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="text-[8px] text-white">
                        {isAligned ? 'READY' : 'SCANNING...'}
                    </div>
                </div>
            </div>

            {isAligned && (
              <motion.button 
                initial={{ scale: 0.9 }}
                animate={{ scale: [0.9, 1, 0.9] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                onClick={onClose}
                className="px-8 py-4 bg-white text-black font-black hover:bg-slate-200 transition-all shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex items-center gap-3 border-4 border-black"
              >
                <CheckCircle2 className="w-6 h-6" />
                VERIFY
              </motion.button>
            )}

            <div className="text-right text-[6px] text-slate-700 leading-relaxed uppercase">
                Device: PAL-9000<br/>
                Output: {Math.round(rotation)}, {power.toFixed(2)}<br/>
                System: OK
            </div>
        </div>
      </div>
    </motion.div>
  );
}
