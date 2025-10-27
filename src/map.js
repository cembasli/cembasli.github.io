import { getEntry, setEntry, subscribe } from './stores/entriesStore.js';
import { syncSidebar } from './sidebar.js';

const markerIndex = new Map();

function parseCoordinate(raw) {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length === 2) {
    return { lat: Number(raw[0]), lng: Number(raw[1]) };
  }
  if (typeof raw === 'string') {
    const pointMatch = raw.match(/Point\s*\(([-\d\.]+)\s+([-\d\.]+)\)/i);
    if (pointMatch) {
      return { lng: Number(pointMatch[1]), lat: Number(pointMatch[2]) };
    }
    const parts = raw.split(/[,\s]+/).filter(Boolean).map(Number);
    if (parts.length === 2) {
      return { lat: parts[0], lng: parts[1] };
    }
  }
  if (typeof raw === 'object' && raw) {
    const { lat, lng, latitude, longitude } = raw;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return { lat: latitude, lng: longitude };
    }
  }
  return null;
}

function formatInfoRow(label, value) {
  if (!value) return '';
  return `<div class="entry-popup__meta-row"><span class="entry-popup__meta-label">${label}</span><span class="entry-popup__meta-value">${value}</span></div>`;
}

function buildPreviewText(note) {
  if (!note || !note.trim()) {
    return '<em>Henüz not yok.</em>';
  }
  const trimmed = note.trim();
  if (trimmed.length <= 160) {
    return trimmed;
  }
  return `${trimmed.slice(0, 160)}…`;
}

function buildGallery(images) {
  if (!Array.isArray(images) || images.length === 0) return '';
  const thumbs = images
    .slice(0, 6)
    .map(
      (src, index) => `<button class="entry-popup__thumb" type="button" data-image-index="${index}"><img src="${src}" alt="Görsel ${index + 1}" loading="lazy" /></button>`
    )
    .join('');
  return `<div class="entry-popup__gallery">${thumbs}</div>`;
}

function buildLinks(entry) {
  const links = [];
  if (entry.wikidataId) {
    links.push(`<a href="https://www.wikidata.org/wiki/${entry.wikidataId}" target="_blank" rel="noopener">Wikidata: ${entry.wikidataId}</a>`);
  }
  if (entry.keId) {
    links.push(`<a href="https://kulturenvanteri.com/${entry.keId}" target="_blank" rel="noopener">KE: ${entry.keId}</a>`);
  }
  if (entry.provinceLabel || entry.districtLabel) {
    const parts = [entry.provinceLabel, entry.districtLabel].filter(Boolean).join(' / ');
    links.push(`Konum: ${parts}`);
  }
  if (links.length === 0) return '';
  return `<div class="entry-popup__links">${links.map((text) => `<div>${text}</div>`).join('')}</div>`;
}

function buildPopupContent(entry) {
  const preview = buildPreviewText(entry?.note);
  const gallery = buildGallery(entry?.images);
  const links = buildLinks(entry ?? {});

  return `
    <div class="entry-popup" data-entry-id="${entry?.id ?? ''}" data-mode="${entry?.mode ?? 'read'}">
      <header class="entry-popup__header">
        <h3 class="entry-popup__title">${entry?.label ?? entry?.wikidataId ?? 'Bilinmeyen yer'}</h3>
        ${formatInfoRow('Wikidata', entry?.wikidataId)}
      </header>
      <div class="entry-popup__preview">${preview}</div>
      ${gallery}
      ${links}
    </div>
  `;
}

function ensureMarker(entry, options) {
  const { markerFactory } = options;
  const coordinate = parseCoordinate(entry.coordinate);
  if (!coordinate) {
    throw new Error(`Entry ${entry.id} is missing coordinate data.`);
  }

  if (markerFactory) {
    return markerFactory(entry, coordinate);
  }

  const leaflet = typeof window !== 'undefined' ? window.L : null;
  if (!leaflet) {
    throw new Error('Leaflet (window.L) is required to create markers.');
  }
  return leaflet.marker([coordinate.lat, coordinate.lng]);
}

function refreshPopup(marker, entryId) {
  const latest = getEntry(entryId);
  if (!latest) return;
  marker.setPopupContent(buildPopupContent(latest));
  syncSidebar(latest, { source: 'popup' });
}

subscribe((id, entry) => {
  const marker = markerIndex.get(id);
  if (!marker || !entry) return;
  if (marker.isPopupOpen && marker.isPopupOpen()) {
    marker.setPopupContent(buildPopupContent(entry));
  }
});

export function addMarker(map, rawEntry, options = {}) {
  if (!map) {
    throw new Error('A Leaflet map instance is required.');
  }
  if (!rawEntry?.id) {
    throw new Error('Entry must include an id.');
  }

  const entry = setEntry(rawEntry.id, rawEntry);
  const marker = ensureMarker(entry, options);
  markerIndex.set(entry.id, marker);

  const popupContent = buildPopupContent(getEntry(entry.id));
  if (marker.bindPopup) {
    marker.bindPopup(popupContent);
  }

  marker.on?.('popupopen', () => refreshPopup(marker, entry.id));
  marker.on?.('popupclose', () => syncSidebar(getEntry(entry.id), { source: 'popup' }));

  marker.addTo?.(map);

  if (options.openImmediately) {
    marker.openPopup?.();
  }

  return marker;
}

export function refreshMarkers() {
  for (const [id, marker] of markerIndex) {
    const entry = getEntry(id);
    if (!entry || !marker) continue;
    if (marker.isPopupOpen && marker.isPopupOpen()) {
      marker.setPopupContent(buildPopupContent(entry));
    }
  }
}
