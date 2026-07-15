require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const admin = require("firebase-admin");

const monitor = require('./monitor_v2');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
app.get('/', (req, res) => {
  res.json({
  ok: true,
  backend: 'AVIATOR ONLINE',
  flights: multipliers.length,
});
});


const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },

  transports: ['websocket', 'polling'],

  pingTimeout: 60000,
  pingInterval: 25000,

  connectTimeout: 60000,

  allowEIO3: true,
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));
app.use(express.json());

const csvPath = path.join(__dirname, 'aviator_data.csv');

let multipliers = [];
const recentTimestamps = new Set();

function ensureCsvExists() {
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, 'id;session;multiplier;ok1;ok2;extra\n', 'utf8');
  }
}

function loadCsv() {
  ensureCsvExists();

  const raw = fs.readFileSync(csvPath, 'utf8');

  const lines = raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length <= 1) {
    multipliers = [];
    return;
  }

  multipliers = lines
    .slice(1)
    .map(line => line.split(';'))
    .filter(parts => parts.length >= 3)
    .map(parts => Number(parts[2]))
    .filter(value => !Number.isNaN(value));
}

function appendValueToCsv(value) {
  ensureCsvExists();

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const nextId = Math.max(0, lines.length - 1) + 1;
  const line = `${nextId};AUTO;${value};0;0;0\n`;

  fs.appendFileSync(csvPath, line, 'utf8');
  console.log('[CSV APPEND OK]', line.trim());
}

function calculateStats(data) {
  if (!data || data.length === 0) {
    return {
      sample: 0,
      prob2x: 0,
      prob5x: 0,
      lowCount: 0,
      midCount: 0,
      highCount: 0,
      lowPct: 0,
      midPct: 0,
      highPct: 0,
      lowStreak: 0,
      phase: 'Sin datos',
      cycle: 'N/A',

      good15: 0,
      bad15: 0,
      good20: 0,
      bad20: 0,

      global15: 0,
      global20: 0,

      conf15: 0,
      conf20: 0,

      stake15: 0,
      stake20: 0,

      score15: 0,
      score20: 0,

      signal15: '--',
      signal20: '--',

      action15: 'ESPERAR',
      action20: 'ESPERAR',

      recommendedText: 'Recomendado: NO ENTRAR',
    };
  }

  const total = data.length;
  const last20 = data.slice(-20);

  const lowCount = data.filter(v => v < 2).length;
  const midCount = data.filter(v => v >= 2 && v < 5).length;
  const highCount = data.filter(v => v >= 5).length;

  const prob2x = ((total - lowCount) / total) * 100;
  const prob5x = (highCount / total) * 100;

  let lowStreak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i] < 2) {
      lowStreak++;
    } else {
      break;
    }
  }

  let phase = 'Ciclo normal';
  if (highCount / total >= 0.18) phase = 'Fase explosiva';
  else if (lowCount / total >= 0.65) phase = 'Fase fría';

  let cycle = 'Ciclo neutro';
  if (lowStreak >= 5) cycle = 'Pre-explosión';
  else if (lowStreak >= 3) cycle = 'Atención';
  else if (lowStreak <= 1) cycle = 'Caliente';

  // últimos 20 para targets
  const good15 = last20.filter(v => v >= 1.5).length;
  const bad15 = last20.length - good15;

  const good20 = last20.filter(v => v >= 2.0).length;
  const bad20 = last20.length - good20;

  // winrate / global %
  const global15 = last20.length > 0 ? (good15 / last20.length) * 100 : 0;
  const global20 = last20.length > 0 ? (good20 / last20.length) * 100 : 0;

  // confianza base
  let conf15 = 50;
  let conf20 = 50;

  // target 1.5
  conf15 += prob2x >= 50 ? 10 : 0;
  conf15 += lowStreak <= 1 ? 8 : 0;
  conf15 += lowCount / total <= 0.58 ? 7 : 0;
  conf15 += phase === 'Fase explosiva' ? 8 : 0;
  conf15 -= lowStreak >= 3 ? 10 : 0;
  conf15 -= lowCount / total >= 0.65 ? 8 : 0;

  // target 2.0
  conf20 += prob2x >= 52 ? 8 : 0;
  conf20 += prob5x >= 18 ? 12 : 0;
  conf20 += highCount / total >= 0.18 ? 10 : 0;
  conf20 += phase === 'Fase explosiva' ? 8 : 0;
  conf20 -= lowStreak >= 3 ? 10 : 0;
  conf20 -= lowCount / total >= 0.60 ? 8 : 0;

  conf15 = Math.max(0, Math.min(100, conf15));
  conf20 = Math.max(0, Math.min(100, conf20));

  // stakes
  let stake15 = +(conf15 / 50).toFixed(2);
  let stake20 = +(conf20 / 50).toFixed(2);

  stake15 = Math.max(0, Math.min(2.0, stake15));
  stake20 = Math.max(0, Math.min(2.0, stake20));

  // score
  const score15 = Math.round(conf15 * 1.5);
  const score20 = Math.round(conf20 * 1.3);

  // señal / acción
  const signal15 = lowStreak >= 3 ? 'MALA' : 'BUENA';
  const signal20 = conf20 >= 55 ? 'BUENA' : 'MALA';

  const action15 = conf15 >= 55 ? 'ENTRAR' : 'ESPERAR';
  const action20 = conf20 >= 55 ? 'ENTRAR' : 'ESPERAR';

  // recomendado
  let chosenTarget = 1.5;
  let chosenStake = stake15;

  if (conf20 >= 55 && conf20 > conf15) {
    chosenTarget = 2.0;
    chosenStake = stake20;
  }

  if (conf15 < 45 && conf20 < 45) {
    chosenTarget = 1.5;
    chosenStake = 0.0;
  }

  const recommendedText =
    chosenStake <= 0
      ? 'Recomendado: NO ENTRAR'
      : `Recomendado: ${chosenTarget.toFixed(1)} | Stake: ${chosenStake.toFixed(2)}%`;

  return {
    sample: total,
    prob2x: +prob2x.toFixed(1),
    prob5x: +prob5x.toFixed(1),
    lowCount,
    midCount,
    highCount,
    lowPct: +((lowCount / total) * 100).toFixed(1),
    midPct: +((midCount / total) * 100).toFixed(1),
    highPct: +((highCount / total) * 100).toFixed(1),
    lowStreak,
    phase,
    cycle,

    good15,
    bad15,
    good20,
    bad20,

    global15: +global15.toFixed(0),
    global20: +global20.toFixed(0),

    conf15,
    conf20,

    stake15,
    stake20,

    score15,
    score20,

    signal15,
    signal20,

    action15,
    action20,

    recommendedText,
  };
}

