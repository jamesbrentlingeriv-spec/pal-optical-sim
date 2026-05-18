import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';

interface EdgerGameProps {
  onClose: () => void;
}

const CANVAS_W = 400;
const CANVAS_H = 320;

// 8-bit pixel art color palette
const COLORS = {
  bg: '#1a1a2e',
  machineBody: '#7c8a8a',
  machineBodyDark: '#4a5a5a',
  machineBodyLight: '#9aaaaa',
  machineHighlight: '#bccaca',
  screenBg: '#0a1a0a',
  screenText: '#33ff33',
  screenTextDim: '#228822',
  lensBlank: '#c8e8ff',
  lensBlankEdge: '#88b8dd',
  lensCut: '#e8f4ff',
  cutLine: '#ff4444',
  cutLineBright: '#ff6644',
  frameTemplate: '#33aaff',
  frameTemplateBright: '#66ccff',
  spark: '#ffcc00',
  sparkBright: '#ffffff',
  blade: '#888888',
  bladeEdge: '#cccccc',
  clamp: '#555555',
  clampHighlight: '#777777',
  tray: '#3a3a4a',
  trayEdge: '#5a5a6a',
  buttonGreen: '#44aa44',
  buttonRed: '#cc4444',
  buttonYellow: '#ccaa44',
  indicatorOff: '#333333',
  indicatorOn: '#ff3333',
};

// Lens shape definitions (pixel-art style polygon points for canvas)
const LENS_SHAPES = [
  { name: 'ROUND', label: 'ROUND', getPath: (cx: number, cy: number, w: number, h: number) => {
    const r = Math.min(w, h) / 2;
    return { type: 'ellipse' as const, cx, cy, rx: r, ry: r };
  }},
  { name: 'OVAL', label: 'OVAL', getPath: (cx: number, cy: number, w: number, h: number) => {
    return { type: 'ellipse' as const, cx, cy, rx: w / 2, ry: h / 2 };
  }},
  { name: 'RECT', label: 'RECT', getPath: (cx: number, cy: number, w: number, h: number) => {
    return { type: 'rect' as const, cx, cy, w, h, r: 8 };
  }},
  { name: 'AVIATOR', label: 'AVIATOR', getPath: (cx: number, cy: number, w: number, h: number) => {
    return { type: 'aviator' as const, cx, cy, w, h };
  }},
  { name: 'WAYFARER', label: 'WAYFARER', getPath: (cx: number, cy: number, w: number, h: number) => {
    return { type: 'wayfarer' as const, cx, cy, w, h };
  }},
  { name: 'CAT-EYE', label: 'CAT-EYE', getPath: (cx: number, cy: number, w: number, h: number) => {
    return { type: 'cateye' as const, cx, cy, w, h };
  }},
];

type LensPath = ReturnType<typeof LENS_SHAPES[0]['getPath']>;

