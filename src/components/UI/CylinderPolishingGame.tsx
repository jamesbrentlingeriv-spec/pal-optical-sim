/**
 * Cylinder Machine Polishing Cycle
 * =================================
 * A retro pixel-art mini-game simulating a lens polishing machine.
 *
 * Gameplay:
 *  - 30-second cycle timer counts down.
 *  - "Slurry Level" meter depletes over time; player must click
 *    "Inject Polish/Slurry" to refill it. If it hits zero → Lenses
 *    overheat and scratch → FAILURE.
 *  - Random "Pressure Spike" events cause one of the two bays to
 *    flash red. Player has 3 seconds to click that bay to "Tighten
 *    Clamp." If missed → Lens pops off chuck → FAILURE.
 *  - If timer reaches 0 without any failure → SUCCESS.
 *
 * Animation:
 *  - Spindles rotate with looping CSS keyframe orbital motion + vibration.
 *  - On failure, lenses show cracked/cloudy texture and animations stop.
 *
 * Visual style: 16-bit retro pixel art with "Press Start 2P" font,
 *               high-contrast color flashes for alerts.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

interface CylinderPolishingGameProps {
  onClose: () => void;
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

/** Total cycle duration in seconds */
const CYCLE_DURATION = 30;

/** How often (ms) the slurry meter depletes by one tick */
const SLURRY_DEPLETION_INTERVAL = 250;

/** Slurry meter total capacity (arbitrary units) */
const MAX_SLURRY = 100;

/** Slurry depletion per tick */
const SLURRY_DEPLETION_RATE = 2.2;

/** How much slurry a single inject refills */
const SLURRY_INJECT_AMOUNT = 40;

/** Minimum slurry level before inject is allowed (prevents spam at full) */
const SLURRY_INJECT_THRESHOLD = MAX_SLURRY - SLURRY_INJECT_AMOUNT + 5;

/** Minimum interval (ms) between slurry injects to prevent flooding */
const INJECT_COOLDOWN = 400;

/** Interval (ms) between random pressure spike checks */
const PRESSURE_SPIKE_CHECK_INTERVAL = 800;

/** Probability (0–1) of a pressure spike occurring per check */
const PRESSURE_SPIKE_CHANCE = 0.12;

/** Time window (ms) the player has to respond to a pressure spike */
const PRESSURE_SPIKE_TIMEOUT = 3000;

/** Index for left bay */
const BAY_LEFT = 0;
/** Index for right bay */
const BAY_RIGHT = 1;

// ─── PIXEL-ART COLOR PALETTE ──────────────────────────────────────────────────

const COLORS = {
  /** Dark bg for the overlay */
  overlayBg: "rgba(0,0,0,0.85)",
  /** Main cabinet body – industrial blue */
  cabinetBody: "#1a3a5c",
  /** Darker shade for cabinet depth */
  cabinetDark: "#0f2440",
  /** Lighter shade for cabinet highlights */
  cabinetLight: "#2a5a8c",
  /** Cabinet panel / door color */
  panelColor: "#1e4d7a",
  /** Panel border (metallic trim) */
  panelBorder: "#3a7abf",
  /** Overhead lamp glow */
  lampGlow: "#ffdd77",
  /** Lamp housing */
  lampHousing: "#4a4a4a",
  /** Spindle / chuck metal */
  spindleMetal: "#6a7a8a",
  /** Lens blank color when healthy */
  lensColor: "#aaddff",
  /** Lens edge highlight */
  lensEdge: "#88bbdd",
  /** Lens color when ruined (cracked/cloudy) */
  lensRuined: "#667788",
  /** Lens cracked texture color */
  lensCrack: "#445566",
  /** Gauge needle color */
  needleColor: "#ff3333",
  /** Gauge face background */
  gaugeFace: "#0a0a1a",
  /** Gauge tick mark color */
  gaugeTick: "#33ff33",
  /** Button base – prominent red */
  buttonRed: "#cc2222",
  /** Button highlight */
  buttonRedLight: "#ee4444",
  /** Button shadow */
  buttonRedDark: "#881111",
  /** Green button */
  buttonGreen: "#22aa22",
  buttonGreenLight: "#44cc44",
  buttonGreenDark: "#117711",
  /** Yellow/amber button */
  buttonAmber: "#ccaa22",
  buttonAmberLight: "#eebb44",
  buttonAmberDark: "#997711",
  /** Status indicator off */
  indicatorOff: "#222222",
  /** Status indicator on */
  indicatorGreen: "#33ff33",
  /** Pressure spike alert color */
  alertRed: "#ff2222",
  alertRedFlash: "#ff6666",
  /** Slurry meter bar fill */
  slurryColor: "#44aaff",
  /** Slurry meter warning (low) */
  slurryWarning: "#ffaa22",
  /** Slurry meter critical */
  slurryCritical: "#ff2222",
  /** Text colors */
  textWhite: "#ffffff",
  textYellow: "#ffdd00",
  textRed: "#ff3333",
  textGreen: "#33ff33",
  textCyan: "#33ddff",
  /** Screen/display background */
  screenBg: "#0a1a0a",
  screenText: "#33ff33",
};

