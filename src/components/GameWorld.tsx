import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, MotionValue } from "motion/react";
import { GameState, Patient, Position } from "../types";
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
} from "lucide-react";
import Lensometer from "./UI/Lensometer";
import Computer from "./UI/Computer";
import Phone from "./UI/Phone";
import { CharacterSprite } from "./CharacterSprite";
import { FrameCleaningGame } from "./UI/FrameCleaningGame";
import { FrameFittingGame } from "./UI/FrameFittingGame";
import { EyeExamGame } from "./UI/EyeExamGame";
import { AutorefractorGame } from "./UI/AutorefractorGame";
import { EdgerGame } from "./UI/EdgerGame";
import { Coburn2GGenerator } from "./UI/Coburn2GGenerator";
import { CylinderPolishingGame } from "./UI/CylinderPolishingGame";
import { ClinicLogOverlay } from "./UI/ClinicLogOverlay";
import { useWindowSize } from "../hooks/useWindowSize";

interface GameWorldProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  audioSettings: { volume: number; muted: boolean };
  onUpdateAudio: (settings: { volume: number; muted: boolean }) => void;
  playerCharacterId?: string | null;
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

// Cycling counters for patient sprites
let nextMaleSpriteIndex = 0;
let nextFemaleSpriteIndex = 0;

const SPRITE_BASES = ["james", "drrobbins", "tracy", "sabrina", "linda"];

const MALE_NAMES = [
  "Robert",
  "David",
  "Michael",
  "Christopher",
  "Andrew",
  "James",
  "Daniel",
  "Matthew",
  "Brian",
  "Kevin",
  "Steven",
  "Thomas",
  "Mark",
  "Jason",
  "Paul",
  "Jeffrey",
  "Richard",
  "Kenneth",
  "Charles",
  "Scott",
];
const FEMALE_NAMES = [
  "Jennifer",
  "Maria",
  "Laura",
  "Sarah",
  "Karen",
  "Michelle",
  "Jessica",
  "Amanda",
  "Stephanie",
  "Nicole",
  "Angela",
  "Elizabeth",
  "Lisa",
  "Melissa",
  "Rebecca",
  "Deborah",
  "Sandra",
  "Donna",
  "Carolyn",
  "Ruth",
];

