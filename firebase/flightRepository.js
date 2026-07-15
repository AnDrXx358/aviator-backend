const { db } = require('./firebaseClient');

const COLLECTION_NAME = 'vuelos';

async function getLatestFlights(limit = 1000) {
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => doc.data().multiplier)
    .filter((multiplier) => typeof multiplier === 'number')
    .reverse();
}

async function saveFlight({
  multiplier,
  timestamp,
  source = 'desconocido',
}) {
  await db
    .collection(COLLECTION_NAME)
    .doc(timestamp.toString())
    .set({
      multiplier,
      timestamp,
      fecha: new Date(timestamp).toISOString(),
      source,
    });
}

async function deleteLatestFlight() {
  const snapshot = await db
    .collection(COLLECTION_NAME)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const lastDocument = snapshot.docs[0];
  const data = lastDocument.data();

  await lastDocument.ref.delete();

  return {
    id: lastDocument.id,
    multiplier: data.multiplier,
    timestamp: data.timestamp,
  };
}

module.exports = {
  getLatestFlights,
  saveFlight,
  deleteLatestFlight,
};