import { useState, useEffect, useRef, useCallback } from "react";
import { GameMode, LabJob, DayFinancials } from "../types";

// ── Time Management ─────────────────────────────────────────────
export function useGameClock(gameMode: GameMode, globalPause: boolean) {
  const [gameTime, setGameTime] = useState({ hours: 9, minutes: 0 });
  const [isDayEnded, setIsDayEnded] = useState(false);
  const [isClockPaused, setIsClockPaused] = useState(false);

  // 1 game minute = 83.33ms real (1 hour = 5s real → 9 hours = 45s)
  // But spec says 1 hour = 5 real MINUTES = 300,000ms
  // 300,000ms / 3600 increments = 83.33ms per game minute
  // Total day: 9 hours * 60 = 540 game minutes. 540 * 83.33 = ~45,000ms = 45 seconds
  const GAME_MINUTE_MS = 300_000 / 3600; // ~83.33ms per game minute

  useEffect(() => {
    if (gameMode === GameMode.FREE) {
      setGameTime({ hours: 9, minutes: 0 });
      setIsDayEnded(false);
      return;
    }
    if (globalPause || isClockPaused || isDayEnded) return;

    const interval = setInterval(() => {
      setGameTime((prev) => {
        let m = prev.minutes + 1;
        let h = prev.hours;
        if (m >= 60) { m = 0; h++; }
        if (h >= 18) {
          setIsDayEnded(true);
          return { hours: 18, minutes: 0 };
        }
        return { hours: h, minutes: m };
      });
    }, GAME_MINUTE_MS);

    return () => clearInterval(interval);
  }, [gameMode, globalPause, isClockPaused, isDayEnded]);

  const resetDay = useCallback(() => {
    setGameTime({ hours: 9, minutes: 0 });
    setIsDayEnded(false);
  }, []);

  const timeString = `${gameTime.hours === 12 ? 12 : gameTime.hours > 12 ? gameTime.hours - 12 : gameTime.hours}:${gameTime.minutes.toString().padStart(2, "0")} ${gameTime.hours >= 12 ? "PM" : "AM"}`;
  const progress = Math.min(1, (gameTime.hours - 9) / 9 + gameTime.minutes / 540);

  return { gameTime, timeString, progress, isDayEnded, isClockPaused, setIsClockPaused, resetDay };
}

// ── Financials ────────────────────────────────────────────────────
export function useFinancials() {
  const [financials, setFinancials] = useState<DayFinancials>({
    cashRevenue: 0,
    cardRevenue: 0,
    dockedPenalties: 0,
    transactions: [],
  });

  const addRevenue = useCallback((amount: number, method: "cash" | "card") => {
    setFinancials((prev) => ({
      ...prev,
      cashRevenue: prev.cashRevenue + (method === "cash" ? amount : 0),
      cardRevenue: prev.cardRevenue + (method === "card" ? amount : 0),
      transactions: [...prev.transactions, { amount, method, time: new Date().toLocaleTimeString() }],
    }));
  }, []);

  const addPenalty = useCallback((amount: number) => {
    setFinancials((prev) => ({
      ...prev,
      dockedPenalties: prev.dockedPenalties + amount,
    }));
  }, []);

  const getTotalRevenue = () => financials.cashRevenue + financials.cardRevenue;
  const getNetProfit = () => getTotalRevenue() - financials.dockedPenalties;

  const resetFinancials = useCallback(() => {
    setFinancials({ cashRevenue: 0, cardRevenue: 0, dockedPenalties: 0, transactions: [] });
  }, []);

  return { financials, addRevenue, addPenalty, getTotalRevenue, getNetProfit, resetFinancials };
}

