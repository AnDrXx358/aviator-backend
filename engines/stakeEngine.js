function calculate({
  finalSignal,
  finalSignalFromSimple,
  marketPhase,
  badStreakNow,
  riseProb,
  goodStreakNow,
  isFakeDip,
  rate30_20,
  marketTrendContinuation,
}) {
  let recommendedStake = 0.5;

  if (finalSignal === 'ENTRAR 2.0') {
    recommendedStake = 1.3;
  } else if (finalSignal === 'ENTRAR 1.5') {
    recommendedStake =
      finalSignalFromSimple
        ? 0.8
        : 1.0;
  } else {
    recommendedStake = 0.3;
  }

  if (marketPhase === 'RACHA_PROLONGADA') {
    recommendedStake += 0.3;
  } else if (marketPhase === 'MOMENTUM') {
    recommendedStake += 0.2;
  }

  if (badStreakNow >= 3) {
    recommendedStake -= 0.3;
  }

  if (badStreakNow >= 5) {
    recommendedStake -= 0.5;
  }

  if (riseProb >= 70) {
    recommendedStake += 0.2;
  } else if (riseProb < 55) {
    recommendedStake -= 0.2;
  }

  recommendedStake = Math.min(
    2.0,
    Math.max(0.2, recommendedStake)
  );

  const wantsEntry =
    finalSignal === 'ENTRAR 1.5' ||
    finalSignal === 'ENTRAR 2.0';

  if (wantsEntry) {
    const maximumConfidence =
      (
        goodStreakNow >= 3 &&
        !isFakeDip &&
        riseProb >= 58 &&
        rate30_20 >= 0.55
      ) ||
      marketTrendContinuation;

    if (maximumConfidence) {
      recommendedStake = 2.0;
    }
  }

  return recommendedStake;
}

module.exports = {
  calculate,
};