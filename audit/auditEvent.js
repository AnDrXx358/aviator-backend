class AuditEvent {
  constructor({
    triggerId,
    title,
    reason,
    timestamp = new Date(),
  }) {
    this.triggerId = triggerId;
    this.title = title;
    this.reason = reason;
    this.timestamp = timestamp;
  }

  toMap() {
    return {
      triggerId: this.triggerId,
      title: this.title,
      reason: this.reason,
      timestamp: this.timestamp,
    };
  }
}

module.exports = AuditEvent;