import { useRef } from 'react';
import { useStore } from '../store/useStore.js';

// Sender drag direction → which edge the image enters from on the receiver.
// The image keeps travelling in the same world-direction across the gap.
function entryEdge(axis, dir) {
  if (axis === 'x') return dir >= 0 ? 'left' : 'right';
  return dir >= 0 ? 'top' : 'bottom';
}

export default function ReceiveLayer() {
  const incoming = useStore((s) => s.incoming);
  const progress = useStore((s) => s.incomingProgress);
  const axis = useStore((s) => s.incomingAxis);
  const dir = useStore((s) => s.incomingDir);

  if (!incoming) return null;

  const edge = entryEdge(axis, dir);
  const hidden = (1 - Math.min(Math.max(progress, 0), 1)) * 100;

  // Pin the image to the entry edge and slide it in by `progress`.
  const pos = {};
  let transform = '';
  if (edge === 'left') {
    pos.left = 0;
    transform = `translateX(-${hidden}%)`;
  } else if (edge === 'right') {
    pos.right = 0;
    transform = `translateX(${hidden}%)`;
  } else if (edge === 'top') {
    pos.top = 0;
    transform = `translateY(-${hidden}%)`;
  } else {
    pos.bottom = 0;
    transform = `translateY(${hidden}%)`;
  }

  const beamClass = `edge-beam edge-${edge}`;
  const beamOpacity = Math.sin(Math.min(progress, 1) * Math.PI); // brightest mid-transfer
  const frameRef = useRef(null);

  function toggleFullscreen() {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else if (el.requestFullscreen) {
      el.requestFullscreen?.();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen?.();
    }
  }

  return (
    <div className="receive-layer" aria-live="polite">
      <div
        ref={frameRef}
        className={`receive-frame edge-anchor-${edge}`}
        style={pos}
        onClick={toggleFullscreen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleFullscreen()}
      >
        <img
          src={incoming.dataUrl}
          alt={incoming.name || 'incoming image'}
          style={{ transform }}
          draggable={false}
        />
      </div>
      <div className={beamClass} style={{ opacity: beamOpacity }} aria-hidden />
    </div>
  );
}