export default function GameWorld({
  gameState,
  setGameState,
  audioSettings,
  onUpdateAudio,
  playerCharacterId,
  bgMusicRef,
  phoneRingRef,
}: GameWorldProps) {
  const [playerPos, setPlayerPos] = useState<Position>({
    x: SHOP_WIDTH / 2,
    y: SHOP_HEIGHT / 2,
  });
  const [playerDirection, setPlayerDirection] = useState<
    | "north"
    | "south"
    | "east"
    | "west"
    | "north-east"
    | "north-west"
    | "south-east"
    | "south-west"
  >("south");
  const [isPlayerMoving, setIsPlayerMoving] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Initial patient spawn
  useEffect(() => {
    if (patients.length === 0) {
      const isMale = Math.random() > 0.5;
      const spriteBase = isMale
        ? (() => {
            const base =
              PATIENT_BASES_MALE[
                nextMaleSpriteIndex % PATIENT_BASES_MALE.length
              ];
            nextMaleSpriteIndex++;
            return base;
          })()
        : (() => {
            const base =
              PATIENT_BASES_FEMALE[
                nextFemaleSpriteIndex % PATIENT_BASES_FEMALE.length
              ];
            nextFemaleSpriteIndex++;
            return base;
          })();
      const namesList = isMale ? MALE_NAMES : FEMALE_NAMES;
      const avatarsList = isMale
        ? PATIENT_AVATARS_MALE
        : PATIENT_AVATARS_FEMALE;
      const initialPatient: Patient = {
        id: "initial-patient",
        name:
          namesList[Math.floor(Math.random() * namesList.length)] +
          " " +
          ["Doe", "Smith", "Jones", "Miller", "Wilson"][
            Math.floor(Math.random() * 5)
          ],
        insurance: "VSP",
        avatar: avatarsList[0],
        prescription: {
          sphere: "-1.50" as any,
          cylinder: "-0.50" as any,
          axis: 180,
        },
        status: "WAITING",
        wantsVerification: true,
        spriteBase,
        x: 950,
        y: 200,
        direction: "south",
        targetX: 950,
        targetY: 200,
        isMoving: false,
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
  const [activeGame, setActiveGame] = useState<"cleaning" | "fitting" | null>(
    null,
  );
  const [cleaningBrand, setCleaningBrand] = useState<string | null>(null);
  const [fittingPatient, setFittingPatient] = useState<Patient | null>(null);
  const [fittingMeasurements, setFittingMeasurements] = useState({
    frameWidth: 50,
    bridgeWidth: 50,
    templeLength: 50,
  });
  const [robbyJobStep, setRobbyJobStep] = useState<
    "IDLE" | "NEED_FRAME" | "COLLECTED_FRAME"
  >("IDLE");
  const [dialogue, setDialogue] = useState<{
    speaker: string;
    message: string;
  } | null>(null);
   const [tasks, setTasks] = useState<{ [key: string]: boolean }>({
     check_inventory: false,
     greet_patients: false,
   });
   const [revenue, setRevenue] = useState(0);
   const [gameTime, setGameTime] = useState({ hours: 9, minutes: 0, period: "AM" as const });
   const [clinicLogOpen, setClinicLogOpen] = useState(false);
   const [gameDate, setGameDate] = useState({
     day: "Monday",
     date: "May 18",
   });

  const playerInfo = NPCS.find((n) => n.id === playerCharacterId) || NPCS[0];
  const [npcStates, setNpcStates] = useState(
    NPCS.filter((n) => n.id !== playerCharacterId && n.id !== "sara").map(
      (n) => ({
        ...n,
        direction: "south" as any,
        targetX: n.x,
        targetY: n.y,
        isMoving: false,
      }),
    ) as any,
  );
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Spawn patients periodically
  useEffect(() => {
    const checkAndSpawn = () => {
      if (patients.length < 2) {
        const isMale = Math.random() > 0.5;
        const spriteBase = isMale
          ? (() => {
              const base =
                PATIENT_BASES_MALE[
                  nextMaleSpriteIndex % PATIENT_BASES_MALE.length
                ];
              nextMaleSpriteIndex++;
              return base;
            })()
          : (() => {
              const base =
                PATIENT_BASES_FEMALE[
                  nextFemaleSpriteIndex % PATIENT_BASES_FEMALE.length
                ];
              nextFemaleSpriteIndex++;
              return base;
            })();
        const namesList = isMale ? MALE_NAMES : FEMALE_NAMES;
        const avatarsList = isMale
          ? PATIENT_AVATARS_MALE
          : PATIENT_AVATARS_FEMALE;
        const newPatient: Patient = {
          id: Math.random().toString(36).substr(2, 9),
          name:
            namesList[Math.floor(Math.random() * namesList.length)] +
            " " +
            ["Doe", "Smith", "Jones", "Miller", "Wilson"][
              Math.floor(Math.random() * 5)
            ],
          insurance: ["VSP", "EyeMed", "Blue Shield", "Aetna"][
            Math.floor(Math.random() * 4)
          ],
          avatar: avatarsList[Math.floor(Math.random() * avatarsList.length)],
          prescription: {
            sphere: (Math.random() * 4 - 2).toFixed(2) as any,
            cylinder: (Math.random() * 2 - 1).toFixed(2) as any,
            axis: Math.floor(Math.random() * 180),
          },
          status: "WAITING",
          wantsVerification: Math.random() > 0.7,
          spriteBase,
          x: 950 + patients.length * 80,
          y: 200,
          direction: "south",
          targetX: 950 + patients.length * 80,
          targetY: 200,
          isMoving: false,
        } as any;
        setPatients((prev) => [...prev, newPatient]);
        setJamesSpeech("How may i help you?");
        setTimeout(() => setJamesSpeech(null), 4000);
      }
    };
    if (patients.length === 0) {
      checkAndSpawn();
    }
    const interval = setInterval(checkAndSpawn, 12000);
    return () => clearInterval(interval);
  }, [patients.length]);

  // Character Random Movement (NPCs and Patients)
  useEffect(() => {
    const interval = setInterval(() => {
      setNpcStates((prev: any[]) =>
        prev.map((npc: any) => {
          const speed = 1.2;
          if (isSageEnthusiasm && sara) {
            const tx = sara.x,
              ty = sara.y + 80;
            const dx = tx - npc.x,
              dy = ty - npc.y,
              dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < speed) return { ...npc, x: tx, y: ty, isMoving: false };
            const dir =
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? "east"
                  : "west"
                : dy > 0
                  ? "south"
                  : "north";
            return {
              ...npc,
              x: npc.x + (dx / dist) * speed,
              y: npc.y + (dy / dist) * speed,
              isMoving: true,
              direction: dir,
            };
          }
          if (!npc.isMoving) {
            if (Math.random() > 0.98) {
              const dirs = [
                "north",
                "south",
                "east",
                "west",
                "north-east",
                "north-west",
                "south-east",
                "south-west",
              ];
              return {
                ...npc,
                direction: dirs[Math.floor(Math.random() * dirs.length)],
              };
            }
            if (Math.random() > 0.99) {
              const range = 100;
              const xMin =
                npc.id === "robby" ? 1850 : npc.id === "dr_robbins" ? 50 : 650;
              const xMax =
                npc.id === "robby"
                  ? SHOP_WIDTH - 50
                  : npc.id === "dr_robbins"
                    ? 550
                    : 1750;
              if (npc.id === "april") return npc;
              const tx = Math.max(
                xMin,
                Math.min(xMax, npc.x + (Math.random() * range * 2 - range)),
              );
              const ty = Math.max(
                150,
                Math.min(
                  SHOP_HEIGHT - 100,
                  npc.y + (Math.random() * range * 2 - range),
                ),
              );
              const dir =
                Math.abs(tx - npc.x) > Math.abs(ty - npc.y)
                  ? tx > npc.x
                    ? "east"
                    : "west"
                  : ty > npc.y
                    ? "south"
                    : "north";
              return {
                ...npc,
                targetX: tx,
                targetY: ty,
                isMoving: true,
                direction: dir,
              };
            }
          }
          if (npc.isMoving) {
            const dx = npc.targetX - npc.x,
              dy = npc.targetY - npc.y,
              dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1)
              return {
                ...npc,
                x: npc.targetX,
                y: npc.targetY,
                isMoving: false,
              };
            return {
              ...npc,
              x: npc.x + (dx / dist) * 1,
              y: npc.y + (dy / dist) * 1,
            };
          }
          return npc;
        }),
      );
      setPatients((prev: any[]) =>
        prev.map((p: any) => {
          if (p.status === "COMPLETED") {
            const ex = 1200,
              ey = 850,
              dx = ex - p.x,
              dy = ey - p.y,
              dist = Math.sqrt(dx * dx + dy * dy),
              speed = 1.2;
            if (dist < speed)
              return { ...p, x: ex, y: ey, isMoving: false, leftShop: true };
            const dir =
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? "east"
                  : "west"
                : dy > 0
                  ? "south"
                  : "north";
            return {
              ...p,
              x: p.x + (dx / dist) * speed,
              y: p.y + (dy / dist) * speed,
              isMoving: true,
              direction: dir,
            };
          }
          if (!p.isMoving) {
            if (Math.random() > 0.98) {
              const dirs = [
                "north",
                "south",
                "east",
                "west",
                "north-east",
                "north-west",
                "south-east",
                "south-west",
              ];
              return {
                ...p,
                direction: dirs[Math.floor(Math.random() * dirs.length)],
              };
            }
            if (Math.random() > 0.99) {
              const range = 150;
              const tx = Math.max(
                650,
                Math.min(
                  1750,
                  (p.x || 900) + (Math.random() * range * 2 - range),
                ),
              );
              const ty = Math.max(
                200,
                Math.min(
                  SHOP_HEIGHT - 200,
                  (p.y || 400) + (Math.random() * range * 2 - range),
                ),
              );
              const dir =
                Math.abs(tx - (p.x || 300)) > Math.abs(ty - (p.y || 400))
                  ? tx > (p.x || 300)
                    ? "east"
                    : "west"
                  : ty > (p.y || 400)
                    ? "south"
                    : "north";
              return {
                ...p,
                targetX: tx,
                targetY: ty,
                isMoving: true,
                direction: dir,
              };
            }
          }
          if (p.isMoving) {
            const speed = 0.8,
              dx = p.targetX - p.x,
              dy = p.targetY - p.y,
              dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < speed)
              return { ...p, x: p.targetX, y: p.targetY, isMoving: false };
            return {
              ...p,
              x: p.x + (dx / dist) * speed,
              y: p.y + (dy / dist) * speed,
            };
          }
          return p;
        }),
      );
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, []);

  // Game Loop for movement
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;
    const interval = setInterval(() => {
      let moved = false;
      setPlayerPos((prev) => {
        let nx = prev.x,
          ny = prev.y;
        const speed = 5;
        if (keysPressed.current["ArrowUp"] || keysPressed.current["w"]) {
          ny -= speed;
          moved = true;
        }
        if (keysPressed.current["ArrowDown"] || keysPressed.current["s"]) {
          ny += speed;
          moved = true;
        }
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"]) {
          nx -= speed;
          moved = true;
        }
        if (keysPressed.current["ArrowRight"] || keysPressed.current["d"]) {
          nx += speed;
          moved = true;
        }
        setIsPlayerMoving(moved);
        let dx = "",
          dy = "";
        if (keysPressed.current["ArrowUp"] || keysPressed.current["w"])
          dy = "north";
        if (keysPressed.current["ArrowDown"] || keysPressed.current["s"])
          dy = "south";
        if (keysPressed.current["ArrowLeft"] || keysPressed.current["a"])
          dx = "west";
        if (keysPressed.current["ArrowRight"] || keysPressed.current["d"])
          dx = "east";
        if (dx && dy) setPlayerDirection(`${dy}-${dx}` as any);
        else if (dx) setPlayerDirection(dx as any);
        else if (dy) setPlayerDirection(dy as any);
        nx = Math.max(20, Math.min(SHOP_WIDTH - 20, nx));
        ny = Math.max(20, Math.min(SHOP_HEIGHT - 20, ny));
        const w1 = 600,
          dt1 = 150,
          db1 = 350;
        if (Math.abs(nx - w1) < 20 && (ny < dt1 || ny > db1)) {
          nx = prev.x < w1 ? w1 - 20 : w1 + 20;
        }
        const w2 = 1800,
          dt2 = 350,
          db2 = 550;
        if (Math.abs(nx - w2) < 20 && (ny < dt2 || ny > db2)) {
          nx = prev.x < w2 ? w2 - 20 : w2 + 20;
        }
        return { x: nx, y: ny };
      });
      if (!moved && Math.random() > 0.99) {
        const dirs: any[] = [
          "north",
          "south",
          "east",
          "west",
          "north-east",
          "north-west",
          "south-east",
          "south-west",
        ];
        setPlayerDirection(dirs[Math.floor(Math.random() * dirs.length)]);
      }
    }, 1000 / 60);
    const hd = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const hu = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener("keydown", hd);
    window.addEventListener("keyup", hu);
    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", hd);
      window.removeEventListener("keyup", hu);
    };
  }, [gameState]);

  // Proximity detection for HUD effects (Brands)
  useEffect(() => {
    let touchedBrand: string | null = null;
    for (const obj of SHOP_OBJECTS) {
      if (obj.brand) {
        const dist = Math.sqrt(
          Math.pow(obj.x + obj.width / 2 - playerPos.x, 2) +
            Math.pow(obj.y + obj.height / 2 - playerPos.y, 2),
        );
        if (dist < 100) touchedBrand = obj.brand;
      }
    }
    setActiveBrand(touchedBrand);
  }, [playerPos]);

  // Proximity detection for interaction
  const checkInteraction = () => {
    const nearbyPatient = patients.find((p: any) => {
      if (p.status !== "WAITING") return false;
      const dist = Math.sqrt(
        Math.pow(p.x - playerPos.x, 2) + Math.pow(p.y - playerPos.y, 2),
      );
      return dist < 80;
    });
    if (nearbyPatient && nearbyPatient.wantsVerification) {
      setGameState(GameState.LENSOMETER);
      setPatients((prev) =>
        prev.map((p) =>
          p.id === nearbyPatient.id ? { ...p, wantsVerification: false } : p,
        ),
      );
      return;
    }
    if (nearbyPatient && nearbyPatient.status === "WAITING") {
      setDialogue({
        speaker: "James",
        message: `Writing up patient: ${nearbyPatient.name}. Insurance: ${nearbyPatient.insurance}.`,
      });
      setPatients((prev) =>
        prev.map((p) =>
          p.id === nearbyPatient.id ? { ...p, status: "BEING_HELPED" } : p,
        ),
      );
      setInventory((prev) => [...prev, `Job for ${nearbyPatient.name}`]);
      setTimeout(() => {
        setPatients((prev) =>
          prev.map((p) =>
            p.id === nearbyPatient.id
              ? { ...p, status: "READY_FOR_PICKUP" }
              : p,
          ),
        );
      }, 15000);
      return;
    }
    if (nearbyPatient && nearbyPatient.status === "READY_FOR_PICKUP") {
      setFittingPatient(nearbyPatient);
      setFittingMeasurements({
        frameWidth: 30 + Math.floor(Math.random() * 60),
        bridgeWidth: 20 + Math.floor(Math.random() * 60),
        templeLength: 40 + Math.floor(Math.random() * 50),
      });
      setActiveGame("fitting");
      return;
    }
    const robby = NPCS.find((n) => n.id === "robby")!;
    const distToRobby = Math.sqrt(
      Math.pow(robby.x - playerPos.x, 2) + Math.pow(robby.y - playerPos.y, 2),
    );
    if (distToRobby < 80) {
      if (robbyJobStep === "IDLE") {
        const ambient = robby.dialogue
          ? robby.dialogue[Math.floor(Math.random() * robby.dialogue.length)]
          : "Keep 'em coming, James! The lab is running.";
        setDialogue({ speaker: "Robby", message: ambient });
      } else if (robbyJobStep === "NEED_FRAME" && inventory.length > 0) {
        setDialogue({
          speaker: "Robby",
          message:
            "James I can't do this job without the frame being in the tray.",
        });
        setRobbyJobStep("COLLECTED_FRAME");
      } else if (robbyJobStep === "COLLECTED_FRAME") {
        setDialogue({
          speaker: "Robby",
          message:
            "Perfect! I'll get these ready. Long hair don't care, lab is running smooth!",
        });
        setInventory([]);
        setRobbyJobStep("IDLE");
      }
      return;
    }
    const tracy = NPCS.find((n) => n.id === "tracy")!;
    const distToDesk = Math.sqrt(
      Math.pow(tracy.x - playerPos.x, 2) + Math.pow(tracy.y - playerPos.y, 2),
    );
    if (distToDesk < 80 && robbyJobStep === "NEED_FRAME") {
      setDialogue({
        speaker: "Tracy",
        message:
          "Here is the frame Robby was asking for. Don't forget to find your files later!",
      });
      setRobbyJobStep("COLLECTED_FRAME");
      return;
    }
    const drRobbins = NPCS.find((n) => n.id === "dr_robbins")!;
    const distToRobbins = Math.sqrt(
      Math.pow(drRobbins.x - playerPos.x, 2) +
        Math.pow(drRobbins.y - playerPos.y, 2),
    );
    if (distToRobbins < 80) {
      setGameState(GameState.EYE_EXAM);
      return;
    }
    for (const obj of SHOP_OBJECTS) {
      const dist = Math.sqrt(
        Math.pow(obj.x + obj.width / 2 - playerPos.x, 2) +
          Math.pow(obj.y + obj.height / 2 - playerPos.y, 2),
      );
      if (dist < 80) {
        if (obj.type === "lensometer") setGameState(GameState.LENSOMETER);
        if (obj.type === "computer" || obj.type === "reception_computer") {
          if (obj.id === "april_computer") {
            setGameState(GameState.YOUTUBE);
          } else {
            setGameState(GameState.COMPUTER);
          }
        }
        if (obj.type === "phone" && isPhoneRinging) {
          setGameState(GameState.PHONE);
          setIsPhoneRinging(false);
        }
        if (
          obj.id === "phoropter" ||
          (obj.type === "wall_item" && obj.id === "eye_chart")
        ) {
          setGameState(GameState.EYE_EXAM);
        }
        if (obj.type === "autorefractor") {
          setGameState(GameState.AUTOREFRACTOR);
        }
        if (obj.type === "7e_machine") {
          setGameState(GameState.EDGER);
        }
        if (obj.type === "coburn_generator") {
          setGameState(GameState.COBURN_GENERATOR);
        }
        if (obj.type === "cylinder_polisher" || obj.type === "finer_cylinder_combo") {
          setGameState(GameState.CYLINDER_POLISHING);
        }
        if (obj.type === "display_case" || obj.type === "display") {
          setJamesSpeech("Clean frames");
          setCleaningBrand(obj.brand || obj.id || null);
          setTimeout(() => {
            setActiveGame("cleaning");
            setJamesSpeech(null);
          }, 800);
        }
      }
    }
    const april = NPCS.find((n) => n.id === "april")!;
    const distToApril = Math.sqrt(
      Math.pow(april.x - playerPos.x, 2) + Math.pow(april.y - playerPos.y, 2),
    );
    if (distToApril < 80) {
      const lApril = april.dialogue
        ? april.dialogue[Math.floor(Math.random() * april.dialogue.length)]
        : null;
      if (lApril) {
        setDialogue({ speaker: "April", message: lApril });
        return;
      }
    }
    const lisa = NPCS.find((n) => n.id === "lisa")!;
    const distToLisa = Math.sqrt(
      Math.pow(lisa.x - playerPos.x, 2) + Math.pow(lisa.y - playerPos.y, 2),
    );
    if (distToLisa < 80) {
      const lLisa = lisa.dialogue
        ? lisa.dialogue[Math.floor(Math.random() * lisa.dialogue.length)]
        : null;
      if (lLisa) {
        setDialogue({ speaker: "Lisa", message: lLisa });
        return;
      }
    }
    const linda = NPCS.find((n) => n.id === "linda")!;
    const distToLinda = Math.sqrt(
      Math.pow(linda.x - playerPos.x, 2) + Math.pow(linda.y - playerPos.y, 2),
    );
    if (distToLinda < 80) {
      const lLinda = linda.dialogue
        ? linda.dialogue[Math.floor(Math.random() * linda.dialogue.length)]
        : null;
      if (lLinda) {
        setDialogue({ speaker: "Linda", message: lLinda });
        return;
      }
    }
    const sabrina = NPCS.find((n) => n.id === "sabrina")!;
    const distToSabrina = Math.sqrt(
      Math.pow(sabrina.x - playerPos.x, 2) +
        Math.pow(sabrina.y - playerPos.y, 2),
    );
    if (distToSabrina < 80) {
      const lSab = sabrina.dialogue
        ? sabrina.dialogue[Math.floor(Math.random() * sabrina.dialogue.length)]
        : null;
      if (lSab) {
        setDialogue({ speaker: "Sabrina", message: lSab });
        return;
      }
    }
    const tracyNpc = NPCS.find((n) => n.id === "tracy")!;
    const distToTracy = Math.sqrt(
      Math.pow(tracyNpc.x - playerPos.x, 2) +
        Math.pow(tracyNpc.y - playerPos.y, 2),
    );
    if (distToTracy < 80) {
      if (robbyJobStep === "NEED_FRAME") {
        setDialogue({
          speaker: "Tracy",
          message:
            "Here is the frame Robby was asking for. Don't forget to find your files later!",
        });
        setRobbyJobStep("COLLECTED_FRAME");
        return;
      }
      const lTracy = tracyNpc.dialogue
        ? tracyNpc.dialogue[
            Math.floor(Math.random() * tracyNpc.dialogue.length)
          ]
        : null;
      if (lTracy) {
        setDialogue({ speaker: "Tracy", message: lTracy });
        return;
      }
    }
    const nairobi = NPCS.find((n) => n.id === "nairobi")!;
    const distToNairobi = Math.sqrt(
      Math.pow(nairobi.x - playerPos.x, 2) +
        Math.pow(nairobi.y - playerPos.y, 2),
    );
    if (distToNairobi < 80) {
      const lNai = nairobi.dialogue
        ? nairobi.dialogue[Math.floor(Math.random() * nairobi.dialogue.length)]
        : null;
      if (lNai) {
        setDialogue({ speaker: "Nairobi", message: lNai });
        return;
      }
    }
    const carribyan = NPCS.find((n) => n.id === "carribyan")!;
    const distToCarribyan = Math.sqrt(
      Math.pow(carribyan.x - playerPos.x, 2) +
        Math.pow(carribyan.y - playerPos.y, 2),
    );
    if (distToCarribyan < 80) {
      const lCar = carribyan.dialogue
        ? carribyan.dialogue[
            Math.floor(Math.random() * carribyan.dialogue.length)
          ]
        : null;
      if (lCar) {
        setDialogue({ speaker: "Carribyan", message: lCar });
        return;
      }
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && !clinicLogOpen) checkInteraction();
      if (e.key === "Escape" && clinicLogOpen) {
        setClinicLogOpen(false);
      }
    };
    window.addEventListener("keypress", h);
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keypress", h);
      window.removeEventListener("keydown", h);
    };
  }, [playerPos, isPhoneRinging, clinicLogOpen]);

  // Simulate ringing phone every 2 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPhoneRinging) {
        setIsPhoneRinging(true);
        setShowPhoneFlash(true);
        setAprilSpeechVisible(true);
        if (bgMusicRef?.current && !bgMusicRef.current.paused) {
          bgMusicRef.current.pause();
        }
        if (phoneRingRef?.current) {
          phoneRingRef.current.volume = audioSettings.volume;
          phoneRingRef.current.muted = audioSettings.muted;
          phoneRingRef.current.play().catch(() => {});
        }
        setTimeout(() => setAprilSpeechVisible(false), 5000);
        setTimeout(() => setShowPhoneFlash(false), 2000);
      }
    }, 120000);
    return () => clearInterval(timer);
  }, [isPhoneRinging, audioSettings.muted, audioSettings.volume]);

  // Stop phone ring
  useEffect(() => {
    if (!isPhoneRinging && phoneRingRef?.current) {
      phoneRingRef.current.pause();
      phoneRingRef.current.currentTime = 0;
      if (bgMusicRef?.current && !audioSettings.muted) {
        bgMusicRef.current.play().catch(() => {});
      }
    }
  }, [isPhoneRinging]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPatients((prev) => prev.filter((p: any) => !p.leftShop));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sara / Sage Event
  useEffect(() => {
    const triggerSara = () => {
      const si = {
        id: "sara",
        name: "Sara",
        x: 1200,
        y: 800,
        targetX: 1200,
        targetY: 450,
        direction: "north",
        isMoving: true,
        spriteBase: "sara",
      };
      setSara(si);
      const cp: { [key: string]: { x: number; y: number } } = {
        linda: { x: 1170, y: 430 },
        carribyan: { x: 1230, y: 430 },
        robby: { x: 1150, y: 450 },
        nairobi: { x: 1250, y: 450 },
        tracy: { x: 1170, y: 470 },
        sabrina: { x: 1230, y: 470 },
      };
      setNpcStates((prev: any[]) =>
        prev.map((npc: any) =>
          cp[npc.id]
            ? {
                ...npc,
                targetX: cp[npc.id].x,
                targetY: cp[npc.id].y,
                isMoving: true,
              }
            : npc,
        ),
      );
      setIsSageEnthusiasm(true);
      setSagePhase(1);
      setJamesSpeech("SAGE!!!");
      setLindaSpeech("SAGE!!!");
      setCarribyanSpeech("SAGE!!!");
      setAprilSpeechVisible(true);
      setTimeout(() => {
        setSagePhase(2);
        setJamesSpeech("What a cute baby!");
        setCarribyanSpeech("What a cute baby!");
        setLindaSpeech("What a cute baby!");
        setAprilSpeechVisible(false);
        setNpcStates((prev: any[]) =>
          prev.map((npc: any) => ({ ...npc, speech: "What a cute baby!" })),
        );
        setTimeout(() => {
          setIsSageEnthusiasm(false);
          setSagePhase(0);
          setNpcStates((prev: any[]) =>
            prev.map((npc: any) => ({ ...npc, speech: undefined })),
          );
        }, 8000);
      }, 5000);
      setTimeout(() => {
        setSara((prev: any) =>
          prev
            ? { ...prev, targetY: 800, isMoving: true, direction: "south" }
            : null,
        );
        setNpcStates((prev: any[]) =>
          prev.map((npc: any) => {
            const o = NPCS.find((n) => n.id === npc.id);
            return o
              ? { ...npc, targetX: o.x, targetY: o.y, isMoving: true }
              : npc;
          }),
        );
        setTimeout(() => setSara(null), 5000);
        setJamesSpeech(null);
        setLisaSpeech(null);
        setLindaSpeech(null);
        setCarribyanSpeech(null);
      }, 25000);
    };
    const interval = setInterval(triggerSara, 180000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sara && sara.isMoving) {
        const s = 1.5,
          dy = sara.targetY - sara.y,
          dx = sara.targetX - sara.x,
          dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < s)
          setSara({
            ...sara,
            x: sara.targetX,
            y: sara.targetY,
            isMoving: false,
          });
        else
          setSara({
            ...sara,
            x: sara.x + (dx / dist) * s,
            y: sara.y + (dy / dist) * s,
          });
      }
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, [sara]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNpcStates((prev: any[]) =>
        prev.map((npc: any) => {
          if (
            !npc.isMoving ||
            npc.targetX === undefined ||
            npc.targetY === undefined
          )
            return npc;
          const s = 1.2,
            dx = npc.targetX - npc.x,
            dy = npc.targetY - npc.y,
            dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < s)
            return { ...npc, x: npc.targetX, y: npc.targetY, isMoving: false };
          const dir =
            Math.abs(dx) > Math.abs(dy)
              ? dx > 0
                ? "east"
                : "west"
              : dy > 0
                ? "south"
                : "north";
          return {
            ...npc,
            x: npc.x + (dx / dist) * s,
            y: npc.y + (dy / dist) * s,
            direction: dir as any,
          };
        }),
      );
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setTracySpeechVisible(true);
      setTimeout(() => setTracySpeechVisible(false), 4000);
    }, 20000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      if (patients.length > 0) {
        const rp = patients[Math.floor(Math.random() * patients.length)];
        setLisaSpeech(rp.name.split(" ")[0].toUpperCase() + "!");
        setTimeout(() => setLisaSpeech(null), 4000);
      }
      const lms = [
        "get that desk cleaned off",
        "go get the mail",
        "somebody clean these mirrors",
      ];
      setLindaSpeech(lms[Math.floor(Math.random() * lms.length)]);
      setTimeout(() => setLindaSpeech(null), 5000);
      const cms = ["who dispensed this?", "Whats everybody having for dinner?"];
      setCarribyanSpeech(cms[Math.floor(Math.random() * cms.length)]);
      setTimeout(() => setCarribyanSpeech(null), 5000);
    }, 30000);
    return () => clearInterval(i);
  }, [patients]);

  const { width, height } = useWindowSize();
  const safeWidth = width > 0 ? width : window.innerWidth;
  const safeHeight = height > 0 ? height : window.innerHeight;
  const isMobile = width < 768;
  const gameScale = isMobile ? width / 500 : 1;
  const effectiveScale = Math.min(1.2, Math.max(0.4, gameScale));
  const cameraTranslate = useMemo(() => {
    const vw = width / effectiveScale,
      vh = height / effectiveScale;
    let tx = vw / 2 - playerPos.x,
      ty = vh / 2 - playerPos.y;
    tx = Math.min(0, Math.max(tx, vw - SHOP_WIDTH));
    ty = Math.min(0, Math.max(ty, vh - SHOP_HEIGHT));
    return { x: tx, y: ty };
  }, [playerPos, width, height, effectiveScale]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#d2b48c] wall-texture">
      <div
        className="absolute bottom-6 right-6 z-50 flex flex-col gap-3 items-end origin-bottom-right"
        style={{ transform: isMobile ? "scale(0.8)" : "scale(1)" }}
      >
        <div className="flex flex-col gap-3 items-end">
          <div className="bg-black/90 border-2 border-white p-2 flex items-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <div className="w-10 h-10 bg-blue-900 border border-white/20 overflow-hidden flex items-center justify-center pixelated">
              <CharacterSprite spriteBase="james" size="xs" />
            </div>
            <div>
              <div className="text-[6px] text-blue-400 font-black uppercase tracking-[1px]">
                Optician
              </div>
              <div className="text-[10px] font-black text-white">James</div>
            </div>
          </div>
          {isPhoneRinging && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="bg-red-900 border-2 border-white p-2 flex items-center gap-2 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            >
              <PhoneIcon className="text-white w-4 h-4 animate-pulse" />
              <span className="font-black text-[8px] text-white">PHONE!</span>
            </motion.div>
          )}
          <button
            onClick={() =>
              onUpdateAudio({ ...audioSettings, muted: !audioSettings.muted })
            }
            className="bg-black/90 border-2 border-white p-2 flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:bg-slate-900 transition-colors"
          >
            {audioSettings.muted ? (
              <VolumeX className="text-red-500 w-4 h-4" />
            ) : (
              <Volume2 className="text-white w-4 h-4" />
            )}
          </button>
        </div>
        <button
          onClick={() => setClinicLogOpen(true)}
          className="bg-black/80 border border-white/40 p-2 w-32 space-y-1 shadow-lg backdrop-blur-sm hover:bg-black/90 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center justify-between mb-0.5 border-b border-white/10 pb-1">
            <div className="text-[5px] font-black text-slate-400 uppercase tracking-widest">
              CLINIC_LOG
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 pt-1">
            <div className="flex flex-col">
              <span className="text-[4px] text-slate-500 uppercase">Wait</span>
              <div className="text-[8px] font-black text-white">
                {patients.filter((p) => p.status === "WAITING").length}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[4px] text-slate-500 uppercase">Jobs</span>
              <div className="text-[8px] font-black text-white">
                {inventory.length}
              </div>
            </div>
          </div>
        </button>
      </div>
      <div
        className="relative transition-all duration-300 origin-top-left"
        style={{
          width: SHOP_WIDTH,
          height: SHOP_HEIGHT,
          transform: `scale(${effectiveScale}) translate(${cameraTranslate.x}px, ${cameraTranslate.y}px)`,
        }}
      >
        <div
          className="absolute inset-y-0 bg-[#808069] shadow-[inset_0_0_200px_rgba(0,0,0,0.4)] border-r-4 border-black/30"
          style={{ left: 0, width: 600 }}
        />
        <div
          className="absolute inset-y-0 bg-[#808069] shadow-[inset_0_0_200px_rgba(0,0,0,0.5)]"
          style={{ left: 600, width: 1200 }}
        />
        <div
          className="absolute inset-y-0 bg-white shadow-[inset_0_0_100px_rgba(0,0,0,0.1)] border-l-4 border-black/30"
          style={{ left: 1800, width: 600 }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div
          className="absolute z-10"
          style={{
            left: 1795,
            top: 350,
            width: 10,
            height: 200,
            background:
              "repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #000 10px, #000 20px)",
          }}
        />
        <div
          className="absolute z-10"
          style={{
            left: 595,
            top: 150,
            width: 10,
            height: 200,
            background:
              "repeating-linear-gradient(45deg, #fbbf24, #fbbf24 10px, #000 10px, #000 20px)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] bg-size-[60px_60px] opacity-10" />
        <div className="absolute top-0 left-150 w-300 h-10 bg-red-800 shadow-xl flex items-center justify-center opacity-90 z-10 border-b-4 border-red-950">
          <div className="w-full h-2 bg-red-700/50 absolute top-1 blur-[1px]" />
          <div className="flex gap-20">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 bg-black/20 rounded-full blur-xs"
              />
            ))}
          </div>
        </div>
        <div className="absolute top-0 left-0 w-150 h-10 bg-slate-900 border-b-4 border-black z-10 flex items-center px-8">
          <div className="text-[8px] font-black tracking-widest text-slate-500">
            EXAMINATION WING - DR. ROBBINS
          </div>
        </div>
        <div className="absolute top-0 left-450 w-150 h-10 bg-white border-b-4 border-slate-200 z-10 flex items-center px-8">
          <div className="text-[8px] font-black tracking-widest text-slate-400">
            LABORATORY SECTOR A
          </div>
        </div>
        <div className="absolute top-0 right-0 w-10 h-full bg-white border-l-4 border-slate-200 z-10" />
        <div className="absolute bottom-0 left-450 w-150 h-10 bg-white border-t-4 border-slate-200 z-10" />
        <div className="absolute top-12 left-462.5 w-125 h-4 bg-white/40 blur-xs z-50 pointer-events-none rounded-full" />
        <div className="absolute top-14 left-465 w-120 h-1 bg-white z-50 pointer-events-none rounded-full" />
        <div className="absolute top-10 left-0 w-full h-16 bg-linear-to-b from-black/30 to-transparent z-10" />
        <div className="absolute inset-0 z-50 pointer-events-none opacity-40">
          {[800, 1100, 1400, 1700].map((x) =>
            [100, 400, 700].map((y) => (
              <div
                key={`${x}-${y}`}
                className="track-light absolute w-64 h-64 -translate-x-1/2 -translate-y-1/2"
                style={{ left: x, top: y }}
              />
            )),
          )}
        </div>
        <div
          className="absolute z-20 wood-grain border-x-4 border-black"
          style={{
            left: 600,
            top: 0,
            width: 30,
            height: 150,
            backgroundColor: "#2c1810",
          }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/20" />
        </div>
        <div
          className="absolute z-20 wood-grain border-x-4 border-black"
          style={{
            left: 600,
            top: 350,
            width: 30,
            height: 450,
            backgroundColor: "#2c1810",
          }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/20" />
        </div>
        <div
          className="absolute z-20 wood-grain border-x-4 border-black"
          style={{
            left: 1800,
            top: 0,
            width: 30,
            height: 350,
            backgroundColor: "#2c1810",
          }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/20" />
        </div>
        <div
          className="absolute z-20 wood-grain border-x-4 border-black"
          style={{
            left: 1800,
            top: 550,
            width: 30,
            height: 250,
            backgroundColor: "#2c1810",
          }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-black/20" />
        </div>
        {SHOP_OBJECTS.map((obj) => (
          <div
            key={obj.id}
            className="absolute shadow-[8px_8px_0_0_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-[8px] tracking-tighter uppercase font-black p-2 text-center wood-grain border-2 border-black active:scale-95 transition-transform overflow-hidden"
            style={{
              left: obj.x,
              top: obj.y,
              width: obj.width,
              height: obj.height,
              backgroundColor:
                obj.type === "counter" || obj.type === "table"
                  ? "#8b4513"
                  : obj.type === "display" || obj.type === "display_case"
                    ? "#a0522d"
                    : obj.type === "shelf" ||
                        obj.type === "wall_item" ||
                        obj.type === "cabinet"
                      ? "#334155"
                      : obj.type === "exam_chair"
                        ? "#1e293b"
                        : obj.type === "reception_computer"
                          ? "#1a1a1a"
                          : "#2c1810",
              zIndex: 20,
            }}
          >
            {obj.type === "reception_computer" && (
              <div className="w-full h-full flex items-center justify-center relative bg-black/40 group-hover:bg-blue-600/20 transition-colors">
                <ComputerIcon className="w-8 h-8 text-blue-400 group-hover:animate-pulse" />
                <div className="absolute top-0 right-0 w-1 h-1 bg-green-500 rounded-full animate-ping" />
              </div>
            )}
            {obj.type === "exam_chair" && (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="w-12 h-16 bg-slate-900 rounded-lg border-2 border-slate-700 shadow-inner relative">
                  <div className="absolute top-2 left-2 right-2 h-4 bg-slate-800 rounded-sm" />
                  <div className="absolute bottom-2 left-2 right-2 h-8 bg-slate-800 rounded-sm" />
                </div>
              </div>
            )}
            {obj.type === "shelf" && (
              <div className="flex flex-col gap-1 w-full h-full p-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex gap-1 h-3">
                    {[...Array(5)].map((_, j) => (
                      <div
                        key={j}
                        className="flex-1 bg-blue-900 border border-white/20 rounded-[1px] relative"
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-[4px] text-white/40">
                          TRAY
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {obj.type === "cabinet" && (
              <div className="w-full h-full flex flex-col border-2 border-slate-400">
                <div className="h-4 w-full bg-slate-600 border-b border-slate-800" />
                <div className="flex-1 flex gap-2 p-2">
                  <div className="flex-1 bg-slate-800 border-2 border-slate-400 rounded-sm" />
                  <div className="flex-1 bg-slate-800 border-2 border-slate-400 rounded-sm" />
                </div>
              </div>
            )}
            {obj.type === "wall_item" && (
              <div className="w-full h-full flex items-center justify-center">
                {obj.id === "safety_sign" ? (
                  <div className="bg-yellow-400 p-1 border-2 border-black flex flex-col items-center">
                    <div className="text-[4px] text-black font-black">
                      CAUTION
                    </div>
                    <div className="w-2 h-2 bg-black rounded-full" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-700 p-2 flex flex-wrap gap-1">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-slate-400" />
                    ))}
                  </div>
                )}
              </div>
            )}
            {obj.type === "chair" && (
              <div className="w-full h-full flex flex-col items-center justify-end">
                <div className="w-8 h-8 bg-black rounded-full border-2 border-white/20 -mb-1 relative z-10" />
                <div className="w-2 h-8 bg-slate-700" />
                <div className="w-10 h-2 bg-slate-900 rounded-full" />
              </div>
            )}
            {obj.type === "poster_display" && (
              <div className="w-full h-full flex flex-col items-center">
                <div className="w-full h-full border-4 border-amber-900 bg-linear-to-b from-amber-100 via-white to-blue-50 rounded-sm shadow-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <div className="text-[4px] font-black text-blue-900 tracking-widest uppercase">
                      CL
                    </div>
                    <div className="text-[8px] font-black text-blue-700 italic">
                      Poster
                    </div>
                    <div className="w-full h-1 bg-blue-600 my-1" />
                    <div className="text-[3px] font-black text-slate-400">
                      EST. 2024
                    </div>
                  </div>
                </div>
                <div className="w-3 h-3 bg-amber-900 -mt-1" />
              </div>
            )}
            {obj.type === "display" && (
              <img
                src={`/objects/wall display/default/rotations/${obj.x < 650 ? "east" : obj.x > 1700 ? "west" : obj.y < 50 ? "south" : "south"}.png`}
                className="absolute inset-0 w-full h-full object-cover pixelated"
                alt={obj.brand || "display"}
              />
            )}
            {obj.type === "lensometer" && (
              <img
                src="/objects/lensometer.png"
                className="absolute inset-0 w-full h-full object-contain pixelated"
                alt="lensometer"
              />
            )}
            {obj.brand && (
              <div className="flex flex-col items-center">
                <div className="text-white mb-1 tracking-[1px] bg-black border-2 border-white px-2 py-1 shadow-lg text-[8px] italic">
                  {obj.brand}
                </div>
                <Eye className="w-4 h-4 text-white/40 mb-1" />
              </div>
            )}
            {obj.type === "computer" && (
              <ComputerIcon className="w-6 h-6 text-blue-100/40" />
            )}
            {obj.type === "hpprinter" && (
              <img
                src="/objects/hpprinter.png"
                className="absolute inset-0 w-full h-full object-contain pixelated"
                alt="hpprinter"
              />
            )}
            {obj.type === "7e_machine" && (
              <img
                src="/objects/7e/rotations/7e.png"
                className="absolute inset-0 w-full h-full object-contain pixelated"
                alt="7e machine"
              />
            )}
            {obj.type === "printer" && (
              <PrinterIcon className="w-6 h-6 text-slate-300/40" />
            )}
            {obj.type === "autorefractor" && (
              <img
                src="/objects/autoref.png"
                className="absolute inset-0 w-full h-full object-contain pixelated"
                alt="autorefractor"
              />
            )}
            {obj.type === "coburn_generator" && (
              <img
                src="/objects/coburn2g.png"
                className="absolute inset-0 w-full h-full object-contain pixelated"
                alt="coburn generator"
                style={{ transform: "scaleX(-1)" }}
              />
            )}
            {obj.type === "finer_cylinder_combo" && (
              <div className="w-full h-full relative">
                <img
                  src="/objects/finer.png"
                  className="absolute inset-0 w-full h-full object-contain pixelated"
                  alt="finer"
                />
                <div className="absolute -top-2 -right-2 bg-blue-600 border-2 border-blue-200 rounded-full w-5 h-5 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-ping" />
                </div>
                <div className="absolute -bottom-1 left-0 right-0 text-center">
                  <div className="inline-block bg-blue-900/90 border border-blue-400 px-1 py-0.5 text-[4px] text-blue-200 font-black tracking-tight">
                    CYL+POLISH
                  </div>
                </div>
              </div>
            )}
            {obj.type === "phone" && (
              <div className="relative">
                <PhoneIcon
                  className={`w-6 h-6 ${isPhoneRinging ? "text-red-300 animate-ring" : "text-slate-400"}`}
                />
                {isPhoneRinging && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 animate-ping" />
                )}
              </div>
            )}
            <div className="mt-1 opacity-50 font-black tracking-tighter text-[6px]">
              {obj.type.replace("_", " ")}
            </div>
          </div>
        ))}
        {npcStates.map((npc: any) => {
          const dist = Math.sqrt(
            Math.pow(npc.x - playerPos.x, 2) + Math.pow(npc.y - playerPos.y, 2),
          );
          const near = dist < 80;
          return (
            <div
              key={npc.id}
              className="absolute z-30"
              style={{
                left: npc.x,
                top: npc.y,
                transition: npc.isMoving ? "none" : "all 0.3s",
              }}
            >
              <div className="relative group flex flex-col items-center">
                <CharacterSprite
                  spriteBase={npc.spriteBase || "james"}
                  direction={npc.direction}
                  size="xl"
                />
                {npc.id === "tracy" && tracySpeechVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-slate-900 font-black px-4 py-3 rounded-2xl shadow-2xl border-2 border-blue-500 z-50 whitespace-nowrap"
                  >
                    James, find your files.
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-blue-500 rotate-45" />
                  </motion.div>
                )}
                {(npc.speech ||
                  (sagePhase > 0 && npc.id !== playerCharacterId) ||
                  (npc.id === "april" && aprilSpeechVisible) ||
                  (npc.id === "lisa" && lisaSpeech) ||
                  (npc.id === "linda" && lindaSpeech) ||
                  (npc.id === "carribyan" && carribyanSpeech)) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-black font-black px-4 py-3 border-4 border-black z-50 whitespace-nowrap text-xs shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
                  >
                    {npc.speech
                      ? String(npc.speech)
                      : sagePhase === 1
                        ? "SAGE!!!"
                        : sagePhase === 2
                          ? "What a cute baby!"
                          : npc.id === "april" && aprilSpeechVisible
                            ? "James line 1"
                            : npc.id === "lisa" && lisaSpeech
                              ? lisaSpeech
                              : npc.id === "linda" && lindaSpeech
                                ? `"${lindaSpeech}"`
                                : npc.id === "carribyan" && carribyanSpeech
                                  ? `"${carribyanSpeech}"`
                                  : ""}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black rotate-45" />
                  </motion.div>
                )}
                {npc.id === "robby" && (
                  <div className="absolute -bottom-1 text-[6px] font-black text-slate-400">
                    LAB_UNIT
                  </div>
                )}
                {near && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm border-4 border-black px-4 py-2 text-black text-[8px] whitespace-nowrap shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-70 pointer-events-none pixel-border">
                    <div className="font-black tracking-tight mb-0.5 uppercase italic">
                      {npc.name}
                    </div>
                    <div className="text-[6px] text-blue-600 uppercase font-black tracking-widest">
                      {npc.role}
                    </div>
                  </div>
                )}
                {near && (
                  <div
                    key={`interact-${npc.id}`}
                    className="absolute z-60 bg-blue-600 text-white px-4 py-2 border-4 border-white font-black text-[8px] flex items-center gap-3 shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-bounce"
                    style={{ left: npc.x - 40, top: npc.y - 60 }}
                  >
                    <span className="bg-white text-blue-600 px-2 py-0.5 border-2 border-white">
                      [E]
                    </span>
                    INTERACT
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {sara && (
          <div className="absolute z-30" style={{ left: sara.x, top: sara.y }}>
            <div className="relative flex flex-col items-center">
              <CharacterSprite
                spriteBase={sara.spriteBase}
                direction={sara.direction}
                size="xl"
              />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 border-2 border-black text-[8px] font-black whitespace-nowrap shadow-xl">
                Sara & Sage
              </div>
            </div>
          </div>
        )}
        {patients
          .filter((p) => p.status === "WAITING")
          .map((patient: any) => (
            <div
              key={patient.id}
              className="absolute"
              style={{
                left: patient.x,
                top: patient.y,
                zIndex: 30,
                transition: patient.isMoving ? "none" : "all 0.3s",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative group cursor-pointer flex flex-col items-center"
              >
                <CharacterSprite
                  spriteBase={patient.spriteBase}
                  spriteUrl={patient.spriteUrl}
                  direction={patient.direction}
                  size="xl"
                />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 border-2 border-black text-[8px] font-black whitespace-nowrap shadow-xl">
                  {patient.name}
                </div>
                {patient.wantsVerification && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-black font-black p-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-50 whitespace-nowrap border-4 border-black pixel-border text-[8px] italic"
                  >
                    "Can you make sure my{" "}
                    <span className="text-blue-600">glasses</span> are right?"
                  </motion.div>
                )}
              </motion.div>
            </div>
          ))}
        <motion.div
          className="absolute z-40"
          animate={{ x: playerPos.x - 56, y: playerPos.y - 56 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 400,
            mass: 0.5,
          }}
        >
          <div className="relative">
            <CharacterSprite
              spriteBase={playerInfo.spriteBase}
              direction={playerDirection}
              size="xl"
              className="relative z-10"
              isIdle={!isPlayerMoving}
            />
            {jamesSpeech && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white text-black font-black px-4 py-3 border-4 border-black z-50 whitespace-nowrap text-xs shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              >
                "{jamesSpeech}"
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-4 border-b-4 border-black rotate-45" />
              </motion.div>
            )}
          </div>
        </motion.div>
        {SHOP_OBJECTS.map((obj) => {
          const dist = Math.sqrt(
            Math.pow(obj.x + obj.width / 2 - playerPos.x, 2) +
              Math.pow(obj.y + obj.height / 2 - playerPos.y, 2),
          );
          if (dist < 80)
            return (
              <div
                key={`action-${obj.id}`}
                className="absolute z-50 bg-white text-slate-950 px-4 py-2 rounded-2xl font-black text-[10px] flex items-center gap-2 shadow-2xl animate-bounce border-b-4 border-slate-200"
                style={{ left: obj.x + obj.width / 2 - 40, top: obj.y - 60 }}
              >
                <span className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-lg shadow-lg">
                  E
                </span>
                {obj.type === "phone" && isPhoneRinging
                  ? "ANSWER"
                  : obj.type === "display_case" || obj.type === "display"
                    ? "CLEAN_FRAMES"
                    : obj.type === "reception_computer"
                        ? "WATCH YOUTUBE"
                        : obj.type === "coburn_generator"
                          ? "GENERATE_LENS"
                          : obj.type === "finer_cylinder_combo"
                            ? "POLISH_LENS"
                            : "INTERACT"}
              </div>
            );
          return null;
        })}
        {patients.map((p: any) => {
          const dist = Math.sqrt(
            Math.pow(p.x - playerPos.x, 2) + Math.pow(p.y - playerPos.y, 2),
          );
          if (dist < 80) {
            if (p.status === "WAITING")
              return (
                <div
                  key={`action-patient-${p.id}`}
                  className="absolute z-50 bg-blue-600 text-white px-4 py-2 border-4 border-white font-black text-[8px] flex items-center gap-3 shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-bounce"
                  style={{ left: p.x - 40, top: p.y - 60 }}
                >
                  <span className="bg-white text-blue-600 px-2 py-0.5 border-2 border-white">
                    [E]
                  </span>
                  WRITE_UP
                </div>
              );
            if (p.status === "READY_FOR_PICKUP")
              return (
                <div
                  key={`action-patient-fitting-${p.id}`}
                  className="absolute z-50 bg-yellow-500 text-black px-4 py-2 border-4 border-black font-black text-[8px] flex items-center gap-3 shadow-[8px_8px_0_0_rgba(255,255,255,1)] animate-bounce"
                  style={{ left: p.x - 40, top: p.y - 60 }}
                >
                  <span className="bg-black text-white px-2 py-0.5 border-2 border-black">
                    [E]
                  </span>
                  FINAL_FITTING
                </div>
              );
          }
          return null;
        })}
        {(() => {
          const robby = NPCS.find((n) => n.id === "robby")!;
          const dist = Math.sqrt(
            Math.pow(robby.x - playerPos.x, 2) +
              Math.pow(robby.y - playerPos.y, 2),
          );
          if (dist < 80 && inventory.length > 0)
            return (
              <div
                className="absolute z-60 bg-green-600 text-white px-4 py-2 border-4 border-white font-black text-[8px] flex items-center gap-3 shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-bounce"
                style={{ left: robby.x - 40, top: robby.y - 60 }}
              >
                <span className="bg-white text-green-600 px-2 py-0.5 border-2 border-white">
                  [E]
                </span>
                GIVE_TO_LAB
              </div>
            );
          return null;
        })()}
      </div>
      <AnimatePresence>
        {showPhoneFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-200 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.4, repeat: 4 }}
              className="bg-red-600 border-8 border-white rounded-3xl p-8 shadow-[0_0_60px_rgba(255,0,0,0.6)] flex flex-col items-center gap-4"
            >
              <PhoneIcon className="w-24 h-24 text-white" />
              <span className="text-white text-4xl font-black italic">
                INCOMING CALL!
              </span>
              <span className="text-white/60 text-sm font-bold">
                Go answer the phone!
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gameState === GameState.YOUTUBE && (
          <div
            className="fixed inset-0 z-200 bg-black/95 flex items-center justify-center p-8"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
              setIsVideoPlaying(false);
              setGameState(GameState.PLAYING);
              if (bgMusicRef?.current && !audioSettings.muted)
                bgMusicRef.current.play().catch(() => {});
            }}
          >
            <div
              className="relative w-full max-w-5xl aspect-video bg-black rounded-xl overflow-hidden border-4 border-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <video
                ref={videoRef}
                className="w-full h-full"
                src="/househunters.mp4"
                controls
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!isVideoPlaying && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => {});
                        setIsVideoPlaying(true);
                        if (bgMusicRef?.current && !bgMusicRef.current.paused)
                          bgMusicRef.current.pause();
                      }
                    }}
                    className="pointer-events-auto bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-full font-black text-xl transition-all shadow-[0_0_40px_rgba(255,0,0,0.5)] flex items-center gap-3"
                  >
                    <svg className="w-8 h-8" fill="white" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    PLAY VIDEO
                  </button>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                  }
                  setIsVideoPlaying(false);
                  setGameState(GameState.PLAYING);
                  if (bgMusicRef?.current && !audioSettings.muted)
                    bgMusicRef.current.play().catch(() => {});
                }}
                className="absolute -top-12 right-0 bg-white text-black px-6 py-2 rounded-full font-black hover:bg-red-500 hover:text-white transition-colors z-10"
              >
                CLOSE [ESC]
              </button>
            </div>
          </div>
        )}
        {gameState === GameState.EYE_EXAM && (
          <EyeExamGame onClose={() => setGameState(GameState.PLAYING)} />
        )}
        {gameState === GameState.LENSOMETER && (
          <Lensometer onClose={() => setGameState(GameState.PLAYING)} />
        )}
        {gameState === GameState.COMPUTER && (
          <Computer
            onClose={() => setGameState(GameState.PLAYING)}
            onCompleteSale={(amount) => console.log(`Processed ${amount}`)}
          />
        )}
        {gameState === GameState.PHONE && (
          <Phone onClose={() => setGameState(GameState.PLAYING)} />
        )}
        {gameState === GameState.AUTOREFRACTOR && (
          <AutorefractorGame onClose={() => setGameState(GameState.PLAYING)} />
        )}
        {gameState === GameState.EDGER && (
          <EdgerGame onClose={() => setGameState(GameState.PLAYING)} />
        )}
        {gameState === GameState.COBURN_GENERATOR && (
          <Coburn2GGenerator onClose={() => setGameState(GameState.PLAYING)} />
        )}
        {gameState === GameState.CYLINDER_POLISHING && (
          <CylinderPolishingGame onClose={() => setGameState(GameState.PLAYING)} />
        )}
        {activeGame === "cleaning" && (
          <FrameCleaningGame
            brand={cleaningBrand}
            onClose={() => {
              setActiveGame(null);
              setCleaningBrand(null);
            }}
            onComplete={() => {
              setActiveGame(null);
              setCleaningBrand(null);
              setJamesSpeech("Look at that shine!");
              setTimeout(() => setJamesSpeech(null), 3000);
            }}
          />
        )}
        {activeGame === "fitting" && fittingPatient && (
          <FrameFittingGame
            patientName={fittingPatient.name}
            targetMeasurements={fittingMeasurements}
            onClose={() => setActiveGame(null)}
            onComplete={() => {
              setActiveGame(null);
              setPatients((prev) =>
                prev.map((p) =>
                  p.id === fittingPatient.id
                    ? { ...p, status: "COMPLETED" }
                    : p,
                ),
              );
              setJamesSpeech("Another happy customer!");
              setTimeout(() => setJamesSpeech(null), 3000);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeBrand && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-1/2 -translate-y-1/2 right-8 z-60 bg-black border-4 border-white p-6 shadow-[10px_10px_0_0_rgba(0,0,0,1)] w-64 pixel-border"
          >
            <div className="text-[6px] text-blue-400 font-black uppercase tracking-[4px] mb-4">
              View_Brand:
            </div>
            <div className="text-xl font-black text-white mb-6 border-b-4 border-blue-500 pb-2 italic uppercase">
              {activeBrand}
            </div>
            <div className="space-y-4">
              {BRAND_ASSETS[activeBrand]?.map((img: string, i: number) => (
                <div
                  key={i}
                  className="relative group border-4 border-white aspect-video overflow-hidden shadow-lg"
                >
                  <img
                    src={img}
                    alt={`${activeBrand} frame ${i}`}
                    className="w-full h-full object-cover pixelated"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[6px] font-black text-white px-2 py-1 bg-blue-600 border-2 border-white">
                      EXPLORE
                    </span>
                  </div>
                </div>
              ))}
              {(!BRAND_ASSETS[activeBrand] ||
                BRAND_ASSETS[activeBrand]?.length === 0) && (
                <div className="text-[6px] text-white/40 italic font-black uppercase">
                  Data_Missing
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {dialogue && (
          <>
            <div
              className="fixed inset-0 z-90 bg-transparent"
              onClick={() => setDialogue(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 z-100 w-150 max-w-[90vw] bg-black border-8 border-white p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)] pixel-border"
            >
              <div className="flex flex-col gap-4">
                <div className="text-[8px] text-blue-400 font-black tracking-[4px] uppercase">
                  {dialogue.speaker}:
                </div>
                <div className="text-white font-black text-lg leading-relaxed italic">
                  "{dialogue.message}"
                </div>
              </div>
              <button
                onClick={() => setDialogue(null)}
                className="absolute bottom-4 right-8 text-[10px] font-black text-yellow-400 animate-pulse"
              >
                CLICK ANYWHERE TO CONTINUE -{">"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {isMobile && (
        <div className="fixed bottom-8 left-8 z-100 scale-125 origin-bottom-left">
          <div
            className="relative w-48 h-48"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const dx = touch.clientX - cx;
              const dy = touch.clientY - cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              ["w", "s", "a", "d"].forEach(
                (k) => delete keysPressed.current[k],
              );
              if (dist > 30) {
                keysPressed.current["w"] = dy < 0;
                keysPressed.current["s"] = dy > 0;
                keysPressed.current["a"] = dx < 0;
                keysPressed.current["d"] = dx > 0;
              }
            }}
            onTouchMove={(e) => {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const dx = touch.clientX - cx;
              const dy = touch.clientY - cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 30) {
                keysPressed.current["w"] = dy < 0;
                keysPressed.current["s"] = dy > 0;
                keysPressed.current["a"] = dx < 0;
                keysPressed.current["d"] = dx > 0;
              } else {
                ["w", "s", "a", "d"].forEach(
                  (k) => delete keysPressed.current[k],
                );
              }
            }}
            onTouchEnd={() => {
              ["w", "s", "a", "d"].forEach(
                (k) => delete keysPressed.current[k],
              );
            }}
          >
            <div className="absolute inset-0 rounded-full bg-black/40 border-2 border-white/50"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 border-2 border-white flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-blue-600"></div>
            </div>
          </div>
        </div>
      )}
      {isMobile && (
        <div className="fixed bottom-8 right-8 z-100 scale-150 origin-bottom-right">
          <button
            onClick={checkInteraction}
            onTouchStart={(e) => e.preventDefault()}
            className="w-20 h-20 bg-blue-600 border-4 border-white text-white flex flex-col items-center justify-center active:bg-blue-700 rounded-full shadow-2xl"
          >
            <Hand size={28} />
            <span className="text-[8px] font-black mt-1">SELECT</span>
          </button>
        </div>
      )}

      {/* Clinic Log Overlay */}
      <AnimatePresence>
        {clinicLogOpen && (
          <ClinicLogOverlay
            revenue={revenue}
            tasks={tasks}
            onClose={() => setClinicLogOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
