import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Settings } from 'lucide-react';
import { CharacterSprite } from '../CharacterSprite';
import { useWindowSize } from '../../hooks/useWindowSize';

interface MainMenuProps {
  onStart: () => void;
  onOptions: () => void;
  key?: string;
}

export default function MainMenu({ onStart, onOptions }: MainMenuProps) {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const scale = isMobile ? Math.min(1, width / 400) : 1.1;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full relative overflow-hidden"
    >
      {/* PALOPTICAL Background */}
      <div className="absolute inset-0 z-0">
        <img src="/PALOPTICAL.png" alt="PAL Optical" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
      </div>
      <div 
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        className="relative"
      >
        {/* Scanline Effect Overlay */}
        <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,2px_100%]"></div>
        
        {/* 8-bit Background Pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffffff 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center justify-center z-20 mb-12"
      >
        <motion.div 
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-32 h-32 flex items-center justify-center overflow-hidden mb-6"
        >
          <img src="/IAMJAMES.png" alt="Logo" className="w-full h-full object-contain pixelated" />
        </motion.div>

        <h1 className="text-7xl font-black tracking-tight text-yellow-300 drop-shadow-[8px_8px_0_rgba(0,0,0,1)] italic mb-8 text-center">
          PAL OPTICAL <br/><span className="text-yellow-300">SIMULATOR</span>
        </h1>

        <p className="text-yellow-400 text-sm font-black uppercase tracking-[12px] animate-pulse mb-8">
          PRESS START TO BEGIN
        </p>

        <div className="flex flex-col gap-6 w-80 z-20">
          <motion.button
            whileHover={{ scale: 1.05, x: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="group relative flex items-center justify-center gap-4 px-12 py-6 bg-yellow-400 text-black font-black transition-all shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-none"
          >
            <Play className="w-6 h-6 fill-black" />
            <span className="text-xl italic uppercase">Start</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, x: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOptions}
            className="group relative flex items-center justify-center gap-4 px-12 py-6 bg-black border-4 border-yellow-400 text-yellow-400 font-black transition-all shadow-[8px_8px_0_0_rgba(255,197,3,0.2)] hover:shadow-none"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xl italic uppercase">Options</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Walking Characters Footer - Continuous Flow */}
      <div className="absolute bottom-6 left-0 w-full h-48 overflow-hidden pointer-events-none group">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="flex w-fit items-end h-full whitespace-nowrap"
        >
          {/* First set */}
          <div className="flex gap-20 items-end px-10">
            <CharacterSprite spriteBase="james" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="tracy" direction="south" size="large" isIdle={false} className="mb-2" />
            <CharacterSprite spriteBase="april" direction="south" size="large" isIdle={false} className="mb-4" />
            <CharacterSprite spriteBase="Robby" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="linda" direction="south" size="large" isIdle={false} className="mb-6" />
            <CharacterSprite spriteBase="carribyan" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="characters/Naerobi/states/a_hispanic_male_with_long_curly_hair_wearing_black" direction="south" size="large" isIdle={false} className="mb-2" scale={1.15} />
            <CharacterSprite spriteBase="sabrina" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="characters/lisa/states/older_lady_with_long_blonde" direction="south" size="mega" isIdle={false} scale={1.88} />
            <CharacterSprite spriteBase="drrobbins" direction="south" size="large" isIdle={false} className="mb-8" />
            <CharacterSprite spriteBase="sara" direction="south" size="large" isIdle={false} className="mb-2" />
          </div>
          {/* Second set for seamless loop */}
          <div className="flex gap-20 items-end px-10">
            <CharacterSprite spriteBase="james" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="tracy" direction="south" size="large" isIdle={false} className="mb-2" />
            <CharacterSprite spriteBase="april" direction="south" size="large" isIdle={false} className="mb-4" />
            <CharacterSprite spriteBase="Robby" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="linda" direction="south" size="large" isIdle={false} className="mb-6" />
            <CharacterSprite spriteBase="carribyan" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="characters/Naerobi/states/a_hispanic_male_with_long_curly_hair_wearing_black" direction="south" size="large" isIdle={false} className="mb-2" scale={1.15} />
            <CharacterSprite spriteBase="sabrina" direction="south" size="large" isIdle={false} />
            <CharacterSprite spriteBase="characters/lisa/states/older_lady_with_long_blonde" direction="south" size="mega" isIdle={false} scale={1.88} />
            <CharacterSprite spriteBase="drrobbins" direction="south" size="large" isIdle={false} className="mb-8" />
            <CharacterSprite spriteBase="sara" direction="south" size="large" isIdle={false} className="mb-2" />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 text-yellow-400/30 text-[6px] font-black uppercase tracking-[6px]">
        (C) 2024 PAL OPTICAL LTD. ALL RIGHTS RESERVED
      </div>
    </div>
    </motion.div>
  );
}