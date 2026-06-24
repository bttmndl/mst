import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useVelocity,
  animate,
} from 'framer-motion';
import { socket } from '../sockets/socket.js';
import { useStore } from '../store/useStore.js';

const FullscreenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const COMMIT_THRESHOLD = 0.45; // release past this to send
const THROW_VELOCITY = 1100; // px/s fast-swipe shortcut

export default function SenderImage({ targetId }) {
  const held = useStore((s) => s.heldImage);
  const setHeldImage = useStore((s) => s.setHeldImage);
  const setFullscreenImage = useStore((s) => s.setFullscreenImage);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const progressMV = useMotionValue(0);
  const vx = useVelocity(x);
  const rotate = useTransform(vx, [-1600, 1600], [-13, 13], { clamp: true });
  const opacity = useTransform(progressMV, [0, 1], [1, 0.28]);

  const [dragging, setDragging] = useState(false);
  const armed = useRef(false);
  const lastEmit = useRef(0);
  const drag = useRef({ axis: 'x', dir: 1, progress: 0 });
  const reach = useRef(600);

  useEffect(() => {
    const calc = () =>
      (reach.current = Math.min(window.innerWidth, window.innerHeight) * 0.6);
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  if (!held) return null;

  function armTransfer() {
    if (armed.current || !targetId) return;
    armed.current = true;
    socket.emit('transfer:image', {
      imageId: held.id,
      dataUrl: held.dataUrl,
      width: held.width,
      height: held.height,
      name: held.name,
      targetId,
    });
  }

  function emitProgress(progress, axis, dir) {
    if (!targetId) return;
    const now = performance.now();
    if (now - lastEmit.current < 16 && progress < 1) return; // ~60fps cap
    lastEmit.current = now;
    socket.emit('transfer:progress', {
      progress,
      axis,
      dir,
      targetId,
      imageId: held.id,
    });
  }

  function onDragStart() {
    setDragging(true);
    armTransfer();
    if (navigator.vibrate) navigator.vibrate(8);
  }

  function onDrag(_e, info) {
    const ox = info.offset.x;
    const oy = info.offset.y;
    const axis = Math.abs(ox) >= Math.abs(oy) ? 'x' : 'y';
    const val = axis === 'x' ? ox : oy;
    const dir = val >= 0 ? 1 : -1;
    const progress = Math.min(Math.abs(val) / reach.current, 1);
    drag.current = { axis, dir, progress };
    progressMV.set(progress);
    emitProgress(progress, axis, dir);
  }

  function onDragEnd(_e, info) {
    setDragging(false);
    const { axis, dir, progress } = drag.current;
    const v = axis === 'x' ? info.velocity.x : info.velocity.y;
    const thrown = Math.sign(v) === dir && Math.abs(v) > THROW_VELOCITY;

    if (progress >= COMMIT_THRESHOLD || thrown) {
      commit(axis, dir);
    } else {
      cancel();
    }
  }

  function commit(axis, dir) {
    if (navigator.vibrate) navigator.vibrate([6, 20, 6]);
    emitProgress(1, axis, dir);
    socket.emit('transfer:commit', { imageId: held.id, targetId });

    // Fly the local image fully off-screen, then release it.
    const off =
      axis === 'x'
        ? Math.sign(dir) * window.innerWidth
        : Math.sign(dir) * window.innerHeight;
    const mv = axis === 'x' ? x : y;
    animate(mv, off, { type: 'spring', stiffness: 220, damping: 26 });
    setTimeout(() => {
      armed.current = false;
      setHeldImage(null);
      x.set(0);
      y.set(0);
      progressMV.set(0);
    }, 280);
  }

  function cancel() {
    if (targetId) socket.emit('transfer:cancel', { imageId: held.id, targetId });
    armed.current = false;
    progressMV.set(0);
    animate(x, 0, { type: 'spring', stiffness: 320, damping: 30 });
    animate(y, 0, { type: 'spring', stiffness: 320, damping: 30 });
  }

  return (
    <motion.div
      className="sender-image"
      drag
      dragMomentum={false}
      dragElastic={0.16}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      style={{ x, y, rotate, opacity }}
      animate={{ scale: dragging ? 1.06 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <img src={held.dataUrl} alt={held.name || 'image to transfer'} draggable={false} />

      <button
        className="fs-trigger-btn"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setFullscreenImage({ id: held.id, dataUrl: held.dataUrl, name: held.name });
          socket.emit('fullscreen:show', {
            imageId: held.id,
            dataUrl: held.dataUrl,
            name: held.name,
          });
          if (navigator.vibrate) navigator.vibrate(6);
        }}
        aria-label="View fullscreen on all devices"
        title="View fullscreen on all devices"
      >
        <FullscreenIcon />
      </button>

      <div className="grab-hint">
        {targetId ? 'Drag toward a device to send' : 'Waiting for another device…'}
      </div>
      <button
        className="download-btn"
        onClick={(e) => {
          e.stopPropagation();
          const a = document.createElement('a');
          a.href = held.dataUrl;
          a.download = held.name || 'image.jpg';
          a.click();
        }}
        aria-label="Download image"
        title="Download image"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Download
      </button>
    </motion.div>
  );
}
