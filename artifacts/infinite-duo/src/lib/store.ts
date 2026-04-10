import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlayerState {
  player1Id: number | null;
  player2Id: number | null;
  setPlayers: (p1: number, p2: number) => void;
  clearPlayers: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      player1Id: null,
      player2Id: null,
      setPlayers: (p1, p2) => set({ player1Id: p1, player2Id: p2 }),
      clearPlayers: () => set({ player1Id: null, player2Id: null }),
    }),
    {
      name: 'infinite-duo-players',
    }
  )
);
