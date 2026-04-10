import { Router, type IRouter } from "express";
import { db, syncUpSessionsTable, playersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateSyncUpSessionBody, CompleteSyncUpSessionBody, CompleteSyncUpSessionParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sync-up/sessions", async (req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(syncUpSessionsTable)
    .orderBy(desc(syncUpSessionsTable.createdAt))
    .limit(20);
  res.json(sessions);
});

router.post("/sync-up/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSyncUpSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, parsed.data.player1Id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const [session] = await db.insert(syncUpSessionsTable).values({
    player1Id: parsed.data.player1Id,
    pattern: parsed.data.pattern,
    status: "active",
  }).returning();

  res.status(201).json(session);
});

router.patch("/sync-up/sessions/:id/complete", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteSyncUpSessionParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = CompleteSyncUpSessionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db.select().from(syncUpSessionsTable).where(eq(syncUpSessionsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const pointsAwarded = Math.floor(body.data.syncScore / 10);

  const [updated] = await db
    .update(syncUpSessionsTable)
    .set({
      player2Id: body.data.player2Id,
      player1Score: body.data.player1Score,
      player2Score: body.data.player2Score,
      syncScore: body.data.syncScore,
      status: "completed",
      pointsAwarded,
      completedAt: new Date(),
    })
    .where(eq(syncUpSessionsTable.id, params.data.id))
    .returning();

  const [player1] = await db.select().from(playersTable).where(eq(playersTable.id, existing.player1Id));
  if (player1) {
    await db
      .update(playersTable)
      .set({
        totalPoints: player1.totalPoints + pointsAwarded,
        weeklyPoints: player1.weeklyPoints + pointsAwarded,
        gamesPlayed: player1.gamesPlayed + 1,
      })
      .where(eq(playersTable.id, existing.player1Id));
  }

  const [player2] = await db.select().from(playersTable).where(eq(playersTable.id, body.data.player2Id));
  if (player2) {
    await db
      .update(playersTable)
      .set({
        totalPoints: player2.totalPoints + pointsAwarded,
        weeklyPoints: player2.weeklyPoints + pointsAwarded,
        gamesPlayed: player2.gamesPlayed + 1,
      })
      .where(eq(playersTable.id, body.data.player2Id));
  }

  res.json(updated!);
});

export default router;
