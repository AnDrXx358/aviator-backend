function getRiskLevel({
  finalSignal,
  alignedCold,
  contradictionShortVsMid,
  contradictionShortVsLong,
  isFakeDip,
  isLateEntry,
  isOverextended,
  marketPhase,
  confirm20Slow,
  confirm15Slow,
  riseProb,
  badStreakNow,
}) {
  if (
    finalSignal.includes('NO ENTRAR') ||
    alignedCold ||
    contradictionShortVsMid ||
    contradictionShortVsLong ||
    isFakeDip ||
    isLateEntry ||
    isOverextended
  ) {
    return 'ALTO';
  }

  if (
    marketPhase === 'RACHA_PROLONGADA' &&
    confirm20Slow &&
    riseProb >= 60 &&
    badStreakNow <= 2
  ) {
    return 'BAJO';
  }

  if (
    marketPhase === 'MOMENTUM' &&
    confirm20Slow &&
    riseProb >= 58 &&
    badStreakNow <= 2
  ) {
    return 'MEDIO';
  }

  if (
    marketPhase === 'REBOTE' &&
    confirm15Slow &&
    !isFakeDip
  ) {
    return 'MEDIO';
  }

  return 'ALTO';
}

module.exports = {
  getRiskLevel,
};