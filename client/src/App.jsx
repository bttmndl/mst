import { Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './components/Lobby.jsx';
import Room from './components/Room.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/room/:roomId" element={<Room />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
