import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GameState, Patient, Position, GameMode } from "../types";
import {
  SHOP_WIDTH,
  SHOP_HEIGHT,
  NPCS,
  SHOP_OBJECTS,
  BRAND_ASSETS,
} from "../constants";
import {
  Eye,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  User,
  Package,
  CreditCard,
  ChevronRight,
  Printer as PrinterIcon,
  Volume2,
  VolumeX,
  Hand,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import Lensometer from "./UI/Lensometer";
import Computer from "./UI/Computer";
import Phone from "./UI/Phone";
import { WriteUpGame } from "./UI/WriteUpGame";
import { CharacterSprite } from "./CharacterSprite";
import { FrameCleaningGame } from "./UI/FrameCleaningGame";
import { FrameFittingGame } from "./UI/FrameFittingGame";
import { EyeExamGame } from "./UI/EyeExamGame";
import { AutorefractorGame } from "./UI/AutorefractorGame";
import { EdgerGame } from "./UI/EdgerGame";
import { Coburn2GGenerator } from "./UI/Coburn2GGenerator";
import { CylinderPolishingGame } from "./UI/CylinderPolishingGame";
import ClinicLogOverlay from "./UI/ClinicLogOverlay";
import WriteUpForm from "./UI/WriteUpForm";
import DayEndOverlay from "./UI/DayEndOverlay";
import { useWindowSize } from "../hooks/useWindowSize";
import { useGameSystems, usePatientPatience } from "../hooks/useGameSystems";

interface GameWorldProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  audioSettings: { volume: number; muted: boolean };
  onUpdateAudio: (settings: { volume: number; muted: boolean }) => void;
  playerCharacterId?: string | null;
  gameMode?: GameMode;
  key?: string;
  bgMusicRef?: React.RefObject<HTMLAudioElement | null>;
  phoneRingRef?: React.RefObject<HTMLAudioElement | null>;
}

const PATIENT_AVATARS_MALE = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150&h=150",
];

const PATIENT_AVATARS_FEMALE = [
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1531123897727-40c1ce63126f?auto=format&fit=crop&q=80&w=150&h=150",
];

const PATIENT_BASES_MALE = [
  "patients/male1/states/a_modern_day_npc_with_random_clothing",
  "patients/male2/states/a_modern_day_npc_with_random_clothing",
];

const PATIENT_BASES_FEMALE = [
  "patients/female1/states/a_modern_day_npc_with_random_clothing_female",
  "patients/female2/states/a_modern_day_npc_with_random_clothing_female_mexic",
  "patients/female3/states/a_modern_day_npc_with_random_clothing_female_afric",
];

let nextMaleSpriteIndex = 0;
let nextFemaleSpriteIndex = 0;

const MALE_NAMES = [
  "Robert", "David", "Michael", "Christopher", "Andrew", "James", "Daniel", "Matthew", "Brian", "Kevin",
  "Steven", "Thomas", "Mark", "Jason", "Paul", "Jeffrey", "Richard", "Kenneth", "Charles", "Scott",
];
const FEMALE_NAMES = [
  "Jennifer", "Maria", "Laura", "Sarah", "Karen", "Michelle", "Jessica", "Amanda", "Stephanie", "Nicole",
  "Angela", "Elizabeth", "Lisa", "Melissa", "Rebecca", "Deborah", "Sandra", "Donna", "Carolyn", "Ruth",
];

