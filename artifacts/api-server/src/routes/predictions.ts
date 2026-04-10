import { Router, type IRouter } from "express";
import { db, predictionsTable, playersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreatePredictionBody, ResolvePredictionBody, ResolvePredictionParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/predictions", async (req, res): Promise<void> => {
  const predictions = await db
    .select({
      id: predictionsTable.id,
      playerId: predictionsTable.playerId,
      playerName: playersTable.name,
      question: predictionsTable.question,
      prediction: predictionsTable.prediction,
      betPoints: predictionsTable.betPoints,
      status: predictionsTable.status,
      resolvedAt: predictionsTable.resolvedAt,
      createdAt: predictionsTable.createdAt,
    })
    .from(predictionsTable)
    .leftJoin(playersTable, eq(predictionsTable.playerId, playersTable.id))
    .orderBy(desc(predictionsTable.createdAt));

  res.json(predictions.map(p => ({ ...p, playerName: p.playerName ?? "Unknown" })));
});

router.post("/predictions", async (req, res): Promise<void> => {
  const parsed = CreatePredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, parsed.data.playerId));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const [prediction] = await db.insert(predictionsTable).values(parsed.data).returning();

  res.status(201).json({
    ...prediction,
    playerName: player.name,
  });
});

router.patch("/predictions/:id/resolve", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ResolvePredictionParams.safeParse({ id: Number(rawId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = ResolvePredictionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existingPrediction] = await db.select().from(predictionsTable).where(eq(predictionsTable.id, params.data.id));
  if (!existingPrediction) {
    res.status(404).json({ error: "Prediction not found" });
    return;
  }

  const newStatus = body.data.correct ? "correct" : "wrong";
  const [updated] = await db
    .update(predictionsTable)
    .set({ status: newStatus, resolvedAt: new Date() })
    .where(eq(predictionsTable.id, params.data.id))
    .returning();

  if (body.data.correct) {
    await db
      .update(playersTable)
      .set({
        weeklyPoints: playersTable.weeklyPoints,
        totalPoints: playersTable.totalPoints,
      })
      .where(eq(playersTable.id, existingPrediction.playerId));
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, updated!.playerId));

  res.json({ ...updated!, playerName: player?.name ?? "Unknown" });
});

router.get("/predictions/history", async (req, res): Promise<void> => {
  const allPredictions = await db
    .select({
      id: predictionsTable.id,
      playerId: predictionsTable.playerId,
      playerName: playersTable.name,
      question: predictionsTable.question,
      prediction: predictionsTable.prediction,
      betPoints: predictionsTable.betPoints,
      status: predictionsTable.status,
      resolvedAt: predictionsTable.resolvedAt,
      createdAt: predictionsTable.createdAt,
    })
    .from(predictionsTable)
    .leftJoin(playersTable, eq(predictionsTable.playerId, playersTable.id))
    .orderBy(desc(predictionsTable.createdAt));

  const resolved = allPredictions.filter(p => p.status !== "pending");
  const correct = resolved.filter(p => p.status === "correct").length;
  const winRate = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : 0;

  res.json({
    totalPredictions: resolved.length,
    correctPredictions: correct,
    winRate,
    recentPredictions: allPredictions.slice(0, 10).map(p => ({ ...p, playerName: p.playerName ?? "Unknown" })),
  });
});

export default router;