async function loadFromFirebase() {

  try {

    const snapshot = await db
      .collection('vuelos')
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();

  multipliers = snapshot.docs
    .map(doc => doc.data().multiplier)
    .filter(v => typeof v === 'number')
    .reverse();

    console.log('🔥 Firebase cargó', multipliers.length, 'vuelos');

  } catch (e) {

    console.error('LOAD FIREBASE ERROR:', e);

  }
}

loadFromFirebase();

app.get('/multipliers', (req, res) => {
  res.json(multipliers);
});

app.post('/add', (req, res) => {
  try {

    const { value } = req.body;
    const num = Number(value);

    if (Number.isNaN(num)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    //appendValueToCsv(num);
    //multipliers.push(num);

    //io.emit('new_multiplier', num);

    console.log('[ADD OK]', {
      added: num,
      total: multipliers.length,
      last: multipliers[multipliers.length - 1],
    });

    res.json({
      ok: true,
      added: num,
      total: multipliers.length,
    });
  } catch (error) {
    console.error('[ADD ERROR]', error);
    res.status(500).json({
      ok: false,
      error: 'No se pudo guardar el coeficiente',
    });
  }
});

app.post('/undo-last', async (req, res) => {

  try {

    if (multipliers.length === 0) {
      return res.status(400).json({
        error: 'No hay vuelos para borrar'
      });
    }

    // último multiplicador RAM
    const removed = multipliers.pop();

    // buscar último doc firebase
    const snapshot = await db
      .collection('vuelos')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {

      const lastDoc = snapshot.docs[0];

      await lastDoc.ref.delete();

    }

    io.emit('csv_updated', multipliers);

    console.log('🔥 UNDO OK:', removed);

    res.json({
      ok: true,
      removed,
      total: multipliers.length,
    });

  } catch (e) {

    console.error('[UNDO ERROR]', e);

    res.status(500).json({
      error: e.toString(),
    });

  }

});

app.post('/api/datos', async (req, res) => {

  const { multiplier, timestamp, source } = req.body;

  try {

    if (
      typeof multiplier !== 'number' ||
      typeof timestamp !== 'number'
    ) {
      return res.status(400).json({
        ok: false,
        error: 'Formato inválido',
      });
    }

    if (recentTimestamps.has(timestamp)) {
      return res.json({
        ok: true,
        duplicateRAM: true,
      });
    }

    recentTimestamps.add(timestamp);

    if (recentTimestamps.size > 2000) {
      const firstKey =
        recentTimestamps.values().next().value;

      recentTimestamps.delete(firstKey);
    }

    multipliers.push(multiplier);

    if (multipliers.length > 1000) {
      multipliers.shift();
    }

    io.emit('new_multiplier', multiplier);

    res.json({
      ok: true,
      accepted: true,
    });

    setImmediate(async () => {

      try {

        await db
          .collection('vuelos')
          .doc(timestamp.toString())
          .set({
            multiplier,
            timestamp,
            fecha: new Date(timestamp).toISOString(),
            source: source || 'desconocido',
          });

        console.log(
          '🔥 Firebase OK:',
          multiplier
        );

      } catch (e) {

        console.error(
          '❌ FIREBASE ERROR:',
          e
        );

      }

    });

  } catch (e) {

    console.error(
      '[API DATOS ERROR]',
      e
    );

    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        error: e.toString(),
      });
    }

  }

});

app.get('/stats', (req, res) => {
  const stats = calculateStats(multipliers);
  res.json(stats);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📁 CSV path:', csvPath);

    console.log('🚀 Iniciando monitor...');

    try {
        await monitor.start();
        console.log('✅ Monitor iniciado.');
    } catch (e) {
        console.error('❌ Error iniciando monitor:', e);
    }
});
