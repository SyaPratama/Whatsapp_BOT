let pino = null;
try {
  pino = require('pino');
} catch (_err) {
  /* pino is optional; we fall back to a no-op logger */
}

function buildNoopLogger() {
  return {
    level: 'silent',
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    trace: () => {},
    child: () => buildNoopLogger()
  };
}

function buildLogger() {
  if (!pino) return buildNoopLogger();
  const usePino = String(process.env.BAILEYS_USE_PINO || 'true').toLowerCase() !== 'false';
  if (!usePino) return buildNoopLogger();
  const level = process.env.BAILEYS_LOG_LEVEL || 'silent';
  return pino({ level, redact: ['auth.creds', 'creds', 'keys', 'creds.pairingCode'] });
}

module.exports = { buildLogger };