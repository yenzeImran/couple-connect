import { Router, type IRouter } from "express";
import { db, playersTable, predictionsTable, shadowDuelScoresTable, syncUpSessionsTable } from "@workspace/db";
import { desc, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

const LEVEL_NAMES = [
  "New Couple",
  "Sweethearts",
  "Dynamic Duo",
  "Unstoppable Pair",
  "Power Couple",
  "Legendary Lovers",
  "Eternal Bond",
];

function getRelationshipLevel(totalXp: number) {
  const xpPerLevel = 500;
  const level = Math.min(Math.floor(totalXp / xpPerLevel) + 1, LEVEL_NAMES.length);
  const currentXp = totalXp % xpPerLevel;
  const xpToNextLevel = xpPerLevel;
  const progressPercent = Math.min(Math.floor((currentXp / xpToNextLevel) * 100), 100);
  return {
    level,
    levelName: LEVEL_NAMES[level - 1] ?? "Eternal Bond",
    currentXp,
    xpToNextLevel,
    totalXp,
    progressPercent,
  };
}

router.get("/leaderboard", async (req, res): Promise<void> => {
  const players = await db
    .select()
    .from(playersTable)
    .orderBy(desc(playersTable.weeklyPoints));

  const entries = players.map((p, i) => ({
    playerId: p.id,
    playerName: p.name,
    avatar: p.avatar,
    weeklyPoints: p.weeklyPoints,
    totalPoints: p.totalPoints,
    rank: i + 1,
  }));

  const now = new Date();
  const weekEndsAt = new Date(now);
  weekEndsAt.setDate(now.getDate() + (7 - now.getDay()));
  weekEndsAt.setHours(23, 59, 59, 999);

  res.json({
    weeklyLeader: entries[0] ?? null,
    entries,
    weekEndsAt: weekEndsAt.toISOString(),
  });
});

router.get("/leaderboard/relationship", async (req, res): Promise<void> => {
  const players = await db.select().from(playersTable);
  const totalXp = players.reduce((sum, p) => sum + p.totalPoints, 0);
  res.json(getRelationshipLevel(totalXp));
});

router.get("/leaderboard/stats", async (req, res): Promise<void> => {
  const players = await db.select().from(playersTable);
  const totalGamesPlayed = players.reduce((sum, p) => sum + p.gamesPlayed, 0);

  const allPredictions = await db.select().from(predictionsTable);
  const predictionsWon = allPredictions.filter(p => p.status === "correct").length;
  const predictionsTotal = allPredictions.filter(p => p.status !== "pending").length;

  const topScoreResult = await db
    .select({ maxScore: sql<number>`max(score)` })
    .from(shadowDuelScoresTable);
  const shadowDuelTopScore = topScoreResult[0]?.maxScore ?? 0;

  const syncSessions = await db.select().from(syncUpSessionsTable).where(eq(syncUpSessionsTable.status, "completed"));
  const syncUpSessionsPlayed = syncSessions.length;

  res.json({
    totalGamesPlayed,
    predictionsWon,
    predictionsTotal,
    shadowDuelTopScore: Number(shadowDuelTopScore),
    syncUpSessionsPlayed,
    currentStreak: Math.floor(Math.random() * 7) + 1,
  });
});

export default router;
