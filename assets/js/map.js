const TURKIYE_BOUNDS = [
  [36.0, 26.0],
  [42.5, 45.0],
];

const map = L.map('map', {
  zoomControl: true,
  minZoom: 5,
});

map.fitBounds(TURKIYE_BOUNDS, { padding: [20, 20] });
map.setMaxBounds([
  [34.0, 24.0],
  [44.5, 47.0],
]);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(map);

const panelLabelNode = document.getElementById('panel-label');
const panelInstanceNode = document.getElementById('panel-instance');
const panelStatusNode = document.getElementById('panel-status');

function escapeHtml(value) {
  const stringValue = value == null ? '' : String(value);

  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTagValue(value) {
  return value.replace(/_/g, ' ');
}

function updatePanelStatus(message) {
  if (!panelStatusNode) {
    return;
  }

  if (!message) {
    panelStatusNode.textContent = '';
    panelStatusNode.style.display = 'none';
    return;
  }

  panelStatusNode.textContent = message;
  panelStatusNode.style.display = 'block';
}

function openEntryPanel(label, instanceLabel) {
  if (!panelLabelNode || !panelInstanceNode) {
    return;
  }

  panelLabelNode.textContent = label;
  panelInstanceNode.textContent = instanceLabel;
  updatePanelStatus('');
}

function buildInstanceLabel(tags) {
  if (!tags) {
    return 'Mezarlık';
  }

  const values = [
    tags['cemetery:type'],
    tags.religion,
    tags.amenity,
    tags.landuse,
    tags.denomination,
  ]
    .filter((value) =>
      Boolean(
        value && value !== 'cemetery' && value !== 'grave_yard' && value !== 'yes',
      ),
    )
    .map(formatTagValue);

  if (values.length === 0) {
    return 'Mezarlık';
  }

  const uniqueValues = [...new Set(values)];
  return uniqueValues.join(' • ');
}

function createEntryFromElement(element) {
  const { tags } = element;
  let coordinates = null;

  if (element.type === 'node' && typeof element.lat === 'number' && typeof element.lon === 'number') {
    coordinates = [element.lat, element.lon];
  } else if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
    coordinates = [element.center.lat, element.center.lon];
  }

  if (!coordinates) {
    return null;
  }

  const label = tags?.name ? tags.name : 'İsimsiz mezarlık';
  const instanceLabel = buildInstanceLabel(tags);

  return {
    id: `${element.type}/${element.id}`,
    label,
    instanceLabel,
    coordinates,
  };
}

function addMarker(entry) {
  const marker = L.marker(entry.coordinates);

  const escapedLabel = escapeHtml(entry.label);
  const escapedInstanceLabel = escapeHtml(entry.instanceLabel);

  const popupContent = `
    <div class="popup-content">
      <strong>${escapedLabel}</strong>
      <span>${escapedInstanceLabel}</span>
      <button type="button" class="popup-content__button js-open-entry">Detayları göster</button>
    </div>
  `;

  marker.bindPopup(popupContent);

  marker.on('popupopen', () => {
    const popupElement = marker.getPopup()?.getElement();
    if (!popupElement) {
      return;
    }

    const trigger = popupElement.querySelector('.js-open-entry');
    if (!trigger) {
      return;
    }

    const handleClick = (event) => {
      event.preventDefault();
      openEntryPanel(entry.label, entry.instanceLabel);
    };

    trigger.addEventListener('click', handleClick);

    marker.once('popupclose', () => {
      trigger.removeEventListener('click', handleClick);
    });
  });

  marker.addTo(map);
}

async function loadCemeteries() {
  updatePanelStatus("Türkiye'deki mezarlıklar yükleniyor…");

  const overpassEndpoint = 'https://overpass-api.de/api/interpreter';
  const bbox = `${TURKIYE_BOUNDS[0][0]},${TURKIYE_BOUNDS[0][1]},${TURKIYE_BOUNDS[1][0]},${TURKIYE_BOUNDS[1][1]}`;
  const query = `
    [out:json][timeout:40];
    (
      node["landuse"="cemetery"](${bbox});
      way["landuse"="cemetery"](${bbox});
      relation["landuse"="cemetery"](${bbox});
      node["amenity"="grave_yard"](${bbox});
      way["amenity"="grave_yard"](${bbox});
      relation["amenity"="grave_yard"](${bbox});
    );
    out center 500;
  `;

  const url = `${overpassEndpoint}?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Overpass API ${response.status}`);
    }

    const data = await response.json();
    const elements = Array.isArray(data.elements) ? data.elements : [];
    const entries = elements
      .map((element) => createEntryFromElement(element))
      .filter((entry) => entry !== null);

    if (entries.length === 0) {
      updatePanelStatus('Türkiye sınırları içinde mezarlık bulunamadı.');
      return;
    }

    entries.forEach((entry) => addMarker(entry));
    updatePanelStatus('Haritadan bir mezarlık seçin.');
  } catch (error) {
    console.error('Mezarlıklar yüklenirken bir hata oluştu:', error);
    updatePanelStatus('Mezarlıklar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
  }
}

loadCemeteries();
