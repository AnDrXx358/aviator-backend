function getLast(values, count) {
  return values.length >= count
    ? values.slice(values.length - count)
    : [...values];
}

function countWhere(values, predicate) {
  return values.reduce(
    (count, value) => count + (predicate(value) ? 1 : 0),
    0
  );
}

function analyze({
  last6,
  last15,
  last30,

  rateLast6,
  rate15,
  rate20,
  rate30_15,
  rate30_20,

  dirtyMarket,
  alignedCold,
  contradictionShortVsMid,
  contradictionShortVsLong,
  weakMomentum,
  degradingMomentum,
  block2x,

  under15Ultimos10,
  under20Ultimos10,
}) {
  if (last15.length < 10) {
    return {
      signal: 'ESPERAR',
      reason: 'Filtro simple: muestra insuficiente',
      evidenceCount: 0,
    };
  }

  const last3 = getLast(last15, 3);
  const last10 = getLast(last15, 10);
  const lastReal = last15.length > 0
    ? last15[last15.length - 1]
    : 0;

  const trapLast10 = getLast(last30, 10);
  const trapLast8 = getLast(last30, 8);
  const trapLast5 = getLast(last30, 5);

  const trapBad15Last10 = countWhere(
    trapLast10,
    (value) => value < 1.5
  );

  const trapGood15Last10 = countWhere(
    trapLast10,
    (value) => value >= 1.5
  );

  const trapDeepCrashLast10 = countWhere(
    trapLast10,
    (value) => value <= 1.20
  );

  const trapBigSpikeLast5 = countWhere(
    trapLast5,
    (value) => value >= 5.0
  );

  const trapStrongGreenLast5 = countWhere(
    trapLast5,
    (value) => value >= 2.0
  );

  const last3FromLast6 = getLast(last6, 3);

  const trapGood15Last3 = countWhere(
    last3FromLast6,
    (value) => value >= 1.5
  );

  let trapAlternations = 0;

  for (let index = 1; index < trapLast8.length; index += 1) {
    const previousGood = trapLast8[index - 1] >= 1.5;
    const currentGood = trapLast8[index] >= 1.5;

    if (previousGood !== currentGood) {
      trapAlternations += 1;
    }
  }

  const alternatingTrap =
    trapLast8.length >= 6 &&
    trapAlternations >= 5;

  const ceilingTrap =
    lastReal >= 4.5 &&
    trapBigSpikeLast5 >= 1 &&
    trapDeepCrashLast10 >= 1;

  const rangeMarket =
    trapLast10.length >= 8 &&
    trapBad15Last10 >= 4 &&
    trapGood15Last10 >= 4;

  const trapReconfirmed =
    trapGood15Last3 >= 2 ||
    trapStrongGreenLast5 >= 2 ||
    rateLast6 >= 0.66;

  const trapContext =
    (alternatingTrap && rangeMarket) ||
    (ceilingTrap && rangeMarket);

  const good15Last15 = countWhere(
    last15,
    (value) => value >= 1.5
  );

  const good15Last3 = countWhere(
    last3,
    (value) => value >= 1.5
  );

  const good15Last6 = countWhere(
    last6,
    (value) => value >= 1.5
  );

  const good20Last6 = countWhere(
    last6,
    (value) => value >= 2.0
  );

  const microCrash10 = countWhere(
    last10,
    (value) => value < 1.20
  );

  const deepCrash6 = countWhere(
    last6,
    (value) => value < 1.20
  );

  const mediocreRecoveries = countWhere(
    trapLast5,
    (value) => value >= 1.20 && value <= 2.00
  );

  const strongFlights = countWhere(
    trapLast5,
    (value) => value >= 3.50
  );

  const reboundMediocre =
    mediocreRecoveries >= 3 &&
    strongFlights === 0;

  const recentHugeSpike =
    trapLast5.some((value) => value >= 15.0);

  const mediocrePostSpike =
    recentHugeSpike &&
    lastReal >= 2.0 &&
    lastReal <= 5.0;

  const recentStrongFlight =
    lastReal >= 6.0;

  const deadMarket =
    dirtyMarket ||
    alignedCold ||
    contradictionShortVsMid ||
    contradictionShortVsLong ||
    (
      weakMomentum &&
      rateLast6 < 0.50 &&
      rate30_15 < 0.52
    ) ||
    (
      deepCrash6 >= 2 &&
      rateLast6 < 0.55
    );

  if (deadMarket) {
    return {
      signal: 'ESPERAR',
      reason: 'Filtro simple: mercado muerto',
      evidenceCount: 0,
    };
  }

  let evidence15 = 0;
  const reasons15 = [];

  if (!degradingMomentum) {
    evidence15 += 1;
    reasons15.push('momentum no degradado');
  }

  if (good15Last15 >= 9) {
    evidence15 += 1;
    reasons15.push(`${good15Last15}/15 sobre 1.5`);
  }

  if (good15Last6 >= 4) {
    evidence15 += 1;
    reasons15.push(`${good15Last6}/6 recientes pagan 1.5`);
  }

  if (good15Last3 >= 2) {
    evidence15 += 1;
    reasons15.push('2 de últimos 3 pagan 1.5');
  }

  if (rate30_15 >= 0.54) {
    evidence15 += 1;
    reasons15.push('30 velas sostienen 1.5');
  }

  if (rateLast6 >= 0.50) {
    evidence15 += 1;
    reasons15.push('últimos 6 jugables');
  }

  if (under15Ultimos10 <= 5) {
    evidence15 += 1;
    reasons15.push('últimos 10 no están rotos');
  }

  if (microCrash10 <= 3) {
    evidence15 += 1;
    reasons15.push('microcrash controlado');
  }

  if (reboundMediocre && evidence15 > 0) {
    evidence15 -= 1;
    reasons15.push('rebote mediocre');
  }

  if (mediocrePostSpike && evidence15 > 0) {
    evidence15 -= 1;
    reasons15.push('post explosión reciente');
  }

  if (recentStrongFlight && evidence15 > 0) {
    evidence15 -= 1;
    reasons15.push('vuelo fuerte reciente');
  }

  const simple15 =
    evidence15 >= 5 &&
    under15Ultimos10 <= 5 &&
    microCrash10 <= 3 &&
    lastReal >= 1.40;

  if (trapContext && !trapReconfirmed) {
    return {
      signal: 'ESPERAR',
      reason: alternatingTrap
        ? 'Trap Guard: mercado 1 y 1, esperando confirmación'
        : ceilingTrap
          ? 'Trap Guard: posible techo, evitando perseguir subida'
          : 'Trap Guard: mercado lateral, falta confirmación',
      evidenceCount: evidence15,
    };
  }

  if (simple15) {
    return {
      signal: 'ENTRAR 1.5',
      reason: `Filtro simple 1.5: ${reasons15.slice(0, 3).join(' | ')}`,
      evidenceCount: evidence15,
    };
  }

  if (
    good20Last6 >= 3 &&
    rate30_20 >= 0.45 &&
    !block2x
  ) {
    return {
      signal: 'ESPERAR',
      reason: 'Filtro simple: 2.0 detectado, reservado al motor principal',
      evidenceCount: evidence15,
    };
  }

  return {
    signal: 'ESPERAR',
    reason: 'Filtro simple: sin evidencia suficiente',
    evidenceCount: evidence15,
  };
}

module.exports = {
  analyze,
};