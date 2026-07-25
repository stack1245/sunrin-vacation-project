"use client";

import { create } from "zustand";

import type { InventoryItem } from "@/types/game";

const INITIAL_ATTEMPTS = 3;

interface GameState {
  currentStage: number;
  inventory: InventoryItem[];
  attemptsLeft: number;
  isTimerRunning: boolean;
  isAlarmActive: boolean;
  setStage: (stageId: number) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string) => void;
  useAttempt: () => void;
  resetGame: () => void;
}

const initialState = {
  currentStage: 1,
  inventory: [] as InventoryItem[],
  attemptsLeft: INITIAL_ATTEMPTS,
  isTimerRunning: false,
  isAlarmActive: false,
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setStage: (stageId) =>
    set({
      currentStage: stageId,
      isTimerRunning: true,
      isAlarmActive: false,
    }),

  addItem: (item) =>
    set((state) => {
      const alreadyOwned = state.inventory.some(
        (inventoryItem) => inventoryItem.id === item.id,
      );

      return alreadyOwned
        ? state
        : { inventory: [...state.inventory, item] };
    }),

  removeItem: (itemId) =>
    set((state) => ({
      inventory: state.inventory.filter((item) => item.id !== itemId),
    })),

  useAttempt: () =>
    set((state) => {
      const attemptsLeft = Math.max(0, state.attemptsLeft - 1);
      const hasNoAttempts = attemptsLeft === 0;

      return {
        attemptsLeft,
        isAlarmActive: hasNoAttempts,
        isTimerRunning: !hasNoAttempts,
      };
    }),

  resetGame: () => set(initialState),
}));
