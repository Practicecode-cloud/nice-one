/* =========================================================================
   API.JS
   Thin wrapper around fetch() for every CRUD operation against the Express
   backend, plus a small in-memory cache so dropdowns/joins don't refetch
   constantly. Every write operation (POST/PUT/DELETE) invalidates the
   relevant cache entry and notifies the dashboard to refresh live.
   ========================================================================= */

const Api = (() => {
  const cache = new Map(); // moduleKey -> array of rows

  async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    let body = null;
    try { body = await res.json(); } catch (_) { /* no body */ }

    if (!res.ok) {
      const message = (body && (body.message || body.error)) || `Request failed (${res.status})`;
      throw new Error(message);
    }
    return body;
  }

  async function list(moduleKey, { force = false } = {}) {
    const cfg = MODULES[moduleKey];
    if (!force && cache.has(moduleKey)) return cache.get(moduleKey);
    const data = await request(`/${cfg.endpoint}`);
    const rows = Array.isArray(data) ? data : [];
    cache.set(moduleKey, rows);
    return rows;
  }

  function invalidate(moduleKey) {
    cache.delete(moduleKey);
  }

  function invalidateAll() {
    cache.clear();
  }

  async function create(moduleKey, payload) {
    const cfg = MODULES[moduleKey];
    const result = await request(`/${cfg.endpoint}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    invalidate(moduleKey);
    return result;
  }

  async function update(moduleKey, id, payload) {
    const cfg = MODULES[moduleKey];
    const result = await request(`/${cfg.endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    invalidate(moduleKey);
    return result;
  }

  async function remove(moduleKey, id) {
    const cfg = MODULES[moduleKey];
    const result = await request(`/${cfg.endpoint}/${id}`, { method: 'DELETE' });
    invalidate(moduleKey);
    return result;
  }

  /* Ping the API root's first module list endpoint to detect connectivity */
  async function checkConnection() {
    try {
      await request('/hotels');
      return true;
    } catch (_) {
      return false;
    }
  }

  return { list, create, update, remove, invalidate, invalidateAll, checkConnection };
})();
