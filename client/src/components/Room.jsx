import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import TopBar from './TopBar.jsx';
import DeviceList from './DeviceList.jsx';
import Uploader from './Uploader.jsx';
import SenderImage from './SenderImage.jsx';
import ReceiveLayer from './ReceiveLayer.jsx';
import QRPanel from './QRPanel.jsx';
import { useRoom } from '../hooks/useRoom.js';
import { useStore } from '../store/useStore.js';

export default function Room() {
  const { roomId } = useParams();
  useRoom(roomId);

  const members = useStore((s) => s.members);
  const selfId = useStore((s) => s.selfId);
  const heldImage = useStore((s) => s.heldImage);
  const incoming = useStore((s) => s.incoming);

  const [picked, setPicked] = useState(null);
  const [showInvite, setShowInvite] = useState(false);

  const others = useMemo(
    () => members.filter((m) => m.id !== selfId),
    [members, selfId]
  );
  const targetId =
    picked && others.some((o) => o.id === picked) ? picked : others[0]?.id || null;

  const alone = others.length === 0;

  return (
    <div className="room">
      <TopBar roomId={roomId} onInvite={() => setShowInvite((v) => !v)} />

      <DeviceList targetId={targetId} onPickTarget={setPicked} />

      <main className="stage">
        <ReceiveLayer />

        {!incoming && (
          <AnimatePresence mode="wait">
            {heldImage ? (
              <SenderImage key="sender" targetId={targetId} />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="stage-empty"
              >
                <Uploader />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {incoming && (
          <div className="stage-hint mono">receiving · {incoming.name || 'image'}</div>
        )}
      </main>

      <AnimatePresence>
        {(showInvite || alone) && (
          <motion.div
            className="invite-sheet glass"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="invite-head">
              <p className="invite-title">
                {alone ? 'Waiting for a device to join' : 'Invite a device'}
              </p>
              {!alone && (
                <button className="icon-btn" onClick={() => setShowInvite(false)} aria-label="Close">
                  ✕
                </button>
              )}
            </div>
            <QRPanel roomId={roomId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