// ── Patient Patience Timer ────────────────────────────────────────
export function usePatientPatience(
  patients: any[],
  setPatients: React.Dispatch<React.SetStateAction<any[]>>,
  gameMode: GameMode,
  globalPause: boolean,
  addPenalty: (amount: number) => void,
) {
  // Free Mode: no patience timers
  useEffect(() => {
    if (gameMode === GameMode.FREE) return;
    if (globalPause) return;

    const interval = setInterval(() => {
      setPatients((prev) =>
        prev.map((p: any) => {
          if (p.status !== "WAITING" || p.patience === undefined) return p;
          const newPatience = (p.patience || 180) - 1;
          if (newPatience <= 0) {
            addPenalty(25);
            return { ...p, leftShop: true, patience: 0 };
          }
          return { ...p, patience: newPatience };
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, globalPause, patients.length]);
}

// ── Lab Jobs ──────────────────────────────────────────────────────
export function useLabJobs() {
  const [labJobs, setLabJobs] = useState<LabJob[]>([]);

  const addLabJob = useCallback((job: LabJob) => {
    setLabJobs((prev) => [...prev, job]);
  }, []);

  return { labJobs, addLabJob };
}

// ── Linda Chore System ────────────────────────────────────────────
export function useLindaChores(gameMode: GameMode, globalPause: boolean, addPenalty: (amount: number) => void) {
  const [lindaChore, setLindaChore] = useState<{
    active: boolean;
    timer: number;
    targetType: string;
    message: string;
  }>({ active: false, timer: 150, targetType: "display", message: "" });

  const choreTimerRef = useRef<NodeJS.Timeout | null>(null);
  const choreSpawnRef = useRef<NodeJS.Timeout | null>(null);

  // Spawn random chores in career mode
  useEffect(() => {
    if (gameMode !== GameMode.CAREER) return;

    const spawnChore = () => {
      if (lindaChore.active) return;
      const msgs = [
        "Linda says to clean the mirrors and frames!",
        "Linda wants the display cases dusted!",
        "Linda noticed the frames need cleaning!",
      ];
      setLindaChore({
        active: true,
        timer: 150, // 150 seconds = 30 in-game minutes
        targetType: Math.random() > 0.5 ? "display" : "display_case",
        message: msgs[Math.floor(Math.random() * msgs.length)],
      });
    };

    choreSpawnRef.current = setInterval(() => {
      spawnChore();
    }, 30000 + Math.random() * 30000); // 30-60 seconds

    return () => {
      if (choreSpawnRef.current) clearInterval(choreSpawnRef.current);
    };
  }, [gameMode, lindaChore.active]);

  // Countdown timer
  useEffect(() => {
    if (!lindaChore.active || globalPause) return;

    choreTimerRef.current = setInterval(() => {
      setLindaChore((prev) => {
        if (prev.timer <= 1) {
          addPenalty(50);
          return { active: false, timer: 0, targetType: prev.targetType, message: "" };
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return () => {
      if (choreTimerRef.current) clearInterval(choreTimerRef.current);
    };
  }, [lindaChore.active, globalPause]);

  const completeChore = useCallback(() => {
    if (!lindaChore.active) return;
    if (choreTimerRef.current) clearInterval(choreTimerRef.current);
    setLindaChore({ active: false, timer: 0, targetType: "display", message: "" });
  }, [lindaChore.active]);

  return { lindaChore, completeChore };
}

// ── Main Hook bundler ─────────────────────────────────────────────
export function useGameSystems(gameMode: GameMode) {
  const [globalPause, setGlobalPause] = useState(false);

  const clock = useGameClock(gameMode, globalPause);
  const financials = useFinancials();
  const { labJobs, addLabJob } = useLabJobs();
  const { lindaChore, completeChore } = useLindaChores(gameMode, globalPause, financials.addPenalty);

  // We don't call usePatientPatience here—it needs patients state from GameWorld.
  // Instead we export a helper and let GameWorld wire it in.

  return {
    gameMode,
    globalPause,
    setGlobalPause,
    clock,
    financials,
    labJobs,
    addLabJob,
    lindaChore,
    completeChore,
  };
}