const STRATEGY_CONFIDENCE = Object.freeze({
  pullbackSano: 0.95,
  pullbackFalso: 0.80,
  continuacion: 0.75,
  recuperacionModerada: 0.72,
  mercadoBalanceado: 0.82,
  sobrelectura: 0.85,
  hotMarket: 0.88,
  presionVerdeAlta: 0.80,
  reboteDebil: 0.65,
  recenciaPerfecta: 0.90,
  desconocida: 0.50,

  continuacionPullback: 0.80,
  continuacionBalanceada: 0.75,
  continuacionPura: 0.70,

  pullbackReal: 0.95,
  pullbackTardio: 0.85,

  sobrelecturaLeve: 0.85,
  sobrelecturaExtrema: 0.60,
});

function buildResult(strategy, reason) {
  return {
    strategy,
    confidence: STRATEGY_CONFIDENCE[strategy],
    reason,
  };
}

function classify({
  last15,
  last6,

  pullbackSano,
  marketPhase,

  strongMomentum,
  weakMomentum,
  isProRacha,
  marketTrendContinuation,

  deepCrashLast10,
  under15Ultimos10,
  under20Ultimos10,

  rateLast6,
  rate30_15,
  rate60_15,

  goodStreak15,
  goodStreak20,

  extensionScore,
}) {
  void marketPhase;
  void strongMomentum;
  void weakMomentum;
  void isProRacha;
  void deepCrashLast10;
  void under15Ultimos10;
  void under20Ultimos10;
  void rateLast6;
  void goodStreak15;
  void goodStreak20;

  const good15 =
    last15.filter((value) => value >= 1.5).length;

  const good6 =
    last6.filter((value) => value >= 1.5).length;

  const good20_6 =
    last6.filter((value) => value >= 2.0).length;

  if (
    pullbackSano &&
    good15 >= 11 &&
    good6 >= 5
  ) {
    if (!marketTrendContinuation) {
      return buildResult(
        'pullbackReal',
        'Pullback real'
      );
    }

    return buildResult(
      'pullbackTardio',
      'Pullback tardío'
    );
  }

  if (
    pullbackSano &&
    good15 >= 12 &&
    good6 === 5
  ) {
    return buildResult(
      'pullbackFalso',
      'Pullback Falso'
    );
  }

  if (
    good15 >= 11 &&
    good15 <= 12 &&
    good6 === 6
  ) {
    return buildResult(
      'mercadoBalanceado',
      'Mercado Balanceado'
    );
  }

  if (
    good15 >= 13 &&
    good6 >= 5
  ) {
    if (extensionScore <= 1) {
      return buildResult(
        'sobrelecturaLeve',
        'Sobrelectura Leve'
      );
    }

    return buildResult(
      'sobrelecturaExtrema',
      'Sobrelectura Extrema'
    );
  }

  if (good15 >= 14) {
    return buildResult(
      'presionVerdeAlta',
      'Presión Verde Alta'
    );
  }

  if (
    good15 >= 10 &&
    good6 >= 4
  ) {
    if (pullbackSano) {
      return buildResult(
        'continuacionPullback',
        'Continuación con pullback'
      );
    }

    if (
      rate30_15 >= 0.60 &&
      rate60_15 >= 0.60
    ) {
      return buildResult(
        'continuacionBalanceada',
        'Continuación balanceada'
      );
    }

    return buildResult(
      'continuacionPura',
      'Continuación pura'
    );
  }

  if (
    good15 >= 9 &&
    good15 <= 10 &&
    good6 >= 5
  ) {
    return buildResult(
      'recuperacionModerada',
      'Recuperación Moderada'
    );
  }

  if (
    good15 === 10 &&
    good6 === 4
  ) {
    return buildResult(
      'reboteDebil',
      'Rebote Débil'
    );
  }

  if (
    good15 === 11 &&
    good6 === 6
  ) {
    return buildResult(
      'recenciaPerfecta',
      'Recencia Perfecta'
    );
  }

  if (
    good20_6 >= 4 &&
    extensionScore <= 1
  ) {
    return buildResult(
      'hotMarket',
      'Hot Market'
    );
  }

  return buildResult(
    'desconocida',
    'Contexto no identificado'
  );
}

module.exports = {
  classify,
  STRATEGY_CONFIDENCE,
};