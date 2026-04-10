import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetSyncUpSessions,
  useCreateSyncUpSession,
  useCompleteSyncUpSession,
  getGetSyncUpSessionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerStore } from "@/lib/store";

type GamePhase = "menu" | "memorize" | "input" | "result";

const TILE_COLORS = [
  { id: "A", color: "hsl(350 80% 60%)", glow: "hsl(350 80% 60% / 0.6)" },
  { id: "B", color: "hsl(190 90% 50%)", glow: "hsl(190 90% 50% / 0.6)" },
  { id: "C", color: "hsl(30 90% 55%)", glow: "hsl(30 90% 55% / 0.6)" },
  { id: "D", color: "hsl(140 70% 45%)", glow: "hsl(140 70% 45% / 0.6)" },
  { id: "E", color: "hsl(280 80% 60%)", glow: "hsl(280 80% 60% / 0.6)" },
  { id: "F", color: "hsl(45 100% 55%)", glow: "hsl(45 100% 55% / 0.6)" },
];

function generatePattern(length = 6): string[] {
  return Array.from({ length }, () => TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)].id);
}

export default function SyncUp() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { player1Id, player2Id } = usePlayerStore();

  const { data: sessions = [] } = useGetSyncUpSessions();
  const createSession = useCreateSyncUpSession();
  const completeSession = useCompleteSyncUpSession();

  const [phase, setPhase] = useState<GamePhase>("menu");
  const [pattern, setPattern] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(3);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [syncScore, setSyncScore] = useState<number | null>(null);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  const completedSessions = sessions.filter(s => s.status === "completed");

  const startGame = () => {
    const newPattern = generatePattern(6);
    setPattern(newPattern);
    setPlayerInput([]);
    setSyncScore(null);
    setPhase("memorize");
    setCountdown(3);

    if (player1Id) {
      createSession.mutate(
        { data: { player1Id, pattern: newPattern.join(",") } },
        { onSuccess: (s) => setActiveSessionId(s.id) }
      );
    }
  };

  useEffect(() => {
    if (phase !== "memorize") return;
    if (countdown <= 0) {
      setPhase("input");
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, countdown]);

  const handleTileInput = (colorId: string) => {
    if (phase !== "input") return;
    if (navigator.vibrate) navigator.vibrate(30);
    const newInput = [...playerInput, colorId];
    setPlayerInput(newInput);
    setHighlightIdx(newInput.length - 1);
    setTimeout(() => setHighlightIdx(null), 200);

    if (newInput.length === pattern.length) {
      const correct = newInput.filter((c, i) => c === pattern[i]).length;
      const score = Math.round((correct / pattern.length) * 100);
      setSyncScore(score);
      setPhase("result");

      if (activeSessionId && player2Id && player1Id) {
        if (navigator.vibrate) navigator.vibrate(score > 70 ? [50, 30, 100, 30, 100] : [100, 30, 50]);
        completeSession.mutate(
          {
            id: activeSessionId,
            data: { player2Id, player1Score: score, player2Score: score, syncScore: score },
          },
          {
            onSuccess: () => {
              qc.invalidateQueries({ queryKey: getGetSyncUpSessionsQueryKey() });
            },
          }
        );
      }
    }
  };

  const getTileInfo = (id: string) => TILE_COLORS.find(t => t.id === id)!;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <motion.button
          className="text-sm text-muted-foreground"
          onClick={() => { navigate("/"); setPhase("menu"); }}
          whileTap={{ scale: 0.95 }}
        >
          ← Back
        </motion.button>
        <h1 className="font-bold">Sync-Up</h1>
        <div className="w-16" />
      </div>

      <AnimatePresence mode="wait">
        {phase === "menu" && (
          <motion.div
            key="menu"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-6xl">🎵</div>
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2" style={{ textShadow: "0 0 15px hsl(350 80% 60% / 0.6)" }}>
                  Move as One
                </h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Memorize the color pattern, then recreate it perfectly. The closer your match, the higher your sync score.
                </p>
              </div>

              <motion.button
                className="rounded-2xl px-10 py-4 font-bold text-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(350 80% 60%), hsl(190 90% 50%))",
                  boxShadow: "0 0 30px hsl(350 80% 60% / 0.4)",
                }}
                onClick={startGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Round
              </motion.button>
            </div>

            {completedSessions.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Recent Rounds</h3>
                <div className="flex flex-col gap-2">
                  {completedSessions.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className="font-bold text-lg"
                        style={s.syncScore && s.syncScore >= 80
                          ? { color: "hsl(140 70% 50%)", textShadow: "0 0 8px hsl(140 70% 45% / 0.6)" }
                          : { color: "hsl(30 90% 55%)" }
                        }
                      >
                        {s.syncScore ?? 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {phase === "memorize" && (
          <motion.div
            key="memorize"
            className="flex-1 flex flex-col items-center justify-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="text-5xl font-bold text-secondary mb-1" style={{ textShadow: "0 0 20px hsl(190 90% 50% / 0.8)" }}>
                {countdown}
              </div>
              <p className="text-muted-foreground text-sm">Memorize this pattern!</p>
            </div>

            {/* Pattern display */}
            <div className="flex gap-3 flex-wrap justify-center max-w-xs">
              {pattern.map((id, i) => {
                const tile = getTileInfo(id);
                return (
                  <motion.div
                    key={i}
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{
                      background: tile.color,
                      boxShadow: `0 0 20px ${tile.glow}`,
                    }}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {i + 1}
                  </motion.div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">Pattern: {pattern.join(" → ")}</p>
          </motion.div>
        )}

        {phase === "input" && (
          <motion.div
            key="input"
            className="flex-1 flex flex-col gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Recreate the pattern</p>
              <div className="flex gap-2 justify-center mt-2">
                {pattern.map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-md border-2"
                    style={i < playerInput.length
                      ? {
                        background: getTileInfo(playerInput[i]).color,
                        borderColor: getTileInfo(playerInput[i]).color,
                        boxShadow: highlightIdx === i ? `0 0 15px ${getTileInfo(playerInput[i]).glow}` : undefined,
                      }
                      : { borderColor: "hsl(240 30% 20%)" }
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{playerInput.length}/{pattern.length} selected</p>
            </div>

            {/* Color tiles to tap */}
            <div className="flex-1 flex flex-col gap-3 justify-center">
              <div className="grid grid-cols-3 gap-3">
                {TILE_COLORS.map((tile) => (
                  <motion.button
                    key={tile.id}
                    className="rounded-2xl py-6 font-bold text-white text-sm"
                    style={{
                      background: tile.color,
                      boxShadow: `0 4px 20px ${tile.glow}`,
                    }}
                    onClick={() => handleTileInput(tile.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.88, boxShadow: `0 0 30px ${tile.glow}` }}
                    disabled={playerInput.length >= pattern.length}
                  >
                    {tile.id}
                  </motion.button>
                ))}
              </div>

              {playerInput.length > 0 && (
                <motion.button
                  className="rounded-xl border border-border py-3 text-sm text-muted-foreground"
                  onClick={() => setPlayerInput([])}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Reset
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div
            key="result"
            className="flex-1 flex flex-col items-center justify-center gap-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-6xl">
              {syncScore !== null && syncScore >= 80 ? "💫" : syncScore !== null && syncScore >= 50 ? "✨" : "😅"}
            </div>
            <div className="text-center">
              <div
                className="text-7xl font-bold mb-2"
                style={syncScore !== null && syncScore >= 80
                  ? { color: "hsl(140 70% 50%)", textShadow: "0 0 30px hsl(140 70% 45% / 0.8)" }
                  : { color: "hsl(30 90% 55%)", textShadow: "0 0 20px hsl(30 90% 55% / 0.6)" }
                }
              >
                {syncScore}%
              </div>
              <div className="font-bold text-lg">
                {syncScore !== null && syncScore === 100
                  ? "Perfect Sync!"
                  : syncScore !== null && syncScore >= 80
                    ? "Great Sync!"
                    : syncScore !== null && syncScore >= 50
                      ? "Getting There!"
                      : "Keep Practicing!"}
              </div>
            </div>

            {/* Comparison */}
            <div className="w-full max-w-sm">
              <p className="text-xs text-muted-foreground text-center mb-3">Pattern comparison</p>
              <div className="grid grid-cols-6 gap-1">
                {pattern.map((id, i) => {
                  const tile = getTileInfo(id);
                  const correct = playerInput[i] === id;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <div
                        className="w-full aspect-square rounded"
                        style={{ background: tile.color, opacity: 0.9 }}
                      />
                      <div
                        className="w-full aspect-square rounded"
                        style={{
                          background: playerInput[i] ? getTileInfo(playerInput[i]).color : "hsl(240 30% 15%)",
                          outline: correct ? "2px solid hsl(140 70% 50%)" : "2px solid hsl(0 80% 60%)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Pattern</span>
                <span>Your input</span>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                className="rounded-xl border border-border px-6 py-3 text-sm"
                onClick={() => setPhase("menu")}
                whileTap={{ scale: 0.95 }}
              >
                Back to Menu
              </motion.button>
              <motion.button
                className="rounded-xl px-6 py-3 text-sm font-bold"
                style={{
                  background: "linear-gradient(135deg, hsl(350 80% 60%), hsl(190 90% 50%))",
                  boxShadow: "0 0 20px hsl(350 80% 60% / 0.4)",
                }}
                onClick={startGame}
                whileTap={{ scale: 0.95 }}
              >
                Play Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
