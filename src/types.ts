export enum GameState {
  MENU,
  CHARACTER_SELECTION,
  PLAYING,
  OPTIONS,
  LENSOMETER,
  COMPUTER,
  PHONE,
  APPOINTMENTS,
  YOUTUBE,
  EYE_EXAM,
  AUTOREFRACTOR,
  EDGER,
  COBURN_GENERATOR,
  CYLINDER_POLISHING,
  CLINIC_LOG,
  MODE_SELECTION,
}

export enum GameMode {
  CAREER = "CAREER",
  FREE = "FREE",
}

export interface Patient {
  id: string;
  name: string;
  insurance: string;
  avatar?: string;
  prescription: {
    sphere: number;
    cylinder: number;
    axis: number;
  };
  status:
    | "WAITING"
    | "BEING_HELPED"
    | "WAITING_FOR_LAB"
    | "READY_FOR_PICKUP"
    | "READY_FOR_CHECKOUT"
    | "COMPLETED";
  wantsVerification?: boolean;
  spriteBase?: string;
  spriteUrl?: string;
  needsEyeExam?: boolean;
  checkoutAmount?: number;
  isFollowing?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: "file" | "frame" | "glasses";
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  avatar?: string;
  spriteBase?: string;
  spriteUrl?: string;
  dialogue?: string[];
  speech?: string;
  targetX?: number;
  targetY?: number;
  isMoving?: boolean;
  direction?:
    | "north"
    | "south"
    | "east"
    | "west"
    | "north-east"
    | "north-west"
    | "south-east"
    | "south-west";
}

export interface Position {
  x: number;
  y: number;
}

export interface LabJob {
  id: string;
  patientId: string;
  patientName: string;
  frameName: string;
  lensType: string;
  materialType: string;
  createdAt: number;
}

export interface DayFinancials {
  cashRevenue: number;
  cardRevenue: number;
  dockedPenalties: number;
  transactions: { amount: number; method: "cash" | "card"; time: string }[];
}