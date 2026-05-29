"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Anime } from "@/lib/anime/types";

export type LibraryStatus = "watching" | "planned" | "completed" | "dropped";

export interface LibraryEntry {
  status: LibraryStatus;
  anime: Anime;
  addedAt: number;
  userRating?: number;
  note?: string;
}

interface LibraryState {
  entries: Record<string, LibraryEntry>;
  setStatus: (anime: Anime, status: LibraryStatus) => void;
  setRating: (animeId: string, rating: number | undefined) => void;
  setNote: (animeId: string, note: string) => void;
  remove: (animeId: string) => void;
  clear: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      entries: {},
      setStatus: (anime, status) =>
        set((s) => ({
          entries: {
            ...s.entries,
            [anime.id]: {
              ...s.entries[anime.id],
              status,
              anime,
              addedAt: s.entries[anime.id]?.addedAt ?? Date.now(),
            },
          },
        })),
      setRating: (animeId, rating) =>
        set((s) => {
          const entry = s.entries[animeId];
          if (!entry) return s;
          return {
            entries: { ...s.entries, [animeId]: { ...entry, userRating: rating } },
          };
        }),
      setNote: (animeId, note) =>
        set((s) => {
          const entry = s.entries[animeId];
          if (!entry) return s;
          return {
            entries: { ...s.entries, [animeId]: { ...entry, note } },
          };
        }),
      remove: (animeId) =>
        set((s) => {
          const copy = { ...s.entries };
          delete copy[animeId];
          return { entries: copy };
        }),
      clear: () => set({ entries: {} }),
    }),
    {
      name: "kage-library-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export const LIBRARY_STATUSES: readonly {
  id: LibraryStatus;
  label: string;
}[] = [
  { id: "watching", label: "Смотрю" },
  { id: "planned", label: "В планах" },
  { id: "completed", label: "Просмотрено" },
  { id: "dropped", label: "Брошено" },
];
