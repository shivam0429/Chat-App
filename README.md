# ChatFlow — Real-Time Chat Application

A production-ready, full-stack real-time chat application built with **React (Vite)**, **Node.js/Express**, **Socket.io**, **MongoDB**, and full **JWT-based authentication** (email/password + Google OAuth).

---

## Project Overview

ChatFlow is an authenticated real-time messaging app with both a shared public room and private 1:1 conversations, plus 1:1 audio/video calling. Users create an account (or sign in with Google), then chat in the public room or DM any other registered user — messages are delivered instantly over WebSockets, persisted in MongoDB, and reloaded on refresh so history is never lost.

---

## Features

- **1:1 audio & video calling** — WebRTC calls between two users, signaled over the existing Socket.io connection (free, no third-party calling API)
- **Public room + private 1:1 direct messages** — switch between the shared public room and a private conversation with any other registered user from the sidebar, with per-user unread badges
- Email/password authentication with hashed passwords (bcrypt)
- Google OAuth 2.0 sign-in (Passport.js), auto-linked to an existing email account
- JWT-based sessions — REST API and Socket.io connections are both authenticated via bearer token
- Forgot/reset password flow with time-limited, hashed reset tokens sent via email
- Protected routes on both client (React Router) and server (Express middleware)
- Instant messaging over Socket.io — no polling
- Full message history via REST, restored on refresh
- Typing indicators (per user, auto-expiring)
- Online/offline presence with a live online-user count (supports multiple tabs per user)
- Auto-reconnect with a live connection badge (Online / Reconnecting / Offline)
- Auto-scroll with a "jump to latest" button when scrolled up
- Date separators ("Today", "Yesterday", full date)
- Emoji picker, dark mode toggle, copy-message action
- Clear-chat with confirmation dialog
- Loading, empty, and error states for the message list
- Fully responsive (mobile + desktop)

---

## Technology Stack

**Frontend:** React 19, Vite, React Router, Axios, Socket.io-client, WebRTC (native browser API), Tailwind CSS, Hooks + Context API

**Backend:** Node.js, Express, Socket.io, MongoDB, Mongoose, Passport.js (Google OAuth 2.0), JWT (jsonwebtoken), bcryptjs, Nodemailer, dotenv, cors, helmet, morgan, compression, express-validator

---

## Architecture

```
Client (React)  <───REST (Axios, JWT)───>  Express API  <───Mongoose───>  MongoDB
      │                                          │
      └──────────WebSocket (Socket.io, JWT)──────┘
```

- **Authentication** is JWT-based: on register/login/Google sign-in the server issues a signed token, which the client stores and attaches to every REST request (`Authorization: Bearer <token>`) and to the Socket.io handshake (`socket.handshake.auth.token`).
- **REST API** is used for auth (register/login/forgot/reset password) and to fetch/persist chat history.
- **Socket.io** is used for everything real-time: sending/receiving messages, typing, presence. A Socket.io middleware verifies the JWT before allowing any connection.
- When a message is sent over a socket, the server validates it, saves it to MongoDB, and then **broadcasts** it to every connected client — including the sender, so all clients render from a single source of truth.

---

## Folder Structure

