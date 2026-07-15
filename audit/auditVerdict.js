class AuditVerdict {
  constructor({
    marketVerdict,
    risk,
    actionBias,
    confidence,
    reason,
  }) {
    this.marketVerdict = marketVerdict;
    this.risk = risk;
    this.actionBias = actionBias;
    this.confidence = confidence;
    this.reason = reason;
  }

  static fromJson(json = {}) {
    const parsedConfidence = Number.parseInt(
      String(json.confidence ?? 0),
      10
    );

    return new AuditVerdict({
      marketVerdict:
        String(json.marketVerdict ?? 'SIN_DIAGNOSTICO'),
      risk:
        String(json.risk ?? 'MEDIO'),
      actionBias:
        String(json.actionBias ?? 'NEUTRAL'),
      confidence:
        Number.isNaN(parsedConfidence)
          ? 0
          : parsedConfidence,
      reason:
        String(json.reason ?? 'Sin razón'),
    });
  }

  static neutral() {
    return new AuditVerdict({
      marketVerdict: 'SIN_DIAGNOSTICO',
      risk: 'MEDIO',
      actionBias: 'NEUTRAL',
      confidence: 0,
      reason: 'Auditor no disponible',
    });
  }

  toJson() {
    return {
      marketVerdict: this.marketVerdict,
      risk: this.risk,
      actionBias: this.actionBias,
      confidence: this.confidence,
      reason: this.reason,
    };
  }

  toString() {
    return (
      `AuditVerdict(${this.marketVerdict}, ` +
      `risk=${this.risk}, ` +
      `bias=${this.actionBias}, ` +
      `conf=${this.confidence})`
    );
  }
}

module.exports = AuditVerdict;