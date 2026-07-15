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

function analyze(multipliers) {
  if (!Array.isArray(multipliers)) {
    throw new TypeError('multipliers debe ser un arreglo.');
  }

  const values = multipliers.map(Number);

  if (values.some((value) => Number.isNaN(value))) {
    throw new TypeError('multipliers contiene valores inválidos.');
  }

  const last6 = getLast(values, 6);
  const last15 = getLast(values, 15);
  const last30 = getLast(values, 30);
  const last60 = getLast(values, 60);

  const wins15 = countWhere(last15, (value) => value >= 1.5);
  const wins20 = countWhere(last15, (value) => value >= 2.0);

  const rate15 =
    last15.length === 0
      ? 0
      : wins15 / last15.length;

  const rate20 =
    last15.length === 0
      ? 0
      : wins20 / last15.length;

  const wins30_15 = countWhere(
    last30,
    (value) => value >= 1.5
  );

  const wins30_20 = countWhere(
    last30,
    (value) => value >= 2.0
  );

  const rate30_15 =
    last30.length === 0
      ? 0
      : wins30_15 / last30.length;

  const rate30_20 =
    last30.length === 0
      ? 0
      : wins30_20 / last30.length;

  const wins60_15 = countWhere(
    last60,
    (value) => value >= 1.5
  );

  const wins60_20 = countWhere(
    last60,
    (value) => value >= 2.0
  );

  const rate60_15 =
    last60.length === 0
      ? 0
      : wins60_15 / last60.length;

  const rate60_20 =
    last60.length === 0
      ? 0
      : wins60_20 / last60.length;

  const rateLast6 =
    last6.length === 0
      ? 0
      : countWhere(
          last6,
          (value) => value >= 1.5
        ) / last6.length;

  const lowCount = countWhere(
    last60,
    (value) => value < 2
  );

  const midCount = countWhere(
    last60,
    (value) => value >= 2 && value < 5
  );

  const highCount = countWhere(
    last60,
    (value) => value >= 5
  );

  const riseProb =
    last60.length === 0
      ? 0
      : ((midCount + highCount) / last60.length) * 100;

  const badStreak20 = trailingStreak(
    last60,
    (value) => value < 2.0
  );

  const goodStreak20 = trailingStreak(
    last60,
    (value) => value >= 2.0
  );

  const goodStreak15 = trailingStreak(
    last60,
    (value) => value >= 1.5
  );

  const is15Hot = rate15 >= 0.7;
  const is30Hot = rate30_20 >= 0.6;
  const is60Hot = rate60_20 >= 0.55;

  const is15Cold = rate15 <= 0.4;
  const is30Cold = rate30_20 <= 0.45;
  const is60Cold = rate60_20 <= 0.5;

  const alignedHot =
    is15Hot &&
    is30Hot &&
    is60Hot;

  const alignedCold =
    is15Cold &&
    is30Cold &&
    is60Cold;

  const contradiction15 =
    (rate15 > 0.75 && rate30_15 < 0.48) ||
    (rate15 < 0.35 && rate30_15 > 0.68);

  const contradiction20 =
    (rate20 > 0.65 && rate30_20 < 0.35) ||
    (rate20 < 0.22 && rate30_20 > 0.65);

  const contradictionShortVsMid =
    contradiction15 &&
    contradiction20;

  const contradictionShortVsLong = false;

  const avg30 =
    last30.length === 0
      ? 0
      : last30.reduce(
          (sum, value) => sum + value,
          0
        ) / last30.length;

  const isExhausted =
    avg30 > 2.5 &&
    rate60_20 > 0.45 &&
    rate60_15 > 0.70;

  const isColdZone =
    rate60_15 < 0.55 &&
    rate60_20 < 0.30;

  const confirm15Slow =
    rate30_15 >= 0.55 &&
    rate60_15 >= 0.52;

  const confirm20Slow =
    rate30_20 >= 0.58 &&
    rate60_20 >= 0.55;

  const isMomentum =
    alignedHot &&
    badStreak20 <= 1 &&
    riseProb >= 62;

  const isTrendContinuation =
    goodStreak20 >= 3 &&
    rate15 >= 0.65 &&
    rate30_20 >= 0.6;

  const isFakeDip =
    badStreak20 >= 1 &&
    goodStreak20 < 2 &&
    rate15 < 0.60;

  const isLateEntry =
    goodStreak20 >= 6 &&
    rate30_20 >= 0.7;

  const strongMomentum =
    rateLast6 >= 0.66 &&
    countWhere(
      last6,
      (value) => value < 1.5
    ) <= 1;

  const ultraStrong =
    rateLast6 >= 0.75;

  const hasRecentMicroCrash =
    countWhere(
      last6,
      (value) => value < 1.2
    ) >= 2;

  const isProRacha =
    rateLast6 >= 0.70 &&
    rate15 >= 0.60 &&
    badStreak20 <= 2;

  const lastReal =
    last60.length > 0
      ? last60[last60.length - 1]
      : 0;

  const avoidAfterExplosion =
    lastReal > 10.0;

  const weakMomentum =
    riseProb < 45 &&
    rate30_15 < 0.52 &&
    rate60_15 < 0.52 &&
    rate60_20 < 0.32;

  const last10 = getLast(last60, 10);

  const under15Ultimos10 =
    last60.length >= 10
      ? countWhere(
          last10,
          (value) => value < 1.50
        )
      : 0;

  const under20Ultimos10 =
    last60.length >= 10
      ? countWhere(
          last10,
          (value) => value < 2.00
        )
      : 0;

  const microCrashCountUltimos10 =
    last60.length >= 10
      ? countWhere(
          last10,
          (value) => value < 1.20
        )
      : 0;

  let marketPhase;

  if (
    goodStreak20 >= 4 &&
    rate30_20 >= 0.65 &&
    rate60_20 >= 0.55
  ) {
    marketPhase = 'RACHA_PROLONGADA';
  } else if (isMomentum) {
    marketPhase = 'MOMENTUM';
  } else if (
    badStreak20 >= 3 &&
    riseProb > 55
  ) {
    marketPhase = 'REBOTE';
  } else {
    marketPhase = 'NEUTRO';
  }

  const isOverextended =
    goodStreak20 >= 4 &&
    riseProb >= 60 &&
    (
      marketPhase === 'MOMENTUM' ||
      marketPhase === 'RACHA_PROLONGADA'
    );

  const dirtyMarket =
    under15Ultimos10 >= 8 &&
    rateLast6 < 0.45 &&
    rate30_15 < 0.52;

  let positiveScore = 0;

  if (riseProb >= 55) {
    positiveScore += 1;
  }

  if (rateLast6 >= 0.60) {
    positiveScore += 1;
  }

  if (rate30_15 >= 0.56) {
    positiveScore += 1;
  }

  if (microCrashCountUltimos10 <= 2) {
    positiveScore += 1;
  }

  if (under20Ultimos10 <= 4) {
    positiveScore += 1;
  }

  if (lastReal >= 2.0) {
    positiveScore += 1;
  }

  if (goodStreak20 >= 2) {
    positiveScore += 1;
  }

  const strongConfirmation =
    positiveScore >= 5;

  const enthusiasmTriggered =
    weakMomentum &&
    strongConfirmation;

  const block2x =
    under20Ultimos10 >= 7 ||
    microCrashCountUltimos10 >= 5 ||
    (weakMomentum && !strongConfirmation) ||
    isOverextended;

  if (enthusiasmTriggered) {
    console.log('🚀 ENTUSIASMO ENGINE ACTIVADO');
    console.log(`positiveScore: ${positiveScore}`);
    console.log(`riseProb: ${riseProb}`);
    console.log(`rateLast6: ${rateLast6}`);
    console.log(`rate30_15: ${rate30_15}`);
    console.log(
      `under20Ultimos10: ${under20Ultimos10}`
    );
    console.log(`goodStreak20: ${goodStreak20}`);
  }

  return {
    last6,
    last15,
    last30,
    last60,

    rate15,
    rate20,

    rate30_15,
    rate30_20,

    rate60_15,
    rate60_20,

    rateLast6,

    lowCount,
    midCount,
    highCount,

    riseProb,

    badStreak20,
    goodStreak20,
    goodStreak15,

    alignedHot,
    alignedCold,

    contradictionShortVsMid,
    contradictionShortVsLong,

    isExhausted,
    isColdZone,

    confirm15Slow,
    confirm20Slow,

    isMomentum,
    isTrendContinuation,

    isFakeDip,
    isLateEntry,

    strongMomentum,
    ultraStrong,

    hasRecentMicroCrash,
    isProRacha,

    avoidAfterExplosion,

    weakMomentum,

    dirtyMarket,
    block2x,

    under15Ultimos10,
    under20Ultimos10,

    isOverextended,

    marketPhase,
  };
}

