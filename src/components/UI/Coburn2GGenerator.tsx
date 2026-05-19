/**
 * Coburn / Optek 2G Generator Calibration & Surfacing Mini-Game
 * =============================================================
 *
 * Replicates the physical layout and workflow of a real Coburn 2G
 * generator used in optical laboratories for surfacing PAL lenses.
 *
 * Physical Layout (matches real 2G machine):
 *  - Light grey angled chassis
 *  - Small raised blue CRT monitor (top-right)
 *  - Numeric keypad below CRT
 *  - Dark tinted central hood window (cutting animation viewport)
 *  - Blue "CHUCK" button (bottom-left)
 *  - Square red "STOP" / green "START" buttons (bottom-right)
 *
 * Phases:
 *   0 – JOB INIT: Enter 4-digit job ticket → random shape
 *   1 – DATA ENTRY: Type Sphere, Cylinder, Axis within 8s
 *   2 – CUTTING CYCLE: 3 timing-bar hits in green zone
 *   3 – LENS SURFACING ANIMATION: SVG cutting view in hood window
 *
 * Shape difficulty scaling modifies timing bar speed and green zone width.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";

interface Coburn2GGeneratorProps {
  onClose: () => void;
}

// ─── SHAPE DEFINITIONS & DIFFICULTY SCALING ──────────────────────────────────

type LensShape = "CIRCLE" | "SQUARE" | "RECTANGLE" | "AVIATOR" | "CAT-EYE";

interface ShapeDifficulty {
  greenZoneWidth: number;
  speed: number;
  speedIncrement: number;
  label: string;
}

const SHAPES: Record<LensShape, ShapeDifficulty> = {
  CIRCLE:   { greenZoneWidth: 46, speed: 1.0, speedIncrement: 0.4, label: "CIRCLE" },
  SQUARE:   { greenZoneWidth: 34, speed: 1.4, speedIncrement: 0.5, label: "SQUARE" },
  RECTANGLE:{ greenZoneWidth: 32, speed: 1.5, speedIncrement: 0.5, label: "RECT" },
  AVIATOR:  { greenZoneWidth: 24, speed: 2.2, speedIncrement: 0.8, label: "AVIATOR" },
  "CAT-EYE":{ greenZoneWidth: 20, speed: 2.6, speedIncrement: 0.9, label: "CAT-EYE" },
};

const SHAPE_NAMES: LensShape[] = ["CIRCLE","SQUARE","RECTANGLE","AVIATOR","CAT-EYE"];

// ─── WORK TICKET GENERATION ─────────────────────────────────────────────────

function generateWorkTicket() {
  const spheres = ["-4.00","-3.50","-3.00","-2.50","-2.25","-2.00","-1.75","-1.50","-1.25","-1.00","-0.75","-0.50","0.00","+0.50","+1.00","+1.50","+2.00"];
  const cylinders = ["-2.25","-2.00","-1.75","-1.50","-1.25","-1.00","-0.75","-0.50","-0.25"];
  return {
    sphere: spheres[Math.floor(Math.random() * spheres.length)],
    cylinder: cylinders[Math.floor(Math.random() * cylinders.length)],
    axis: String(Math.floor(Math.random() * 180)).padStart(3, "0"),
  };
}

// ─── SIMPLE AUDIO FEEDBACK ──────────────────────────────────────────────────

function playBeep(freq = 880, duration = 0.12) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

function playFailBuzz() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 100;
    osc.type = "sawtooth";
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);
  } catch (_) {}
}

// ─── LENS CUTTING ANIMATION SVG (Rendered inside the hood window) ───────────
//
// Shows a semi-finished lens blank clamped on a chuck, a spinning diamond
// cutting blade, and animated sparks when cutting. The lens blank profile
// morphs from flat to concave as cuts progress.
//
interface LensCutAnimationProps {
  /** 0–3: number of successful cuts completed */
  cutProgress: number;
  /** Whether the blade is actively cutting */
  cutting: boolean;
  /** Whether the machine is in failure state */
  crashed: boolean;
  /** Blade x-offset translation relative to lens (-15 to 0) */
  bladeOffset: number;
}

