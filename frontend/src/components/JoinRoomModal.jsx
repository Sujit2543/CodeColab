import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function extractRoomId(input) {
  const trimmed = input.trim();
  // If it looks like a URL containing /room/, extract the ID
  const match = trimmed.match(/\/room\/([^/?#]+)/);
  if (match) return match[1];
  return trimmed;
}

export default function JoinRoomModal({ onClose }) {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const roomId = extractRoomId(input);
    if (!roomId) return;
    onClose();
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Join Room">
      <div className="modal">
        <div className="modal-header">
          <h2>Join a Room</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="join-room-id">Room ID or Link</label>
            <input
              id="join-room-id"
              type="text"
              placeholder="Paste Room ID or full link"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
              autoFocus
            />
            <span className="form-hint">
              Accepts a Room ID (e.g. <code>abc-123</code>) or a full link (e.g. <code>http://localhost:5173/room/abc-123</code>)
            </span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Join</button>
          </div>
        </form>
      </div>
    </div>
  );
}
