const fs = require('fs/promises');
const path = require('path');

const { db } = require('../firebase/firebaseClient');

function serializeFirestoreValue(value) {
  if (
    value &&
    typeof value.toDate === 'function'
  ) {
    return value.toDate().toISOString();
  }

  return value;
}

async function exportSignals({
  outputPath = path.join(
    process.cwd(),
    'exports',
    'signals.json'
  ),
} = {}) {
  const snapshot = await db
    .collection('audit')
    .doc('signals')
    .collection('items')
    .get();

  console.log(
    `📦 Señales encontradas: ${snapshot.docs.length}`
  );

  const signals = snapshot.docs.map((doc) => {
    const originalData = doc.data();
    const data = {};

    for (const [key, value] of Object.entries(originalData)) {
      data[key] = serializeFirestoreValue(value);
    }

    data.id = doc.id;

    return data;
  });

  await fs.mkdir(
    path.dirname(outputPath),
    { recursive: true }
  );

  await fs.writeFile(
    outputPath,
    JSON.stringify(signals, null, 2),
    'utf8'
  );

  console.log(
    `✅ Archivo signals.json generado en ${outputPath}`
  );

  return {
    outputPath,
    total: signals.length,
  };
}

module.exports = {
  exportSignals,
};