import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore.js';

export default function FullscreenViewer() {
  const img = useStore((s) => s.fullscreenImage);
  const clear = useStore((s) => s.clearFullscreenImage);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') clear(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clear]);

  if (!img) return null;

  function download() {
    const a = document.createElement('a');
    a.href = img.dataUrl;
    a.download = img.name || 'image.jpg';
    a.click();
  }

  return (
    <motion.div
      className="fs-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={clear}
    >
      {/* beam glow corners */}
      <div className="fs-glow fs-glow-top" aria-hidden />
      <div className="fs-glow fs-glow-bottom" aria-hidden />

      <motion.img
        className="fs-img"
        src={img.dataUrl}
        alt={img.name || 'image'}
        initial={{ scale: 0.82, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 16 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      <motion.div
        className="fs-bar"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ delay: 0.08, duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="fs-name mono">{img.name || 'image'}</span>
        <div className="fs-actions-row">
          <button
            className="fs-action-btn"
            onClick={download}
            aria-label="Download image"
            title="Download"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="fs-action-btn"
            onClick={clear}
            aria-label="Exit fullscreen"
            title="Close (Esc)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
