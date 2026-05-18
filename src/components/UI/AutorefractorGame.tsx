import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Zap } from 'lucide-react';

interface AutorefractorGameProps {
  onClose: () => void;
}

const VIEWFINDER_SIZE = 300;
const THRESHOLD = 30;
const BLUR_LABELS = ['??', 'FUZZY', 'SOFT', 'FOCUS', 'CRISP', 'LOCKED'];

export const AutorefractorGame: React.FC<AutorefractorGameProps> = ({ onClose }) => {
  const [targetPos, setTargetPos] = useState({ x: 150, y: 150 });
  const [crosshairPos, setCrosshairPos] = useState({ x: 150, y: 150 });
  const [phase, setPhase] = useState<'ALIGN' | 'MEASURING' | 'DONE'>('ALIGN');
  const [fogLevel, setFogLevel] = useState(5);
  const [blurLabel, setBlurLabel] = useState('??');
  const [measureCount, setMeasureCount] = useState(0);
  const [beepActive, setBeepActive] = useState(false);
  const [results, setResults] = useState<{ sph: string; cyl: string; axis: number } | null>(null);
  const trueRx = useRef({
    sph: (Math.random() * 6 - 4).toFixed(2),
    cyl: (Math.random() * 2 - 1.5).toFixed(2),
    axis: Math.floor(Math.random() * 180),
  });
  const measureReadings = useRef<number[]>([]);
  const keysPressed = useRef<Set<string>>(new Set());

  // Balloon drift
  useEffect(() => {
    if (phase !== 'ALIGN') return;
    const driftInterval = setInterval(() => {
      setTargetPos(prev => {
        const dx = (Math.random() - 0.5) * 6;
        const dy = (Math.random() - 0.5) * 4;
        return {
          x: Math.max(20, Math.min(VIEWFINDER_SIZE - 20, prev.x + dx)),
          y: Math.max(40, Math.min(VIEWFINDER_SIZE - 40, prev.y + dy)),
        };
      });
    }, 100);
    return () => clearInterval(driftInterval);
  }, [phase]);

  // Crosshair movement
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setCrosshairPos(prev => {
        let nx = prev.x;
        let ny = prev.y;
        const speed = 3;
        if (keysPressed.current.has('w') || keysPressed.current.has('ArrowUp')) ny -= speed;
        if (keysPressed.current.has('s') || keysPressed.current.has('ArrowDown')) ny += speed;
        if (keysPressed.current.has('a') || keysPressed.current.has('ArrowLeft')) nx -= speed;
        if (keysPressed.current.has('d') || keysPressed.current.has('ArrowRight')) nx += speed;
        return {
          x: Math.max(0, Math.min(VIEWFINDER_SIZE, nx)),
          y: Math.max(0, Math.min(VIEWFINDER_SIZE, ny)),
        };
      });
    }, 1000 / 60);
    return () => clearInterval(moveInterval);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
    };
    const handleUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ' && phase === 'ALIGN') {
        e.preventDefault();
        startMeasurement();
      }
    };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
      window.removeEventListener('keypress', handleKeyPress);
    };
  }, [phase]);

  const dist = Math.sqrt(
    Math.pow(crosshairPos.x - targetPos.x, 2) + Math.pow(crosshairPos.y - targetPos.y, 2)
  );
  const isAligned = dist <= THRESHOLD;

  const startMeasurement = () => {
    measureReadings.current = [];
    setMeasureCount(0);
    setPhase('MEASURING');
    setFogLevel(5);
    setBlurLabel('??');

    let level = 5;
    const fogInterval = setInterval(() => {
      level--;
      if (level >= 0) {
        setFogLevel(level);
        setBlurLabel(BLUR_LABELS[level]);
        setBeepActive(true);
        setTimeout(() => setBeepActive(false), 150);

        const d = Math.sqrt(
          Math.pow(crosshairPos.x - targetPos.x, 2) + Math.pow(crosshairPos.y - targetPos.y, 2)
        );
        measureReadings.current.push(d);
        setMeasureCount(prev => prev + 1);
      } else {
        clearInterval(fogInterval);
        const avgErr = measureReadings.current.reduce((a, b) => a + b, 0) / measureReadings.current.length;
        const accuracy = Math.max(0, 1 - avgErr / 100);
        const sphNoise = (1 - accuracy) * 2;
        const cylNoise = (1 - accuracy) * 1.5;
        const axisNoise = (1 - accuracy) * 30;

        setResults({
          sph: (parseFloat(trueRx.current.sph) + (Math.random() - 0.5) * sphNoise * 2).toFixed(2),
          cyl: (parseFloat(trueRx.current.cyl) + (Math.random() - 0.5) * cylNoise * 2).toFixed(2),
          axis: Math.round((trueRx.current.axis + (Math.random() - 0.5) * axisNoise * 2) % 180),
        });
        setPhase('DONE');
      }
    }, 800);
  };

  const ringColor = isAligned ? '#22c55e' : dist < 60 ? '#eab308' : '#ef4444';

  return (
    <div className="fixed inset-0 z-300 bg-black/95 flex items-center justify-center p-4 font-mono">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1a2e] border-8 border-slate-700 rounded-xl p-6 max-w-2xl w-full shadow-[0_0_80px_rgba(0,0,255,0.3)] relative"
      >
        <div className="flex items-center justify-between mb-4 border-b-2 border-slate-600 pb-2">
          <div className="text-[#00ff88] text-xs font-black tracking-[4px] animate-pulse">
            AUTO-REFRACTOR 8000
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          {/* Viewfinder */}
          <div
            className="relative bg-[#0a0a1a] border-4 border-slate-600 rounded-lg overflow-hidden"
            style={{ width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE }}
          >
            {/* Sky */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, #1a3a5c 0%, #2d5a87 30%, #5b8c5a 60%, #8b7355 75%, #6b5b3a 100%)' }}
            />
            {/* Road */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute"
                  style={{
                    bottom: `${i * 12}px`, left: '50%', transform: 'translateX(-50%)',
                    width: `${40 + i * 25}%`, maxWidth: `${60 + i * 20}px`, height: '3px',
                    backgroundColor: i < 3 ? '#9b8c6a' : i < 5 ? '#7a6b4a' : '#5a4b2a',
                    opacity: 1 - i * 0.12,
                  }}
                />
              ))}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-yellow-400/60"
                    style={{ width: `${4 + i * 3}px`, height: `${6 + i * 4}px`, opacity: 1 - i * 0.15 }}
                  />
                ))}
              </div>
            </div>

            {/* Balloon */}
            <div className="absolute transition-all duration-100"
              style={{ left: targetPos.x - 16, top: targetPos.y - 28, filter: `blur(${fogLevel}px)` }}
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-10 rounded-full"
                  style={{ background: 'linear-gradient(to bottom, #ef4444 0%, #dc2626 30%, #b91c1c 50%, #dc2626 70%, #ef4444 100%)', boxShadow: 'inset 4px 0 0 #991b1b, inset -4px 0 0 #991b1b' }}
                />
                <div className="w-6 h-3 bg-amber-800 border-t-2 border-amber-600 -mt-1" />
                <div className="absolute top-10 left-1 w-0.5 h-2 bg-amber-600 rotate-[-20deg]" />
                <div className="absolute top-10 right-1 w-0.5 h-2 bg-amber-600 rotate-20" />
              </div>
            </div>

            {/* Crosshair */}
            <div className="absolute pointer-events-none z-20" style={{ left: crosshairPos.x - 16, top: crosshairPos.y - 16, width: 32, height: 32 }}>
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#00ff88]" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#00ff88]" />
              <div className="absolute inset-0 border-2 border-[#00ff88]/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#00ff88]" />
            </div>

            {/* Alignment ring */}
            <div className="absolute pointer-events-none z-10"
              style={{
                left: targetPos.x - 25, top: targetPos.y - 25, width: 50, height: 50,
                borderRadius: '50%', border: `2px solid ${ringColor}`, opacity: 0.6, transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Data panel */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="bg-[#0a0a1a] border-2 border-slate-600 rounded p-3">
              <div className="text-[10px] text-slate-400 mb-2 tracking-widest">STATUS</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  phase === 'DONE' ? 'bg-green-400' : phase === 'MEASURING' ? 'bg-yellow-400 animate-pulse' : isAligned ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className={`text-sm font-bold ${beepActive ? 'text-yellow-400' : 'text-[#00ff88]'}`}>
                  {phase === 'DONE' ? 'COMPLETE' : phase === 'MEASURING' ? 'MEASURING' : isAligned ? 'ALIGNED' : 'DRIFTING'}
                </span>
                {beepActive && <span className="text-yellow-400 text-xs animate-bounce">BEEP!</span>}
              </div>
            </div>

            <div className="bg-[#0a0a1a] border-2 border-slate-600 rounded p-3 flex-1">
              <div className="text-[10px] text-slate-400 mb-2 tracking-widest">READINGS</div>
              {results ? (
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400 text-xs">SPH:</span><span className="text-[#00ff88] font-bold">{results.sph}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 text-xs">CYL:</span><span className="text-[#00ff88] font-bold">{results.cyl}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400 text-xs">AXIS:</span><span className="text-[#00ff88] font-bold">{results.axis}°</span></div>
                  <div className="flex justify-between border-t border-slate-600 pt-2 mt-2"><span className="text-slate-400 text-xs">BLUR:</span><span className="text-yellow-400 font-bold">{blurLabel}</span></div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">
                  <div>SPH: --.--</div><div>CYL: --.--</div><div>AXIS: ---°</div><div className="mt-2">BLUR: {blurLabel}</div>
                </div>
              )}
              <div className="mt-3 text-[8px] text-slate-600">ALIGN: {dist.toFixed(0)}px | READS: {measureCount}/6</div>
            </div>

            <div className="bg-[#0a0a1a] border-2 border-slate-600 rounded p-3">
              <div className="text-[8px] text-slate-500 mb-1">CONTROLS</div>
              <div className="flex gap-4 text-[9px] text-slate-400">
                <span>WASD: AIM</span>
                {phase === 'ALIGN' && <span>SPACE: FIRE</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          {phase === 'ALIGN' && (
            <button onClick={startMeasurement}
              className={`px-8 py-3 rounded-lg font-black text-lg transition-all border-4 ${
                isAligned ? 'bg-green-500 border-green-700 text-white hover:bg-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)]' : 'bg-slate-700 border-slate-500 text-slate-300'
              }`}
            >
              <Zap className="w-5 h-5 inline mr-2" />
              START SCAN
            </button>
          )}
          {(phase === 'MEASURING' || phase === 'DONE') && (
            <button onClick={onClose}
              className="px-8 py-3 bg-slate-700 border-4 border-slate-500 text-white rounded-lg font-black hover:bg-slate-600"
            >
              RETURN
            </button>
          )}
        </div>

        {/* Completion receipt */}
        {phase === 'DONE' && results && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-4 bg-white text-black p-4 rounded-lg border-4 border-slate-300 font-mono"
          >
            <div className="text-[8px] text-slate-500 mb-1">PAL OPTICAL Rx RECEIPT</div>
            <div className="flex gap-8 text-sm font-bold">
              <div>SPH: {results.sph}</div>
              <div>CYL: {results.cyl}</div>
              <div>AXIS: {results.axis}°</div>
            </div>
            <div className="text-[6px] text-slate-400 mt-1">Generated by AUTO-REFRACTOR 8000</div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};