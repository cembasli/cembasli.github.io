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
const panelMeIdNode = document.getElementById('panel-me-id');
const editorContainer = document.getElementById('entry-editor-container');
const editorSurface = document.getElementById('entry-editor');
const saveButton = document.getElementById('save-entry');
const imageInput = document.getElementById('image-input');
const galleryList = document.getElementById('image-gallery');
const galleryEmptyMessage = document.getElementById('gallery-empty');
const toolbarButtons = Array.from(document.querySelectorAll('.toolbar-button'));

const STORAGE_KEY = 'me-inventory-entries';
const COUNTER_KEY = 'me-inventory-counter';
const DEFAULT_SELECTION_MESSAGE = 'Envanter notlarını düzenleyebilirsiniz.';

let entriesStore = loadEntriesFromStorage();
let currentEntryKey = null;
let currentEntryState = null;
let statusResetHandle = null;

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

  if (statusResetHandle) {
    window.clearTimeout(statusResetHandle);
    statusResetHandle = null;
  }

  if (!message) {
    panelStatusNode.textContent = '';
    panelStatusNode.style.display = 'none';
    return;
  }

  panelStatusNode.textContent = message;
  panelStatusNode.style.display = 'block';
}

function scheduleStatusReset(entryKey) {
  if (statusResetHandle) {
    window.clearTimeout(statusResetHandle);
    statusResetHandle = null;
  }

  if (!entryKey) {
    return;
  }

  statusResetHandle = window.setTimeout(() => {
    if (currentEntryKey === entryKey) {
      updatePanelStatus(DEFAULT_SELECTION_MESSAGE);
    }
    statusResetHandle = null;
  }, 4000);
}

function loadEntriesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Kayıtlı mezarlık verileri okunamadı:', error);
  }

  return {};
}

function saveEntriesToStorage(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('Mezarlık verileri kaydedilemedi:', error);
  }
}

function generateMeId() {
  let nextValue = 1000;

  const storedValue = localStorage.getItem(COUNTER_KEY);
  if (storedValue) {
    const parsed = Number.parseInt(storedValue, 10);
    if (!Number.isNaN(parsed)) {
      nextValue = parsed;
    }
  }

  const meIdNumber = nextValue + 1;
  localStorage.setItem(COUNTER_KEY, String(meIdNumber));
  return `ME-${meIdNumber}`;
}

function cloneEntryState(entryKey) {
  const stored = entriesStore[entryKey];

  if (!stored) {
    return { meId: null, content: '', images: [] };
  }

  const images = Array.isArray(stored.images)
    ? stored.images
        .filter((image) => image && typeof image === 'object')
        .map((image) => ({ id: image.id, name: image.name, dataUrl: image.dataUrl }))
    : [];

  return {
    meId: stored.meId || null,
    content: stored.content || '',
    images,
  };
}

function persistCurrentEntry() {
  if (!currentEntryKey || !currentEntryState) {
    return;
  }

  entriesStore[currentEntryKey] = {
    meId: currentEntryState.meId,
    content: currentEntryState.content,
    images: currentEntryState.images,
  };

  saveEntriesToStorage(entriesStore);
}

function setEditorEnabled(enabled) {
  if (!editorContainer || !editorSurface || !saveButton) {
    return;
  }

  editorContainer.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  editorSurface.setAttribute('contenteditable', enabled ? 'true' : 'false');
  editorSurface.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  saveButton.disabled = !enabled;

  if (!enabled) {
    editorSurface.innerHTML = '';
    if (panelMeIdNode) {
      panelMeIdNode.textContent = 'Henüz oluşturulmadı';
    }
    renderImageGallery([]);
  }
}

