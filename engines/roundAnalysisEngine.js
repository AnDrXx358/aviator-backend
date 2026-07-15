const MarketEngine = require('./marketEngine');
const BaseSignalEngine = require('./baseSignalEngine');
const RoundContextEngine = require('./roundContextEngine');
const SignalEngine = require('./signalEngine');
const TelegramEngine = require('./telegramEngine');
const TrapContextEngine = require('./trapContextEngine');
const StakeEngine = require('./stakeEngine');
const RiskManager = require('./riskManager');
const MarketPhaseEngine = require('./marketPhaseEngine');
const AiEngine = require('./aiEngine');

const GuardianState = require('../guardian/guardianState');
const SimpleSignalGuardian = require('../guardian/simpleSignalGuardian');
const SafetyGate = require('../guardian/safetyGate');
const PostSpikeGuard = require('../guardian/postSpikeGuard');

const StrategyClassifier = require('../strategy/strategyClassifier');
const OperationManager = require('../services/operationManager');

function analyze(allResults) {
  if (!Array.isArray(allResults)) {
    throw new TypeError('allResults debe ser un arreglo.');
  }

  if (allResults.length < 30) {
    return {
      ready: false,
      reason: 'Muestra insuficiente.',
    };
  }

  const stats = MarketEngine.calculateStats(allResults);
  const avg10 = Number(stats.avg10 ?? 0);

  const market = MarketEngine.analyze([...allResults]);

  if (!market.last60 || market.last60.length === 0) {
    return {
      ready: false,
      reason: 'No hay ventana de mercado disponible.',
    };
  }

  const avg60 =
    market.last60.reduce(
      (sum, value) => sum + value,
      0
    ) / market.last60.length;

  const baseSignal = BaseSignalEngine.analyze({
    avg60,
    highCount: market.highCount,
    riseProb: market.riseProb,
    badStreakNow: market.badStreak20,
    rate15: market.rate15,
    rate20: market.rate20,
  });

  const roundContext = RoundContextEngine.analyze({
    allResults,
    market,
    avg10,
    excelSignal: baseSignal.signal,
  });

  const guardState = GuardianState.updateWithRound(
    roundContext.lastReal
  );

  for (const event of guardState.events) {
    console.log(event);
  }

  const postSpike = PostSpikeGuard.analyze({
    allResults,
    lastReal: roundContext.lastReal,
  });

  if (postSpike.postSpikeRisk) {
    GuardianState.activatePostSpike();

    console.log(
      `🛫 POST SPIKE GUARD activo | last: ${roundContext.lastReal.toFixed(2)}x`
    );
  }

  const signalResult = SignalEngine.analyze({
    dirtyMarket: market.dirtyMarket,
    contradictionShortVsMid:
      market.contradictionShortVsMid,
    contradictionShortVsLong:
      market.contradictionShortVsLong,
    alignedCold: market.alignedCold,
    avoidAfterExplosion:
      market.avoidAfterExplosion,
    isExhausted: market.isExhausted,
    tiredAfter15Wins:
      roundContext.tiredAfter15Wins,
    waitAfterLoss:
      roundContext.waitAfterLoss,
    isProRacha: market.isProRacha,
    strongMomentum:
      market.strongMomentum,
    degradingMomentum:
      roundContext.degradingMomentum,
    pullbackSano:
      roundContext.pullbackSano,
    excelSignal:
      baseSignal.signal,
    confirm15Slow:
      market.confirm15Slow,
    rate30_15:
      market.rate30_15,
    rate60_15:
      market.rate60_15,
    rateLast6:
      market.rateLast6,
    under15Ultimos10:
      market.under15Ultimos10,
    lowStreak:
      roundContext.lowStreak,
    weakMomentum:
      market.weakMomentum,
    isMomentum:
      market.isMomentum,
    confirm20Slow:
      market.confirm20Slow,
    hasRecentMicroCrash:
      market.hasRecentMicroCrash,
    block2x:
      market.block2x,
    riseProb:
      market.riseProb,
    isTrendContinuation:
      market.isTrendContinuation,
    avoidChasingAfterWin:
      roundContext.avoidChasingAfterWin,
    lastWasWin15:
      roundContext.lastReal >= 1.5,
    isLateEntry:
      market.isLateEntry,
    alignedHot:
      market.alignedHot,
    marketPhase:
      market.marketPhase,
  });

  let finalSignal = signalResult.signal;
  let finalSignalReason = signalResult.reason;
  let finalSignalFromSimple = false;

  const simpleResult = TelegramEngine.analyze({
    last6: market.last6,
    last15: market.last15,
    last30: market.last30,

    rateLast6: market.rateLast6,
    rate15: market.rate15,
    rate20: market.rate20,
    rate30_15: market.rate30_15,
    rate30_20: market.rate30_20,

    dirtyMarket: market.dirtyMarket,
    alignedCold: market.alignedCold,
    contradictionShortVsMid:
      market.contradictionShortVsMid,
    contradictionShortVsLong:
      market.contradictionShortVsLong,
    weakMomentum: market.weakMomentum,
    degradingMomentum:
      roundContext.degradingMomentum,
    block2x: market.block2x,

    under15Ultimos10:
      market.under15Ultimos10,
    under20Ultimos10:
      market.under20Ultimos10,
  });

  const guardedSimple =
    SimpleSignalGuardian.analyze({
      allResults,
      simpleSignal: simpleResult.signal,
      simpleReason: simpleResult.reason,
      simpleLossStreak:
        OperationManager.simpleLossStreak,
      rateLast6: market.rateLast6,
      riseProb: market.riseProb,
      hasRecentMicroCrash:
        market.hasRecentMicroCrash,
    });

  if (
    finalSignal === 'ESPERAR' &&
    guardedSimple.signal === 'ENTRAR 1.5'
  ) {
    finalSignal = 'ENTRAR 1.5';
    finalSignalReason = guardedSimple.reason;
    finalSignalFromSimple = true;
  }

  if (finalSignalFromSimple) {
    const trapDecision =
      TrapContextEngine.analyze({
        allResults,
        candidateSignal: finalSignal,
        simpleLossStreak:
          OperationManager.simpleLossStreak,
      });

    if (trapDecision.shouldStop) {
      finalSignal = 'ESPERAR';
      finalSignalReason = trapDecision.reason;
      finalSignalFromSimple = false;
    }
  }

  const safetyResult = SafetyGate.analyze({
    allResults,
    finalSignal,
    finalSignalReason,
    finalSignalFromSimple,
    simpleLossStreak:
      OperationManager.simpleLossStreak,
    rateLast6: market.rateLast6,
    riseProb: market.riseProb,
    hasRecentMicroCrash:
      market.hasRecentMicroCrash,
    contradictionShortVsMid:
      market.contradictionShortVsMid,
    contradictionShortVsLong:
      market.contradictionShortVsLong,
  });

  finalSignal = safetyResult.signal;
  finalSignalReason = safetyResult.reason;
  finalSignalFromSimple =
    safetyResult.fromSimple;

  const recommendedStake =
    StakeEngine.calculate({
      finalSignal,
      finalSignalFromSimple,
      marketPhase: market.marketPhase,
      badStreakNow: market.badStreak20,
      riseProb: market.riseProb,
      goodStreakNow: market.goodStreak20,
      isFakeDip: market.isFakeDip,
      rate30_20: market.rate30_20,
      marketTrendContinuation:
        market.isTrendContinuation,
    });

  const extensionScore =
    avg10 >= 10
      ? 3
      : avg10 >= 8
        ? 2
        : avg10 >= 6
          ? 1
          : 0;

  const strategy =
    StrategyClassifier.classify({
      last15: market.last15,
      last6: market.last6,

      pullbackSano:
        roundContext.pullbackSano,
      marketPhase:
        market.marketPhase,

      strongMomentum:
        market.strongMomentum,
      weakMomentum:
        market.weakMomentum,
      isProRacha:
        market.isProRacha,
      marketTrendContinuation:
        market.isTrendContinuation,

      deepCrashLast10:
        postSpike.deepCrashLast10,
      under15Ultimos10:
        market.under15Ultimos10,
      under20Ultimos10:
        market.under20Ultimos10,

      rateLast6:
        market.rateLast6,
      rate30_15:
        market.rate30_15,
      rate60_15:
        market.rate60_15,

      goodStreak15:
        market.goodStreak15,
      goodStreak20:
        market.goodStreak20,

      extensionScore,
    });

  const riskLevel =
    RiskManager.getRiskLevel({
      finalSignal,
      alignedCold: market.alignedCold,
      contradictionShortVsMid:
        market.contradictionShortVsMid,
      contradictionShortVsLong:
        market.contradictionShortVsLong,
      isFakeDip: market.isFakeDip,
      isLateEntry: market.isLateEntry,
      isOverextended: market.isOverextended,
      marketPhase: market.marketPhase,
      confirm20Slow: market.confirm20Slow,
      confirm15Slow: market.confirm15Slow,
      riseProb: market.riseProb,
      badStreakNow: market.badStreak20,
    });

  const total60 = market.last60.length;

  const lowPct =
    total60 > 0
      ? Math.round(
          market.lowCount / total60 * 100
        )
      : 0;

  const midPct =
    total60 > 0
      ? Math.round(
          market.midCount / total60 * 100
        )
      : 0;

  const highPct =
    total60 > 0
      ? Math.round(
          market.highCount / total60 * 100
        )
      : 0;

  const aiState =
    AiEngine.buildAiState({
      allResults,
      riseProb: market.riseProb,
      rateLast6: market.rateLast6,
      rate30_15: market.rate30_15,
      rate60_15: market.rate60_15,
      rate60_20: market.rate60_20,
      goodStreakNow: market.goodStreak20,
      badStreakNow: market.badStreak20,
      strongMomentum:
        market.strongMomentum,
      isProRacha:
        market.isProRacha,
      dirtyMarket:
        market.dirtyMarket,
      contradictionShortVsMid:
        market.contradictionShortVsMid,
      contradictionShortVsLong:
        market.contradictionShortVsLong,
      isExhausted:
        market.isExhausted,
      isFakeDip:
        market.isFakeDip,
    });

  return {
    ready: true,

    finalSignal,
    finalSignalReason,
    finalSignalFromSimple,
    recommendedStake,

    strategy,

    market,
    baseSignal,
    roundContext,

    riskLevel,

    patternType:
      MarketPhaseEngine.getPatternType({
        ultraStrong: market.ultraStrong,
        strongMomentum:
          market.strongMomentum,
        badStreakNow:
          market.badStreak20,
      }),

    cycleState:
      MarketPhaseEngine.getCycleState({
        lowPct,
        highPct,
      }),

    sequenceState:
      MarketPhaseEngine.getSequenceState(
        roundContext.lowStreak
      ),

    aiState,

    distribution: {
      lowCount: market.lowCount,
      midCount: market.midCount,
      highCount: market.highCount,
      lowPct,
      midPct,
      highPct,
    },

    auditMetrics: {
      avg10,
      avg60,
      extensionScore,
      deepCrashLast10:
        postSpike.deepCrashLast10,
      explosionLast5:
        postSpike.explosionLast5,
      guardianState:
        GuardianState.getState(),
      simpleGuardian:
        guardedSimple.metrics,
      safetyGate:
        safetyResult.metrics,
    },
  };
}

module.exports = {
  analyze,
};