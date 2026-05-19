import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { useWindowSize } from "../../hooks/useWindowSize";
import { BRAND_ASSETS } from "../../constants";

interface FrameCleaningGameProps {
  onClose: () => void;
  onComplete: () => void;
  brand?: string | null;
}

// Pick a random frame image from the brand's assets
function getFrameImage(brand: string | null): string | null {
  if (!brand) return null;
  const assets = BRAND_ASSETS[brand];
  if (!assets || assets.length === 0) return null;
  return assets[Math.floor(Math.random() * assets.length)];
}

export const FrameCleaningGame: React.FC<FrameCleaningGameProps> = ({
  onClose,
  onComplete,
  brand,
}) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 700) : 1;

  const frameImage = getFrameImage(brand || null);
  const [dustPoints, setDustPoints] = useState<
    { x: number; y: number; cleaned: boolean }[]
  >([]);
  const [isCleaning, setIsCleaning] = useState(false);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize dust
  useEffect(() => {
    const points = [];
    for (let i = 0; i < 50; i++) {
      points.push({
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        cleaned: false,
      });
    }
    setDustPoints(points);
  }, []);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isCleaning) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x =
      "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const y =
      "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const relX = ((x - rect.left) / rect.width) * 100;
    const relY = ((y - rect.top) / rect.height) * 100;

    setDustPoints((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        if (
          !p.cleaned &&
          Math.abs(p.x - relX) < 8 &&
          Math.abs(p.y - relY) < 8
        ) {
          changed = true;
          return { ...p, cleaned: true };
        }
        return p;
      });

      if (changed) {
        const cleanedCount = next.filter((p) => p.cleaned).length;
        const newProgress = (cleanedCount / next.length) * 100;
        setProgress(newProgress);
        if (newProgress >= 95) {
          setTimeout(onComplete, 1500);
        }
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
        className="relative w-full max-w-2xl bg-white border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] p-8"
      >
        <button
          onClick={onClose}
          className="absolute -top-6 -right-6 bg-red-500 text-white p-2 border-4 border-black hover:bg-red-600 transition-colors shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-10"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
            Clean the Frames
          </h2>
          {brand && (
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">
              {brand} Display
            </p>
          )}
          <p className="text-gray-600 font-bold">
            Wipe away the dust with your microfiber cloth!
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative aspect-video bg-gray-100 border-4 border-black overflow-hidden cursor-none group rounded-lg"
          onMouseDown={() => setIsCleaning(true)}
          onMouseUp={() => setIsCleaning(false)}
          onMouseLeave={() => setIsCleaning(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsCleaning(true)}
          onTouchEnd={() => setIsCleaning(false)}
          onTouchMove={handleMouseMove}
        >
          {/* Wooden shelf background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #8B4513 0%, #6B3410 30%, #5C2E0E 60%, #4A250B 100%)",
            }}
          />

          {/* Shelf grain lines */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-0.5 opacity-30"
              style={{
                left: 0,
                right: 0,
                top: `${15 + i * 10 + Math.sin(i * 1.5) * 4}%`,
                backgroundColor: i % 2 === 0 ? "#3A1F08" : "#9B6336",
              }}
            />
          ))}

          {/* Frame stand / display holder */}
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[60%] h-3 bg-gray-800 border-t-2 border-gray-600 rounded-sm" />
          <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-1 h-16 bg-gray-700" />
          <div className="absolute bottom-[31%] left-1/2 -translate-x-1/2 w-24 h-2 bg-gray-800 border border-gray-600 rounded-sm" />

          {/* The actual glasses frame from the shelf */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom: "12%" }}
          >
            {frameImage ? (
              <div className="relative w-[55%] h-[45%] flex items-center justify-center">
                <img
                  src={frameImage}
                  alt={brand || "frame"}
                  className="max-w-full max-h-full object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.4)]"
                  style={{ imageRendering: "pixelated" }}
                />
                {/* Lens reflection/glare effect */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)",
                    borderRadius: "4px",
                  }}
                />
              </div>
            ) : (
              /* Fallback SVG glasses */
              <svg
                viewBox="0 0 200 100"
                className="w-1/2 h-auto text-gray-800 fill-none stroke-gray-700 stroke-[3px] drop-shadow-lg"
              >
                <path
                  d="M20,50 Q20,20 60,20 Q100,20 100,50 M140,20 Q180,20 180,50 Q180,80 140,80 Q100,80 100,50 Q100,80 60,80 Q20,80 20,50"
                  strokeLinecap="round"
                />
                <path d="M60,20 Q100,15 140,20" />
                <ellipse
                  cx="50"
                  cy="50"
                  rx="20"
                  ry="20"
                  fill="rgba(255,255,255,0.15)"
                />
                <ellipse
                  cx="150"
                  cy="50"
                  rx="20"
                  ry="20"
                  fill="rgba(255,255,255,0.15)"
                />
              </svg>
            )}
          </div>

          {/* "PRICE TAG" sticker on frame */}
          {frameImage && (
            <div className="absolute top-[25%] right-[22%] bg-yellow-300 border border-yellow-600 text-[8px] font-black text-black px-1.5 py-0.5 rotate-6 shadow-sm pointer-events-none">
              ${(49 + Math.floor(Math.random() * 200)).toFixed(0)}
            </div>
          )}

          {/* Dust particles overlay */}
          {dustPoints.map(
            (p, i) =>
              !p.cleaned && (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-gray-500/70 rounded-full blur-[1px] pointer-events-none"
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    boxShadow: "0 0 2px rgba(0,0,0,0.3)",
                  }}
                />
              ),
          )}

          {/* Streak marks from cleaning */}
          {isCleaning && progress > 10 && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: `radial-gradient(ellipse at ${50 + progress * 0.3}% ${40 + Math.sin(progress * 0.1) * 20}%, rgba(255,255,255,0.8) 0%, transparent 50%)`,
              }}
            />
          )}

          {/* Cleaning Progress Glow */}
          <AnimatePresence>
            {progress >= 95 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center pointer-events-none"
              >
                <div className="flex items-center gap-4 text-4xl font-black text-yellow-600 bg-white border-4 border-black px-8 py-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                  <Sparkles className="animate-pulse" />
                  PERFECTLY CLEAN!
                  <Sparkles className="animate-pulse" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Microfiber Cloth (Follows mouse) */}
          <div
            className="absolute pointer-events-none transition-transform duration-75"
            style={{
              left: "var(--mouse-x, -100px)",
              top: "var(--mouse-y, -100px)",
              transform: `translate(-50%, -50%) rotate(${isCleaning ? "15deg" : "0deg"}) scale(${isCleaning ? 1.1 : 1})`,
            }}
            ref={(el) => {
              if (el) {
                const move = (e: MouseEvent | TouchEvent) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const clientX =
                      "touches" in e
                        ? e.touches[0].clientX
                        : (e as MouseEvent).clientX;
                    const clientY =
                      "touches" in e
                        ? e.touches[0].clientY
                        : (e as MouseEvent).clientY;
                    el.style.setProperty(
                      "--mouse-x",
                      `${clientX - rect.left}px`,
                    );
                    el.style.setProperty(
                      "--mouse-y",
                      `${clientY - rect.top}px`,
                    );
                  }
                };
                window.addEventListener("mousemove", move as any);
                window.addEventListener("touchmove", move as any);
                return () => {
                  window.removeEventListener("mousemove", move as any);
                  window.removeEventListener("touchmove", move as any);
                };
              }
            }}
          >
            <div className="relative">
              <div className="w-16 h-16 bg-blue-400 border-2 border-black rounded-lg shadow-lg flex items-center justify-center opacity-90">
                <div className="w-full h-full bg-blue-300 rounded m-1 opacity-50" />
              </div>
              {isCleaning && (
                <div className="absolute -inset-2 bg-blue-300/30 rounded-xl blur-sm -z-10" />
              )}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-black bg-black text-white px-2 uppercase whitespace-nowrap">
                Cloth
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <div className="flex justify-between items-end mb-2">
            <span className="font-black text-sm uppercase">
              Cleaning Progress
            </span>
            <span className="font-black text-xl">{Math.round(progress)}%</span>
          </div>
          <div className="h-6 bg-gray-200 border-4 border-black relative">
            <motion.div
              className="h-full bg-green-500"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
