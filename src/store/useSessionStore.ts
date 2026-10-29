import { create } from "zustand";

interface SessionState {
  username: string | null;
  isCallsignModalOpen: boolean;
  setUsername: (username: string | null) => void;
  openCallsignModal: () => void;
  closeCallsignModal: () => void;
  clearSession: () => void;
}

/**
 * Session-only Store (In-Memory, strictly non-persisted).
 * Any browser refresh or tab close immediately resets the username to null,
 * requiring the operative to enter their callsign again.
 */
export const useSessionStore = create<SessionState>((set) => ({
  username: null,
  isCallsignModalOpen: false,

  setUsername: (rawUsername) => {
    if (!rawUsername) {
      set({ username: null, isCallsignModalOpen: false });
      return;
    }
    const sanitized = rawUsername.trim().toUpperCase().slice(0, 15);
    set({ username: sanitized, isCallsignModalOpen: false });
  },

  openCallsignModal: () => set({ isCallsignModalOpen: true }),
  closeCallsignModal: () => set({ isCallsignModalOpen: false }),
  clearSession: () => set({ username: null }),
}));
