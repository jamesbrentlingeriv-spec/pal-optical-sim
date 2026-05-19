import React from "react";
import { motion } from "motion/react";

export interface CharacterSpriteProps {
  spriteBase?: string;
  spriteUrl?: string;
  direction?: string;
  size?: "md" | "xl" | "xs" | "xxl" | "mega" | "large";
  className?: string;
  isIdle?: boolean;
  scale?: number;
}

export const CharacterSprite = ({
  spriteBase,
  spriteUrl,
  direction = "south",
  size = "xl",
  className = "",
  isIdle = true,
  scale = 1,
}: CharacterSpriteProps) => {
  const sizeClasses = {
    xs: "w-10 h-10",
    md: "w-14 h-14",
    xl: "w-28 h-28",
    large: "w-40 h-40",
    xxl: "w-64 h-64",
    mega: "w-[170px] h-[170px]",
  };

  const src =
    spriteUrl ||
    (spriteBase
      ? spriteBase.includes("/")
        ? `/${spriteBase}/rotations/${direction}.png`
        : `/characters/${spriteBase}/rotations/${direction}.png`
      : "");

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.xl} ${className}`}
    >
      {/* Shadow */}
      <motion.div
        animate={
          isIdle
            ? {
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/20 rounded-full blur-[2px] -z-10 ${
          size === "mega"
            ? "w-48 h-12"
            : size === "xxl"
              ? "w-48 h-12"
              : size === "large"
                ? "w-32 h-10"
                : size === "xl"
                  ? "w-20 h-6"
                  : size === "md"
                    ? "w-10 h-3"
                    : "w-6 h-2"
        }`}
      />

      {/* Character Image */}
      {src && (
        <motion.img
          animate={
            isIdle
              ? {
                  y: [0, -2, 0],
                  rotate: [-0.5, 0.5, -0.5],
                  scaleX: [1, 1.01, 1],
                }
              : {}
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          src={src}
          alt="character"
          className="w-full h-full object-contain pixelated relative z-10"
          style={{
            imageRendering: "pixelated",
            transform: `scale(${scale})`,
          }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};
