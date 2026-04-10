import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetLeaderboard, useGetRelationshipLevel, useGetGameStats } from "@workspace/api-client-react";

export default function Leaderboard() {
  const [, navigate] = useLocation();
  const { data: leaderboard, isLoading } = useGetLeaderboard();
  const { data: relationship } = useGetRelationshipLevel();
  const { data: stats } = useGetGameStats();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col p-4">
      <motion.button
        className="self-start mb-4 text-sm text-muted-foreground"
        onClick={() => navigate("/")}
        whileTap={{ scale: 0.95 }}
      >
        ← Back
      </motion.button>

      <motion.h1
        className="text-2xl font-bold mb-1"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Leaderboard
      </motion.h1>
      <p className="text-sm text-muted-foreground mb-6">
        Weekly standings & relationship progress
      </p>

      {/* Relationship Level */}
      {relationship && (
        <motion.div
          className="rounded-2xl border border-accent/30 bg-accent/5 p-4 mb-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <div className="text-xs text-muted-foreground">Relationship Level</div>
              <div className="font-bold text-lg text-accent" style={{ textShadow: "0 0 10px hsl(30 90% 55% / 0.6)" }}>
                Level {relationship.level} — {relationship.levelName}
              </div>
            </div>
            <div className="text-4xl">🏅</div>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(350 80% 60%), hsl(30 90% 55%), hsl(190 90% 50%))" }}
              initial={{ width: 0 }}
              animate={{ width: `${relationship.progressPercent}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{relationship.currentXp} XP</span>
            <span>{relationship.xpToNextLevel - relationship.currentXp} XP to next level</span>
          </div>
        </motion.div>
      )}

      {/* Game Stats */}
      {stats && (
        <motion.div
          className="grid grid-cols-3 gap-2 mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { label: "Total Games", value: stats.totalGamesPlayed, color: "190 90% 50%" },
            { label: "Pred Win Rate", value: `${stats.predictionsTotal > 0 ? Math.round((stats.predictionsWon / stats.predictionsTotal) * 100) : 0}%`, color: "30 90% 55%" },
            { label: "Duel Best", value: stats.shadowDuelTopScore, color: "350 80% 60%" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
              <div className="text-xl font-bold" style={{ color: `hsl(${s.color})`, textShadow: `0 0 8px hsl(${s.color} / 0.5)` }}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Weekly leaderboard */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">This Week</h2>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : !leaderboard?.entries.length ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="text-4xl mb-3">🏆</div>
            <p>No scores yet — start playing to earn points!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.entries.map((entry, i) => (
              <motion.div
                key={entry.playerId}
                className={`rounded-xl border p-4 flex items-center gap-3 ${i === 0 ? "border-accent/40 bg-accent/10" : "border-border bg-card"}`}
                style={i === 0 ? { boxShadow: "0 0 20px hsl(30 90% 55% / 0.2)" } : {}}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: i === 0 ? "hsl(45 100% 50%)" : i === 1 ? "hsl(0 0% 75%)" : "hsl(30 60% 45%)",
                    color: "#000",
                  }}
                >
                  {entry.rank}
                </div>
                <div className="text-2xl flex-shrink-0">{entry.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{entry.playerName}</div>
                  <div className="text-xs text-muted-foreground">{entry.totalPoints} total pts</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className="text-lg font-bold"
                    style={i === 0 ? { color: "hsl(30 90% 55%)", textShadow: "0 0 8px hsl(30 90% 55% / 0.6)" } : {}}
                  >
                    {entry.weeklyPoints}
                  </div>
                  <div className="text-xs text-muted-foreground">this week</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {leaderboard?.weekEndsAt && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Week resets on {new Date(leaderboard.weekEndsAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
