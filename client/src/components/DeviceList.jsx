import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore.js';
import { detectDevice } from '../utils/device.js';

const PLATFORM_EMOJI = {
  iPhone: '📱',
  iPad: '📱',
  Pixel: '📱',
  Galaxy: '📱',
  Android: '📱',
  Mac: '💻',
  Windows: '💻',
  Linux: '💻',
  Device: '📱',
};

export default function DeviceList({ targetId, onPickTarget }) {
  const members = useStore((s) => s.members);
  const selfId = useStore((s) => s.selfId);

  return (
    <div className="device-list">
      <span className="eyebrow">Nearby devices · {members.length}</span>
      <ul>
        <AnimatePresence initial={false}>
          {members.map((m) => {
            const isSelf = m.id === selfId;
            const isTarget = m.id === targetId;
            const emoji = PLATFORM_EMOJI[m.platform] || detectDevice().emoji;
            return (
              <motion.li
                key={m.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`device${isTarget ? ' is-target' : ''}${isSelf ? ' is-self' : ''}`}
                onClick={() => !isSelf && onPickTarget?.(m.id)}
              >
                <span className="device-emoji">{emoji}</span>
                <span className="device-name">
                  {m.name}
                  {isSelf && <em> · you</em>}
                </span>
                <span className="device-side">
                  {typeof m.battery === 'number' && (
                    <span className="battery mono">{m.battery}%</span>
                  )}
                  <span className="dot online" aria-label="online" />
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
