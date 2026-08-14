import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import api from '../api/axios';
import toast from 'react-hot-toast';

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust', 'html', 'css'];

const MONACO_LANG_MAP = { cpp: 'cpp', c: 'c', go: 'go', rust: 'rust' };
const monacoLang = (lang) => MONACO_LANG_MAP[lang] || lang;

// Judge0 language IDs
const JUDGE0_LANG = {
  javascript: 63, typescript: 74, python: 71, java: 62,
  cpp: 54, c: 50, go: 60, rust: 73, html: 43, css: 41,
};

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { socketRef, connect, disconnect } = useSocket();

  const [code, setCode] = useState('// Loading…');
  const [language, setLanguage] = useState('javascript');
  const [roomName, setRoomName] = useState('');
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [needPassword, setNeedPassword] = useState(false);

  // Auto-save
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved'

  // Code execution
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // Version history
  const [versions, setVersions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Copy room ID
  const [copied, setCopied] = useState(false);

  // Font size
  const [fontSize, setFontSize] = useState(14);

  // Typing indicator
  const [typingUser, setTypingUser] = useState('');
  const typingTimer = useRef(null);

  const chatEndRef = useRef(null);
  const isRemoteChange = useRef(false);
  const saveTimer = useRef(null);

  const joinRoom = useCallback(
    (pw = '') => {
      const socket = connect();
      if (!socket) return;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      socket.emit(
        'room:join',
        { roomId, username: user?.username, password: pw },
        (response) => {
          if (response.error) {
            if (response.error.toLowerCase().includes('password')) {
              setNeedPassword(true);
            } else {
              setError(response.error);
            }
            return;
          }
          setCode(response.code || '// Start coding here\n');
          setLanguage(response.language || 'javascript');
          setRoomName(response.roomName);
          setUsers(response.users || []);
          setNeedPassword(false);
        }
      );

      socket.on('code:update', ({ code: incoming }) => {
        isRemoteChange.current = true;
        setCode(incoming);
      });

      socket.on('language:update', ({ language: lang }) => setLanguage(lang));

      socket.on('room:userJoined', (u) => {
        setUsers((prev) => [...prev, u]);
        setChatMessages((m) => [
          ...m,
          { id: Date.now(), system: true, message: `${u.username} joined the room` },
        ]);
      });

      socket.on('room:userLeft', (u) => {
        setUsers((prev) => prev.filter((x) => x.socketId !== u.socketId));
        setChatMessages((m) => [
          ...m,
          { id: Date.now(), system: true, message: `${u.username} left the room` },
        ]);
      });

      socket.on('chat:message', (msg) => {
        setChatMessages((m) => [...m, msg]);
      });

      socket.on('chat:typing', ({ username }) => {
        if (username === user?.username) return;
        setTypingUser(username);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingUser(''), 2500);
      });
    },
    [roomId, user, connect]
  );

  useEffect(() => {
    if (user) joinRoom();
    return () => {
      socketRef.current?.emit('room:leave', { roomId, username: user?.username });
      disconnect();
    };
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleEditorChange = (value) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
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
    socketRef.current?.emit('chat:message', {
      roomId,
      message: chatInput.trim(),
      username: user?.username,
    });
    setChatInput('');
  };

  const handleChatTyping = (e) => {
    setChatInput(e.target.value);
    socketRef.current?.emit('chat:typing', { roomId, username: user?.username });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    joinRoom(password);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runCode = async () => {
    const langId = JUDGE0_LANG[language];
    if (!langId) {
      setOutput({ error: `Code execution not supported for ${language}` });
      setShowOutput(true);
      return;
    }
    setRunning(true);
    setShowOutput(true);
    setOutput(null);
    try {
      const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, language_id: langId, stdin: '' }),
      });
      const data = await res.json();
      setOutput(data);
    } catch (err) {
      setOutput({ error: 'Failed to connect to execution service. Try again.' });
    } finally {
      setRunning(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/rooms/${roomId}/versions`);
      setVersions((data.versions || []).slice().reverse());
    } catch {
      setVersions([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) loadHistory();
    setShowHistory((v) => !v);
  };

  const restoreVersion = async (originalIndex, v) => {
    isRemoteChange.current = true;
    setCode(v.code);
    setLanguage(v.language);
    socketRef.current?.emit('code:change', { roomId, code: v.code, username: user?.username });
    socketRef.current?.emit('language:change', { roomId, language: v.language, username: user?.username });
    setShowHistory(false);
  };

  const outputText = output
    ? (output.error || output.stdout || output.stderr || output.compile_output || output.status?.description || 'No output')
    : '';

  if (error) {
    return (
      <div className="room-error">
        <h2>❌ {error}</h2>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (needPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>🔒 Private Room</h2>
          <p>This room requires a password</p>
          <form onSubmit={handlePasswordSubmit} className="auth-form">
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full">Join Room</button>
          </form>
          <button className="btn btn-ghost btn-full mt-1" onClick={() => navigate('/dashboard')}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="room-sidebar">
        <div className="sidebar-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ fontSize: 12 }}>
            ← Dashboard
          </button>
          <span className={`conn-pill ${connected ? 'connected' : 'disconnected'}`}>
            <span className="conn-dot" />
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="sidebar-room-name">{roomName}</div>

        {/* Room ID */}
        <div style={{ padding: '0 8px 10px' }}>
          <button className="btn btn-secondary btn-sm room-id-btn" onClick={copyRoomId}>
            🔗 {copied ? '✓ Copied!' : 'Copy Room ID'}
          </button>
          {saveStatus && <div className={`save-status ${saveStatus}`}>{saveStatus === 'saving' ? '● Saving…' : '✓ Saved'}</div>}
        </div>

        <div className="sidebar-body" style={{ gap: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Language */}
          <div className="sidebar-section">
            <span className="sidebar-label">Language</span>
            <select className="select" value={language} onChange={handleLanguageChange} style={{ fontSize: 12 }}>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Font size */}
          <div className="sidebar-section">
            <span className="sidebar-label">Font Size</span>
            <div className="font-controls">
              <button className="btn btn-ghost btn-xs" onClick={() => setFontSize(f => Math.max(10, f-1))}>−</button>
              <span className="font-size-val">{fontSize}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setFontSize(f => Math.min(24, f+1))}>+</button>
            </div>
          </div>

          {/* Users */}
          <div className="sidebar-section">
            <span className="sidebar-label">Online — {users.length}</span>
            <ul className="user-list">
              {users.map(u => (
                <li key={u.socketId} className="user-item">
                  <span className="user-dot" style={{ background: u.color || '#4ECDC4', boxShadow: `0 0 5px ${u.color || '#4ECDC4'}60` }} />
                  <span style={{ fontSize: 12 }}>{u.username}</span>
                  {u.userId === user?._id && <span className="you-badge">you</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button className="btn btn-ghost btn-sm sidebar-action-btn" onClick={toggleHistory}>
            🕐 {showHistory ? 'Hide History' : 'Version History'}
          </button>
          <button className={`btn btn-ghost btn-sm chat-toggle ${showChat ? 'active' : ''}`} onClick={() => setShowChat(v => !v)}>
            💬 Chat {chatMessages.filter(m => !m.system).length > 0 && `(${chatMessages.filter(m => !m.system).length})`}
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────── */}
      <div className="room-main">
        {/* Toolbar */}
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <span className="toolbar-lang">{language}</span>
            <span style={{ color: 'var(--border2)' }}>|</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{users.length} user{users.length !== 1 ? 's' : ''} online</span>
          </div>
          <div className="toolbar-right">
            <button className="btn btn-run btn-sm" onClick={runCode} disabled={running}>
              {running ? '⏳ Running…' : '▶ Run Code'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowOutput(v => !v)}>
              {showOutput ? '⬆ Hide Output' : '⬇ Output'}
            </button>
          </div>
        </div>

        {/* Editor area */}
        <div className="editor-area" style={{ height: showOutput ? 'calc(100% - 120px)' : 'calc(100% - 40px)' }}>
          <Editor
            height="100%"
            language={monacoLang(language)}
            value={code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize,
              minimap: { enabled: true },
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
            }}
          />
        </div>

        {/* Output panel */}
        {showOutput && (
          <div className="output-panel">
            <div className="output-header">
              <span>Output</span>
              {output?.status && (
                <span className={`output-status ${output.status.id <= 3 ? 'ok' : 'err'}`}>
                  {output.status.description}
                </span>
              )}
              <button className="btn btn-ghost btn-xs" onClick={() => { setOutput(null); setShowOutput(false); }}>✕</button>
            </div>
            <div className="output-body">
              {running ? (
                <span className="output-running">Running code…</span>
              ) : output ? (
                <pre>{outputText}</pre>
              ) : (
                <span className="output-placeholder">Click ▶ Run to execute your code</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Version History panel */}
      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <span>🕐 Version History</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className="history-list">
            {loadingHistory ? (
              <div className="history-loading">Loading…</div>
            ) : versions.length === 0 ? (
              <div className="history-empty">No versions saved yet</div>
            ) : (
              versions.map((v, i) => (
                <div key={i} className="history-item">
                  <div className="history-meta">
                    <span className="history-lang">{v.language}</span>
                    <span className="history-by">{v.savedBy}</span>
                    <span className="history-time">
                      {new Date(v.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <pre className="history-preview">{(v.code || '').slice(0, 80)}{(v.code || '').length > 80 ? '…' : ''}</pre>
                  <button
                    className="btn btn-secondary btn-xs"
                    onClick={() => restoreVersion(versions.length - 1 - i, v)}
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat panel */}
      {showChat && (
        <div className="room-chat">
          <div className="chat-header">
            <span>Chat</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowChat(false)}>✕</button>
          </div>
          <div className="chat-messages" role="log" aria-live="polite">
            {chatMessages.map((msg) =>
              msg.system ? (
                <div key={msg.id} className="chat-system">{msg.message}</div>
              ) : (
                <div key={msg.id} className={`chat-msg ${msg.username === user?.username ? 'own' : ''}`}>
                  <span className="chat-username">{msg.username}</span>
                  <span className="chat-text">{msg.message}</span>
                  <span className="chat-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            )}
            {typingUser && (
              <div className="chat-typing">{typingUser} is typing…</div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-form" onSubmit={sendChat}>
            <input
              type="text"
              value={chatInput}
              onChange={handleChatTyping}
              placeholder="Type a message…"
              aria-label="Chat message"
              maxLength={500}
            />
            <button type="submit" className="btn btn-primary btn-sm">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
