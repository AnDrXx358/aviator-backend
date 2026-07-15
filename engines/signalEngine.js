function analyze({
  dirtyMarket,
  contradictionShortVsMid,
  contradictionShortVsLong,
  alignedCold,

  avoidAfterExplosion,
  isExhausted,
  tiredAfter15Wins,

  waitAfterLoss,
  isProRacha,
  strongMomentum,

  degradingMomentum,

  pullbackSano,
  excelSignal,

  confirm15Slow,
  rate30_15,
  rate60_15,
  rateLast6,
  under15Ultimos10,
  lowStreak,

  weakMomentum,

  isMomentum,
  confirm20Slow,
  hasRecentMicroCrash,
  block2x,
  riseProb,

  isTrendContinuation,
  avoidChasingAfterWin,

  lastWasWin15,

  isLateEntry,

  alignedHot,

  marketPhase,
}) {
  let finalSignal = 'ESPERAR';
  let finalSignalReason = 'Sin ventaja clara';

  const needsReconfirmation =
    lastWasWin15 &&
    (
      isTrendContinuation ||
      alignedHot ||
      marketPhase === 'REBOTE'
    ) &&
    !pullbackSano &&
    rateLast6 < 0.72;

  let hardBlock = false;
  let softBlock = false;
  let softBlockReason = '';

  if (dirtyMarket) {
    finalSignal = 'NO ENTRAR';
    finalSignalReason = 'Mercado sucio';
    hardBlock = true;
  } else if (
    contradictionShortVsMid ||
    contradictionShortVsLong
  ) {
    finalSignal = 'NO ENTRAR';
    finalSignalReason = 'Mercado en transición';
    hardBlock = true;
  } else if (alignedCold) {
    finalSignal = 'NO ENTRAR';
    finalSignalReason = 'Confirmación bajista';
    hardBlock = true;
  }

  if (!hardBlock && avoidAfterExplosion) {
    softBlock = true;
    softBlockReason = 'Post-explosión';
  }

  if (!hardBlock && isExhausted) {
    softBlock = true;
    softBlockReason = 'Mercado agotado';
  }

  if (!hardBlock && tiredAfter15Wins) {
    softBlock = true;
    softBlockReason = '1.5 cansado';
  }

  if (!hardBlock) {
    if (needsReconfirmation) {
      finalSignal = 'ESPERAR';
      finalSignalReason = 'Reconfirmando momentum';
    } else if (softBlock) {
      finalSignal = 'ESPERAR';
      finalSignalReason = softBlockReason;
    } else if (
      waitAfterLoss &&
      !isProRacha &&
      !strongMomentum
    ) {
      finalSignal = 'ESPERAR';
      finalSignalReason = 'Pérdida reciente';
    } else if (
      pullbackSano &&
      excelSignal.includes('ENTRAR') &&
      confirm15Slow &&
      rate30_15 >= 0.55 &&
      rate60_15 >= 0.52 &&
      rateLast6 >= 0.50 &&
      under15Ultimos10 <= 4 &&
      lowStreak <= 3 &&
      !weakMomentum &&
      !dirtyMarket &&
      !contradictionShortVsMid &&
      !contradictionShortVsLong
    ) {
      finalSignal = 'ENTRAR 1.5';
      finalSignalReason = 'Pullback sano confirmado';
    } else if (
      isMomentum &&
      confirm20Slow &&
      !hasRecentMicroCrash &&
      !block2x &&
      rateLast6 >= 0.66 &&
      riseProb >= 58
    ) {
      finalSignal = 'ENTRAR 2.0';
      finalSignalReason = 'Momentum limpio';
    } else if (
      isTrendContinuation &&
      confirm15Slow &&
      !avoidChasingAfterWin &&
      !isLateEntry &&
      !hasRecentMicroCrash &&
      !degradingMomentum &&
      under15Ultimos10 <= 3
    ) {
      finalSignal = 'ENTRAR 1.5';
      finalSignalReason = 'Continuación';
    } else if (
      alignedHot &&
      confirm15Slow &&
      !degradingMomentum &&
      !avoidChasingAfterWin &&
      !hasRecentMicroCrash &&
      under15Ultimos10 <= 3
    ) {
      finalSignal = 'ENTRAR 1.5';
      finalSignalReason = 'Hot market';
    } else if (
      marketPhase === 'REBOTE' &&
      !avoidChasingAfterWin &&
      confirm15Slow
    ) {
      finalSignal = 'ENTRAR 1.5';
      finalSignalReason = 'Rebote confirmado';
    } else {
      finalSignal = 'ESPERAR';
      finalSignalReason = 'Sin ventaja clara';
    }
  }

  return {
    signal: finalSignal,
    reason: finalSignalReason,
  };
}

function chooseTarget({
  score15,
  score20,
  conf15,
  conf20,
}) {
  const twoIsBetter =
    score20 >= score15 + 10 ||
    conf20 >= conf15 + 0.08;

  return twoIsBetter ? 2.0 : 1.5;
}

function stakePctForTarget(
  target,
  confPct,
  {
    greenBoost = false,
    greenBonus = 0,
  } = {}
) {
  let base;

  if (confPct < 50) {
    base = 0.0;
  } else if (confPct < 60) {
    base = 1.0;
  } else if (confPct < 70) {
    base = 1.5;
  } else {
    base = 2.0;
  }

  if (greenBoost && target === 2.0) {
    base += greenBonus * 0.25;
  }

  return Math.max(0, Math.min(3, base));
}

function calcConfidence(buenas, malas) {
  const total = buenas + malas;

  if (total === 0) {
    return 50;
  }

  return ((buenas + 1) / (total + 2)) * 100;
}

module.exports = {
  analyze,
  chooseTarget,
  stakePctForTarget,
  calcConfidence,
};