import { customAlphabet } from 'nanoid';

// Human-friendly room codes: no ambiguous chars (0/O, 1/I/L).
const codeId = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 6);

const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24h, per spec

/**
 * In-memory room store. For a single-node deployment this is enough.
 * To scale horizontally, back this with Redis and use the Socket.IO
 * Redis adapter — the interface below stays the same.
 */
class RoomManager {
  constructor() {
    /** @type {Map<string, {id:string, createdAt:number, members:Map<string,object>}>} */
    this.rooms = new Map();
    // Reap expired rooms every 10 minutes.
    this.sweeper = setInterval(() => this.reap(), 10 * 60 * 1000);
  }

  createRoom() {
    let id = codeId();
    while (this.rooms.has(id)) id = codeId();
    const room = { id, createdAt: Date.now(), members: new Map() };
    this.rooms.set(id, room);
    return room;
  }

  ensureRoom(id) {
    const code = String(id || '').toUpperCase();
    if (!this.rooms.has(code)) {
      this.rooms.set(code, { id: code, createdAt: Date.now(), members: new Map() });
    }
    return this.rooms.get(code);
  }

  getRoom(id) {
    return this.rooms.get(String(id || '').toUpperCase());
  }

  addMember(roomId, member) {
    const room = this.ensureRoom(roomId);
    room.members.set(member.id, member);
    return room;
  }

  removeMember(roomId, memberId) {
    const room = this.getRoom(roomId);
    if (!room) return null;
    room.members.delete(memberId);
    if (room.members.size === 0) this.rooms.delete(room.id);
    return room;
  }

  listMembers(roomId) {
    const room = this.getRoom(roomId);
    if (!room) return [];
    return [...room.members.values()];
  }

  reap() {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      if (now - room.createdAt > ROOM_TTL_MS) this.rooms.delete(id);
    }
  }
}

export const roomManager = new RoomManager();
export { ROOM_TTL_MS };
