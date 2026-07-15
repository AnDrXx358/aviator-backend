function build(context) {
  if (!context || typeof context.toMap !== 'function') {
    throw new TypeError(
      'AuditPayloadBuilder requiere una instancia válida de AuditContext.'
    );
  }

  return context.toMap();
}

module.exports = {
  build,
};