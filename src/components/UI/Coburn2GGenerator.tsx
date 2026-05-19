/**
 * Coburn / Optek 2G Generator Calibration & Surfacing Mini-Game
 * =============================================================
 *
 * Replicates the physical layout and workflow of a real Coburn 2G
 * generator used in optical laboratories for surfacing PAL lenses.
 *
 * Phases:
 *   0 – JOB INIT: Player enters a 4-digit job ticket → random shape assigned
 *   1 – DATA ENTRY: Type Sphere, Cylinder, Axis from work ticket within 8s
 *   2 – CUTTING CYCLE: 3x timing-bar hits in a green "sweet spot"
 *
 * Shape difficulty scaling (circle=easy, cat-eye=hardest) modifies the
 * timing bar speed and sweet-spot width in Phase 2.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

interface Coburn2GGeneratorProps {
  onClose: () => void;
}

// ─── SHAPE DEFINITIONS & DIFFICULTY SCALING ──────────────────────────────────

type LensShape = 'CIRCLE' | 'SQUARE' | 'RECTANGLE' | 'AVIATOR' | 'CAT-EYE';

interface ShapeDifficulty {
  /** Width of the green sweet-spot (px) on the timing bar */
  greenZoneWidth: number;
  /** Base speed multiplier for the timing indicator */
  speed: number;
  /** Added speed per consecutive hit */
  speedIncrement: number;
  /** Label shown on CRT */
  label: string;
}

const SHAPES: Record<LensShape, ShapeDifficulty> = {
  'CIRCLE':    { greenZoneWidth: 46, speed: 1.0, speedIncrement: 0.4, label: 'CIRCLE' },
  'SQUARE':    { greenZoneWidth: 34, speed: 1.4, speedIncrement: 0.5, label: 'SQUARE' },
  'RECTANGLE': { greenZoneWidth: 32, speed: 1.5, speedIncrement: 0.5, label: 'RECT'   },
  'AVIATOR':   { greenZoneWidth: 24, speed: 2.2, speedIncrement: 0.8, label: 'AVIATOR' },
  'CAT-EYE':   { greenZoneWidth: 20, speed: 2.6, speedIncrement: 0.9, label: 'CAT-EYE' },
};

const SHAPE_NAMES: LensShape[] = ['CIRCLE', 'SQUARE', 'RECTANGLE', 'AVIATOR', 'CAT-EYE'];

// SVG icons for each shape displayed on the CRT
const SHAPE_ICONS: Record<LensShape, string> = {
  'CIRCLE':    'M50,50 m-30,0 a30,30 0 1,0 60,0 a30,30 0 1,0 -60,0',
  'SQUARE':    'M20,20 L80,20 L80,80 L20,80 Z',
  'RECTANGLE': 'M15,25 L85,25 L85,75 L15,75 Z',
  'AVIATOR':   'M50,20 Q80,50 80,70 Q50,85 20,70 Q20,50 50,20 Z',
  'CAT-EYE':   'M20,50 Q40,20 50,50 Q60,20 80,50 Q60,80 50,50 Q40,80 20,50 Z',
};

// ─── WORK TICKET PRESCRIPTION GENERATION ─────────────────────────────────────

function generateWorkTicket(): { sphere: string; cylinder: string; axis: string } {
  // Realistic optical values
  const spheres   = ['-4.00', '-3.50', '-3.00', '-2.50', '-2.25', '-2.00', '-1.75', '-1.50', '-1.25', '-1.00', '-0.75', '-0.50', 'PL', '+0.50', '+1.00', '+1.50', '+2.00'];
  const cylinders = ['-2.25', '-2.00', '-1.75', '-1.50', '-1.25', '-1.00', '-0.75', '-0.50', '-0.25'];
  return {
    sphere:   spheres[Math.floor(Math.random() * spheres.length)],
    cylinder: cylinders[Math.floor(Math.random() * cylinders.length)],
    axis:     String(Math.floor(Math.random() * 180)).padStart(3, '0'),
  };
}

// ─── SIMPLE TONE GENERATORS (Web Audio API) ─────────────────────────────────

function playBeep(freq: number = 880, duration: number = 0.12) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) { /* silent fail */ }
}

function playFailBuzz() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 120;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (_) { /* silent fail */ }
}

// ─── FRONT-PANEL ROLLER COUNTER SVG ─────────────────────────────────────────

const RollerCounter: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div className="text-[5px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
    <div className="flex bg-black border border-slate-600 rounded overflow-hidden">
      {String(value).padStart(3, '0').split('').map((d, i) => (
        <div
          key={i}
          className="w-4 h-5 flex items-center justify-center bg-[#0a0a0a] text-[8px] font-mono font-bold text-white"
          style={{
            textShadow: '0 0 2px rgba(200,200,200,0.4)',
            borderRight: i < 2 ? '1px solid #222' : 'none',
          }}
        >
          {d}
        </div>
      ))}
    </div>
  </div>
);

// ─── THE MAIN COMPONENT ──────────────────────────────────────────────────────

