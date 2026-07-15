class GuardianState {
  constructor() {
    this.lowCrashRecoveryGuard = false;
    this.postSpikeSoftGuard = false;
  }

  updateWithRound(lastReal) {
    const events = [];

    if (
      this.lowCrashRecoveryGuard &&
      lastReal >= 1.5
    ) {
      this.lowCrashRecoveryGuard = false;

      events.push(
        `✅ LOW CRASH GUARD liberado con ${lastReal.toFixed(2)}x`
      );
    }

    if (
      this.postSpikeSoftGuard &&
      lastReal >= 1.5 &&
      lastReal < 5.0
    ) {
      this.postSpikeSoftGuard = false;

      events.push(
        `✅ POST SPIKE GUARD liberado con ${lastReal.toFixed(2)}x`
      );
    }

    if (lastReal <= 1.20) {
      this.lowCrashRecoveryGuard = true;

      events.push(
        `🛡️ LOW CRASH GUARD activo por ${lastReal.toFixed(2)}x`
      );
    }

    return {
      lowCrashRecoveryGuard:
        this.lowCrashRecoveryGuard,
      postSpikeSoftGuard:
        this.postSpikeSoftGuard,
      events,
    };
  }

  activatePostSpike() {
    this.postSpikeSoftGuard = true;

    return {
      lowCrashRecoveryGuard:
        this.lowCrashRecoveryGuard,
      postSpikeSoftGuard:
        this.postSpikeSoftGuard,
    };
  }

  getState() {
    return {
      lowCrashRecoveryGuard:
        this.lowCrashRecoveryGuard,
      postSpikeSoftGuard:
        this.postSpikeSoftGuard,
    };
  }

  reset() {
    this.lowCrashRecoveryGuard = false;
    this.postSpikeSoftGuard = false;
  }
}

module.exports = new GuardianState();