```
chat-app/
├── client/
│   ├── src/
│   │   ├── components/      # ChatLayout, ChatHeader, ConversationSidebar, MessageList,
│   │   │                      MessageBubble, MessageInput, TypingIndicator, CallModal,
│   │   │                      ProtectedRoute, Loader, EmptyState, ErrorState, ConnectionStatus
│   │   ├── pages/            # LoginPage, RegisterPage, ForgotPasswordPage,
│   │   │                      ResetPasswordPage, GoogleCallbackPage, ChatPage
│   │   ├── hooks/            # useSocket, useMessages, useAutoScroll,
│   │   │                      useTypingIndicator, useOnlineUsers, useConversations, useCall
│   │   ├── services/         # api.js (Axios), socket.js (Socket.io client), webrtc.js (ICE config)
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── utils/            # formatTime.js
│   │   ├── styles/           # index.css (Tailwind)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
├── server/
│   ├── config/                 # db.js, passport.js (Google OAuth strategy)
│   ├── controllers/            # authController.js, messageController.js, userController.js
│   ├── middleware/             # auth.js (JWT `protect`), authValidators.js,
│   │                              validators.js, errorHandler.js
│   ├── models/                  # User.js, Message.js (message has optional `recipient`
│   │                                — null = public room, set = private DM)
│   ├── routes/                  # authRoutes.js, messageRoutes.js, userRoutes.js, healthRoutes.js
│   ├── services/                 # messageService.js
│   ├── socket/                   # index.js (JWT-authenticated Socket.io handlers)
│   ├── utils/                     # asyncHandler.js, ApiError.js, generateToken.js,
│   │                                sendEmail.js
│   ├── app.js                     # Express app config
│   ├── server.js                   # Entry point (HTTP + Socket.io + DB)
│   ├── render.yaml
│   └── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A Google Cloud OAuth 2.0 Client ID (for Google sign-in)
- An email account for sending password-reset emails (e.g. Gmail with an App Password)

### Backend Setup

```bash
cd server
cp .env.example .env
# edit .env with your MongoDB URI, JWT secret, Google OAuth credentials, and email credentials
npm install
npm run dev
```

The API runs at `http://localhost:5000` by default.

### Frontend Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

Register an account (or sign in with Google) in two different browsers/profiles to see real-time messaging in action.

---

## Environment Variables

**Backend (`server/.env`)**

| Variable               | Description                                                    |
|------------------------|------------------------------------------------------------------|
| `PORT`                 | Port for the Express server (default 5000)                        |
| `MONGODB_URI`          | MongoDB connection string                                          |
| `CLIENT_URL`           | Frontend origin, used for CORS, Socket.io CORS, and email/OAuth redirect links |
| `NODE_ENV`             | `development` or `production`                                       |
| `JWT_SECRET`           | Secret used to sign/verify JWTs                                      |
| `JWT_EXPIRES_IN`       | JWT expiry (e.g. `7d`)                                                |
| `EMAIL_SERVICE`        | Nodemailer service name (e.g. `gmail`)                                 |
| `EMAIL_USER`           | Email account used to send password-reset emails                        |
| `EMAIL_PASS`           | App password for the email account                                        |
| `GOOGLE_CLIENT_ID`     | Google OAuth 2.0 client ID                                                  |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret                                               |
| `GOOGLE_CALLBACK_URL`  | Full backend callback URL, e.g. `https://your-backend.onrender.com/api/auth/google/callback` |

**Frontend (`client/.env`)**

| Variable            | Description                     |
|---------------------|----------------------------------|
| `VITE_API_URL`      | Base URL for REST API calls      |
| `VITE_SOCKET_URL`   | Base URL for the Socket.io server|

---

## API Documentation

All responses follow a consistent shape:

```json
{ "success": true, "message": "…", "data": {} }
```

Errors:

```json
{ "success": false, "message": "…", "errors": [] }
```

### Auth — `/api/auth`

| Endpoint                        | Method | Auth required | Description                                                        |
|----------------------------------|--------|:--------------:|----------------------------------------------------------------------|
| `/api/auth/register`             | POST   | No              | Create an account with `username`, `email`, `password`. Returns a JWT. |
| `/api/auth/login`                | POST   | No              | Log in with `email`, `password`. Returns a JWT.                        |
| `/api/auth/me`                   | GET    | Yes             | Returns the current authenticated user.                                 |
| `/api/auth/forgot-password`      | POST   | No              | Sends a password-reset email if the account exists (response is identical either way, to avoid leaking registered emails). |
| `/api/auth/reset-password/:token`| POST   | No              | Sets a new `password` using the token emailed to the user. Token expires after 30 minutes. Returns a new JWT. |
| `/api/auth/google`               | GET    | No              | Redirects to Google's OAuth consent screen.                              |
| `/api/auth/google/callback`      | GET    | No              | Google OAuth callback; creates/links the account and redirects to the client with a JWT in the URL. |

### Users — `/api/users` (requires a valid JWT)

- **`GET /api/users`** — Returns every other registered user (`id`, `username`, `email`, `avatar`), sorted alphabetically. Used to populate the DM sidebar.

### Messages — `/api/messages` (all routes require a valid JWT)

