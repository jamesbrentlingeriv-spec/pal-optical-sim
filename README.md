<div align="center">
  <img width="1200" height="475" alt="PAL Optical Sim Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  <br/><br/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Motion-12-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Motion 12" />

<br/><br/>

  <h3>A top-down pixel art optical store simulation game 🕹️👓</h3>
  <p>Manage patients, verify prescriptions, fit frames, and run the daily operations of a bustling optometry practice — all from a retro 2D isometric perspective.</p>
</div>

---

## 📋 Table of Contents

- [About the Game](#about-the-game)
- [Gameplay Overview](#gameplay-overview)
- [Characters](#characters)
- [Patient System](#patient-system)
- [Mini-Games](#mini-games)
- [Shop Layout](#shop-layout)
- [Interactive Objects](#interactive-objects)
- [Special Events](#special-events)
- [UI & HUD](#ui--hud)
- [Visual Style](#visual-style)
- [Mobile Support](#mobile-support)
- [Audio](#audio)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Run Locally](#run-locally)
- [Build for Production](#build-for-production)

---

## 🎮 About the Game

**PAL Optical Sim** puts you in the shoes of **James**, an optician working at a
busy optical shop. Navigate a fully realized 2D pixel-art store, interact with
staff and patients, use specialized optical equipment, and manage the complete
patient workflow — from check-in to final frame fitting.

The game simulates the daily life of an optical practice with:

- 🏢 A **three-zone shop floor** (Examination Wing, Retail Showroom, Laboratory)
- 👥 **11 unique NPCs**, each with their own role and personality
- 👤 **Procedurally generated patients** with randomized names, insurance plans,
  and prescriptions
- 🔬 **Functional optical equipment** (lensometer, phoropter, Snellen chart)
- 🎯 **4 playable mini-games** (eye exam, lens verification, frame cleaning,
  frame fitting)
- ⚡ **Dynamic ambient events** including the famous "SAGE!!!" moment
- 📱 **Full mobile support** with touch controls
- 🎨 **Immersive pixel-art aesthetic** with CRT scanlines, wood-grain textures,
  and retro borders

---

## 🕹️ Gameplay Overview

### Controls

| Action     | Desktop   | Mobile            |
| ---------- | --------- | ----------------- |
| Move Up    | `W` / `↑` | D-Pad Up          |
| Move Down  | `S` / `↓` | D-Pad Down        |
| Move Left  | `A` / `←` | D-Pad Left        |
| Move Right | `D` / `→` | D-Pad Right       |
| Interact   | `E`       | Touch Hand Button |

### Player Flow

1. **Main Menu** → Start game, access options
2. **Character Selection** → Choose your optician character
3. **Free Roam** → Walk around the shop using WASD/Arrow keys
4. **Interact** → Press `E` when near objects, patients, or NPCs
5. **Complete Workflow** → Greet patients → verify prescriptions → send to lab →
   fit frames → complete sale
6. **Patients leave** when their job is done, and new patients arrive
   automatically

---

## 👥 Characters

The shop is staffed with 11 unique characters, each with distinct behaviors,
dialogue, and roles:

| Name               | Role                  | Behavior                                                                                           |
| ------------------ | --------------------- | -------------------------------------------------------------------------------------------------- |
| **James** 🎮       | **Optician (You!)**   | Player-controlled character                                                                        |
| **Dr. Robbins** 🩺 | Optometrist           | Performs eye exams in the Examination Wing                                                         |
| **Tracy** 📁       | File Clerk            | Periodically shouts _"James, find your files."_ every 20s                                          |
| **Sabrina** 💰     | Insurance Clerk       | Processes insurance paperwork                                                                      |
| **April** 🖥️       | Receptionist          | Stationary at the front desk; answers when the phone rings                                         |
| **Robby** 🔧       | Lab Manager           | Runs the lab; requests frames from the front desk to complete jobs                                 |
| **Carribyan** 👓   | Optician              | Random dialogue like _"Who dispensed this?"_                                                       |
| **Linda** 🏢       | Office Manager        | Barks orders: _"Get that desk cleaned off"_, _"Go get the mail"_, _"Somebody clean these mirrors"_ |
| **Lisa** 📋        | Optometric Technician | Calls out patient names loudly                                                                     |
| **Nairobi** 👁️     | Optician              | Works the shop floor                                                                               |
| **Sara** 👶        | Tracy's Daughter      | Appears during the special "SAGE!!!" event                                                         |
| **Patients** 🚶    | Customers             | Procedurally generated; walk around, wait, get helped, and leave                                   |

All NPCs roam randomly within their designated zones, occasionally change
direction, and respond to special events (like the Sage arrival) by crowding
around.

---

## 👤 Patient System

Patients spawn automatically (up to 2 at a time) and follow a complete
lifecycle:

### Patient Lifecycle

```
WAITING ──[Press E]──→ BEING_HELPED ──[15s lab delay]──→ READY_FOR_PICKUP ──[Press E]──→ COMPLETED ──→ LEAVES
   │                            │                               │
   └── Optional: Request       Job created                     Requires frame
       lens verification       (added to inventory)            fitting mini-game
```

### Patient Attributes

- **Name**: Randomly generated from 20+ first names × 5 last names
- **Insurance**: VSP, EyeMed, Blue Shield, or Aetna
- **Prescription**: Randomized sphere (-2.00 to +2.00), cylinder (-1.00 to
  +1.00), axis (0–180°)
- **Verification Request**: ~30% chance a patient will ask you to verify their
  prescription on the lensometer
- **Avatar**: Randomly assigned male or female sprite with unique appearance

### Patient Workflow (Step-by-Step)

1. Patient walks in and waits in the reception area
2. Walk up to a waiting patient and press `E` to write them up
3. A job ticket is added to your inventory
4. Take the job to **Robby** in the lab (press `E`)
5. Robby asks for a frame → go to **Tracy** at the front desk (press `E`) to
   collect it
6. Return the frame to **Robby** to complete the lab step
7. After 15 seconds, the patient becomes ready for pickup
8. Interact with the patient to launch the **frame fitting** mini-game
9. Complete the fitting → patient pays and leaves the shop

---

## 🎯 Mini-Games

### 1. Lensometer (PAL-9000 Analyzer)

Verify a patient's prescription by operating a digital lensometer.

**Objective**: Align the mires (crosshairs) and match the prescribed power.

**Controls**:

- **Power Wheel**: Adjust sphere power from -4.00D to +4.00D (0.25D increments)
- **Axis Wheel**: Drag left/right to rotate the axis alignment (0–360°)
- **Status**: Green "READY" indicator when both rotation (±3°) and power
  (±0.12D) are matched

**Visual Feedback**:

- The eyepiece view shows green mires with a **dynamic blur effect** that
  sharpens as you approach the correct power
- CRT scanline overlay and radial gradient for authentic retro machine feel
- Target mires rotate independently from the player's prism control

---

### 2. Eye Exam (Snellen Chart)

Dr. Robbins walks you through a 5-round A/B comparison refraction test.

**Objective**: Choose which of two lenses makes the Snellen chart letters appear
clearer.

**Rounds**:

| Round | Lens 1 Blur           | Lens 2 Blur             | Difference |
| ----- | --------------------- | ----------------------- | ---------- |
| 1     | Very blurry (10px)    | Blurry (6px)            | Easy       |
| 2     | Blurry (7px)          | Somewhat blurry (4px)   | Moderate   |
| 3     | Somewhat blurry (5px) | Slightly blurry (2.5px) | Medium     |
| 4     | Slightly blurry (3px) | Barely blurry (1px)     | Hard       |
| 5     | Barely blurry (1.5px) | Clear (0px)             | Final      |

**Features**:

- Live Snellen chart letters (E, F P, T O Z, L P E D, etc.)
- Animated blur transitions between selections
- Progress indicator (5 dots showing rounds completed)
- Correct/incorrect feedback with animated checkmarks
- Final results screen with Dr. Robbins' recommendation

---

### 3. Frame Cleaning

Triggered by interacting with display cases or wall displays.

**Objective**: Clean the frames on display until they shine.

**Feedback**: James says _"Look at that shine!"_ on completion.

---

### 4. Frame Fitting (Adjustments)

When helping a patient pick up their finished glasses, you must adjust the frame
to match target measurements.

**Parameters**:

- **Frame Width** (0–100)
- **Bridge Width** (0–100)
- **Temple Length** (0–100)

**Objective**: Match all three measurements to the patient's target values.
Patient says _"Another happy customer!"_ on completion.

---

## 🏪 Shop Layout

The store spans **2400×800 pixels** divided into three distinct zones:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  EXAMINATION WING           │           SHOWROOM           │  LABORATORY   │
│  (Dr. Robbins)              │                             │  (Robby)       │
│                             │                             │                │
│  ┌─────┐ ┌─────┐           │  ┌─────┐    ┌──────────┐    │  ┌──────┐     │
│  │Exam │ │Exam │            │  │Front│    │  Center  │    │  │Lenso-│     │
│  │Chair│ │Chair│            │  │Desk │    │ Displays │    │  │meter │     │
│  └─────┘ └─────┘           │  └─────┘    └──────────┘    │  └──────┘     │
│  ┌───────┐                  │                             │  ┌────────┐   │
│  │Phorop-│                  │  ┌──────────┐              │  │Job     │   │
│  │ter    │                  │  │Brand     │              │  │Shelves │   │
│  └───────┘                  │  │Displays  │              │  └────────┘   │
│         ◄───┐  ┌───►       │  │(Wall)    │              │  ┌────┐       │
│  ┌───┐       │  │           │  └──────────┘              │  │7e  │       │
│  │Eye│       │DOOR│         │                             │  │Mac.│       │
│  │Ch-│       │    │         │  ┌──────────┐              │  └────┘       │
│  │art│       └────┘         │  │Dispensing│              │  ┌───────┐    │
│  └───┘                      │  │Tables    │              │  │Lab    │    │
│              YELLOW TAPE    │  └──────────┘              │  │Sink   │    │
│                             │                             │  └───────┘    │
│                             │  ┌──────────┐              │  ┌───────┐    │
│  ┌───┐                      │  │Sara Event│              │  │Safety │    │
│  │Dr.│                      │  │(Center)  │              │  │Sign   │    │
│  │Rob│                      │  └──────────┘              │  └───────┘    │
│  └───┘                      │                             │               │
├──────────────┬──────────────┴──┬──────────────────────────┴───────────────┤
│  Office Wing │  DOOR (150-350) │  Shop (600-1800)    │ DOOR (350-550) │Lab │
│  (0-600)     │                 │                      │                │   │
└──────────────┴─────────────────┴──────────────────────┴────────────────┘
```

### Zone Details

| Zone                 | X Range   | Floor           | Key Features                                                                   |
| -------------------- | --------- | --------------- | ------------------------------------------------------------------------------ |
| **Examination Wing** | 0–600     | Dark wood-grain | Exam chairs, Dr. Robbins' desk, phoropter, eye chart                           |
| **Retail Showroom**  | 600–1800  | Wood-grain      | Front desk, reception computers, brand walls, display cases, dispensing tables |
| **Laboratory**       | 1800–2400 | White tile      | Lensometer, job shelves, 7e machine, lab sink, tool rack, safety sign          |

### Partition Walls

- **Office ↔ Shop**: Solid wall at x=600 with a door opening from y=150 to y=350
- **Shop ↔ Lab**: Solid wall at x=1800 with a door opening from y=350 to y=550
- Both doors feature **yellow safety tape** striping
- Walls have a **wood-grain texture** with dark brown coloring

---

## 🪑 Interactive Objects

| Object                    | Type                 | Interaction                                   |
| ------------------------- | -------------------- | --------------------------------------------- |
| **Phone** 📞              | `phone`              | Answer ringing calls (phone rings every ~30s) |
| **Computer** 💻           | `computer`           | Access sales/patient management system        |
| **Reception Computer** 🖥️ | `reception_computer` | Watch YouTube (Tracy's break time)            |
| **Lensometer** 🔬         | `lensometer`         | Launch lens verification mini-game            |
| **Phoropter** 🌀          | `wall_item`          | Start eye exam                                |
| **Eye Chart** 📊          | `wall_item`          | Start eye exam                                |
| **Display Cases** 🪟      | `display_case`       | Clean frames mini-game                        |
| **Brand Displays** 🏷️     | `display`            | View brand catalog + clean frames             |
| **Exam Chairs** 💺        | `exam_chair`         | Exam room seating                             |
| **HP Printer** 🖨️         | `hpprinter`          | Lab printer                                   |
| **7e Machine** ⚙️         | `7e_machine`         | Lab edging machine                            |
| **Job Shelves** 📦        | `shelf`              | Lab job storage                               |
| **Lab Sink** 🚰           | `cabinet`            | Utility sink                                  |
| **Safety Sign** ⚠️        | `wall_item`          | Lab safety signage                            |
| **Front Desk Counter** 🪑 | `counter`            | Patient check-in area                         |

### Brand Displays

9 frame brands are featured in the shop, each with their own wall display area:

| Brand            | Location                 |
| ---------------- | ------------------------ |
| **Ray-Ban**      | Right wall (top)         |
| **Bebe**         | Right wall               |
| **Coach**        | Right wall               |
| **Versace**      | Right wall (bottom)      |
| **Michael Kors** | Left wall                |
| **Enhance**      | Left wall (bottom)       |
| **Medicate**     | Back wall (large banner) |

When walking near a brand display, a **side panel** slides in showing product
images and an "EXPLORE" overlay.

---

## ⚡ Special Events

### "SAGE!!!" Event 🔥

Every **3 minutes**, this signature event triggers:

1. **Sara** (Tracy's daughter) enters from the bottom of the screen carrying her
   baby **Sage**
2. **ALL NPCs** stop what they're doing and **crowd around** her in a circle
3. Everyone shouts **"SAGE!!!"** in unison (phase 1, ~5 seconds)
4. Everyone says **"What a cute baby!"** (phase 2, ~8 seconds)
5. After 25 seconds total, Sara walks out and NPCs return to their original
   positions
6. Speech bubbles appear above each character during the event

### Periodic NPC Dialogue

| NPC           | Frequency     | Messages                                                                             |
| ------------- | ------------- | ------------------------------------------------------------------------------------ |
| **Tracy**     | Every 20s     | _"James, find your files."_                                                          |
| **Lisa**      | Every 30s     | Shouts a random patient's name: _"ROBERT!"_                                          |
| **Linda**     | Every 30s     | _"Get that desk cleaned off"_, _"Go get the mail"_, _"Somebody clean these mirrors"_ |
| **Carribyan** | Every 30s     | _"Who dispensed this?"_, _"What's everybody having for dinner?"_                     |
| **April**     | On phone ring | Receptionist alert                                                                   |

### Robby's Frame Workflow

A scripted interaction chain between you, Robby, and Tracy:

1. Talk to **Robby** with a job in inventory → _"I need the frame from the front
   desk"_
2. Talk to **Tracy** → _"Here is the frame Robby was asking for"_
3. Return to **Robby** → _"Perfect! Long hair don't care, lab is running
   smooth!"_

### Phone Ringing

The shop phone rings every **30 seconds**. An animated alert appears in the HUD,
April's speech bubble shows, and you can press `E` near the phone to answer
(launches the phone scenario screen).

---

## 🖥️ UI & HUD

### Main HUD (Bottom-Right)

```
┌──────────────────────┐
│ [Player Portrait]    │
│ OPTICIAN             │
│ JAMES                │
├──────────────────────┤
│ [Phone Alert]        │ (when ringing)
├──────────────────────┤
│ [🔊 Mute Button]     │
├──────────────────────┤
│ ┌──── CLINIC_LOG ──┐ │
│ │ WAIT: 2          │ │
│ │ JOBS: 1          │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### Interaction Prompts

When you walk near an interactable object or person, a prompt appears above it:

- `[E] INTERACT` (general objects)
- `[E] WRITE_UP` (waiting patients)
- `[E] FINAL_FITTING` (ready-for-pickup patients)
- `[E] CLEAN_FRAMES` (display cases)
- `[E] GIVE_TO_LAB` (Robby with inventory)
- `[E] ANSWER` (ringing phone)
- `[E] WATCH YOUTUBE` (reception computer)

### Dialogue System

Anime-style dialogue boxes appear at the bottom of the screen with:

- Speaker name in blue
- Message in large italic white text
- _"Click anywhere to continue"_ prompt
- Pulsing animation on entry/exit

### Brand Info Panel

Slides in from the right when near a brand display, showing:

- Brand name header
- Product photos with hover overlay
- _"Data_Missing"_ fallback for brands without assets

---

## 🎨 Visual Style

The game features a cohesive retro pixel-art aesthetic:

### CSS Utilities

| Class                | Effect                                                |
| -------------------- | ----------------------------------------------------- |
| `.pixelated`         | `image-rendering: pixelated` for crisp pixel art      |
| `.pixel-border`      | Multi-layered box-shadow creating retro pixel borders |
| `.pixel-border-blue` | Same but with blue accent color                       |
| `.wall-texture`      | Subtle SVG tiled pattern overlay                      |
| `.wood-grain`        | Brown base with dark checkerboard SVG pattern         |
| `.animate-ring`      | 2-step scale animation for phone ringing              |

### Flooring

- **Office & Shop**: Dark grey-brown (`#808069`) with radial vignette shadow
- **Lab**: White with 40px grid tile pattern at 10% opacity

### Lighting

- **Track lights** at x=800, 1100, 1400, 1700 with radial gradients
- **Lab strip lights**: Industrial fluorescent fixtures
- **CRT glow**: Green/blue glow effects on the lensometer screen
- **Top vignette**: Gradient shadow at the top of each zone

### Typography

- **Press Start 2P** pixel font (from Google Fonts) used throughout
- Retro uppercase styling with tracking-widest for labels
- Terminal-style headers like `CLINIC_LOG`, `EXAMINATION WING - DR. ROBBINS`,
  `LABORATORY SECTOR A`

---

## 📱 Mobile Support

The game is fully responsive with dedicated mobile controls:

- **Touch D-Pad** bottom-left corner with Up/Down/Left/Right buttons
- **Interact Button** bottom-right corner (blue circle with hand icon + [E]
  label)
- **Responsive Scaling** — camera and game world auto-scale to fit screen width
- **HUD Scaling** — HUD elements scale down on smaller screens
- **All objects and NPCs** have touch-friendly hit detection

---

## 🔊 Audio

- **Background Music**: Loops _"Save Point Smile.mp3"_
- **Auto-play**: Attempts autoplay on page load with click/keyboard interaction
  fallback
- **Mute Toggle**: HUD button to mute/unmute
- **Volume Control**: Adjustable via the options menu (0–100%)

---

## 🛠️ Tech Stack

| Technology                                            | Purpose                                           |
| ----------------------------------------------------- | ------------------------------------------------- |
| **[React 19](https://react.dev/)**                    | UI framework (concurrent features)                |
| **[TypeScript 5.8](https://www.typescriptlang.org/)** | Type safety and developer experience              |
| **[Tailwind CSS 4](https://tailwindcss.com/)**        | Utility-first CSS with `@theme` custom properties |
| **[Vite 6](https://vitejs.dev/)**                     | Fast development server and bundler               |
| **[Motion 12](https://motion.dev/)**                  | Animation library (Framer Motion successor)       |
| **[Lucide React](https://lucide.dev/)**               | Icon library                                      |
| **[Express](https://expressjs.com/)**                 | Backend server (deployment)                       |

---

## 📁 Project Structure

```
pal-optical-sim/
├── public/
│   ├── characters/          # Character sprite sheets
│   ├── objects/             # Object sprite images (lensometer, printer, 7e machine, displays)
│   ├── game.png             # Game screenshot
│   ├── Save Point Smile.mp3 # Background music
│   └── site.webmanifest     # PWA manifest
├── src/
│   ├── components/
│   │   ├── UI/
│   │   │   ├── MainMenu.tsx        # Title screen with Start/Options
│   │   │   ├── CharacterSelection.tsx  # Choose your optician
│   │   │   ├── Options.tsx         # Audio settings (volume, mute)
│   │   │   ├── Computer.tsx        # Sales/POS terminal
│   │   │   ├── Phone.tsx           # Phone scenario manager
│   │   │   ├── Lensometer.tsx      # PAL-9000 prescription verifier 🎯
│   │   │   ├── EyeExamGame.tsx     # Snellen chart eye exam 🎯
│   │   │   ├── FrameCleaningGame.tsx # Frame cleaning mini-game 🎯
│   │   │   └── FrameFittingGame.tsx  # Frame adjustment mini-game 🎯
│   │   ├── GameWorld.tsx           # Main game loop, rendering, physics
│   │   └── CharacterSprite.tsx     # 8-direction sprite rendering
│   ├── hooks/
│   │   └── useWindowSize.ts        # Responsive hook
│   ├── App.tsx                     # Root component with state routing
│   ├── main.tsx                    # Entry point
│   ├── constants.ts                # Shop layout, NPCs, brands, objects
│   ├── types.ts                    # TypeScript interfaces & enums
│   └── phoneScenarios.ts           # Phone call scripts
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Run Locally

**Prerequisites**: [Node.js](https://nodejs.org/) (v18+)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/pal-optical-sim.git
cd pal-optical-sim

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 📦 Build for Production

```bash
npm run build
```

Output is written to the `dist/` directory. Serve with any static file server:

```bash
npm run preview
```

---

## 🧹 Lint

```bash
npm run lint
```

Runs `tsc --noEmit` to check for TypeScript errors without producing output
files.

---

<div align="center">
  <br/>
  <p>
    <img src="https://img.shields.io/badge/made_with-❤️-red?style=for-the-badge" alt="Made with love" />
    <img src="https://img.shields.io/badge/powered_by-pixel_dust-ff69b4?style=for-the-badge" alt="Powered by pixel dust" />
  </p>
  <p><em>🎮 Press E to interact with the world 🎮</em></p>
</div>
