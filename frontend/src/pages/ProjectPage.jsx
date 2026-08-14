import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'html', 'css'];

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentProject, getProject, updateProject } = useProjectStore();

  const [files, setFiles] = useState([]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const autoSaveTimer = useRef(null);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);

  useEffect(() => {
    getProject(projectId).then((p) => {
      if (p) setFiles(p.files || []);
    });
  }, [projectId]);

  const activeFile = files[activeFileIdx];

  const handleCodeChange = (value) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeFileIdx ? { ...f, content: value } : f))
    );
    if (!isOwner) return;
    setSaved(false);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setSaving(true);
      await updateProject(projectId, {
        files: files.map((f, i) => (i === activeFileIdx ? { ...f, content: value } : f)),
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 2000);
  };

  const handleLanguageChange = (e) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === activeFileIdx ? { ...f, language: e.target.value } : f))
    );
  };

  const saveProject = async () => {
    setSaving(true);
    await updateProject(projectId, { files });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim();
    const ext = name.split('.').pop();
    const langMap = { js: 'javascript', ts: 'typescript', py: 'python', java: 'java', go: 'go', rs: 'rust', html: 'html', css: 'css', cpp: 'cpp', c: 'c' };
    const language = langMap[ext] || 'javascript';
    setFiles((prev) => [...prev, { name, content: '', language }]);
    setActiveFileIdx(files.length);
    setNewFileName('');
    setShowNewFile(false);
  };

  const removeFile = (idx) => {
    if (files.length === 1) return;
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setActiveFileIdx(Math.max(0, activeFileIdx - 1));
  };

  const isOwner = currentProject?.owner?._id === user?._id;

  return (
    <div className="room-layout">
      {/* Sidebar */}
      <aside className="room-sidebar">
        <div className="sidebar-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </div>

        <div className="sidebar-room-name">{currentProject?.title || 'Project'}</div>
        {currentProject?.description && (
          <p className="sidebar-desc">{currentProject.description}</p>
        )}

        <div className="sidebar-section">
          <label className="sidebar-label">Files</label>
          <ul className="file-list">
            {files.map((f, i) => (
              <li
                key={i}
                className={`file-item ${i === activeFileIdx ? 'active' : ''}`}
                onClick={() => setActiveFileIdx(i)}
              >
                <span className="file-name">{f.name}</span>
                {files.length > 1 && (
                  <button
                    className="btn btn-ghost btn-xs file-remove"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    aria-label={`Remove ${f.name}`}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>

          {showNewFile ? (
            <div className="new-file-form">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.js"
                onKeyDown={(e) => e.key === 'Enter' && addFile()}
                autoFocus
              />
              <button className="btn btn-primary btn-xs" onClick={addFile}>Add</button>
              <button className="btn btn-ghost btn-xs" onClick={() => setShowNewFile(false)}>✕</button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm mt-1" onClick={() => setShowNewFile(true)}>
              + Add file
            </button>
          )}
        </div>

        {/* Language for active file */}
        {activeFile && (
          <div className="sidebar-section">
            <label className="sidebar-label">Language</label>
            <select className="select" value={activeFile.language} onChange={handleLanguageChange}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}

        <button
          className="btn btn-primary btn-full mt-auto"
          onClick={saveProject}
          disabled={saving || !isOwner}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Project'}
        </button>
        {!isOwner && <p className="sidebar-note">View only — you're a collaborator</p>}
      </aside>

      {/* Editor */}
      <div className="room-editor">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleCodeChange}
            theme="vs-dark"
            path={activeFile.name}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              readOnly: !isOwner,
            }}
          />
        ) : (
          <div className="editor-empty">Select or add a file to start editing</div>
        )}
      </div>
    </div>
  );
}
