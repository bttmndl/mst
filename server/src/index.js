import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { roomManager } from './rooms/roomManager.js';
import { registerHandlers } from './socket/handlers.js';

const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.CLIENT_ORIGIN || '*';

const app = express();
app.use(cors({ origin: ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Mint a fresh room code (optional REST helper; clients can also just
// pick a code client-side and join it directly).
app.post('/api/rooms', (_req, res) => {
  const room = roomManager.createRoom();
  res.json({ roomId: room.id });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ORIGIN, methods: ['GET', 'POST'] },
  maxHttpBufferSize: 60 * 1024 * 1024, // headroom for relayed image payloads
});

io.on('connection', (socket) => registerHandlers(io, socket));

server.listen(PORT, () => {
  console.log(`Magic Slide Transfer server listening on :${PORT}`);
});
