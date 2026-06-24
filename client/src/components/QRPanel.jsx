import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function QRPanel({ roomId }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/room/${roomId}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, link, {
      width: 188,
      margin: 1,
      color: { dark: '#0b0d14', light: '#ffffff' },
    }).catch(() => {});
  }, [link]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Magic Slide Transfer', url: link });
      } catch {
        /* dismissed */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="qr-panel">
      <div className="qr-frame">
        <canvas ref={canvasRef} />
      </div>
      <div className="qr-meta">
        <span className="eyebrow">Room code</span>
        <span className="room-code mono">{roomId}</span>
        <div className="qr-actions">
          <button className="btn btn-primary" onClick={share}>
            Share link
          </button>
          <button className="btn btn-ghost" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
