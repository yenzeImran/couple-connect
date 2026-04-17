import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetPlayers, useCreatePlayer, getGetPlayersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlayerStore } from "@/lib/store";

const AVATARS = ["🦁", "🐯", "🦊", "🐺", "🦅", "🐉", "🦋", "🌙", "⚡", "🔥", "🌊", "💎", "🎯", "👑", "🌟", "🎭"];

export default function Players() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { setPlayers, player1Id, player2Id } = usePlayerStore();
  const { data: players } = useGetPlayers();
const playersArray = Array.isArray(players) ? players : [];
  const createPlayer = useCreatePlayer();

  const [mode, setMode] = useState<"select" | "create">("select");
  const [slot, setSlot] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🦁");
  const [localP1, setLocalP1] = useState<number | null>(player1Id);
  const [localP2, setLocalP2] = useState<number | null>(player2Id);

  const handleSelectPlayer = (playerId: number) => {
    if (navigator.vibrate) navigator.vibrate(30);
    if (slot === 1) {
      setLocalP1(playerId);
      setSlot(2);
    } else {
      setLocalP2(playerId);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (navigator.vibrate) navigator.vibrate(50);
    createPlayer.mutate(
      { data: { name: name.trim(), avatar } },
      {
        onSuccess: (newPlayer) => {
          queryClient.invalidateQueries({ queryKey: getGetPlayersQueryKey() });
          if (slot === 1) {
            setLocalP1(newPlayer.id);
            setSlot(2);
          } else {
            setLocalP2(newPlayer.id);
          }
          setName("");
          setMode("select");
        },
      }
    );
  };

  const handleConfirm = () => {
    if (!localP1 || !localP2) return;
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    setPlayers(localP1, localP2);
    navigate("/");
  };

  const getPlayerName = (id: number | null) => players.find(p => p.id === id)?.name ?? null;
  const getPlayerAvatar = (id: number | null) => players.find(p => p.id === id)?.avatar ?? "❓";

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col p-4">
      {/* Back button */}
      <motion.button
        className="self-start mb-4 text-sm text-muted-foreground flex items-center gap-1"
        onClick={() => navigate("/")}
        whileTap={{ scale: 0.95 }}
      >
        ← Back
      </motion.button>

      <motion.h1
        className="text-2xl font-bold mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Who's Playing?
      </motion.h1>

      {/* Player slots */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[1, 2].map((s) => {
          const id = s === 1 ? localP1 : localP2;
          const isActive = slot === s && mode === "select";
          return (
            <motion.div
              key={s}
              className={`rounded-2xl border p-4 flex flex-col items-center gap-2 cursor-pointer ${isActive ? "border-primary/60" : "border-border"}`}
              style={isActive ? { boxShadow: "0 0 15px hsl(350 80% 60% / 0.3)" } : {}}
              onClick={() => { setSlot(s as 1 | 2); setMode("select"); }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="text-3xl">{id ? getPlayerAvatar(id) : "?"}</div>
              <div className="text-sm font-medium text-center">
                {id ? getPlayerName(id) : <span className="text-muted-foreground">Player {s}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                {isActive ? "← Selecting" : id ? "Tap to change" : ""}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Active slot label */}
      <motion.p
        className="text-sm text-muted-foreground mb-3"
        key={slot}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {mode === "select" ? `Choose Player ${slot}` : `Create new profile for Player ${slot}`}
      </motion.p>

      {mode === "select" ? (
        <>
          {/* Existing players */}
          {playersArray.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {playersArray.map((p) => {
                const isSelected = (slot === 1 && localP1 === p.id) || (slot === 2 && localP2 === p.id);
                return (
                  <motion.button
                    key={p.id}
                    className={`rounded-xl border p-3 flex items-center gap-2 text-left ${isSelected ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                    onClick={() => handleSelectPlayer(p.id)}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-2xl">{p.avatar}</span>
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.totalPoints} pts</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
          <motion.button
            className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground"
            whileTap={{ scale: 0.97 }}
            onClick={() => setMode("create")}
          >
            + Create New Profile
          </motion.button>
        </>
      ) : (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <input
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-primary"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          {/* Avatar grid */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Pick your avatar</p>
            <div className="grid grid-cols-8 gap-1">
              {AVATARS.map((a) => (
                <motion.button
                  key={a}
                  className={`rounded-lg p-1 text-2xl aspect-square flex items-center justify-center ${avatar === a ? "bg-primary/20 border border-primary/60" : "bg-muted/30"}`}
                  onClick={() => setAvatar(a)}
                  whileTap={{ scale: 0.85 }}
                >
                  {a}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-xl border border-border py-3 text-sm"
              onClick={() => setMode("select")}
            >
              Cancel
            </button>
            <motion.button
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold"
              style={{ boxShadow: "0 0 15px hsl(350 80% 60% / 0.4)" }}
              onClick={handleCreate}
              whileTap={{ scale: 0.97 }}
              disabled={!name.trim() || createPlayer.isPending}
            >
              {createPlayer.isPending ? "Creating..." : "Create"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Confirm button */}
      {localP1 && localP2 && localP1 !== localP2 && (
        <motion.button
          className="mt-auto w-full rounded-2xl py-4 font-bold text-base mt-6"
          style={{
            background: "linear-gradient(135deg, hsl(350 80% 60%), hsl(30 90% 55%))",
            boxShadow: "0 0 30px hsl(350 80% 60% / 0.4)",
          }}
          onClick={handleConfirm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Start Playing Together
        </motion.button>
      )}
    </div>
  );
}