const LensCutAnimation: React.FC<LensCutAnimationProps> = ({
  cutProgress,
  cutting,
  crashed,
  bladeOffset,
}) => {
  // Generate spark particles for the cutting effect
  const [sparkParticles, setSparkParticles] = useState<
    { id: number; x: number; y: number; size: number; opacity: number; angle: number; speed: number }[]
  >([]);
  const sparkIdRef = useRef(0);

  // Spark generation loop
  useEffect(() => {
    if (!cutting) {
      setSparkParticles([]);
      return;
    }
    const iv = setInterval(() => {
      setSparkParticles((prev) => {
        const id = sparkIdRef.current++;
        // Generate 2-3 new sparks per tick from the blade contact point
        const newSparks = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, () => ({
          id: sparkIdRef.current++,
          x: 145 + (Math.random() - 0.5) * 20, // blade contact area x
          y: 80 + (Math.random() - 0.5) * 20,  // blade contact area y
          size: 1.5 + Math.random() * 3,
          opacity: 0.8 + Math.random() * 0.2,
          angle: -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.6, // mostly downward
          speed: 1 + Math.random() * 3,
        }));
        return [...prev, ...newSparks].slice(-30);
      });
    }, 80);
    return () => clearInterval(iv);
  }, [cutting]);

  // Spark decay loop
  useEffect(() => {
    const iv = setInterval(() => {
      setSparkParticles((prev) =>
        prev
          .map((s) => ({
            ...s,
            x: s.x + Math.cos(s.angle) * s.speed,
            y: s.y + Math.sin(s.angle) * s.speed,
            opacity: s.opacity - 0.04,
            speed: s.speed * 0.97,
          }))
          .filter((s) => s.opacity > 0)
      );
    }, 40);
    return () => clearInterval(iv);
  }, []);

  // Lens profile morphing: cutProgress 0→3 transitions from flat back to concave
  // The back curve radius decreases with each cut
  const backCurveDepth = cutProgress * 0.2; // 0 to 0.6 (deeper curve)
  const lensBackCurve = `M 40,45 Q 70,${45 + backCurveDepth * 25} 100,45`;

  return (
    <svg viewBox="0 0 220 140" className="w-full h-full">
      <defs>
        {/* Spark gradient */}
        <radialGradient id="sparkGrad">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#ffdd44" />
          <stop offset="100%" stopColor="#ff8800" stopOpacity="0" />
        </radialGradient>
        {/* Lens material gradient */}
        <linearGradient id="lensGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0e8ff" />
          <stop offset="50%" stopColor="#a0c8ee" />
          <stop offset="100%" stopColor="#80b0dd" />
        </linearGradient>
        {/* Diamond blade gradient */}
        <linearGradient id="bladeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#999" />
          <stop offset="30%" stopColor="#ccc" />
          <stop offset="70%" stopColor="#777" />
          <stop offset="100%" stopColor="#555" />
        </linearGradient>
        {/* Cracked lens pattern (for crash state) */}
        <pattern id="crackPattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="20" height="20" fill="#667788" />
          <line x1="0" y1="10" x2="20" y2="8" stroke="#445566" strokeWidth="1.5" opacity="0.8" />
          <line x1="5" y1="0" x2="15" y2="20" stroke="#445566" strokeWidth="1" opacity="0.6" />
          <line x1="3" y1="15" x2="18" y2="5" stroke="#445566" strokeWidth="1.2" opacity="0.7" />
        </pattern>
      </defs>

      {/* Dark chamber background */}
      <rect x="0" y="0" width="220" height="140" fill="#0a0a12" rx="4" />

      {/* Subtle scanlines */}
      <g opacity="0.08">
        {Array.from({ length: 28 }, (_, i) => (
          <line key={i} x1="0" y1={i * 5} x2="220" y2={i * 5} stroke="#4488ff" strokeWidth="1" />
        ))}
      </g>

      {/* ── LENS CHUCK (holding mechanism) ───────────────────────────────── */}
      {/* Chuck arm left */}
      <rect x="20" y="58" width="20" height="8" rx="1" fill="#555" stroke="#777" strokeWidth="1" />
      {/* Chuck arm right */}
      <rect x="100" y="58" width="20" height="8" rx="1" fill="#555" stroke="#777" strokeWidth="1" />
      {/* Chuck center hub */}
      <circle cx="70" cy="62" r="8" fill="#666" stroke="#888" strokeWidth="1.5" />
      <circle cx="70" cy="62" r="3" fill="#444" />

      {/* ── LENS BLANK ────────────────────────────────────────────────────── */}
      <g transform="translate(0, 0)">
        {/* Lens blank outer shape */}
        {!crashed ? (
          <>
            {/* Front surface (always convex/curved) */}
            <path
              d={`M 38,45 Q 70,35 102,45 L 102,75 Q 70,68 38,75 Z`}
              fill="url(#lensGrad)"
              stroke="#88aacc"
              strokeWidth="1.5"
              opacity={0.9}
            />
            {/* Back surface (morphs from flat to concave with cutProgress) */}
            <path
              d={`M 38,75 Q 70,${75 - backCurveDepth * 28} 102,75 Z`}
              fill="#b8d8f0"
              stroke="#88aacc"
              strokeWidth="1"
              opacity={0.7 + cutProgress * 0.1}
            />
            {/* Lens edge highlight */}
            <path
              d={`M 38,45 Q 70,35 102,45`}
              fill="none"
              stroke="#cce8ff"
              strokeWidth="1"
              opacity="0.5"
            />
            {/* Center axis dot */}
            <circle cx="70" cy="60" r="2" fill="#4488aa" opacity="0.4" />
            {/* Lens material edge thickness indicator */}
            {cutProgress > 0 && (
              <line
                x1="38" y1="45" x2="38" y2="75"
                stroke="#6699bb"
                strokeWidth="1"
                opacity="0.4"
              />
            )}
          </>
        ) : (
          <>
            {/* CRASHED: Cracked pattern on lens */}
            <ellipse cx="70" cy="60" rx="32" ry="17" fill="url(#crackPattern)" opacity="0.8" />
            {/* Shatter lines */}
            <line x1="50" y1="48" x2="80" y2="72" stroke="#334455" strokeWidth="2" opacity="0.9" />
            <line x1="60" y1="44" x2="65" y2="76" stroke="#334455" strokeWidth="1.5" opacity="0.7" />
            <line x1="85" y1="52" x2="55" y2="68" stroke="#334455" strokeWidth="1.5" opacity="0.8" />
            <line x1="45" y1="60" x2="95" y2="60" stroke="#334455" strokeWidth="1" opacity="0.6" />
            {/* Missing chunk */}
            <ellipse cx="60" cy="55" rx="8" ry="5" fill="#0a0a12" opacity="0.6" />
          </>
        )}
      </g>

      {/* ── DIAMOND CUTTING BLADE ────────────────────────────────────────── */}
      <g
        transform={`translate(${-bladeOffset * 0.8}, 0)`}
        style={{
          animation: cutting && !crashed ? "blade-spin 0.15s linear infinite" : "none",
        }}
      >
        {/* Blade body */}
        <circle cx="160" cy="62" r="18" fill="url(#bladeGrad)" stroke="#888" strokeWidth="1.5" />
        {/* Diamond grit edge */}
        <circle
          cx="160" cy="62" r="18"
          fill="none"
          stroke="#ddaa44"
          strokeWidth="2"
          opacity={0.6}
          strokeDasharray="2 2"
        />
        {/* Blade center */}
        <circle cx="160" cy="62" r="4" fill="#444" stroke="#666" strokeWidth="1" />
        {/* Radial lines for spin visibility */}
        <line x1="160" y1="44" x2="160" y2="52" stroke="#aaa" strokeWidth="1" opacity="0.5" />
        <line x1="160" y1="72" x2="160" y2="80" stroke="#aaa" strokeWidth="1" opacity="0.5" />
        <line x1="142" y1="62" x2="150" y2="62" stroke="#aaa" strokeWidth="1" opacity="0.5" />
        <line x1="170" y1="62" x2="178" y2="62" stroke="#aaa" strokeWidth="1" opacity="0.5" />
      </g>

      {/* ── SPARK PARTICLES (emitted during cutting) ─────────────────────── */}
      {sparkParticles.map((sp) => (
        <circle
          key={sp.id}
          cx={sp.x}
          cy={sp.y}
          r={sp.size}
          fill="url(#sparkGrad)"
          opacity={sp.opacity}
        />
      ))}

      {/* ── STATIC ELEMENTS ──────────────────────────────────────────────── */}
      {/* Chuck support shaft */}
      <rect x="67" y="78" width="6" height="20" fill="#555" stroke="#777" strokeWidth="1" />
      {/* Machine bed */}
      <rect x="10" y="118" width="200" height="4" fill="#444" stroke="#666" strokeWidth="1" rx="1" />
      {/* Coolant drip (subtle detail) */}
      {cutting && (
        <ellipse cx="70" cy="110" rx="3" ry="2" fill="#4488cc" opacity="0.3" />
      )}
    </svg>
  );
};

