import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shadowDuelScoresTable = pgTable("shadow_duel_scores", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  score: integer("score").notNull().default(0),
  level: integer("level").notNull().default(1),
  combo: integer("combo").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShadowDuelScoreSchema = createInsertSchema(shadowDuelScoresTable).omit({ id: true, createdAt: true });
export type InsertShadowDuelScore = z.infer<typeof insertShadowDuelScoreSchema>;
export type ShadowDuelScore = typeof shadowDuelScoresTable.$inferSelect;
