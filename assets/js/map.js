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
const panelDateNode = document.getElementById('panel-date');
const panelMeIdNode = document.getElementById('panel-me-id');
const editorContainer = document.getElementById('entry-editor-container');
const editorSurface = document.getElementById('entry-editor');
const editorDisplay = document.getElementById('entry-display');
const editButton = document.getElementById('edit-entry');
const saveButton = document.getElementById('save-entry');
const imageInput = document.getElementById('image-input');
const galleryList = document.getElementById('image-gallery');
const galleryEmptyMessage = document.getElementById('gallery-empty');
const toolbarButtons = Array.from(document.querySelectorAll('.toolbar-button'));
const toolbarUpload = document.querySelector('.toolbar-upload');
const panelCountNode = document.getElementById('cemetery-count');

const STORAGE_KEY = 'me-inventory-entries';
const ME_ID_ASSIGNMENTS_KEY = 'me-inventory-id-map';
const ME_ID_SEQUENCE_KEY = 'me-inventory-id-sequence';
const DEFAULT_SELECTION_MESSAGE =
  'Kaydedilmiş envanteri görüntülüyor ve "Düzenle" ile güncelleyebilirsiniz.';
const COUNT_LOADING_TEXT = 'Toplam hazire: yükleniyor…';
const COUNT_ERROR_TEXT = 'Toplam hazire: yüklenemedi.';
const DATE_UNKNOWN_TEXT = 'Bilgi bulunamadı';
const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';

let entriesStore = loadEntriesFromStorage();
let meIdAssignments = loadMeIdAssignments();
let nextMeSequence = loadNextMeSequence();
let currentEntryKey = null;
let currentEntryState = null;
let statusResetHandle = null;
let isEditing = false;

syncSequenceWithAssignments();

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
    panelCountNode.textContent = `Toplam hazire: ${count.toLocaleString('tr-TR')}`;
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
    console.warn('Kayıtlı hazire verileri okunamadı:', error);
  }

  return {};
}

function saveEntriesToStorage(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('Hazire verileri kaydedilemedi:', error);
  }
}

