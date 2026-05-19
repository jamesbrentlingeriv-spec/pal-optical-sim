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
    | "COMPLETED";
  wantsVerification?: boolean;
  spriteBase?: string;
  spriteUrl?: string;
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
