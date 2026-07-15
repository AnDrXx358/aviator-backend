
const { Server } = require('socket.io');
const env = require('../config/env');

let io = null;

function initializeSocketServer(httpServer) {
  if (io) {
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin: env.allowedOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 60000,
    allowEIO3: true,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket conectado: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket desconectado: ${socket.id} — ${reason}`);
    });
  });

  return io;
}

function getSocketServer() {
  if (!io) {
    throw new Error('Socket.io todavía no ha sido inicializado.');
  }

  return io;
}

function emitNewMultiplier(multiplier) {
  getSocketServer().emit('new_multiplier', multiplier);
}

function emitFlightsUpdated(multipliers) {
  getSocketServer().emit('csv_updated', multipliers);
}

function emitAnalysisUpdated(analysis) {
  getSocketServer().emit('analysis_updated', analysis);
}

module.exports = {
  initializeSocketServer,
  getSocketServer,
  emitNewMultiplier,
  emitFlightsUpdated,
  emitAnalysisUpdated,
};