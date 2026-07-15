const flightService = require('../services/flightService');
const monitor = require('../monitor/aviatorMonitor');

let shuttingDown = false;

async function bootstrap() {
  console.log('🚀 Iniciando ecosistema Aviator...');

  const flights = await flightService.loadInitialFlights();

  console.log(`🔥 Vuelos cargados: ${flights.length}`);
  console.log('🚀 Iniciando monitor...');

  await monitor.start();

  console.log('✅ Monitor iniciado.');

  return {
    flightsLoaded: flights.length,
    monitorStarted: true,
  };
}

async function shutdown(reason = 'manual') {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`🛑 Cerrando ecosistema Aviator. Motivo: ${reason}`);

  try {
    await monitor.stop();
    console.log('✅ Monitor cerrado correctamente.');
  } catch (error) {
    console.error('❌ Error cerrando el monitor:', error);
  }
}

module.exports = {
  bootstrap,
  shutdown,
};