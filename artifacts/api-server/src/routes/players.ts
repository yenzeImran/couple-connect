import { Router, type IRouter } from "express";
import { db, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePlayerBody, GetPlayerParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/players", async (req, res): Promise<void> => {
  const players = await db.select().from(playersTable).orderBy(playersTable.id);
  res.json(players);
});

router.post("/players", async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [player] = await db.insert(playersTable).values(parsed.data).returning();
  res.status(201).json(player);
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const params = GetPlayerParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(player);
});

export default router;
