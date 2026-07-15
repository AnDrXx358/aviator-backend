const MAX_FLIGHTS = 1000;
const MAX_RECENT_TIMESTAMPS = 2000;

let multipliers = [];
const recentTimestamps = new Set();

function replaceFlights(values) {
  multipliers = Array.isArray(values)
    ? values.filter((value) => typeof value === 'number')
    : [];

  if (multipliers.length > MAX_FLIGHTS) {
    multipliers = multipliers.slice(-MAX_FLIGHTS);
  }
}

function getFlights() {
  return [...multipliers];
}

function getFlightCount() {
  return multipliers.length;
}

function addFlight(multiplier) {
  multipliers.push(multiplier);

  if (multipliers.length > MAX_FLIGHTS) {
    multipliers.shift();
  }
}

function removeLastFlight() {
  return multipliers.pop() ?? null;
}

function hasTimestamp(timestamp) {
  return recentTimestamps.has(timestamp);
}

function registerTimestamp(timestamp) {
  recentTimestamps.add(timestamp);

  if (recentTimestamps.size > MAX_RECENT_TIMESTAMPS) {
    const oldestTimestamp = recentTimestamps.values().next().value;
    recentTimestamps.delete(oldestTimestamp);
  }
}

module.exports = {
  replaceFlights,
  getFlights,
  getFlightCount,
  addFlight,
  removeLastFlight,
  hasTimestamp,
  registerTimestamp,
};