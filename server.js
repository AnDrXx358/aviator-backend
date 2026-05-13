const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

app.get('/', (req, res) => {
  res.send('AVIATOR BACKEND OK');
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

app.use(express.json());

const csvPath = path.join(__dirname, 'aviator_data.csv');

let multipliers = [];

function ensureCsvExists() {
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(
      csvPath,
      'id;session;multiplier;ok1;ok2;extra\n',
      'utf8'
    );
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

  if (highCount / total >= 0.18) {
    phase = 'Fase explosiva';
  } else if (lowCount / total >= 0.65) {
    phase = 'Fase fría';
  }

  let cycle = 'Ciclo neutro';

  if (lowStreak >= 5) {
    cycle = 'Pre-explosión';
  } else if (lowStreak >= 3) {
    cycle = 'Atención';
  } else if (lowStreak <= 1) {
    cycle = 'Caliente';
  }

  const good15 = last20.filter(v => v >= 1.5).length;
  const bad15 = last20.length - good15;

  const good20 = last20.filter(v => v >= 2.0).length;
  const bad20 = last20.length - good20;

  const global15 =
      last20.length > 0 ? (good15 / last20.length) * 100 : 0;

  const global20 =
      last20.length > 0 ? (good20 / last20.length) * 100 : 0;

  let conf15 = 50;
  let conf20 = 50;

  conf15 += prob2x >= 50 ? 10 : 0;
  conf15 += lowStreak <= 1 ? 8 : 0;
  conf15 += lowCount / total <= 0.58 ? 7 : 0;
  conf15 += phase === 'Fase explosiva' ? 8 : 0;
  conf15 -= lowStreak >= 3 ? 10 : 0;
  conf15 -= lowCount / total >= 0.65 ? 8 : 0;

  conf20 += prob2x >= 52 ? 8 : 0;
  conf20 += prob5x >= 18 ? 12 : 0;
  conf20 += highCount / total >= 0.18 ? 10 : 0;
  conf20 += phase === 'Fase explosiva' ? 8 : 0;
  conf20 -= lowStreak >= 3 ? 10 : 0;
  conf20 -= lowCount / total >= 0.60 ? 8 : 0;

  conf15 = Math.max(0, Math.min(100, conf15));
  conf20 = Math.max(0, Math.min(100, conf20));

  let stake15 = +(conf15 / 50).toFixed(2);
  let stake20 = +(conf20 / 50).toFixed(2);

  stake15 = Math.max(0, Math.min(2.0, stake15));
  stake20 = Math.max(0, Math.min(2.0, stake20));

  const score15 = Math.round(conf15 * 1.5);
  const score20 = Math.round(conf20 * 1.3);

  const signal15 = lowStreak >= 3 ? 'MALA' : 'BUENA';
  const signal20 = conf20 >= 55 ? 'BUENA' : 'MALA';

  const action15 = conf15 >= 55 ? 'ENTRAR' : 'ESPERAR';
  const action20 = conf20 >= 55 ? 'ENTRAR' : 'ESPERAR';

  let chosenTarget = 1.5;
  let chosenStake = stake15;

  if (conf20 >= 55 && conf20 > conf15) {
    chosenTarget = 2.0;
    chosenStake = stake20;
  }

  if (conf15 < 45 && conf20 < 45) {
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

loadCsv();

setInterval(() => {
  try {
    loadCsv();
    console.log(`CSV actualizado. Total: ${multipliers.length}`);
  } catch (e) {
    console.log('Reload CSV skipped');
  }
}, 5000);

app.get(['/multipliers', '/multipliers/'], (req, res) => {
  loadCsv();

  res.json({
    ok: true,
    total: multipliers.length,
    data: multipliers
  });
});

app.get('/stats', (req, res) => {
  loadCsv();
  const stats = calculateStats(multipliers);
  res.json(stats);
});

app.post('/add', (req, res) => {
  try {
    const { value } = req.body;

    const num = Number(value);

    if (Number.isNaN(num)) {
      return res.status(400).json({
        error: 'Valor inválido'
      });
    }

    appendValueToCsv(num);

    loadCsv();

    io.emit('new_multiplier', num);

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

app.post('/save-round', (req, res) => {

  const round = {
    multiplier: req.body.multiplier,
    signal: req.body.signal,
    target: req.body.target,
    stake: req.body.stake,
    result: req.body.result,
    conf15: req.body.conf15,
    conf20: req.body.conf20,
    timestamp: Date.now()
  };

  if (!global.history) {
    global.history = [];
  }

  global.history.push(round);

  res.json({ ok: true });
});

app.post('/undo-last', (req, res) => {
  try {

    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({
        error: 'CSV no existe'
      });
    }

    const raw = fs.readFileSync(csvPath, 'utf8');

    const lines = raw
      .split('\n')
      .map(line => line.trimEnd())
      .filter(line => line.length > 0);

    if (lines.length <= 1) {
      return res.status(400).json({
        error: 'No hay filas para borrar'
      });
    }

    const removedLine = lines.pop();

    fs.writeFileSync(
      csvPath,
      lines.join('\n') + '\n'
    );

    loadCsv();

    io.emit("csv_updated", multipliers);

    console.log('[UNDO OK]', removedLine);

    res.json({
      ok: true,
      removed: removedLine,
      total: multipliers.length,
    });

  } catch (e) {

    console.error('[UNDO ERROR]', e);

    res.status(500).json({
      error: e.toString()
    });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CSV path:', csvPath);
});