// ─── PHYSICAL KEYPAD COMPONENT ──────────────────────────────────────────────
//
// Renders a retro numeric keypad matching the 2G generator's physical layout.
//
interface KeypadProps {
  onKeyPress: (key: string) => void;
  disabled?: boolean;
}

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, disabled }) => {
  const keys = [
    ["7","8","9"],
    ["4","5","6"],
    ["1","2","3"],
    ["-","0","."],
    ["+","BS","ENT"],
  ];

  return (
    <div className="flex flex-col gap-1.5 p-2" style={{ opacity: disabled ? 0.5 : 1 }}>
      {keys.slice(0, 4).map((row, ri) => (
        <div key={ri} className="flex gap-1.5 justify-center">
          {row.map((k) => (
            <button
              key={k}
              onClick={() => onKeyPress(k)}
              disabled={disabled}
              className="flex items-center justify-center text-[9px] font-bold font-mono text-white rounded cursor-pointer active:scale-95 transition-transform"
              style={{
                width: 24,
                height: 24,
                background: "linear-gradient(180deg, #3a3a3a 0%, #222 50%, #1a1a1a 100%)",
                border: "1px solid #555",
                borderTopColor: "#666",
                borderLeftColor: "#666",
                boxShadow: "0 1px 0 #000",
              }}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      {/* Special Bottom Row */}
      <div className="flex gap-1.5 justify-center mt-1">
        <button
          onClick={() => onKeyPress("+")}
          disabled={disabled}
          className="flex items-center justify-center text-[9px] font-bold font-mono text-white rounded cursor-pointer active:scale-95 transition-transform"
          style={{
            width: 24,
            height: 24,
            background: "linear-gradient(180deg, #3a3a3a 0%, #222 50%, #1a1a1a 100%)",
            border: "1px solid #555",
          }}
        >
          +
        </button>
        <button
          onClick={() => onKeyPress("BACK")}
          disabled={disabled}
          className="flex items-center justify-center text-[7px] font-bold font-mono text-white rounded cursor-pointer active:scale-95 transition-transform"
          style={{
            width: 38,
            height: 24,
            background: "linear-gradient(180deg, #4a3a2a 0%, #3a2a1a 50%, #2a1a0a 100%)",
            border: "1px solid #665544",
          }}
        >
          BS
        </button>
        <button
          onClick={() => onKeyPress("ENTER")}
          disabled={disabled}
          className="flex items-center justify-center text-[7px] font-bold font-mono text-white rounded cursor-pointer active:scale-95 transition-transform"
          style={{
            width: 38,
            height: 24,
            background: "linear-gradient(180deg, #2a4a3a 0%, #1a3a2a 50%, #0a2a1a 100%)",
            border: "1px solid #446655",
          }}
        >
          ENT
        </button>
      </div>
    </div>
  );
};

// ─── ROLLER COUNTER (Front-panel mechanical counter display) ────────────────

const RollerCounter: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div className="text-[5px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
    <div className="flex bg-black border border-slate-600 rounded overflow-hidden">
      {String(value)
        .padStart(3, "0")
        .split("")
        .map((d, i) => (
          <div
            key={i}
            className="w-4 h-5 flex items-center justify-center bg-[#0a0a0a] text-[8px] font-mono font-bold text-white"
            style={{
              textShadow: "0 0 2px rgba(200,200,200,0.4)",
              borderRight: i < 2 ? "1px solid #222" : "none",
            }}
          >
            {d}
          </div>
        ))}
    </div>
  </div>
);

// ─── WORK TICKET CLIPBOARD (Physical paper prop) ────────────────────────────

const WorkTicketClipboard: React.FC<{ ticket: ReturnType<typeof generateWorkTicket> }> = ({ ticket }) => (
  <div
    className="flex flex-col border border-amber-800 rounded-sm overflow-hidden"
    style={{
      width: 110,
      background: "linear-gradient(180deg, #f5f0e0 0%, #e8e0c8 100%)",
      boxShadow: "1px 2px 3px rgba(0,0,0,0.3)",
    }}
  >
    {/* Clip */}
    <div className="bg-amber-700 h-3 flex items-center justify-center border-b border-amber-900">
      <div className="w-2 h-2 rounded-full bg-amber-500 border border-amber-900" />
    </div>
    {/* Header */}
    <div className="px-1.5 py-0.5 border-b border-amber-200">
      <div className="text-[5px] font-bold text-amber-900 uppercase tracking-widest">Work Ticket</div>
    </div>
    {/* Values */}
    <div className="px-1.5 py-1 flex flex-col gap-0.5">
      <div className="flex justify-between">
        <span className="text-[5px] text-amber-800 font-bold">SPH</span>
        <span className="text-[6px] text-black font-mono font-bold">{ticket.sphere}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[5px] text-amber-800 font-bold">CYL</span>
        <span className="text-[6px] text-black font-mono font-bold">{ticket.cylinder}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[5px] text-amber-800 font-bold">AXIS</span>
        <span className="text-[6px] text-black font-mono font-bold">{ticket.axis}</span>
      </div>
    </div>
    {/* Footer barcode */}
    <div className="px-1.5 pb-1 flex gap-0.5">
      {[3,1,4,2,5,3,2,4].map((w, i) => (
        <div key={i} style={{ width: w, height: 4 }} className="bg-amber-800" />
      ))}
    </div>
  </div>
);

// ─── SHAPE ICON SVG PATHS ───────────────────────────────────────────────────

const SHAPE_ICONS: Record<LensShape, string> = {
  CIRCLE: "M50,50 m-30,0 a30,30 0 1,0 60,0 a30,30 0 1,0 -60,0",
  SQUARE: "M20,20 L80,20 L80,80 L20,80 Z",
  RECTANGLE: "M15,25 L85,25 L85,75 L15,75 Z",
  AVIATOR: "M50,20 Q80,50 80,70 Q50,85 20,70 Q20,50 50,20 Z",
  "CAT-EYE": "M20,50 Q40,20 50,50 Q60,20 80,50 Q60,80 50,50 Q40,80 20,50 Z",
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export const Coburn2GGenerator: React.FC<Coburn2GGeneratorProps> = ({ onClose }) => {
  type Phase =
    | "JOB_INPUT"
    | "SHOW_SHAPE"
    | "DATA_ENTRY"
    | "LOCKING"
    | "READY_CUT"
    | "CUTTING"
    | "RESULT"
    | "FAILURE";

  const [phase, setPhase] = useState<Phase>("JOB_INPUT");
  const [jobNumber, setJobNumber] = useState("");
  const [shape, setShape] = useState<LensShape>("CIRCLE");
  const shapeDiff = SHAPES[shape];
  const [workTicket, setWorkTicket] = useState(generateWorkTicket());

  type DataField = "sphere" | "cylinder" | "axis";
  const [currentField, setCurrentField] = useState<DataField>("sphere");
  const [dataInput, setDataInput] = useState<Record<DataField, string>>({ sphere: "", cylinder: "", axis: "" });
  const [dataTimer, setDataTimer] = useState<number | null>(null);
  const dataTimerRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number>(0);

  // Cutting cycle
  const [hitsRemaining, setHitsRemaining] = useState(3);
  const [timingPos, setTimingPos] = useState(50);
  const [timingDir, setTimingDir] = useState(1);
  const [currentSpeed, setCurrentSpeed] = useState(shapeDiff.speed);
  const [greenZoneOffset, setGreenZoneOffset] = useState(0);
  const [hitResults, setHitResults] = useState<("perfect" | "ok" | "miss" | "crash")[]>([]);
  const [cuttingActive, setCuttingActive] = useState(false);
  const [timingHitCount, setTimingHitCount] = useState(0);
  const timingAnimRef = useRef<number>(0);

  // Lens surfacing animation state
  const [cutProgress, setCutProgress] = useState(0);
  const [bladeOffset, setBladeOffset] = useState(15); // distance of blade from lens (0 = contacting)

  // Result
  const [score, setScore] = useState(0);
  const [resultMessage, setResultMessage] = useState("");
  const [resultSubtext, setResultSubtext] = useState("");

  // Effects
  const [screenShake, setScreenShake] = useState(false);
  const [stopFlashing, setStopFlashing] = useState(false);
  const [crtBlink, setCrtBlink] = useState(true);
  const [spindleRevs, setSpindleRevs] = useState(false);
  const [chuckAnimating, setChuckAnimating] = useState(false);
  const [countdownWarning, setCountdownWarning] = useState(false);
  const [lensCrashed, setLensCrashed] = useState(false);
  const [rpmDisplay, setRpmDisplay] = useState(0);

  // ── CRT blinking cursor ──────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => setCrtBlink((b) => !b), 600);
    return () => clearInterval(iv);
  }, []);

  // ── Blade animation: when cutting, blade moves in/out with each hit ─────
  useEffect(() => {
    if (phase === "CUTTING" && cuttingActive) {
      // Blade oscillates near the lens surface during cutting
      const iv = setInterval(() => {
        setBladeOffset((prev) => {
          if (prev > 0) return Math.max(0, prev - 0.3);
          return prev;
        });
      }, 100);
      return () => clearInterval(iv);
    } else if (phase === "READY_CUT") {
      setBladeOffset(15);
    } else if (phase === "FAILURE") {
      setBladeOffset(15);
    }
  }, [phase, cuttingActive]);

  // ── RPM display simulation ───────────────────────────────────────────────
  useEffect(() => {
    if (phase === "READY_CUT" || phase === "CUTTING") {
      const target = phase === "CUTTING" ? 11000 : 2000;
      const iv = setInterval(() => {
        setRpmDisplay((prev) => {
          const diff = target - prev;
          if (Math.abs(diff) < 100) return target;
          return prev + Math.sign(diff) * (100 + Math.random() * 200);
        });
      }, 200);
      return () => clearInterval(iv);
    } else {
      setRpmDisplay(0);
    }
  }, [phase]);

  // ── PERFORM TIMING HIT ───────────────────────────────────────────────────
  const performTimingHit = useCallback(() => {
    if (!cuttingActive) return;
    const indicatorEdge = timingPos;
    const zoneStart = greenZoneOffset - shapeDiff.greenZoneWidth / 2;
    const zoneEnd = greenZoneOffset + shapeDiff.greenZoneWidth / 2;
    const crashThreshold = 5;

    let hitType: "perfect" | "ok" | "miss" | "crash";
    if (indicatorEdge >= zoneStart && indicatorEdge <= zoneEnd) {
      const center = (zoneStart + zoneEnd) / 2;
      const perfectRadius = (zoneEnd - zoneStart) * 0.3;
      hitType = Math.abs(indicatorEdge - center) <= perfectRadius ? "perfect" : "ok";
    } else if (indicatorEdge < 0 + crashThreshold || indicatorEdge > 100 - crashThreshold) {
      hitType = "crash";
    } else {
      hitType = "miss";
    }

    setHitResults((prev) => [...prev, hitType]);
    const newHitCount = timingHitCount + 1;
    setTimingHitCount(newHitCount);

    if (hitType === "crash") {
      setCuttingActive(false);
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
      triggerFailure("TOOL CRASH - LENS DESTROYED");
      return;
    }

    // Advance cut progress on hit (even miss advances but with worse quality)
    setCutProgress((prev) => Math.min(3, prev + 1));
    // Blade retracts then advances
    setBladeOffset(10);
    setTimeout(() => setBladeOffset(0), 200);

    if (hitType === "perfect") {
      playBeep(1046, 0.15);
      setTimeout(() => playBeep(1318, 0.2), 100);
    } else if (hitType === "ok") {
      playBeep(784, 0.12);
    } else {
      playBeep(300, 0.25);
    }

    if (newHitCount >= 3) {
      setCuttingActive(false);
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
      setPhase("RESULT");
      calculateResult();
      return;
    }

    setCurrentSpeed((prev) => prev + shapeDiff.speedIncrement);
    setTimingPos(20 + Math.random() * 60);
    setTimingDir(Math.random() > 0.5 ? 1 : -1);
  }, [cuttingActive, timingPos, greenZoneOffset, shapeDiff, timingHitCount]);

  // ── KEYPAD HANDLER ───────────────────────────────────────────────────────
  const handleKeypadPress = useCallback(
    (key: string) => {
      if (phase === "JOB_INPUT") {
        if (/^\d$/.test(key) && jobNumber.length < 4) {
          setJobNumber((prev) => prev + key);
          playBeep(660, 0.06);
        } else if (key === "ENTER" && jobNumber.length === 4) {
          const picked = SHAPE_NAMES[Math.floor(Math.random() * SHAPE_NAMES.length)];
          setShape(picked);
          setPhase("SHOW_SHAPE");
          playBeep(880, 0.15);
        } else if (key === "BACK" && jobNumber.length > 0) {
          setJobNumber((prev) => prev.slice(0, -1));
        }
        return;
      }

            if (phase === "SHOW_SHAPE") {
        if (key === "ENTER" || key === "ENT" || /^\d$/.test(key) || key === "." || key === "-" || key === "+") {
          setPhase("DATA_ENTRY");
          setDataInput({ sphere: "", cylinder: "", axis: "" });
          setCurrentField("sphere");
          playBeep(660, 0.06);
        }
        return;
      }

      if (phase === "DATA_ENTRY") {
        const currentVal = dataInput[currentField];

        if (key === "BACK") {
          setDataInput((prev) => ({ ...prev, [currentField]: prev[currentField].slice(0, -1) }));
          return;
        }

        if (key === "ENTER" || key === "ENT") {
          if (currentField === "axis" && dataInput.sphere && dataInput.cylinder && dataInput.axis) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            playBeep(1100, 0.2);
            setPhase("LOCKING");
          } else {
            const next: Record<DataField, DataField> = { sphere: "cylinder", cylinder: "axis", axis: "axis" };
            setCurrentField(next[currentField]);
            playBeep(770, 0.08);
          }
          return;
        }

        // Type characters
        const fieldLimits: Record<DataField, number> = { sphere: 5, cylinder: 5, axis: 3 };
        if (currentVal.length < fieldLimits[currentField]) {
          if (currentField === "axis" && /^\d$/.test(key)) {
            setDataInput((prev) => ({ ...prev, axis: (prev.axis + key).slice(0, 3) }));
            playBeep(660, 0.05);
          } else if (currentField !== "axis" && (key === "-" || key === "+" || key === "." || /^\d$/.test(key))) {
            if (currentVal === "" && !["+","-","0","1","2","3","4","5","6","7","8","9","."].includes(key)) return;
            if (key === "." && currentVal.includes(".")) return;
            if (key === "-" && currentVal !== "") return;
            if (key === "+" && currentVal !== "") return;
            setDataInput((prev) => ({ ...prev, [currentField]: prev[currentField] + key }));
            playBeep(660, 0.05);
          }
        }
        return;
      }

      // Cutting: space/enter triggers hit
      if (phase === "CUTTING" && cuttingActive && (key === "ENTER" || key === " ")) {
        performTimingHit();
      }
    },
    [phase, jobNumber, dataInput, currentField, cuttingActive, timingPos, greenZoneOffset, shapeDiff, timingHitCount]
  );

  // ── Keyboard handler ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      // Map keyboard to keypad actions
            if (e.key === "Backspace") { handleKeypadPress("BACK"); return; }
      if (e.key === "Enter" || e.key === "NumpadEnter") { handleKeypadPress("ENTER"); return; }
      if (e.key === "+" || e.key === "NumpadAdd") { handleKeypadPress("+"); return; }
      if (e.key === " " || e.key === "Space") {
        if (phase === "CUTTING" && cuttingActive) {
          e.preventDefault();
          performTimingHit();
        }
        return;
      }
      if (/^\d$/.test(e.key) || e.key === "." || e.key === "-") {
        handleKeypadPress(e.key);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKeypadPress, phase, cuttingActive, performTimingHit]);

    // ── DATA ENTRY COUNTDOWN TIMER (15 seconds) ──────────────────────────────
  useEffect(() => {
    if (phase !== "DATA_ENTRY") {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    setDataTimer(15);
    dataTimerRef.current = 15;
    setCountdownWarning(false);
    timerIntervalRef.current = window.setInterval(() => {
      dataTimerRef.current = (dataTimerRef.current ?? 15) - 0.1;
      setDataTimer(Math.round((dataTimerRef.current ?? 15) * 10) / 10);
      if ((dataTimerRef.current ?? 0) <= 3) setCountdownWarning(true);
      if ((dataTimerRef.current ?? 0) <= 0) {
        clearInterval(timerIntervalRef.current);
        triggerFailure("TIME EXPIRED - DATA ENTRY FAILED");
      }
    }, 100);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [phase]);

  // ── CHUCK LOCKING ANIMATION ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "LOCKING") return;
    setChuckAnimating(true);
    playBeep(440, 0.4);
    const t1 = setTimeout(() => playBeep(660, 0.3), 400);
    const t2 = setTimeout(() => {
      setChuckAnimating(false);
      setPhase("READY_CUT");
    }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // ── TIMING BAR ANIMATION LOOP ────────────────────────────────────────────
  useEffect(() => {
    if (!cuttingActive || phase !== "CUTTING") {
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
      return;
    }
    let lastTime = performance.now();
    setGreenZoneOffset(20 + Math.random() * 60);
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      setTimingPos((prev) => {
        const speed = currentSpeed * 45;
        const next = prev + timingDir * speed * dt;
        if (next >= 100) { setTimingDir(-1); return 100; }
        if (next <= 0) { setTimingDir(1); return 0; }
        return next;
      });
      timingAnimRef.current = requestAnimationFrame(animate);
    };
    timingAnimRef.current = requestAnimationFrame(animate);
    return () => { if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current); };
  }, [cuttingActive, phase, currentSpeed, timingDir]);

    // ── CALCULATE RESULT ─────────────────────────────────────────────────────
  const calculateResult = useCallback(() => {
    const target = workTicket;
    const input = dataInput;

    const parseOptic = (s: string) => {
      if (!s || s === "—") return NaN;
      if (s.toUpperCase() === "PL") return 0;
      return parseFloat(s);
    };

    const sphCorrect = parseOptic(input.sphere) === parseOptic(target.sphere);
    const cylCorrect = parseOptic(input.cylinder) === parseOptic(target.cylinder);
    const axisCorrect = parseInt(input.axis) === parseInt(target.axis);

    const dataAccuracy = sphCorrect && cylCorrect && axisCorrect
      ? 40
      : ((sphCorrect ? 1 : 0) + (cylCorrect ? 1 : 0) + (axisCorrect ? 1 : 0)) / 3 * 30;

    const totalHits = hitResults.length;
    if (totalHits === 0) {
      setScore(0);
      setResultMessage("CYCLE ABORTED");
      setResultSubtext("No timing data recorded");
      return;
    }
    const perfectCount = hitResults.filter((h) => h === "perfect").length;
    const okCount = hitResults.filter((h) => h === "ok").length;
    const timingScore = (perfectCount / totalHits) * 60 + (okCount / totalHits) * 35;
    const finalScore = Math.round(dataAccuracy + timingScore);
    setScore(finalScore);

    if (finalScore >= 95) {
      setResultMessage("CYCLE COMPLETE - PREMIUM PAL PASS");
      setResultSubtext("Perfect cut. Lens meets PAL specification.");
    } else if (finalScore >= 70) {
      setResultMessage("MINOR WAVE / REMAKE RISK");
      setResultSubtext("Off-axis thin margin. Inspect before dispensing.");
    } else {
      setResultMessage("REMARK REQUIRED");
      setResultSubtext("Surface irregularity detected. Re-run job.");
    }
    playBeep(1320, 0.3);
    setTimeout(() => playBeep(1760, 0.5), 150);
  }, [workTicket, dataInput, hitResults]);

  // ── TRIGGER FAILURE ──────────────────────────────────────────────────────
  const triggerFailure = useCallback((message: string) => {
    setPhase("FAILURE");
    setScore(0);
    setResultMessage(message);
    setResultSubtext("INSTANT REMAKE REQUIRED");
    setScreenShake(true);
    setStopFlashing(true);
    setLensCrashed(true);
    playFailBuzz();
    setTimeout(() => setScreenShake(false), 2000);
    setTimeout(() => setStopFlashing(false), 4000);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
  }, []);

  // ── BUTTON HANDLERS ──────────────────────────────────────────────────────
  const handleChuck = () => {
    if (phase === "DATA_ENTRY" && dataInput.sphere && dataInput.cylinder && dataInput.axis) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setPhase("LOCKING");
      playBeep(440, 0.15);
    }
  };

  const handleStartCut = () => {
    if (phase !== "READY_CUT") return;
    playBeep(523, 0.1);
    setPhase("CUTTING");
    setCuttingActive(true);
    setHitsRemaining(3);
    setTimingHitCount(0);
    setHitResults([]);
    setCurrentSpeed(shapeDiff.speed);
    setTimingPos(20 + Math.random() * 60);
    setTimingDir(1);
    setGreenZoneOffset(20 + Math.random() * 60);
    setCutProgress(0);
    setBladeOffset(15);
  };

  const handleStop = () => {
    if (cuttingActive) {
      setCuttingActive(false);
      if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
    }
    if (phase === "CUTTING") {
      setPhase("FAILURE");
      setResultMessage("CYCLE MANUALLY ABORTED");
      setResultSubtext("LENS RUINED - INSTANT REMAKE");
      setScreenShake(true);
      setStopFlashing(true);
      setLensCrashed(true);
      setTimeout(() => setScreenShake(false), 1500);
      setTimeout(() => setStopFlashing(false), 3000);
    }
  };

  const handleNewJob = () => {
    setPhase("JOB_INPUT");
    setJobNumber("");
    setShape("CIRCLE");
    setWorkTicket(generateWorkTicket());
    setDataInput({ sphere: "", cylinder: "", axis: "" });
    setCurrentField("sphere");
    setDataTimer(null);
    setHitsRemaining(3);
    setTimingPos(50);
    setTimingDir(1);
    setCurrentSpeed(1);
    setGreenZoneOffset(0);
    setHitResults([]);
    setCuttingActive(false);
    setTimingHitCount(0);
    setScore(0);
    setResultMessage("");
    setResultSubtext("");
    setScreenShake(false);
    setStopFlashing(false);
    setChuckAnimating(false);
    setSpindleRevs(false);
    setCountdownWarning(false);
    setCutProgress(0);
    setBladeOffset(15);
    setLensCrashed(false);
    setRpmDisplay(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timingAnimRef.current) cancelAnimationFrame(timingAnimRef.current);
  };

  // ── CRT Display helpers ──────────────────────────────────────────────────
  const crtTitle = () => {
    switch (phase) {
      case "JOB_INPUT": return "ENTER JOB TICKET:";
      case "SHOW_SHAPE": return `JOB #${jobNumber} - SHAPE`;
      case "DATA_ENTRY": return "KEY PRESCRIPTION DATA";
      case "LOCKING": return "CHUCK LOCKING...";
      case "READY_CUT": return `READY - ${rpmDisplay.toLocaleString()} RPM`;
      case "CUTTING": return `CUTTING - ${rpmDisplay.toLocaleString()} RPM`;
      case "RESULT": return `SCORE: ${score}%`;
      case "FAILURE": return "!!! CRITICAL ERROR !!!";
    }
  };

  const crtSubText = () => {
    if (phase === "RESULT") return resultMessage;
    if (phase === "FAILURE") return resultMessage;
    if (phase === "SHOW_SHAPE") return `TARGET: ${SHAPES[shape].label}`;
    if (phase === "DATA_ENTRY" && dataTimer !== null) return `TIME: ${dataTimer.toFixed(1)}s`;
    return "";
  };

  const isInGreenZone = phase === "CUTTING" && timingPos >= greenZoneOffset - shapeDiff.greenZoneWidth / 2 && timingPos <= greenZoneOffset + shapeDiff.greenZoneWidth / 2;

  return (
    <div className="fixed inset-0 z-300 bg-black/90 flex items-center justify-center p-4 font-mono select-none">
      <motion.div
        animate={screenShake ? { x: [0,-6,6,-4,4,-2,2,0], y: [0,4,-4,3,-3,2,-2,0] } : {}}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative flex gap-4"
      >
        {/* ── MACHINE CHASSIS ─────────────────────────────────────────────── */}
        <div
          className="relative border-[6px] border-[#5a6a6a] rounded-xl shadow-[12px_12px_0_0_rgba(0,0,0,0.85)]"
          style={{
            width: 640,
            background: "linear-gradient(170deg, #c0c8c8 0%, #a0aaaa 30%, #8a9494 60%, #7a8484 100%)",
          }}
        >
          {/* Machine Brand Strip */}
          <div className="bg-[#4a5252] px-4 py-1.5 flex items-center justify-between border-b-[3px] border-[#3a4242]">
            <span className="text-[8px] font-bold tracking-[3px] text-[#c8d0d0] uppercase">Coburn / Optek</span>
            <span className="text-[7px] font-bold tracking-[2px] text-[#889898] italic">2G Generator</span>
          </div>

          {/* ── TOP SECTION: CRT (right) + Work Ticket (left of CRT) ─────── */}
          <div className="flex p-2 gap-2">
            {/* Work Ticket Clipboard (left of CRT) */}
            <div className="flex items-start pt-1">
              <WorkTicketClipboard ticket={workTicket} />
            </div>

            {/* CRT MONITOR (top-right) */}
            <div
              className="border-[5px] border-[#4a5252] rounded-lg overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative"
              style={{
                backgroundColor: "#2a2a3e",
                width: 300,
                height: 160,
              }}
            >
              {/* CRT bezel label */}
              <div className="bg-[#3a4242] px-2 py-0.5 flex items-center justify-between border-b-2 border-[#2a3232]">
                <span className="text-[5px] text-[#889898] font-bold tracking-widest uppercase">CRT</span>
                <span className="text-[5px] text-[#ff6666] font-bold">● ON</span>
              </div>

              {/* Screen */}
              <div
                className="relative h-full"
                style={{
                  background: "radial-gradient(ellipse at center, #1a2a5e 0%, #0e1e3e 60%, #08081a 100%)",
                  boxShadow: "inset 0 0 60px rgba(40, 40, 180, 0.3)",
                }}
              >
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none opacity-15"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,40,0.3) 2px, rgba(0,0,40,0.3) 4px)" }}
                />
                {/* CRT glow */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(100, 100, 255, 0.08) 0%, transparent 70%)" }}
                />

                {/* Content */}
                <div className="relative h-full p-2 flex flex-col">
                  {/* Title */}
                  <div className="text-[8px] font-bold text-[#7a7aff] mb-1" style={{ textShadow: "0 0 6px rgba(100,100,255,0.5)" }}>
                    {">"} {crtTitle()}
                    {crtBlink && <span className="ml-1 text-blue-300">█</span>}
                  </div>
                  <div className="text-[6px] text-[#5a8aff] mb-1" style={{ textShadow: "0 0 4px rgba(80,100,255,0.4)" }}>
                    {crtSubText()}
                  </div>

                  {/* Phase-specific content */}
                  {phase === "JOB_INPUT" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1">
                      <div className="text-[18px] font-bold text-[#aaaaff]" style={{ textShadow: "0 0 12px rgba(100,100,255,0.6)" }}>
                        {jobNumber.padEnd(4, "_").split("").map((c,i)=>(
                          <span key={i} className={c === "_" ? "opacity-30" : ""}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {phase === "SHOW_SHAPE" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1">
                      <svg viewBox="0 0 100 100" className="w-16 h-16">
                        <path d={SHAPE_ICONS[shape]} fill="none" stroke="#7a7aff" strokeWidth="3" strokeDasharray="4 3" />
                      </svg>
                    </div>
                  )}

                  {phase === "DATA_ENTRY" && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                      <div className="flex gap-4">
                        {(["sphere","cylinder","axis"] as DataField[]).map((field) => (
                          <div key={field} className="flex flex-col items-center">
                            <div className="text-[5px] text-[#5a8aff] uppercase">{field === "axis" ? "AX" : field === "sphere" ? "SPH" : "CYL"}</div>
                            <div className={`text-[10px] font-bold ${currentField === field ? "text-[#aaaaff] animate-pulse" : "text-[#5a7acc]"}`}>
                              {dataInput[field] || "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Countdown timer */}
                      {dataTimer !== null && (
                        <div
                          className="mt-1 text-[7px] font-bold"
                          style={{ color: countdownWarning ? "#ff4444" : "#44aaff" }}
                        >
                          {dataTimer.toFixed(1)}s
                        </div>
                      )}
                    </div>
                  )}

                  {phase === "LOCKING" && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-[10px] text-[#aaaaff] animate-pulse">● LOCKING CHUCK ●</div>
                    </div>
                  )}

                  {phase === "READY_CUT" && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-[7px] text-[#44ff44] text-center">
                        <div>PRESS START</div>
                        <div className="mt-0.5 text-[5px] text-[#44aa44]">Shape: {shapeDiff.label}</div>
                        <div className="text-[5px] text-[#4488aa]">{rpmDisplay.toLocaleString()} RPM</div>
                      </div>
                    </div>
                  )}

                  {phase === "CUTTING" && (
                    <div className="flex-1 flex flex-col justify-center">
                      {/* Timing bar */}
                      <div className="mt-1">
                        <div className="relative w-full h-5 bg-[#0a0a1a] border border-[#334] rounded overflow-hidden">
                          {/* Green zone */}
                          <div
                            className="absolute top-0 bottom-0 bg-[#228822] opacity-40"
                            style={{ left: `${greenZoneOffset - shapeDiff.greenZoneWidth / 2}%`, width: `${shapeDiff.greenZoneWidth}%` }}
                          />
                          {/* Green zone center line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-[#44ff44]"
                            style={{ left: `${greenZoneOffset}%` }}
                          />
                          {/* Red danger zones at edges */}
                          <div className="absolute top-0 bottom-0 left-0 w-[5%] bg-[#ff2222] opacity-30" />
                          <div className="absolute top-0 bottom-0 right-0 w-[5%] bg-[#ff2222] opacity-30" />
                          {/* Indicator */}
                          <div
                            className="absolute top-0.5 bottom-0.5 w-1.5 bg-white rounded-sm transition-colors"
                            style={{
                              left: `calc(${timingPos}% - 3px)`,
                              backgroundColor: isInGreenZone ? "#44ff44" : timingPos < 5 || timingPos > 95 ? "#ff2222" : "#ffdd44",
                              boxShadow: isInGreenZone ? "0 0 6px #44ff44" : "none",
                            }}
                          />
                        </div>
                      </div>
                      {/* Hit counter */}
                      <div className="flex justify-center gap-1 mt-1">
                        {[0,1,2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: i < timingHitCount ? "#44ff44" : "#334",
                              boxShadow: i < timingHitCount ? "0 0 4px #44ff44" : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {(phase === "RESULT" || phase === "FAILURE") && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-1">
                      <div
                        className="text-[10px] font-bold text-center"
                        style={{
                          color: phase === "FAILURE" ? "#ff4444" : score >= 95 ? "#44ff44" : "#ffdd44",
                          textShadow: `0 0 8px ${phase === "FAILURE" ? "#ff4444" : "#44ff44"}66`,
                        }}
                      >
                        {resultMessage}
                      </div>
                      <div className="text-[5px] text-[#aaaaff] text-center">{resultSubtext}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── MIDDLE SECTION: Hood Window + Keypad side by side ─────────── */}
          <div className="flex p-2 gap-2">
            {/* DARK TINTED CENTRAL HOOD WINDOW (cutting animation viewport) */}
            <div
              className="relative rounded-md overflow-hidden border-[3px] border-[#3a4242] flex-1"
              style={{
                height: 160,
                background: "linear-gradient(180deg, #0a0a12 0%, #12121e 50%, #0a0a12 100%)",
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,255,0.05)",
              }}
            >
              {/* Hood rim highlight */}
              <div className="absolute inset-0 border border-[#4a5252]/30 rounded-md pointer-events-none z-10" />
              {/* Top hood label */}
              <div className="absolute top-1 left-2 text-[5px] text-slate-600 uppercase tracking-widest z-10">CUTTING CHAMBER</div>
              {/* Safety glass reflection */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
                }}
              />
              {/* The cutting animation */}
              <LensCutAnimation
                cutProgress={cutProgress}
                cutting={cuttingActive}
                crashed={lensCrashed}
                bladeOffset={bladeOffset}
              />
            </div>

            {/* Numeric Keypad (below CRT area, right side) */}
            <div
              className="rounded-md border-2 border-[#4a5252] flex flex-col items-center"
              style={{
                background: "linear-gradient(180deg, #3a4242 0%, #2a3232 100%)",
              }}
            >
              <div className="text-[5px] text-[#889898] uppercase tracking-widest mt-1 mb-0.5">KEYPAD</div>
              <Keypad onKeyPress={handleKeypadPress} disabled={phase === "LOCKING" || phase === "FAILURE"} />
            </div>
          </div>

          {/* ── BOTTOM CONTROLS PANEL ────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 py-2 border-t-[3px] border-[#3a4242]"
            style={{
              background: "linear-gradient(180deg, #4a5252 0%, #3a4242 100%)",
            }}
          >
            {/* Left side: BLUE CHUCK button + roller counters */}
            <div className="flex items-center gap-4">
              {/* BLUE CHUCK BUTTON */}
              <button
                onClick={handleChuck}
                disabled={phase !== "DATA_ENTRY" && phase !== "READY_CUT"}
                className="flex items-center justify-center rounded-md font-bold text-[7px] text-white uppercase cursor-pointer active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  width: 50,
                  height: 40,
                  background: "linear-gradient(180deg, #4488cc 0%, #2266aa 40%, #1a4a7a 100%)",
                  border: "2px solid #5599dd",
                  borderTopColor: "#77bbff",
                  borderLeftColor: "#77bbff",
                  boxShadow: "0 2px 0 #0a2a4a, inset 0 1px 0 rgba(255,255,255,0.2)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                CHUCK
              </button>

              {/* Roller counters */}
              <RollerCounter value={timingHitCount} label="CUTS" />
              <RollerCounter value={Math.round(score)} label="SCORE" />
            </div>

            {/* Right side: RED STOP + GREEN START buttons */}
            <div className="flex items-center gap-3">
              {/* RED STOP BUTTON */}
              <button
                onClick={handleStop}
                disabled={!cuttingActive && phase !== "CUTTING"}
                className="flex items-center justify-center rounded-md font-bold text-[7px] text-white uppercase cursor-pointer active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  width: 44,
                  height: 40,
                  background: stopFlashing
                    ? "#ff2222"
                    : "linear-gradient(180deg, #cc4444 0%, #aa2222 40%, #881111 100%)",
                  border: "2px solid #dd5555",
                  borderTopColor: "#ff7777",
                  borderLeftColor: "#ff7777",
                  boxShadow: stopFlashing ? "0 0 12px #ff2222" : "0 2px 0 #441111",
                  animation: stopFlashing ? "stop-flash 0.4s steps(2) infinite" : "none",
                }}
              >
                STOP
              </button>

              {/* GREEN START BUTTON */}
              <button
                onClick={handleStartCut}
                disabled={phase !== "READY_CUT"}
                className="flex items-center justify-center rounded-md font-bold text-[7px] text-white uppercase cursor-pointer active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  width: 44,
                  height: 40,
                  background: "linear-gradient(180deg, #44cc44 0%, #22aa22 40%, #118811 100%)",
                  border: "2px solid #55dd55",
                  borderTopColor: "#77ff77",
                  borderLeftColor: "#77ff77",
                  boxShadow: "0 2px 0 #0a2a0a, inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                START
              </button>

              {/* CLOSE / NEW JOB */}
              <button
                onClick={phase === "RESULT" || phase === "FAILURE" ? handleNewJob : onClose}
                className="flex items-center justify-center rounded-md font-bold text-[6px] text-white uppercase cursor-pointer active:scale-95 transition-transform"
                style={{
                  width: 50,
                  height: 36,
                  background: "linear-gradient(180deg, #666 0%, #444 40%, #333 100%)",
                  border: "2px solid #777",
                  borderTopColor: "#999",
                  borderLeftColor: "#999",
                  boxShadow: "0 2px 0 #222",
                }}
              >
                {phase === "RESULT" || phase === "FAILURE" ? "NEW JOB" : "CLOSE"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── GLOBAL KEYFRAMES ────────────────────────────────────────────── */}
      <style>{`
        @keyframes stop-flash {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #ff2222; }
          50% { opacity: 0.6; box-shadow: 0 0 20px #ff2222, 0 0 40px #ff222266; }
        }
        @keyframes blade-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};