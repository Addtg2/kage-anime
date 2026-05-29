"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Comment {
  id: string;
  nickname: string;
  text: string;
  createdAt: number;
  likes: number;
}

interface CommentsState {
  byAnime: Record<string, Comment[]>;
  addComment: (animeId: string, nickname: string, text: string) => void;
  likeComment: (animeId: string, commentId: string) => void;
}

export const useCommentsStore = create<CommentsState>()(
  persist(
    (set) => ({
      byAnime: {},
      addComment: (animeId, nickname, text) =>
        set((s) => {
          const existing = s.byAnime[animeId] ?? [];
          const next: Comment = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            nickname: nickname.trim() || "Аноним",
            text: text.trim(),
            createdAt: Date.now(),
            likes: 0,
          };
          return { byAnime: { ...s.byAnime, [animeId]: [next, ...existing] } };
        }),
      likeComment: (animeId, commentId) =>
        set((s) => {
          const list = s.byAnime[animeId] ?? [];
          return {
            byAnime: {
              ...s.byAnime,
              [animeId]: list.map((c) =>
                c.id === commentId ? { ...c, likes: c.likes + 1 } : c,
              ),
            },
          };
        }),
    }),
    {
      name: "kage-comments-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
