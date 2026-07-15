const AuditEvent = require('./auditEvent');

class AuditTriggerEngine {
  constructor() {
    this.previousMarketPhase = null;
    this.phaseHistory = [];
    this.badStreakHistory = [];
    this.techoCount = 0;
  }

  evaluate({
    marketPhase,
    strongMomentum,
    weakMomentum,
    degradingMomentum,
    dirtyMarket,
    pullbackSano,
    lowStreak,
    badStreak,
    under15Ultimos10,
    contradictionShortVsMid,
    contradictionShortVsLong,
    finalSignal,
  }) {
    void weakMomentum;

    this.phaseHistory.push(marketPhase);

    if (this.phaseHistory.length > 3) {
      this.phaseHistory.shift();
    }

    this.badStreakHistory.push(badStreak);

    if (this.badStreakHistory.length > 3) {
      this.badStreakHistory.shift();
    }

    if (
      degradingMomentum &&
      !strongMomentum
    ) {
      return new AuditEvent({
        triggerId: 'T3',
        title: 'Momentum debilitándose',
        reason: 'degradingMomentum=true y weakMomentum=true',
        timestamp: new Date(),
      });
    }

    if (
      this.phaseHistory.length >= 2 &&
      this.phaseHistory[this.phaseHistory.length - 1] !==
        this.phaseHistory[this.phaseHistory.length - 2]
    ) {
      return new AuditEvent({
        triggerId: 'T1',
        title: 'Cambio de tendencia',
        reason:
          `${this.phaseHistory[this.phaseHistory.length - 2]} -> ` +
          `${this.phaseHistory[this.phaseHistory.length - 1]}`,
        timestamp: new Date(),
      });
    }

    if (
      lowStreak >= 6 ||
      under15Ultimos10 >= 7
    ) {
      return new AuditEvent({
        triggerId: 'T5',
        title: 'Racha anormal',
        reason:
          `lowStreak=${lowStreak} | ` +
          `under15Ultimos10=${under15Ultimos10}`,
        timestamp: new Date(),
      });
    }

    if (
      finalSignal !== 'ESPERAR' &&
      (
        contradictionShortVsMid ||
        contradictionShortVsLong ||
        dirtyMarket
      )
    ) {
      return new AuditEvent({
        triggerId: 'T6',
        title: 'Contradicción contexto-señal',
        reason: 'Señal activa en contexto contradictorio',
        timestamp: new Date(),
      });
    }

    if (
      dirtyMarket &&
      !pullbackSano &&
      !strongMomentum
    ) {
      return new AuditEvent({
        triggerId: 'T2',
        title: 'Posible trampa',
        reason: 'dirtyMarket=true y sin recuperación clara',
        timestamp: new Date(),
      });
    }

    if (
      strongMomentum &&
      pullbackSano &&
      marketPhase !== 'MERCADO_AGOTADO'
    ) {
      return new AuditEvent({
        triggerId: 'T4',
        title: 'Momentum recuperándose',
        reason: 'strongMomentum=true y pullbackSano=true',
        timestamp: new Date(),
      });
    }

    if (
      dirtyMarket &&
      lowStreak <= 2
    ) {
      return new AuditEvent({
        triggerId: 'T7',
        title: 'Volatilidad extrema',
        reason:
          'dirtyMarket=true con pocos crashes consecutivos',
        timestamp: new Date(),
      });
    }

    if (
      this.badStreakHistory.length >= 3 &&
      this.badStreakHistory[0] >= 5 &&
      strongMomentum &&
      pullbackSano
    ) {
      return new AuditEvent({
        triggerId: 'T8',
        title: 'Recuperación post zona mala',
        reason:
          'badStreak previo >=5 y recuperación detectada',
        timestamp: new Date(),
      });
    }

    const posibleTecho =
      degradingMomentum &&
      !pullbackSano &&
      !dirtyMarket &&
      !strongMomentum;

    if (posibleTecho) {
      this.techoCount += 1;

      console.log(
        `🏔️ TECHOS => {detectados: ${this.techoCount}}`
      );
    }

    return null;
  }

  reset() {
    this.previousMarketPhase = null;
    this.phaseHistory.length = 0;
    this.badStreakHistory.length = 0;
    this.techoCount = 0;
  }
}

module.exports = new AuditTriggerEngine();