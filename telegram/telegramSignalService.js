const {
  sendTelegramMessage,
} = require('./telegramService');

async function sendConnected() {
  return sendTelegramMessage(
    '🚀 Zoraida conectada correctamente'
  );
}

async function sendEntry({
  entryAfter,
  signal,
  recommendedStake,
  contextTag,
  strategy = 'NORMAL',
}) {
  const target = signal.includes('2.0')
    ? '2.0x'
    : '1.5x';

  const strategyLabel =
    strategy === 'BOOST'
      ? '⚡ BOOST\n\n'
      : '';

  const message = [
    '🔥 Zoraida VIP',
    '',
    `${strategyLabel}🚀 ENTRADA DETECTADA`,
    '',
    '⚠️ Ejecutar después de:',
    `${Number(entryAfter).toFixed(2)}x`,
    '',
    `🎯 Punto de Retiro: ${target}`,
    '',
    `💰 Inversión sugerida: ${Number(recommendedStake).toFixed(1)}%`,
    '',
    `🧠 Contexto: ${contextTag}`,
  ].join('\n');

  return sendTelegramMessage(message);
}

async function sendWin({
  closeValue,
}) {
  const message = [
    '✅ WIN',
    '',
    `📈 Cerró en ${Number(closeValue).toFixed(2)}x`,
    '',
    '🧠 Momentum respetado.',
  ].join('\n');

  return sendTelegramMessage(message);
}

async function sendLoss({
  closeValue,
}) {
  const message = [
    '❌ LOSS',
    '',
    `📉 Cayó en ${Number(closeValue).toFixed(2)}x`,
    '',
    '🧠 Entrada invalidada por el mercado.',
  ].join('\n');

  return sendTelegramMessage(message);
}

async function sendWaiting({
  reason,
}) {
  const message = [
    '⚠️ Zoraida en espera',
    '',
    'Estado: esperando confirmación real.',
    `Motivo: ${reason}`,
    '',
    'No hay entrada por ahora.',
  ].join('\n');

  return sendTelegramMessage(message);
}

async function sendBalanceSummary({
  rounds,
}) {
  if (!Array.isArray(rounds)) {
    throw new TypeError(
      'rounds debe ser un arreglo.'
    );
  }

  const wins = rounds.filter(
    (round) => round.win === true
  ).length;

  const losses = rounds.length - wins;

  const winrate =
    rounds.length === 0
      ? 0
      : (wins / rounds.length) * 100;

  const lines = [
    '🧾 BALANCE BETA — 20 señales',
    '',
    `✅ Wins: ${wins}`,
    `❌ Loss: ${losses}`,
    `📊 Winrate: ${winrate.toFixed(1)}%`,
    '',
    'Detalle:',
    '',
  ];

  rounds.forEach((round, index) => {
    const result =
      round.win === true
        ? '✅ WIN'
        : '❌ LOSS';

    const entry =
      Number(round.entryAfter).toFixed(2);

    const close =
      Number(round.closeValue).toFixed(2);

    const target =
      Number(round.target).toFixed(1);

    const strategy =
      String(round.strategy ?? 'NORMAL');

    const contextTag =
      String(round.contextTag ?? 'NORMAL');

    const lastMultipliers =
      Array.isArray(round.lastMultipliers)
        ? round.lastMultipliers
        : [];

    let contextText = '';

    if (contextTag === 'RATON') {
      contextText = ' | 🐭 RATON';
    } else if (contextTag === 'VOLATIL') {
      contextText = ' | 🌪️ VOLATIL';
    } else if (contextTag === 'TECHO_LOCAL') {
      contextText = ' | 🏔️ TECHO';
    }

    let strategyText = '';

    if (strategy === 'BOOST') {
      strategyText = ' | ⚡ BOOST';
    } else if (strategy === 'REBOTE') {
      strategyText = ' | 🔁 REBOTE';
    }

    const last5Text = lastMultipliers
      .map((value) =>
        Number(value).toFixed(2)
      )
      .join(' • ');

    lines.push(
      `${index + 1}. ${result}${strategyText}${contextText} | ` +
      `target ${target}x | después de ${entry}x | cayó en ${close}x`
    );

    lines.push(
      `    Últimos 5: ${last5Text}`
    );

    lines.push('');
  });

  return sendTelegramMessage(
    lines.join('\n')
  );
}

module.exports = {
  sendConnected,
  sendEntry,
  sendWin,
  sendLoss,
  sendWaiting,
  sendBalanceSummary,
};