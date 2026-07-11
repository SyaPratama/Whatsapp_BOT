const DEFAULT_STATE = {
  antilinkRegex: {
    group: /chat\.whatsapp\.com\/(?:invite|join)/i,
    channel: /whatsapp\.com\/channel\/[A-Za-z0-9]+/i,
    telegram: /t\.me\/[A-Za-z0-9_]+/i,
    all: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+\/[^\s]*/i
  },
  geseran: {},
  db_lw: {},
  antilink: {},
  autoList: {},
  history9d: [],
  self: false,
  welcome: false,
  goodbye: false,
  autoread: false
};

export function createInitialState(overrides = {}) {
  return {
    ...DEFAULT_STATE,
    ...overrides,
    antilinkRegex: overrides.antilinkRegex || DEFAULT_STATE.antilinkRegex,
    geseran: overrides.geseran || {},
    db_lw: overrides.db_lw || {},
    antilink: overrides.antilink || {},
    autoList: overrides.autoList || {},
    history9d: overrides.history9d || []
  };
}

export function bootstrapGlobals(target = globalThis, overrides = {}) {
  const state = createInitialState(overrides);

  for (const [key, value] of Object.entries(state)) {
    if (target[key] == null) target[key] = value;
  }

  return target;
}

export { DEFAULT_STATE };