function sanitizeEditorHtml(html) {
  const parser = new DOMParser();
  const wrapper = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = wrapper.body.firstElementChild;
  if (!root) {
    return '';
  }

  const allowedTags = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'a']);
  const allowedAttributes = {
    a: ['href'],
  };

  function cleanse(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      if (tagName === 'div') {
        const replacement = wrapper.createElement('p');
        while (node.firstChild) {
          replacement.appendChild(node.firstChild);
        }
        node.replaceWith(replacement);
        cleanse(replacement);
        return;
      }

      if (tagName === 'b') {
        const strong = wrapper.createElement('strong');
        while (node.firstChild) {
          strong.appendChild(node.firstChild);
        }
        node.replaceWith(strong);
        cleanse(strong);
        return;
      }

      if (tagName === 'i') {
        const em = wrapper.createElement('em');
        while (node.firstChild) {
          em.appendChild(node.firstChild);
        }
        node.replaceWith(em);
        cleanse(em);
        return;
      }

      if (!allowedTags.has(tagName)) {
        const parent = node.parentNode;
        if (parent) {
          while (node.firstChild) {
            parent.insertBefore(node.firstChild, node);
          }
          parent.removeChild(node);
        }
        return;
      }

      const allowedAttrNames = allowedAttributes[tagName] || [];
      const attributes = Array.from(node.attributes);
      attributes.forEach((attribute) => {
        const attrName = attribute.name.toLowerCase();
        if (!allowedAttrNames.includes(attrName)) {
          node.removeAttribute(attribute.name);
          return;
        }

        if (attrName === 'href') {
          const value = attribute.value || '';
          if (/^\s*javascript:/i.test(value)) {
            node.removeAttribute(attribute.name);
          }
        }
      });
    }

    let child = node.firstChild;
    while (child) {
      const next = child.nextSibling;
      cleanse(child);
      child = next;
    }
  }

  cleanse(root);

  const sanitized = root.innerHTML
    .replace(/\s+(&nbsp;)/g, ' $1')
    .replace(/<p>\s*<\/p>/g, '')
    .trim();

  return sanitized;
}

function renderImageGallery(images) {
  if (!galleryList || !galleryEmptyMessage) {
    return;
  }

  galleryList.innerHTML = '';

  if (!images || images.length === 0) {
    galleryEmptyMessage.style.display = 'block';
    return;
  }

  galleryEmptyMessage.style.display = 'none';

  images.forEach((image) => {
    if (!image || !image.dataUrl) {
      return;
    }

    const item = document.createElement('li');
    item.className = 'gallery__item';

    const img = document.createElement('img');
    img.className = 'gallery__image';
    img.src = image.dataUrl;
    img.alt = image.name ? `Mezarlık görseli: ${image.name}` : 'Mezarlık görseli';
    item.appendChild(img);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'gallery__remove';
    removeButton.textContent = 'Sil';
    removeButton.dataset.imageId = image.id;
    item.appendChild(removeButton);

    galleryList.appendChild(item);
  });
}

