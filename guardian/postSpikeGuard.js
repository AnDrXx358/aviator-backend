function analyze({
  allResults,
  lastReal,
}) {
  if (!Array.isArray(allResults)) {
    throw new TypeError(
      'allResults debe ser un arreglo.'
    );
  }

  const last5 = allResults.slice(-5);
  const last10 = allResults.slice(-10);

  const bad15Last5 =
    last5.filter(
      (value) => value < 1.5
    ).length;

  const deepCrashLast10 =
    last10.filter(
      (value) => value < 1.20
    ).length;

  const explosionLast5 =
    last5.filter(
      (value) => value >= 8.0
    ).length;

  const postSpikeRisk =
    lastReal >= 6.0 &&
    (
      explosionLast5 >= 2 ||
      deepCrashLast10 >= 1 ||
      bad15Last5 >= 2
    );

  return {
    postSpikeRisk,
    bad15Last5,
    deepCrashLast10,
    explosionLast5,
  };
}

module.exports = {
  analyze,
};