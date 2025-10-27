const STORAGE_KEY = "tmh.entries";
const DEFAULT_VIEW = { lat: 39.0, lng: 35.0, zoom: 6 };

const entriesCache = new Map();

const entriesStore = (() => {
  let cache = Object.create(null);
  const hasLocalStorage = typeof window !== "undefined" && !!window.localStorage;

  const load = () => {
    if (!hasLocalStorage) {
      return Object.create(null);
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.create(null);
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      console.warn("Yerel kayıt yüklenirken hata oluştu", error);
    }
    return Object.create(null);
  };

  const persist = () => {
    if (!hasLocalStorage) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn("Yerel kayıt kaydedilemedi", error);
    }
  };

  cache = load();

  const getOrCreate = (id) => {
    if (!cache[id]) {
      cache[id] = { notes: "", gallery: [], updatedAt: null };
    }
    return cache[id];
  };

  return {
    refresh() {
      cache = load();
      return cache;
    },
    get(id) {
      return cache[id] ?? null;
    },
    getOrCreate,
    upsert(id, value) {
      const next = {
        ...getOrCreate(id),
        ...value,
        updatedAt: new Date().toISOString(),
      };
      cache[id] = next;
      persist();
      return next;
    },
    removeImage(id, index) {
      const current = getOrCreate(id);
      current.gallery.splice(index, 1);
      persist();
      return current;
    },
    addImage(id, url) {
      if (!url) return getOrCreate(id);
      const current = getOrCreate(id);
      current.gallery.push({ url, addedAt: new Date().toISOString() });
      persist();
      return current;
    },
  };
})();

const toast = document.getElementById("toast");
let toastTimer = null;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

const map = L.map("map", {
  zoomControl: true,
}).setView([DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], DEFAULT_VIEW.zoom);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

const markersLayer = L.layerGroup().addTo(map);

const loadButton = document.getElementById("loadButton");
const provinceInput = document.getElementById("provinceInput");
const districtInput = document.getElementById("districtInput");
const editorPanel = document.getElementById("editorPanel");
const editorTitle = document.getElementById("editorTitle");
const editorNotes = document.getElementById("editorNotes");
const editorGallery = document.getElementById("editorGallery");
const editorImageUrl = document.getElementById("editorImageUrl");
const closeEditorBtn = document.getElementById("closeEditor");
const addImageBtn = document.getElementById("addImage");
const saveEntryBtn = document.getElementById("saveEntry");

let currentEditingId = null;

loadButton?.addEventListener("click", async () => {
  await loadCemeteries();
});

closeEditorBtn?.addEventListener("click", () => {
  setEditorVisibility(false);
});

addImageBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  if (!currentEditingId) return;
  const url = editorImageUrl.value.trim();
  if (!url) {
    showToast("Lütfen geçerli bir URL girin.");
    return;
  }
  entriesStore.addImage(currentEditingId, url);
  editorImageUrl.value = "";
  renderEditorGallery(entriesStore.get(currentEditingId));
  updateMarkerPopup(currentEditingId);
  showToast("Görsel eklendi.");
});

saveEntryBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  if (!currentEditingId) return;
  entriesStore.upsert(currentEditingId, {
    notes: editorNotes.value,
  });
  updateMarkerPopup(currentEditingId);
  showToast("Yerel kayıt güncellendi.");
});

async function loadCemeteries() {
  const provinceQid = provinceInput?.value.trim();
  const districtQid = districtInput?.value.trim();

  markersLayer.clearLayers();
  entriesCache.clear();

  try {
    const entries = await fetchCemeteryEntries({ provinceQid, districtQid });
    if (entries.length === 0) {
      showToast("Sonuç bulunamadı.");
    }
    entries.forEach((entry) => {
      entriesCache.set(entry.id, entry);
      addMarker(entry);
    });
    if (entries.length > 0) {
      const { lat, lng } = entries[0];
      map.flyTo([lat, lng], 9, { animate: true, duration: 1.2 });
    }
  } catch (error) {
    console.error(error);
    showToast("Veriler alınırken hata oluştu.");
  }
}

async function fetchCemeteryEntries({ provinceQid, districtQid }) {
  const query = buildSparqlQuery({ provinceQid, districtQid });
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(
    query
  )}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/sparql-results+json",
    },
  });

  if (!response.ok) {
    throw new Error(`SPARQL isteği başarısız: ${response.status}`);
  }

  const data = await response.json();
  return data.results.bindings.map(createEntryFromBinding).filter(Boolean);
}

