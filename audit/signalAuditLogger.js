const { db, admin } = require('../firebase/firebaseClient');

async function createSignal(context) {
  if (!context || typeof context.toMap !== 'function') {
    throw new TypeError(
      'SignalAuditLogger requiere una instancia válida de AuditContext.'
    );
  }

  const data = context.toMap();

  data.status = 'PENDING';
  data.createdAt = admin.firestore.FieldValue.serverTimestamp();

  const doc = await db
    .collection('audit')
    .doc('signals')
    .collection('items')
    .add(data);

  return doc.id;
}

async function closeSignal({
  auditId,
  win,
  closeValue,
}) {
  if (!auditId) {
    throw new Error('auditId es obligatorio.');
  }

  await db
    .collection('audit')
    .doc('signals')
    .collection('items')
    .doc(auditId)
    .update({
      status: win ? 'WIN' : 'LOSS',
      closeValue,
      closedAt:
        admin.firestore.FieldValue.serverTimestamp(),
    });
}

module.exports = {
  createSignal,
  closeSignal,
};