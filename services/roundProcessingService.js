const flightStore = require('../state/flightStore');
const RoundAnalysisEngine = require('../engines/roundAnalysisEngine');
const OperationManager = require('./operationManager');
const OperationService = require('./operationService');
const OperationOpenService = require('./operationOpenService');
const AuditContext = require('../audit/auditContext');
const {
  emitAnalysisUpdated,
} = require('../sockets/socketServer');

async function processRegisteredFlight({
  multiplier,
}) {
  let closedOperation = null;

  if (OperationManager.operationPending) {
    closedOperation =
      await OperationService.closePendingOperation({
        closeValue: multiplier,
      });
  }

  const allResults = flightStore.getFlights();

  const analysis =
    RoundAnalysisEngine.analyze(allResults);

    if (analysis.ready) {
        emitAnalysisUpdated(analysis);
    }

  if (!analysis.ready) {
    return {
      closedOperation,
      analysis,
      openedOperation: null,
    };
  }

  const signalContext = new AuditContext();

  signalContext.put(
    'signal',
    analysis.finalSignal
  );

  signalContext.put(
    'timestamp',
    new Date().toISOString()
  );

  signalContext.put(
    'recommendedStake',
    analysis.recommendedStake
  );

  signalContext.put(
    'finalSignalReason',
    analysis.finalSignalReason
  );

  signalContext.put(
    'signalFromSimple',
    analysis.finalSignalFromSimple
  );

  signalContext.put(
    'marketPhase',
    analysis.market.marketPhase
  );

  signalContext.put(
    'strategy',
    analysis.strategy.strategy
  );

  signalContext.put(
    'strategyReason',
    analysis.strategy.reason
  );

  signalContext.put(
    'strategyConfidence',
    analysis.strategy.confidence
  );

  signalContext.put(
    'riseProb',
    analysis.market.riseProb
  );

  signalContext.put(
    'marketTrendContinuation',
    analysis.market.isTrendContinuation
  );

  signalContext.put(
    'pullbackSano',
    analysis.roundContext.pullbackSano
  );

  signalContext.put(
    'strongMomentum',
    analysis.market.strongMomentum
  );

  signalContext.put(
    'weakMomentum',
    analysis.market.weakMomentum
  );

  signalContext.put(
    'degradingMomentum',
    analysis.roundContext.degradingMomentum
  );

  signalContext.put(
    'dirtyMarket',
    analysis.market.dirtyMarket
  );

  signalContext.put(
    'rate15',
    analysis.market.rate15
  );

  signalContext.put(
    'rate20',
    analysis.market.rate20
  );

  signalContext.put(
    'rate30_15',
    analysis.market.rate30_15
  );

  signalContext.put(
    'rate30_20',
    analysis.market.rate30_20
  );

  signalContext.put(
    'rate60_15',
    analysis.market.rate60_15
  );

  signalContext.put(
    'rate60_20',
    analysis.market.rate60_20
  );

  signalContext.put(
    'rateLast6',
    analysis.market.rateLast6
  );

  signalContext.put(
    'badStreak20',
    analysis.market.badStreak20
  );

  signalContext.put(
    'badStreak15',
    analysis.roundContext.badStreak15Now
  );

  signalContext.put(
    'goodStreak20',
    analysis.market.goodStreak20
  );

  signalContext.put(
    'goodStreak15',
    analysis.market.goodStreak15
  );

  signalContext.put(
    'lowStreak',
    analysis.roundContext.lowStreak
  );

  signalContext.put(
    'under15Ultimos10',
    analysis.market.under15Ultimos10
  );

  signalContext.put(
    'under20Ultimos10',
    analysis.market.under20Ultimos10
  );

  signalContext.put(
    'contradictionShortVsMid',
    analysis.market.contradictionShortVsMid
  );

  signalContext.put(
    'contradictionShortVsLong',
    analysis.market.contradictionShortVsLong
  );

  signalContext.put(
    'avg10',
    analysis.auditMetrics.avg10
  );

  signalContext.put(
    'avg60',
    analysis.auditMetrics.avg60
  );

  signalContext.put(
    'extensionScore',
    analysis.auditMetrics.extensionScore
  );

  signalContext.put(
    'lastMultipliers',
    analysis.market.last60
  );

  signalContext.put(
    'lowCrashRecoveryGuard',
    analysis.auditMetrics.guardianState
      .lowCrashRecoveryGuard
  );

  signalContext.put(
    'postSpikeSoftGuard',
    analysis.auditMetrics.guardianState
      .postSpikeSoftGuard
  );

  signalContext.put(
    'isFakeDip',
    analysis.market.isFakeDip
  );

  signalContext.put(
    'isLateEntry',
    analysis.market.isLateEntry
  );

  signalContext.put(
    'confirm15Slow',
    analysis.market.confirm15Slow
  );

  signalContext.put(
    'confirm20Slow',
    analysis.market.confirm20Slow
  );

  signalContext.put(
    'block2x',
    analysis.market.block2x
  );

  signalContext.put(
    'isProRacha',
    analysis.market.isProRacha
  );

  signalContext.put(
    'hasRecentMicroCrash',
    analysis.market.hasRecentMicroCrash
  );

  signalContext.put(
    'deepCrashLast10',
    analysis.auditMetrics.deepCrashLast10
  );

  signalContext.put(
    'explosionLast5',
    analysis.auditMetrics.explosionLast5
  );

  let openedOperation = null;

  if (
    analysis.finalSignal === 'ENTRAR 1.5' ||
    analysis.finalSignal === 'ENTRAR 2.0'
  ) {
    openedOperation =
      await OperationOpenService.openOperation({
        allResults,
        finalSignal:
          analysis.finalSignal,
        recommendedStake:
          analysis.recommendedStake,
        finalSignalFromSimple:
          analysis.finalSignalFromSimple,
        strategy:
          analysis.strategy,
        signalContext,
      });
  }

  return {
    closedOperation,
    analysis,
    openedOperation,
  };
}

module.exports = {
  processRegisteredFlight,
};