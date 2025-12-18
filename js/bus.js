export class Bus {
  constructor() { this.handlers = new Map(); }
  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.handlers.get(type)?.delete(fn);
  }
  emit(type, payload) {
    const hs = this.handlers.get(type);
    if (!hs) return;
    for (const fn of hs) fn(payload);
  }
}

/** Message helpers */
export const Msg = {
  chat: (text) => ({ kind: 'chat', text }),
  patch: (patch) => ({ kind: 'patch', patch }),
  fullState: (state) => ({ kind: 'fullState', state }),
  action: (type, payload) => ({ kind: 'action', type, payload }),
};