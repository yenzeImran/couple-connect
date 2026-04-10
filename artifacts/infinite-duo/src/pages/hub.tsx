import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetGameStats, useGetRelationshipLevel, useGetLeaderboard } from "@workspace/api-client-react";
import { usePlayerStore } from "@/lib/store";

const ROOM_OBJECTS = [
  {
    id: "tv",
    label: "Shadow Duel",
    sublabel: "High Score Battle",
    href: "/shadow-duel",
    color: "190 90% 50%",
    shadow: "hsl(190 90% 50% / 0.6)",
    style: { top: "18%", left: "52%", width: "120px", height: "90px" },
    emoji: "📺",
  },
  {
    id: "clock",
    label: "Daily Predictions",
    sublabel: "Bet on Life",
    href: "/predictions",
    color: "30 90% 55%",
    shadow: "hsl(30 90% 55% / 0.6)",
    style: { top: "10%", left: "22%", width: "80px", height: "80px" },
    emoji: "🕐",
  },
  {
    id: "controllers",
    label: "Sync-Up",
    sublabel: "Move as One",
    href: "/sync-up",
    color: "350 80% 60%",
    shadow: "hsl(350 80% 60% / 0.6)",
    style: { top: "55%", left: "38%", width: "100px", height: "70px" },
    emoji: "🎮",
  },
  {
    id: "trophy",
    label: "Leaderboard",
    sublabel: "Weekly Champion",
    href: "/leaderboard",
    color: "45 100% 60%",
    shadow: "hsl(45 100% 60% / 0.6)",
    style: { top: "28%", left: "12%", width: "90px", height: "110px" },
    emoji: "🏆",
  },
];

