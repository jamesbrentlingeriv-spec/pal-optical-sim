/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GameState } from "./types";
import MainMenu from "./components/UI/MainMenu";
import CharacterSelection from "./components/UI/CharacterSelection";
import GameWorld from "./components/GameWorld";
import Lensometer from "./components/UI/Lensometer";
import Computer from "./components/UI/Computer";
import Options from "./components/UI/Options";
import Phone from "./components/UI/Phone";

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [showSplash, setShowSplash] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null,
  );
  const [audioSettings, setAudioSettings] = useState({
    volume: 0.5,
    muted: false,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const phoneRingRef = useRef<HTMLAudioElement | null>(null);
  const splashVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 5000);

      const handleVideoEnd = () => {
        setShowSplash(false);
      };

      if (splashVideoRef.current) {
        splashVideoRef.current.addEventListener("ended", handleVideoEnd);
      }

      return () => {
        clearTimeout(timer);
        if (splashVideoRef.current) {
          splashVideoRef.current.removeEventListener("ended", handleVideoEnd);
        }
      };
    }
  }, [showSplash]);

  useEffect(() => {
    const playAudio = () => {
      if (audioRef.current && !audioSettings.muted && audioRef.current.paused) {
        audioRef.current.play().catch((err) => {});
      }
    };

    window.addEventListener("click", playAudio);
    window.addEventListener("keydown", playAudio);

    if (audioRef.current) {
      audioRef.current.volume = audioSettings.volume;
      audioRef.current.loop = true;
      if (!audioSettings.muted) {
        audioRef.current.muted = false;
        audioRef.current.play().catch(() => {});
      }
    }

    return () => {
      window.removeEventListener("click", playAudio);
      window.removeEventListener("keydown", playAudio);
    };
  }, [audioSettings.muted, audioSettings.volume]);

  const handleStartGame = () => {
    setGameState(GameState.CHARACTER_SELECTION);
  };

  const handleCharacterSelect = (id: string) => {
    setSelectedCharacterId(id);
    setGameState(GameState.PLAYING);
  };

  const handleOpenOptions = () => {
    setGameState(GameState.OPTIONS);
  };

  const handleBackToMenu = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-white overflow-hidden font-sans text-xs">
      <audio ref={audioRef} src="/Cart Crystal.mp3" loop autoPlay />
      <audio ref={phoneRingRef} src="/phonering.mp3" loop />

      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-120 bg-black flex items-center justify-center"
          >
            <video
              ref={splashVideoRef}
              className="w-full h-full object-contain"
              src="/intro.mp4"
              autoPlay
              muted
            />
          </motion.div>
        )}

        {!showSplash && gameState === GameState.MENU && (
          <MainMenu
            key="menu"
            onStart={handleStartGame}
            onOptions={handleOpenOptions}
          />
        )}

        {!showSplash && gameState === GameState.CHARACTER_SELECTION && (
          <CharacterSelection
            key="selection"
            onSelect={handleCharacterSelect}
            onBack={handleBackToMenu}
          />
        )}

        {!showSplash && gameState === GameState.OPTIONS && (
          <Options
            key="options"
            settings={audioSettings}
            onUpdate={setAudioSettings}
            onBack={handleBackToMenu}
          />
        )}

        {!showSplash &&
          (gameState === GameState.PLAYING ||
            gameState === GameState.LENSOMETER ||
            gameState === GameState.COMPUTER ||
            gameState === GameState.PHONE ||
            gameState === GameState.EYE_EXAM ||
            gameState === GameState.AUTOREFRACTOR ||
            gameState === GameState.EDGER ||
            gameState === GameState.YOUTUBE ||
            gameState === GameState.COBURN_GENERATOR) && (
            <GameWorld
              key="world"
              gameState={gameState}
              setGameState={setGameState}
              audioSettings={audioSettings}
              onUpdateAudio={setAudioSettings}
              playerCharacterId={selectedCharacterId}
              bgMusicRef={audioRef}
              phoneRingRef={phoneRingRef}
            />
          )}
      </AnimatePresence>
    </div>
  );
}
