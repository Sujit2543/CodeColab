# 💻 CodeCollab – Real-Time Collaborative Coding Platform

A full-stack collaborative coding platform where multiple users can create or join coding rooms and edit source code in real time.

## Tech Stack

| Layer    | Tech                                    |
|----------|-----------------------------------------|
| Frontend | React 18, Vite, Monaco Editor, Zustand  |
| Backend  | Node.js, Express                        |
| Database | MongoDB + Mongoose                      |
| Realtime | Socket.io (WebSockets)                  |
| Auth     | JWT (JSON Web Tokens)                   |

## Features

- **JWT Authentication** – register, login, protected routes
- **Live Coding Rooms** – create/join rooms, real-time code sync via WebSockets
- **Multi-language Support** – JavaScript, TypeScript, Python, Java, C++, Go, Rust, HTML, CSS
- **Private Rooms** – password-protected rooms
- **Live Chat** – in-room messaging with system events (join/leave)
- **Active Users Panel** – see who's in the room with colored indicators
- **Persistent Projects** – save multi-file projects to MongoDB
- **Monaco Editor** – VS Code-quality editor with syntax highlighting

## Project Structure

```
codecollab/
├── server/            # Express + Socket.io backend
│   └── src/
│       ├── config/    # MongoDB connection
│       ├── middleware/ # JWT auth middleware
│       ├── models/    # Mongoose schemas (User, Room, Project)
│       ├── routes/    # REST API routes
│       └── sockets/   # Socket.io event handlers
└── client/            # React + Vite frontend
    └── src/
        ├── api/       # Axios instance
        ├── components/ # Modals & shared components
        ├── hooks/     # useSocket hook
        ├── pages/     # Login, Register, Dashboard, Room, Project
        ├── store/     # Zustand state stores
        └── styles/    # Global CSS
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Server setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm run dev
```

### 2. Client setup

```bash
cd client
npm install
npm run dev
```

### 3. Open the app

Visit `http://localhost:5173`

## Environment Variables (server/.env)

| Variable       | Default                                    | Description             |
|----------------|--------------------------------------------|-------------------------|
| PORT           | 5000                                       | Server port             |
| MONGO_URI      | mongodb://localhost:27017/codecollab       | MongoDB connection URI  |
| JWT_SECRET     | *(required)*                               | Secret for JWT signing  |
| JWT_EXPIRES_IN | 7d                                         | Token expiry            |
| CLIENT_URL     | http://localhost:5173                      | CORS allowed origin     |

## API Endpoints

### Auth
| Method | Path                | Description      |
|--------|---------------------|------------------|
| POST   | /api/auth/register  | Register user    |
| POST   | /api/auth/login     | Login            |
| GET    | /api/auth/me        | Get current user |

### Rooms
| Method | Path               | Description        |
|--------|--------------------|--------------------|
| POST   | /api/rooms         | Create room        |
| GET    | /api/rooms         | List public rooms  |
| GET    | /api/rooms/:roomId | Get room by ID     |
| DELETE | /api/rooms/:roomId | Delete room        |

### Projects
| Method | Path                | Description        |
|--------|---------------------|--------------------|
| POST   | /api/projects       | Create project     |
| GET    | /api/projects       | Get user projects  |
| GET    | /api/projects/:id   | Get project        |
| PUT    | /api/projects/:id   | Update project     |
| DELETE | /api/projects/:id   | Delete project     |

## Socket.io Events

| Event            | Direction       | Description               |
|------------------|-----------------|---------------------------|
| room:join        | Client → Server | Join a room               |
| room:userJoined  | Server → Client | Someone joined            |
| room:userLeft    | Server → Client | Someone left              |
| code:change      | Client → Server | Send code update          |
| code:update      | Server → Client | Receive code update       |
| language:change  | Client → Server | Change room language      |
| language:update  | Server → Client | Language changed          |
| cursor:move      | Client → Server | Send cursor position      |
| cursor:update    | Server → Client | Receive cursor position   |
| chat:message     | Bidirectional   | Send/receive chat message |
| room:leave       | Client → Server | Leave room                |
