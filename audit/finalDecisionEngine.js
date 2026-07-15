const DECISION_ACTION = Object.freeze({
  proceed: 'proceed',
  reduceRisk: 'reduceRisk',
  block: 'block',
});

function evaluate({
  signalTipo,
  verdict,
}) {
  if (
    !verdict ||
    verdict.actionBias === 'NEUTRAL'
  ) {
    return {
      action: DECISION_ACTION.proceed,
      motivo: 'Auditor neutral',
    };
  }

  if (signalTipo === 'ESPERAR') {
    return {
      action: DECISION_ACTION.proceed,
      motivo: 'Motor en espera',
    };
  }

  if (verdict.actionBias === 'BLOQUEAR_ENTRADA') {
    return {
      action: DECISION_ACTION.block,
      motivo: verdict.reason,
    };
  }

  if (verdict.actionBias === 'REDUCIR_RIESGO') {
    return {
      action: DECISION_ACTION.reduceRisk,
      motivo: verdict.reason,
    };
  }

  if (verdict.actionBias === 'FAVORECER') {
    return {
      action: DECISION_ACTION.proceed,
      motivo: verdict.reason,
    };
  }

  return {
    action: DECISION_ACTION.proceed,
    motivo: 'Fallback',
  };
}

module.exports = {
  evaluate,
  DECISION_ACTION,
};