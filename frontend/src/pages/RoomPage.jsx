import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import api from '../api/axios';
import toast from 'react-hot-toast';

const LANGUAGES = ['javascript','typescript','python','java','cpp','c','go','rust','html','css'];
const MONACO_LANG_MAP = { cpp:'cpp', c:'c', go:'go', rust:'rust' };
const monacoLang = (lang) => MONACO_LANG_MAP[lang] || lang;

const JUDGE0_LANG = {
  javascript:63, typescript:74, python:71, java:62,
  cpp:54, c:50, go:60, rust:73, html:43, css:41,
};

const USER_COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8','#F7DC6F','#FF8C94','#A8E6CF'];

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socketRef, connect, disconnect } = useSocket();

  const [code, setCode]             = useState('// Loading…');
  const [language, setLanguage]     = useState('javascript');
  const [roomName, setRoomName]     = useState('');
  const [users, setUsers]           = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]   = useState('');
  const [showChat, setShowChat]     = useState(false);
  const [connected, setConnected]   = useState(false);
  const [error, setError]           = useState('');
  const [password, setPassword]     = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [output, setOutput]         = useState(null);
  const [running, setRunning]       = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [versions, setVersions]     = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [fontSize, setFontSize]     = useState(14);
  const [typingUser, setTypingUser] = useState('');
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // mobile toggle

  const chatEndRef       = useRef(null);
  const isRemoteChange   = useRef(false);
  const saveTimer        = useRef(null);
  const typingTimer      = useRef(null);

  const shareLink = `${window.location.origin}/room/${roomId}`;

  const joinRoom = useCallback((pw = '') => {
    const socket = connect();
    if (!socket) return;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.emit('room:join', { roomId, username: user?.username, password: pw }, (response) => {
      if (response.error) {
        if (response.error.toLowerCase().includes('password')) setNeedPassword(true);
        else setError(response.error);
        return;
      }
      setCode(response.code || '// Start coding here\n');
      setLanguage(response.language || 'javascript');
      setRoomName(response.roomName);
      setUsers(response.users || []);
      setNeedPassword(false);
    });

    socket.on('code:update',     ({ code: incoming }) => { isRemoteChange.current = true; setCode(incoming); });
    socket.on('language:update', ({ language: lang }) => setLanguage(lang));
    socket.on('room:userJoined', (u) => {
      setUsers(prev => [...prev, u]);
      setChatMessages(m => [...m, { id: Date.now(), system: true, message: `${u.username} joined` }]);
    });
    socket.on('room:userLeft', (u) => {
      setUsers(prev => prev.filter(x => x.socketId !== u.socketId));
      setChatMessages(m => [...m, { id: Date.now(), system: true, message: `${u.username} left` }]);
    });
    socket.on('chat:message', (msg) => setChatMessages(m => [...m, msg]));
    socket.on('chat:typing', ({ username }) => {
      if (username === user?.username) return;
      setTypingUser(username);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(''), 2500);
    });
  }, [roomId, user, connect]);

  useEffect(() => {
    if (user) joinRoom();
    return () => {
      socketRef.current?.emit('room:leave', { roomId, username: user?.username });
      disconnect();
    };
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleEditorChange = (value) => {
    if (isRemoteChange.current) { isRemoteChange.current = false; return; }
    setCode(value);
    setSaveStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      socketRef.current?.emit('code:change', { roomId, code: value, username: user?.username });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1500);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    socketRef.current?.emit('language:change', { roomId, language: lang, username: user?.username });
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit('chat:message', { roomId, message: chatInput.trim(), username: user?.username });
    setChatInput('');
  };

  const handleChatTyping = (e) => {
    setChatInput(e.target.value);
    socketRef.current?.emit('chat:typing', { roomId, username: user?.username });
  };

  const copyToClipboard = (text, label = 'Copied!') => {
    navigator.clipboard.writeText(text);
    setShareCopied(true);
    toast.success(label);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const runCode = async () => {
    const langId = JUDGE0_LANG[language];
    if (!langId) { setOutput({ error: `Execution not supported for ${language}` }); setShowOutput(true); return; }
    setRunning(true); setShowOutput(true); setOutput(null);
    try {
      const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, language_id: langId, stdin: '' }),
      });
      setOutput(await res.json());
    } catch { setOutput({ error: 'Execution service unavailable. Try again.' }); }
    finally { setRunning(false); }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/rooms/${roomId}/versions`);
      setVersions((data.versions || []).slice().reverse());
    } catch { setVersions([]); }
    finally { setLoadingHistory(false); }
  };

  const toggleHistory = () => { if (!showHistory) loadHistory(); setShowHistory(v => !v); };

  const restoreVersion = (v) => {
    isRemoteChange.current = true;
    setCode(v.code); setLanguage(v.language);
    socketRef.current?.emit('code:change', { roomId, code: v.code, username: user?.username });
    socketRef.current?.emit('language:change', { roomId, language: v.language, username: user?.username });
    setShowHistory(false);
    toast.success('Version restored');
  };

  const outputText = output
    ? (output.error || output.stdout || output.stderr || output.compile_output || output.status?.description || 'No output')
    : '';

  /* ── Password Gate ── */
  if (needPassword) return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo"><div className="auth-logo-icon">🔒</div>Private Room</div>
        <p style={{ color:'var(--text2)', marginBottom:20 }}>This room requires a password to join.</p>
        <form onSubmit={(e) => { e.preventDefault(); joinRoom(password); }} className="auth-form">
          <div className="form-group">
            <label className="form-label">Room Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required autoFocus />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg">Join Room →</button>
        </form>
        <button className="btn btn-ghost btn-full" style={{ marginTop:10 }} onClick={() => navigate('/dashboard')}>← Back</button>
      </div>
    </div>
  );

  /* ── Error Gate ── */
  if (error) return (
    <div className="room-error">
      <div style={{ fontSize:48 }}>❌</div>
      <h2 style={{ fontSize:20, fontWeight:700 }}>{error}</h2>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
    </div>
  );

  /* ── Main Room UI ── */
  return (
    <div className="room-layout">

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className={`room-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

        {/* Header */}
        <div className="sidebar-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ fontSize:12, padding:'4px 8px' }}>
            ← Back
          </button>
          <span className={`conn-pill ${connected ? 'connected' : 'disconnected'}`}>
            <span className="conn-dot" />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Room name + save status */}
        <div style={{ padding:'10px 14px 4px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', wordBreak:'break-word', lineHeight:1.3 }}>
            {roomName || 'Loading…'}
          </div>
          {saveStatus && (
            <div style={{ fontSize:11, marginTop:3, color: saveStatus==='saving' ? 'var(--text3)' : 'var(--green)', fontWeight:500 }}>
              {saveStatus === 'saving' ? '● Saving…' : '✓ Saved'}
            </div>
          )}
        </div>

        {/* ── ONLINE USERS COUNT BANNER ── */}
        <div style={{
          margin:'8px 10px',
          background: connected ? 'var(--green-bg)' : 'var(--bg3)',
          border:`1px solid ${connected ? 'rgba(63,185,80,0.3)' : 'var(--border)'}`,
          borderRadius:8, padding:'8px 12px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:16 }}>👥</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
                {users.length} online
              </div>
              <div style={{ fontSize:10, color:'var(--text3)' }}>in this room</div>
            </div>
          </div>
          <button
            onClick={() => setShowSharePanel(v => !v)}
            style={{
              padding:'4px 10px', borderRadius:6, border:'1px solid rgba(63,185,80,0.35)',
              background:'var(--green-bg)', color:'var(--green)',
              fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            }}
          >+ Invite</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 8px 8px' }}>

          {/* ── SHARE PANEL ── */}
          {showSharePanel && (
            <div style={{
              background:'var(--bg3)', border:'1px solid var(--border2)',
              borderRadius:8, padding:12, marginBottom:12,
            }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
                Invite to Room
              </div>

              {/* Room ID */}
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>Room ID</div>
                <div style={{ display:'flex', gap:4 }}>
                  <div style={{
                    flex:1, background:'var(--bg)', border:'1px solid var(--border)',
                    borderRadius:5, padding:'5px 8px',
                    fontSize:11, fontFamily:'JetBrains Mono,monospace',
                    color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{roomId}</div>
                  <button
                    onClick={() => copyToClipboard(roomId, 'Room ID copied!')}
                    style={{
                      padding:'5px 9px', borderRadius:5,
                      border:'1px solid var(--border)', background:'var(--bg4)',
                      color:'var(--text2)', fontSize:11, cursor:'pointer', fontFamily:'inherit',
                      whiteSpace:'nowrap',
                    }}
                  >📋 Copy</button>
                </div>
              </div>

              {/* Share Link */}
              <div>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>Share Link</div>
                <div style={{ display:'flex', gap:4 }}>
                  <div style={{
                    flex:1, background:'var(--bg)', border:'1px solid var(--border)',
                    borderRadius:5, padding:'5px 8px',
                    fontSize:10, fontFamily:'JetBrains Mono,monospace',
                    color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>{shareLink}</div>
                  <button
                    onClick={() => copyToClipboard(shareLink, 'Link copied!')}
                    style={{
                      padding:'5px 9px', borderRadius:5,
                      border:'1px solid rgba(31,111,235,0.3)', background:'var(--primary-muted)',
                      color:'var(--primary)', fontSize:11, cursor:'pointer', fontFamily:'inherit',
                      whiteSpace:'nowrap',
                    }}
                  >🔗 Copy</button>
                </div>
              </div>

              <div style={{ marginTop:8, fontSize:10, color:'var(--text3)', lineHeight:1.5 }}>
                Share the Room ID or link with teammates. They can join from the Dashboard → Join Room.
              </div>
            </div>
          )}

          {/* ── ONLINE USERS LIST ── */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text3)', padding:'0 4px', marginBottom:6 }}>
              Team Members
            </div>
            <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:3 }}>
              {users.length === 0 ? (
                <li style={{ fontSize:11, color:'var(--text3)', padding:'6px 8px' }}>No one else here yet</li>
              ) : users.map((u, i) => (
                <li key={u.socketId} style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'6px 8px', borderRadius:6,
                  background: u.userId === user?._id ? 'var(--primary-muted)' : 'transparent',
                  border: u.userId === user?._id ? '1px solid rgba(31,111,235,0.2)' : '1px solid transparent',
                }}>
                  {/* Avatar with color */}
                  <div style={{
                    width:24, height:24, borderRadius:'50%', flexShrink:0,
                    background: USER_COLORS[i % USER_COLORS.length],
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, fontWeight:700, color:'#fff',
                    boxShadow:`0 0 6px ${USER_COLORS[i % USER_COLORS.length]}60`,
                  }}>{u.username?.[0]?.toUpperCase()}</div>
                  <span style={{ fontSize:12, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {u.username}
                  </span>
                  {u.userId === user?._id
                    ? <span style={{ fontSize:9, background:'var(--primary)', color:'#fff', padding:'1px 5px', borderRadius:10, fontWeight:700 }}>YOU</span>
                    : <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 4px var(--green)', display:'inline-block' }} />
                  }
                </li>
              ))}
            </ul>
          </div>

          {/* ── LANGUAGE ── */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text3)', padding:'0 4px', marginBottom:6 }}>Language</div>
            <select className="select" value={language} onChange={handleLanguageChange} style={{ fontSize:12 }}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* ── FONT SIZE ── */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text3)', padding:'0 4px', marginBottom:6 }}>Font Size</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 6px' }}>
              <button className="btn btn-ghost btn-xs" onClick={() => setFontSize(f => Math.max(10, f-1))}>−</button>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text)', minWidth:24, textAlign:'center' }}>{fontSize}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setFontSize(f => Math.min(24, f+1))}>+</button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding:8, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:4 }}>
          <button className="btn btn-ghost btn-sm" onClick={toggleHistory}
            style={{ width:'100%', justifyContent:'flex-start', gap:8 }}>
            🕐 {showHistory ? 'Hide History' : 'Version History'}
          </button>
          <button
            className={`btn btn-sm ${showChat ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShowChat(v => !v)}
            style={{ width:'100%', justifyContent:'flex-start', gap:8 }}>
            💬 Chat
            {chatMessages.filter(m => !m.system).length > 0 &&
              <span style={{ marginLeft:'auto', background:'var(--danger)', color:'#fff', borderRadius:10, fontSize:9, fontWeight:700, padding:'1px 5px' }}>
                {chatMessages.filter(m => !m.system).length}
              </span>
            }
          </button>
        </div>
      </aside>

      {/* ── MAIN EDITOR AREA ─────────────────────────────────── */}
      <div className="room-main">

        {/* Toolbar */}
        <div className="editor-toolbar">
          <div className="toolbar-left">
            {/* Mobile: hamburger to toggle sidebar */}
            <button className="btn btn-ghost btn-sm sidebar-toggle-btn" onClick={() => setSidebarOpen(v => !v)}
              style={{ display:'none' }} aria-label="Toggle sidebar">☰</button>
            <span className="toolbar-lang">{language}</span>
            <span style={{ color:'var(--border2)', fontSize:12 }}>|</span>
            {/* Online count in toolbar — always visible */}
            <span style={{
              display:'flex', alignItems:'center', gap:4,
              fontSize:11, color:'var(--text2)',
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 4px var(--green)' }} />
              {users.length} online
            </span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-run btn-sm" onClick={runCode} disabled={running}>
              {running ? '⏳ Running…' : '▶ Run'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowOutput(v => !v)}>
              {showOutput ? '⬆ Hide' : '⬇ Output'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="editor-area" style={{ height: showOutput ? 'calc(100% - 220px)' : 'calc(100% - 40px)' }}>
          <Editor
            height="100%"
            language={monacoLang(language)}
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize,
              minimap: { enabled: window.innerWidth > 900 },
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
            }}
          />
        </div>

        {/* Output */}
        {showOutput && (
          <div className="output-panel">
            <div className="output-header">
              <span className="label">OUTPUT</span>
              {output?.status && (
                <span className={`output-status ${output.status.id <= 3 ? 'ok' : 'err'}`}>
                  {output.status.description}
                </span>
              )}
              {output?.time && <span style={{ fontSize:10, color:'var(--text3)', marginLeft:'auto' }}>{output.time}s</span>}
              <button className="btn btn-ghost btn-xs" onClick={() => { setOutput(null); setShowOutput(false); }}>✕</button>
            </div>
            <div className="output-body">
              {running
                ? <span className="output-running">⏳ Executing…</span>
                : output
                  ? <pre>{outputText}</pre>
                  : <span className="output-placeholder">Press ▶ Run to execute code</span>
              }
            </div>
          </div>
        )}
      </div>

      {/* ── VERSION HISTORY ─────────────────────────────────── */}
      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <span>🕐 History</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className="history-list">
            {loadingHistory
              ? <div className="history-loading">Loading…</div>
              : versions.length === 0
                ? <div className="history-empty">No versions yet.<br/>Versions save every 30s.</div>
                : versions.map((v, i) => (
                  <div key={i} className="history-item">
                    <div className="history-meta">
                      <span className="badge badge-default" style={{ fontSize:9 }}>{v.language}</span>
                      <span className="history-by">{v.savedBy}</span>
                      <span className="history-time">{new Date(v.savedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                    </div>
                    <pre className="history-preview">{(v.code||'').slice(0,80)}{(v.code||'').length > 80 ? '…' : ''}</pre>
                    <button className="btn btn-secondary btn-xs" onClick={() => restoreVersion(v)}>↩ Restore</button>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* ── CHAT ─────────────────────────────────────────────── */}
      {showChat && (
        <div className="room-chat">
          <div className="chat-header">
            <span>💬 Chat</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowChat(false)}>✕</button>
          </div>
          <div className="chat-messages" role="log" aria-live="polite">
            {chatMessages.length === 0 && (
              <div style={{ textAlign:'center', color:'var(--text3)', fontSize:12, padding:20 }}>
                No messages yet. Say hi! 👋
              </div>
            )}
            {chatMessages.map(msg => msg.system
              ? <div key={msg.id} className="chat-system">{msg.message}</div>
              : (
                <div key={msg.id} className={`chat-msg ${msg.username === user?.username ? 'own' : ''}`}>
                  <span className="chat-username">{msg.username}</span>
                  <span className="chat-text">{msg.message}</span>
                  <span className="chat-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              )
            )}
            {typingUser && <div className="chat-typing">✍️ {typingUser} is typing…</div>}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-form" onSubmit={sendChat}>
            <input type="text" value={chatInput} onChange={handleChatTyping}
              placeholder="Message…" aria-label="Chat message" maxLength={500} />
            <button type="submit" className="btn btn-primary btn-sm">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
