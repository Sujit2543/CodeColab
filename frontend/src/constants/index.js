export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', icon: '🟨', monacoId: 'javascript' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷', monacoId: 'typescript' },
  { id: 'python', label: 'Python', icon: '🐍', monacoId: 'python' },
  { id: 'java', label: 'Java', icon: '☕', monacoId: 'java' },
  { id: 'cpp', label: 'C++', icon: '⚙️', monacoId: 'cpp' },
  { id: 'c', label: 'C', icon: '🔧', monacoId: 'c' },
  { id: 'go', label: 'Go', icon: '🐹', monacoId: 'go' },
  { id: 'rust', label: 'Rust', icon: '🦀', monacoId: 'rust' },
  { id: 'html', label: 'HTML', icon: '🌐', monacoId: 'html' },
  { id: 'css', label: 'CSS', icon: '🎨', monacoId: 'css' },
  { id: 'sql', label: 'SQL', icon: '🗄️', monacoId: 'sql' },
];

export const LANGUAGE_MAP = Object.fromEntries(LANGUAGES.map((l) => [l.id, l]));

export const FILE_EXT_TO_LANG = {
  js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
  py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
  c: 'c', h: 'c', go: 'go', rs: 'rust',
  html: 'html', css: 'css', sql: 'sql',
  md: 'markdown', json: 'json', yml: 'yaml', yaml: 'yaml',
};

export const EDITOR_THEMES = [
  { id: 'vs-dark', label: 'Dark (VS Code)' },
  { id: 'vs', label: 'Light (VS Code)' },
  { id: 'hc-black', label: 'High Contrast' },
];

export const SOCKET_EVENTS = {
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  ROOM_USER_JOINED: 'room:userJoined',
  ROOM_USER_LEFT: 'room:userLeft',
  CODE_CHANGE: 'code:change',
  CODE_UPDATE: 'code:update',
  LANGUAGE_CHANGE: 'language:change',
  LANGUAGE_UPDATE: 'language:update',
  CURSOR_MOVE: 'cursor:move',
  CURSOR_UPDATE: 'cursor:update',
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
};
