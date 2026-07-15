function analyze({
  allResults,
  finalSignal,
  finalSignalReason,
  finalSignalFromSimple,
  simpleLossStreak,
  rateLast6,
  riseProb,
  hasRecentMicroCrash,
  contradictionShortVsMid,
  contradictionShortVsLong,
}) {
  const last10 = allResults.slice(-10);
  const last3 = allResults.slice(-3);

  const lastReal =
    allResults.length > 0
      ? allResults[allResults.length - 1]
      : 0;

  const bad15Last10 =
    last10.filter((value) => value < 1.5).length;

  const deepCrashLast10 =
    last10.filter((value) => value < 1.20).length;

  const good15Last3 =
    last3.filter((value) => value >= 1.5).length;

  const lastTwoBad15 =
    last10.length >= 2 &&
    last10[last10.length - 1] < 1.5 &&
    last10[last10.length - 2] < 1.5;

  const recovered =
    good15Last3 >= 2 &&
    rateLast6 >= 0.58 &&
    riseProb >= 48 &&
    deepCrashLast10 <= 1 &&
    !hasRecentMicroCrash &&
    !contradictionShortVsMid &&
    !contradictionShortVsLong;

  const toxicZone =
    bad15Last10 >= 6 ||
    deepCrashLast10 >= 3;

  const weakZone =
    bad15Last10 >= 5 ||
    deepCrashLast10 >= 2 ||
    lastTwoBad15;

  const needsRecovery =
    simpleLossStreak >= 2;

  const bad20Last10 =
    last10.filter((value) => value < 2.0).length;

  const bad20Last7 =
    last10
      .slice(-7)
      .filter((value) => value < 2.0)
      .length;

  const bad20Last3 =
    last3.filter((value) => value < 2.0).length;

  const ratonTrend =
    bad20Last10 >= 7 ||
    bad20Last7 >= 5 ||
    bad20Last3 >= 2;

  const ratonRecoveryStrong =
    good15Last3 >= 2 &&
    last3.filter((value) => value >= 2.0).length >= 2 &&
    rateLast6 >= 0.66 &&
    riseProb >= 58 &&
    deepCrashLast10 <= 1 &&
    !hasRecentMicroCrash &&
    !contradictionShortVsMid &&
    !contradictionShortVsLong;

  const ratonStructure =
    last10.filter((value) => value < 2.0).length >= 7 ||
    last10.filter((value) => value < 1.5).length >= 5 ||
    last3.filter((value) => value < 1.5).length >= 2;

  const postLossPressure =
    simpleLossStreak >= 1 &&
    ratonStructure;

  const strongRecovery =
    last3.filter((value) => value >= 2.0).length >= 2 &&
    last3.length > 0 &&
    last3[last3.length - 1] >= 1.5 &&
    deepCrashLast10 <= 1 &&
    rateLast6 >= 0.66 &&
    riseProb >= 52 &&
    !hasRecentMicroCrash &&
    !contradictionShortVsMid &&
    !contradictionShortVsLong;

  const cleanPostSpikeContext =
    good15Last3 >= 2 &&
    rateLast6 >= 0.66 &&
    riseProb >= 52 &&
    deepCrashLast10 <= 1 &&
    !hasRecentMicroCrash &&
    !contradictionShortVsMid &&
    !contradictionShortVsLong;

  const diffusePostSpike =
    lastReal >= 7.0 &&
    !cleanPostSpikeContext;

  const wantsEntry =
    finalSignal === 'ENTRAR 1.5' ||
    finalSignal === 'ENTRAR 2.0';

  let signal = finalSignal;
  let reason = finalSignalReason;
  let fromSimple = finalSignalFromSimple;

  if (wantsEntry) {
    if (
      (postLossPressure && !strongRecovery) ||
      (ratonTrend && !ratonRecoveryStrong)
    ) {
      signal = 'ESPERAR';
      reason =
        'Safety Gate: zona ratón/post-loss, esperando recuperación fuerte';
      fromSimple = false;
    } else if (
      toxicZone ||
      diffusePostSpike
    ) {
      signal = 'ESPERAR';
      reason = diffusePostSpike
        ? 'Safety Gate: post-rosa difuso, esperando limpieza'
        : 'Safety Gate: últimas 10 demasiado débiles';
      fromSimple = false;
    } else if (
      (weakZone || needsRecovery) &&
      !recovered
    ) {
      signal = 'ESPERAR';
      reason =
        'Safety Gate: esperando reconfirmación real';
      fromSimple = false;
    }
  }

  return {
    signal,
    reason,
    fromSimple,
    metrics: {
      bad15Last10,
      deepCrashLast10,
      good15Last3,
      lastTwoBad15,
      recovered,
      toxicZone,
      weakZone,
      needsRecovery,
      bad20Last10,
      bad20Last7,
      bad20Last3,
      ratonTrend,
      ratonRecoveryStrong,
      ratonStructure,
      postLossPressure,
      strongRecovery,
      cleanPostSpikeContext,
      diffusePostSpike,
    },
  };
}

module.exports = {
  analyze,
};