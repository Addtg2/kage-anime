"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PreferredPlayer = "auto" | "kodik" | "alloha";

interface SettingsState {
  preferredPlayer: PreferredPlayer;
  setPreferredPlayer: (p: PreferredPlayer) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preferredPlayer: "auto",
      setPreferredPlayer: (p) => set({ preferredPlayer: p }),
    }),
    {
      name: "kage-settings-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
