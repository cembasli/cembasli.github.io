import { createEntryFromBinding } from './lib/wikidata.js';
import { addMarker } from './map.js';
import { subscribe } from './stores/entriesStore.js';
import { syncSidebar } from './sidebar.js';

let mapInstance = null;

function initMap() {
  if (typeof window === 'undefined') return null;
  const leaflet = window.L;
  if (!leaflet) return null;
  const map = leaflet.map('map', {
    center: [39.0, 35.0],
    zoom: 6,
  });
  leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
  return map;
}

export function bootstrap(bindings) {
  if (!mapInstance) {
    mapInstance = initMap();
  }
  const markerList = [];
  for (const binding of bindings) {
    const entry = createEntryFromBinding(binding);
    const marker = addMarker(mapInstance, entry);
    markerList.push(marker);
  }
  return markerList;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    mapInstance = initMap();
    subscribe((id, entry) => {
      if (!entry) return;
      const isActive = document.querySelector(`.entry-popup[data-entry-id="${id}"]`);
      if (isActive) {
        syncSidebar(entry, { source: 'store' });
      }
    });
  });
}

export default {
  bootstrap,
};
