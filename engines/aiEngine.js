function randomMessage(messages) {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

function analyze({
  riseProb,

  rateLast6,
  rate30_15,
  rate60_15,
  rate60_20,

  microCrashCount,

  goodStreak20,
  badStreak20,

  strongMomentum,
  isProRacha,

  dirtyMarket,

  contradictionShortVsMid,
  contradictionShortVsLong,

  isExhausted,
  isFakeDip,
}) {
  let aiState = '⚖️ Neutral';
  let aiMessage = 'Mercado sin dirección clara.';
  let riskMessage = '';
  let aiContext = 'neutral';

  let marketScore = 0;

  marketScore += (rate60_15 - 0.5) * 1.0;
  marketScore += (rate30_15 - 0.5) * 1.4;
  marketScore += (rate60_20 - 0.4) * 1.6;
  marketScore += (rateLast6 - 0.5) * 2.0;

  let crashImpact = 0;

  if (microCrashCount === 1) {
    crashImpact = 0.05;
  } else if (microCrashCount === 2) {
    crashImpact = 0.12;
  } else if (microCrashCount === 3) {
    crashImpact = 0.28;
  } else if (microCrashCount >= 4) {
    crashImpact = 0.50;
  }

  marketScore -= crashImpact;

  if (
    isProRacha &&
    riseProb >= 60 &&
    goodStreak20 >= 3
  ) {
    aiState = '🔥 Racha PRO';

    aiMessage = randomMessage([
      'Esto agarró ritmo serio.',
      'La frecuencia viene muy fuerte.',
      'Aquí sí se siente continuidad real.',
      'El mercado viene respondiendo bastante limpio.',
      'Esto todavía mantiene ventaja clara.',
    ]);

    aiContext = 'trend_strong';
  } else if (
    strongMomentum &&
    riseProb >= 55 &&
    !dirtyMarket
  ) {
    aiState = '🚀 Momentum';

    aiMessage = randomMessage([
      'El flujo sigue acompañando.',
      'Se mantiene una estructura bastante jugable.',
      'Todavía viene pagando cómodo.',
      'La continuidad sigue viva.',
      'El mercado sigue respondiendo bien.',
    ]);

    aiContext = 'trend';
  } else if (
    isFakeDip ||
    microCrashCount >= 2
  ) {
    aiState = '↘️ Pullback';

    aiMessage = randomMessage([
      'Hay retroceso, pero todavía no rompe del todo.',
      'El mercado perdió algo de fuerza.',
      'Esto sigue vivo, aunque más incómodo.',
      'Se siente más pausado ahora mismo.',
      'Momentum más lento en las últimas rondas.',
    ]);

    aiContext = 'pullback';
  } else if (
    contradictionShortVsMid ||
    contradictionShortVsLong
  ) {
    aiState = '🌀 Inestable';

    aiMessage = randomMessage([
      'Esto está raro todavía.',
      'Mercado bastante mixto ahora mismo.',
      'No termina de definir dirección.',
      'Hay señales cruzadas por todos lados.',
      'Mucho ruido y poca claridad.',
    ]);

    aiContext = 'volatile';
  } else if (
    dirtyMarket ||
    badStreak20 >= 4
  ) {
    aiState = '❄️ Presión bajista';

    aiMessage = randomMessage([
      'Esto se está ensuciando bastante.',
      'La presión bajista sigue mandando.',
      'No está dejando continuidad clara.',
      'Demasiadas micro-caídas seguidas.',
      'Aquí el mercado está cobrando entradas apresuradas.',
    ]);

    aiContext = 'danger_zone';
  } else {
    aiState = '⚖️ Neutral';

    aiMessage = randomMessage([
      'Mercado sin ventaja clara por ahora.',
      'Todavía no muestra intención fuerte.',
      'Está moviéndose bastante neutro.',
      'No termina de acelerar.',
      'Por ahora sigue bastante mixto.',
    ]);

    aiContext = 'neutral';
  }

  if (isExhausted) {
    riskMessage =
      '🔥 Ojo, esto ya viene demasiado arriba.';
  } else if (microCrashCount >= 4) {
    riskMessage =
      '🚨 Mucha presión negativa reciente.';
  }

  return {
    aiState,
    aiMessage,
    riskMessage,
    aiContext,
    marketScore,
  };
}

function buildAiState({
  allResults,
  riseProb,
  rateLast6,
  rate30_15,
  rate60_15,
  rate60_20,
  goodStreakNow,
  badStreakNow,
  strongMomentum,
  isProRacha,
  dirtyMarket,
  contradictionShortVsMid,
  contradictionShortVsLong,
  isExhausted,
  isFakeDip,
}) {
  if (!Array.isArray(allResults)) {
    throw new TypeError('allResults debe ser un arreglo.');
  }

  const microCrashCount = allResults
    .slice(-5)
    .filter((value) => value < 1.5)
    .length;

  const result = analyze({
    riseProb,
    rateLast6,
    rate30_15,
    rate60_15,
    rate60_20,
    microCrashCount,
    goodStreak20: goodStreakNow,
    badStreak20: badStreakNow,
    strongMomentum,
    isProRacha,
    dirtyMarket,
    contradictionShortVsMid,
    contradictionShortVsLong,
    isExhausted,
    isFakeDip,
  });

  return {
    aiMessage: result.aiMessage,
    riskMessage: result.riskMessage,
    aiState: result.aiState,
  };
}

module.exports = {
  analyze,
  buildAiState,
};