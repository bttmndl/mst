import { useEffect } from 'react';
import { socket, connectSocket } from '../sockets/socket.js';
import { useStore } from '../store/useStore.js';
import { detectDevice, readBattery } from '../utils/device.js';

// rAF tween for the incoming reveal progress (land / retract).
function tweenProgress(from, to, ms, onFrame, onDone) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / ms, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    onFrame(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  }
  requestAnimationFrame(step);
}

/**
 * Connects to the server, joins `roomId`, and keeps the store in sync with
 * presence + incoming transfer events. Returns nothing — read state from
 * useStore in components.
 */
export function useRoom(roomId) {
  const setSession = useStore((s) => s.setSession);
  const setConnected = useStore((s) => s.setConnected);
  const setMembers = useStore((s) => s.setMembers);
  const beginIncoming = useStore((s) => s.beginIncoming);
  const setIncomingProgress = useStore((s) => s.setIncomingProgress);
  const commitIncoming = useStore((s) => s.commitIncoming);
  const cancelIncoming = useStore((s) => s.cancelIncoming);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    connectSocket();

    async function join() {
      const device = detectDevice();
      const battery = await readBattery();
      socket.emit(
        'room:join',
        { roomId, name: device.name, platform: device.platform, battery },
        (res) => {
          if (active && res?.ok) {
            setSession({ roomId: res.roomId, selfId: res.selfId });
          }
        }
      );
    }

    const onConnect = () => {
      setConnected(true);
      join();
    };
    const onDisconnect = () => setConnected(false);
    const onPresence = ({ members }) => setMembers(members || []);

    const isForMe = (p) => !p?.targetId || p.targetId === useStore.getState().selfId;

    const onImage = (img) => {
      if (!isForMe(img)) return;
      beginIncoming({
        id: img.imageId,
        dataUrl: img.dataUrl,
        width: img.width,
        height: img.height,
        name: img.name,
        fromId: img.fromId,
      }, !!img.fullscreen);
    };

    const onProgress = (p) => {
      if (!isForMe(p)) return;
      setIncomingProgress(p.progress, p.axis, p.dir);
    };

    const onCommit = (p) => {
      if (!isForMe(p)) return;
      const cur = useStore.getState().incomingProgress;
      tweenProgress(cur, 1, 180, (v) => setIncomingProgress(v), () => commitIncoming(!!p.fullscreen));
    };

    const onCancel = (p) => {
      if (!isForMe(p)) return;
      const cur = useStore.getState().incomingProgress;
      tweenProgress(cur, 0, 240, (v) => setIncomingProgress(v), () => cancelIncoming());
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('presence:update', onPresence);
    socket.on('transfer:image', onImage);
    socket.on('transfer:progress', onProgress);
    socket.on('transfer:commit', onCommit);
    socket.on('transfer:cancel', onCancel);

    if (socket.connected) onConnect();

    return () => {
      active = false;
      socket.emit('room:leave');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('presence:update', onPresence);
      socket.off('transfer:image', onImage);
      socket.off('transfer:progress', onProgress);
      socket.off('transfer:commit', onCommit);
      socket.off('transfer:cancel', onCancel);
    };
  }, [roomId]);
}