export const Coburn2GGenerator: React.FC<Coburn2GGeneratorProps> = ({ onClose }) => {
  // ── Core game phase ──────────────────────────────────────────────────────
  type Phase =
    | 'JOB_INPUT'       // Entering 4-digit job number
    | 'SHOW_SHAPE'      // Screen shows the selected lens shape
    | 'DATA_ENTRY'      // Keying sphere/cylinder/axis within 8s
    | 'LOCKING'         // Chuck button pressed, locking animation
    | 'READY_CUT'       // Waiting for START press
    | 'CUTTING'         // Timing-bar mini-game (3 hits)
    | 'RESULT'          // Win / loss / partial result
    | 'FAILURE';        // Lab disaster

  const [phase, setPhase] = useState<Phase>('JOB_INPUT');

  // ── Job number ───────────────────────────────────────────────────────────
  const [jobNumber, setJobNumber] = useState('');

  // ── Selected shape (randomly chosen after job input) ─────────────────────
  const [shape, setShape] = useState<LensShape>('CIRCLE');
  const shapeDiff = SHAPES[shape];

  // ── Work ticket values ───────────────────────────────────────────────────
  const [workTicket, setWorkTicket] = useState(generateWorkTicket());

  // ── Data entry fields ────────────────────────────────────────────────────
  type DataField = 'sphere' | 'cylinder' | 'axis';
  const [currentField, setCurrentField] = useState<DataField>('sphere');
  const [dataInput, setDataInput]   = useState<Record<DataField, string>>({ sphere: '', cylinder: '', axis: '' });
  const [dataTimer, setDataTimer]   = useState<number | null>(null);
  const dataTimerRef    = useRef<number | null>(null);
  const [chuckActive, setChuckActive] = useState(false);

  // ── Cutting cycle ────────────────────────────────────────────────────────
  const [hitsRemaining, setHitsRemaining]       = useState(3);
  const [timingPos, setTimingPos]               = useState(50);     // 0-100 % across the bar
  const [timingDir, setTimingDir]               = useState(1);      // 1 = right, -1 = left
  const [currentSpeed, setCurrentSpeed]         = useState(shapeDiff.speed);
  const [greenZoneOffset, setGreenZoneOffset]   = useState(0);      // center of green zone (0-100%)
  const [hitResults, setHitResults]             = useState<('perfect' | 'ok' | 'miss' | 'crash')[]>([]);
  const [cuttingActive, setCuttingActive]       = useState(false);
  const [timingHitCount, setTimingHitCount]     = useState(0);
  const timingAnimRef = useRef<number>(0);

  // ── Sparks / cutting FX ─────────────────────────────────────────────────
  const [sparks, setSparks] = useState<{ x: number; y: number; life: number }[]>([]);

  // ── Result state ─────────────────────────────────────────────────────────
  const [score, setScore]             = useState(0);
  const [resultMessage, setResultMessage] = useState('');
  const [resultSubtext, setResultSubtext] = useState('');

  // ── Screen effects ───────────────────────────────────────────────────────
  const [screenShake, setScreenShake]       = useState(false);
  const [stopFlashing, setStopFlashing]     = useState(false);
  const [crtBlink, setCrtBlink]             = useState(true);
  const [spindleRevs, setSpindleRevs]       = useState(false);
  const [chuckAnimating, setChuckAnimating] = useState(false);
  const [countdownWarning, setCountdownWarning] = useState(false);

  // ── Refs for cleanup ─────────────────────────────────────────────────────
  const timerIntervalRef = useRef<number>(0);
  const keyHandlerRef   = useRef<((e: KeyboardEvent) => void) | null>(null);

  // ── CRT blinking cursor ──────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setCrtBlink(b => !b), 600);
    return () => clearInterval(iv);
  }, []);

  // ── Keyboard input handler (numpad + regular numbers) ────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default for game keys
    if (['Enter', ' ', 'Space', 'Backspace', ...Array.from({ length: 10 }, (_, i) => String(i)), 'NumpadEnter', 'numpad0','numpad1','numpad2','numpad3','numpad4','numpad5','numpad6','numpad7','numpad8','numpad9','.', 'numpaddecimal'].includes(e.key)) {
      e.preventDefault();
    }

    const key = e.key;

    // ── Phase: JOB INPUT ───────────────────────────────────────────────────
    if (phase === 'JOB_INPUT') {
      if (/^\d$/.test(key) && jobNumber.length < 4) {
        setJobNumber(prev => prev + key);
        playBeep(660, 0.06);
      } else if ((key === 'Enter' || key === 'NumpadEnter' || key === 'numpadenter') && jobNumber.length === 4) {
        // Accept job → pick random shape
        const picked = SHAPE_NAMES[Math.floor(Math.random() * SHAPE_NAMES.length)];
        setShape(picked);
        setPhase('SHOW_SHAPE');
        playBeep(880, 0.15);
      } else if ((key === 'Backspace' || key === 'Delete') && jobNumber.length > 0) {
        setJobNumber(prev => prev.slice(0, -1));
      }
      return;
    }

    // ── Phase: DATA ENTRY ──────────────────────────────────────────────────
    if (phase === 'DATA_ENTRY') {
      const allowed = ['0','1','2','3','4','5','6','7','8','9','.', '-', 'Backspace', 'Delete', 'Enter', 'NumpadEnter', 'numpadenter', 'numpad0','numpad1','numpad2','numpad3','numpad4','numpad5','numpad6','numpad7','numpad8','numpad9','numpaddecimal'];
      if (!allowed.includes(e.key)) return;

      const currentVal = dataInput[currentField];

      if (key === 'Backspace' || key === 'Delete') {
        setDataInput(prev => ({ ...prev, [currentField]: prev[currentField].slice(0, -1) }));
        return;
      }

      if (key === 'Enter' || key === 'NumpadEnter' || key === 'numpadenter') {
        // Move to next field, or if last field, auto-confirm
        if (currentField === 'axis') {
          // Check we have data
          if (dataInput.sphere && dataInput.cylinder && dataInput.axis) {
            setChuckActive(true);
            playBeep(1100, 0.2);
          }
        } else {
          const next: Record<DataField, DataField> = { sphere: 'cylinder', cylinder: 'axis', axis: 'axis' };
          setCurrentField(next[currentField]);
          playBeep(770, 0.08);
        }
        return;
      }

      // Type characters – limit field length
      const fieldLimits: Record<DataField, number> = { sphere: 5, cylinder: 5, axis: 3 };
      if (currentVal.length < fieldLimits[currentField]) {
        if (currentField === 'axis' && /^\d$/.test(key)) {
          setDataInput(prev => ({ ...prev, axis: (prev.axis + key).slice(0, 3) }));
          playBeep(660, 0.05);
        } else if (currentField !== 'axis' && (key === '-' || key === '.' || /^\d$/.test(key))) {
          const allowedStarts = ['+', '-', '0','1','2','3','4','5','6','7','8','9'];
          if (currentVal === '' && !allowedStarts.includes(key)) return;
          // Prevent multiple decimals and minus signs
          if (key === '.' && currentVal.includes('.')) return;
          if (key === '-' && (currentVal !== '' || e.key === '.')) return;
          setDataInput(prev => ({ ...prev, [currentField]: prev[currentField] + key }));
          playBeep(660, 0.05);
        }
      }
      return;
    }

    // ── Phase: CUTTING (spacebar / enter to hit sweet spot) ────────────────
    if (phase === 'CUTTING' && cuttingActive && (key === ' ' || key === 'Space' || key === 'Enter' || key === 'NumpadEnter' || key === 'numpadenter')) {
      e.preventDefault();
      performTimingHit();
      return;
    }
  }, [phase, jobNumber, dataInput, currentField, cuttingActive, timingPos, greenZoneOffset, shapeDiff, timingHitCount, hitsRemaining]);

  // ── Register/unregister keyboard handler ──────────────────────────────────
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    keyHandlerRef.current = handleKeyDown;
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── DATA ENTRY COUNTDOWN TIMER ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'DATA_ENTRY') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    setDataTimer(8);
    dataTimerRef.current = 8;
    setCountdownWarning(false);

    timerIntervalRef.current = window.setInterval(() => {
      dataTimerRef.current = (dataTimerRef.current ?? 8) - 0.1;
      setDataTimer(Math.round((dataTimerRef.current ?? 8) * 10) / 10);

      if ((dataTimerRef.current ?? 0) <= 3) setCountdownWarning(true);
      if ((dataTimerRef.current ?? 0) <= 0) {
        clearInterval(timerIntervalRef.current);
        triggerFailure('TIME EXPIRED - DATA ENTRY FAILED');
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase]);

  // ── CHUCK ANIMATION ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'LOCKING') return;
    setChuckAnimating(true);
    playBeep(440, 0.4);
    const t1 = setTimeout(() => {
      playBeep(660, 0.3);
    }, 400);
    const t2 = setTimeout(() => {
      setChuckAnimating(false);
      setChuckActive(true);
      setPhase('READY_CUT');
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // ── SPINDLE REV-UP SOUND EMULATION ───────────────────────────────────────
  useEffect(() => {
    if (phase === 'READY_CUT') {
      setSpindleRevs(true);
    } else {
      setSpindleRevs(false);
    }
  }, [phase]);

  // ── CUTTING CYCLE: Start when user hits READY_CUT ─────────────────────────
  // (Triggered by pressing the green START button)
  // ── TIMING BAR ANIMATION LOOP ────────────────────────────────────────────
  useEffect(() => {
    if (!cuttingActive || phase !== 'CUTTING') {
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
      return;
    }

    let lastTime = performance.now();

    // Pick a random green zone center for this round
    setGreenZoneOffset(20 + Math.random() * 60);

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setTimingPos(prev => {
        const speed = currentSpeed * 45; // % per second
        const next = prev + timingDir * speed * dt;
        if (next >= 100) {
          setTimingDir(-1);
          return 100;
        }
        if (next <= 0) {
          setTimingDir(1);
          return 0;
        }
        return next;
      });

      timingAnimRef.current = requestAnimationFrame(animate);
    };

    timingAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
    };
  }, [cuttingActive, phase, currentSpeed, timingDir]);

  // ── SPARK GENERATION (during cutting / spindle revs) ─────────────────────
  useEffect(() => {
    if (!cuttingActive && !spindleRevs) {
      setSparks([]);
      return;
    }

    const sparkIntensity = cuttingActive ? 60 : 30;
    const interval = setInterval(() => {
      setSparks(prev => {
        const newSparks = Array.from({ length: cuttingActive ? 4 : 1 }, () => ({
          x: 145 + (Math.random() - 0.5) * 120,
          y: 95 + (Math.random() - 0.5) * 70,
          life: 0.6 + Math.random() * 0.4,
        }));
        return [...prev.slice(-20), ...newSparks];
      });
    }, sparkIntensity);

    return () => clearInterval(interval);
  }, [cuttingActive, spindleRevs]);

  // ── SPARK DECAY ──────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setSparks(prev => prev.map(s => ({ ...s, life: s.life - 0.04 })).filter(s => s.life > 0));
    }, 50);
    return () => clearInterval(iv);
  }, []);

  // ── PERFORM A TIMING HIT ─────────────────────────────────────────────────
  const performTimingHit = useCallback(() => {
    if (!cuttingActive) return;

    const indicatorEdge   = timingPos;
    const zoneStart       = greenZoneOffset - shapeDiff.greenZoneWidth / 2;
    const zoneEnd         = greenZoneOffset + shapeDiff.greenZoneWidth / 2;
    const crashThreshold  = 5; // if indicator is within 5% of either edge = crash

    let hitType: 'perfect' | 'ok' | 'miss' | 'crash';

    if (indicatorEdge >= zoneStart && indicatorEdge <= zoneEnd) {
      // PERFECT: within center 60% of green zone
      const center = (zoneStart + zoneEnd) / 2;
      const perfectRadius = (zoneEnd - zoneStart) * 0.3;
      hitType = Math.abs(indicatorEdge - center) <= perfectRadius ? 'perfect' : 'ok';
    } else if (indicatorEdge < 0 + crashThreshold || indicatorEdge > 100 - crashThreshold) {
      hitType = 'crash';
    } else {
      hitType = 'miss';
    }

    setHitResults(prev => [...prev, hitType]);
    const newHitCount = timingHitCount + 1;
    setTimingHitCount(newHitCount);

    if (hitType === 'crash') {
      // CRASH – immediate failure
      setCuttingActive(false);
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
      triggerFailure('TOOL CRASH - LENS DESTROYED');
      return;
    }

    if (hitType === 'perfect') {
      playBeep(1046, 0.15);
      setTimeout(() => playBeep(1318, 0.2), 100);
    } else if (hitType === 'ok') {
      playBeep(784, 0.12);
    } else {
      playBeep(300, 0.25);
    }

    if (newHitCount >= 3) {
      // All hits done – complete the cycle
      setCuttingActive(false);
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
      setPhase('RESULT');
      calculateResult();
      return;
    }

    // Increase speed for next hit
    setCurrentSpeed(prev => prev + shapeDiff.speedIncrement);
    // Reset indicator to a random position
    setTimingPos(20 + Math.random() * 60);
    setTimingDir(Math.random() > 0.5 ? 1 : -1);
  }, [cuttingActive, timingPos, greenZoneOffset, shapeDiff, timingHitCount]);

  // ── CALCULATE FINAL SCORE ────────────────────────────────────────────────
  const calculateResult = useCallback(() => {
    // Data entry accuracy (40% of score)
    const target = workTicket;
    const input  = dataInput;

    const sphCorrect = input.sphere === target.sphere;
    const cylCorrect = input.cylinder === target.cylinder;
    const axisCorrect = input.axis === target.axis;

    const dataScore = (sphCorrect ? 40/3 : 0) + (cylCorrect ? 40/3 : 0) + (axisCorrect ? 40/3 : 0);
    // If all 3 correct, give full 40; partial proportional
    const dataAccuracy = (sphCorrect && cylCorrect && axisCorrect) ? 40 :
                         ((sphCorrect ? 1 : 0) + (cylCorrect ? 1 : 0) + (axisCorrect ? 1 : 0)) / 3 * 30;

    // Timing accuracy (60% of score)
    const totalHits = hitResults.length;
    if (totalHits === 0) {
      setScore(0);
      setResultMessage('CYCLE ABORTED');
      setResultSubtext('No timing data recorded');
      return;
    }

    const perfectCount = hitResults.filter(h => h === 'perfect').length;
    const okCount      = hitResults.filter(h => h === 'ok').length;
    const missCount    = hitResults.filter(h => h === 'miss').length;

    const timingScore = (perfectCount / totalHits) * 60 + (okCount / totalHits) * 35;
    const finalScore = Math.round(dataAccuracy + timingScore);

    setScore(finalScore);

    if (finalScore >= 95) {
      setResultMessage('CYCLE COMPLETE - PREMIUM PAL PASS');
      setResultSubtext('Perfect cut. Lens meets PAL specification.');
    } else if (finalScore >= 70) {
      setResultMessage('MINOR WAVE / REMAKE RISK');
      setResultSubtext('Off-axis thin margin. Inspect before dispensing.');
    } else {
      setResultMessage('REMARK REQUIRED');
      setResultSubtext('Surface irregularity detected. Re-run job.');
    }

    playBeep(1320, 0.3);
    setTimeout(() => playBeep(1760, 0.5), 150);
  }, [workTicket, dataInput, hitResults]);

  // ── TRIGGER FAILURE ──────────────────────────────────────────────────────
  const triggerFailure = useCallback((message: string) => {
    setPhase('FAILURE');
    setScore(0);
    setResultMessage(message);
    setResultSubtext('INSTANT REMAKE REQUIRED');
    setScreenShake(true);
    setStopFlashing(true);
    playFailBuzz();

    // Stop shake after 2s
    setTimeout(() => setScreenShake(false), 2000);
    // Stop flashing after 4s
    setTimeout(() => setStopFlashing(false), 4000);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
  }, []);

  // ── START THE CUTTING CYCLE (green button) ──────────────────────────────
  const handleStartCut = () => {
    if (phase !== 'READY_CUT') return;
    playBeep(523, 0.1);
    setPhase('CUTTING');
    setCuttingActive(true);
    setHitsRemaining(3);
    setTimingHitCount(0);
    setHitResults([]);
    setCurrentSpeed(shapeDiff.speed);
    setTimingPos(20 + Math.random() * 60);
    setTimingDir(1);
    setGreenZoneOffset(20 + Math.random() * 60);
    setSparks([]);
  };

  // ── HANDLE CHUCK BUTTON PRESS ────────────────────────────────────────────
  const handleChuck = () => {
    if (phase !== 'DATA_ENTRY' && phase !== 'READY_CUT') return;
    if (phase === 'DATA_ENTRY') {
      // Submit data and lock
      if (!dataInput.sphere || !dataInput.cylinder || !dataInput.axis) return;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setPhase('LOCKING');
      playBeep(440, 0.15);
    }
  };

  // ── HANDLE STOP BUTTON ───────────────────────────────────────────────────
  const handleStop = () => {
    if (cuttingActive) {
      setCuttingActive(false);
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
    }
    if (phase === 'CUTTING') {
      setPhase('FAILURE');
      setResultMessage('CYCLE MANUALLY ABORTED');
      setResultSubtext('LENS RUINED - INSTANT REMAKE');
      setScreenShake(true);
      setStopFlashing(true);
      setTimeout(() => setScreenShake(false), 1500);
      setTimeout(() => setStopFlashing(false), 3000);
    }
  };

  // ── RESET FOR NEW JOB ───────────────────────────────────────────────────
  const handleNewJob = () => {
    setPhase('JOB_INPUT');
    setJobNumber('');
    setShape('CIRCLE');
    setWorkTicket(generateWorkTicket());
    setDataInput({ sphere: '', cylinder: '', axis: '' });
    setCurrentField('sphere');
    setDataTimer(null);
    setChuckActive(false);
    setHitsRemaining(3);
    setTimingPos(50);
    setTimingDir(1);
    setCurrentSpeed(1);
    setGreenZoneOffset(0);
    setHitResults([]);
    setCuttingActive(false);
    setTimingHitCount(0);
    setSparks([]);
    setScore(0);
    setResultMessage('');
    setResultSubtext('');
    setScreenShake(false);
    setStopFlashing(false);
    setChuckAnimating(false);
    setSpindleRevs(false);
    setCountdownWarning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
  };

  // ── Determine if green zone is hit (for visual feedback on indicator) ───
  const isInGreenZone = phase === 'CUTTING' &&
    timingPos >= (greenZoneOffset - shapeDiff.greenZoneWidth / 2) &&
    timingPos <= (greenZoneOffset + shapeDiff.greenZoneWidth / 2);

  // ── CRT Message helpers ─────────────────────────────────────────────────
  const crtTitle = () => {
    switch (phase) {
      case 'JOB_INPUT':    return 'ENTER JOB TICKET:';
      case 'SHOW_SHAPE':   return `JOB #${jobNumber} - SHAPE ASSIGNED`;
      case 'DATA_ENTRY':   return 'KEY PRESCRIPTION DATA';
      case 'LOCKING':      return 'CHUCK LOCKING...';
      case 'READY_CUT':    return 'READY - PRESS START';
      case 'CUTTING':      return 'CUTTING CYCLE ACTIVE';
      case 'RESULT':       return `SCORE: ${score}%`;
      case 'FAILURE':      return '!!! CRITICAL ERROR !!!';
    }
  };

  const crtSubText = () => {
    if (phase === 'RESULT') return resultMessage;
    if (phase === 'FAILURE') return resultMessage;
    if (phase === 'SHOW_SHAPE') return `TARGET: ${SHAPES[shape].label}`;
    if (phase === 'DATA_ENTRY' && dataTimer !== null) return `TIME: ${dataTimer.toFixed(1)}s`;
    return '';
  };

  return (
    <div className="fixed inset-0 z-300 bg-black/90 flex items-center justify-center p-4 font-mono select-none">
      {/* Screen shake wrapper */}
      <motion.div
        animate={screenShake ? { x: [0, -6, 6, -4, 4, -2, 2, 0], y: [0, 4, -4, 3, -3, 2, -2, 0] } : {}}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="relative"
      >
        {/* MACHINE CHASSIS */}
        <div
          className="relative border-[6px] border-[#5a6a6a] rounded-xl shadow-[12px_12px_0_0_rgba(0,0,0,0.85)] overflow-hidden"
          style={{
            width: 520,
            background: 'linear-gradient(170deg, #b0b8b8 0%, #8a9494 30%, #7a8484 60%, #6a7474 100%)',
          }}
        >
          {/* Machine Brand Strip */}
          <div className="bg-[#4a5252] px-4 py-1.5 flex items-center justify-between border-b-[3px] border-[#3a4242]">
            <span className="text-[8px] font-bold tracking-[3px] text-[#c8d0d0] uppercase">
              Coburn / Optek
            </span>
            <span className="text-[7px] font-bold tracking-[2px] text-[#889898] italic">
              2G Generator
            </span>
          </div>

          {/* ── MAIN LAYOUT: MONITOR + HOOD side by side ──────────────────── */}
          <div className="flex p-3 gap-3">
            {/* LEFT SIDE: Monitor area + Keypad below */}
            <div className="flex flex-col gap-2" style={{ width: 280 }}>
              {/* ── CRT MONITOR ──────────────────────────────────────────── */}
              <div
                className="border-[5px] border-[#4a5252] rounded-lg overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                style={{
                  backgroundColor: '#2a2a3e',
                  height: 180,
                }}
              >
                {/* Monitor bezel */}
                <div className="bg-[#3a4242] px-2 py-0.5 flex items-center justify-between border-b-2 border-[#2a3232]">
                  <span className="text-[5px] text-[#889898] font-bold tracking-widest uppercase">CRT</span>
                  <span className="text-[5px] text-[#ff6666] font-bold">● ON</span>
                </div>

                {/* Screen area with retro CRT blue glow */}
                <div
                  className="relative h-full"
                  style={{
                    background: 'radial-gradient(ellipse at center, #1a1a4e 0%, #0e0e2e 60%, #08081a 100%)',
                    boxShadow: 'inset 0 0 60px rgba(40, 40, 180, 0.3)',
                  }}
                >
                  {/* Scanlines */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-15"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,40,0.3) 2px, rgba(0,0,40,0.3) 4px)',
                    }}
                  />
                  {/* CRT glow effect */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(ellipse at 30% 40%, rgba(100, 100, 255, 0.08) 0%, transparent 70%)',
                    }}
                  />

                  {/* Screen content */}
                  <div className="relative h-full p-3 flex flex-col">
                    {/* Scanline overlay animation */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-5"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
                      }}
                    />

                    {/* Title line */}
                    <div className="text-[9px] font-bold text-[#7a7aff] mb-1.5" style={{ textShadow: '0 0 6px rgba(100,100,255,0.5)' }}>
                      {'>'} {crtTitle()}
                      {crtBlink && <span className="ml-1 text-blue-300">█</span>}
                    </div>

                    {/* Phase-specific content */}
                    {phase === 'JOB_INPUT' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        <div className="text-[20px] font-bold text-[#aaaaff]" style={{ textShadow: '0 0 12px rgba(100,100,255,0.6)' }}>
                          {jobNumber.padEnd(4, '_').split('').map((c, i) => (
                            <span key={i} className={c === '_' ? 'opacity-30' : ''}>{c}</span>
                          ))}
                        </div>
                        <div className="text-[6px] text-[#6666aa] mt-1">ENTER 4-DIGIT JOB # THEN ENTER</div>
                      </div>
                    )}

                    {phase === 'SHOW_SHAPE' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        {/* Shape wireframe SVG */}
                        <svg width="70" height="70" viewBox="0 0 100 100" className="mb-0.5">
                          <path
                            d={SHAPE_ICONS[shape]}
                            fill="none"
                            stroke="#88aaff"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ filter: 'drop-shadow(0 0 4px rgba(100,150,255,0.6))' }}
                          />
                        </svg>
                        <div className="text-[8px] text-[#88aaff] font-bold tracking-wider">
                          {SHAPES[shape].label}
                        </div>
                        <div className="text-[6px] text-[#556688] mt-0.5">TICKET #{jobNumber}</div>
                        <div className="text-[6px] text-[#7799aa] mt-0.5 animate-pulse">PRESS ANY KEY TO CONTINUE</div>
                      </div>
                    )}

                    {phase === 'DATA_ENTRY' && (
                      <div className="flex-1 flex flex-col gap-0.5">
                        {/* Work ticket header */}
                        <div className="border border-[#4444aa]/30 bg-[#111133]/50 rounded px-1.5 py-0.5 mb-0.5">
                          <div className="text-[5px] text-[#6666aa] uppercase tracking-widest">Work Ticket #{jobNumber}</div>
                        </div>

                        {/* Fields */}
                        {(['sphere', 'cylinder', 'axis'] as DataField[]).map(field => (
                          <div key={field} className="flex items-center gap-1">
                            <span className="text-[6px] text-[#6666cc] uppercase w-12">{field}:</span>
                            <div className="flex-1 border-b border-[#4444aa]/40 px-1 py-0.5 min-h-5">
                              <span className={`text-[11px] font-bold ${dataInput[field] ? 'text-[#aabbff]' : 'text-[#444488]'}`}
                                style={{ textShadow: '0 0 4px rgba(100,100,200,0.3)' }}>
                                {dataInput[field] || (currentField === field ? (crtBlink ? '█' : '') : '...')}
                              </span>
                              {currentField === field && (
                                <span className="text-[11px] text-[#8888ff] animate-pulse">█</span>
                              )}
                            </div>
                            <span className="text-[5px] text-[#444466]">
                              {field === 'axis' ? '(DEG)' : '(D)'}
                            </span>
                          </div>
                        ))}

                        {/* Timer */}
                        {dataTimer !== null && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`text-[11px] font-bold ${countdownWarning ? 'text-red-400' : 'text-[#88aaff]'}`}>
                              TIME {dataTimer.toFixed(1)}
                            </span>
                            {countdownWarning && (
                              <span className="text-[8px] text-red-400 animate-pulse">⚠</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {(phase === 'LOCKING' || phase === 'READY_CUT') && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        {phase === 'LOCKING' && (
                          <>
                            <div className="text-[14px] text-[#88aaff]" style={{ textShadow: '0 0 8px rgba(100,100,255,0.5)' }}>
                              ⚙ CHUCK LOCKING...
                            </div>
                            <div className="text-[6px] text-[#556688]">HOLDING LENS SECURE</div>
                            {/* Progress animation */}
                            <div className="w-32 h-1.5 bg-[#222244] rounded-full overflow-hidden mt-1">
                              <motion.div
                                className="h-full bg-[#6688ff] rounded-full"
                                animate={{ width: ['0%', '100%'] }}
                                transition={{ duration: 1.2, ease: 'easeInOut' }}
                              />
                            </div>
                          </>
                        )}
                        {phase === 'READY_CUT' && (
                          <>
                            <div className="text-[14px] text-[#88ff88]" style={{ textShadow: '0 0 8px rgba(100,255,100,0.5)' }}>
                              ✓ LENS LOCKED
                            </div>
                            <div className="text-[7px] text-[#668866]">
                              {workTicket.sphere} / {workTicket.cylinder} / {workTicket.axis}
                            </div>
                            <div className="text-[6px] text-[#558855] mt-1 animate-pulse">
                              PRESS START TO BEGIN CUT
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {phase === 'CUTTING' && (
                      <div className="flex-1 flex flex-col gap-1">
                        {/* Timing bar */}
                        <div className="mt-0.5">
                          <div className="text-[5px] text-[#6666aa] mb-0.5 uppercase">Tool Pressure / Sag Depth</div>
                          <div
                            className="relative h-6 bg-[#0a0a1a] border border-[#333366] rounded overflow-hidden"
                          >
                            {/* Red CRASH zones on edges */}
                            <div className="absolute left-0 top-0 bottom-0 w-[4%] bg-red-900/60 z-10" />
                            <div className="absolute right-0 top-0 bottom-0 w-[4%] bg-red-900/60 z-10" />

                            {/* Green sweet-spot zone */}
                            <div
                              className="absolute top-0 bottom-0 z-10 rounded-sm transition-all duration-300"
                              style={{
                                left: `${greenZoneOffset - shapeDiff.greenZoneWidth / 2}%`,
                                width: `${shapeDiff.greenZoneWidth}%`,
                                background: 'linear-gradient(180deg, rgba(40, 255, 40, 0.5), rgba(20, 200, 20, 0.7))',
                                boxShadow: '0 0 10px rgba(50, 255, 50, 0.3)',
                              }}
                            />

                            {/* Indicator */}
                            <motion.div
                              className="absolute top-0 h-full w-1 z-20"
                              style={{
                                left: `${timingPos}%`,
                                backgroundColor: isInGreenZone ? '#88ff88' : '#ff6666',
                                boxShadow: isInGreenZone
                                  ? '0 0 8px rgba(100, 255, 100, 0.8)'
                                  : '0 0 8px rgba(255, 50, 50, 0.6)',
                                transform: 'translateX(-2px)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Hit indicators */}
                        <div className="flex gap-2 items-center mt-0.5">
                          {[0, 1, 2].map(i => (
                            <div
                              key={i}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center text-[7px] font-bold transition-all ${
                                i < timingHitCount
                                  ? hitResults[i] === 'perfect'
                                    ? 'bg-green-700 border-green-300 text-green-200'
                                    : hitResults[i] === 'ok'
                                    ? 'bg-yellow-700 border-yellow-300 text-yellow-200'
                                    : 'bg-red-700 border-red-300 text-red-200'
                                  : 'bg-transparent border-[#444466] text-[#444466]'
                              }`}
                            >
                              {i < timingHitCount ? (hitResults[i] === 'perfect' ? '★' : hitResults[i] === 'ok' ? '✓' : '✗') : (i + 1)}
                            </div>
                          ))}
                        </div>

                        {/* Speed indicator */}
                        <div className="text-[5px] text-[#555588]">
                          SPD: ×{currentSpeed.toFixed(1)}
                        </div>
                      </div>
                    )}

                    {phase === 'RESULT' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                        <div className={`text-[16px] font-bold ${score >= 95 ? 'text-[#88ff88]' : score >= 70 ? 'text-[#ffcc44]' : 'text-[#ff6644]'}`}
                          style={{ textShadow: score >= 95 ? '0 0 12px rgba(100,255,100,0.6)' : '0 0 8px rgba(200,200,50,0.4)' }}>
                          {score >= 95 ? '★' : score >= 70 ? '✦' : '⚠'} {score}%
                        </div>
                        <div className={`text-[7px] font-bold text-center px-2 ${score >= 95 ? 'text-[#88ff88]' : score >= 70 ? 'text-[#ffcc44]' : 'text-[#ff6644]'}`}>
                          {resultMessage}
                        </div>
                        <div className="text-[5px] text-[#667788] text-center mt-0.5">
                          {resultSubtext}
                        </div>
                        {/* Data verification */}
                        <div className="text-[5px] text-[#445566] mt-1 border-t border-[#334455]/30 pt-1 w-full text-center">
                          SPH: {dataInput.sphere || '---'} | CYL: {dataInput.cylinder || '---'} | AX: {dataInput.axis || '---'}
                        </div>
                      </div>
                    )}

                    {phase === 'FAILURE' && (
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                        <div className="text-[18px] font-bold text-red-400" style={{ textShadow: '0 0 15px rgba(255,50,50,0.6)' }}>
                          ⚠ CRITICAL
                        </div>
                        <div className="text-[7px] text-red-300 text-center animate-pulse font-bold">
                          {resultMessage}
                        </div>
                        <div className="text-[6px] text-red-400 mt-1">
                          {resultSubtext}
                        </div>
                        {/* Grinding text effect */}
                        <div
                          className="text-[4px] text-red-600/60 mt-2 animate-pulse"
                          style={{ animationDuration: '0.3s' }}
                        >
                          SYS:ABORT - TOOL:STALL - LENS:LOST
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── NUMERIC KEYPAD ──────────────────────────────────────── */}
              <div className="bg-[#e8e0d0] border-4 border-[#4a5252] rounded-lg p-2 shadow-inner">
                <div className="text-[5px] text-[#887766] uppercase font-bold tracking-widest text-center mb-1">DATA KEYPAD</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    ['7', '8', '9', 'BS'],
                    ['4', '5', '6', '.'],
                    ['1', '2', '3', '-'],
                    ['0', '00', 'CLR', 'ENT'],
                  ].map((row, ri) => (
                    row.map((key, ci) => {
                      const isEnter = key === 'ENT';
                      const isClear = key === 'CLR' || key === 'BS';
                      return (
                        <motion.button
                          key={`${ri}-${ci}`}
                          whileTap={{ scale: 0.92 }}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const syntheticEvent = new KeyboardEvent('keydown', {
                              key: key === 'ENT' ? 'Enter' :
                                   key === 'BS' ? 'Backspace' :
                                   key === 'CLR' ? 'Delete' :
                                   key === '.' ? '.' :
                                   key === '-' ? '-' :
                                   key === '00' ? '0' : key,
                              bubbles: true,
                            });
                            handleKeyDown(syntheticEvent as any);
                          }}
                          className={`
                            h-9 rounded font-bold text-[10px] border-b-[3px] active:border-b-0 active:mt-0.5 transition-all select-none
                            ${isEnter
                              ? 'bg-[#44aa44] border-[#227722] text-white hover:bg-[#55bb55]'
                              : isClear
                              ? 'bg-[#cc6644] border-[#994433] text-white hover:bg-[#dd7755]'
                              : 'bg-[#f5ede0] border-[#ccbbaa] text-[#554433] hover:bg-[#fff5e8]'}
                          `}
                        >
                          {key === 'BS' ? '⌫' : key}
                        </motion.button>
                      );
                    })
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Center Hood / Cutting Window + Front Panel Controls */}
            <div className="flex flex-col gap-2" style={{ width: 230 }}>
              {/* ── CENTER HOOD (Dark Tinted Glass Viewing Window) ─────── */}
              <div
                className="relative border-[5px] border-[#4a5252] rounded-lg overflow-hidden"
                style={{
                  height: 180,
                  backgroundColor: '#1a1a1a',
                }}
              >
                {/* Hood label */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 bg-[#3a4242]/80 px-2 py-0.5 rounded">
                  <span className="text-[4px] text-[#889898] font-bold tracking-widest uppercase">CUTTING CHAMBER</span>
                </div>

                {/* Dark tinted glass window */}
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background: 'linear-gradient(135deg, rgba(20,30,40,0.85) 0%, rgba(10,15,20,0.9) 100%)',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(1px)',
                  }}
                />

                {/* Grid lines (chamber background) */}
                <svg className="absolute inset-0 w-full h-full opacity-20" style={{ zIndex: 0 }}>
                  <defs>
                    <pattern id="chamberGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#334455" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#chamberGrid)" />
                </svg>

                {/* Lens blank silhouette */}
                <div
                  className="absolute z-1"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    border: '2px dashed rgba(100, 150, 200, 0.2)',
                    background: chuckActive || phase === 'CUTTING' || phase === 'RESULT' || phase === 'FAILURE'
                      ? 'radial-gradient(circle, rgba(60, 80, 110, 0.3), rgba(30, 40, 60, 0.2))'
                      : 'radial-gradient(circle, rgba(80, 120, 160, 0.2), rgba(30, 40, 60, 0.1))',
                  }}
                >
                  {/* Chuck clamp visual */}
                  {(chuckActive || phase === 'LOCKING' || phase === 'READY_CUT' || phase === 'CUTTING' || phase === 'RESULT') && (
                    <>
                      {/* Top clamp */}
                      <div
                        className={`absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-[#556688] rounded-sm border border-[#7788aa] z-5 transition-all ${chuckAnimating ? 'scale-y-110' : ''}`}
                        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      />
                      {/* Bottom clamp */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-[#556688] rounded-sm border border-[#7788aa] z-5"
                        style={{ boxShadow: '0 -2px 4px rgba(0,0,0,0.5)' }}
                      />
                    </>
                  )}
                </div>

                {/* Sparks overlay */}
                {(cuttingActive || spindleRevs) && (
                  <div className="absolute inset-0 z-6 pointer-events-none">
                    {sparks.map((spark, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          left: spark.x,
                          top: spark.y,
                          width: Math.max(1, spark.life * 4),
                          height: Math.max(1, spark.life * 4),
                          backgroundColor: spark.life > 0.5 ? '#ffeeaa' : '#ff8844',
                          boxShadow: `0 0 ${spark.life * 6}px ${spark.life > 0.5 ? '#ffee88' : '#ff6622'}`,
                          opacity: spark.life,
                          transition: 'all 0.05s linear',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Spindle glow */}
                {spindleRevs && (
                  <div
                    className="absolute inset-0 z-4 pointer-events-none animate-pulse"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(255,100,50,0.08) 0%, transparent 60%)',
                      animationDuration: '0.15s',
                    }}
                  />
                )}

                {/* Cutting indicator */}
                {cuttingActive && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-7 bg-red-800/60 px-2 py-0.5 rounded animate-pulse"
                    style={{ animationDuration: '0.2s' }}>
                    <span className="text-[5px] text-red-200 font-bold tracking-wider">CUTTING</span>
                  </div>
                )}

                {/* Glass reflection */}
                <div
                  className="absolute inset-0 z-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.02) 100%)',
                  }}
                />

                {/* Safety warning */}
                <div className="absolute bottom-1 right-1 z-8">
                  <span className="text-[3px] text-[#444455]">SAFETY GLASSES REQUIRED</span>
                </div>
              </div>

              {/* ── WORK TICKET CLIPBOARD ─────────────────────────────────── */}
              <div
                className="relative border-[3px] border-[#8b7355] rounded bg-[#f5edd5] p-2"
                style={{ minHeight: 70 }}
              >
                {/* Clip */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-[#888888] rounded-sm border border-[#666666] z-10" />

                <div className="text-[5px] text-[#887755] font-bold tracking-widest mb-0.5 uppercase flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#887755] rounded-sm" />
                  WORK TICKET #{jobNumber || '----'}
                </div>
                <div className="border-t border-[#ccbb99] my-0.5" />
                <div className="grid grid-cols-3 gap-0.5 text-center">
                  <div>
                    <div className="text-[5px] text-[#aa8866] uppercase">Sphere</div>
                    <div className="text-[14px] font-bold text-[#443322]">{workTicket.sphere}</div>
                  </div>
                  <div>
                    <div className="text-[5px] text-[#aa8866] uppercase">Cylinder</div>
                    <div className="text-[14px] font-bold text-[#443322]">{workTicket.cylinder}</div>
                  </div>
                  <div>
                    <div className="text-[5px] text-[#aa8866] uppercase">Axis</div>
                    <div className="text-[14px] font-bold text-[#443322]">{workTicket.axis}</div>
                  </div>
                </div>
                {/* Verification stamp */}
                {phase === 'RESULT' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] font-bold text-red-400/30 rotate-[-20deg] select-none"
                    style={{ textShadow: '0 0 4px rgba(200,50,50,0.1)' }}>
                    {score >= 70 ? 'PASS' : 'FAIL'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── FRONT PANEL CONTROLS ───────────────────────────────────────── */}
          <div className="mx-3 mb-3 p-2 bg-[#6a7474] border-2 border-[#4a5252] rounded-lg flex items-center gap-4">
            {/* LEFT: Chuck button + Roller counters */}
            <div className="flex items-center gap-3">
              {/* Blue CHUCK button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleChuck}
                className={`
                  w-9 h-9 rounded-full border-2 font-bold text-[7px] uppercase tracking-tight
                  ${chuckActive
                    ? 'bg-blue-700 border-blue-300 text-blue-200 cursor-default'
                    : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-500 active:bg-blue-800'}
                  ${phase === 'DATA_ENTRY' && dataInput.sphere && dataInput.cylinder && dataInput.axis
                    ? 'shadow-[0_0_10px_rgba(50,50,255,0.4)] animate-pulse'
                    : ''}
                  transition-all flex items-center justify-center
                `}
                style={{ boxShadow: chuckActive ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[9px]">⚙</span>
                  <span className="text-[5px] mt-0.5">CHUCK</span>
                </div>
              </motion.button>

              {/* Roller counters */}
              <div className="flex gap-2">
                <RollerCounter value={timingHitCount} label="HIT" />
                <RollerCounter value={phase === 'CUTTING' ? Math.round(timingPos) : score} label={phase === 'CUTTING' ? 'POS' : 'SCORE'} />
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* RIGHT: STOP + START buttons */}
            <div className="flex items-center gap-2">
              {/* Red STOP */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleStop}
                className={`
                  w-10 h-10 rounded font-bold text-[7px] uppercase tracking-tight border-2 flex items-center justify-center
                  ${stopFlashing
                    ? 'bg-red-500 border-red-200 text-white animate-pulse'
                    : phase === 'CUTTING' || cuttingActive
                    ? 'bg-red-700 border-red-400 text-white hover:bg-red-600'
                    : 'bg-red-800/50 border-red-700/50 text-red-400/50'}
                  transition-all
                `}
                style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-black">■</span>
                  <span className="text-[5px]">STOP</span>
                </div>
              </motion.button>

              {/* Green START */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleStartCut}
                className={`
                  w-10 h-10 rounded font-bold text-[7px] uppercase tracking-tight border-2 flex items-center justify-center
                  ${phase === 'READY_CUT'
                    ? 'bg-green-600 border-green-300 text-white hover:bg-green-500 shadow-[0_0_12px_rgba(50,255,50,0.3)] animate-pulse'
                    : phase === 'CUTTING'
                    ? 'bg-green-700 border-green-400 text-green-200'
                    : 'bg-green-800/50 border-green-700/50 text-green-400/50'}
                  transition-all
                `}
                style={{ boxShadow: phase === 'READY_CUT' ? '0 0 12px rgba(50,200,50,0.3), 0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.3)' }}
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[10px] font-black">▶</span>
                  <span className="text-[5px]">START</span>
                </div>
              </motion.button>
            </div>
          </div>

          {/* ── BOTTOM BAR: Machine info + Close ─────────────────────────── */}
          <div className="px-3 pb-3 flex items-center justify-between">
            <div className="text-[5px] text-[#4a5a5a] font-bold tracking-widest">
              COBURN/OPTEK 2G &bull; PAL OPTICAL SIMULATOR
            </div>
            <div className="flex gap-2">
              {(phase === 'RESULT' || phase === 'FAILURE') && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNewJob}
                  className="px-3 py-1 bg-[#445566] hover:bg-[#556677] text-[#ccddee] text-[7px] font-bold rounded border border-[#556677] transition-colors"
                >
                  NEW JOB
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-3 py-1 bg-[#3a4242] hover:bg-[#4a5252] text-[#889898] text-[7px] font-bold rounded border border-[#4a5252] transition-colors"
              >
                EXIT
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};