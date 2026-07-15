class AuditContext {
  constructor() {
    this.data = {};
  }

  put(key, value) {
    this.data[key] = value;
  }

  toMap() {
    return { ...this.data };
  }
}

module.exports = AuditContext;