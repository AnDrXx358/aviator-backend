const AuditPayloadBuilder = require('./auditPayloadBuilder');
const AuditStorage = require('./auditStorage');

async function log(context) {
  const payload =
    AuditPayloadBuilder.build(context);

  return AuditStorage.saveAudit(payload);
}

module.exports = {
  log,
};