function buildSparqlQuery({ provinceQid, districtQid }) {
  const filters = [];
  if (provinceQid) {
    filters.push(`?item wdt:P131*/wdt:P131* wd:${provinceQid}.`);
  }
  if (districtQid) {
    filters.push(`?item wdt:P131*/wdt:P131* wd:${districtQid}.`);
  }
  const filterText = filters.length > 0 ? filters.join("\n      ") + "\n      " : "";

  return `
    SELECT ?item ?itemLabel ?itemDescription ?coordinate_location
           (SAMPLE(?keIdRaw) AS ?keId)
           (SAMPLE(?provinceLabel) AS ?provinceLabel)
           (SAMPLE(?districtLabel) AS ?districtLabel)
    WHERE {
      ?item wdt:P31/wdt:P279* wd:Q39614;
            wdt:P625 ?coordinate_location.
      OPTIONAL {
        ?item ?keProp ?keIdRaw.
        ?keProperty wikibase:directClaim ?keProp;
                    rdfs:label ?kePropLabel.
        FILTER(LANG(?kePropLabel) IN ("tr", "en"))
        FILTER(REGEX(LCASE(STR(?kePropLabel)), "k(ü|u)lt(ü|u)r envanteri"))
      }
      OPTIONAL {
        ?item wdt:P131 ?districtEntity.
        ?districtEntity wdt:P31/wdt:P279* wd:Q104128.
        BIND(?districtEntity AS ?district)
        OPTIONAL {
          ?districtEntity wdt:P131 ?provinceViaDistrict.
          ?provinceViaDistrict wdt:P31/wdt:P279* wd:Q48349.
          BIND(?provinceViaDistrict AS ?provinceFromDistrict)
        }
      }
      OPTIONAL {
        ?item wdt:P131 ?provinceEntityDirect.
        ?provinceEntityDirect wdt:P31/wdt:P279* wd:Q48349.
        BIND(?provinceEntityDirect AS ?provinceDirect)
      }
      BIND(COALESCE(?provinceFromDistrict, ?provinceDirect) AS ?province)
      ${filterText}SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
    }
    GROUP BY ?item ?itemLabel ?itemDescription ?coordinate_location
  `;
}

function createEntryFromBinding(binding) {
  try {
    const coordinate = binding.coordinate_location?.value;
    if (!coordinate) return null;

    const matches = coordinate.match(/Point\\(([-0-9.]+) ([-0-9.]+)\\)/);
    if (!matches) return null;

    const lng = parseFloat(matches[1]);
    const lat = parseFloat(matches[2]);
    const wikidataIri = binding.item.value;
    const wikidataId = wikidataIri.split("/").pop();

    return {
      id: wikidataId,
      wikidataId,
      iri: wikidataIri,
      label: binding.itemLabel?.value ?? wikidataId,
      description: binding.itemDescription?.value ?? "",
      lat,
      lng,
      keId: binding.keId?.value ?? null,
      province: binding.provinceLabel?.value ?? null,
      district: binding.districtLabel?.value ?? null,
    };
  } catch (error) {
    console.error("Bağlı veriden giriş oluşturulamadı", error);
    return null;
  }
}

function addMarker(entry) {
  const marker = L.circleMarker([entry.lat, entry.lng], {
    radius: 6,
    color: "#005a8d",
    weight: 2,
    fillColor: "#0ea5e9",
    fillOpacity: 0.8,
  });

  marker.entryId = entry.id;
  marker.bindPopup(buildPopupContent(entry, entriesStore.get(entry.id)), {
    maxWidth: 320,
  });

  marker.on("popupopen", async () => {
    await refreshEntry(entry.id, marker);
  });

  marker.addTo(markersLayer);
}