- **`GET /api/messages`** — Returns all **public room** messages sorted oldest-first (private DMs are excluded).
- **`POST /api/messages`** — Creates a new message. Body: `{ "message": "Hello!", "recipientId": "<userId>" }`. Omit `recipientId` (or send `null`) for a public message; include it to send a private DM. Returns `201` on success, `400` on validation failure.
- **`DELETE /api/messages`** — Clears the public room history and broadcasts a `chat_cleared` event to all connected clients.
- **`GET /api/messages/dm/:userId`** — Returns the full private conversation between the current user and `:userId`, sorted oldest-first.
- **`DELETE /api/messages/dm/:userId`** — Clears that private conversation for both participants and broadcasts a `dm_cleared` event to just the two of them.

### Health — `/api/health`
Basic health check endpoint (useful for Render health checks).

---

## Authentication Flow

1. **Register / Login**: client posts credentials to `/api/auth/register` or `/api/auth/login`; server returns a signed JWT plus the sanitized user object.
2. **Google OAuth**: client redirects to `/api/auth/google`; after consent, Google redirects to `/api/auth/google/callback`, which creates a new user (or links `googleId` to an existing account matched by email) and redirects to `CLIENT_URL/auth/google/callback?token=<jwt>` where the client picks up the token.
3. **Forgot Password**: client posts an email to `/api/auth/forgot-password`; the server generates a random token, stores only its SHA-256 hash plus a 30-minute expiry, and emails the plain token as a reset link.
4. **Reset Password**: client posts a new password to `/api/auth/reset-password/:token`; the server re-hashes the token to look up the matching, non-expired record, updates the password, and issues a fresh JWT.
5. **Authenticated requests**: the client stores the JWT and attaches it as `Authorization: Bearer <token>` on REST calls and as `auth.token` in the Socket.io handshake. The server's `protect` middleware (REST) and `socketAuthMiddleware` (Socket.io) both verify the token and load the user before allowing access.

---

## Socket Events

Socket.io connections require a valid JWT in `socket.handshake.auth.token`; unauthenticated connections are rejected before the `connection` event fires. On connect, every socket also joins a **personal room keyed by its user's id** — this is what makes private routing possible without a global broadcast.

| Event            | Direction        | Payload                                    | Purpose                                  |
|------------------|------------------|----------------------------------------------|--------------------------------------------|
| `connection`     | server           | —                                              | New authenticated socket connected; joins its own `userId` room |
| `user_joined`    | server → clients | `{ username }`                                | Broadcast that a user joined                |
| `send_message`   | client → server  | `{ message, recipientId? }` + ack callback    | Validates, saves, and routes a message — broadcast to everyone if `recipientId` is omitted, or only to the sender + recipient's rooms if present |
| `receive_message`| server → clients | message object (includes `sender`, `recipient`)| New message to render                       |
| `typing`         | both directions  | `{ username, scope, userId? , recipientId? }` | User started typing — `scope: 'public'` broadcasts to everyone; `scope: 'dm'` (client sends `recipientId`) is routed only to that user's room |
| `stop_typing`    | both directions  | `{ username, scope, userId? , recipientId? }` | User stopped typing (same scoping as `typing`) |
| `online_users`   | server → clients | `string[]`                                    | Current list of online usernames            |
| `user_left`      | server → clients | `{ username }`                                | Broadcast that a user disconnected          |
| `chat_cleared`   | server → clients | —                                              | Public room history was cleared             |
| `dm_cleared`     | server → clients | `{ participants: [userId, userId] }`          | A private conversation was cleared — only the two participants act on it |
| `socket_error`   | server → client  | `{ message }`                                 | A message failed to send                     |
| `disconnect`     | server           | —                                              | Socket disconnected                         |
| `call_user`      | client → server  | `{ toUserId, offer, callType }` + ack callback | Initiate a call; server checks the callee is online and not already busy |
| `call_made`      | server → callee  | `{ fromUserId, fromUsername, offer, callType }`| Incoming call notification with the WebRTC offer |
| `answer_call`    | client → server  | `{ toUserId, answer }`                        | Callee accepted; sends their WebRTC answer     |
| `call_answered`  | server → caller  | `{ fromUserId, answer }`                      | Relays the answer back to the caller           |
| `ice_candidate`  | both directions  | `{ toUserId, candidate }`                     | Relays WebRTC ICE candidates between the two peers |
| `call_declined`  | both directions  | `{ toUserId }` / `{ fromUserId }`             | Callee declined, or caller is busy/unavailable |
| `end_call`       | client → server  | `{ toUserId }`                                | Either party hangs up                          |
| `call_ended`     | server → other party | `{ fromUserId }`                          | Relayed hangup, or sent automatically if either party disconnects mid-call |

