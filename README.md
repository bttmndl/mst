# Magic Slide Transfer

Drag a photo toward the edge of one screen and watch it physically emerge
from the opposite edge of another nearby device — in real time. Think
AirDrop meets a Minority Report gesture.

Built with **React 19 + Vite (JavaScript, no TypeScript)** on the front end
and **Node + Express + Socket.IO** on the back end.

---

## What's in the box

```
magic-slide-transfer/
├── client/                 # React 19 + Vite + Framer Motion + Zustand
│   └── src/
│       ├── components/     # Lobby, Room, SenderImage, ReceiveLayer, DeviceList, QRPanel…
│       ├── hooks/          # useRoom (presence + transfer sync), useTheme
│       ├── store/          # Zustand store
│       ├── sockets/        # Socket.IO client
│       ├── webrtc/         # PeerManager scaffold (P2P upgrade path)
│       ├── utils/          # image processing, device detection
│       └── styles/         # native CSS design system (dark/light)
├── server/                 # Express + Socket.IO signaling & relay
│   └── src/
│       ├── rooms/          # in-memory room manager (24h TTL)
│       ├── socket/         # connection + transfer relay handlers
│       └── signaling/      # WebRTC offer/answer/ICE relay
├── docker-compose.yml
└── package.json            # root scripts
```

---

## Run it locally

You need **Node 18+**. Two processes: the server and the client.

```bash
# from the project root
npm run install:all       # installs both client and server deps

# terminal 1 — signaling/relay server on :4000
npm run dev:server

# terminal 2 — Vite dev server on :5173
npm run dev:client
```

Open `http://localhost:5173` in two browser tabs (or two windows). Create a
room in one, join with the code/QR/link in the other, drop a photo, and drag.

### Testing across real phones (same Wi-Fi)

The client must reach the server by your computer's LAN IP, not `localhost`.

1. Find your machine's IP (e.g. `192.168.1.20`).
2. Create `client/.env` from `client/.env.example`:
   ```
   VITE_SERVER_URL=http://192.168.1.20:4000
   ```
3. Restart `npm run dev:client`. On each phone open
   `http://192.168.1.20:5173`, join the same room, and transfer.

---

## How the magic works

1. Two (or more) devices join the same room over Socket.IO. Presence is
   broadcast so each device sees the others.
2. When you start dragging an image, it's sent **once** to the target device
   so the receiver has the bitmap ready before the reveal begins.
3. While you drag, only a tiny `{ progress, axis, dir }` payload is streamed
   (~60 fps). `progress` runs 0 → 1:
   - `0.0` — fully on the sender
   - `0.5` — half on each screen
   - `1.0` — fully on the receiver
4. The sender image follows your finger, scales up, and tilts with drag
   velocity. The receiver image slides in from the opposite edge with a
   luminous leading beam — at 50% progress exactly half is visible.
5. Release past ~45% (or flick fast — a "throw") and it commits: the image
   flies off the sender and lands on the receiver. Release short and both
   sides spring back.

### Gestures

- **Horizontal / vertical** — drag direction picks the exit edge; the image
  enters the receiver from the matching opposite edge.
- **Throw** — a fast flick past the velocity threshold completes the transfer
  even before reaching the distance threshold.

---

## What's fully working vs. extension points

This is a runnable core, built honestly. Clearly-scoped extension points are
marked in code rather than faked.

**Working end-to-end**
- Rooms: create / join by code, share link, QR code
- Live presence with device labels, online status, and battery (where the
  Battery API is available)
- Real-time synced drag transfer with the edge-reveal effect, throw gesture,
  commit/cancel, dark & light themes, mobile-first responsive layout
- Image intake for JPG / PNG / WEBP (+ HEIC where the browser decodes it),
  50 MB cap, downscale/compress to keep the animation smooth
- 24h room expiry, no server-side image storage (relay only, nothing
  persisted)

**Extension points (scaffolded, marked in code)**
- `client/src/webrtc/peerManager.js` — full WebRTC DataChannel manager wired
  to the server's `signal:*` relay. The active image path uses Socket.IO relay
  (always works without TURN); flip to P2P here when you add TURN servers.
- HEIC on non-Safari browsers — add `heic2any` as a decode fallback in
  `utils/image.js`.
- Multi-device (>2) is supported for presence and target-picking; the full
  10-node spatial graph UI is a layout extension.
- End-to-end encryption — relay currently rides Socket.IO over TLS in prod;
  true E2E rides the WebRTC DataChannel path above (DTLS) once enabled.

---

## Deploy

### Docker (both services)

```bash
docker compose up --build
# client → http://localhost:8080
# server → http://localhost:4000
```

In production set `CLIENT_ORIGIN` on the server to your client's origin, and
`VITE_SERVER_URL` at client build time to the server's public URL.

### Split hosting

- **Server**: any Node host (Render, Fly, Railway, a VM). It's stateless apart
  from in-memory rooms — add the Socket.IO Redis adapter to run multiple
  instances.
- **Client**: any static host (Vercel, Netlify, Cloudflare Pages). Build with
  `npm run build --prefix client`; serve `client/dist` with SPA fallback so
  `/room/:id` deep links resolve (see `client/nginx.conf`).

---

## Notes & honest caveats

- Web pages can't read a phone's real model name, so device labels are a
  friendly approximation from the user-agent.
- The Battery Status API is Chromium-only; elsewhere battery simply isn't
  shown.
- For transfers across different networks (not the same Wi-Fi), the WebRTC
  path needs a TURN server — STUN alone won't traverse every NAT.
