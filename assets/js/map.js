const entries = [
  {
    id: 1,
    label: "St. John's Bakery",
    instanceLabel: "Baker's & Sons Cooperative",
    coordinates: [51.505, -0.09],
  },
  {
    id: 2,
    label: "King & Queen's Market",
    instanceLabel: "Queen & Country Foods",
    coordinates: [51.51, -0.08],
  },
  {
    id: 3,
    label: "Fisherman's Wharf",
    instanceLabel: "Anchors & Ale",
    coordinates: [51.503, -0.06],
  },
];

const map = L.map('map', {
  center: [51.505, -0.09],
  zoom: 13,
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

function escapeHtml(value) {
  const stringValue = value == null ? '' : String(value);

  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function openEntryPanel(label, instanceLabel) {
  const labelNode = document.getElementById('panel-label');
  const instanceNode = document.getElementById('panel-instance');

  if (!labelNode || !instanceNode) {
    return;
  }

  labelNode.textContent = label;
  instanceNode.textContent = instanceLabel;
}

entries.forEach((entry) => {
  const marker = L.marker(entry.coordinates);

  const escapedLabel = escapeHtml(entry.label);
  const escapedInstanceLabel = escapeHtml(entry.instanceLabel);
  const popupContent = `
    <div class="popup-content">
      <strong>${escapedLabel}</strong>
      <span>${escapedInstanceLabel}</span>
      <button type="button" class="popup-content__button js-open-entry">Open details</button>
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
});
