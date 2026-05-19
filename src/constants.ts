import { NPC } from "./types";

export const SHOP_WIDTH = 2400;
export const SHOP_HEIGHT = 800;

export const NPCS: NPC[] = [
  {
    id: "james",
    name: "James",
    role: "Optician",
    x: 1000,
    y: 350,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "james",
  },
  {
    id: "tracy",
    name: "Tracy",
    role: "File Clerk",
    x: 830,
    y: 180,
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "tracy",
    dialogue: [
      "Have you seen what that idiot Trump said now?!",
      "James. Find your files while you ain't doing nothing.",
    ],
  },
  {
    id: "sabrina",
    name: "Sabrina",
    role: "Insurance Clerk",
    x: 640,
    y: 140,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "sabrina",
    dialogue: [
      "(phone rings loudly she picks it up) Yes Joe what do you want?",
      "James what's this say I can't read your handwritin'.",
    ],
  },
  {
    id: "robby",
    name: "Robby",
    role: "Lab Manager",
    x: 2150,
    y: 140,
    avatar:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "Robby",
    dialogue: [
      "Check out Ol' Boy on Youtube. He plays crazy fast.",
      "Check out this slick '82 T-Top Camaro they got on Facebook Marketplace.",
    ],
  },
  {
    id: "carribyan",
    name: "Carribyan",
    role: "Optician",
    x: 1100,
    y: 450,
    avatar:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "carribyan",
    dialogue: ["What's everyone having for dinner?", "I love my husband!"],
  },
  {
    id: "april",
    name: "April",
    role: "Receptionist",
    x: 520,
    y: 180,
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "april",
    dialogue: [
      "Go away I'm watching House Hunters. They're in Thailand today.",
      "Incoming!",
    ],
  },
  {
    id: "linda",
    name: "Linda",
    role: "Office Manager",
    x: 1500,
    y: 600,
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "linda",
    dialogue: [
      "Go away I'm doing taxes.",
      "Will you tell April to get the damn phone!?",
    ],
  },
  {
    id: "lisa",
    name: "Lisa",
    role: "Optometric Technician",
    x: 900,
    y: 200,
    avatar:
      "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "characters/lisa/states/older_lady_with_long_blonde",
    dialogue: [
      "Will you and April stop fighting please?",
      "(picks up phone) Hey Finnleigh!!",
    ],
  },
  {
    id: "nairobi",
    name: "Nairobi",
    role: "Optician",
    x: 750,
    y: 300,
    avatar:
      "https://images.unsplash.com/photo-1531123897727-40c1ce63126f?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase:
      "characters/Naerobi/states/a_hispanic_male_with_long_curly_hair_wearing_black",
    dialogue: [
      "Has anybody heard of Lisa Jones? Nobody? FML.",
      "(Looks at patient) Sir you don't know what you're talking about!",
    ],
  },
  {
    id: "sara",
    name: "Sara",
    role: "Tracy's Daughter",
    x: 1400,
    y: 400,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "sara",
  },
  {
    id: "drklecker",
    name: "Dr. Klecker",
    role: "Optometrist",
    x: 200,
    y: 300,
    avatar:
      "https://images.unsplash.com/photo-1594824813573-c46fe469cd43?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "drklecker",
    dialogue: [
      "Did you just now get here?",
      "Are you gonna do any work today?",
      "I don't think you know what you're talking about",
      "I thought you loved Trump.",
    ],
  },
  {
    id: "dr_robbins",
    name: "Dr. Robbins",
    role: "Optometrist",
    x: 150,
    y: 100,
    avatar:
      "https://images.unsplash.com/photo-1594824813573-c46fe469cd43?auto=format&fit=crop&q=80&w=150&h=150",
    spriteBase: "drrobbins",
  },
];

export const BRANDS = [
  "Ray-Ban",
  "Michael Kors",
  "Enhance",
  "Modern",
  "Smilen",
  "Tots Eyewear",
  "Bebe",
  "CVO Advantage",
  "ECO Eyewear",
];

export const BRAND_ASSETS: Record<string, string[]> = {
  "Ray-Ban": ["/glasses/rayban/aviator.png", "/glasses/rayban/clubmaster.png"],
  "Michael Kors": [
    "/glasses/michael kors/michaelkors1.png",
    "/glasses/michael kors/michaelkors2.png",
  ],
  Enhance: ["/glasses/enhance/enhance1.png", "/glasses/enhance/enhance2.png"],
  Bebe: ["/glasses/bebe/bebe1.png", "/glasses/bebe/bebe2.png"],
  "CVO Advantage": ["/glasses/cvo/cvo1.png", "/glasses/cvo/cvo2.png"],
  "ECO Eyewear": ["/glasses/eco/eco1.png", "/glasses/eco/eco2.png"],
  "Tots Eyewear": ["/glasses/tots/tots1.png", "/glasses/tots/tots2.png"],
  Modern: ["/glasses/modern/modern1.png", "/glasses/modern/modern2.png"],
  Smilen: ["/glasses/smilen/smilen1.png", "/glasses/smilen/smilen2.png"],
};

