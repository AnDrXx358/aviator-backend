const express = require('express');
const cors = require('cors');
const http = require('http');

const env = require('./config/env');
const {
  bootstrap,
  shutdown,
} = require('./core/bootstrap');
const {
  initializeSocketServer,
} = require('./sockets/socketServer');

const healthRoutes = require('./routes/healthRoutes');
const statsRoutes = require('./routes/statsRoutes');
const flightRoutes = require('./routes/flightRoutes');
const exportRoutes = require('./routes/exportRoutes');

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  initializeSocketServer(httpServer);

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
  }));

  app.use(express.json());

  app.use('/', healthRoutes);
  app.use('/stats', statsRoutes);
  app.use('/', flightRoutes);
  app.use('/', exportRoutes);

  await bootstrap();

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('❌ Error crítico iniciando el sistema:', error);
  process.exit(1);
});

async function handleShutdown(signal) {
  try {
    await shutdown(signal);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el apagado:', error);
    process.exit(1);
  }
}

process.once('SIGINT', () => {
  handleShutdown('SIGINT');
});

process.once('SIGTERM', () => {
  handleShutdown('SIGTERM');
});