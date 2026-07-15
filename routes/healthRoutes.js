const express = require('express');
const flightStore = require('../state/flightStore');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    ok: true,
    backend: 'AVIATOR ONLINE',
    flights: flightStore.getFlightCount(),
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: Date.now(),
  });
});

module.exports = router;
