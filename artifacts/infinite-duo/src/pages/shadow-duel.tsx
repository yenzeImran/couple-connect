import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetShadowDuelLeaderboard,
  useSubmitShadowDuelScore,
  getGetShadowDuelLeaderboardQueryKey,
  getGetShadowDuelScoresQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerStore } from "@/lib/store";

type GameState = "idle" | "playing" | "gameover";
type ShapeColor = "red" | "blue" | "green" | "yellow";

interface FallingShape {
  id: number;
  color: ShapeColor;
  x: number;
  createdAt: number;
}

const COLORS: ShapeColor[] = ["red", "blue", "green", "yellow"];
const COLOR_STYLES: Record<ShapeColor, { bg: string; glow: string; label: string }> = {
  red: { bg: "hsl(350 80% 55%)", glow: "hsl(350 80% 55% / 0.6)", label: "Red" },
  blue: { bg: "hsl(190 90% 50%)", glow: "hsl(190 90% 50% / 0.6)", label: "Blue" },
  green: { bg: "hsl(140 70% 45%)", glow: "hsl(140 70% 45% / 0.6)", label: "Green" },
  yellow: { bg: "hsl(45 100% 55%)", glow: "hsl(45 100% 55% / 0.6)", label: "Yellow" },
};

const FALL_DURATION = 3000;
const SPAWN_INTERVAL = 1400;
const LIVES = 3;

