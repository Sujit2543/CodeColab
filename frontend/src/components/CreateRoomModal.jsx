import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/roomStore';
import toast from 'react-hot-toast';

const LANGUAGES = ['javascript','typescript','python','java','cpp','c','go','rust','html','css'];

export default function CreateRoomModal({ onClose }) {
  const [form, setForm] = useState({ name: '', language: 'javascript', isPrivate: false, password: '' });
  const { createRoom, loading } = useRoomStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createRoom(form);
    if (res.success) { onClose(); navigate(`/room/${res.room.roomId}`); }
    else toast.error(res.message || 'Failed to create room');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🏠 Create a Room</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Room Name</label>
            <input name="name" type="text" placeholder="My Awesome Room"
              value={form.name} onChange={handleChange} required maxLength={100} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select name="language" className="select" value={form.language} onChange={handleChange}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="checkbox-label">
              <input name="isPrivate" type="checkbox" checked={form.isPrivate} onChange={handleChange} />
              🔒 Private Room (requires password to join)
            </label>
          </div>
          {form.isPrivate && (
            <div className="form-group">
              <label className="form-label">Room Password</label>
              <input name="password" type="password" placeholder="Set a password"
                value={form.password} onChange={handleChange} />
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : '+ Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