export default function Hub() {
  const [, navigate] = useLocation();
  const { player1Id, player2Id } = usePlayerStore();
  const { data: stats } = useGetGameStats();
  const { data: relationship } = useGetRelationshipLevel();
  const { data: leaderboard } = useGetLeaderboard();

  const weeklyLeader = leaderboard?.weeklyLeader;
  const needsSetup = !player1Id || !player2Id;

  const handleObjectClick = (href: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    navigate(href);
  };

  return (
    <div className="min-h-[100dvh] bg-background overflow-hidden relative flex flex-col">
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: i % 3 === 0
                ? "hsl(350 80% 60% / 0.4)"
                : i % 3 === 1
                  ? "hsl(190 90% 50% / 0.4)"
                  : "hsl(30 90% 55% / 0.4)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        className="relative z-10 pt-8 pb-4 px-4 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ textShadow: "0 0 20px hsl(350 80% 60% / 0.6)" }}
        >
          The Infinite Duo
        </h1>
        {relationship && (
          <p className="text-sm text-muted-foreground mt-1">
            Level {relationship.level} — {relationship.levelName}
          </p>
        )}
      </motion.div>

      {/* Relationship XP bar */}
      {relationship && (
        <motion.div
          className="mx-4 mb-2"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(350 80% 60%), hsl(30 90% 55%))" }}
              initial={{ width: 0 }}
              animate={{ width: `${relationship.progressPercent}%` }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{relationship.currentXp} XP</span>
            <span>{relationship.xpToNextLevel} to Level {relationship.level + 1}</span>
          </div>
        </motion.div>
      )}

      {/* Isometric Room */}
      <div className="flex-1 relative mx-auto w-full max-w-md" style={{ height: "380px" }}>
        {/* Room base - isometric floor */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              width: "320px",
              height: "320px",
              position: "relative",
              transformStyle: "preserve-3d",
              transform: "rotateX(55deg) rotateZ(-45deg)",
            }}
          >
            {/* Floor */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, hsl(240 35% 10%), hsl(240 35% 7%))",
                border: "1px solid hsl(240 30% 18%)",
                borderRadius: "4px",
                boxShadow: "inset 0 0 40px hsl(240 30% 5%)",
              }}
            />
            {/* Floor grid lines */}
            {[1, 2, 3].map((i) => (
              <div key={`h${i}`} style={{
                position: "absolute",
                left: 0, right: 0,
                top: `${(i / 4) * 100}%`,
                height: "1px",
                background: "hsl(240 30% 15% / 0.5)",
              }} />
            ))}
            {[1, 2, 3].map((i) => (
              <div key={`v${i}`} style={{
                position: "absolute",
                top: 0, bottom: 0,
                left: `${(i / 4) * 100}%`,
                width: "1px",
                background: "hsl(240 30% 15% / 0.5)",
              }} />
            ))}

            {/* Left wall */}
            <div
              style={{
                position: "absolute",
                left: 0, top: 0, bottom: 0, width: "100%",
                background: "hsl(240 35% 8%)",
                transform: "rotateY(90deg) translateX(-50%) translateZ(-160px)",
                transformOrigin: "left",
                border: "1px solid hsl(240 30% 15%)",
              }}
            />
            {/* Back wall */}
            <div
              style={{
                position: "absolute",
                left: 0, right: 0, top: 0, height: "100%",
                background: "hsl(240 40% 7%)",
                transform: "rotateX(-90deg) translateY(-50%) translateZ(160px)",
                transformOrigin: "top",
                border: "1px solid hsl(240 30% 15%)",
              }}
            />
          </div>
        </div>

        {/* Clickable Room Objects - displayed flat over the iso room */}
        {ROOM_OBJECTS.map((obj, i) => (
          <motion.div
            key={obj.id}
            className="absolute flex flex-col items-center justify-center cursor-pointer select-none"
            style={{
              ...obj.style,
              zIndex: 10,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.12, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleObjectClick(obj.href)}
          >
            <div
              className="rounded-xl flex flex-col items-center justify-center w-full h-full border relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, hsl(${obj.color} / 0.15), hsl(${obj.color} / 0.05))`,
                borderColor: `hsl(${obj.color} / 0.4)`,
                boxShadow: `0 0 20px ${obj.shadow}, inset 0 1px 0 hsl(${obj.color} / 0.2)`,
              }}
            >
              <div className="text-3xl mb-1">{obj.emoji}</div>
              <div className="text-xs font-bold text-center px-1 leading-tight" style={{ color: `hsl(${obj.color})`, textShadow: `0 0 8px hsl(${obj.color} / 0.8)` }}>
                {obj.label}
              </div>
              <div className="text-[10px] text-muted-foreground text-center px-1 mt-0.5 leading-tight">
                {obj.sublabel}
              </div>
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `linear-gradient(45deg, transparent 30%, hsl(${obj.color} / 0.15) 50%, transparent 70%)`,
                  backgroundSize: "200% 200%",
                }}
                animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats strip */}
      {stats && (
        <motion.div
          className="mx-4 mb-4 grid grid-cols-3 gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {[
            { label: "Games Played", value: stats.totalGamesPlayed },
            { label: "Win Rate", value: `${stats.predictionsTotal > 0 ? Math.round((stats.predictionsWon / stats.predictionsTotal) * 100) : 0}%` },
            { label: "Day Streak", value: stats.currentStreak },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-xl font-bold text-primary">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Weekly leader or setup CTA */}
      <div className="px-4 pb-6">
        {needsSetup ? (
          <motion.button
            className="w-full rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center"
            style={{ boxShadow: "0 0 20px hsl(350 80% 60% / 0.2)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/players")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="text-sm font-bold text-primary">Set Up Your Profiles</div>
            <div className="text-xs text-muted-foreground mt-1">Choose your names and avatars to begin</div>
          </motion.button>
        ) : weeklyLeader ? (
          <motion.div
            className="rounded-2xl border border-accent/30 bg-accent/10 p-3 flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="text-2xl">{weeklyLeader.avatar}</div>
            <div>
              <div className="text-xs text-muted-foreground">This Week's Leader</div>
              <div className="font-bold text-accent" style={{ textShadow: "0 0 8px hsl(30 90% 55% / 0.6)" }}>
                {weeklyLeader.playerName}
              </div>
              <div className="text-xs text-muted-foreground">{weeklyLeader.weeklyPoints} pts this week</div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
