function analyze({
  allResults,
  simpleSignal,
  simpleReason,
  simpleLossStreak,
  rateLast6,
  riseProb,
  hasRecentMicroCrash,
}) {
  const last3 = allResults.slice(-3);
  const last5 = allResults.slice(-5);
  const last8 = allResults.slice(-8);
  const last10 = allResults.slice(-10);

  const lastReal =
    allResults.length > 0
      ? allResults[allResults.length - 1]
      : 0;

  const good15Last3 =
    last3.filter((value) => value >= 1.5).length;

  const good15Last5 =
    last5.filter((value) => value >= 1.5).length;

  const bad15Last5 =
    last5.filter((value) => value < 1.5).length;

  const bad15Last10 =
    last10.filter((value) => value < 1.5).length;

  const deepCrashLast5 =
    last5.filter((value) => value < 1.20).length;

  const deepCrashLast10 =
    last10.filter((value) => value < 1.20).length;

  const explosionLast5 =
    last5.filter((value) => value >= 8.0).length;

  const strongGreenLast8 =
    last8.filter((value) => value >= 2.0).length;

  const lastTwoBad15 =
    last10.length >= 2 &&
    last10[last10.length - 1] < 1.5 &&
    last10[last10.length - 2] < 1.5;

  const toxicLast10 =
    bad15Last10 >= 6 ||
    deepCrashLast10 >= 3;

  const weakLast10 =
    bad15Last10 >= 5 ||
    deepCrashLast10 >= 2 ||
    lastTwoBad15;

  const weakGreen =
    lastReal >= 1.5 &&
    lastReal < 1.70 &&
    good15Last3 < 2;

  const rottenFloor =
    deepCrashLast5 >= 2 &&
    good15Last3 < 2;

  const tooManyRecentFails =
    bad15Last5 >= 3 &&
    good15Last3 < 2;

  const chasingExplosion =
    lastReal >= 8.0 ||
    explosionLast5 >= 2;

  const simpleReconfirmed =
    good15Last3 >= 2 ||
    good15Last5 >= 3 ||
    strongGreenLast8 >= 3;

  let signal = simpleSignal;
  let reason = simpleReason;

  const simpleWantsEntry =
    simpleSignal === 'ENTRAR 1.5' ||
    simpleSignal === 'ENTRAR 2.0';

  if (simpleSignal === 'ENTRAR 2.0') {
    signal = 'ENTRAR 1.5';
    reason =
      'Filtro simple bajado a 1.5 por seguridad';
  }

  if (simpleWantsEntry) {
    if (toxicLast10) {
      signal = 'ESPERAR';
      reason =
        'Guardian: últimas 10 demasiado malas';
    } else if (
      weakLast10 &&
      !simpleReconfirmed
    ) {
      signal = 'ESPERAR';
      reason =
        'Guardian: últimas 10 débiles, falta reconfirmación';
    } else if (
      chasingExplosion &&
      !simpleReconfirmed
    ) {
      signal = 'ESPERAR';
      reason =
        'Guardian: no perseguir explosión inmediata';
    } else if (
      weakGreen &&
      !simpleReconfirmed
    ) {
      signal = 'ESPERAR';
      reason =
        'Guardian: verde débil, falta confirmación';
    } else if (rottenFloor) {
      signal = 'ESPERAR';
      reason =
        'Guardian: piso reciente débil';
    } else if (tooManyRecentFails) {
      signal = 'ESPERAR';
      reason =
        'Guardian: mercado ratón, esperar reconfirmación';
    }
  }

  const simpleNeedsReconfirmation =
    simpleLossStreak >= 2;

  const simpleReconfirmed15 =
    rateLast6 >= 0.58 &&
    last3.length > 0 &&
    allResults
      .slice(-6)
      .filter((value) => value >= 1.5)
      .length >= 4 &&
    allResults
      .slice(-6)
      .filter((value) => value < 1.20)
      .length === 0 &&
    riseProb >= 46 &&
    !hasRecentMicroCrash;

  if (
    simpleNeedsReconfirmation &&
    signal === 'ENTRAR 1.5' &&
    !simpleReconfirmed15
  ) {
    signal = 'ESPERAR';
    reason =
      'Reconfirmando ventaja para 1.5';
  }

  return {
    signal,
    reason,
    metrics: {
      good15Last3,
      good15Last5,
      bad15Last5,
      bad15Last10,
      deepCrashLast5,
      deepCrashLast10,
      explosionLast5,
      strongGreenLast8,
      lastTwoBad15,
      toxicLast10,
      weakLast10,
      simpleReconfirmed,
      simpleReconfirmed15,
    },
  };
}

module.exports = {
  analyze,
};