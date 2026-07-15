const operationManager = require('./operationManager');
const contextTagEngine = require('../engines/contextTagEngine');
const signalAuditLogger = require('../audit/signalAuditLogger');
const telegramSignalService = require('../telegram/telegramSignalService');

let lastTelegramMultiplier = null;
let lastTelegramTime = null;

async function openOperation({
  allResults,
  finalSignal,
  recommendedStake,
  finalSignalFromSimple,
  strategy,
  signalContext,
}) {
  const wantsEntry =
    finalSignal === 'ENTRAR 1.5' ||
    finalSignal === 'ENTRAR 2.0';

  if (!wantsEntry) {
    return {
      opened: false,
      reason: 'La señal no es de entrada.',
    };
  }

  if (
    !Array.isArray(allResults) ||
    allResults.length === 0
  ) {
    return {
      opened: false,
      reason: 'No hay multiplicadores disponibles.',
    };
  }

  if (operationManager.operationPending) {
    return {
      opened: false,
      reason: 'Ya existe una operación pendiente.',
    };
  }

  const now = Date.now();
  const lastValue = allResults[allResults.length - 1];

  if (lastTelegramMultiplier === lastValue) {
    return {
      opened: false,
      reason: 'Señal duplicada para el mismo multiplicador.',
    };
  }

  if (
    lastTelegramTime !== null &&
    now - lastTelegramTime < 12000
  ) {
    return {
      opened: false,
      reason: 'Cooldown de Telegram activo.',
    };
  }

  const contextResult =
    contextTagEngine.analyze(allResults);

  const auditId =
    await signalAuditLogger.createSignal(
      signalContext
    );

  operationManager.openOperation({
    signal: finalSignal,
    target:
      finalSignal.includes('2.0')
        ? 2.0
        : 1.5,
    stake: recommendedStake,
    entryAfter: lastValue,
    fromSimpleFilter: finalSignalFromSimple,
    contextTag: contextResult.contextTag,
    strategy:
      strategy?.strategy ??
      strategy ??
      'NORMAL',
    auditId,
    lastMultipliers: allResults.slice(-5),
  });

  await telegramSignalService.sendEntry({
    entryAfter: lastValue,
    signal: finalSignal,
    recommendedStake,
    contextTag: contextResult.contextTag,
    strategy:
      strategy?.strategy ??
      strategy ??
      'NORMAL',
  });

  lastTelegramMultiplier = lastValue;
  lastTelegramTime = now;

  return {
    opened: true,
    auditId,
    contextTag: contextResult.contextTag,
    pendingOperation:
      operationManager.getPendingOperation(),
  };
}

function resetCooldown() {
  lastTelegramMultiplier = null;
  lastTelegramTime = null;
}

module.exports = {
  openOperation,
  resetCooldown,
};