The client automatically reconnects (infinite attempts, capped backoff) and re-sends its JWT on reconnect so presence stays accurate. The server tracks each username against a set of socket IDs, so the same account can stay "online" across multiple tabs/devices.

### How private messages stay private

- Every socket joins a room named after its own `userId` on connect.
- A public `send_message` (no `recipientId`) is still `io.emit(...)` to everyone, same as before.
- A private `send_message` (with `recipientId`) is emitted only to `io.to(recipientId).to(senderId)` — i.e. the two rooms belonging to the sender and the recipient — so no other connected client ever receives it.
- The same room-scoping is used for `typing`/`stop_typing` in a DM, so a typing indicator never leaks outside the conversation it belongs to.
- On the client, `useMessages` filters any `receive_message` event against the currently open conversation before appending it to state, and `useConversations` uses the same events to raise an unread badge for conversations that aren't currently open.

## Audio & Video Calling (WebRTC)

Calling is 1:1 only (call the user whose DM you have open) and uses **WebRTC** for the actual audio/video stream — the media never touches your server, only the initial connection setup ("signaling") does, which is relayed over the same Socket.io connection used for chat. This means calling adds no ongoing cost beyond what you're already running.

### How it works

1. Caller clicks 📞 or 🎥 in the header of an open DM (only enabled when that user is online and nobody is already on a call).
2. The client calls `getUserMedia()` to grab the mic/camera, creates an `RTCPeerConnection`, and generates a WebRTC **offer**.
3. The offer is sent to the server via a `call_user` socket event; the server relays it to the callee's personal room (the same per-user room used for DM routing) as `call_made`.
4. If the callee accepts, their client creates its own `RTCPeerConnection`, generates an **answer**, and sends it back via `answer_call` → relayed as `call_answered`.
5. Both sides exchange **ICE candidates** (`ice_candidate` event) as they're discovered, which is how the two browsers find a network path to each other.
6. Once negotiation completes, media flows **directly between the two browsers** (peer-to-peer) — the server's job is done at that point.
7. Either side can hang up (`end_call`) or decline (`call_declined`); a disconnect mid-call is also detected server-side and the other party is notified automatically.

### Free vs. paid: what you should know