function calculateStats(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      badStreak: 0,
      goodStreak: 0,
      avg10: 0,
      trend: 'N/A',
    };
  }

  const values = data.map(Number);

  if (values.some((value) => Number.isNaN(value))) {
    throw new TypeError('data contiene valores inválidos.');
  }

  const badStreak = trailingStreak(
    values,
    (value) => value < 2
  );

  const goodStreak = trailingStreak(
    values,
    (value) => value > 5
  );

  const take = Math.min(values.length, 10);

  const last10 = values.slice(values.length - take);

  const avg10 =
    take === 0
      ? 0
      : last10.reduce(
          (sum, value) => sum + value,
          0
        ) / take;

  let trend;

  if (avg10 < 2) {
    trend = 'ROJA';
  } else if (avg10 > 4) {
    trend = 'VERDE';
  } else {
    trend = 'NEUTRAL';
  }

  const last6 = getLast(values, 6);

  const goodLast6 = countWhere(
    last6,
    (value) => value >= 1.5
  );

  const rateLast6 =
    last6.length === 0
      ? 0
      : goodLast6 / last6.length;

  const badLast6 = countWhere(
    last6,
    (value) => value < 1.5
  );

  const cleanStreak6 =
    badLast6 <= 2;

  return {
    badStreak,
    goodStreak,
    avg10,
    trend,
    rateLast6,
    cleanStreak6,
  };
}