export const SHOP_OBJECTS = [
  // ── Top-Left Corner: Stand-On Poster Display ───────────────────────────────
  {
    id: "cl_poster",
    type: "poster_display",
    x: 0,
    y: 0,
    width: 60,
    height: 90,
  },
  { id: "cl_chair_left1", type: "chair", x: 65, y: 170, width: 55, height: 55 },
  {
    id: "cl_chair_left2",
    type: "chair",
    x: 125,
    y: 170,
    width: 55,
    height: 55,
  },
  {
    id: "cl_chair_left3",
    type: "chair",
    x: 185,
    y: 170,
    width: 55,
    height: 55,
  },
  {
    id: "cl_chair_right1",
    type: "chair",
    x: 350,
    y: 170,
    width: 55,
    height: 55,
  },
  {
    id: "cl_chair_right2",
    type: "chair",
    x: 410,
    y: 170,
    width: 55,
    height: 55,
  },
  {
    id: "cl_chair_right3",
    type: "chair",
    x: 470,
    y: 170,
    width: 55,
    height: 55,
  },

  // Exam Room Area (Left wing — moved down / back)
  {
    id: "exam_chair_1",
    type: "exam_chair",
    x: 80,
    y: 380,
    width: 80,
    height: 100,
  },
  {
    id: "exam_chair_2",
    type: "exam_chair",
    x: 380,
    y: 380,
    width: 80,
    height: 100,
  },
  { id: "exam_desk", type: "counter", x: 50, y: 510, width: 150, height: 80 },
  {
    id: "dr_computer",
    type: "reception_computer",
    x: 70,
    y: 515,
    width: 50,
    height: 35,
  },
  {
    id: "autorefractor",
    type: "autorefractor",
    x: 130,
    y: 510,
    width: 60,
    height: 50,
  },
  { id: "phoropter", type: "wall_item", x: 250, y: 500, width: 40, height: 40 },
  { id: "eye_chart", type: "wall_item", x: 550, y: 500, width: 40, height: 80 },

  // New Reception Desk for April (Stationary)
  {
    id: "april_desk",
    type: "counter",
    x: 450,
    y: 150,
    width: 150,
    height: 120,
  },
  {
    id: "april_computer",
    type: "reception_computer",
    x: 480,
    y: 160,
    width: 60,
    height: 40,
  },

  // Reception Area (Shop side)
  {
    id: "front_desk",
    type: "counter",
    x: 620,
    y: 150,
    width: 250,
    height: 180,
  },
  {
    id: "computer_station",
    type: "computer",
    x: 700,
    y: 170,
    width: 60,
    height: 40,
  },
  { id: "phone_station", type: "phone", x: 760, y: 170, width: 30, height: 30 },
  { id: "hpprinter", type: "hpprinter", x: 790, y: 170, width: 80, height: 70 },
  { id: "printer", type: "printer", x: 630, y: 170, width: 80, height: 70 },

  // Center Display Cases (Middle of the room)
  {
    id: "center_case_1",
    type: "display_case",
    x: 1100,
    y: 250,
    width: 80,
    height: 200,
  },
  {
    id: "center_case_2",
    type: "display_case",
    x: 1250,
    y: 250,
    width: 80,
    height: 200,
  },

  // Right Wall Brands
  {
    id: "wall_rayban",
    type: "display",
    x: 1750,
    y: 100,
    width: 40,
    height: 150,
    brand: "Ray-Ban",
  },
  {
    id: "wall_bebe",
    type: "display",
    x: 1750,
    y: 260,
    width: 40,
    height: 150,
    brand: "Bebe",
  },
  {
    id: "wall_cvo",
    type: "display",
    x: 1750,
    y: 420,
    width: 40,
    height: 150,
    brand: "CVO Advantage",
  },
  {
    id: "wall_eco",
    type: "display",
    x: 1750,
    y: 580,
    width: 40,
    height: 150,
    brand: "ECO Eyewear",
  },

  // Left Wall Brands (Now at 610)
  {
    id: "wall_mk",
    type: "display",
    x: 610,
    y: 400,
    width: 40,
    height: 150,
    brand: "Michael Kors",
  },
  {
    id: "wall_enhance",
    type: "display",
    x: 610,
    y: 560,
    width: 40,
    height: 150,
    brand: "Enhance",
  },

  // Back Wall (Medicate)
  {
    id: "tots_wall",
    type: "display",
    x: 1000,
    y: 20,
    width: 400,
    height: 30,
    brand: "Tots Eyewear",
  },

  // Lab Area (Robby's spot, Now 1800-2400)
  {
    id: "lensometer_station",
    type: "lensometer",
    x: 1900,
    y: 50,
    width: 120,
    height: 80,
  },
  { id: "job_shelf_1", type: "shelf", x: 2100, y: 20, width: 250, height: 40 },
  { id: "lab_desk", type: "counter", x: 1950, y: 180, width: 350, height: 120 },
  {
    id: "7e_machine",
    type: "7e_machine",
    x: 2000,
    y: 170,
    width: 120,
    height: 100,
  },
  {
    id: "tool_rack",
    type: "wall_item",
    x: 1850,
    y: 180,
    width: 60,
    height: 100,
  },
  { id: "lab_sink", type: "cabinet", x: 1850, y: 650, width: 100, height: 100 },
  {
    id: "safety_sign",
    type: "wall_item",
    x: 1810,
    y: 360,
    width: 40,
    height: 50,
  },
  { id: "lab_chair", type: "chair", x: 2150, y: 320, width: 60, height: 60 },
  {
    id: "coburn_generator",
    type: "coburn_generator",
    x: 2280,
    y: 180,
    width: 100,
    height: 100,
  },
  { id: "finer", type: "finer", x: 2250, y: 320, width: 80, height: 80 },
  {
    id: "cylinder_polishing_machine",
    type: "cylinder_polisher",
    x: 2100,
    y: 420,
    width: 120,
    height: 100,
  },

  // Dispensing Tables (Bottom Area)
  {
    id: "dispensing_table_1",
    type: "table",
    x: 1000,
    y: 600,
    width: 120,
    height: 80,
  },
  {
    id: "dispensing_table_2",
    type: "table",
    x: 1300,
    y: 600,
    width: 120,
    height: 80,
  },
];
