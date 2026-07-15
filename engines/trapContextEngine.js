function countWhere(values, predicate) {
  return values.reduce(
    (count, value) => count + (predicate(value) ? 1 : 0),
    0
  );
}

function trailingStreak(values, predicate) {
  let streak = 0;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (!predicate(values[index])) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function analyze({
  allResults,
  candidateSignal,
  simpleLossStreak = 0,
}) {
  if (
    candidateSignal !== 'ENTRAR 1.5' &&
    candidateSignal !== 'ENTRAR 2.0'
  ) {
    return {
      action: 'ALLOW',
      confidence: 100,
      reason: 'Sin señal candidata',
      shouldStop: false,
    };
  }

  if (!Array.isArray(allResults) || allResults.length < 30) {
    return {
      action: 'ALLOW',
      confidence: 55,
      reason: 'Historial insuficiente',
      shouldStop: false,
    };
  }

  const values = allResults.map(Number);

  if (values.some((value) => Number.isNaN(value))) {
    throw new TypeError('allResults contiene valores inválidos.');
  }

  const last6 = values.slice(-6);
  const last10 = values.slice(-10);
  const last30 = values.slice(-30);

  const last = values[values.length - 1];

  const good15Last3 = countWhere(
    last6.slice(-3),
    (value) => value >= 1.5
  );

  const good15Last6 = countWhere(
    last6,
    (value) => value >= 1.5
  );

  const bad15Last6 = countWhere(
    last6,
    (value) => value < 2.0
  );

  const good15Last10 = countWhere(
    last10,
    (value) => value >= 1.5
  );

  const bad15Last10 = countWhere(
    last10,
    (value) => value < 2.0
  );

  const deepCrashLast6 = countWhere(
    last6,
    (value) => value <= 1.20
  );

  const deepCrashLast10 = countWhere(
    last10,
    (value) => value <= 1.20
  );

  const spikeLast6 = countWhere(
    last6,
    (value) => value >= 5.0
  );

  const spikeLast10 = countWhere(
    last10,
    (value) => value >= 5.0
  );

  const rate30_15 =
    countWhere(last30, (value) => value >= 1.5) /
    last30.length;

  let alternations = 0;

  for (let index = 1; index < last10.length; index += 1) {
    const previousGood = last10[index - 1] >= 1.5;
    const currentGood = last10[index] >= 1.5;

    if (previousGood !== currentGood) {
      alternations += 1;
    }
  }

  const currentBad15Streak = trailingStreak(
    last10,
    (value) => value < 2.0
  );

  const cleanRecovery =
    good15Last6 >= 4 &&
    good15Last3 >= 2 &&
    deepCrashLast6 === 0 &&
    rate30_15 >= 0.55;

  const strongCleanRecovery =
    good15Last6 >= 5 &&
    good15Last3 >= 2 &&
    deepCrashLast6 === 0 &&
    rate30_15 >= 0.58;

  const last10TooBad =
    bad15Last10 >= 6 ||
    deepCrashLast10 >= 2 ||
    currentBad15Streak >= 3;

  if (last10TooBad && !strongCleanRecovery) {
    return {
      action: 'BLOCK',
      confidence: 86,
      reason:
        'TrapEngine: últimas 10 demasiado malas, no buscar rebote forzado',
      shouldStop: true,
    };
  }

  const oneAndOneTrap =
    alternations >= 6 &&
    bad15Last10 >= 4 &&
    good15Last10 >= 4 &&
    good15Last6 < 5;

  if (oneAndOneTrap && !cleanRecovery) {
    return {
      action: 'WAIT',
      confidence: 76,
      reason:
        'TrapEngine: patrón 1 y 1, evitar entrar justo después de la buena',
      shouldStop: true,
    };
  }

  const ceilingTrap =
    last >= 5.0 &&
    (
      spikeLast6 >= 1 ||
      spikeLast10 >= 2
    ) &&
    !strongCleanRecovery;

  if (ceilingTrap) {
    return {
      action: 'WAIT',
      confidence: 74,
      reason:
        'TrapEngine: posible techo/post-avionazo, esperar confirmación',
      shouldStop: true,
    };
  }

  const lowCrashTrap =
    last <= 1.20 &&
    !cleanRecovery;

  if (lowCrashTrap) {
    return {
      action: 'WAIT',
      confidence: 78,
      reason:
        'TrapEngine: último vuelo muy bajo, esperando aire real',
      shouldStop: true,
    };
  }

  const afterOneLossCaution =
    simpleLossStreak === 1 &&
    bad15Last6 >= 3 &&
    !cleanRecovery;

  if (afterOneLossCaution) {
    return {
      action: 'WAIT',
      confidence: 68,
      reason:
        'TrapEngine: primera pérdida, mercado dudoso, esperar mejor confirmación',
      shouldStop: true,
    };
  }

  const afterTwoLossCaution =
    simpleLossStreak >= 2 &&
    !strongCleanRecovery;

  if (afterTwoLossCaution) {
    return {
      action: 'WAIT',
      confidence: 82,
      reason:
        'TrapEngine: dos pérdidas, exigir recuperación fuerte',
      shouldStop: true,
    };
  }

  if (strongCleanRecovery) {
    return {
      action: 'ALLOW',
      confidence: 84,
      reason:
        'TrapEngine: recuperación fuerte, permitir señal',
      shouldStop: false,
    };
  }

  if (cleanRecovery) {
    return {
      action: 'ALLOW',
      confidence: 72,
      reason:
        'TrapEngine: recuperación aceptable, permitir señal',
      shouldStop: false,
    };
  }

  return {
    action: 'ALLOW',
    confidence: 62,
    reason:
      'TrapEngine: sin trampa fuerte detectada',
    shouldStop: false,
  };
}

module.exports = {
  analyze,
};