'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AvatarVariant = 'female' | 'male';

/** Viewer preference only; never part of a saved furniture/manufacturing design. */
export const useAvatarStore = create<{
  avatar: AvatarVariant;
  setAvatar: (avatar: AvatarVariant) => void;
}>()(persist((set) => ({
  avatar: 'female',
  setAvatar: (avatar) => set({ avatar }),
}), {
  name: 'befun-viewer-avatar-v1',
  partialize: ({ avatar }) => ({ avatar }),
  merge: (persisted, current) => ({
    ...current,
    avatar: (persisted as { avatar?: unknown } | undefined)?.avatar === 'male' ? 'male' : 'female',
  }),
}));
