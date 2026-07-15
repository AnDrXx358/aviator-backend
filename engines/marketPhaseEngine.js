function getPatternType({
  ultraStrong,
  strongMomentum,
  badStreakNow,
}) {
  if (ultraStrong) {
    return 'RACHA_PRO';
  }

  if (strongMomentum) {
    return 'MOMENTUM';
  }

  if (badStreakNow >= 3) {
    return 'MALO';
  }

  return 'NEUTRAL';
}

function getCycleState({
  lowPct,
  highPct,
}) {
  if (highPct >= 25) {
    return '🔥 Ciclo caliente';
  }

  if (lowPct >= 60) {
    return '❄️ Ciclo frío';
  }

  return '⚖️ Ciclo neutro';
}

function getSequenceState(lowStreak) {
  if (lowStreak >= 5) {
    return `🚨 Posible pre-explosión (racha <2x = ${lowStreak})`;
  }

  if (lowStreak >= 3) {
    return `⚠ Atención: racha <2x = ${lowStreak}`;
  }

  return `🟢 Secuencia normal (racha <2x = ${lowStreak})`;
}

module.exports = {
  getPatternType,
  getCycleState,
  getSequenceState,
};