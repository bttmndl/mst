import { create } from 'zustand';

export const useStore = create((set) => ({
  // session
  selfId: null,
  roomId: null,
  connected: false,

  // presence
  members: [],

  // the image currently held on THIS device, ready to send
  // { id, dataUrl, width, height, name }
  heldImage: null,

  // fullscreen viewer — shown on both sender and receiver simultaneously
  // { id, dataUrl, name }
  fullscreenImage: null,

  // an incoming image being revealed on THIS device
  // { id, dataUrl, width, height, name, fromId }
  incoming: null,

  // live transfer progress for the incoming reveal (0..1)
  incomingProgress: 0,
  incomingAxis: 'x',
  incomingDir: 1,

  // when true, SenderImage auto-enters fullscreen on the next committed image
  pendingFullscreen: false,

  setSession: (s) => set(s),
  setConnected: (connected) => set({ connected }),
  setMembers: (members) => set({ members }),
  setHeldImage: (heldImage) => set({ heldImage }),
  setFullscreenImage: (img) => set({ fullscreenImage: img }),
  clearFullscreenImage: () => set({ fullscreenImage: null }),

  beginIncoming: (img) =>
    set({ incoming: img, incomingProgress: 0 }),
  setIncomingProgress: (p, axis, dir) =>
    set((st) => ({
      incomingProgress: p,
      incomingAxis: axis ?? st.incomingAxis,
      incomingDir: dir ?? st.incomingDir,
    })),
  commitIncoming: (fullscreen = false) =>
    set((st) =>
      st.incoming
        ? { heldImage: { ...st.incoming }, incoming: null, incomingProgress: 0, pendingFullscreen: fullscreen }
        : {}
    ),
  cancelIncoming: () => set({ incoming: null, incomingProgress: 0 }),

  reset: () =>
    set({
      roomId: null,
      members: [],
      heldImage: null,
      fullscreenImage: null,
      incoming: null,
      incomingProgress: 0,
      pendingFullscreen: false,
    }),
}));
