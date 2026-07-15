const express = require('express');
const flightStore = require('../state/flightStore');
const { calculateStats } = require('../engines/statsEngine');

const router = express.Router();

router.get('/', (req, res) => {
  const flights = flightStore.getFlights();
  const stats = calculateStats(flights);

  res.json(stats);
});

module.exports = router;