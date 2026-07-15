const express = require('express');
const flightStore = require('../state/flightStore');
const flightService = require('../services/flightService');

const router = express.Router();

router.get('/multipliers', (req, res) => {
  res.json(flightStore.getFlights());
});

router.post('/api/datos', async (req, res) => {
  try {
    const { multiplier, timestamp, source } = req.body;

    if (
      typeof multiplier !== 'number' ||
      typeof timestamp !== 'number'
    ) {
      return res.status(400).json({
        ok: false,
        error: 'Formato inválido',
      });
    }

    const result = await flightService.registerFlight({
      multiplier,
      timestamp,
      source,
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error('[REGISTER FLIGHT ERROR]', error);

    return res.status(500).json({
      ok: false,
      error: 'No se pudo registrar el vuelo.',
    });
  }
});

router.post('/undo-last', async (req, res) => {
  try {
    const deletedFlight = await flightService.removeLatestFlight();

    if (!deletedFlight) {
      return res.status(400).json({
        ok: false,
        error: 'No hay vuelos para borrar.',
      });
    }

    return res.json({
      ok: true,
      removed: deletedFlight.multiplier,
      total: flightStore.getFlightCount(),
    });
  } catch (error) {
    console.error('[UNDO FLIGHT ERROR]', error);

    return res.status(500).json({
      ok: false,
      error: 'No se pudo eliminar el último vuelo.',
    });
  }
});

module.exports = router;