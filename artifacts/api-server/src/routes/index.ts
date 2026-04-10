import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import leaderboardRouter from "./leaderboard";
import predictionsRouter from "./predictions";
import shadowDuelRouter from "./shadowDuel";
import syncUpRouter from "./syncUp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(leaderboardRouter);
router.use(predictionsRouter);
router.use(shadowDuelRouter);
router.use(syncUpRouter);

export default router;
