import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import { useStore } from '../store/useStore.js';

export default function TopBar({ roomId, onInvite }) {
  const navigate = useNavigate();
  const connected = useStore((s) => s.connected);

  return (
    <header className="topbar">
      <button className="back" onClick={() => navigate('/')} aria-label="Leave room">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="topbar-room">
        <span className={`status-dot ${connected ? 'on' : 'off'}`} />
        <span className="topbar-code mono">{roomId}</span>
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" onClick={onInvite} aria-label="Invite a device">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M14 14h3v3m4 0v4m0-7h0m-7 7h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