// Get points along a lens path for the blade to trace
function getPathPoints(path: LensPath, numPoints: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const { cx, cy } = path;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
    let px: number, py: number;

    switch (path.type) {
      case 'ellipse':
        px = cx + path.rx * Math.cos(angle);
        py = cy + path.ry * Math.sin(angle);
        break;
      case 'rect': {
        const hw = path.w / 2, hh = path.h / 2;
        const peri = 2 * path.w + 2 * path.h;
        let d = (i / numPoints) * peri;
        if (d < path.w) { px = cx - hw + d; py = cy - hh; }
        else if (d < path.w + path.h) { px = cx + hw; py = cy - hh + (d - path.w); }
        else if (d < 2 * path.w + path.h) { px = cx + hw - (d - path.w - path.h); py = cy + hh; }
        else { px = cx - hw; py = cy + hh - (d - 2 * path.w - path.h); }
        break;
      }
      case 'aviator': {
        const t = i / numPoints;
        if (t < 0.5) {
          const lt = t * 2;
          px = cx + (path.w / 2) * Math.sin(lt * Math.PI);
          py = cy - (path.h / 2) * Math.pow(1 - lt * 2, 2);
        } else {
          const lt = (t - 0.5) * 2;
          px = cx - (path.w / 2) * Math.sin(lt * Math.PI);
          py = cy + (path.h / 2) * Math.pow(1 - lt * 2, 2);
        }
        break;
      }
      case 'wayfarer': {
        const t = i / numPoints;
        const hw = path.w / 2, hh = path.h / 2;
        const topInset = 10;
        const topFlatStart = 0.15, topFlatEnd = 0.35;
        const peri = (hw * 2 - topInset * 2) + (path.h * 2) + (topInset * 2 * Math.SQRT2);
        if (t < 0.25) { px = cx - hw + t * 4 * (hw - topInset); py = cy - hh; }
        else if (t < 0.5) { px = cx + hw; py = cy - hh + (t - 0.25) * 4 * path.h; }
        else if (t < 0.75) { px = cx + hw - (t - 0.5) * 4 * path.w; py = cy + hh; }
        else { px = cx - hw; py = cy + hh - (t - 0.75) * 4 * path.h; }
        break;
      }
      case 'cateye': {
        const t = i / numPoints;
        const hw = path.w / 2, hh = path.h / 2;
        if (t < 0.25) {
          const lt = t * 4;
          px = cx - hw + lt * hw;
          py = cy - hh * 4 * (lt - 0.5) * (lt - 0.5) + hh;
        } else if (t < 0.5) {
          const lt = (t - 0.25) * 4;
          px = cx + lt * hw;
          py = cy + hh * 4 * (lt - 0.5) * (lt - 0.5) - hh;
        } else if (t < 0.75) {
          const lt = (t - 0.5) * 4;
          px = cx + hw - lt * hw;
          py = cy + hh * 4 * (lt - 0.5) * (lt - 0.5) - hh;
        } else {
          const lt = (t - 0.75) * 4;
          px = cx - lt * hw;
          py = cy - hh * 4 * (lt - 0.5) * (lt - 0.5) + hh;
        }
        break;
      }
      default: {
        // fallback ellipse
        const ePath = path as { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number };
        px = ePath.cx + ePath.rx * Math.cos(angle);
        py = ePath.cy + ePath.ry * Math.sin(angle);
      }
    }
    points.push({ x: px, y: py });
  }
  return points;
}

