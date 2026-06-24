import { io } from 'socket.io-client';

// Where the signaling/relay server lives.
// Dev: set VITE_SERVER_URL=http://<your-lan-ip>:4000 in client/.env so a
// phone on the same Wi-Fi can reach it. Prod: same origin by default.
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? `http://${location.hostname}:4000` : location.origin);

export const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}
