import { z } from 'zod';

// Health check
export const HealthCheckResponse = z.object({
  status: z.string(),
});

// Players
export const CreatePlayerBody = z.object({
  name: z.string().min(1),
  avatar: z.string().optional(),
});

export const GetPlayerParams = z.object({
  id: z.number(),
});

// Predictions
export const CreatePredictionBody = z.object({
  playerId: z.number(),
  question: z.string().min(1),
  prediction: z.string().min(1),
  betPoints: z.number().optional().default(50),
});

export const ResolvePredictionBody = z.object({
  status: z.enum(['correct', 'incorrect']),
});

export const ResolvePredictionParams = z.object({
  id: z.number(),
});

// Shadow Duel
export const SubmitShadowDuelScoreBody = z.object({
  playerId: z.number(),
  score: z.number(),
  level: z.number(),
  combo: z.number(),
});

// Sync Up
export const CreateSyncUpSessionBody = z.object({
  player1Id: z.number(),
  pattern: z.string().min(1),
});

export const CompleteSyncUpSessionBody = z.object({
  player2Id: z.number(),
  player2Score: z.number(),
  pointsAwarded: z.number(),
});

export const CompleteSyncUpSessionParams = z.object({
  id: z.number(),
});

export type CreatePlayerBodyType = z.infer<typeof CreatePlayerBody>;
export type GetPlayerParamsType = z.infer<typeof GetPlayerParams>;
export type CreatePredictionBodyType = z.infer<typeof CreatePredictionBody>;
export type ResolvePredictionBodyType = z.infer<typeof ResolvePredictionBody>;
export type ResolvePredictionParamsType = z.infer<typeof ResolvePredictionParams>;
export type SubmitShadowDuelScoreBodyType = z.infer<typeof SubmitShadowDuelScoreBody>;
export type CreateSyncUpSessionBodyType = z.infer<typeof CreateSyncUpSessionBody>;
export type CompleteSyncUpSessionBodyType = z.infer<typeof CompleteSyncUpSessionBody>;
export type CompleteSyncUpSessionParamsType = z.infer<typeof CompleteSyncUpSessionParams>;
