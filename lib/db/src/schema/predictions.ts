import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  question: text("question").notNull(),
  prediction: text("prediction").notNull(),
  betPoints: integer("bet_points").notNull().default(50),
  status: text("status").notNull().default("pending"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true, resolvedAt: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
