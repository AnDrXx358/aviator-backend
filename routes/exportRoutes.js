const express = require('express');

const {
  exportSignals,
} = require('../audit/exportSignalsService');

const router = express.Router();

router.get('/export-signals', async (req, res) => {
  try {
    const { outputPath, total } =
      await exportSignals();

    res.download(
      outputPath,
      'signals.json',
      (error) => {
        if (error && !res.headersSent) {
          res.status(500).json({
            ok: false,
            error: error.message,
          });
        }
      }
    );

    console.log(
      `📤 Exportación enviada: ${total} señales`
    );
  } catch (error) {
    console.error(
      '❌ Error exportando señales:',
      error
    );

    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

module.exports = router;