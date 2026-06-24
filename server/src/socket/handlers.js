import { roomManager } from '../rooms/roomManager.js';
import { registerSignaling } from '../signaling/signaling.js';

function broadcastPresence(io, roomId) {
  const members = roomManager.listMembers(roomId).map((m) => ({
    id: m.id,
    name: m.name,
    platform: m.platform,
    battery: m.battery,
    online: true,
  }));
  io.to(roomId).emit('presence:update', { members });
}

export function registerHandlers(io, socket) {
  let currentRoom = null;

  socket.on('room:join', ({ roomId, name, platform, battery } = {}, ack) => {
    if (!roomId) {
      if (typeof ack === 'function') ack({ ok: false, error: 'roomId required' });
      return;
    }
    const room = roomManager.ensureRoom(roomId);
    currentRoom = room.id;

    socket.join(room.id);
    roomManager.addMember(room.id, {
      id: socket.id,
      name: name || 'Device',
      platform: platform || 'unknown',
      battery: typeof battery === 'number' ? battery : null,
    });

    if (typeof ack === 'function') {
      ack({ ok: true, roomId: room.id, selfId: socket.id });
    }
    broadcastPresence(io, room.id);
  });

  // Lightweight live drag sync. Fired many times per second — keep it tiny.
  // { progress: 0..1, axis: 'x'|'y', dir: 1|-1, targetId, imageId }
  socket.on('transfer:progress', (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('transfer:progress', {
      ...payload,
      fromId: socket.id,
    });
  });

  // Image payload, sent once when a transfer is armed so the receiver has
  // the bitmap ready before the reveal animation begins.
  // { imageId, dataUrl, width, height, name, targetId }
  socket.on('transfer:image', (payload) => {
    if (!currentRoom) return;
    const { targetId } = payload || {};
    const out = { ...payload, fromId: socket.id };
    if (targetId) io.to(targetId).emit('transfer:image', out);
    else socket.to(currentRoom).emit('transfer:image', out);
  });

  // Commit: the image has fully landed on the receiver.
  socket.on('transfer:commit', (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('transfer:commit', { ...payload, fromId: socket.id });
  });

  // Cancel: sender released below threshold — receiver should retract.
  socket.on('transfer:cancel', (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('transfer:cancel', { ...payload, fromId: socket.id });
  });


  // WebRTC offer/answer/ICE relay (P2P upgrade path).
  registerSignaling(io, socket);

  function leave() {
    if (!currentRoom) return;
    const roomId = currentRoom;
    roomManager.removeMember(roomId, socket.id);
    socket.to(roomId).emit('presence:left', { id: socket.id });
    broadcastPresence(io, roomId);
    currentRoom = null;
  }

  socket.on('room:leave', leave);
  socket.on('disconnect', leave);
}
