// Export from generated API (excluding duplicates)
export * from "./generated/api";

// Export specific types from generated/types to avoid conflicts
export type { 
  CompleteSyncUpBody,
  CreatePlayerBody as CreatePlayerBodyType,
  CreatePredictionBody as CreatePredictionBodyType,
  CreateSyncUpSessionBody as CreateSyncUpSessionBodyType,
  GameStats,
  HealthStatus,
  LeaderboardEntry,
  LeaderboardResponse,
  Player,
  Prediction,
  PredictionHistory,
  PredictionStatus,
  RelationshipLevel,
  ResolvePredictionBody as ResolvePredictionBodyType,
  ShadowDuelScore,
  SubmitShadowDuelScoreBody as SubmitShadowDuelScoreBodyType,
  SyncUpSession,
  SyncUpSessionStatus
} from "./generated/types";
