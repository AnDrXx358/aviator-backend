function analyze(allResults) {
  if (!Array.isArray(allResults) || allResults.length === 0) {
    return {
      contextTag: 'NORMAL',
      isLocalCeiling: false,
      chaosLow15: 0,
      chaosHigh4: 0,
      recentMax: 0,
    };
  }

  const lastValue = allResults[allResults.length - 1];
  const last10 = allResults.slice(-10);

  const chaosLow15 =
    last10.filter((value) => value < 1.5).length;

  const chaosHigh4 =
    last10.filter((value) => value >= 4.0).length;

  // Equivale a tomar las cinco rondas anteriores
  // dentro de la ventana de las últimas seis.
  const recentWindow = allResults.slice(-6, -1);

  const recentMax =
    recentWindow.length > 0
      ? Math.max(...recentWindow)
      : lastValue;

  const isLocalCeiling =
    lastValue >= recentMax * 0.90;

  let contextTag = 'NORMAL';

  if (isLocalCeiling) {
    contextTag = 'TECHO_LOCAL';
  } else if (
    chaosLow15 >= 3 &&
    chaosHigh4 >= 2
  ) {
    contextTag = 'VOLATIL';
  } else if (chaosLow15 >= 5) {
    contextTag = 'RATON';
  }

  return {
    contextTag,
    isLocalCeiling,
    chaosLow15,
    chaosHigh4,
    recentMax,
  };
}

module.exports = {
  analyze,
};