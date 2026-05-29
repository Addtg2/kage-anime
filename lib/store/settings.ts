"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PreferredPlayer = "auto" | "kodik" | "alloha";
export type Theme = "dark" | "oled" | "light";

export interface EpisodeSubscription {
  animeId: string;
  titleRu: string;
  nextAt: string; // ISO
  nextEpisode: number;
}

interface SettingsState {
  preferredPlayer: PreferredPlayer;
  setPreferredPlayer: (p: PreferredPlayer) => void;
  autoNext: boolean;
  setAutoNext: (v: boolean) => void;
  skipOpening: boolean;
  setSkipOpening: (v: boolean) => void;
  spoilerFree: boolean;
  setSpoilerFree: (v: boolean) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Сохранённый выбор озвучки Kodik по animeId */
  translationByAnime: Record<string, number>;
  setTranslationForAnime: (animeId: string, translationId: number) => void;
  /** Подписки на новые серии: ключ — animeId */
  episodeSubs: Record<string, EpisodeSubscription>;
  addEpisodeSub: (sub: EpisodeSubscription) => void;
  removeEpisodeSub: (animeId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preferredPlayer: "auto",
      setPreferredPlayer: (p) => set({ preferredPlayer: p }),
      autoNext: true,
      setAutoNext: (v) => set({ autoNext: v }),
      skipOpening: true,
      setSkipOpening: (v) => set({ skipOpening: v }),
      spoilerFree: false,
      setSpoilerFree: (v) => set({ spoilerFree: v }),
      theme: "dark",
      setTheme: (t) => set({ theme: t }),
      translationByAnime: {},
      setTranslationForAnime: (animeId, translationId) =>
        set((s) => ({
          translationByAnime: { ...s.translationByAnime, [animeId]: translationId },
        })),
      episodeSubs: {},
      addEpisodeSub: (sub) =>
        set((s) => ({ episodeSubs: { ...s.episodeSubs, [sub.animeId]: sub } })),
      removeEpisodeSub: (animeId) =>
        set((s) => {
          const copy = { ...s.episodeSubs };
          delete copy[animeId];
          return { episodeSubs: copy };
        }),
    }),
    {
      name: "kage-settings-v1",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted, version) => {
        const p = (persisted as Partial<SettingsState>) ?? {};
        if (version < 2) {
          return {
            ...p,
            translationByAnime: p.translationByAnime ?? {},
            episodeSubs: p.episodeSubs ?? {},
            spoilerFree: false,
          } as SettingsState;
        }
        if (version < 3) {
          return { ...p, spoilerFree: p.spoilerFree ?? false } as SettingsState;
        }
        return p as SettingsState;
      },
    },
  ),
);