function buildPopupContent(entry, stored) {
  const trimmed = stored?.notes?.trim();
  const notesPreview = trimmed
    ? trimmed.slice(0, 220) + (trimmed.length > 220 ? "…" : "")
    : null;
  const gallery = stored?.gallery ?? [];

  const wikiLink = entry.wikidataId
    ? `<a href="https://www.wikidata.org/wiki/${entry.wikidataId}" target="_blank" rel="noopener">${entry.wikidataId}</a>`
    : "-";
  const keLink = entry.keId
    ? `<a href="https://kulturenvanteri.gov.tr/portal/?id=${encodeURIComponent(entry.keId)}" target="_blank" rel="noopener">${escapeHtml(entry.keId)}</a>`
    : "-";

  const galleryHtml =
    gallery.length > 0
      ? `<div class="popup-gallery">${gallery
          .slice(0, 4)
          .map((item, index) => {
            const safeUrl = escapeHtml(item.url);
            const alt = escapeHtml(`${entry.label} görsel ${index + 1}`);
            return `<img src="${safeUrl}" alt="${alt}" />`;
          })
          .join("\n")}</div>`
      : "";

  const notesHtml = notesPreview
    ? `<p class="popup-notes">${escapeHtml(notesPreview)}</p>`
    : "<p class="popup-notes muted">Yerel not eklenmedi.</p>";

  return `
    <div>
      <h3>${escapeHtml(entry.label)}</h3>
      ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ""}
      <div class="popup-meta">
        <span><strong>Wikidata:</strong> ${wikiLink}</span>
        <span><strong>KE ID:</strong> ${keLink}</span>
        <span><strong>İl:</strong> ${escapeHtml(entry.province ?? "-")}</span>
        <span><strong>İlçe:</strong> ${escapeHtml(entry.district ?? "-")}</span>
      </div>
      ${notesHtml}
      ${galleryHtml}
      <div class="popup-links">
        <a href="#" data-action="edit" data-entry="${entry.id}">Düzenle</a>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setEditorVisibility(visible) {
  if (!editorPanel) return;
  editorPanel.classList.toggle("active", visible);
  editorPanel.setAttribute("aria-hidden", (!visible).toString());
}

function populateEditor(entry, stored) {
  currentEditingId = entry.id;
  editorTitle.textContent = entry.label;
  editorNotes.value = stored?.notes ?? "";
  renderEditorGallery(stored);
}

function renderEditorGallery(stored) {
  editorGallery.innerHTML = "";
  const gallery = stored?.gallery ?? [];
  if (gallery.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Henüz görsel eklenmedi.";
    editorGallery.appendChild(empty);
    return;
  }

  gallery.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "gallery-item";

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = `Görsel ${index + 1}`;

    const span = document.createElement("span");
    span.textContent = item.url;

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.index = String(index);
    button.setAttribute("aria-label", "Görseli kaldır");
    button.textContent = "✖";
    button.onclick = () => {
      if (!currentEditingId) return;
      entriesStore.removeImage(currentEditingId, index);
      renderEditorGallery(entriesStore.get(currentEditingId));
      updateMarkerPopup(currentEditingId);
    };

    wrapper.append(img, span, button);
    editorGallery.appendChild(wrapper);
  });
}

async function refreshEntry(entryId, marker) {
  entriesStore.refresh();
  const stored = entriesStore.get(entryId);
  let entry = entriesCache.get(entryId);
  if (!entry) return;

  const wikidata = await fetchWikidataSnapshot(entryId);
  if (wikidata) {
    entry = {
      ...entry,
      label: wikidata.label ?? entry.label,
      description: wikidata.description ?? entry.description,
    };
    entriesCache.set(entryId, entry);
  }

  marker.setPopupContent(buildPopupContent(entry, stored));

  const popupContainer = marker.getPopup()?.getElement();
  if (popupContainer) {
    const editLink = popupContainer.querySelector('[data-action="edit"]');
    if (editLink) {
      editLink.onclick = (event) => {
        event.preventDefault();
        openEditor(entryId);
      };
    }
  }

  if (currentEditingId === entryId && editorPanel?.classList.contains("active")) {
    populateEditor(entry, stored);
  }
}

function updateMarkerPopup(entryId) {
  markersLayer.eachLayer((layer) => {
    if (layer instanceof L.CircleMarker) {
      if (layer.entryId !== entryId) return;
      const entry = entriesCache.get(entryId);
      if (!entry) return;
      const stored = entriesStore.get(entryId);
      const popup = layer.getPopup();
      if (!popup) return;
      popup.setContent(buildPopupContent(entry, stored));
      if (popup.isOpen()) {
        const container = popup.getElement();
        const editLink = container?.querySelector('[data-action="edit"]');
        if (editLink) {
          editLink.onclick = (event) => {
            event.preventDefault();
            openEditor(entryId);
          };
        }
      }
    }
  });
}

async function fetchWikidataSnapshot(id) {
  try {
    const response = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(id)}.json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const entity = data.entities?.[id];
    if (!entity) return null;

    const label =
      entity.labels?.tr?.value || entity.labels?.en?.value || entity.labels?.[Object.keys(entity.labels)[0]]?.value;
    const description =
      entity.descriptions?.tr?.value ||
      entity.descriptions?.en?.value ||
      (entity.descriptions && entity.descriptions[Object.keys(entity.descriptions)[0]]?.value) ||
      "";
    return { label, description };
  } catch (error) {
    console.warn("Wikidata verisi yenilenemedi", error);
    return null;
  }
}

function openEditor(entryId) {
  const entry = entriesCache.get(entryId);
  if (!entry) return;
  const stored = entriesStore.getOrCreate(entryId);
  populateEditor(entry, stored);
  setEditorVisibility(true);
}

window.openEditor = openEditor;

map.on("popupopen", (event) => {
  const popupEl = event.popup.getElement();
  if (!popupEl) return;
  const editLink = popupEl.querySelector('[data-action="edit"]');
  const entryId = editLink?.dataset.entry;
  if (!entryId) return;
  editLink.onclick = (ev) => {
    ev.preventDefault();
    openEditor(entryId);
  };
});

// Başlangıç verisini yükle
loadCemeteries();
