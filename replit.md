# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: The Infinite Duo

A couples game hub PWA. Dark space-purple theme with electric coral/cyan/amber glow accents.

### Frontend: `artifacts/infinite-duo`
- React + Vite + TypeScript + Tailwind CSS
- Framer Motion for animations
- Zustand (with localStorage persist) for player state
- Wouter for routing

### Pages
- `/` — Hub: CSS isometric room with 4 clickable portals + Truth or Dare and Memory Vault cards below
- `/players` — Profile setup (create or select players)
- `/leaderboard` — Weekly standings + relationship level XP bar
- `/predictions` — Daily Predictions betting game
- `/shadow-duel` — Shadow Duel: falling shapes tap game
- `/sync-up` — Sync-Up: color pattern memorization game
- `/truth-or-dare` — Truth or Dare: 7 categories, 15+ prompts each; multiplayer turn system where Player 1 must complete their dare/answer before Player 2 can draw
- `/memory-vault` — Memory Vault: 3x3 sliding puzzle co-op; Player 1 solves puzzle to unlock a memory, Player 2 answers a random truth question drawn from the T&D question pool; 6 memories total, 65+ truth questions

### Backend: `artifacts/api-server`
- Express 5 + pino logging
- Routes: `/api/players`, `/api/leaderboard`, `/api/predictions`, `/api/shadow-duel`, `/api/sync-up`

### Database Tables
- `players` — name, avatar (emoji), totalPoints, weeklyPoints, gamesPlayed
- `predictions` — question, prediction, betPoints, status (pending/correct/wrong)
- `shadow_duel_scores` — score, level, combo
- `sync_up_sessions` — pattern, player scores, syncScore, status

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
