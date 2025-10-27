const subscribers = new Set();
const entries = new Map();

function notify(id) {
  for (const subscriber of subscribers) {
    subscriber(id, getEntry(id));
  }
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getEntry(id) {
  return entries.get(id) ?? null;
}

export function setEntry(id, data) {
  const current = entries.get(id) ?? {};
  const merged = {
    id,
    note: '',
    images: [],
    mode: 'read',
    ...current,
    ...data,
  };
  entries.set(id, merged);
  notify(id);
  return merged;
}

export function updateEntry(id, updater) {
  const current = entries.get(id) ?? {};
  const next = updater({
    id,
    note: '',
    images: [],
    mode: 'read',
    ...current,
  });
  entries.set(id, next);
  notify(id);
  return next;
}

export function setNote(id, note) {
  return updateEntry(id, (entry) => ({ ...entry, note }));
}

export function setImages(id, images) {
  return updateEntry(id, (entry) => ({ ...entry, images: Array.from(images) }));
}

export function setMode(id, mode) {
  return updateEntry(id, (entry) => ({ ...entry, mode }));
}

export default {
  subscribe,
  getEntry,
  setEntry,
  updateEntry,
  setNote,
  setImages,
  setMode,
};
