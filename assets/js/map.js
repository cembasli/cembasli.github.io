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
const panelCountNode = document.getElementById('cemetery-count');

const STORAGE_KEY = 'me-inventory-entries';
const COUNTER_KEY = 'me-inventory-counter';
const DEFAULT_SELECTION_MESSAGE = 'Envanter notlarını düzenleyebilirsiniz.';
const COUNT_LOADING_TEXT = 'Toplam mezarlık: yükleniyor…';
const COUNT_ERROR_TEXT = 'Toplam mezarlık: yüklenemedi.';
const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

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

function updateCemeteryCount(count) {
  if (!panelCountNode) {
    return;
  }

  if (count === null) {
    panelCountNode.textContent = COUNT_LOADING_TEXT;
    return;
  }

  if (typeof count === 'number' && Number.isFinite(count)) {
    panelCountNode.textContent = `Toplam mezarlık: ${count.toLocaleString('tr-TR')}`;
    return;
  }

  panelCountNode.textContent = COUNT_ERROR_TEXT;
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

function parseWktCoordinates(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const match = value.match(/Point\(([-\d.]+)\s+([\-\d.]+)\)/);
  if (!match) {
    return null;
  }

  const longitude = Number.parseFloat(match[1]);
  const latitude = Number.parseFloat(match[2]);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return [latitude, longitude];
}

function createEntryFromBinding(binding) {
  if (!binding) {
    return null;
  }

  const coordinates = parseWktCoordinates(binding.coord?.value);
  if (!coordinates) {
    return null;
  }

  const itemValue = binding.item?.value;
  if (!itemValue) {
    return null;
  }

  const itemMatch = itemValue.match(/Q\d+$/);
  const itemId = itemMatch ? itemMatch[0] : itemValue;
  const label = binding.itemLabel?.value?.trim() || 'İsimsiz mezarlık';

  return {
    id: itemId,
    label,
    instanceLabel: 'Mezarlık',
    coordinates,
  };
}

function addMarker(entry) {
  const marker = L.circleMarker(entry.coordinates, {
    radius: 7,
    fillColor: '#2563eb',
    color: '#0f172a',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9,
  });

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
  updateCemeteryCount(null);

  const sparqlQuery = `# Türkiye sınırları içinde koordinatlı mezarlıklar (tümülüsler hariç)
SELECT ?item ?itemLabel ?coord WHERE {
  ?item wdt:P31/wdt:P279* wd:Q39614.
  ?item wdt:P17 wd:Q43.
  ?item wdt:P625 ?coord.
  FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q34023. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
}
ORDER BY ?itemLabel
LIMIT 1000`;

  const url = `${WIKIDATA_ENDPOINT}?format=json&query=${encodeURIComponent(sparqlQuery)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Wikidata Query Service ${response.status}`);
    }

    const data = await response.json();
    const bindings = Array.isArray(data?.results?.bindings)
      ? data.results.bindings
      : [];
    const entries = bindings
      .map((binding) => createEntryFromBinding(binding))
      .filter((entry) => entry !== null);

    if (entries.length === 0) {
      updatePanelStatus('Türkiye sınırları içinde mezarlık bulunamadı.');
      updateCemeteryCount(0);
      return;
    }

    entries.forEach((entry) => addMarker(entry));
    updatePanelStatus('Haritadan bir mezarlık seçin.');
    updateCemeteryCount(entries.length);
  } catch (error) {
    console.error('Mezarlıklar yüklenirken bir hata oluştu:', error);
    updatePanelStatus('Mezarlıklar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    updateCemeteryCount(undefined);
  }
}

loadCemeteries();
