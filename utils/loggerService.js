let enableLogs = true;

function setEnabled(enabled) {
  enableLogs = Boolean(enabled);
}

function socket(value) {
  if (!enableLogs) return;

  console.log('📡 SOCKET RECIBIO:', value);
}

function signal(value) {
  if (!enableLogs) return;

  console.log(`🚀 SIGNAL: ${value}`);
}

function market(message) {
  if (!enableLogs) return;

  console.log(`📊 MARKET: ${message}`);
}

function risk(message) {
  if (!enableLogs) return;

  console.log(`⚠️ RISK: ${message}`);
}

function ai(message) {
  if (!enableLogs) return;

  console.log(`🧠 AI: ${message}`);
}

module.exports = {
  setEnabled,
  socket,
  signal,
  market,
  risk,
  ai,
};