function createImageId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `img-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsDataURL(file);
  });
}

function handleImageUpload(event) {
  if (!currentEntryKey || !currentEntryState) {
    return;
  }

  const files = Array.from(event.target.files || []);
  if (files.length === 0) {
    return;
  }

  const additions = [];
  const targetKey = currentEntryKey;
  const targetState = currentEntryState;

  Promise.all(
    files.map((file) =>
      readFileAsDataUrl(file)
        .then((dataUrl) => ({ id: createImageId(), name: file.name, dataUrl }))
        .catch((error) => {
          console.warn('Bir görsel okunamadı:', error);
          return null;
        }),
    ),
  )
    .then((results) => {
      results.forEach((result) => {
        if (result) {
          additions.push(result);
        }
      });

      if (additions.length === 0) {
        if (imageInput) {
          imageInput.value = '';
        }
        return;
      }

      if (!targetState.meId) {
        targetState.meId = generateMeId();
      }

      targetState.images = [...targetState.images, ...additions];
      entriesStore[targetKey] = {
        meId: targetState.meId,
        content: targetState.content,
        images: targetState.images,
      };
      saveEntriesToStorage(entriesStore);

      if (currentEntryKey === targetKey) {
        currentEntryState = targetState;
        if (panelMeIdNode) {
          panelMeIdNode.textContent = targetState.meId || 'Henüz oluşturulmadı';
        }
        renderImageGallery(targetState.images);
      }
      if (imageInput) {
        imageInput.value = '';
      }

      if (currentEntryKey === targetKey) {
        updatePanelStatus(`Görseller kaydedildi. ME ID: ${targetState.meId}`);
        scheduleStatusReset(targetKey);
      }
    })
    .catch((error) => {
      console.warn('Görseller kaydedilirken bir hata oluştu:', error);
      if (imageInput) {
        imageInput.value = '';
      }
      if (currentEntryKey === targetKey) {
        updatePanelStatus('Görseller yüklenirken bir hata oluştu.');
        scheduleStatusReset(targetKey);
      }
    });
}

function removeImageFromEntry(imageId) {
  if (!currentEntryState || !imageId) {
    return;
  }

  currentEntryState.images = currentEntryState.images.filter((image) => image.id !== imageId);
  persistCurrentEntry();
  renderImageGallery(currentEntryState.images);
}

function handleToolbarButtonClick(event) {
  if (!currentEntryKey || !currentEntryState || !editorSurface) {
    return;
  }

  const command = event.currentTarget?.dataset?.command;
  if (!command) {
    return;
  }

  event.preventDefault();
  editorSurface.focus();

  if (command === 'createLink') {
    const url = window.prompt('Bağlantı adresini girin:');
    if (!url) {
      return;
    }
    document.execCommand('createLink', false, url);
    return;
  }

  document.execCommand(command, false);
}

function openEntryPanel(entry) {
  if (!panelLabelNode || !panelInstanceNode || !editorSurface) {
    return;
  }

  panelLabelNode.textContent = entry.label;
  panelInstanceNode.textContent = entry.instanceLabel;
  currentEntryKey = entry.id;
  currentEntryState = cloneEntryState(currentEntryKey);
  setEditorEnabled(true);

  if (panelMeIdNode) {
    panelMeIdNode.textContent = currentEntryState.meId || 'Henüz oluşturulmadı';
  }

  const content = currentEntryState.content || '';
  editorSurface.innerHTML = content;
  renderImageGallery(currentEntryState.images);
  scheduleStatusReset(null);
  updatePanelStatus(DEFAULT_SELECTION_MESSAGE);
  editorSurface.focus();
}

function handleSaveEntry() {
  if (!currentEntryKey || !currentEntryState || !editorSurface) {
    return;
  }

  const sanitizedContent = sanitizeEditorHtml(editorSurface.innerHTML);
  editorSurface.innerHTML = sanitizedContent;
  currentEntryState.content = sanitizedContent;

  if (!currentEntryState.meId) {
    currentEntryState.meId = generateMeId();
  }

  persistCurrentEntry();

  if (panelMeIdNode) {
    panelMeIdNode.textContent = currentEntryState.meId;
  }

  updatePanelStatus(`Değişiklikler kaydedildi. ME ID: ${currentEntryState.meId}`);
  scheduleStatusReset(currentEntryKey);
}

setEditorEnabled(false);

toolbarButtons.forEach((button) => {
  button.addEventListener('click', handleToolbarButtonClick);
});

if (saveButton) {
  saveButton.addEventListener('click', handleSaveEntry);
}

if (imageInput) {
  imageInput.addEventListener('change', handleImageUpload);
}

if (galleryList) {
  galleryList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.classList.contains('gallery__remove')) {
      const imageId = target.dataset.imageId;
      removeImageFromEntry(imageId);
    }
  });
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

  const [lat, lon] = coordinates;
  if (
    lat < TURKIYE_BOUNDS[0][0] ||
    lat > TURKIYE_BOUNDS[1][0] ||
    lon < TURKIYE_BOUNDS[0][1] ||
    lon > TURKIYE_BOUNDS[1][1]
  ) {
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
      <button type="button" class="popup-content__button js-open-entry">Envanteri düzenle</button>
    </div>
  `;

  marker.bindPopup(popupContent);

  marker.on('popupopen', () => {
    openEntryPanel(entry);

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
      openEntryPanel(entry);
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