- **STUN** (helps two peers discover their public IP so they can connect directly) is free — this project uses Google's public STUN servers, no signup needed.
- This covers the *large majority* of home/office network combinations.
- Some networks (strict/symmetric NATs, certain corporate or mobile carrier networks) can't establish a direct peer-to-peer path even with STUN. For those, a **TURN** server is needed to relay the actual media — which does cost bandwidth to run. This project does **not** include a TURN server by default, so calls will work in most cases but may occasionally fail to connect on a restrictive network.
- If you want TURN coverage: self-host [coturn](https://github.com/coturn/coturn) (free but you manage the server), or use a free tier from a provider like Metered.ca or Xirsys, then set the `VITE_TURN_URL` / `VITE_TURN_USERNAME` / `VITE_TURN_CREDENTIAL` env vars below — no code changes needed, `getIceServers()` picks them up automatically.

### Browser requirements

`getUserMedia()` (camera/mic access) is only available in a **secure context** — `https://` in production, or `http://localhost` in local development. This is a browser security requirement, not something this app can work around. Vercel and Render both serve over HTTPS by default, so this is only relevant if you deploy somewhere without TLS.

### Calling-related environment variables

Add these to `client/.env` — all optional, calling works without them:

| Variable                | Description                                                         |
|--------------------------|-----------------------------------------------------------------------|
| `VITE_TURN_URL`          | TURN server URL, e.g. `turn:your-turn-server.com:3478`                 |
| `VITE_TURN_USERNAME`     | TURN credential username                                                |
| `VITE_TURN_CREDENTIAL`   | TURN credential password                                                 |

---

## Design Decisions

- **React + Vite**: near-instant HMR and a minimal, fast production build compared to CRA.
- **JWT over sessions**: a stateless token works identically for REST and Socket.io, and needs no server-side session store — simpler to scale and deploy on Render's free tier.
- **Passport.js for Google OAuth**: battle-tested strategy library; run in `session: false` mode since the app is fully JWT-based rather than cookie/session-based.
- **Account linking by email**: a Google sign-in with an email matching an existing password account attaches `googleId` to that account instead of creating a duplicate.
- **Hashed, time-limited reset tokens**: only a SHA-256 hash of the reset token is stored in MongoDB, with a 30-minute expiry, so a database leak alone can't be used to reset accounts.
- **Socket.io over polling/Firebase/Pusher**: true bidirectional, low-latency delivery with built-in reconnection, acknowledgements, and broadcast primitives — without depending on a third-party real-time backend.
- **MongoDB + Mongoose**: flexible schema for users and chat messages, simple to host on Atlas, and pairs naturally with Node/Express.
- **REST for history and auth, Socket.io for live updates**: REST gives a reliable, cacheable snapshot on load; sockets handle everything that happens after that, avoiding the inefficiency of polling for new messages.
- **Component-based architecture**: every UI concern (header, list, bubble, input, indicators) is its own component so behavior and styling stay isolated and reusable.
- **Custom hooks** (`useSocket`, `useMessages`, `useAutoScroll`, `useTypingIndicator`, `useOnlineUsers`, `useConversations`, `useCall`): keep `ChatPage` declarative and push all imperative socket/WebRTC/DOM logic into testable, reusable units.
- **Context API** for auth and theme: both are small, global, and infrequently updated — a perfect fit for Context rather than a heavier state library.
- **Environment variables**: all URLs, secrets, and OAuth credentials are externalized so the same codebase deploys unchanged to local, staging, and production.

---

## Assumptions

- Any registered/authenticated user can see and post to the public room, and can start a private DM with any other registered user.
- Calling is 1:1 only — no group calls in this version.
- Messages persist indefinitely in MongoDB until manually cleared.
- Password reset emails are sent via SMTP (Nodemailer); a working email account with the correct credentials/app password is required for that flow to function.
- Google OAuth requires a valid Google Cloud project with the callback URL registered exactly as configured in `GOOGLE_CALLBACK_URL`.

---

## Deployment Instructions

### Backend → Render

1. Push the `server/` directory to a GitHub repository (or the whole monorepo).
2. On Render, create a **New Web Service** pointing at the repo, with root directory `server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Set environment variables (`MONGODB_URI`, `CLIENT_URL`, `NODE_ENV=production`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`) in the Render dashboard.
5. A ready-to-use `render.yaml` is included in `server/`.
6. In the Google Cloud Console, add the deployed callback URL (`https://your-service.onrender.com/api/auth/google/callback`) to the OAuth client's authorized redirect URIs.

### Frontend → Vercel

1. Import the repo into Vercel with root directory `client`.
2. Framework preset: **Vite**.
3. Set `VITE_API_URL` and `VITE_SOCKET_URL` to your deployed Render backend URL (e.g. `https://your-service.onrender.com/api` and `https://your-service.onrender.com`).
4. `vercel.json` is included to handle SPA routing rewrites.
5. Deploy — Socket.io will automatically upgrade to WebSocket transport in production; the client also falls back to polling if needed.

> Make sure `CLIENT_URL` on the backend exactly matches your deployed Vercel domain (including `https://`), or CORS, Socket.io connections, email links, and the Google OAuth redirect will all break.

---

---

## Future Improvements

- Multiple chat rooms/channels
- Message editing and deletion
- File/image attachments
- Push notifications
- Transactional email via a dedicated provider (e.g. Resend/SendGrid) for more reliable deliverability than direct SMTP
- Refresh tokens / token rotation instead of a single long-lived JWT
- Message search and pagination/infinite scroll for very long histories

---

## License

MIT License — free to use, modify, and distribute.