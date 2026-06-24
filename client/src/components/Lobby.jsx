import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle.jsx';
import { uid, normalizeRoom } from '../utils/device.js';

export default function Lobby() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  function create() {
    navigate(`/room/${uid(6).toUpperCase().replace(/[^A-Z0-9]/g, 'X')}`);
  }
  function join() {
    const c = normalizeRoom(code);
    if (c.length >= 4) navigate(`/room/${c}`);
  }

  return (
    <div className="lobby">
      <header className="lobby-top">
        <span className="brandmark mono">MST</span>
        <ThemeToggle />
      </header>

      <motion.main
        className="lobby-main"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="beam-orb" aria-hidden />
        <p className="eyebrow">Spatial photo transfer</p>
        <h1 className="hero-title">
          Pull a photo out of one screen,
          <br />
          <span className="beam-text">push it into another.</span>
        </h1>
        <p className="hero-sub">
          Open this on two devices, drag toward the edge, and watch the image
          travel between them in real time.
        </p>

        <div className="lobby-actions glass">
          <button className="btn btn-primary lobby-create" onClick={create}>
            Create a room
          </button>
          <div className="divider"><span>or join</span></div>
          <div className="join-row">
            <input
              value={code}
              onChange={(e) => setCode(normalizeRoom(e.target.value))}
              placeholder="CODE"
              inputMode="text"
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && join()}
            />
            <button className="btn btn-ghost" onClick={join} disabled={code.length < 4}>
              Join
            </button>
          </div>
        </div>
      </motion.main>

      <footer className="lobby-foot">
        Peer-to-peer · No image is stored · Rooms vanish after 24h
      </footer>
    </div>
  );
}