export default function GameWorld({
  gameState,
  setGameState,
  audioSettings,
  onUpdateAudio,
  playerCharacterId,
  gameMode = GameMode.CAREER,
  bgMusicRef,
  phoneRingRef,
}: GameWorldProps) {
  const [playerPos, setPlayerPos] = useState<Position>({ x: SHOP_WIDTH / 2, y: SHOP_HEIGHT / 2 });
  const [playerDirection, setPlayerDirection] = useState<"north"|"south"|"east"|"west"|"north-east"|"north-west"|"south-east"|"south-west">("south");
  const [isPlayerMoving, setIsPlayerMoving] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  // ── Game Systems ──
  const systems = useGameSystems(gameMode);
  const { clock, financials, labJobs, addLabJob, lindaChore, completeChore } = systems;

  // Patient patience timers
  usePatientPatience(patients, setPatients, gameMode, systems.globalPause, financials.addPenalty);

  // ── Toasts ──
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  // ── Initial patient spawn ──
  useEffect(() => {
    if (patients.length === 0) {
      const isMale = Math.random() > 0.5;
      const spriteBase = isMale
        ? (() => { const base = PATIENT_BASES_MALE[nextMaleSpriteIndex % PATIENT_BASES_MALE.length]; nextMaleSpriteIndex++; return base; })()
        : (() => { const base = PATIENT_BASES_FEMALE[nextFemaleSpriteIndex % PATIENT_BASES_FEMALE.length]; nextFemaleSpriteIndex++; return base; })();
      const namesList = isMale ? MALE_NAMES : FEMALE_NAMES;
      const avatarsList = isMale ? PATIENT_AVATARS_MALE : PATIENT_AVATARS_FEMALE;
      const initialPatient: Patient = {
        id: "initial-patient",
        name: namesList[Math.floor(Math.random() * namesList.length)] + " " + ["Doe","Smith","Jones","Miller","Wilson"][Math.floor(Math.random()*5)],
        insurance: "VSP", avatar: avatarsList[0],
        prescription: { sphere: "-1.50" as any, cylinder: "-0.50" as any, axis: 180 },
        status: "WAITING", needsEyeExam: Math.random() > 0.5, spriteBase,
        x: 950, y: 200, isMoving: false, patience: 180,
      } as any;
      setPatients([initialPatient]);
    }
  }, []);

  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [isPhoneRinging, setIsPhoneRinging] = useState(false);
  const [showPhoneFlash, setShowPhoneFlash] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [tracySpeechVisible, setTracySpeechVisible] = useState(false);
  const [aprilSpeechVisible, setAprilSpeechVisible] = useState(false);
  const [lisaSpeech, setLisaSpeech] = useState<string | null>(null);
  const [lindaSpeech, setLindaSpeech] = useState<string | null>(null);
  const [carribyanSpeech, setCarribyanSpeech] = useState<string | null>(null);
  const [jamesSpeech, setJamesSpeech] = useState<string | null>(null);
  const [sara, setSara] = useState<any | null>(null);
  const [isSageEnthusiasm, setIsSageEnthusiasm] = useState(false);
  const [sagePhase, setSagePhase] = useState<0 | 1 | 2>(0);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<"cleaning" | "fitting" | "writeup" | null>(null);
  const [activeExamPatient, setActiveExamPatient] = useState<Patient | null>(null);
  const [cleaningBrand, setCleaningBrand] = useState<string | null>(null);
  const [fittingPatient, setFittingPatient] = useState<Patient | null>(null);
  const [fittingMeasurements, setFittingMeasurements] = useState({ frameWidth: 50, bridgeWidth: 50, templeLength: 50 });
  const [robbyJobStep, setRobbyJobStep] = useState<"IDLE" | "NEED_FRAME" | "COLLECTED_FRAME">("IDLE");
  const [dialogue, setDialogue] = useState<{ speaker: string; message: string } | null>(null);
  useEffect(() => { if (!dialogue) return; const t = window.setTimeout(() => setDialogue(null), 2500); return () => window.clearTimeout(t); }, [dialogue]);

  const [tasks, setTasks] = useState<{ [key: string]: boolean }>({ check_inventory: false, greet_patients: false });
  const [clinicLogOpen, setClinicLogOpen] = useState(false);

  // ── Show write-up form instead of old WriteUpGame ──
  const [showWriteUpForm, setShowWriteUpForm] = useState(false);

  const playerInfo = NPCS.find((n) => n.id === playerCharacterId) || NPCS[0];
  const [npcStates, setNpcStates] = useState(
    NPCS.filter((n) => n.id !== playerCharacterId && n.id !== "sara").map((n) => ({
      ...n, direction: "south" as any, targetX: n.x, targetY: n.y, isMoving: false,
    })) as any,
  );
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const dialogueTarget = dialogue ? (() => {
    const key = dialogue.speaker.toLowerCase().replace(/\./g, "").trim();
    if (key === "james") return { x: playerPos.x, y: playerPos.y };
    const speakerMap: Record<string, string> = { "dr robbins": "dr_robbins", "dr klecker": "drklecker", robby: "robby", april: "april", tracy: "tracy", lisa: "lisa", linda: "linda", carribyan: "carribyan", nairobi: "nairobi" };
    const id = speakerMap[key] || NPCS.find((n) => n.name.toLowerCase() === key)?.id;
    if (!id) return null;
    return npcStates.find((n: any) => n.id === id) || NPCS.find((n) => n.id === id) || null;
  })() : null;

  // ── Spawn patients periodically ──
  useEffect(() => {
    const checkAndSpawn = () => {
      if (patients.length < 2) {
        const isMale = Math.random() > 0.5;
        const spriteBase = isMale
          ? (() => { const base = PATIENT_BASES_MALE[nextMaleSpriteIndex % PATIENT_BASES_MALE.length]; nextMaleSpriteIndex++; return base; })()
          : (() => { const base = PATIENT_BASES_FEMALE[nextFemaleSpriteIndex % PATIENT_BASES_FEMALE.length]; nextFemaleSpriteIndex++; return base; })();
        const namesList = isMale ? MALE_NAMES : FEMALE_NAMES;
        const avatarsList = isMale ? PATIENT_AVATARS_MALE : PATIENT_AVATARS_FEMALE;
        const newPatient: Patient = {
          id: Math.random().toString(36).substr(2, 9),
          name: namesList[Math.floor(Math.random() * namesList.length)] + " " + ["Doe","Smith","Jones","Miller","Wilson"][Math.floor(Math.random()*5)],
          insurance: ["VSP","EyeMed","Blue Shield","Aetna"][Math.floor(Math.random()*4)],
          avatar: avatarsList[Math.floor(Math.random() * avatarsList.length)],
          prescription: { sphere: (Math.random()*4-2).toFixed(2) as any, cylinder: (Math.random()*2-1).toFixed(2) as any, axis: Math.floor(Math.random()*180) },
          status: "WAITING", needsEyeExam: Math.random() > 0.5,
          spriteBase, x: 950 + patients.length * 80, y: 200, direction: "south", targetX: 950 + patients.length * 80, targetY: 200, isMoving: false,
          patience: 180,
        } as any;
        setPatients((prev) => [...prev, newPatient]);
        setJamesSpeech("How may i help you?");
        setTimeout(() => setJamesSpeech(null), 4000);
      }
    };
    if (patients.length === 0) checkAndSpawn();
    const interval = setInterval(checkAndSpawn, 12000);
    return () => clearInterval(interval);
  }, [patients.length]);

  // ── Character Random Movement (NPCs and Patients) ──
  useEffect(() => { /* ... movement logic unchanged ... */ return; }, []);

  // ── Game Loop for movement ──
  useEffect(() => {
    if (gameState !== GameState.PLAYING || clinicLogOpen) return;
    const interval = setInterval(() => {
      let moved = false;
      setPlayerPos((prev) => {
        let nx = prev.x, ny = prev.y;
        const speed = 5;
        if (keysPressed.current["ArrowUp"] || keysPressed.current["w"]) { ny -= speed; moved = true; }
        if (keysPressed.current["ArrowDown"] || keysPressed.current["s"]) { ny += speed; moved = true; }
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) { nx -= speed; moved = true; }
        if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) { nx += speed; moved = true; }
        setIsPlayerMoving(moved);
        let dx = "", dy = "";
        if (keysPressed.current["ArrowUp"] || keysPressed.current["w"]) dy = "north";
        if (keysPressed.current["ArrowDown"] || keysPressed.current["s"]) dy = "south";
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) dx = "west";
        if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) dx = "east";
        if (dx && dy) setPlayerDirection(`${dy}-${dx}` as any);
        else if (dx) setPlayerDirection(dx as any);
        else if (dy) setPlayerDirection(dy as any);
        nx = Math.max(20, Math.min(SHOP_WIDTH - 20, nx));
        ny = Math.max(20, Math.min(SHOP_HEIGHT - 20, ny));
        const w1 = 600, dt1 = 150, db1 = 350;
        if (Math.abs(nx - w1) < 20 && (ny < dt1 || ny > db1)) nx = prev.x < w1 ? w1 - 20 : w1 + 20;
        const w2 = 1800, dt2 = 350, db2 = 550;
        if (Math.abs(nx - w2) < 20 && (ny < dt2 || ny > db2)) nx = prev.x < w2 ? w2 - 20 : w2 + 20;
        return { x: nx, y: ny };
      });
      if (!moved && Math.random() > 0.99) {
        const dirs: any[] = ["north","south","east","west","north-east","north-west","south-east","south-west"];
        setPlayerDirection(dirs[Math.floor(Math.random() * dirs.length)]);
      }
    }, 1000 / 60);
    const hd = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const hu = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener("keydown", hd);
    window.addEventListener("keyup", hu);
    return () => { clearInterval(interval); window.removeEventListener("keydown", hd); window.removeEventListener("keyup", hu); };
  }, [gameState, clinicLogOpen]);

  // ── Proximity detection for HUD effects (Brands) ──
  useEffect(() => {
    let touchedBrand: string | null = null;
    for (const obj of SHOP_OBJECTS) {
      if (obj.brand) {
        const dist = Math.sqrt(Math.pow(obj.x + obj.width / 2 - playerPos.x, 2) + Math.pow(obj.y + obj.height / 2 - playerPos.y, 2));
        if (dist < 100) touchedBrand = obj.brand;
      }
    }
    setActiveBrand(touchedBrand);
  }, [playerPos]);

  // ── Pause clock when writeup form is open ──
  useEffect(() => {
    systems.setGlobalPause(showWriteUpForm);
  }, [showWriteUpForm]);

  // ── Linda chore interaction check ──
  const tryCompleteChore = (objType: string) => {
    if (lindaChore.active && (objType === lindaChore.targetType || objType === "display" || objType === "display_case")) {
      completeChore();
      setToast("✅ Linda is happy! Chore completed.");
    }
  };

  // ── Proximity detection for interaction ──
  const checkInteraction = () => {
    const nearbyPatient = patients.find((p: any) => {
      if (p.status !== "WAITING") return false;
      const dist = Math.sqrt(Math.pow(p.x - playerPos.x, 2) + Math.pow(p.y - playerPos.y, 2));
      return dist < 80;
    });
    if (nearbyPatient && nearbyPatient.status === "WAITING") {
      setDialogue({ speaker: "James", message: `Writing up patient: ${nearbyPatient.name}. Insurance: ${nearbyPatient.insurance}.` });
      setPatients((prev) => prev.map((p) => p.id === nearbyPatient.id ? { ...p, status: "BEING_HELPED" } : p));
      setActivePatient(nearbyPatient);
      systems.setGlobalPause(true);
      setShowWriteUpForm(true);
      return;
    }
    if (nearbyPatient && nearbyPatient.status === "READY_FOR_PICKUP") {
      setFittingPatient(nearbyPatient);
      setFittingMeasurements({ frameWidth: 30 + Math.floor(Math.random() * 60), bridgeWidth: 20 + Math.floor(Math.random() * 60), templeLength: 40 + Math.floor(Math.random() * 50) });
      setActiveGame("fitting");
      return;
    }
    const robby = NPCS.find((n) => n.id === "robby")!;
    const distToRobby = Math.sqrt(Math.pow(robby.x - playerPos.x, 2) + Math.pow(robby.y - playerPos.y, 2));
    if (distToRobby < 80) {
      if (robbyJobStep === "IDLE") {
        const ambient = robby.dialogue ? robby.dialogue[Math.floor(Math.random() * robby.dialogue.length)] : "Keep 'em coming, James! The lab is running.";
        setDialogue({ speaker: "Robby", message: ambient });
      } else if (robbyJobStep === "NEED_FRAME" && inventory.length > 0) {
        setDialogue({ speaker: "Robby", message: "James I can't do this job without the frame being in the tray." });
        setRobbyJobStep("COLLECTED_FRAME");
      } else if (robbyJobStep === "COLLECTED_FRAME") {
        setDialogue({ speaker: "Robby", message: "Perfect! I'll get these ready. Lab is running smooth!" });
        setInventory([]); setRobbyJobStep("IDLE");
      }
      return;
    }
    const tracy = NPCS.find((n) => n.id === "tracy")!;
    const distToDesk = Math.sqrt(Math.pow(tracy.x - playerPos.x, 2) + Math.pow(tracy.y - playerPos.y, 2));
    if (distToDesk < 80 && robbyJobStep === "NEED_FRAME") {
      setDialogue({ speaker: "Tracy", message: "Here is the frame Robby was asking for." });
      setRobbyJobStep("COLLECTED_FRAME"); return;
    }
    const drRobbins = NPCS.find((n) => n.id === "dr_robbins")!;
    const distToRobbins = Math.sqrt(Math.pow(drRobbins.x - playerPos.x, 2) + Math.pow(drRobbins.y - playerPos.y, 2));
    if (distToRobbins < 80) {
      const following = patients.find((p) => p.isFollowing);
      if (following) {
        setPatients((prev) => prev.map((p) => p.id === following.id ? { ...p, isFollowing: false, status: "WAITING_FOR_LAB", x: drRobbins.x + 40, y: drRobbins.y + 20, targetX: drRobbins.x + 40, targetY: drRobbins.y + 20, isMoving: false } : p));
        if (following.needsEyeExam) { setActiveExamPatient(following); setDialogue({ speaker: "Dr. Robbins", message: "I'll take care of the exam." }); setGameState(GameState.EYE_EXAM); return; }
        setDialogue({ speaker: "Dr. Robbins", message: "I'll look them over briefly." });
        window.setTimeout(() => { setPatients((prev) => prev.map((p) => p.id === following.id ? { ...p, status: "WAITING", x: playerPos.x + 60, y: playerPos.y + 20, targetX: playerPos.x + 60, targetY: playerPos.y + 20, isMoving: true } : p)); }, 60000);
        return;
      }
      setGameState(GameState.EYE_EXAM); return;
    }
    for (const obj of SHOP_OBJECTS) {
      const dist = Math.sqrt(Math.pow(obj.x + obj.width / 2 - playerPos.x, 2) + Math.pow(obj.y + obj.height / 2 - playerPos.y, 2));
      if (dist < 80) {
        if (obj.type === "lensometer") setGameState(GameState.LENSOMETER);
        if (obj.type === "computer" || obj.type === "reception_computer") {
          if (obj.id === "april_computer") setGameState(GameState.YOUTUBE);
          else setGameState(GameState.COMPUTER);
        }
        if (obj.type === "phone" && isPhoneRinging) { setGameState(GameState.PHONE); setIsPhoneRinging(false); }
        if (obj.id === "phoropter" || (obj.type === "wall_item" && obj.id === "eye_chart")) setGameState(GameState.EYE_EXAM);
        if (obj.type === "autorefractor") setGameState(GameState.AUTOREFRACTOR);
        if (obj.type === "7e_machine") setGameState(GameState.EDGER);
        if (obj.type === "coburn_generator") setGameState(GameState.COBURN_GENERATOR);
        if (obj.type === "cylinder_polisher" || obj.type === "finer_cylinder_combo") setGameState(GameState.CYLINDER_POLISHING);
        if (obj.type === "display_case" || obj.type === "display") {
          tryCompleteChore(obj.type);
          setJamesSpeech("Clean frames"); setCleaningBrand(obj.brand || obj.id || null);
          setTimeout(() => { setActiveGame("cleaning"); setJamesSpeech(null); }, 800);
        }
      }
    }
    // NPC interactions...
    const april = NPCS.find((n) => n.id === "april")!;
    const distToApril = Math.sqrt(Math.pow(april.x - playerPos.x, 2) + Math.pow(april.y - playerPos.y, 2));
    if (distToApril < 80) {
      const following = patients.find((p) => p.isFollowing);
      if (following) { setPatients((prev) => prev.map((p) => p.id === following.id ? { ...p, isFollowing: false, status: "READY_FOR_PICKUP" } : p)); setDialogue({ speaker: "April", message: "Thanks, I'll take it from here." }); return; }
      const lApril = april.dialogue ? april.dialogue[Math.floor(Math.random() * april.dialogue.length)] : null;
      if (lApril) { setDialogue({ speaker: "April", message: lApril }); return; }
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key.toLowerCase() === "e" && !clinicLogOpen) checkInteraction(); if (e.key === "Escape" && clinicLogOpen) setClinicLogOpen(false); };
    window.addEventListener("keypress", h);
    window.addEventListener("keydown", h);
    return () => { window.removeEventListener("keypress", h); window.removeEventListener("keydown", h); };
  }, [playerPos, isPhoneRinging, clinicLogOpen]);

  // Simulate ringing phone every 2 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPhoneRinging) {
        setIsPhoneRinging(true); setShowPhoneFlash(true); setAprilSpeechVisible(true);
        if (bgMusicRef?.current && !bgMusicRef.current.paused) bgMusicRef.current.pause();
        if (phoneRingRef?.current) { phoneRingRef.current.volume = audioSettings.volume; phoneRingRef.current.muted = audioSettings.muted; phoneRingRef.current.play().catch(() => {}); }
        setTimeout(() => setAprilSpeechVisible(false), 5000);
        setTimeout(() => setShowPhoneFlash(false), 2000);
      }
    }, 120000);
    return () => clearInterval(timer);
  }, [isPhoneRinging, audioSettings.muted, audioSettings.volume]);

  useEffect(() => { if (!isPhoneRinging && phoneRingRef?.current) { phoneRingRef.current.pause(); phoneRingRef.current.currentTime = 0; if (bgMusicRef?.current && !audioSettings.muted) bgMusicRef.current.play().catch(() => {}); } }, [isPhoneRinging]);
  useEffect(() => { const i = setInterval(() => { setPatients((prev) => prev.filter((p: any) => !p.leftShop)); }, 1000); return () => clearInterval(i); }, []);

  // Sara / Sage event
  useEffect(() => {
    const triggerSara = () => {
      const si = { id: "sara", name: "Sara", x: 1200, y: 800, targetX: 1200, targetY: 450, direction: "north", isMoving: true, spriteBase: "sara" };
      setSara(si);
      const cp: any = { linda: { x: 1170, y: 430 }, carribyan: { x: 1230, y: 430 }, robby: { x: 1150, y: 450 }, nairobi: { x: 1250, y: 450 }, tracy: { x: 1170, y: 470 }, sabrina: { x: 1230, y: 470 } };
      setNpcStates((prev: any[]) => prev.map((npc: any) => cp[npc.id] ? { ...npc, targetX: cp[npc.id].x, targetY: cp[npc.id].y, isMoving: true } : npc));
      setIsSageEnthusiasm(true); setSagePhase(1); setJamesSpeech("SAGE!!!"); setLindaSpeech("SAGE!!!"); setCarribyanSpeech("SAGE!!!");
      setTimeout(() => { setSagePhase(2); setJamesSpeech("What a cute baby!"); setCarribyanSpeech("What a cute baby!"); setLindaSpeech("What a cute baby!"); setAprilSpeechVisible(false); setNpcStates((prev) => prev.map((npc) => ({ ...npc, speech: "What a cute baby!" }))); setTimeout(() => { setIsSageEnthusiasm(false); setSagePhase(0); setNpcStates((prev) => prev.map((npc) => ({ ...npc, speech: undefined }))); }, 8000); }, 5000);
      setTimeout(() => { setSara((prev: any) => prev ? { ...prev, targetY: 800, isMoving: true, direction: "south" } : null); setNpcStates((prev) => prev.map((npc) => { const o = NPCS.find((n) => n.id === npc.id); return o ? { ...npc, targetX: o.x, targetY: o.y, isMoving: true } : npc; })); setTimeout(() => setSara(null), 5000); setJamesSpeech(null); setLisaSpeech(null); setLindaSpeech(null); setCarribyanSpeech(null); }, 25000);
    };
    const interval = setInterval(triggerSara, 180000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { const i = setInterval(() => { setTracySpeechVisible(true); setTimeout(() => setTracySpeechVisible(false), 4000); }, 20000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const i = setInterval(() => {
      if (patients.length > 0) { const rp = patients[Math.floor(Math.random() * patients.length)]; setLisaSpeech(rp.name.split(" ")[0].toUpperCase() + "!"); setTimeout(() => setLisaSpeech(null), 4000); }
      const lms = ["get that desk cleaned off", "go get the mail", "somebody clean these mirrors"];
      setLindaSpeech(lms[Math.floor(Math.random() * lms.length)]); setTimeout(() => setLindaSpeech(null), 5000);
      const cms = ["who dispensed this?", "Whats everybody having for dinner?"];
      setCarribyanSpeech(cms[Math.floor(Math.random() * cms.length)]); setTimeout(() => setCarribyanSpeech(null), 5000);
    }, 30000);
    return () => clearInterval(i);
  }, [patients]);

  const { width, height } = useWindowSize();
  const isMobile = width < 768;
  const gameScale = isMobile ? width / 500 : 1;
  const effectiveScale = Math.min(1.2, Math.max(0.4, gameScale));
  const cameraTranslate = useMemo(() => {
    const vw = width / effectiveScale, vh = height / effectiveScale;
    let tx = vw / 2 - playerPos.x, ty = vh / 2 - playerPos.y;
    tx = Math.min(0, Math.max(tx, vw - SHOP_WIDTH));
    ty = Math.min(0, Math.max(ty, vh - SHOP_HEIGHT));
    return { x: tx, y: ty };
  }, [playerPos, width, height, effectiveScale]);

  const isFreeMode = gameMode === GameMode.FREE;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#d2b48c] wall-texture">
      {/* ── HUD ── */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4">
        {/* Clock */}
        <div className="bg-black/90 border-2 border-white p-3 flex items-center gap-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <Clock className={`w-5 h-5 ${clock.isDayEnded ? "text-red-500" : "text-yellow-400"}`} />
          <div>
            <div className="text-sm font-black text-white">{clock.timeString}</div>
            <div className="w-24 h-2 bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${isFreeMode ? "bg-green-500" : "bg-yellow-500"}`} style={{ width: `${isFreeMode ? 100 : clock.progress * 100}%` }} />
            </div>
          </div>
        </div>
        {/* Mode Badge */}
        <div className={`px-3 py-1 border-2 font-black text-[8px] uppercase ${isFreeMode ? "bg-green-900 border-green-500 text-green-400" : "bg-blue-900 border-blue-500 text-blue-400"}`}>
          {gameMode}
        </div>
        {/* Linda Chore Alert */}
        {lindaChore.active && (
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="bg-red-900 border-2 border-red-500 p-3 flex items-center gap-3 shadow-[4px_4px_0_0_rgba(220,38,38,0.5)]">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <div className="text-[8px] font-black text-red-300">{lindaChore.message}</div>
              <div className="text-[6px] text-red-400 font-bold">{lindaChore.timer}s remaining</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Revenue Display */}
      {!isFreeMode && (
        <div className="absolute top-4 right-4 z-50 bg-black/90 border-2 border-white p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="text-[6px] text-slate-400 font-black uppercase mb-1">Revenue</div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm font-black text-green-400">${financials.getTotalRevenue().toFixed(2)}</span>
          </div>
          {financials.financials.dockedPenalties > 0 && (
            <div className="text-[8px] text-red-400 font-bold mt-1">-${financials.financials.dockedPenalties.toFixed(2)} penalties</div>
          )}
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3 items-end origin-bottom-right" style={{ transform: isMobile ? "scale(0.8)" : "scale(1)" }}>
        <div className="flex flex-col gap-3 items-end">
          <div className="bg-black/90 border-2 border-white p-2 flex items-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="w-10 h-10 bg-blue-900 border border-white/20 overflow-hidden flex items-center justify-center pixelated">
              <CharacterSprite spriteBase="james" size="xs" />
            </div>
            <div><div className="text-[6px] text-blue-400 font-black uppercase tracking-[1px]">Optician</div><div className="text-[10px] font-black text-white">James</div></div>
          </div>
          {isPhoneRinging && (
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="bg-red-900 border-2 border-white p-2 flex items-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <PhoneIcon className="text-white w-4 h-4 animate-pulse" /><span className="font-black text-[8px] text-white">PHONE!</span>
            </motion.div>
          )}
          <button onClick={() => onUpdateAudio({ ...audioSettings, muted: !audioSettings.muted })} className="bg-black/90 border-2 border-white p-2 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-slate-900 transition-colors">
            {audioSettings.muted ? <VolumeX className="text-red-500 w-4 h-4" /> : <Volume2 className="text-white w-4 h-4" />}
          </button>
        </div>
        <button onClick={() => setClinicLogOpen(true)} className="bg-black/80 border border-white/40 p-2 w-32 space-y-1 shadow-lg backdrop-blur-sm hover:bg-black/90 transition-colors cursor-pointer text-left">
          <div className="flex items-center justify-between mb-0.5 border-b border-white/10 pb-1"><div className="text-[5px] font-black text-slate-400 uppercase tracking-widest">CLINIC_LOG</div></div>
          <div className="grid grid-cols-2 gap-1 pt-1">
            <div className="flex flex-col"><span className="text-[4px] text-slate-500 uppercase">Wait</span><div className="text-[8px] font-black text-white">{patients.filter((p) => p.status === "WAITING").length}</div></div>
            <div className="flex flex-col"><span className="text-[4px] text-slate-500 uppercase">Jobs</span><div className="text-[8px] font-black text-white">{inventory.length}</div></div>
          </div>
        </button>
      </div>

      {/* ── Shop Background ── */}
      <div className="relative transition-all duration-300 origin-top-left" style={{ width: SHOP_WIDTH, height: SHOP_HEIGHT, transform: `scale(${effectiveScale}) translate(${cameraTranslate.x}px, ${cameraTranslate.y}px)` }}>
        <div className="absolute inset-y-0 bg-[#808069] shadow-[inset_0_0_200px_rgba(0,0,0,0.4)] border-r-4 border-black/30" style={{ left: 0, width: 600 }} />
        <div className="absolute inset-y-0 bg-[#808069] shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]" style={{ left: 600, width: 1200 }} />
        <div className="absolute inset-y-0 bg-white shadow-[inset_0_0_100px_rgba(0,0,0,0.1)] border-l-4 border-black/30" style={{ left: 1800, width: 600 }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>
        {/* Barriers */}
        <div className="absolute z-10" style={{ left: 1795, top: 350, width: 10, height: 200, background: "repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #000 10px, #000 20px)" }} />
        <div className="absolute z-10" style={{ left: 595, top: 150, width: 10, height: 200, background: "repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #000 10px, #000 20px)" }} />
        <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] bg-size-[60px_60px] opacity-10" />

        {/* Shop Objects */}
        {SHOP_OBJECTS.map((obj) => (
          <div key={obj.id} className="absolute shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-[8px] tracking-tighter uppercase font-black p-2 text-center border-2 border-black active:scale-95 transition-transform overflow-hidden" style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height, backgroundColor: obj.type === "counter" || obj.type === "table" ? "#8b4513" : obj.type === "display" || obj.type === "display_case" ? "#a0522d" : obj.type === "shelf" || obj.type === "wall_item" || obj.type === "cabinet" ? "#334155" : obj.type === "exam_chair" ? "#1e293b" : obj.type === "reception_computer" ? "#1a1a1a" : "#2c1810", zIndex: 20 }}>
            {obj.type === "reception_computer" && (
              <div className="w-full h-full flex items-center justify-center relative bg-black/40 group-hover:bg-blue-600/20 transition-colors">
                <img src={`/objects/computer_desk/rotations/${obj.x < 650 ? "east" : obj.x > 1700 ? "west" : "south"}.png`} className="w-full h-full object-contain pixelated" alt="computer desk" />
                <div className="absolute top-0 right-0 w-1 h-1 bg-green-500 rounded-full animate-ping" />
              </div>
            )}
            {obj.id === "front_desk" && <img src="/objects/computer_desk/rotations/south.png" className="absolute inset-0 w-full h-full object-cover pixelated" alt="front desk" />}
            {obj.id === "april_desk" && <img src="/objects/computer_desk/rotations/east.png" className="absolute inset-0 w-full h-full object-cover pixelated" alt="april desk" />}
            {obj.type === "display" && <img src={`/objects/wall display/default/rotations/${obj.x < 650 ? "east" : obj.x > 1700 ? "west" : obj.y < 50 ? "south" : "south"}.png`} className="absolute inset-0 w-full h-full object-cover pixelated" alt={obj.brand || "display"} />}
            {obj.type === "lensometer" && <img src="/objects/lensometer.png" className="absolute inset-0 w-full h-full object-contain pixelated" alt="lensometer" />}
            {obj.type === "computer" && <img src={`/objects/computer/rotations/${obj.x < 650 ? "east" : obj.x > 1700 ? "west" : "south"}.png`} className="w-48 h-48 object-contain pixelated" alt="computer" />}
            {obj.type === "phone" && (<div className="relative"><img src="/objects/phone.png" className={`w-72 h-72 ${isPhoneRinging ? "animate-ring" : ""} object-contain pixelated`} alt="phone" />{isPhoneRinging && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 animate-ping" />}</div>)}
            {obj.type === "hpprinter" && <img src="/objects/hpprinter.png" className="absolute inset-0 w-full h-full object-contain pixelated" alt="hpprinter" />}
            {obj.type === "7e_machine" && <img src="/objects/7e/rotations/7e.png" className="absolute inset-0 w-full h-full object-contain pixelated" alt="7e" />}
            {obj.type === "autorefractor" && <img src="/objects/autoref.png" className="absolute inset-0 w-full h-full object-contain pixelated" alt="autorefractor" />}
            {obj.type === "coburn_generator" && <img src="/objects/coburn2g.png" className="absolute inset-0 w-full h-full object-contain pixelated" alt="coburn" style={{ transform: "scaleX(-1)" }} />}
            {obj.type === "finer_cylinder_combo" && (<div className="w-full h-full relative"><img src="/objects/finer.png" className="absolute inset-0 w-full h-full object-contain pixelated" alt="finer" /><div className="absolute -top-2 -right-2 bg-blue-600 border-2 border-blue-200 rounded-full w-5 h-5 flex items-center justify-center"><div className="w-2 h-2 bg-blue-200 rounded-full animate-ping" /></div><div className="absolute -bottom-1 left-0 right-0 text-center"><div className="inline-block bg-blue-900/90 border border-blue-400 px-1 py-0.5 text-[4px] text-blue-200 font-black">CYL+POLISH</div></div></div>)}
            {obj.brand && (<div className="flex flex-col items-center"><div className="text-white mb-1 tracking-[1px] bg-black border-2 border-white px-2 py-1 shadow-lg text-[8px] italic">{obj.brand}</div><Eye className="w-4 h-4 text-white/40 mb-1" /></div>)}
            <div className="mt-1 opacity-50 font-black tracking-tighter text-[6px]">{obj.type.replace("_", " ")}</div>
          </div>
        ))}

        {/* NPCs */}
        {npcStates.map((npc: any) => {
          const dist = Math.sqrt(Math.pow(npc.x - playerPos.x, 2) + Math.pow(npc.y - playerPos.y, 2));
          const near = dist < 80;
          return (
            <div key={npc.id} className="absolute z-30" style={{ left: npc.x, top: npc.y, transition: npc.isMoving ? "none" : "all 0.3s" }}>
              <div className="relative group flex flex-col items-center">
                <CharacterSprite spriteBase={npc.spriteBase || "james"} direction={npc.direction} size="xl" />
                {(npc.speech || (sagePhase > 0 && npc.id !== playerCharacterId) || (npc.id === "april" && aprilSpeechVisible) || (npc.id === "lisa" && lisaSpeech) || (npc.id === "linda" && lindaSpeech) || (npc.id === "carribyan" && carribyanSpeech)) && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-black font-black px-4 py-3 border-4 border-black z-50 whitespace-nowrap text-xs shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                    {npc.speech ? String(npc.speech) : sagePhase === 1 ? "SAGE!!!" : sagePhase === 2 ? "What a cute baby!" : npc.id === "april" && aprilSpeechVisible ? "James line 1" : npc.id === "lisa" && lisaSpeech ? lisaSpeech : npc.id === "linda" && lindaSpeech ? `"${lindaSpeech}"` : npc.id === "carribyan" && carribyanSpeech ? `"${carribyanSpeech}"` : ""}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black rotate-45" />
                  </motion.div>
                )}
                {near && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/95 border-4 border-black px-4 py-2 text-black text-[8px] whitespace-nowrap shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-70 pointer-events-none">
                    <div className="font-black tracking-tight mb-0.5 uppercase italic">{npc.name}</div>
                    <div className="text-[6px] text-blue-600 uppercase font-black tracking-widest">{npc.role}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Patients */}
        {patients.filter((p) => p.status === "WAITING").map((patient: any) => (
          <div key={patient.id} className="absolute" style={{ left: patient.x, top: patient.y, zIndex: 30, transition: patient.isMoving ? "none" : "all 0.3s" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative group cursor-pointer flex flex-col items-center">
              <CharacterSprite spriteBase={patient.spriteBase} direction={patient.direction} size="xl" />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 border-2 border-black text-[8px] font-black whitespace-nowrap shadow-xl">{patient.name}</div>
              {/* Patience bar */}
              {patient.patience !== undefined && !isFreeMode && (
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${patient.patience > 60 ? "bg-green-500" : patient.patience > 30 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${(patient.patience / 180) * 100}%` }} />
                </div>
              )}
              {patient.wantsVerification && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-black font-black p-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-50 whitespace-nowrap border-4 border-black text-[8px] italic">
                  "Can you make sure my <span className="text-blue-600">glasses</span> are right?"
                </motion.div>
              )}
            </motion.div>
          </div>
        ))}

        {/* Player */}
        <motion.div className="absolute z-40" animate={{ x: playerPos.x - 56, y: playerPos.y - 56 }} transition={{ type: "spring", damping: 25, stiffness: 400, mass: 0.5 }}>
          <div className="relative">
            <CharacterSprite spriteBase={playerInfo.spriteBase} direction={playerDirection} size="xl" className="relative z-10" isIdle={!isPlayerMoving} />
            {jamesSpeech && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-black font-black px-4 py-3 border-4 border-black z-50 whitespace-nowrap text-xs shadow-[8px_8px_0_0_rgba(0,0,0,1)]">"{jamesSpeech}"<div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black rotate-45" /></motion.div>
            )}
          </div>
        </motion.div>

        {/* Interaction prompts */}
        {SHOP_OBJECTS.map((obj) => {
          const dist = Math.sqrt(Math.pow(obj.x + obj.width / 2 - playerPos.x, 2) + Math.pow(obj.y + obj.height / 2 - playerPos.y, 2));
          if (dist < 80) return (
            <div key={`action-${obj.id}`} className="absolute z-50 bg-white text-slate-950 px-4 py-2 rounded-2xl font-black text-[10px] flex items-center gap-2 shadow-2xl animate-bounce border-b-4 border-slate-200" style={{ left: obj.x + obj.width / 2 - 40, top: obj.y - 60 }}>
              <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-lg">E</span>
              {obj.type === "phone" && isPhoneRinging ? "ANSWER" : obj.type === "display_case" || obj.type === "display" ? "CLEAN_FRAMES" : obj.type === "reception_computer" ? (obj.id === "april_computer" ? "WATCH YOUTUBE" : "COMPUTER") : obj.type === "coburn_generator" ? "GENERATE_LENS" : obj.type === "finer_cylinder_combo" ? "POLISH_LENS" : "INTERACT"}
            </div>
          );
          return null;
        })}
        {patients.map((p: any) => {
          const dist = Math.sqrt(Math.pow(p.x - playerPos.x, 2) + Math.pow(p.y - playerPos.y, 2));
          if (dist < 80) {
            if (p.status === "WAITING") return (<div key={`action-${p.id}`} className="absolute z-50 bg-blue-600 text-white px-4 py-2 border-4 border-white font-black text-[8px] flex items-center gap-3 shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-bounce" style={{ left: p.x - 40, top: p.y - 60 }}><span className="bg-white text-blue-600 px-2 py-0.5 border-2 border-white">[E]</span>WRITE_UP</div>);
            if (p.status === "READY_FOR_CHECKOUT") return (<div key={`action-${p.id}`} className="absolute z-50 bg-fuchsia-600 text-white px-4 py-2 border-4 border-white font-black text-[8px] flex items-center gap-3 shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-bounce" style={{ left: p.x - 40, top: p.y - 60 }}><span className="bg-white text-fuchsia-600 px-2 py-0.5 border-2 border-white">[E]</span>CHECK_OUT</div>);
          }
          return null;
        })}
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {showPhoneFlash && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-200 flex items-center justify-center pointer-events-none">
            <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 5, -5, 0] }} transition={{ duration: 0.4, repeat: 4 }} className="bg-red-600 border-8 border-white rounded-3xl p-8 shadow-[0_0_60px_rgba(255,0,0,0.6)] flex flex-col items-center gap-4">
              <PhoneIcon className="w-24 h-24 text-white" /><span className="text-white text-4xl font-black italic">INCOMING CALL!</span><span className="text-white/60 text-sm font-bold">Go answer the phone!</span>
            </motion.div>
          </motion.div>
        )}
        {gameState === GameState.EYE_EXAM && <EyeExamGame patient={activeExamPatient} onClose={() => { setGameState(GameState.PLAYING); setActiveExamPatient(null); }} onComplete={(amount) => { if (activeExamPatient) { setPatients((prev) => prev.map((p) => p.id === activeExamPatient.id ? { ...p, status: "WAITING", x: playerPos.x + 60, y: playerPos.y + 20, targetX: playerPos.x + 60, targetY: playerPos.y + 20, isMoving: true, needsEyeExam: false, wantsVerification: false } : p)); } setActiveExamPatient(null); setGameState(GameState.PLAYING); }} />}
        {gameState === GameState.LENSOMETER && <Lensometer onClose={() => setGameState(GameState.PLAYING)} />}
        {gameState === GameState.COMPUTER && <Computer checkoutPatient={patients.find((p) => p.status === "READY_FOR_CHECKOUT")} onClose={() => setGameState(GameState.PLAYING)} onCompleteSale={(amount) => { setPatients((prev) => prev.map((p) => p.status === "READY_FOR_CHECKOUT" ? { ...p, status: "COMPLETED", isFollowing: false } : p)); financials.addRevenue(amount, "card"); setDialogue({ speaker: "Computer", message: `Payment of $${amount.toFixed(2)} complete.` }); }} />}
        {gameState === GameState.PHONE && <Phone onClose={() => setGameState(GameState.PLAYING)} />}
        {gameState === GameState.AUTOREFRACTOR && <AutorefractorGame onClose={() => setGameState(GameState.PLAYING)} />}
        {gameState === GameState.EDGER && <EdgerGame onClose={() => setGameState(GameState.PLAYING)} />}
        {gameState === GameState.COBURN_GENERATOR && <Coburn2GGenerator onClose={() => setGameState(GameState.PLAYING)} />}
        {gameState === GameState.CYLINDER_POLISHING && <CylinderPolishingGame onClose={() => setGameState(GameState.PLAYING)} />}
        {activeGame === "cleaning" && <FrameCleaningGame brand={cleaningBrand} onClose={() => { setActiveGame(null); setCleaningBrand(null); }} onComplete={() => { setActiveGame(null); setCleaningBrand(null); setJamesSpeech("Look at that shine!"); setTimeout(() => setJamesSpeech(null), 3000); }} />}
        {activeGame === "fitting" && fittingPatient && <FrameFittingGame patientName={fittingPatient.name} targetMeasurements={fittingMeasurements} onClose={() => setActiveGame(null)} onComplete={() => { setActiveGame(null); setPatients((prev) => prev.map((p) => p.id === fittingPatient.id ? { ...p, status: "COMPLETED" } : p)); setJamesSpeech("Another happy customer!"); setTimeout(() => setJamesSpeech(null), 3000); }} />}

        {/* Write-Up Form (new implementation) */}
        {showWriteUpForm && activePatient && (
          <WriteUpForm
            patientName={activePatient.name}
            patientSpriteBase={activePatient.spriteBase}
            insurance={activePatient.insurance}
            prescription={activePatient.prescription}
            onClose={() => {
              setShowWriteUpForm(false); systems.setGlobalPause(false);
              setPatients((prev) => prev.map((p) => p.id === activePatient.id ? { ...p, status: "WAITING" } : p));
              setActivePatient(null);
            }}
            onComplete={(total, labJob) => {
              addLabJob(labJob);
              financials.addRevenue(total, "card");
              setPatients((prev) => prev.map((p) => p.id === activePatient.id ? { ...p, isFollowing: true, status: "READY_FOR_CHECKOUT", checkoutAmount: total } : p));
              setDialogue({ speaker: "James", message: "Follow me to the computer so I can check you out." });
              setShowWriteUpForm(false); systems.setGlobalPause(false);
              setActivePatient(null);
            }}
          />
        )}

        {/* Day End Overlay */}
        {clock.isDayEnded && !isFreeMode && (
          <DayEndOverlay
            cashRevenue={financials.financials.cashRevenue}
            cardRevenue={financials.financials.cardRevenue}
            penalties={financials.financials.dockedPenalties}
            onNextDay={() => { clock.resetDay(); financials.resetFinancials(); setPatients([]); }}
            onReturnToMenu={() => { setGameState(GameState.MENU); }}
          />
        )}

        {/* Brand view */}
        {activeBrand && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="fixed top-1/2 -translate-y-1/2 right-8 z-60 bg-black border-4 border-white p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] w-64">
            <div className="text-[6px] text-blue-400 font-black uppercase tracking-[4px] mb-4">View_Brand:</div>
            <div className="text-xl font-black text-white mb-6 border-b-4 border-blue-500 pb-2 italic uppercase">{activeBrand}</div>
            <div className="space-y-4">
              {BRAND_ASSETS[activeBrand]?.map((img: string, i: number) => (<div key={i} className="relative group border-4 border-white aspect-video overflow-hidden shadow-lg"><img src={img} alt={activeBrand} className="w-full h-full object-cover pixelated" /></div>))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-200 bg-black border-4 border-white px-6 py-3 text-white font-black text-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {clinicLogOpen && <ClinicLogOverlay revenue={financials.getTotalRevenue()} tasks={tasks} onClose={() => setClinicLogOpen(false)} />}
    </div>
  );
}