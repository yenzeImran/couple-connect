import { Router, type IRouter } from "express";
import { db, shadowDuelScoresTable, playersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { SubmitShadowDuelScoreBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/shadow-duel/scores", async (req, res): Promise<void> => {
  const scores = await db
    .select({
      id: shadowDuelScoresTable.id,
      playerId: shadowDuelScoresTable.playerId,
      playerName: playersTable.name,
      avatar: playersTable.avatar,
      score: shadowDuelScoresTable.score,
      level: shadowDuelScoresTable.level,
      combo: shadowDuelScoresTable.combo,
      createdAt: shadowDuelScoresTable.createdAt,
    })
    .from(shadowDuelScoresTable)
    .leftJoin(playersTable, eq(shadowDuelScoresTable.playerId, playersTable.id))
    .orderBy(desc(shadowDuelScoresTable.score));

  res.json(scores.map(s => ({ ...s, playerName: s.playerName ?? "Unknown", avatar: s.avatar ?? "🎮" })));
});

router.post("/shadow-duel/scores", async (req, res): Promise<void> => {
  const parsed = SubmitShadowDuelScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, parsed.data.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const [score] = await db.insert(shadowDuelScoresTable).values(parsed.data).returning();

  const pointsEarned = Math.floor(parsed.data.score / 10);
  await db
    .update(playersTable)
    .set({
      totalPoints: player.totalPoints + pointsEarned,
      weeklyPoints: player.weeklyPoints + pointsEarned,
      gamesPlayed: player.gamesPlayed + 1,
    })
    .where(eq(playersTable.id, parsed.data.playerId));

  res.status(201).json({
    ...score,
    playerName: player.name,
    avatar: player.avatar,
  });
});

router.get("/shadow-duel/leaderboard", async (req, res): Promise<void> => {
  const scores = await db
    .select({
      id: shadowDuelScoresTable.id,
      playerId: shadowDuelScoresTable.playerId,
      playerName: playersTable.name,
      avatar: playersTable.avatar,
      score: shadowDuelScoresTable.score,
      level: shadowDuelScoresTable.level,
      combo: shadowDuelScoresTable.combo,
      createdAt: shadowDuelScoresTable.createdAt,
    })
    .from(shadowDuelScoresTable)
    .leftJoin(playersTable, eq(shadowDuelScoresTable.playerId, playersTable.id))
    .orderBy(desc(shadowDuelScoresTable.score))
    .limit(10);

  res.json(scores.map(s => ({ ...s, playerName: s.playerName ?? "Unknown", avatar: s.avatar ?? "🎮" })));
});

export default router;
