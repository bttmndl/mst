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

  // an incoming image being revealed on THIS device
  // { id, dataUrl, width, height, name, fromId }
  incoming: null,

  // live transfer progress for the incoming reveal (0..1)
  incomingProgress: 0,
  incomingAxis: 'x',
  incomingDir: 1,

  setSession: (s) => set(s),
  setConnected: (connected) => set({ connected }),
  setMembers: (members) => set({ members }),
  setHeldImage: (heldImage) => set({ heldImage }),

  beginIncoming: (img) =>
    set({ incoming: img, incomingProgress: 0 }),
  setIncomingProgress: (p, axis, dir) =>
    set((st) => ({
      incomingProgress: p,
      incomingAxis: axis ?? st.incomingAxis,
      incomingDir: dir ?? st.incomingDir,
    })),
  commitIncoming: () =>
    set((st) =>
      st.incoming
        ? { heldImage: { ...st.incoming }, incoming: null, incomingProgress: 0 }
        : {}
    ),
  cancelIncoming: () => set({ incoming: null, incomingProgress: 0 }),

  reset: () =>
    set({
      roomId: null,
      members: [],
      heldImage: null,
      incoming: null,
      incomingProgress: 0,
    }),
}));
