import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the Socket.IO server runs on :4000. We connect to it directly
// via VITE_SERVER_URL (see src/sockets/socket.js), so no proxy is strictly
// required, but we expose the app on all interfaces so a phone on the same
// Wi-Fi can reach the dev server by your machine's LAN IP.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
