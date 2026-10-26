const APP_CACHE_PREFIX = 'potok-static-';
const NETWORK_ERROR = 'Не удалось проверить обновление. Подключитесь к интернету и попробуйте снова. Кэш и финансовые данные сохранены.';

/** Clear only this app's static shell. Financial storage is never accessed. */
export async function resetAppCache({ reload = true } = {}) {
  if (!globalThis.caches?.keys || !globalThis.caches?.delete) {
    throw new Error('Очистка кэша недоступна в этом браузере. Финансовые данные сохранены.');
  }
  const current = new URL(globalThis.location.href);
  const scope = new URL('./', current).href;
  const token = `${Date.now()}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  const probe = new URL('index.html', scope);
  probe.searchParams.set('_potok_check', token);
  try {
    // A unique cache-miss URL also bypasses older, still controlling workers.
    const response = await fetch(probe.href, {
      cache: 'no-store', credentials: 'same-origin',
      ...(globalThis.AbortSignal?.timeout ? { signal: AbortSignal.timeout(15000) } : {})
    });
    if (response.status !== 200 || response.redirected || !/text\/html/i.test(response.headers.get('content-type') || '')) throw new Error();
    const html = await response.text();
    const version = html.match(/<meta\s+name=["']potok-version["']\s+content=["'](\d+)\.(\d+)\.(\d+)["']/i);
    if (!version || Number(version[1]) < 1 || (Number(version[1]) === 1 && Number(version[2]) < 1) || !/<div\s+id=["']app["']/i.test(html) || !html.includes('Поток')) throw new Error();
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  // Finish read-only preparation before deleting any static assets.
  const names = (await caches.keys()).filter(name => name.startsWith(APP_CACHE_PREFIX));
  const registrations = globalThis.navigator?.serviceWorker?.getRegistrations
    ? (await navigator.serviceWorker.getRegistrations()).filter(reg => reg.scope === scope) : [];
  const cleared = await Promise.all(names.map(name => caches.delete(name)));
  const removed = await Promise.all(registrations.map(reg => reg.unregister()));
  const result = { clearedCaches: cleared.filter(Boolean).length, unregistered: removed.filter(Boolean).length };
  if (reload) {
    // Preserve path, existing parameters and route, even while an old worker controls this client.
    current.searchParams.set('_potok_reload', token);
    location.replace(current.href);
  }
  return result;
}
