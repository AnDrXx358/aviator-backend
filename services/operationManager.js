class OperationManager {
  constructor() {
    this.operationPending = false;

    this.pendingTarget = 0;
    this.pendingStake = 0;
    this.pendingEntryAfter = 0;

    this.pendingSignal = '';
    this.pendingContextTag = 'NORMAL';
    this.pendingStrategy = 'NORMAL';

    this.pendingAuditId = null;

    this.pendingFromSimpleFilter = false;
    this.pendingLastMultipliers = [];

    this.simpleLossStreak = 0;

    this.balanceRounds = [];
  }

  openOperation({
    signal,
    target,
    stake,
    entryAfter,
    fromSimpleFilter,
    contextTag,
    strategy = 'NORMAL',
    auditId = null,
    lastMultipliers = [],
  }) {
    this.operationPending = true;

    this.pendingSignal = signal;
    this.pendingTarget = target;
    this.pendingStake = stake;
    this.pendingEntryAfter = entryAfter;

    this.pendingContextTag = contextTag;
    this.pendingStrategy = strategy;

    this.pendingAuditId = auditId;

    this.pendingFromSimpleFilter =
      Boolean(fromSimpleFilter);

    this.pendingLastMultipliers =
      Array.isArray(lastMultipliers)
        ? [...lastMultipliers]
        : [];
  }

  closeOperation({
    closeValue,
  }) {
    if (!this.operationPending) {
      return null;
    }

    const isWin =
      closeValue >= this.pendingTarget;

    if (isWin) {
      this.simpleLossStreak = 0;
    } else {
      this.simpleLossStreak += 1;
    }

    const closedOperation = {
      win: isWin,
      result: isWin ? 'WIN' : 'LOSS',

      entryAfter: this.pendingEntryAfter,
      closeValue,
      target: this.pendingTarget,

      signal: this.pendingSignal,
      stake: this.pendingStake,

      contextTag: this.pendingContextTag,
      strategy: this.pendingStrategy,

      auditId: this.pendingAuditId,

      fromSimpleFilter:
        this.pendingFromSimpleFilter,

      lastMultipliers: [
        ...this.pendingLastMultipliers,
      ],
    };

    this.balanceRounds.push(closedOperation);

    this.operationPending = false;

    this.pendingTarget = 0;
    this.pendingStake = 0;
    this.pendingEntryAfter = 0;

    this.pendingSignal = '';
    this.pendingContextTag = 'NORMAL';
    this.pendingStrategy = 'NORMAL';

    this.pendingAuditId = null;

    this.pendingFromSimpleFilter = false;
    this.pendingLastMultipliers = [];

    return closedOperation;
  }

  shouldSendBalanceSummary() {
    return this.balanceRounds.length >= 20;
  }

  consumeBalanceRounds() {
    const copy = [...this.balanceRounds];

    this.balanceRounds.length = 0;

    return copy;
  }

  getPendingOperation() {
    if (!this.operationPending) {
      return null;
    }

    return {
      signal: this.pendingSignal,
      target: this.pendingTarget,
      stake: this.pendingStake,
      entryAfter: this.pendingEntryAfter,

      contextTag: this.pendingContextTag,
      strategy: this.pendingStrategy,

      auditId: this.pendingAuditId,

      fromSimpleFilter:
        this.pendingFromSimpleFilter,

      lastMultipliers: [
        ...this.pendingLastMultipliers,
      ],
    };
  }
}

module.exports = new OperationManager();