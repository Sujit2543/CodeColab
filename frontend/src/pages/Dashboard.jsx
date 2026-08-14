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
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function Avatar({ name, size = 32, color = '#1f6feb' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
      flexShrink: 0, letterSpacing: '-0.02em',
    }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const { rooms, fetchRooms, deleteRoom } = useRoomStore();
  const { projects, fetchProjects, deleteProject } = useProjectStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState('rooms');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('cc_theme') || 'dark');
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => { fetchRooms(); fetchProjects(); }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cc_theme', theme);
  }, [theme]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const copyId = (id) => { navigator.clipboard.writeText(id); toast.success('Room ID copied!'); };

  const filteredRooms = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.language?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── TOP NAV ─────────────────────────────────────────────── */}
      <header style={{
        height: 56, display:'flex', alignItems:'center',
        padding:'0 24px', background:'var(--bg2)',
        borderBottom:'1px solid var(--border)',
        position:'sticky', top:0, zIndex:100,
        gap: 16,
      }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:8 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'linear-gradient(135deg,#1f6feb,#388bfd)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, boxShadow:'0 2px 8px rgba(31,111,235,0.4)',
          }}>💻</div>
          <span style={{ fontSize:15, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em' }}>
            CodeCollab
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display:'flex', gap:2, flex:1 }}>
          {[
            { label:'Dashboard', active: true },
            { label:'Rooms', onClick: () => setTab('rooms') },
            { label:'Projects', onClick: () => setTab('projects') },
          ].map(item => (
            <button key={item.label} onClick={item.onClick}
              style={{
                padding:'5px 12px', borderRadius:6, border:'none',
                background: item.active ? 'var(--bg4)' : 'transparent',
                color: item.active ? 'var(--text)' : 'var(--text2)',
                fontSize:13, fontWeight:500, cursor:'pointer',
                fontFamily:'inherit', transition:'all 0.15s',
              }}
              onMouseEnter={e => { if(!item.active) e.target.style.background='var(--bg3)'; e.target.style.color='var(--text)'; }}
              onMouseLeave={e => { if(!item.active) e.target.style.background='transparent'; e.target.style.color='var(--text2)'; }}
            >{item.label}</button>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--text3)' }}>🔍</span>
            <input
              type="text" placeholder="Search…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width:180, paddingLeft:30, paddingRight:10,
                height:32, fontSize:12, background:'var(--bg3)',
                border:'1px solid var(--border)', borderRadius:6,
                color:'var(--text)',
              }}
            />
          </div>

          {/* Theme */}
          <button onClick={() => setTheme(t => t==='dark'?'light':'dark')}
            style={{ width:32, height:32, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg3)', cursor:'pointer', fontSize:14 }}
            title="Toggle theme"
          >{theme==='dark'?'☀️':'🌙'}</button>

          {/* User menu */}
          <div style={{ position:'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)',
                background:'var(--bg3)', cursor:'pointer', fontFamily:'inherit',
              }}
            >
              <Avatar name={user?.username} size={22} />
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{user?.username}</span>
              <span style={{ fontSize:10, color:'var(--text3)' }}>▼</span>
            </button>

            {userMenuOpen && (
              <div style={{
                position:'absolute', right:0, top:'calc(100% + 6px)',
                background:'var(--bg2)', border:'1px solid var(--border2)',
                borderRadius:8, width:200, boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
                zIndex:200, overflow:'hidden',
              }}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{user?.username}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{user?.email}</div>
                </div>
                <div style={{ padding:6 }}>
                  <button onClick={handleLogout}
                    style={{
                      width:'100%', padding:'8px 10px', borderRadius:5,
                      background:'transparent', border:'none', cursor:'pointer',
                      display:'flex', alignItems:'center', gap:8,
                      fontSize:13, color:'var(--danger)', fontFamily:'inherit', textAlign:'left',
                    }}
                  >🚪 Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main style={{ flex:1, padding:'32px 28px', maxWidth:1100, margin:'0 auto', width:'100%' }}>

        {/* ── HERO ROW ─────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em', marginBottom:4 }}>
              {greeting}, {user?.username} 👋
            </h1>
            <p style={{ fontSize:13, color:'var(--text2)' }}>
              Build, collaborate, and ship code together in real time.
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setShowCreateRoom(true)}
              style={{
                padding:'9px 18px', borderRadius:8, border:'none',
                background:'linear-gradient(135deg,#1f6feb,#388bfd)',
                color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
                fontFamily:'inherit', boxShadow:'0 2px 8px rgba(31,111,235,0.35)',
                display:'flex', alignItems:'center', gap:6,
              }}>
              <span style={{ fontSize:16 }}>+</span> New Room
            </button>
            <button onClick={() => setShowCreateProject(true)}
              style={{
                padding:'9px 18px', borderRadius:8,
                border:'1px solid var(--border2)',
                background:'var(--bg3)', color:'var(--text)',
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:6,
              }}>
              <span style={{ fontSize:16 }}>+</span> New Project
            </button>
            <button onClick={() => setShowJoinRoom(true)}
              style={{
                padding:'9px 18px', borderRadius:8,
                border:'1px solid var(--border2)',
                background:'var(--bg3)', color:'var(--text)',
                fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
              }}>
              🚪 Join Room
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ───────────────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
          {[
            { icon:'🏠', label:'Public Rooms', value: rooms.length, color:'#1f6feb', sub: rooms.length === 0 ? 'No rooms yet' : `${rooms.length} available` },
            { icon:'📁', label:'My Projects', value: projects.length, color:'#3fb950', sub: projects.length === 0 ? 'No projects yet' : `${projects.length} projects` },
            { icon:'📄', label:'Total Files', value: projects.reduce((a,p)=>a+(p.files?.length||0),0), color:'#bc8cff', sub:'Across all projects' },
          ].map(s => (
            <div key={s.label} style={{
              background:'var(--bg2)', border:'1px solid var(--border)',
              borderRadius:10, padding:'20px 22px',
              display:'flex', gap:16, alignItems:'center',
              transition:'border-color 0.2s, transform 0.15s',
              cursor:'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <div style={{
                width:48, height:48, borderRadius:12,
                background:`${s.color}18`, border:`1px solid ${s.color}30`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginTop:3 }}>{s.label}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ────────────────────────────── */}
        <div style={{
          background:'var(--bg2)', border:'1px solid var(--border)',
          borderRadius:10, padding:'16px 20px', marginBottom:28,
          display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
        }}>
          <span style={{ fontSize:12, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.07em', marginRight:4 }}>Quick Actions</span>
          {[
            { icon:'⚡', label:'Create Room', onClick:() => setShowCreateRoom(true), accent:'#1f6feb' },
            { icon:'🚪', label:'Join Room', onClick:() => setShowJoinRoom(true), accent:'#3fb950' },
            { icon:'📁', label:'New Project', onClick:() => setShowCreateProject(true), accent:'#bc8cff' },
          ].map(a => (
            <button key={a.label} onClick={a.onClick}
              style={{
                padding:'7px 14px', borderRadius:6,
                border:`1px solid ${a.accent}30`,
                background:`${a.accent}10`, color: a.accent,
                fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                display:'flex', alignItems:'center', gap:6,
                transition:'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background=`${a.accent}22`; }}
              onMouseLeave={e => { e.currentTarget.style.background=`${a.accent}10`; }}
            >{a.icon} {a.label}</button>
          ))}
        </div>

        {/* ── TABS + CONTENT ───────────────────────────── */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20, gap:0 }}>
          {['rooms','projects'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding:'10px 20px', background:'transparent', border:'none',
                borderBottom: tab===t ? '2px solid #1f6feb' : '2px solid transparent',
                color: tab===t ? 'var(--text)' : 'var(--text2)',
                fontSize:13, fontWeight: tab===t ? 600 : 500,
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                textTransform:'capitalize',
              }}
            >
              {t === 'rooms' ? '🏠' : '📁'} {t.charAt(0).toUpperCase()+t.slice(1)}
              <span style={{
                marginLeft:6, padding:'1px 7px', borderRadius:20,
                background: tab===t ? '#1f6feb20' : 'var(--bg3)',
                color: tab===t ? '#388bfd' : 'var(--text3)',
                fontSize:11, fontWeight:700,
              }}>
                {t==='rooms' ? filteredRooms.length : filteredProjects.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── ROOMS GRID ───────────────────────────────── */}
        {tab === 'rooms' && (
          filteredRooms.length === 0 ? (
            <EmptyState
              icon="🏠"
              title="No rooms yet"
              desc="Create a collaborative room and invite others to code together in real time."
              action="+ Create Room"
              onAction={() => setShowCreateRoom(true)}
            />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:14 }}>
              {filteredRooms.map(room => (
                <RoomCard
                  key={room._id} room={room} user={user}
                  onEnter={() => navigate(`/room/${room.roomId}`)}
                  onCopy={() => copyId(room.roomId)}
                  onDelete={() => { deleteRoom(room.roomId); toast.success('Room deleted'); }}
                />
              ))}
            </div>
          )
        )}

        {/* ── PROJECTS GRID ────────────────────────────── */}
        {tab === 'projects' && (
          filteredProjects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects yet"
              desc="Create a project to organize your code with multiple files and auto-save."
              action="+ New Project"
              onAction={() => setShowCreateProject(true)}
            />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:14 }}>
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project._id} project={project} user={user}
                  onOpen={() => navigate(`/project/${project._id}`)}
                  onDelete={() => { deleteProject(project._id); toast.success('Project deleted'); }}
                />
              ))}
            </div>
          )
        )}
      </main>

      {showCreateRoom    && <CreateRoomModal    onClose={() => setShowCreateRoom(false)} />}
      {showJoinRoom      && <JoinRoomModal      onClose={() => setShowJoinRoom(false)} />}
      {showCreateProject && <CreateProjectModal onClose={() => setShowCreateProject(false)} />}
    </div>
  );
}

