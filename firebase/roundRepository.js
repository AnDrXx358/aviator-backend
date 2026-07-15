const { db } = require('./firebaseClient');

const COLLECTION_NAME = 'rondas';

async function saveRound({
  timestamp,
  win,
  entryAfter,
  closeValue,
  target,
  signal,
  stake,
  contextTag,
  strategy = 'NORMAL',
  auditId = null,
  fromSimpleFilter = false,
  lastMultipliers = [],
}) {
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
    throw new Error('El timestamp de la ronda debe ser válido.');
  }

  const payload = {
    timestamp,
    fecha: new Date(timestamp).toISOString(),
    win: Boolean(win),
    result: win ? 'WIN' : 'LOSS',
    entryAfter: Number(entryAfter),
    closeValue: Number(closeValue),
    target: Number(target),
    signal: String(signal ?? ''),
    stake: Number(stake ?? 0),
    contextTag: String(contextTag ?? 'NORMAL'),
    strategy: String(strategy ?? 'NORMAL'),
    auditId,
    fromSimpleFilter: Boolean(fromSimpleFilter),
    lastMultipliers: Array.isArray(lastMultipliers)
      ? lastMultipliers.map(Number)
      : [],
  };

  const document = await db
    .collection(COLLECTION_NAME)
    .add(payload);

  return {
    id: document.id,
    ...payload,
  };
}

module.exports = {
  saveRound,
};