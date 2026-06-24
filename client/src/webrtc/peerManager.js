/**
 * WebRTC peer manager (P2P upgrade path).
 * ----------------------------------------
 * This build's live image path relays the bitmap once through Socket.IO,
 * which always works without a TURN server. For true peer-to-peer binary
 * transfer (lower latency, no server bandwidth, chunked large files), this
 * manager opens an RTCDataChannel between two peers using the server's
 * signal:offer / signal:answer / signal:ice relay.
 *
 * It is intentionally framework-free so you can wire it into the transfer
 * flow when you're ready. Provide your own TURN servers for cross-NAT use.
 */

const ICE = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  // Add TURN here for reliable cross-network connectivity:
  // { urls: 'turn:your.turn:3478', username: '...', credential: '...' }
};

const CHUNK = 16 * 1024; // 16 KB datachannel chunks

export class PeerManager {
  constructor(socket) {
    this.socket = socket;
    /** @type {Map<string, RTCPeerConnection>} */
    this.peers = new Map();
    this.onImage = null; // (peerId, { buffer, meta }) => void

    socket.on('signal:offer', (m) => this._onOffer(m));
    socket.on('signal:answer', (m) => this._onAnswer(m));
    socket.on('signal:ice', (m) => this._onIce(m));
  }

  _peer(targetId) {
    if (this.peers.has(targetId)) return this.peers.get(targetId);
    const pc = new RTCPeerConnection(ICE);
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.socket.emit('signal:ice', { targetId, candidate: e.candidate });
      }
    };
    pc.ondatachannel = (e) => this._wireReceive(targetId, e.channel);
    this.peers.set(targetId, pc);
    return pc;
  }

  async sendImage(targetId, arrayBuffer, meta) {
    const pc = this._peer(targetId);
    const dc = pc.createDataChannel('image');
    dc.binaryType = 'arraybuffer';
    await new Promise((res) => (dc.onopen = res));

    dc.send(JSON.stringify({ kind: 'meta', meta, size: arrayBuffer.byteLength }));
    for (let off = 0; off < arrayBuffer.byteLength; off += CHUNK) {
      dc.send(arrayBuffer.slice(off, off + CHUNK));
    }
    dc.send(JSON.stringify({ kind: 'end' }));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.socket.emit('signal:offer', { targetId, sdp: offer });
  }

  _wireReceive(peerId, dc) {
    dc.binaryType = 'arraybuffer';
    let meta = null;
    const chunks = [];
    dc.onmessage = (e) => {
      if (typeof e.data === 'string') {
        const msg = JSON.parse(e.data);
        if (msg.kind === 'meta') meta = msg.meta;
        if (msg.kind === 'end' && this.onImage) {
          const buffer = new Blob(chunks);
          this.onImage(peerId, { buffer, meta });
        }
      } else {
        chunks.push(e.data);
      }
    };
  }

  async _onOffer({ fromId, sdp }) {
    const pc = this._peer(fromId);
    await pc.setRemoteDescription(sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.socket.emit('signal:answer', { targetId: fromId, sdp: answer });
  }

  async _onAnswer({ fromId, sdp }) {
    const pc = this.peers.get(fromId);
    if (pc) await pc.setRemoteDescription(sdp);
  }

  async _onIce({ fromId, candidate }) {
    const pc = this.peers.get(fromId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* ignore late candidates */
      }
    }
  }

  closeAll() {
    for (const pc of this.peers.values()) pc.close();
    this.peers.clear();
  }
}