export const EdgerGame: React.FC<EdgerGameProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<'IDLE' | 'LOADING' | 'CUTTING' | 'DONE'>('IDLE');
  const [selectedShape, setSelectedShape] = useState(0);
  const [cutProgress, setCutProgress] = useState(0);
  const [lensSize, setLensSize] = useState(48);
  const [lensLoaded, setLensLoaded] = useState(false);
  const [sparks, setSparks] = useState<{ x: number; y: number; life: number; vx: number; vy: number }[]>([]);
  const [bladeAngle, setBladeAngle] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const cutStartTimeRef = useRef<number>(0);

  const selectedLensPath = LENS_SHAPES[selectedShape].getPath(200, 155, lensSize, lensSize * (selectedShape === 1 ? 0.65 : [0, 1].includes(selectedShape) ? 1 : 0.78));
  const pathPoints = getPathPoints(selectedLensPath, 200);

  // Draw the entire 8-bit edger machine scene
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // === EDGER MACHINE BODY (8-bit pixel art style) ===
    // Main base
    ctx.fillStyle = COLORS.machineBody;
    ctx.fillRect(20, 200, 360, 100);
    // Pixel-art border highlights
    ctx.fillStyle = COLORS.machineBodyLight;
    ctx.fillRect(20, 200, 360, 4);
    ctx.fillRect(20, 200, 4, 100);
    ctx.fillStyle = COLORS.machineBodyDark;
    ctx.fillRect(20, 296, 360, 4);
    ctx.fillRect(376, 200, 4, 100);

    // Upper housing (where the cutting happens)
    ctx.fillStyle = COLORS.machineBody;
    ctx.fillRect(40, 40, 180, 170);
    ctx.fillStyle = COLORS.machineBodyLight;
    ctx.fillRect(40, 40, 180, 4);
    ctx.fillRect(40, 40, 4, 170);
    ctx.fillStyle = COLORS.machineBodyDark;
    ctx.fillRect(40, 206, 180, 4);
    ctx.fillRect(216, 40, 4, 170);

    // Cutting chamber window
    ctx.fillStyle = '#222233';
    ctx.fillRect(56, 72, 148, 120);
    ctx.fillStyle = '#111122';
    ctx.fillRect(56, 72, 148, 2);
    ctx.fillRect(56, 72, 2, 120);

    // Grid lines in chamber
    ctx.strokeStyle = '#333344';
    ctx.lineWidth = 0.5;
    for (let gx = 56; gx <= 204; gx += 16) {
      ctx.beginPath();
      ctx.moveTo(gx, 72);
      ctx.lineTo(gx, 192);
      ctx.stroke();
    }
    for (let gy = 72; gy <= 192; gy += 16) {
      ctx.beginPath();
      ctx.moveTo(56, gy);
      ctx.lineTo(204, gy);
      ctx.stroke();
    }

    // === LENS BLANK (raw lens before cutting) ===
    if (lensLoaded || phase === 'CUTTING' || phase === 'DONE') {
      const lcx = 130, lcy = 132;
      const blankR = lensSize / 2 + 4;

      // Always draw the target-shaped lens underneath (the final result)
      // This is the round blank clipped to the frame shape
      ctx.save();
      ctx.beginPath();
      drawLensPathFillable(ctx, selectedLensPath);
      ctx.clip();
      ctx.fillStyle = COLORS.lensBlank;
      ctx.beginPath();
      ctx.arc(lcx, lcy, blankR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw target shape outline (dashed template)
      if (phase === 'CUTTING' || phase === 'DONE') {
        ctx.save();
        ctx.strokeStyle = phase === 'DONE' ? '#44ff44' : COLORS.frameTemplate;
        ctx.lineWidth = 2;
        ctx.setLineDash(phase === 'DONE' ? [] : [4, 4]);
        drawLensPath(ctx, selectedLensPath);
        ctx.setLineDash([]);
        ctx.restore();
      }

      // === EXCESS MATERIAL (round blank outside target shape) ===
      // During IDLE and LOADING: show full round blank
      // During CUTTING: progressively erase excess material
      // During DONE: excess is fully removed
      if (phase === 'IDLE' || phase === 'LOADING') {
        // Full round blank visible
        ctx.fillStyle = COLORS.lensBlank;
        ctx.beginPath();
        ctx.arc(lcx, lcy, blankR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.lensBlankEdge;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Lens edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(lcx - blankR * 0.3, lcy - blankR * 0.3, blankR * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (phase === 'CUTTING') {
        // Draw the "excess ring" (round blank minus target shape area)
        // First draw full round blank
        ctx.fillStyle = COLORS.lensBlank;
        ctx.beginPath();
        ctx.arc(lcx, lcy, blankR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.lensBlankEdge;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(lcx - blankR * 0.3, lcy - blankR * 0.3, blankR * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Now erase the cut-away portion using destination-out
        // Build a "cut wedge" from start angle to current cut angle
        const cutFraction = cutProgress / 100;
        const totalPathPoints = pathPoints.length;
        const cutEndIdx = Math.floor(cutFraction * totalPathPoints);

        if (cutEndIdx > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';

          // Draw a shape that covers everything from the target shape outward
          // for the cut portion of the perimeter
          ctx.beginPath();
          // Start at first cut point on the target path
          const firstPt = pathPoints[0];
          ctx.moveTo(firstPt.x, firstPt.y);

          // Follow the target path for the cut portion
          for (let i = 1; i <= cutEndIdx; i++) {
            const pt = pathPoints[i % totalPathPoints];
            ctx.lineTo(pt.x, pt.y);
          }

          // Radiate outward to the round blank edge from the last cut point
          const lastPt = pathPoints[cutEndIdx % totalPathPoints];
          const angleToCenter = Math.atan2(lastPt.y - lcy, lastPt.x - lcx);
          const outerX = lcx + Math.cos(angleToCenter) * (blankR + 2);
          const outerY = lcy + Math.sin(angleToCenter) * (blankR + 2);
          ctx.lineTo(outerX, outerY);

          // Follow the round blank perimeter counter-clockwise back to the first point
          const firstAngleToCenter = Math.atan2(firstPt.y - lcy, firstPt.x - lcx);
          // Arc from outer edge near last point to outer edge near first point (going the long way around)
          ctx.arc(lcx, lcy, blankR + 2, angleToCenter, firstAngleToCenter, true);

          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }

        // Draw the glowing red cut line on top
        const cutPointCount = Math.floor((cutProgress / 100) * pathPoints.length);
        ctx.strokeStyle = COLORS.cutLine;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = COLORS.cutLine;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < Math.min(cutPointCount, pathPoints.length); i++) {
          const pt = pathPoints[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Blade head at current position
        if (cutPointCount > 0 && cutPointCount < pathPoints.length) {
          const bp = pathPoints[cutPointCount];
          // Glowing blade
          ctx.fillStyle = '#ff6644';
          ctx.fillRect(bp.x - 5, bp.y - 5, 10, 10);
          ctx.fillStyle = COLORS.bladeEdge;
          ctx.fillRect(bp.x - 4, bp.y - 4, 8, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bp.x - 1, bp.y - 1, 2, 2);
          // Blade glow
          ctx.fillStyle = 'rgba(255,100,50,0.6)';
          ctx.fillRect(bp.x - 6, bp.y - 6, 12, 12);
        }

        // Final edge highlight on target-shaped lens
        ctx.save();
        ctx.beginPath();
        drawLensPathFillable(ctx, selectedLensPath);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(lcx - blankR * 0.3, lcy - blankR * 0.3, blankR * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // DONE phase: only target-shaped lens, add glow
      if (phase === 'DONE') {
        // Redraw target-shaped lens with glow
        ctx.save();
        ctx.shadowColor = '#44ff44';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        drawLensPathFillable(ctx, selectedLensPath);
        ctx.clip();
        ctx.fillStyle = COLORS.lensBlank;
        ctx.beginPath();
        ctx.arc(lcx, lcy, blankR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Bright edge highlight
        ctx.save();
        ctx.beginPath();
        drawLensPathFillable(ctx, selectedLensPath);
        ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(lcx - blankR * 0.3, lcy - blankR * 0.3, blankR * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Green completed cut outline
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#44ff44';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let i = 0; i < pathPoints.length; i++) {
          const pt = pathPoints[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    // === CLAMPS (holding the lens) ===
    if (lensLoaded || phase !== 'IDLE') {
      // Top clamp
      ctx.fillStyle = COLORS.clamp;
      ctx.fillRect(122, 66, 16, 12);
      ctx.fillStyle = COLORS.clampHighlight;
      ctx.fillRect(122, 66, 16, 2);
      // Bottom clamp
      ctx.fillStyle = COLORS.clamp;
      ctx.fillRect(122, 190, 16, 12);
      ctx.fillStyle = COLORS.clampHighlight;
      ctx.fillRect(122, 190, 16, 2);
    }

    // === SPARKS ===
    for (const spark of sparks) {
      ctx.fillStyle = spark.life > 0.6 ? COLORS.sparkBright : COLORS.spark;
      const size = Math.max(1, Math.floor(spark.life * 3));
      ctx.fillRect(Math.floor(spark.x), Math.floor(spark.y), size, size);
    }

    // === RIGHT SIDE: CRT DISPLAY ===
    // CRT monitor housing
    ctx.fillStyle = COLORS.machineBodyDark;
    ctx.fillRect(240, 40, 140, 120);
    ctx.fillStyle = COLORS.machineBody;
    ctx.fillRect(244, 44, 132, 112);
    // Screen
    ctx.fillStyle = COLORS.screenBg;
    ctx.fillRect(252, 52, 116, 88);

    // Scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let sy = 52; sy < 140; sy += 3) {
      ctx.fillRect(252, sy, 116, 1);
    }

    // CRT text
    ctx.fillStyle = COLORS.screenText;
    ctx.font = '6px monospace';
    ctx.fillText('NATL OPTRONICS', 256, 64);
    ctx.fillText('7 EX EDGER v2.1', 256, 74);
    ctx.fillText(`SHAPE:${LENS_SHAPES[selectedShape].label}`, 256, 86);
    ctx.fillText(`SIZE:${lensSize}mm`, 256, 96);
    ctx.fillText(`CYCLE:${cutProgress}%`, 256, 106);
    ctx.fillText(phase === 'DONE' ? 'COMPLETE' : phase === 'CUTTING' ? 'CUTTING..' : phase === 'LOADING' ? 'LOADING..' : 'STANDBY', 256, 118);

    // Blinking cursor
    if (Math.floor(Date.now() / 500) % 2 === 0) {
      ctx.fillStyle = COLORS.screenText;
      ctx.fillRect(256 + ctx.measureText(phase === 'DONE' ? 'COMPLETE' : phase === 'CUTTING' ? 'CUTTING..' : phase === 'LOADING' ? 'LOADING..' : 'STANDBY').width + 2, 116, 4, 6);
    }

    // === CONTROL PANEL (below CRT) ===
    ctx.fillStyle = COLORS.machineBodyDark;
    ctx.fillRect(240, 168, 140, 70);
    ctx.fillStyle = COLORS.machineBody;
    ctx.fillRect(244, 172, 132, 62);

    // Indicator lights
    const indicatorY = 180;
    // Power light
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(252, indicatorY, 8, 8);
    ctx.fillText('PWR', 264, indicatorY + 8);
    // Active light
    ctx.fillStyle = phase === 'CUTTING' ? COLORS.indicatorOn : COLORS.indicatorOff;
    ctx.fillRect(252, indicatorY + 14, 8, 8);
    ctx.fillText('CUT', 264, indicatorY + 22);
    // Done light
    ctx.fillStyle = phase === 'DONE' ? '#44ff44' : COLORS.indicatorOff;
    ctx.fillRect(252, indicatorY + 28, 8, 8);
    ctx.fillText('OK', 264, indicatorY + 36);

    // === LENS TRAY (bottom, where lens blanks sit) ===
    ctx.fillStyle = COLORS.tray;
    ctx.fillRect(60, 248, 140, 40);
    ctx.fillStyle = COLORS.trayEdge;
    ctx.fillRect(60, 248, 140, 3);
    ctx.fillRect(60, 248, 3, 40);

    // Lens blanks sitting in tray
    if (!lensLoaded && phase === 'IDLE') {
      for (let i = 0; i < 3; i++) {
        const bx = 80 + i * 40;
        ctx.fillStyle = COLORS.lensBlank;
        ctx.beginPath();
        ctx.arc(bx, 268, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.lensBlankEdge;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // === LABELS ===
    ctx.fillStyle = COLORS.machineHighlight;
    ctx.font = '7px monospace';
    ctx.fillText('NATIONAL OPTRONICS 7 EX', 100, 265);
    ctx.font = '5px monospace';
    ctx.fillText('LENS EDGER - PRECISION CUTTING SYSTEM', 100, 275);

    // === LOAD TRAY BUTTON ===
    if (phase === 'IDLE' && !lensLoaded) {
      ctx.fillStyle = COLORS.buttonGreen;
      ctx.fillRect(220, 250, 100, 30);
      ctx.fillStyle = '#66dd66';
      ctx.fillRect(220, 250, 100, 3);
      ctx.fillStyle = '#000';
      ctx.font = '8px monospace';
      ctx.fillText('LOAD LENS', 235, 270);
    }

  }, [selectedShape, lensSize, lensLoaded, phase, cutProgress, sparks, selectedLensPath, pathPoints]);

  // Helper to fill/stroke lens path on canvas (creates the path only, doesn't stroke)
  function drawLensPathFillable(ctx: CanvasRenderingContext2D, path: LensPath) {
    const { cx, cy } = path;
    switch (path.type) {
      case 'ellipse':
        ctx.ellipse(cx, cy, path.rx, path.ry, 0, 0, Math.PI * 2);
        break;
      case 'rect':
        ctx.roundRect(cx - path.w / 2, cy - path.h / 2, path.w, path.h, path.r);
        break;
      case 'aviator':
        ctx.moveTo(cx, cy - path.h / 2);
        ctx.bezierCurveTo(cx + path.w / 2, cy - path.h / 2, cx + path.w / 2, cy + path.h / 2, cx, cy + path.h / 2);
        ctx.bezierCurveTo(cx - path.w / 2, cy + path.h / 2, cx - path.w / 2, cy - path.h / 2, cx, cy - path.h / 2);
        break;
      case 'wayfarer':
        ctx.moveTo(cx - path.w / 2, cy - path.h / 2 + 10);
        ctx.lineTo(cx - path.w / 3, cy - path.h / 2);
        ctx.lineTo(cx + path.w / 3, cy - path.h / 2);
        ctx.lineTo(cx + path.w / 2, cy - path.h / 2 + 10);
        ctx.lineTo(cx + path.w / 2, cy + path.h / 2);
        ctx.lineTo(cx - path.w / 2, cy + path.h / 2);
        ctx.closePath();
        break;
      case 'cateye':
        ctx.moveTo(cx - path.w / 2, cy);
        ctx.quadraticCurveTo(cx - path.w / 4, cy - path.h / 2, cx, cy);
        ctx.quadraticCurveTo(cx + path.w / 4, cy - path.h / 2, cx + path.w / 2, cy);
        ctx.quadraticCurveTo(cx + path.w / 4, cy + path.h / 2, cx, cy);
        ctx.quadraticCurveTo(cx - path.w / 4, cy + path.h / 2, cx - path.w / 2, cy);
        break;
    }
  }

  // Helper to draw lens path on canvas (with stroke)
  function drawLensPath(ctx: CanvasRenderingContext2D, path: LensPath) {
    ctx.beginPath();
    drawLensPathFillable(ctx, path);
    ctx.stroke();
  }

  // Animation loop
  useEffect(() => {
    const animate = () => {
      draw();
      // Update sparks
      if (sparks.length > 0) {
        setSparks(prev => prev
          .map(s => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, life: s.life - 0.03, vy: s.vy + 0.1 }))
          .filter(s => s.life > 0)
        );
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw, sparks.length]);

  // Generate cutting sparks
  useEffect(() => {
    if (phase !== 'CUTTING') return;
    const interval = setInterval(() => {
      const cutIdx = Math.floor((cutProgress / 100) * (pathPoints.length - 1));
      if (cutIdx >= 0 && cutIdx < pathPoints.length) {
        const pt = pathPoints[cutIdx];
        const newSparks = Array.from({ length: 3 }, () => ({
          x: pt.x + (Math.random() - 0.5) * 8,
          y: pt.y + (Math.random() - 0.5) * 8,
          life: 0.7 + Math.random() * 0.3,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3 - 2,
        }));
        setSparks(prev => [...prev.slice(-40), ...newSparks]);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [phase, cutProgress, pathPoints]);

  // Cutting process
  const startCutting = () => {
    setPhase('CUTTING');
    setCutProgress(0);
    cutStartTimeRef.current = Date.now();

    const duration = 4000; // 4 second cut
    const interval = setInterval(() => {
      const elapsed = Date.now() - cutStartTimeRef.current;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setCutProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setPhase('DONE');
        setSparks([]);
      }
    }, 50);
  };

  const loadLens = () => {
    setPhase('LOADING');
    setTimeout(() => {
      setLensLoaded(true);
      setPhase('IDLE');
    }, 800);
  };

  const resetMachine = () => {
    setPhase('IDLE');
    setCutProgress(0);
    setLensLoaded(false);
    setSparks([]);
  };

  return (
    <div className="fixed inset-0 z-300 bg-black/95 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative"
      >
        {/* Main edger machine container */}
        <div
          className="relative border-8 border-[#3a4a4a] rounded-lg shadow-[8px_8px_0_0_rgba(0,0,0,0.8)]"
          style={{
            background: `linear-gradient(180deg, #2a3a3a 0%, #1a2a2a 100%)`,
            padding: '16px',
          }}
        >
          {/* Machine branding */}
          <div className="text-center mb-2">
            <div className="text-[11px] font-bold text-[#9aaaaa] tracking-[4px] uppercase">
              National Optronics
            </div>
            <div className="text-[9px] text-[#6a7a7a] tracking-widest -mt-1">
              7 EX PRECISION LENS EDGER
            </div>
          </div>

          {/* Main canvas showing 8-bit edger */}
          <div className="relative border-4 border-[#2a3a3a] rounded overflow-hidden mb-3"
            style={{ width: CANVAS_W, height: CANVAS_H, backgroundColor: COLORS.bg }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className="w-full h-full"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Glass reflection overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.02) 100%)',
              }}
            />
          </div>

          {/* Control buttons */}
          <div className="flex gap-3 items-end">
            {/* Shape selector */}
            <div className="flex-1">
              <div className="text-[7px] text-[#6a7a7a] font-bold uppercase tracking-wider mb-1">Lens Shape</div>
              <div className="grid grid-cols-3 gap-1">
                {LENS_SHAPES.map((shape, i) => (
                  <button
                    key={i}
                    onClick={() => { if (phase === 'IDLE') { setSelectedShape(i); } }}
                    className={`h-7 text-[6px] font-bold tracking-tight border-2 rounded-sm transition-all ${
                      phase === 'IDLE' && selectedShape === i
                        ? 'bg-[#5a8a5a] border-[#7aaa7a] text-white shadow-[0_0_4px_rgba(100,255,100,0.3)]'
                        : 'bg-[#3a4a3a] border-[#2a3a2a] text-[#8a9a8a] hover:bg-[#4a5a4a]'
                    }`}
                    disabled={phase === 'CUTTING' || phase === 'LOADING'}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size controls */}
            <div className="flex flex-col gap-1">
              <div className="text-[7px] text-[#6a7a7a] font-bold uppercase tracking-wider text-center">Size</div>
              <button
                onClick={() => { if (phase === 'IDLE') { setLensSize(prev => Math.min(60, prev + 4)); } }}
                className="h-7 px-2 text-[7px] font-bold bg-[#3a4a3a] border-2 border-[#2a3a2a] text-[#8a9a8a] hover:bg-[#4a5a4a] rounded-sm"
                disabled={phase !== 'IDLE'}
              >
                +4mm
              </button>
              <button
                onClick={() => { if (phase === 'IDLE') { setLensSize(prev => Math.max(32, prev - 4)); } }}
                className="h-7 px-2 text-[7px] font-bold bg-[#3a4a3a] border-2 border-[#2a3a2a] text-[#8a9a8a] hover:bg-[#4a5a4a] rounded-sm"
                disabled={phase !== 'IDLE'}
              >
                -4mm
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-1 min-w-20">
              <div className="text-[7px] text-[#6a7a7a] font-bold uppercase tracking-wider text-center">Action</div>
              {!lensLoaded && phase === 'IDLE' ? (
                <button
                  onClick={loadLens}
                  className="h-10 bg-[#338833] hover:bg-[#44aa44] border-2 border-[#226622] text-white font-bold text-[9px] tracking-widest rounded-sm shadow-[0_0_6px_rgba(50,200,50,0.2)] uppercase"
                >
                  LOAD LENS
                </button>
              ) : phase === 'IDLE' && lensLoaded ? (
                <button
                  onClick={startCutting}
                  className="h-10 bg-[#cc3333] hover:bg-[#ff4444] border-2 border-[#881111] text-white font-bold text-[9px] tracking-widest rounded-sm shadow-[0_0_8px_rgba(255,0,0,0.3)] uppercase"
                >
                  START CUT
                </button>
              ) : phase === 'LOADING' ? (
                <div className="h-10 bg-[#2a3a2a] border-2 border-[#1a2a1a] flex items-center justify-center rounded-sm">
                  <span className="text-[#88cc88] text-[8px] font-bold animate-pulse">LOADING...</span>
                </div>
              ) : phase === 'CUTTING' ? (
                <div className="h-10 bg-[#2a2a2a] border-2 border-[#1a1a1a] flex items-center justify-center rounded-sm">
                  <span className="text-[#ff4444] text-[8px] font-bold animate-pulse">CUTTING...</span>
                </div>
              ) : phase === 'DONE' ? (
                <button
                  onClick={resetMachine}
                  className="h-10 bg-[#338833] hover:bg-[#44aa44] border-2 border-[#226622] text-white font-bold text-[9px] tracking-widest rounded-sm shadow-[0_0_6px_rgba(50,200,50,0.3)] uppercase"
                >
                  NEXT LENS
                </button>
              ) : null}
              <button
                onClick={onClose}
                className="h-7 bg-[#333] hover:bg-[#444] border-2 border-[#222] text-[#777] font-bold text-[7px] rounded-sm uppercase"
              >
                EXIT
              </button>
            </div>
          </div>

          {/* Cutting progress bar */}
          {phase === 'CUTTING' && (
            <div className="mt-2 h-3 border-2 border-[#2a3a2a] rounded-sm overflow-hidden bg-[#0a0a0a]">
              <motion.div
                className="h-full"
                style={{
                  width: `${cutProgress}%`,
                  background: 'linear-gradient(90deg, #ff4444, #ff6644, #ff8844)',
                  boxShadow: '0 0 8px rgba(255,68,68,0.5)',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}

          {phase === 'DONE' && (
            <div className="mt-2 h-3 border-2 border-[#2a3a2a] rounded-sm overflow-hidden bg-[#0a0a0a]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                className="h-full"
                style={{
                  background: 'linear-gradient(90deg, #33ff33, #66ff66)',
                  boxShadow: '0 0 8px rgba(50,255,50,0.5)',
                }}
              />
            </div>
          )}

          {/* Status text */}
          <div className="mt-2 text-center">
            <span className="text-[8px] font-mono tracking-wider"
              style={{ color: phase === 'DONE' ? '#44ff44' : phase === 'CUTTING' ? '#ff6644' : '#6a7a7a' }}>
              {phase === 'IDLE' && !lensLoaded && 'READY - LOAD LENS BLANK'}
              {phase === 'LOADING' && 'LOADING LENS INTO CHAMBER...'}
              {phase === 'IDLE' && lensLoaded && `LENS LOADED - ${LENS_SHAPES[selectedShape].label} ${lensSize}mm - READY TO CUT`}
              {phase === 'CUTTING' && `CUTTING IN PROGRESS - ${cutProgress}%`}
              {phase === 'DONE' && 'CUTTING COMPLETE - LENS READY FOR FITTING'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};