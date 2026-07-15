function analyze({
  avg60,
  highCount,
  riseProb,
  badStreakNow,
  rate15,
  rate20,
}) {
  const overExploded =
    avg60 >= 7.5 &&
    highCount >= 13 &&
    riseProb < 60;

  const rate15Pct =
    (rate15 * 100).toFixed(0);

  const rate20Pct =
    (rate20 * 100).toFixed(0);

  if (overExploded) {
    return {
      signal: 'ESPERAR',
      reason:
        `sobre-extensión | avg60: ${avg60.toFixed(2)} | >5x: ${highCount}`,
      overExploded,
    };
  }

  if (badStreakNow >= 10) {
    return {
      signal: 'ENTRAR 2.0',
      reason:
        `racha mala fuerte (${badStreakNow}) | ` +
        `15 velas | 1.5: ${rate15Pct}% | 2.0: ${rate20Pct}%`,
      overExploded,
    };
  }

  if (badStreakNow >= 8) {
    return {
      signal: 'ENTRAR 1.5',
      reason:
        `racha mala alta (${badStreakNow}) | ` +
        `15 velas | 1.5: ${rate15Pct}% | 2.0: ${rate20Pct}%`,
      overExploded,
    };
  }

  if (
    riseProb >= 60 &&
    rate20 >= 0.60
  ) {
    return {
      signal: 'ENTRAR 2.0',
      reason:
        `momentum favorable | ` +
        `15 velas | 1.5: ${rate15Pct}% | 2.0: ${rate20Pct}%`,
      overExploded,
    };
  }

  if (
    riseProb >= 52 &&
    rate15 >= 0.60
  ) {
    return {
      signal: 'ENTRAR 1.5',
      reason:
        `ventaja moderada | ` +
        `15 velas | 1.5: ${rate15Pct}% | 2.0: ${rate20Pct}%`,
      overExploded,
    };
  }

  return {
    signal: 'ESPERAR',
    reason:
      `15 velas | 1.5: ${rate15Pct}% | 2.0: ${rate20Pct}%`,
    overExploded,
  };
}

module.exports = {
  analyze,
};