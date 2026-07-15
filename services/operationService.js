const operationManager = require('./operationManager');
const roundRepository = require('../firebase/roundRepository');
const signalAuditLogger = require('../audit/signalAuditLogger');
const telegramSignalService = require('../telegram/telegramSignalService');

async function closePendingOperation({
  closeValue,
}) {
  const pending =
    operationManager.getPendingOperation();

  if (!pending) {
    return {
      closed: false,
      reason: 'No hay operación pendiente.',
    };
  }

  const closedOperation =
    operationManager.closeOperation({
      closeValue,
    });

  if (closedOperation.win) {
    await telegramSignalService.sendWin({
      closeValue,
    });
  } else {
    await telegramSignalService.sendLoss({
      closeValue,
    });
  }

  if (closedOperation.auditId) {
    await signalAuditLogger.closeSignal({
      auditId: closedOperation.auditId,
      win: closedOperation.win,
      closeValue,
    });
  }

  const savedRound =
    await roundRepository.saveRound({
      timestamp: Date.now(),
      ...closedOperation,
    });

  let balanceSent = false;

  if (operationManager.shouldSendBalanceSummary()) {
    const rounds =
      operationManager.consumeBalanceRounds();

    await telegramSignalService.sendBalanceSummary({
      rounds,
    });

    balanceSent = true;
  }

  return {
    closed: true,
    operation: closedOperation,
    savedRoundId: savedRound.id,
    balanceSent,
  };
}

module.exports = {
  closePendingOperation,
};