const flightRepository = require('../firebase/flightRepository');
const flightStore = require('../state/flightStore');

const {
  emitNewMultiplier,
  emitFlightsUpdated,
} = require('../sockets/socketServer');

const {
  processRegisteredFlight,
} = require('./roundProcessingService');

async function loadInitialFlights() {
  const flights = await flightRepository.getLatestFlights(1000);

  flightStore.replaceFlights(flights);

  return flights;
}

async function registerFlight({
  multiplier,
  timestamp,
  source = 'desconocido',
}) {
  if (typeof multiplier !== 'number' || Number.isNaN(multiplier)) {
    throw new Error('El multiplicador debe ser un número válido.');
  }

  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    throw new Error('El timestamp debe ser un número válido.');
  }

  if (flightStore.hasTimestamp(timestamp)) {
    return {
      accepted: false,
      duplicate: true,
    };
  }

  flightStore.registerTimestamp(timestamp);
  flightStore.addFlight(multiplier);

  emitNewMultiplier(multiplier);

await flightRepository.saveFlight({
  multiplier,
  timestamp,
  source,
});

let processingResult = null;

try {
  processingResult =
    await processRegisteredFlight({
      multiplier,
    });
} catch (error) {
  console.error(
    `❌ Error procesando ronda: ${error.message}`
  );
}

return {
  accepted: true,
  duplicate: false,
  total: flightStore.getFlightCount(),
  processingResult,
};
}

module.exports = {
  loadInitialFlights,
  registerFlight,
};