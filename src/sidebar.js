import entriesStore, { subscribe } from './stores/entriesStore.js';

const panel = typeof document !== 'undefined' ? document.querySelector('[data-side-panel]') : null;
const noteField = panel?.querySelector('[data-entry-note]') ?? null;
const titleField = panel?.querySelector('[data-entry-title]') ?? null;
const modeLabel = panel?.querySelector('.side-panel__mode') ?? null;

function updateModeLabel(mode) {
  if (!modeLabel) return;
  modeLabel.dataset.mode = mode;
  modeLabel.textContent = mode === 'edit' ? 'Düzenleme modu' : 'Okuma modu';
}

export function syncSidebar(entry, { source = 'popup' } = {}) {
  if (!panel || !entry) return;
  const mode = entry.mode ?? 'read';
  panel.dataset.entryId = entry.id;
  panel.dataset.mode = mode;
  updateModeLabel(mode);

  if (titleField) {
    titleField.textContent = entry.label ?? entry.wikidataId ?? 'Bilinmeyen yer';
  }

  if (noteField) {
    if (mode === 'edit' && source !== 'sidebar') {
      // leave editing content untouched while user is typing.
      return;
    }
    const note = entry.note?.trim();
    noteField.dataset.empty = note ? 'false' : 'true';
    noteField.textContent = note || 'Henüz not yok.';
  }
}

if (panel) {
  subscribe((id, entry) => {
    if (!entry) return;
    if (panel.dataset.entryId === id) {
      syncSidebar(entry, { source: 'store' });
    }
  });

  panel.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-mode-toggle]');
    if (!toggle) return;
    const entryId = panel.dataset.entryId;
    if (!entryId) return;
    const nextMode = panel.dataset.mode === 'read' ? 'edit' : 'read';
    entriesStore.setMode(entryId, nextMode);
    panel.dataset.mode = nextMode;
    updateModeLabel(nextMode);
  });
}