// ─── COMPONENT ─────────────────────────────────────────────────────────────────

export function CylinderPolishingGame({ onClose }: CylinderPolishingGameProps) {
  // ─── STATE ──────────────────────────────────────────────────────────────────

  /** Whether the cycle is active (spindles down, timer counting) */
  const [cycleActive, setCycleActive] = useState(false);

  /** Remaining cycle time in seconds (displayed as integer) */
  const [timeLeft, setTimeLeft] = useState(CYCLE_DURATION);

  /** Current slurry level (0 = empty = failure) */
  const [slurryLevel, setSlurryLevel] = useState(MAX_SLURRY);

  /** Whether a pressure spike is active on a given bay (null = none) */
  const [pressureSpikeBay, setPressureSpikeBay] = useState<number | null>(null);

  /** Remaining time (ms) for the player to respond to the current spike */
  const [spikeTimeLeft, setSpikeTimeLeft] = useState(PRESSURE_SPIKE_TIMEOUT);

  /** Game result: null = playing, "win" = success, "fail" = failure */
  type GameResult = null | "win" | "fail";
  const [result, setResult] = useState<GameResult>(null);

  /** Failure reason string displayed on loss */
  const [failureReason, setFailureReason] = useState("");

  /** Whether the lenses are ruined (triggers cracked texture) */
  const [lensesRuined, setLensesRuined] = useState(false);

  /** Cooldown timer for inject button */
  const [injectCooldown, setInjectCooldown] = useState(false);

  /** Flash overlay for visual feedback */
  const [flashColor, setFlashColor] = useState<string | null>(null);

  /** Spike timer bar width percentage */
  const [spikeTimerPercent, setSpikeTimerPercent] = useState(100);

  // ─── REFS ───────────────────────────────────────────────────────────────────

  /** Main game loop interval */
  const gameLoopRef = useRef<number | null>(null);

  /** Slurry depletion interval */
  const slurryIntervalRef = useRef<number | null>(null);

  /** Pressure spike generation interval */
  const spikeIntervalRef = useRef<number | null>(null);

  /** Spike response timer interval */
  const spikeTimerRef = useRef<number | null>(null);

  /** Time tracking for spike timer */
  const spikeStartTimeRef = useRef<number>(0);

  /** Whether component is mounted (prevent state updates after unmount) */
  const mountedRef = useRef(true);

  // ─── CLEANUP ON UNMOUNT ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Clear all intervals on unmount
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (slurryIntervalRef.current) clearInterval(slurryIntervalRef.current);
      if (spikeIntervalRef.current) clearInterval(spikeIntervalRef.current);
      if (spikeTimerRef.current) clearInterval(spikeTimerRef.current);
    };
  }, []);

  // ─── START CYCLE ────────────────────────────────────────────────────────────
  //
  // Called when the player clicks the START button. Resets all state to
  // initial values, then begins the timer, slurry depletion, and pressure
  // spike generation loops.
  //
  const startCycle = useCallback(() => {
    // Reset all state
    setCycleActive(true);
    setTimeLeft(CYCLE_DURATION);
    setSlurryLevel(MAX_SLURRY);
    setPressureSpikeBay(null);
    setSpikeTimeLeft(PRESSURE_SPIKE_TIMEOUT);
    setResult(null);
    setFailureReason("");
    setLensesRuined(false);
    setFlashColor(null);
    setSpikeTimerPercent(100);
    setInjectCooldown(false);

    // ─── MAIN GAME LOOP (1-second timer countdown) ────────────────────────
    //
    // Decrements the cycle timer every second. When it hits 0, the cycle
    // ends and if no failure has occurred, it's a SUCCESS.
    //
    const startTime = Date.now();
    const totalDuration = CYCLE_DURATION * 1000;

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    gameLoopRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        // Timer expired — check if we won or already failed
        if (mountedRef.current) {
          setResult("win");
          setCycleActive(false);
        }
      }
    }, 100);

    // ─── SLURRY DEPLETION LOOP ────────────────────────────────────────────
    //
    // The slurry meter drains over time. If it reaches 0, the lenses
    // overheat and become scratched → FAILURE.
    //
    if (slurryIntervalRef.current) clearInterval(slurryIntervalRef.current);
    slurryIntervalRef.current = window.setInterval(() => {
      setSlurryLevel((prev) => {
        const next = prev - SLURRY_DEPLETION_RATE;
        if (next <= 0 && mountedRef.current) {
          // Slurry depleted → failure
          setFailureReason("LENSES SCRATCHED — SLURRY DEPLETED");
          setResult("fail");
          setLensesRuined(true);
          setCycleActive(false);
          return 0;
        }
        return Math.max(0, next);
      });
    }, SLURRY_DEPLETION_INTERVAL);

    // ─── PRESSURE SPIKE GENERATOR ─────────────────────────────────────────
    //
    // Periodically attempts to trigger a pressure spike on a random bay.
    // The player has 3 seconds to click the affected bay to "Tighten Clamp."
    //
    if (spikeIntervalRef.current) clearInterval(spikeIntervalRef.current);
    spikeIntervalRef.current = window.setInterval(() => {
      // Only trigger if no spike is currently active
      setPressureSpikeBay((currentBay) => {
        if (currentBay !== null) return currentBay; // already active

        if (Math.random() < PRESSURE_SPIKE_CHANCE) {
          // Pick a random bay (0 or 1)
          const bay = Math.random() < 0.5 ? BAY_LEFT : BAY_RIGHT;

          // Start the spike timer
          spikeStartTimeRef.current = Date.now();
          setSpikeTimeLeft(PRESSURE_SPIKE_TIMEOUT);
          setSpikeTimerPercent(100);

          // Clear any existing spike timer
          if (spikeTimerRef.current) clearInterval(spikeTimerRef.current);

          // Spike response timer: ticks down from 3 seconds
          spikeTimerRef.current = window.setInterval(() => {
            const elapsed = Date.now() - spikeStartTimeRef.current;
            const remaining = Math.max(0, PRESSURE_SPIKE_TIMEOUT - elapsed);
            const percent = (remaining / PRESSURE_SPIKE_TIMEOUT) * 100;
            setSpikeTimeLeft(remaining);
            setSpikeTimerPercent(percent);

            if (remaining <= 0 && mountedRef.current) {
              // Player failed to respond → lens pops off → FAILURE
              setFailureReason("LENS POPPED OFF CHUCK — PRESSURE SPIKE UNCHECKED");
              setResult("fail");
              setLensesRuined(true);
              setCycleActive(false);
              // Clear spike state
              setPressureSpikeBay(null);
              if (spikeTimerRef.current) clearInterval(spikeTimerRef.current);
            }
          }, 50);

          return bay;
        }
        return null;
      });
    }, PRESSURE_SPIKE_CHECK_INTERVAL);
  }, []);

  // ─── INJECT SLURRY ──────────────────────────────────────────────────────────
  //
  // Refills the slurry meter by a set amount. Has a cooldown to prevent
  // rapid-fire clicking that would trivialize the mechanic.
  //
  const injectSlurry = useCallback(() => {
    if (!cycleActive || injectCooldown || result) return;

    setInjectCooldown(true);
    setTimeout(() => {
      if (mountedRef.current) setInjectCooldown(false);
    }, INJECT_COOLDOWN);

    setSlurryLevel((prev) => {
      const next = prev + SLURRY_INJECT_AMOUNT;
      return Math.min(MAX_SLURRY, next);
    });

    // Visual flash feedback
    setFlashColor(COLORS.slurryColor);
    setTimeout(() => {
      if (mountedRef.current) setFlashColor(null);
    }, 150);
  }, [cycleActive, injectCooldown, result]);

  // ─── TIGHTEN CLAMP (Handle Pressure Spike) ──────────────────────────────────
  //
  // Called when the player clicks a bay during a pressure spike. If the
  // clicked bay matches the active spike bay, the emergency is resolved.
  //
  const handleBayClick = useCallback(
    (bayIndex: number) => {
      if (!cycleActive || result) return;
      if (pressureSpikeBay !== bayIndex) return; // wrong bay, ignore

      // Successfully resolved the spike
      setPressureSpikeBay(null);
      if (spikeTimerRef.current) clearInterval(spikeTimerRef.current);
      setFlashColor(COLORS.textGreen);
      setTimeout(() => {
        if (mountedRef.current) setFlashColor(null);
      }, 200);
    },
    [cycleActive, pressureSpikeBay, result],
  );

  // ─── CLOSE HANDLER ──────────────────────────────────────────────────────────
  //
  const handleClose = useCallback(() => {
    // Clean up all intervals
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (slurryIntervalRef.current) clearInterval(slurryIntervalRef.current);
    if (spikeIntervalRef.current) clearInterval(spikeIntervalRef.current);
    if (spikeTimerRef.current) clearInterval(spikeTimerRef.current);
    onClose();
  }, [onClose]);

  // ─── COMPUTE SLURRY BAR COLOR ───────────────────────────────────────────────
  //
  const getSlurryColor = () => {
    const pct = (slurryLevel / MAX_SLURRY) * 100;
    if (pct > 50) return COLORS.slurryColor;
    if (pct > 25) return COLORS.slurryWarning;
    return COLORS.slurryCritical;
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center"
      style={{
        backgroundColor: COLORS.overlayBg,
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Main cabinet chassis – a large dual-chamber blue industrial cabinet */}
      <div
        className="relative"
        style={{ width: 820, height: 560 }}
      >
        {/* ─── OVERHEAD LAMP ──────────────────────────────────────────────── */}
        <div
          className="absolute"
          style={{
            top: -30,
            left: "50%",
            marginLeft: -60,
            width: 120,
            height: 40,
            zIndex: 10,
          }}
        >
          {/* Lamp housing (trapezoid shape via clip-path) */}
          <div
            style={{
              width: 120,
              height: 30,
              backgroundColor: COLORS.lampHousing,
              clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
              border: "3px solid #333",
            }}
          />
          {/* Lamp glow */}
          <div
            className="absolute"
            style={{
              top: 25,
              left: 20,
              width: 80,
              height: 16,
              backgroundColor: COLORS.lampGlow,
              borderRadius: "0 0 50% 50%",
              boxShadow: `0 0 20px ${COLORS.lampGlow}, 0 0 40px ${COLORS.lampGlow}66`,
              opacity: cycleActive ? 1 : 0.6,
            }}
          />
        </div>

        {/* ─── CABINET BODY ───────────────────────────────────────────────── */}
        <div
          className="relative w-full h-full rounded-sm"
          style={{
            backgroundColor: COLORS.cabinetBody,
            border: "6px solid #0f2440",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.5), 8px 8px 0 rgba(0,0,0,0.3)",
          }}
        >
          {/* Cabinet top ridge */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 20,
              backgroundColor: COLORS.cabinetDark,
              borderBottom: "3px solid #0a1a2a",
            }}
          />

          {/* ─── HUD / DISPLAY PANEL (Top Bar) ──────────────────────────── */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 20,
              right: 20,
              height: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 5,
            }}
          >
            {/* Timer Display */}
            <div
              className="flex items-center gap-3"
              style={{ fontSize: 10 }}
            >
              <span style={{ color: COLORS.textCyan }}>TIME</span>
              <div
                style={{
                  backgroundColor: COLORS.screenBg,
                  border: "3px solid #33ff33",
                  padding: "4px 10px",
                  color: timeLeft <= 10 ? COLORS.textRed : COLORS.screenText,
                  fontSize: 16,
                }}
              >
                {String(timeLeft).padStart(2, "0")}
              </div>
            </div>

            {/* Machine Status Title */}
            <div
              style={{
                color: COLORS.textYellow,
                fontSize: 10,
                textAlign: "center",
                textShadow: "2px 2px 0 rgba(0,0,0,0.5)",
              }}
            >
              CYLINDER POLISHER
              <br />
              <span style={{ fontSize: 7, color: COLORS.textCyan }}>
                MODEL CP-2000
              </span>
            </div>

            {/* Status Lights */}
            <div className="flex gap-3 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    backgroundColor: cycleActive
                      ? result === "fail"
                        ? COLORS.textRed
                        : COLORS.indicatorGreen
                      : COLORS.indicatorOff,
                    border: "2px solid #555",
                    boxShadow:
                      cycleActive
                        ? `0 0 8px ${result === "fail" ? COLORS.textRed : COLORS.indicatorGreen}`
                        : "none",
                  }}
                />
                <span style={{ color: COLORS.textWhite, fontSize: 6 }}>
                  {result === "fail" ? "FAIL" : result === "win" ? "DONE" : cycleActive ? "RUN" : "STBY"}
                </span>
              </div>
            </div>
          </div>

          {/* ─── SEPARATOR BAR ──────────────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              top: 68,
              left: 10,
              right: 10,
              height: 4,
              backgroundColor: COLORS.cabinetDark,
              borderTop: "2px solid #0a1a2a",
              borderBottom: "2px solid #2a5a8c",
            }}
          />

          {/* ─── DUAL BAYS ──────────────────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              top: 80,
              left: 10,
              right: 10,
              bottom: 90,
              display: "flex",
              gap: 10,
            }}
          >
            {/* ── LEFT BAY ───────────────────────────────────────────── */}
            <BayChamber
              bayIndex={BAY_LEFT}
              label="BAY A"
              cycleActive={cycleActive}
              pressureSpike={pressureSpikeBay === BAY_LEFT}
              spikeTimerPercent={spikeTimerPercent}
              lensesRuined={lensesRuined}
              result={result}
              onBayClick={handleBayClick}
            />

            {/* Center divider */}
            <div
              style={{
                width: 20,
                backgroundColor: COLORS.cabinetDark,
                borderLeft: "2px solid #0a1a2a",
                borderRight: "2px solid #2a5a8c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 60,
                  backgroundColor: COLORS.panelBorder,
                  opacity: 0.5,
                }}
              />
            </div>

            {/* ── RIGHT BAY ──────────────────────────────────────────── */}
            <BayChamber
              bayIndex={BAY_RIGHT}
              label="BAY B"
              cycleActive={cycleActive}
              pressureSpike={pressureSpikeBay === BAY_RIGHT}
              spikeTimerPercent={spikeTimerPercent}
              lensesRuined={lensesRuined}
              result={result}
              onBayClick={handleBayClick}
            />
          </div>

          {/* ─── BOTTOM CONTROLS PANEL ────────────────────────────────── */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 85,
              backgroundColor: COLORS.cabinetDark,
              borderTop: "4px solid #0a1a2a",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 12,
            }}
          >
            {/* Slurry Meter */}
            <div className="flex flex-col gap-1" style={{ flex: 1 }}>
              <div
                className="flex items-center justify-between"
                style={{ fontSize: 7 }}
              >
                <span style={{ color: COLORS.textCyan }}>SLURRY</span>
                <span
                  style={{
                    color: slurryLevel <= 25 ? COLORS.slurryCritical : COLORS.textWhite,
                    fontSize: 7,
                  }}
                >
                  {Math.round(slurryLevel)}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 14,
                  backgroundColor: "#0a0a1a",
                  border: "3px solid #333",
                  borderTopColor: "#555",
                  borderLeftColor: "#555",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(slurryLevel / MAX_SLURRY) * 100}%`,
                    backgroundColor: getSlurryColor(),
                    transition: "width 0.15s linear, background-color 0.3s",
                    boxShadow: `inset 0 0 6px ${getSlurryColor()}88`,
                  }}
                />
              </div>
            </div>

            {/* Inject Slurry Button */}
            <button
              onClick={injectSlurry}
              disabled={!cycleActive || injectCooldown || result !== null}
              style={{
                padding: "6px 12px",
                fontSize: 7,
                fontFamily: "'Press Start 2P', monospace",
                backgroundColor: cycleActive && !injectCooldown && !result
                  ? COLORS.buttonAmber
                  : "#555",
                color: COLORS.textWhite,
                border: "3px solid",
                borderColor: cycleActive && !injectCooldown && !result
                  ? COLORS.buttonAmberLight
                  : "#333",
                borderTopColor: cycleActive && !injectCooldown && !result
                  ? COLORS.buttonAmberLight
                  : "#444",
                borderLeftColor: cycleActive && !injectCooldown && !result
                  ? COLORS.buttonAmberLight
                  : "#444",
                cursor: cycleActive && !injectCooldown && !result ? "pointer" : "not-allowed",
                boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {injectCooldown ? "COOLDOWN..." : "INJECT SLURRY"}
            </button>

            {/* START Button */}
            <button
              onClick={startCycle}
              disabled={cycleActive && !result}
              style={{
                padding: "6px 16px",
                fontSize: 8,
                fontFamily: "'Press Start 2P', monospace",
                backgroundColor: !cycleActive || result
                  ? COLORS.buttonGreen
                  : "#555",
                color: COLORS.textWhite,
                border: "3px solid",
                borderColor: !cycleActive || result
                  ? COLORS.buttonGreenLight
                  : "#333",
                borderTopColor: !cycleActive || result
                  ? COLORS.buttonGreenLight
                  : "#444",
                borderLeftColor: !cycleActive || result
                  ? COLORS.buttonGreenLight
                  : "#444",
                cursor: !cycleActive || result ? "pointer" : "not-allowed",
                boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                textTransform: "uppercase",
                animation:
                  !cycleActive || result
                    ? "pulse-border 1s steps(2) infinite"
                    : "none",
              }}
            >
              {result === "win"
                ? "CLEAR"
                : result === "fail"
                  ? "RETRY"
                  : cycleActive
                    ? "RUNNING..."
                    : "START"}
            </button>

            {/* CLOSE Button */}
            <button
              onClick={handleClose}
              disabled={cycleActive && !result}
              style={{
                padding: "6px 10px",
                fontSize: 7,
                fontFamily: "'Press Start 2P', monospace",
                backgroundColor: COLORS.buttonRed,
                color: COLORS.textWhite,
                border: "3px solid",
                borderColor: COLORS.buttonRedLight,
                borderTopColor: COLORS.buttonRedLight,
                borderLeftColor: COLORS.buttonRedLight,
                cursor: (!cycleActive || result) ? "pointer" : "not-allowed",
                opacity: (!cycleActive || result) ? 1 : 0.5,
                boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              CLOSE
            </button>
          </div>

          {/* ─── FLASH OVERLAY ───────────────────────────────────────────── */}
          {flashColor && (
            <div
              className="pointer-events-none"
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: flashColor,
                opacity: 0.15,
                zIndex: 20,
                transition: "opacity 0.1s",
              }}
            />
          )}

          {/* ─── RESULT OVERLAY ──────────────────────────────────────────── */}
          {(result === "win" || result === "fail") && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                backgroundColor: "rgba(0,0,0,0.6)",
                zIndex: 25,
              }}
            >
              <div
                className="flex flex-col items-center gap-4 p-6"
                style={{
                  backgroundColor: result === "win" ? "#0a2a0a" : "#2a0a0a",
                  border: `6px solid ${result === "win" ? COLORS.textGreen : COLORS.textRed}`,
                  boxShadow: `0 0 30px ${result === "win" ? COLORS.textGreen : COLORS.textRed}66`,
                }}
              >
                {/* Success Message */}
                {result === "win" && (
                  <>
                    <div
                      style={{
                        color: COLORS.textGreen,
                        fontSize: 14,
                        textAlign: "center",
                        textShadow: `0 0 10px ${COLORS.textGreen}`,
                      }}
                    >
                      CYCLE COMPLETE
                    </div>
                    <div
                      style={{
                        color: COLORS.textYellow,
                        fontSize: 10,
                        textAlign: "center",
                      }}
                    >
                      CRYSTAL CLEAR CLEARANCE
                    </div>
                    {/* Animated sparkle effect */}
                    <div className="flex gap-2 mt-2">
                      {["✦", "✦", "✦"].map((s, i) => (
                        <span
                          key={i}
                          className="inline-block"
                          style={{
                            color: COLORS.textYellow,
                            fontSize: 14,
                            animation: `sparkle 0.6s ${i * 0.15}s steps(2) infinite`,
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Failure Message */}
                {result === "fail" && (
                  <>
                    <div
                      style={{
                        color: COLORS.textRed,
                        fontSize: 14,
                        textAlign: "center",
                        textShadow: `0 0 10px ${COLORS.textRed}`,
                        animation: "flash-text 0.5s steps(2) infinite",
                      }}
                    >
                      FAILURE
                    </div>
                    <div
                      style={{
                        color: COLORS.textYellow,
                        fontSize: 8,
                        textAlign: "center",
                        maxWidth: 300,
                      }}
                    >
                      {failureReason}
                    </div>
                    {/* Cracked lens icon */}
                    <div
                      style={{
                        color: COLORS.textRed,
                        fontSize: 28,
                        marginTop: 4,
                      }}
                    >
                      💔
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ─── GAUGES (Left + Right above bays) ─────────────────────────── */}
          {/* Left Gauge */}
          <div
            className="absolute flex flex-col items-center"
            style={{ top: 74, left: 100, zIndex: 6 }}
          >
            <NeedleGauge
              label="PSI"
              value={pressureSpikeBay === BAY_LEFT ? 95 : 45 + Math.sin(Date.now() / 1000) * 10}
              max={100}
              alert={pressureSpikeBay === BAY_LEFT}
            />
          </div>

          {/* Right Gauge */}
          <div
            className="absolute flex flex-col items-center"
            style={{ top: 74, right: 100, zIndex: 6 }}
          >
            <NeedleGauge
              label="PSI"
              value={pressureSpikeBay === BAY_RIGHT ? 95 : 45 + Math.sin(Date.now() / 1000 + 2) * 10}
              max={100}
              alert={pressureSpikeBay === BAY_RIGHT}
            />
          </div>
        </div>

        {/* ─── INSTRUCTION TEXT ─────────────────────────────────────────── */}
        <div
          className="absolute"
          style={{
            bottom: -30,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 7,
            color: COLORS.textWhite,
            opacity: result ? 0 : 0.6,
          }}
        >
          {!cycleActive && !result && "Press START to begin the polishing cycle"}
          {cycleActive &&
            !result &&
            "Monitor slurry | Click flashing bay to tighten clamp"}
        </div>
      </div>

      {/* ─── GLOBAL KEYFRAME STYLES ───────────────────────────────────────── */}
      <style>{`
        @keyframes spin-lens-left {
          0% { transform: rotate(0deg) translateX(3px) rotate(0deg); }
          25% { transform: rotate(90deg) translateX(3px) rotate(-90deg); }
          50% { transform: rotate(180deg) translateX(3px) rotate(-180deg); }
          75% { transform: rotate(270deg) translateX(3px) rotate(-270deg); }
          100% { transform: rotate(360deg) translateX(3px) rotate(-360deg); }
        }
        @keyframes spin-lens-right {
          0% { transform: rotate(0deg) translateX(-3px) rotate(0deg); }
          25% { transform: rotate(-90deg) translateX(-3px) rotate(90deg); }
          50% { transform: rotate(-180deg) translateX(-3px) rotate(180deg); }
          75% { transform: rotate(-270deg) translateX(-3px) rotate(270deg); }
          100% { transform: rotate(-360deg) translateX(-3px) rotate(360deg); }
        }
        @keyframes vibrate-lens {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
        }
        @keyframes gauge-needle {
          0% { transform: rotate(-45deg); }
          100% { transform: rotate(45deg); }
        }
        @keyframes spike-flash {
          0%, 100% { background-color: ${COLORS.alertRed}; }
          50% { background-color: ${COLORS.alertRedFlash}; }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: ${COLORS.buttonGreenLight}; }
          50% { border-color: ${COLORS.textWhite}; }
        }
        @keyframes flash-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.3); }
        }
        @keyframes gauge-pulse {
          0%, 100% { box-shadow: 0 0 4px ${COLORS.alertRed}; }
          50% { box-shadow: 0 0 12px ${COLORS.alertRed}, 0 0 20px ${COLORS.alertRed}66; }
        }
        @keyframes spin-spindle-left {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-spindle-right {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── BAY CHAMBER SUB-COMPONENT ─────────────────────────────────────────────────
//
// Each bay contains two spindles with lens blanks. When active, the lenses
// animate with orbital motion and vibration. On failure, they show a
// cracked texture.
//
interface BayChamberProps {
  bayIndex: number;
  label: string;
  cycleActive: boolean;
  pressureSpike: boolean;
  spikeTimerPercent: number;
  lensesRuined: boolean;
  result: "win" | "fail" | null;
  onBayClick: (bayIndex: number) => void;
}

function BayChamber({
  bayIndex,
  label,
  cycleActive,
  pressureSpike,
  spikeTimerPercent,
  lensesRuined,
  result,
  onBayClick,
}: BayChamberProps) {
  // Determine if this bay is the one that is spiking
  const isSpikingRef = React.useRef(pressureSpike);
  isSpikingRef.current = pressureSpike;

  return (
    <div
      onClick={() => onBayClick(bayIndex)}
      className="relative flex flex-1 flex-col items-center justify-center cursor-pointer select-none"
      style={{
        backgroundColor: pressureSpike
          ? COLORS.alertRed
          : COLORS.panelColor,
        border: "4px solid",
        borderColor: pressureSpike
          ? COLORS.alertRedFlash
          : COLORS.panelBorder,
        animation: pressureSpike ? "spike-flash 0.4s steps(2) infinite" : "none",
        boxShadow: pressureSpike
          ? `inset 0 0 20px ${COLORS.alertRed}, 0 0 15px ${COLORS.alertRed}`
          : "inset 0 0 10px rgba(0,0,0,0.3)",
        transition: "background-color 0.15s, border-color 0.15s",
      }}
    >
      {/* Bay Label */}
      <div
        style={{
          position: "absolute",
          top: 4,
          left: 6,
          fontSize: 6,
          color: pressureSpike ? COLORS.textWhite : COLORS.textCyan,
          fontWeight: "bold",
        }}
      >
        {label}
      </div>

      {/* Pressure Spike Countdown Timer Bar (visible only during spike) */}
      {pressureSpike && (
        <div
          className="absolute"
          style={{
            top: 16,
            left: 6,
            right: 6,
            height: 6,
            backgroundColor: "#0a0a1a",
            border: "2px solid #555",
            zIndex: 5,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${spikeTimerPercent}%`,
              backgroundColor:
                spikeTimerPercent > 50
                  ? COLORS.textGreen
                  : spikeTimerPercent > 25
                    ? COLORS.textYellow
                    : COLORS.textRed,
              transition: "width 0.05s linear",
            }}
          />
        </div>
      )}

      {/* Pressure spike instruction text */}
      {pressureSpike && (
        <div
          className="absolute"
          style={{
            bottom: 16,
            fontSize: 6,
            color: COLORS.textYellow,
            textAlign: "center",
            animation: "flash-text 0.4s steps(2) infinite",
            zIndex: 5,
          }}
        >
          TIGHTEN CLAMP!
        </div>
      )}

      {/* ─── SPINDLES (2 per bay) ───────────────────────────────────────── */}
      <div
        className="flex gap-6 items-center justify-center"
        style={{ marginTop: 8 }}
      >
        {/* Spindle 1 */}
        <SpindleUnit
          position="left"
          cycleActive={cycleActive}
          lensesRuined={lensesRuined}
          result={result}
        />

        {/* Spindle 2 */}
        <SpindleUnit
          position="right"
          cycleActive={cycleActive}
          lensesRuined={lensesRuined}
          result={result}
        />
      </div>
    </div>
  );
}

// ─── SPINDLE UNIT SUB-COMPONENT ────────────────────────────────────────────────
//
// A single spindle with a circular lens blank. When active, the lens rotates
// with an orbital motion and vibrates. On failure, the lens shows a cracked
// appearance and stops animating.
//
interface SpindleUnitProps {
  position: "left" | "right";
  cycleActive: boolean;
  lensesRuined: boolean;
  result: "win" | "fail" | null;
}

function SpindleUnit({
  position,
  cycleActive,
  lensesRuined,
  result,
}: SpindleUnitProps) {
  const isLeft = position === "left";

  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: 2 }}
    >
      {/* Spindle shaft / chuck */}
      <div
        style={{
          width: 8,
          height: 16,
          backgroundColor: COLORS.spindleMetal,
          borderLeft: "2px solid #8a9aaa",
          borderRight: "2px solid #4a5a6a",
          borderTop: "2px solid #8a9aaa",
        }}
      />

      {/* Spindle base (wider metal ring) */}
      <div
        style={{
          width: 22,
          height: 6,
          backgroundColor: COLORS.spindleMetal,
          border: "2px solid #4a5a6a",
          borderTopColor: "#8a9aaa",
          borderLeftColor: "#8a9aaa",
          borderRadius: "2px",
        }}
      />

      {/* Lens blank – animated rotation + vibration when active */}
      <div
        className="relative"
        style={{
          width: 48,
          height: 48,
          animation: cycleActive && !lensesRuined
            ? isLeft
              ? "spin-lens-left 1.2s linear infinite, vibrate-lens 0.08s linear infinite"
              : "spin-lens-right 1.2s linear infinite, vibrate-lens 0.08s linear infinite"
            : "none",
        }}
      >
        {/* Main lens circle */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "50%",
            backgroundColor: lensesRuined ? COLORS.lensRuined : COLORS.lensColor,
            border: `3px solid ${lensesRuined ? COLORS.lensCrack : COLORS.lensEdge}`,
            boxShadow: lensesRuined
              ? "inset 0 0 15px rgba(0,0,0,0.5)"
              : `inset 0 0 8px ${COLORS.lensColor}88, 0 0 6px ${COLORS.lensColor}44`,
            opacity: lensesRuined ? 0.6 : 1,
          }}
        >
          {/* Lens highlight/shine */}
          {!lensesRuined && (
            <div
              style={{
                position: "absolute",
                top: 6,
                left: 8,
                width: 14,
                height: 8,
                backgroundColor: "rgba(255,255,255,0.3)",
                borderRadius: "50%",
                transform: "rotate(-30deg)",
              }}
            />
          )}

          {/* Cracked lens texture (shown on failure) */}
          {lensesRuined && (
            <div
              className="absolute inset-0"
              style={{
                borderRadius: "50%",
                overflow: "hidden",
              }}
            >
              {/* Crack lines */}
              <svg
                viewBox="0 0 48 48"
                className="absolute inset-0"
                style={{ width: 48, height: 48 }}
              >
                <line
                  x1="24" y1="4" x2="14" y2="44"
                  stroke={COLORS.lensCrack}
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <line
                  x1="10" y1="12" x2="40" y2="30"
                  stroke={COLORS.lensCrack}
                  strokeWidth="1"
                  opacity="0.7"
                />
                <line
                  x1="30" y1="6" x2="22" y2="38"
                  stroke={COLORS.lensCrack}
                  strokeWidth="1.2"
                  opacity="0.6"
                />
                <line
                  x1="6" y1="28" x2="42" y2="18"
                  stroke={COLORS.lensCrack}
                  strokeWidth="1"
                  opacity="0.5"
                />
                {/* Cloudy spots */}
                <circle
                  cx="18" cy="20" r="6"
                  fill={COLORS.lensCrack}
                  opacity="0.2"
                />
                <circle
                  cx="32" cy="32" r="5"
                  fill={COLORS.lensCrack}
                  opacity="0.15"
                />
                <circle
                  cx="14" cy="36" r="4"
                  fill={COLORS.lensCrack}
                  opacity="0.2"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Center chuck dot */}
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: 8,
            height: 8,
            marginTop: -4,
            marginLeft: -4,
            borderRadius: "50%",
            backgroundColor: COLORS.spindleMetal,
            border: "2px solid #4a5a6a",
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}

// ─── NEEDLE GAUGE SUB-COMPONENT ────────────────────────────────────────────────
//
// A small retro-style analog gauge with a needle that oscillates.
//
interface NeedleGaugeProps {
  label: string;
  value: number;
  max: number;
  alert: boolean;
}

function NeedleGauge({ label, value, max, alert }: NeedleGaugeProps) {
  const pct = Math.min(100, (value / max) * 100);
  // Map percentage (0-100) to rotation angle (-45deg to +45deg)
  const rotation = -45 + (pct / 100) * 90;

  return (
    <div
      className="flex flex-col items-center"
      style={{
        animation: alert ? "gauge-pulse 0.4s steps(2) infinite" : "none",
      }}
    >
      {/* Gauge face */}
      <div
        style={{
          width: 36,
          height: 24,
          backgroundColor: COLORS.gaugeFace,
          border: "2px solid #555",
          borderRadius: "2px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Tick marks */}
        <div
          style={{
            position: "absolute",
            bottom: 2,
            left: 4,
            width: 2,
            height: 4,
            backgroundColor: COLORS.gaugeTick,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 2,
            left: 17,
            width: 2,
            height: 6,
            backgroundColor: COLORS.gaugeTick,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 2,
            right: 4,
            width: 2,
            height: 4,
            backgroundColor: COLORS.gaugeTick,
          }}
        />

        {/* Needle */}
        <div
          style={{
            position: "absolute",
            bottom: 2,
            left: "50%",
            width: 2,
            height: 14,
            backgroundColor: alert ? COLORS.alertRed : COLORS.needleColor,
            transformOrigin: "bottom center",
            transform: `rotate(${rotation}deg)`,
            transition: "transform 0.15s ease",
            borderRadius: "1px",
          }}
        />

        {/* Center dot */}
        <div
          style={{
            position: "absolute",
            bottom: 1,
            left: "50%",
            width: 4,
            height: 4,
            marginLeft: -2,
            borderRadius: "50%",
            backgroundColor: COLORS.needleColor,
            zIndex: 2,
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: 5,
          color: alert ? COLORS.alertRed : COLORS.textCyan,
          marginTop: 1,
        }}
      >
        {label}
      </span>
    </div>
  );
}