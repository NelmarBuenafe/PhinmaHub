export function createQueryCache({ maxAge = 30_000, maxEntries = 64, now = Date.now } = {}) {
  const entries = new Map();
  let account;
  const empty = () => ({ data: undefined, error: null, pending: false, stale: true, updatedAt: 0 });
  function entryFor(key) {
    if (!entries.has(key)) {
      for (const [oldKey, oldEntry] of entries) {
        if (entries.size < maxEntries) break;
        if (!oldEntry.listeners.size && !oldEntry.request) entries.delete(oldKey);
      }
      entries.set(key, { snapshot: empty(), listeners: new Set(), generation: 0, request: null });
    }
    return entries.get(key);
  }
  function publish(entry, changes) {
    entry.snapshot = { ...entry.snapshot, ...changes };
    entry.listeners.forEach((notify) => notify());
  }
  function clear(error = null) {
    entries.forEach((entry) => {
      entry.generation += 1;
      entry.request = null;
      publish(entry, { ...empty(), stale: false, error });
    });
  }
  return {
    read: (key) => entryFor(key).snapshot,
    subscribe(key, notify) {
      const entry = entryFor(key);
      entry.listeners.add(notify);
      return () => entry.listeners.delete(notify);
    },
    request(key, fetcher, { force = false, onSuccess } = {}) {
      const entry = entryFor(key);
      if (entry.request?.generation === entry.generation) return entry.request.promise;
      if (!force && !entry.snapshot.stale && entry.snapshot.data !== undefined && now() - entry.snapshot.updatedAt < maxAge) {
        return Promise.resolve(entry.snapshot.data);
      }
      const generation = entry.generation;
      publish(entry, { pending: true, stale: false, error: null });
      const promise = Promise.resolve().then(fetcher).then((data) => {
        if (generation === entry.generation) {
          publish(entry, { data, error: null, pending: false, updatedAt: now() });
          onSuccess?.(data);
        }
        return data;
      }, (error) => {
        if (generation === entry.generation) {
          if ([401, 403].includes(error.response?.status)) clear(error);
          else publish(entry, { error, pending: false });
        }
        throw error;
      }).finally(() => {
        if (entry.request?.promise === promise) entry.request = null;
      });
      entry.request = { generation, promise };
      return promise;
    },
    update(key, updater) {
      const entry = entryFor(key);
      entry.generation += 1;
      entry.request = null;
      publish(entry, { data: typeof updater === "function" ? updater(entry.snapshot.data) : updater, error: null, stale: false, pending: false, updatedAt: now() });
    },
    seed(key, data) {
      const entry = entryFor(key);
      if (!entry.request && (entry.snapshot.data === undefined || entry.snapshot.stale)) {
        publish(entry, { data, error: null, stale: false, pending: false, updatedAt: now() });
      }
    },
    invalidate(matches = () => true) {
      entries.forEach((entry, key) => {
        if (!matches(key)) return;
        entry.generation += 1;
        entry.request = null;
        publish(entry, { stale: true, pending: false, error: null, updatedAt: 0 });
      });
    },
    clear,
    setAccount(nextAccount) {
      if (account !== nextAccount) clear();
      account = nextAccount;
    },
  };
}

export const clientQueryCache = createQueryCache();

export function invalidateAfterMutation(url = "", method = "get") {
  if (["get", "head", "options"].includes(method.toLowerCase())) return;
  if (!/^\/(student|teacher|admin)\//.test(url)) return;
  if (/\/materials\/upload$/.test(url)) return;
  clientQueryCache.invalidate((key) => {
    const endpoint = key.slice(key.indexOf("|") + 1);
    if (/^\/student\/lessons\/[^/]+\/complete$/.test(url)) {
      return endpoint === "/student/dashboard" || endpoint === "/student/courses";
    }
    if (/^\/student\/assignments\/[^/]+\/submission$/.test(url)) {
      return endpoint === "/student/dashboard" || endpoint === "/student/assignments" || /^\/student\/courses\/[^/]+\/assignments$/.test(endpoint);
    }
    if (!url.startsWith("/admin/") && (endpoint === "/teacher/course-categories" || endpoint.endsWith("/profile"))) return false;
    return /^\/(student|teacher)\//.test(endpoint);
  });
}