export default function ShadowDuel() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { player1Id } = usePlayerStore();
  const submitScore = useSubmitShadowDuelScore();
  const { data: topScores = [] } = useGetShadowDuelLeaderboard();

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [level, setLevel] = useState(1);
  const [shapes, setShapes] = useState<FallingShape[]>([]);
  const [targetColor, setTargetColor] = useState<ShapeColor>("red");
  const [showCombo, setShowCombo] = useState(false);
  const [hitFeedback, setHitFeedback] = useState<"hit" | "miss" | null>(null);

  const shapeIdRef = useRef(0);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameStateRef = useRef<GameState>("idle");
  const livesRef = useRef(LIVES);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const levelRef = useRef(1);

  gameStateRef.current = gameState;
  livesRef.current = lives;
  scoreRef.current = score;
  comboRef.current = combo;
  levelRef.current = level;

  const pickTarget = useCallback(() => {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    setTargetColor(c as ShapeColor);
    return c as ShapeColor;
  }, []);

  const spawnShape = useCallback(() => {
    if (gameStateRef.current !== "playing") return;
    const id = ++shapeIdRef.current;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)] as ShapeColor;
    const x = 10 + Math.random() * 80;
    setShapes(prev => [...prev, { id, color, x, createdAt: Date.now() }]);
  }, []);

  const startGame = () => {
    if (navigator.vibrate) navigator.vibrate(80);
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(LIVES);
    setLevel(1);
    setShapes([]);
    shapeIdRef.current = 0;
    pickTarget();
  };

  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = Math.max(500, SPAWN_INTERVAL - (level - 1) * 150);
    spawnRef.current = setInterval(spawnShape, interval);
    cleanupRef.current = setInterval(() => {
      const now = Date.now();
      setShapes(prev => {
        const expired = prev.filter(s => now - s.createdAt > FALL_DURATION);
        if (expired.length > 0 && gameStateRef.current === "playing") {
          const newLives = Math.max(0, livesRef.current - expired.length);
          setLives(newLives);
          setCombo(0);
          setHitFeedback("miss");
          setTimeout(() => setHitFeedback(null), 400);
          if (navigator.vibrate) navigator.vibrate([80, 50]);
          if (newLives <= 0) {
            setGameState("gameover");
          }
        }
        return prev.filter(s => now - s.createdAt <= FALL_DURATION);
      });
    }, 100);

    return () => {
      if (spawnRef.current) clearInterval(spawnRef.current);
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, [gameState, level, spawnShape]);

  useEffect(() => {
    if (score > 0 && score % 10 === 0) {
      setLevel(prev => Math.min(prev + 1, 10));
    }
  }, [score]);

  const handleTap = (shape: FallingShape) => {
    if (gameState !== "playing") return;
    if (navigator.vibrate) navigator.vibrate(30);

    setShapes(prev => prev.filter(s => s.id !== shape.id));

    if (shape.color === targetColor) {
      const newCombo = comboRef.current + 1;
      const points = 1 + Math.floor(newCombo / 3);
      setScore(prev => prev + points);
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setHitFeedback("hit");
      setTimeout(() => setHitFeedback(null), 300);
      if (newCombo > 0 && newCombo % 3 === 0) {
        setShowCombo(true);
        setTimeout(() => setShowCombo(false), 800);
      }
      if (newCombo > 0 && newCombo % 5 === 0) {
        pickTarget();
      }
    } else {
      const newLives = Math.max(0, livesRef.current - 1);
      setLives(newLives);
      setCombo(0);
      setHitFeedback("miss");
      setTimeout(() => setHitFeedback(null), 400);
      if (navigator.vibrate) navigator.vibrate([60, 30]);
      if (newLives <= 0) {
        setGameState("gameover");
      }
    }
  };

  const handleSubmitScore = () => {
    if (!player1Id) return;
    submitScore.mutate(
      { data: { playerId: player1Id, score, level, combo: maxCombo } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetShadowDuelLeaderboardQueryKey() });
          qc.invalidateQueries({ queryKey: getGetShadowDuelScoresQueryKey() });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <motion.button
          className="text-sm text-muted-foreground"
          onClick={() => { navigate("/"); setGameState("idle"); }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back
        </motion.button>
        <h1 className="font-bold">Shadow Duel</h1>
        <div className="w-16" />
      </div>

      {/* Game area */}
      <div
        className="flex-1 relative mx-4 rounded-2xl border border-border overflow-hidden"
        style={{
          background: "hsl(240 40% 3%)",
          minHeight: "320px",
          boxShadow: hitFeedback === "hit"
            ? "0 0 30px hsl(140 70% 45% / 0.6)"
            : hitFeedback === "miss"
              ? "0 0 30px hsl(0 80% 60% / 0.6)"
              : "inset 0 0 40px hsl(240 40% 3%)",
          transition: "box-shadow 0.2s",
        }}
      >
        {gameState === "idle" && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl">⚡</div>
            <h2 className="text-xl font-bold" style={{ textShadow: "0 0 15px hsl(190 90% 50% / 0.8)" }}>
              Shadow Duel
            </h2>
            <p className="text-sm text-muted-foreground text-center px-8">
              Tap shapes that match the target color. Miss them or tap wrong and lose a life.
            </p>
            <motion.button
              className="rounded-2xl px-8 py-4 font-bold text-lg mt-2"
              style={{
                background: "linear-gradient(135deg, hsl(350 80% 60%), hsl(190 90% 50%))",
                boxShadow: "0 0 30px hsl(350 80% 60% / 0.4)",
              }}
              onClick={startGame}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Game
            </motion.button>
          </motion.div>
        )}

        {gameState === "gameover" && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20"
            style={{ background: "hsl(240 40% 3% / 0.95)" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-5xl">💀</div>
            <h2 className="text-xl font-bold text-primary" style={{ textShadow: "0 0 15px hsl(350 80% 60% / 0.8)" }}>
              Game Over
            </h2>
            <div className="text-center">
              <div className="text-5xl font-bold">{score}</div>
              <div className="text-sm text-muted-foreground">points</div>
              <div className="text-sm text-muted-foreground mt-1">Level {level} · Max Combo ×{maxCombo}</div>
            </div>
            {topScores[0] && score > topScores[0].score && (
              <div className="text-sm text-accent font-bold" style={{ textShadow: "0 0 8px hsl(30 90% 55% / 0.8)" }}>
                NEW HIGH SCORE!
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <motion.button
                className="rounded-xl border border-border px-6 py-3 text-sm font-medium"
                onClick={startGame}
                whileTap={{ scale: 0.95 }}
              >
                Play Again
              </motion.button>
              {player1Id && (
                <motion.button
                  className="rounded-xl px-6 py-3 text-sm font-bold"
                  style={{ background: "hsl(350 80% 60%)", boxShadow: "0 0 15px hsl(350 80% 60% / 0.4)" }}
                  onClick={handleSubmitScore}
                  whileTap={{ scale: 0.95 }}
                  disabled={submitScore.isPending}
                >
                  {submitScore.isPending ? "Saving..." : "Save Score"}
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {gameState === "playing" && (
          <>
            {/* HUD */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <div>
                <div className="text-2xl font-bold" style={{ textShadow: "0 0 10px hsl(190 90% 50% / 0.8)" }}>{score}</div>
                {combo > 0 && <div className="text-xs text-accent">×{combo} combo</div>}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-xs text-muted-foreground">Tap</div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border-2"
                  style={{
                    background: COLOR_STYLES[targetColor].bg,
                    boxShadow: `0 0 15px ${COLOR_STYLES[targetColor].glow}`,
                    borderColor: COLOR_STYLES[targetColor].bg,
                  }}
                >
                  {COLOR_STYLES[targetColor].label}
                </div>
              </div>
              <div className="flex gap-1">
                {[...Array(LIVES)].map((_, i) => (
                  <div key={i} className={`text-lg ${i < lives ? "opacity-100" : "opacity-20"}`}>❤️</div>
                ))}
              </div>
            </div>

            {/* Combo burst */}
            <AnimatePresence>
              {showCombo && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1.2 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                >
                  <div className="text-4xl font-bold text-accent" style={{ textShadow: "0 0 20px hsl(30 90% 55%)" }}>
                    COMBO ×{combo}!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Falling shapes */}
            <AnimatePresence>
              {shapes.map((shape) => (
                <motion.div
                  key={shape.id}
                  className="absolute w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer select-none font-bold text-xs text-white"
                  style={{
                    left: `${shape.x}%`,
                    top: 0,
                    transform: "translateX(-50%)",
                    background: COLOR_STYLES[shape.color].bg,
                    boxShadow: `0 0 20px ${COLOR_STYLES[shape.color].glow}`,
                    zIndex: 5,
                  }}
                  initial={{ y: -60 }}
                  animate={{ y: "90vh" }}
                  transition={{ duration: FALL_DURATION / 1000, ease: "linear" }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={(e) => { e.stopPropagation(); handleTap(shape); }}
                  whileTap={{ scale: 0.8 }}
                >
                  {COLOR_STYLES[shape.color].label[0]}
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Leaderboard */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Top Scores</h3>
        {topScores.length === 0 ? (
          <p className="text-xs text-muted-foreground">No scores yet. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {topScores.slice(0, 5).map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-4 text-right">{i + 1}</span>
                <span>{s.avatar}</span>
                <span className="flex-1 font-medium truncate">{s.playerName}</span>
                <span className="font-bold text-secondary">{s.score}</span>
                <span className="text-xs text-muted-foreground">L{s.level}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
