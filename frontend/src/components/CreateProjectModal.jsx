import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import toast from 'react-hot-toast';

export default function CreateProjectModal({ onClose }) {
  const [form, setForm] = useState({ title: '', description: '', isPublic: false });
  const { createProject } = useProjectStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createProject(form);
    if (res.success) { onClose(); navigate(`/project/${res.project._id}`); }
    else toast.error(res.message || 'Failed to create project');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">📁 New Project</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Project Title</label>
            <input name="title" type="text" placeholder="My Cool Project"
              value={form.title} onChange={handleChange} required maxLength={100} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Description <span style={{ color: 'var(--text3)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <textarea name="description" placeholder="What is this project about?" rows={3}
              value={form.description} onChange={handleChange} maxLength={500} />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input name="isPublic" type="checkbox" checked={form.isPublic} onChange={handleChange} />
              🌍 Public Project (visible to everyone)
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">+ Create Project</button>
          </div>
        </form>
      </div>
    </div>
  );
}
