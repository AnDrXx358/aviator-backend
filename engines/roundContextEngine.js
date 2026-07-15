function calculateTrailingStreak(values, predicate) {
  let streak = 0;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index])) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function analyze({
  allResults,
  market,
  avg10,
  excelSignal,
}) {
  const last6 = market.last6;
  const last60 = market.last60;

  const {
    rate15,
    rate20,
    rate30_15,
    rate60_15,
    rateLast6,
    riseProb,
    contradictionShortVsMid,
    contradictionShortVsLong,
    under15Ultimos10,
    hasRecentMicroCrash,
    isFakeDip,
  } = market;

  const lastReal =
    last60.length > 0
      ? last60[last60.length - 1]
      : 0;

  const lowStreak = calculateTrailingStreak(
    last60,
    (value) => value < 2.0
  );

  const badStreak15Now = calculateTrailingStreak(
    last60,
    (value) => value < 1.5
  );

  const avg60 =
    last60.length > 0
      ? last60.reduce((sum, value) => sum + value, 0) /
        last60.length
      : 0;

  const degradingMomentum =
    rateLast6 < 0.60 &&
    riseProb < 58 &&
    avg10 > 4.5 &&
    !market.isProRacha;

  const pullbackSano =
    allResults.length >= 5
      ? require('./marketEngine').calculateHealthyPullback(
          allResults
        )
      : false;

  const waitAfterLoss =
    lastReal < 1.08 &&
    !pullbackSano;

  const tiredAfter15Wins =
    String(excelSignal).includes('1.5') &&
    market.goodStreak15 >= 3 &&
    last6.filter((value) => value < 1.5).length >= 2;

  const contextAllowsContinuation =
    riseProb >= 50 &&
    rate30_15 >= 0.58 &&
    rate60_15 >= 0.55 &&
    !contradictionShortVsMid &&
    !contradictionShortVsLong;

  const stillClearOpportunity =
    contextAllowsContinuation &&
    rateLast6 >= 0.66 &&
    rate15 >= 0.60 &&
    under15Ultimos10 <= 4 &&
    lowStreak <= 2 &&
    !hasRecentMicroCrash &&
    !isFakeDip &&
    !contradictionShortVsMid &&
    !contradictionShortVsLong;

  const avoidChasingAfterWin =
    lastReal >= 1.5 &&
    market.goodStreak15 >= 4 &&
    !stillClearOpportunity &&
    badStreak15Now >= 3 &&
    riseProb < 52;

  return {
    lastReal,
    lowStreak,
    badStreak15Now,
    avg60,
    degradingMomentum,
    pullbackSano,
    waitAfterLoss,
    tiredAfter15Wins,
    contextAllowsContinuation,
    stillClearOpportunity,
    avoidChasingAfterWin,
  };
}

module.exports = {
  analyze,
};