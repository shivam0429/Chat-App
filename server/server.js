import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';

import createApp from './app.js';
import connectDB from './config/db.js';
import registerSocketHandlers from './socket/index.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const startServer = async () => {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  app.set('io', io);
  registerSocketHandlers(io);

  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    httpServer.close(() => process.exit(1));
  });
};

startServer();