function calculateHealthyPullback(results) {
  if (!Array.isArray(results) || results.length < 5) {
    return false;
  }

  const last5 = results.slice(results.length - 5).map(Number);

  if (last5.some((value) => Number.isNaN(value))) {
    throw new TypeError('results contiene valores inválidos.');
  }

  const [r1, r2, r3, r4, r5] = last5;

  const wasStrong =
    [r1, r2, r3].filter((value) => value >= 1.5).length >= 2;

  const mildDrop =
    r4 < r3 &&
    r4 >= 1.20;

  const recovering =
    r5 >= r4;

  const noStrongBreak =
    [r4, r5].every((value) => value >= 1.20);

  return (
    wasStrong &&
    mildDrop &&
    recovering &&
    noStrongBreak
  );
}

function calcStats(rows, options = {}) {
  const {
    lastN = 20,
    target = 2.0,
  } = options;

  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      buenas: 0,
      malas: 0,
      total: 0,
      winrate: 0,

      avgMultiplier: 0,
      streak: 0,
      streakType: '',

      sumStake: 0,
      sumProfit: 0,
      roi: 0,
      maxBankroll: 0,
      minBankroll: 0,
      maxDrawdown: 0,

      last5Good: 0,
      proConf: 0,

      score: 0,
      advice: 'ESPERAR',
    };
  }

  const values = rows.map(Number);

  if (values.some((value) => Number.isNaN(value))) {
    throw new TypeError('rows contiene valores inválidos.');
  }

  const start = Math.max(0, values.length - lastN);
  const last = values.slice(start);

  const buenas = countWhere(
    last,
    (value) => value >= target
  );

  let streak = 0;
  let streakType = '';

  for (let index = last.length - 1; index >= 0; index -= 1) {
    const isGood = last[index] >= target;

    if (streak === 0) {
      streakType = isGood ? 'BUENAS' : 'MALAS';
      streak = 1;
      continue;
    }

    const sameType =
      (isGood && streakType === 'BUENAS') ||
      (!isGood && streakType === 'MALAS');

    if (!sameType) {
      break;
    }

    streak += 1;
  }

  const total = last.length;
  const malas = total - buenas;
  const winrate = total === 0 ? 0 : buenas / total;

  const avgMultiplier =
    last.length === 0
      ? 0
      : last.reduce(
          (sum, value) => sum + value,
          0
        ) / last.length;

  const sumStake = 0;
  const sumProfit = 0;
  const roi = sumStake === 0 ? 0 : sumProfit / sumStake;

  const maxBankroll = 0;
  const minBankroll = 0;
  const maxDrawdown = 0;

  const last5 =
    last.length <= 5
      ? last
      : last.slice(last.length - 5);

  const last5Good = countWhere(
    last5,
    (value) => value >= target
  );

  const recentRate =
    last5.length === 0
      ? 0
      : last5Good / last5.length;

  const proConf =
    (recentRate * 0.7) +
    (winrate * 0.3);

  const base = proConf * 100;
  const trend =
    ((avgMultiplier / target) - 1) * 20;

  const streakImpact =
    (streakType === 'MALAS' ? -1 : 1) *
    (streak * 4);

  let rawScore =
    base +
    trend +
    streakImpact;

  rawScore = Math.max(0, Math.min(100, rawScore));

  const score = Math.round(rawScore);

  const advice =
    score >= 70
      ? 'ENTRAR'
      : score >= 50
        ? 'ESPERAR'
        : 'EVITAR';

  return {
    buenas,
    malas,
    total,
    winrate,

    avgMultiplier,
    streak,
    streakType,

    sumStake,
    sumProfit,
    roi,
    maxBankroll,
    minBankroll,
    maxDrawdown,

    last5Good,
    proConf,

    score,
    advice,
  };
}

module.exports = {
  analyze,
  calculateStats,
  calculateHealthyPullback,
  calcStats,
};