function loadMeIdAssignments() {
  try {
    const raw = localStorage.getItem(ME_ID_ASSIGNMENTS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('ME ID eşleştirmeleri okunamadı:', error);
  }

  return {};
}

function saveMeIdAssignments(value) {
  try {
    localStorage.setItem(ME_ID_ASSIGNMENTS_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('ME ID eşleştirmeleri kaydedilemedi:', error);
  }
}

function loadNextMeSequence() {
  const storedValue = localStorage.getItem(ME_ID_SEQUENCE_KEY);
  if (!storedValue) {
    return 0;
  }

  const parsed = Number.parseInt(storedValue, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function saveNextMeSequence(value) {
  try {
    localStorage.setItem(ME_ID_SEQUENCE_KEY, String(value));
  } catch (error) {
    console.warn('ME ID sırası kaydedilemedi:', error);
  }
}

function indexToLetters(index) {
  if (index <= 0) {
    return 'A';
  }

  let value = index;
  let result = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function assignNextMeId() {
  nextMeSequence += 1;
  saveNextMeSequence(nextMeSequence);
  const letters = indexToLetters(nextMeSequence);
  const paddedNumber = String(nextMeSequence).padStart(4, '0');
  return `ME-${letters}${paddedNumber}`;
}

function ensureEntryMeId(entryId) {
  if (!entryId) {
    return null;
  }

  const storedEntry = entriesStore[entryId];
  if (storedEntry && storedEntry.meId) {
    meIdAssignments[entryId] = storedEntry.meId;
    saveMeIdAssignments(meIdAssignments);
    return storedEntry.meId;
  }

  const assigned = meIdAssignments[entryId];
  if (assigned) {
    return assigned;
  }

  const newMeId = assignNextMeId();
  meIdAssignments[entryId] = newMeId;
  saveMeIdAssignments(meIdAssignments);
  return newMeId;
}

function syncSequenceWithAssignments() {
  if (!meIdAssignments || typeof meIdAssignments !== 'object') {
    return;
  }

  const values = Object.values(meIdAssignments);
  let maxSequence = nextMeSequence;

  values.forEach((value) => {
    if (typeof value !== 'string') {
      return;
    }

    const match = value.match(/ME-[A-Z]+(\d+)/i);
    if (!match) {
      return;
    }

    const numericPart = Number.parseInt(match[1], 10);
    if (!Number.isNaN(numericPart) && numericPart > maxSequence) {
      maxSequence = numericPart;
    }
  });

  if (maxSequence > nextMeSequence) {
    nextMeSequence = maxSequence;
    saveNextMeSequence(nextMeSequence);
  }
}

function cloneEntryState(entryKey) {
  const stored = entriesStore[entryKey];

  if (!stored) {
    return { meId: null, content: '', images: [] };
  }

  const images = Array.isArray(stored.images)
    ? stored.images
        .filter((image) => image && typeof image === 'object')
        .map((image) => ({
          id: image.id,
          name: image.name,
          dataUrl: image.dataUrl,
          caption: image.caption || '',
          storedName: image.storedName || null,
        }))
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

  if (currentEntryState.meId) {
    meIdAssignments[currentEntryKey] = currentEntryState.meId;
    saveMeIdAssignments(meIdAssignments);
  }
}

function setEditorEnabled(enabled) {
  if (!editorContainer || !editorSurface || !saveButton || !editorDisplay) {
    return;
  }

  editorContainer.setAttribute('aria-disabled', enabled ? 'false' : 'true');

  if (!enabled) {
    editorContainer.classList.remove('is-editing');
    editorSurface.setAttribute('contenteditable', 'false');
    editorSurface.setAttribute('aria-disabled', 'true');
    editorSurface.innerHTML = '';
    editorDisplay.textContent = 'Henüz bir hazire seçilmedi.';
    saveButton.disabled = true;
    if (editButton) {
      editButton.disabled = true;
    }
    toolbarButtons.forEach((button) => {
      button.disabled = true;
    });
    if (toolbarUpload) {
      toolbarUpload.setAttribute('aria-disabled', 'true');
    }
    if (imageInput) {
      imageInput.disabled = true;
      imageInput.value = '';
    }
    if (panelLabelNode) {
      panelLabelNode.textContent = 'Haritadan bir hazire seçin';
    }
    if (panelInstanceNode) {
      panelInstanceNode.textContent = '—';
    }
    if (panelMeIdNode) {
      panelMeIdNode.textContent = 'Henüz oluşturulmadı';
    }
    if (panelDateNode) {
      panelDateNode.textContent = '—';
    }
    renderImageGallery([]);
    isEditing = false;
    return;
  }

  editorSurface.setAttribute('aria-disabled', 'true');
  editorSurface.setAttribute('contenteditable', 'false');
  editorContainer.classList.remove('is-editing');
  saveButton.disabled = true;
  if (editButton) {
    editButton.disabled = false;
  }
  toolbarButtons.forEach((button) => {
    button.disabled = true;
  });
  if (toolbarUpload) {
    toolbarUpload.setAttribute('aria-disabled', 'true');
  }
  if (imageInput) {
    imageInput.disabled = true;
  }
  isEditing = false;
}

function setEditingMode(enabled) {
  if (!editorContainer || !editorSurface || !saveButton) {
    return;
  }

  isEditing = enabled;

  if (enabled) {
    editorContainer.classList.add('is-editing');
    editorSurface.setAttribute('contenteditable', 'true');
    editorSurface.setAttribute('aria-disabled', 'false');
    saveButton.disabled = false;
    if (editButton) {
      editButton.disabled = true;
    }
    toolbarButtons.forEach((button) => {
      button.disabled = false;
    });
    if (toolbarUpload) {
      toolbarUpload.setAttribute('aria-disabled', 'false');
    }
    if (imageInput) {
      imageInput.disabled = false;
    }
    editorSurface.focus();
    if (currentEntryState) {
      renderImageGallery(currentEntryState.images);
    }
    return;
  }

  editorContainer.classList.remove('is-editing');
  editorSurface.setAttribute('contenteditable', 'false');
  editorSurface.setAttribute('aria-disabled', 'true');
  saveButton.disabled = true;
  if (editButton) {
    editButton.disabled = false;
  }
  toolbarButtons.forEach((button) => {
    button.disabled = true;
  });
  if (toolbarUpload) {
    toolbarUpload.setAttribute('aria-disabled', 'true');
  }
  if (imageInput) {
    imageInput.disabled = true;
    imageInput.value = '';
  }
  if (currentEntryState) {
    renderImageGallery(currentEntryState.images);
  }
}

function renderEntryDisplay(content) {
  if (!editorDisplay) {
    return;
  }

  if (content && content.trim().length > 0) {
    editorDisplay.innerHTML = content;
    return;
  }

  editorDisplay.innerHTML = '<p class="editor__placeholder">Henüz not eklenmedi.</p>';
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
    img.alt = image.name ? `Hazire görseli: ${image.name}` : 'Hazire görseli';
    item.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'gallery__meta';

    const filename = document.createElement('p');
    filename.className = 'gallery__filename';
    filename.textContent = image.storedName || image.name || 'Hazire görseli';
    meta.appendChild(filename);

    const caption = document.createElement('p');
    caption.className = 'gallery__caption';
    if (image.caption && image.caption.trim().length > 0) {
      caption.textContent = image.caption;
    } else {
      caption.textContent = 'Altyazı eklenmedi.';
      caption.classList.add('gallery__caption--empty');
    }
    meta.appendChild(caption);

    const actions = document.createElement('div');
    actions.className = 'gallery__actions';

    const captionButton = document.createElement('button');
    captionButton.type = 'button';
    captionButton.className = 'gallery__caption-button';
    captionButton.dataset.imageId = image.id;
    captionButton.textContent = image.caption && image.caption.trim().length > 0 ? 'Altyazıyı düzenle' : 'Altyazı ekle';
    captionButton.disabled = !isEditing;
    actions.appendChild(captionButton);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'gallery__remove';
    removeButton.textContent = 'Sil';
    removeButton.dataset.imageId = image.id;
    removeButton.disabled = !isEditing;
    actions.appendChild(removeButton);

    meta.appendChild(actions);
    item.appendChild(meta);

    galleryList.appendChild(item);
  });
}

function createImageId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `img-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function sanitizeFileName(name) {
  if (!name) {
    return 'gorsel';
  }

  return (
    name
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'gorsel'
  );
}

function buildStoredImageName(meId, index, originalName) {
  const safeId = (meId || 'ME').replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  const safeIndex = String(index).padStart(3, '0');
  const safeName = sanitizeFileName(originalName);
  return `${safeId}_${safeIndex}_${safeName}`;
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
  if (!currentEntryKey || !currentEntryState || !isEditing) {
    if (imageInput) {
      imageInput.value = '';
    }
    return;
  }

  const files = Array.from(event.target.files || []);
  if (files.length === 0) {
    return;
  }

  const targetKey = currentEntryKey;
  const targetState = currentEntryState;

  if (!targetState.meId) {
    targetState.meId = ensureEntryMeId(targetKey) || assignNextMeId();
  }

  Promise.all(
    files.map((file) =>
      readFileAsDataUrl(file)
        .then((dataUrl) => ({ file, dataUrl }))
        .catch((error) => {
          console.warn('Bir görsel okunamadı:', error);
          return null;
        }),
    ),
  )
    .then((results) => {
      const additions = [];
      let nextIndex = targetState.images.length + 1;

      results.forEach((result) => {
        if (!result || !result.file) {
          return;
        }

        const storedName = buildStoredImageName(targetState.meId, nextIndex, result.file.name);
        additions.push({
          id: createImageId(),
          name: result.file.name,
          dataUrl: result.dataUrl,
          caption: '',
          storedName,
        });
        nextIndex += 1;
      });

      if (additions.length === 0) {
        if (imageInput) {
          imageInput.value = '';
        }
        return;
      }

      targetState.images = [...targetState.images, ...additions];
      entriesStore[targetKey] = {
        meId: targetState.meId,
        content: targetState.content,
        images: targetState.images,
      };
      saveEntriesToStorage(entriesStore);
      meIdAssignments[targetKey] = targetState.meId;
      saveMeIdAssignments(meIdAssignments);

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

  if (!isEditing) {
    if (currentEntryKey) {
      updatePanelStatus('Görselleri düzenlemek için önce "Düzenle" düğmesine basın.');
      scheduleStatusReset(currentEntryKey);
    }
    return;
  }

  currentEntryState.images = currentEntryState.images.filter((image) => image.id !== imageId);
  persistCurrentEntry();
  renderImageGallery(currentEntryState.images);

  if (currentEntryKey) {
    updatePanelStatus('Görsel kaldırıldı.');
    scheduleStatusReset(currentEntryKey);
  }
}

function updateImageCaption(imageId) {
  if (!currentEntryState || !imageId) {
    return;
  }

  if (!isEditing) {
    if (currentEntryKey) {
      updatePanelStatus('Görsel altyazısı için önce "Düzenle" düğmesine basın.');
      scheduleStatusReset(currentEntryKey);
    }
    return;
  }

  const targetImage = currentEntryState.images.find((image) => image.id === imageId);
  if (!targetImage) {
    return;
  }

  const newCaption = window.prompt('Görsel altyazısını girin:', targetImage.caption || '');
  if (newCaption === null) {
    return;
  }

  targetImage.caption = newCaption.trim();
  persistCurrentEntry();
  renderImageGallery(currentEntryState.images);

  if (currentEntryKey) {
    updatePanelStatus('Görsel altyazısı kaydedildi.');
    scheduleStatusReset(currentEntryKey);
  }
}

function handleToolbarButtonClick(event) {
  if (!currentEntryKey || !currentEntryState || !editorSurface || !isEditing) {
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
  if (!panelLabelNode || !panelInstanceNode || !editorSurface || !editorDisplay) {
    return;
  }

  panelLabelNode.textContent = entry.label;
  panelInstanceNode.textContent = entry.instanceLabel;
  if (panelDateNode) {
    panelDateNode.textContent = entry.inceptionDisplay || DATE_UNKNOWN_TEXT;
  }
  currentEntryKey = entry.id;
  currentEntryState = cloneEntryState(currentEntryKey);
  if (!currentEntryState.meId) {
    currentEntryState.meId = entry.meId || ensureEntryMeId(currentEntryKey);
  }
  if (currentEntryState.meId) {
    meIdAssignments[currentEntryKey] = currentEntryState.meId;
    saveMeIdAssignments(meIdAssignments);
    entriesStore[currentEntryKey] = {
      meId: currentEntryState.meId,
      content: currentEntryState.content,
      images: currentEntryState.images,
    };
    saveEntriesToStorage(entriesStore);
  }
  setEditorEnabled(true);
  setEditingMode(false);

  if (panelMeIdNode) {
    panelMeIdNode.textContent = currentEntryState.meId || 'Henüz oluşturulmadı';
  }

  const content = currentEntryState.content || '';
  editorSurface.innerHTML = content;
  renderEntryDisplay(content);
  renderImageGallery(currentEntryState.images);
  scheduleStatusReset(null);
  updatePanelStatus(DEFAULT_SELECTION_MESSAGE);
}

function handleSaveEntry() {
  if (!currentEntryKey || !currentEntryState || !editorSurface || !isEditing) {
    return;
  }

  const sanitizedContent = sanitizeEditorHtml(editorSurface.innerHTML);
  editorSurface.innerHTML = sanitizedContent;
  currentEntryState.content = sanitizedContent;

  if (!currentEntryState.meId) {
    currentEntryState.meId = ensureEntryMeId(currentEntryKey) || assignNextMeId();
  }

  persistCurrentEntry();

  if (panelMeIdNode) {
    panelMeIdNode.textContent = currentEntryState.meId;
  }

  renderEntryDisplay(currentEntryState.content);
  setEditingMode(false);

  updatePanelStatus(`Değişiklikler kaydedildi. ME ID: ${currentEntryState.meId}`);
  scheduleStatusReset(currentEntryKey);
}

function handleEditEntry() {
  if (!currentEntryKey || !currentEntryState || !editorSurface || isEditing) {
    return;
  }

  editorSurface.innerHTML = currentEntryState.content || '';
  setEditingMode(true);
  updatePanelStatus('Düzenleme moduna geçtiniz.');
  scheduleStatusReset(currentEntryKey);
}

setEditorEnabled(false);

toolbarButtons.forEach((button) => {
  button.addEventListener('click', handleToolbarButtonClick);
});

if (saveButton) {
  saveButton.addEventListener('click', handleSaveEntry);
}

if (editButton) {
  editButton.addEventListener('click', handleEditEntry);
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

    if (target.classList.contains('gallery__caption-button')) {
      const imageId = target.dataset.imageId;
      updateImageCaption(imageId);
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

function formatInceptionDate(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    try {
      return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(parsedDate);
    } catch (error) {
      console.warn('Inception date could not be formatted with locale:', error);
      return parsedDate.toISOString().split('T')[0];
    }
  }

  const yearMatch = value.match(/(-?\d{3,4})/);
  if (yearMatch) {
    return yearMatch[1];
  }

  return null;
}

function createEntryFromBinding(binding) {
  if (!binding) {
    return null;
  }

  const coordinates = parseWktCoordinates(binding.location?.value);
  if (!coordinates) {
    return null;
  }

  const itemValue = binding.item?.value;
  if (!itemValue) {
    return null;
  }

  const itemMatch = itemValue.match(/Q\d+$/);
  const itemId = itemMatch ? itemMatch[0] : itemValue;
  const label = binding.itemLabel?.value?.trim() || 'İsimsiz hazire';
  const inceptionRaw = binding.inception?.value || null;
  const inceptionDisplay = formatInceptionDate(inceptionRaw);

  return {
    id: itemId,
    label,
    instanceLabel: 'Hazire',
    inceptionRaw,
    inceptionDisplay,
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
  const escapedDate = escapeHtml(entry.inceptionDisplay || DATE_UNKNOWN_TEXT);
  const escapedMeId = escapeHtml(entry.meId || 'Henüz oluşturulmadı');

  const popupContent = `
    <div class="popup-content">
      <strong>${escapedLabel}</strong>
      <span>ME ID: ${escapedMeId}</span>
      <span>${escapedInstanceLabel}</span>
      <span>${escapedDate}</span>
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

async function loadHazires() {
  updatePanelStatus("Türkiye'deki hazireler yükleniyor…");
  updateCemeteryCount(null);

  const sparqlQuery = `# Türkiye’deki hazireleri listeler
SELECT ?item ?itemLabel ?location ?inception WHERE {
  ?item wdt:P31/wdt:P279* wd:Q6034438.
  ?item wdt:P17 wd:Q43.
  ?item wdt:P625 ?location.
  OPTIONAL { ?item wdt:P571 ?inception. }
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
      updatePanelStatus('Türkiye sınırları içinde hazire bulunamadı.');
      updateCemeteryCount(0);
      return;
    }

    entries.sort((a, b) => a.label.localeCompare(b.label, 'tr', { sensitivity: 'base' }));

    entries.forEach((entry) => {
      entry.meId = ensureEntryMeId(entry.id);
      addMarker(entry);
    });
    updatePanelStatus('Haritadan bir hazire seçin.');
    updateCemeteryCount(entries.length);
  } catch (error) {
    console.error('Hazireler yüklenirken bir hata oluştu:', error);
    updatePanelStatus('Hazireler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    updateCemeteryCount(undefined);
  }
}

loadHazires();
