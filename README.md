# Yapper Hub 💬

> *"A place where everyone knows your name — and your messages arrive in real time."*

A full-stack real-time chat application built with the MERN stack, Socket.IO, and Redis. Supports one-on-one messaging, group chats, live presence, and message caching.

🔗 **Live Demo:** [yapper-hub-a-chat-app.vercel.app](https://yapper-hub-a-chat-app.vercel.app)

---

## Features

- **Real-time messaging** via Socket.IO with room-based architecture
- **Group chats** — create groups, manage members, admin controls
- **Live presence** — online/offline status with Redis TTL keys and heartbeat
- **Typing indicators** — ephemeral Redis keys with 3s expiry
- **Unread message counts** — per-conversation Redis counters
- **Message caching** — last 50 messages cached in Redis with 24hr TTL
- **Message deletion** — with confirmation modal, socket-synced across clients
- **Friend system** — send, accept, and reject friend requests
- **Profile cards** — click any user to view their profile popup
- **Responsive UI** — mobile-first with hamburger sidebar overlay
- **Light / Dark mode** — Friends-themed palette, persisted globally via context
- **JWT auth** — HttpOnly cookies with secure cross-domain config

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.IO |
| Cache | Redis (Upstash) via ioredis |
| Auth | JWT + HttpOnly Cookies |
| Hosting | Vercel (frontend), Render (backend) |

---

## Architecture Highlights

**Redis key structure:**
```
online:{userId}          → TTL 360s (presence)
typing:{convoId}:{userId} → TTL 3s (typing indicator)
messages:{convoId}       → JSON array, TTL 24hr (message cache)
unread:{userId}:{convoId} → integer counter
user:{userId}            → cached user object, TTL 1hr
```

**Socket.IO room strategy:**
- Each user joins a personal room (`userId`) for directed events
- Each conversation has its own room for message broadcasting
- Group events (member join/leave/disband) emit to individual user rooms

---

## Local Setup

```bash
# Clone
git clone https://github.com/Ronald-William/yapper-hub.git
cd yapper-hub

# Backend
cd server
npm install
# create .env (see .env.example)
npm run dev

# Frontend
cd client
npm install
# create .env (see .env.example)
npm run dev
```

**Server `.env`:**
```
PORT=5000
MONGO_URI=your_mongodb_uri
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_secret
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**Client `.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Author

**Ronald William Joseph** — Fullstack Developer

- 📧 [ronaldjoseph439@gmail.com](mailto:ronaldjoseph439@gmail.com)
- 🐙 [github.com/Ronald-William](https://github.com/Ronald-William)

---

*Not affiliated with Friends™ — but the couch is a tribute.*
