/**
 * WebRTC signaling relay.
 *
 * The server never touches media — it only forwards offer/answer/ICE
 * between two peers in the same room so they can open a direct
 * RTCDataChannel. This is the upgrade path for true peer-to-peer binary
 * image transfer (see client/src/webrtc/peerManager.js).
 *
 * The live, always-works image path in this build relays the image once
 * over Socket.IO; these handlers exist so you can flip on P2P without
 * touching the room/presence layer.
 */
export function registerSignaling(io, socket) {
  socket.on('signal:offer', ({ targetId, sdp }) => {
    io.to(targetId).emit('signal:offer', { fromId: socket.id, sdp });
  });

  socket.on('signal:answer', ({ targetId, sdp }) => {
    io.to(targetId).emit('signal:answer', { fromId: socket.id, sdp });
  });

  socket.on('signal:ice', ({ targetId, candidate }) => {
    io.to(targetId).emit('signal:ice', { fromId: socket.id, candidate });
  });
}
