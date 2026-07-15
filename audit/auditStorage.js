const { db } = require('../firebase/firebaseClient');

async function saveAudit(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    throw new TypeError(
      'AuditStorage requiere un payload válido.'
    );
  }

  console.log('🔥 SAVE AUDIT');
  console.log(payload);

  const document = await db
    .collection('audit_logs')
    .add(payload);

  console.log('✅ AUDIT GUARDADO', document.id);

  return document.id;
}

module.exports = {
  saveAudit,
};