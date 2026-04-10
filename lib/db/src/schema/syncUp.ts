import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syncUpSessionsTable = pgTable("sync_up_sessions", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull(),
  player2Id: integer("player2_id"),
  status: text("status").notNull().default("waiting"),
  syncScore: integer("sync_score"),
  pattern: text("pattern").notNull(),
  player1Score: integer("player1_score"),
  player2Score: integer("player2_score"),
  pointsAwarded: integer("points_awarded"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertSyncUpSessionSchema = createInsertSchema(syncUpSessionsTable).omit({ id: true, createdAt: true, completedAt: true });
export type InsertSyncUpSession = z.infer<typeof insertSyncUpSessionSchema>;
export type SyncUpSession = typeof syncUpSessionsTable.$inferSelect;
