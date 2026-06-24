import { useRef, useState } from 'react';
import { processImage } from '../utils/image.js';
import { useStore } from '../store/useStore.js';
import { uid } from '../utils/device.js';

export default function Uploader() {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const setHeldImage = useStore((s) => s.setHeldImage);

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const img = await processImage(file);
      setHeldImage({ id: uid(), ...img });
    } catch (e) {
      setError(e.message || 'Could not read that image');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="uploader"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="uploader-icon" aria-hidden>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <p className="uploader-title">{busy ? 'Preparing…' : 'Drop a photo to send'}</p>
      <p className="uploader-sub">
        {error || 'JPG · PNG · WEBP · HEIC · up to 50 MB'}
      </p>
    </div>
  );
}