/* ── Room Card Component ──────────────────────────────────────── */
function RoomCard({ room, user, onEnter, onCopy, onDelete }) {
  const langColor = LANG_COLOR[room.language] || '#7d8590';
  const langIcon  = LANG_ICON[room.language]  || '??';
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'var(--bg2)',
        border:`1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius:10, overflow:'hidden',
        transition:'all 0.2s', transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        display:'flex', flexDirection:'column',
      }}
    >
      {/* Color bar */}
      <div style={{ height:3, background:`linear-gradient(90deg, ${langColor}, ${langColor}44)` }} />

      <div style={{ padding:'16px 18px', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:8, flexShrink:0,
            background:`${langColor}18`, border:`1px solid ${langColor}30`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:800, color: langColor, fontFamily:'JetBrains Mono,monospace',
          }}>{langIcon}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {room.name}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
              by {room.owner?.username} · {timeAgo(room.createdAt)}
            </div>
          </div>
          <span style={{
            padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700,
            background: room.isPrivate ? 'rgba(210,153,34,0.15)' : 'rgba(63,185,80,0.12)',
            color: room.isPrivate ? '#d29922' : '#3fb950',
            border: `1px solid ${room.isPrivate ? 'rgba(210,153,34,0.3)' : 'rgba(63,185,80,0.3)'}`,
            flexShrink:0,
          }}>
            {room.isPrivate ? '🔒 Private' : '🌐 Public'}
          </span>
        </div>

        {/* Room ID */}
        <div style={{
          background:'var(--bg3)', border:'1px solid var(--border)',
          borderRadius:5, padding:'5px 9px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:8,
        }}>
          <span style={{ fontSize:10, fontFamily:'JetBrains Mono,monospace', color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
            {room.roomId}
          </span>
          <button onClick={onCopy}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:'var(--text3)', padding:'0 2px', flexShrink:0 }}
            title="Copy Room ID"
          >📋</button>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:7, marginTop:'auto' }}>
          <button onClick={onEnter}
            style={{
              flex:1, padding:'8px 0', borderRadius:6, border:'none',
              background:'linear-gradient(135deg,#1f6feb,#388bfd)',
              color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>▶ Enter Room</button>
          <button onClick={onCopy}
            style={{
              padding:'8px 12px', borderRadius:6,
              border:'1px solid var(--border2)', background:'var(--bg3)',
              color:'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:'inherit',
            }} title="Copy Room ID">🔗</button>
          {room.owner?._id === user?._id && (
            <button onClick={onDelete}
              style={{
                padding:'8px 12px', borderRadius:6,
                border:'1px solid rgba(248,81,73,0.3)', background:'rgba(248,81,73,0.08)',
                color:'#f85149', fontSize:12, cursor:'pointer', fontFamily:'inherit',
              }}>🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Project Card Component ───────────────────────────────────── */
function ProjectCard({ project, user, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const fileCount = project.files?.length || 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:'var(--bg2)',
        border:`1px solid ${hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius:10, overflow:'hidden',
        transition:'all 0.2s', transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        display:'flex', flexDirection:'column',
      }}
    >
      <div style={{ height:3, background:'linear-gradient(90deg, #3fb950, #3fb95044)' }} />
      <div style={{ padding:'16px 18px', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:8, flexShrink:0,
            background:'rgba(63,185,80,0.12)', border:'1px solid rgba(63,185,80,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
          }}>📁</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {project.title}
            </div>
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
              by {project.owner?.username} · {timeAgo(project.updatedAt)}
            </div>
          </div>
          <span style={{
            padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:700,
            background: project.isPublic ? 'rgba(63,185,80,0.12)' : 'rgba(125,133,144,0.12)',
            color: project.isPublic ? '#3fb950' : 'var(--text3)',
            border: `1px solid ${project.isPublic ? 'rgba(63,185,80,0.3)' : 'var(--border)'}`,
            flexShrink:0,
          }}>
            {project.isPublic ? '🌍 Public' : '🔒 Private'}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5, margin:0, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {project.description}
          </p>
        )}

        {/* File count badge */}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{
            padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600,
            background:'var(--bg3)', color:'var(--text2)', border:'1px solid var(--border)',
          }}>
            📄 {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:7, marginTop:'auto' }}>
          <button onClick={onOpen}
            style={{
              flex:1, padding:'8px 0', borderRadius:6, border:'none',
              background:'linear-gradient(135deg,#238636,#3fb950)',
              color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}>Open Editor</button>
          {project.owner?._id === user?._id && (
            <button onClick={onDelete}
              style={{
                padding:'8px 12px', borderRadius:6,
                border:'1px solid rgba(248,81,73,0.3)', background:'rgba(248,81,73,0.08)',
                color:'#f85149', fontSize:12, cursor:'pointer', fontFamily:'inherit',
              }}>🗑</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Empty State Component ────────────────────────────────────── */
function EmptyState({ icon, title, desc, action, onAction }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'60px 20px',
      background:'var(--bg2)', borderRadius:12,
      border:'1px dashed var(--border2)', textAlign:'center',
    }}>
      <div style={{ fontSize:52, marginBottom:16, opacity:0.6 }}>{icon}</div>
      <h3 style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{title}</h3>
      <p style={{ fontSize:13, color:'var(--text2)', maxWidth:280, lineHeight:1.6, marginBottom:20 }}>{desc}</p>
      <button onClick={onAction}
        style={{
          padding:'9px 20px', borderRadius:8, border:'none',
          background:'linear-gradient(135deg,#1f6feb,#388bfd)',
          color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
          boxShadow:'0 2px 8px rgba(31,111,235,0.35)',
        }}>{action}</button>
    </div>
  );
}
