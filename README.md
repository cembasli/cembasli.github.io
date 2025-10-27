<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Türkiye Mezarlıkları Haritası</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>

  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      margin: 0;
      background: #f1f5f9;
    }

    header {
      background: #004466;
      color: white;
      padding: 20px;
      text-align: center;
    }

    #map {
      height: 75vh;
      width: 100%;
    }

    .control-panel {
      background: white;
      padding: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      border-radius: 8px;
      width: 90%;
      max-width: 1000px;
      margin: 20px auto;
    }

    select, button {
      padding: 10px;
      font-size: 16px;
      border-radius: 6px;
      border: 1px solid #ccc;
    }

    button {
      background: #006699;
      color: white;
      cursor: pointer;
      border: none;
    }

    button:hover {
      background: #004466;
    }

    /* Mezarlık Detay Paneli */
    #entryPanel {
      position: fixed;
      top: 0;
      right: -450px;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -5px 0 15px rgba(0,0,0,0.2);
      padding: 20px;
      overflow-y: auto;
      transition: right 0.4s ease;
      z-index: 1000;
    }

    #entryPanel.active {
      right: 0;
    }

    #entryPanel h3 {
      margin-top: 0;
      color: #004466;
    }

    .entry-item {
      margin: 15px 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }

    .entry-item img {
      width: 100%;
      border-radius: 5px;
      margin-top: 5px;
    }

    #closePanel {
      background: none;
      border: none;
      color: #666;
      float: right;
      font-size: 18px;
      cursor: pointer;
    }

    #addEntry {
      background: #008000;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      margin-top: 15px;
    }

    .entry-form {
      display: none;
      margin-top: 15px;
    }

    .entry-form input, .entry-form textarea, .entry-form select {
      width: 100%;
      padding: 8px;
      margin: 5px 0;
      border-radius: 5px;
      border: 1px solid #ccc;
    }

    .entry-form button {
      background: #004466;
      color: white;
      padding: 10px;
      width: 100%;
      border: none;
      border-radius: 6px;
      margin-top: 10px;
      cursor: pointer;
    }
  </style>
</head>
<body>

<header>
  <h1>🪦 Türkiye Mezarlıkları Haritası</h1>
  <p>Wikidata’daki "cemetery" ve "graveyard" öğelerini görüntüler.</p>
</header>

<div class="control-panel">
  <label for="provinceSelect">İl seçiniz: </label>
  <select id="provinceSelect">
    <option value="">Seçiniz...</option>
    <option value="Q534799">İstanbul</option>
    <option value="Q2297724">Ankara</option>
    <option value="Q344490">İzmir</option>
    <option value="Q83102">Edirne</option>
    <option value="Q131597">Kırklareli</option>
    <option value="Q47813">Çanakkale</option>
  </select>
  <button onclick="loadCemeteries()">📍 Haritada Göster</button>
</div>

<div id="map"></div>

<!-- Sağ panel -->
<div id="entryPanel">
  <button id="closePanel">✖</button>
  <h3 id="cemeteryName">Mezarlık Bilgileri</h3>
  <div id="entryList"></div>

  <button id="addEntry">Yeni Bilgi Ekle</button>

  <div class="entry-form" id="entryForm">
    <h4>Yeni Entry</h4>
    <input type="text" id="entryType" placeholder="Tür (ör. Osmanlı, Rum Ortodoks)">
    <input type="text" id="entryDate" placeholder="Tarih (ör. 19. yy)">
    <input type="text" id="entryCulture" placeholder="Kültür (ör. Müslüman, Ermeni)">
    <input type="url" id="entryImage" placeholder="Görsel URL’si">
    <textarea id="entryText" placeholder="Açıklama veya kitabe bilgisi"></textarea>
    <button onclick="saveEntry()">Kaydet</button>
  </div>
</div>

<script>
  let map = L.map('map').setView([39, 35], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  let markers = L.layerGroup().addTo(map);
  let currentCemetery = null;
  let entries = {}; // {QID: [entryObj,...]}

  async function loadCemeteries() {
    const province = document.getElementById('provinceSelect').value;
    if (!province) return alert('Bir il seçiniz.');

    markers.clearLayers();
    const query = `
    SELECT DISTINCT ?cemetery ?cemeteryLabel ?coord ?typeLabel WHERE {
      ?cemetery wdt:P31 ?type;
                wdt:P131*/wdt:P131* wd:${province};
                wdt:P625 ?coord.
      VALUES ?type { wd:Q39614 wd:Q1107656 } # cemetery, graveyard
      SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
    }`;

    const url = "https://query.wikidata.org/sparql?query=" + encodeURIComponent(query) + "&format=json";
    const res = await fetch(url);
    const data = await res.json();

    data.results.bindings.forEach(d => {
      const coord = d.coord.value.match(/Point\\(([^ ]+) ([^ ]+)\\)/);
      const lng = parseFloat(coord[1]);
      const lat = parseFloat(coord[2]);
      const label = d.cemeteryLabel.value;
      const qid = d.cemetery.value.split('/').pop();

      const marker = L.circleMarker([lat, lng], {
        color: "#004466", fillColor: "#006699", fillOpacity: 0.8, radius: 6
      }).addTo(markers);

      marker.bindPopup(`<b>${label}</b><br><a href="#" onclick="openPanel('${qid}','${label}')">Detayları Gör</a>`);
    });
  }

  function openPanel(qid, label) {
    currentCemetery = qid;
    document.getElementById('cemeteryName').textContent = label;
    const panel = document.getElementById('entryPanel');
    panel.classList.add('active');
    renderEntries();
  }

  document.getElementById('closePanel').onclick = () => {
    document.getElementById('entryPanel').classList.remove('active');
  };

  document.getElementById('addEntry').onclick = () => {
    document.getElementById('entryForm').style.display = 'block';
  };

  function saveEntry() {
    const type = document.getElementById('entryType').value;
    const date = document.getElementById('entryDate').value;
    const culture = document.getElementById('entryCulture').value;
    const image = document.getElementById('entryImage').value;
    const text = document.getElementById('entryText').value;

    if (!entries[currentCemetery]) entries[currentCemetery] = [];
    entries[currentCemetery].push({ type, date, culture, image, text });

    document.getElementById('entryForm').reset();
    document.getElementById('entryForm').style.display = 'none';
    renderEntries();
  }

  function renderEntries() {
    const list = document.getElementById('entryList');
    list.innerHTML = '';

    const cemEntries = entries[currentCemetery] || [];
    if (cemEntries.length === 0) {
      list.innerHTML = "<p>Henüz entry eklenmedi.</p>";
      return;
    }

    cemEntries.forEach(e => {
      const div = document.createElement('div');
      div.className = 'entry-item';
      div.innerHTML = `
        <p><b>Tür:</b> ${e.type || '-'}<br>
        <b>Tarih:</b> ${e.date || '-'}<br>
        <b>Kültür:</b> ${e.culture || '-'}</p>
        ${e.image ? `<img src="${e.image}" alt="Görsel">` : ''}
        <p>${e.text || ''}</p>
      `;
      list.appendChild(div);
    });
  }
</script>
</body>
</html>
