import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useRoomStore } from '../store/roomStore';
import { useProjectStore } from '../store/projectStore';
import CreateRoomModal from '../components/CreateRoomModal';
import CreateProjectModal from '../components/CreateProjectModal';
import JoinRoomModal from '../components/JoinRoomModal';
import toast from 'react-hot-toast';

const LANG_COLOR = {
  javascript:'#f7df1e', typescript:'#3178c6', python:'#3572A5',
  java:'#b07219', cpp:'#f34b7d', c:'#555', go:'#00ADD8',
  rust:'#dea584', html:'#e34c26', css:'#563d7c',
};
const LANG_ICON = {
  javascript:'JS', typescript:'TS', python:'PY', java:'JV',
  cpp:'C++', c:'C', go:'GO', rust:'RS', html:'HT', css:'CS',
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { rooms, fetchRooms, deleteRoom } = useRoomStore();
  const { projects, fetchProjects, deleteProject } = useProjectStore();
  const navigate = useNavigate();

  const [tab, setTab]                         = useState('rooms');
  const [showCreateRoom, setShowCreateRoom]   = useState(false);
  const [showJoinRoom, setShowJoinRoom]       = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [theme, setTheme]                     = useState(() => localStorage.getItem('cc_theme') || 'dark');
  const [search, setSearch]                   = useState('');
  const [menuOpen, setMenuOpen]               = useState(false);

  useEffect(() => { fetchRooms(); fetchProjects(); }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cc_theme', theme);
  }, [theme]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const copyId = (id) => { navigator.clipboard.writeText(id); toast.success('Room ID copied!'); };

  const filteredRooms    = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.language?.toLowerCase().includes(search.toLowerCase()));
  const filteredProjects = projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));


  return (
    <div className="db-root">

      {/* ── NAVBAR ── */}
      <header className="db-nav">
        <div className="db-nav-brand">
          <div className="db-logo">💻</div>
          <span className="db-logo-text">CodeCollab</span>
        </div>

        {/* desktop nav links */}
        <nav className="db-nav-links">
          <button className="db-nav-link db-nav-link--active">Dashboard</button>
          <button className="db-nav-link" onClick={() => setTab('rooms')}>Rooms</button>
          <button className="db-nav-link" onClick={() => setTab('projects')}>Projects</button>
        </nav>

        <div className="db-nav-right">
          <button className="db-icon-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* User avatar + dropdown */}
          <div className="db-user-wrap">
            <button className="db-user-btn" onClick={() => setMenuOpen(v => !v)}>
              <div className="db-avatar">{user?.username?.[0]?.toUpperCase()}</div>
              <span className="db-username">{user?.username}</span>
              <span className="db-chevron">▾</span>
            </button>
            {menuOpen && (
              <div className="db-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                <div className="db-dropdown-head">
                  <div className="db-dropdown-name">{user?.username}</div>
                  <div className="db-dropdown-email">{user?.email}</div>
                </div>
                <div className="db-dropdown-body">
                  <button className="db-dropdown-item db-dropdown-item--danger" onClick={handleLogout}>
                    🚪 Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="db-main">

        {/* Hero */}
        <div className="db-hero">
          <div>
            <h1 className="db-hero-title">Welcome back to CodeCollab, {user?.username} 👋</h1>
            <p className="db-hero-sub">Build, collaborate, and ship code together in real time.</p>
          </div>
        </div>

        {/* Search bar (full width on mobile) */}
        <div className="db-search-wrap">
          <span className="db-search-icon">🔍</span>
          <input className="db-search-input" type="text" placeholder="Search rooms & projects…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Stats */}
        <div className="db-stats">
          {[
            { icon:'🏠', label:'Public Rooms',  value: rooms.length,    color:'#1f6feb' },
            { icon:'📁', label:'My Projects',   value: projects.length, color:'#3fb950' },
            { icon:'📄', label:'Total Files',   value: projects.reduce((a,p) => a+(p.files?.length||0), 0), color:'#bc8cff' },
          ].map(s => (
            <div key={s.label} className="db-stat">
              <div className="db-stat-icon" style={{ background:`${s.color}18`, border:`1px solid ${s.color}30` }}>{s.icon}</div>
              <div>
                <div className="db-stat-value">{s.value}</div>
                <div className="db-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="db-actions">
          <button className="db-btn db-btn--primary" onClick={() => setShowCreateRoom(true)}>+ New Room</button>
          <button className="db-btn db-btn--secondary" onClick={() => setShowJoinRoom(true)}>🚪 Join Room</button>
          <button className="db-btn db-btn--secondary" onClick={() => setShowCreateProject(true)}>+ New Project</button>
        </div>

        {/* Tabs */}
        <div className="db-tabs">
          {['rooms','projects'].map(t => (
            <button key={t} className={`db-tab ${tab === t ? 'db-tab--active' : ''}`} onClick={() => setTab(t)}>
              {t === 'rooms' ? '🏠' : '📁'} {t.charAt(0).toUpperCase()+t.slice(1)}
              <span className={`db-tab-count ${tab === t ? 'db-tab-count--active' : ''}`}>
                {t === 'rooms' ? filteredRooms.length : filteredProjects.length}
              </span>
            </button>
          ))}
        </div>

        {/* Rooms */}
        {tab === 'rooms' && (
          filteredRooms.length === 0
            ? <EmptyState icon="🏠" title="No rooms yet"
                desc="Create a room and invite teammates to code together in real time."
                action="+ Create Room" onAction={() => setShowCreateRoom(true)} />
            : <div className="db-grid">
                {filteredRooms.map(room => (
                  <RoomCard key={room._id} room={room} user={user}
                    onEnter={() => navigate(`/room/${room.roomId}`)}
                    onCopy={() => copyId(room.roomId)}
                    onDelete={() => { deleteRoom(room.roomId); toast.success('Room deleted'); }} />
                ))}
              </div>
        )}

        {/* Projects */}
        {tab === 'projects' && (
          filteredProjects.length === 0
            ? <EmptyState icon="📁" title="No projects yet"
                desc="Create a project to save and manage your code files."
                action="+ New Project" onAction={() => setShowCreateProject(true)} />
            : <div className="db-grid">
                {filteredProjects.map(project => (
                  <ProjectCard key={project._id} project={project} user={user}
                    onOpen={() => navigate(`/project/${project._id}`)}
                    onDelete={() => { deleteProject(project._id); toast.success('Project deleted'); }} />
                ))}
              </div>
        )}
      </main>

      {showCreateRoom    && <CreateRoomModal    onClose={() => setShowCreateRoom(false)} />}
      {showJoinRoom      && <JoinRoomModal      onClose={() => setShowJoinRoom(false)} />}
      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}
    </div>
  );
}

function RoomCard({ room, user, onEnter, onCopy, onDelete }) {
  const langColor = LANG_COLOR[room.language] || '#7d8590';
  const langIcon  = LANG_ICON[room.language]  || '??';
  return (
    <div className="db-card">
      <div className="db-card-bar" style={{ background:`linear-gradient(90deg,${langColor},${langColor}33)` }} />
      <div className="db-card-body">
        <div className="db-card-head">
          <div className="db-card-lang-badge" style={{ background:`${langColor}18`, border:`1px solid ${langColor}30`, color:langColor }}>{langIcon}</div>
          <div className="db-card-info">
            <div className="db-card-title">{room.name}</div>
            <div className="db-card-meta">by {room.owner?.username} · {timeAgo(room.createdAt)}</div>
          </div>
          <span className={`db-badge ${room.isPrivate ? 'db-badge--warn' : 'db-badge--ok'}`}>
            {room.isPrivate ? '🔒' : '🌐'}
          </span>
        </div>

        <div className="db-card-id">
          <span className="db-card-id-text">{room.roomId}</span>
          <button className="db-card-id-copy" onClick={onCopy} title="Copy">📋</button>
        </div>

        <div className="db-card-actions">
          <button className="db-card-btn db-card-btn--enter" onClick={onEnter}>▶ Enter</button>
          <button className="db-card-btn db-card-btn--copy"  onClick={onCopy}>🔗</button>
          {room.owner?._id === user?._id &&
            <button className="db-card-btn db-card-btn--del" onClick={onDelete}>🗑</button>}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, user, onOpen, onDelete }) {
  const fileCount = project.files?.length || 0;
  return (
    <div className="db-card">
      <div className="db-card-bar" style={{ background:'linear-gradient(90deg,#3fb950,#3fb95033)' }} />
      <div className="db-card-body">
        <div className="db-card-head">
          <div className="db-card-lang-badge" style={{ background:'rgba(63,185,80,0.12)', border:'1px solid rgba(63,185,80,0.25)', fontSize:18 }}>📁</div>
          <div className="db-card-info">
            <div className="db-card-title">{project.title}</div>
            <div className="db-card-meta">by {project.owner?.username} · {timeAgo(project.updatedAt)}</div>
          </div>
          <span className={`db-badge ${project.isPublic ? 'db-badge--ok' : 'db-badge--muted'}`}>
            {project.isPublic ? '🌍' : '🔒'}
          </span>
        </div>

        {project.description && <p className="db-card-desc">{project.description}</p>}

        <span className="db-files-badge">📄 {fileCount} {fileCount === 1 ? 'file' : 'files'}</span>

        <div className="db-card-actions">
          <button className="db-card-btn db-card-btn--open" onClick={onOpen}>Open Editor</button>
          {project.owner?._id === user?._id &&
            <button className="db-card-btn db-card-btn--del" onClick={onDelete}>🗑</button>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div className="db-empty">
      <div className="db-empty-icon">{icon}</div>
      <h3 className="db-empty-title">{title}</h3>
      <p className="db-empty-desc">{desc}</p>
      <button className="db-btn db-btn--primary" onClick={onAction}>{action}</button>
    </div>
  );
}
