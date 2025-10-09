Aşağıdaki dosya, OSM yerine **P11729 (Kulturenvanteri monument ID) var/yok** durumunu denetler. Mevcut görünüm ve akış korunmuştur. Yalnızca sorgular, istatistikler, efsane ve popup mantığı P11729’a göre düzenlendi.

```html
# cembasli.github.io

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wikidata Konumları Haritası</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-67Y2J3VKBJ"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-67Y2J3VKBJ');
    </script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #006699 0%, #004466 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .wikimedia-badge {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 10px;
            margin: 10px auto;
            display: inline-block;
            backdrop-filter: blur(10px);
        }

        .guide-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .guide-section h3 {
            color: #006699;
            margin-top: 0;
            font-size: 1.3em;
            border-bottom: 2px solid #f0f8ff;
            padding-bottom: 10px;
        }

        .guide-section p {
            line-height: 1.6;
            margin-bottom: 15px;
        }

        .step {
            background: #f8f9fa;
            border-left: 4px solid #006699;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 8px 8px 0;
        }

        .step h4 {
            color: #006699;
            margin: 0 0 10px 0;
            font-size: 1.1em;
        }

        .step ul {
            margin: 10px 0;
            padding-left: 20px;
        }

        .step li {
            margin: 8px 0;
            line-height: 1.5;
        }

        .property-code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #d73502;
        }
        
        .controls {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .filter-section {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .filter-grid {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            gap: 15px;
            align-items: end;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
        }
        
        label {
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        
        select {
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            background: white;
            transition: border-color 0.3s ease;
        }
        
        select:focus {
            outline: none;
            border-color: #006699;
        }
        
        .btn {
            background: linear-gradient(45deg, #006699, #004466);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            height: fit-content;
        }
        
        .btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .category-tabs {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e1e5e9;
        }
        
        .tab {
            padding: 15px 30px;
            background: none;
            border: none;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            transition: all 0.3s ease;
            color: #666;
        }
        
        .tab.active {
            color: #006699;
            border-bottom-color: #006699;
        }
        
        .tab:hover {
            color: #006699;
            background: rgba(0, 102, 153, 0.05);
        }
        
        .stats {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            color: white;
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        
        .stat-item {
            text-align: center;
            margin: 5px;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: bold;
        }
        
        .stat-label {
            font-size: 12px;
            opacity: 0.8;
        }
        
        #map {
            height: 600px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .loading {
            text-align: center;
            color: white;
            font-size: 18px;
            margin: 20px 0;
        }
        
        .error {
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        
        .success {
            background: #51cf66;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
        }
        
        .legend {
            background: white;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            margin-right: 10px;
        }
        
        .osm-missing { background-color: #ff4757; } /* artık: P11729 YOK */
        .osm-exists { background-color: #2ed573; } /* artık: P11729 VAR */
        
        @media (max-width: 768px) {
            .filter-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }
            
            .category-tabs {
                flex-direction: column;
                gap: 0;
            }
            
            .tab {
                border-bottom: 1px solid #e1e5e9;
                border-radius: 0;
            }
            
            .tab:last-child {
                border-bottom: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 Wikidata Konumları Haritası</h1>
            <p>Türkiye'deki kültürel miras alanlarının <strong>P11729 (Kulturenvanteri monument ID)</strong> durumu</p>
            <div class="wikimedia-badge">
                <small>🏛️ GitHub Pages üzerinde barındırılmaktadır</small>
            </div>
        </div>

        <div class="guide-section">
            <h3>📚 P11729 (Kulturenvanteri monument ID) Durumu</h3>
            <p>Bu harita, seçtiğiniz il/ilçe içindeki Wikidata öğelerinde <span class="property-code">P11729</span> özelliğinin var olup olmadığını gösterir.</p>
        </div>
        
        <div class="controls">
            <div class="filter-section">
                <h3 style="margin: 0 0 15px 0;">🎯 İl Seçimi</h3>
                <div class="filter-grid">
                    <div class="form-group">
                        <label for="provinceSelect">İl seçin:</label>
                        <select id="provinceSelect" onchange="handleProvinceChange()">
                            <option value="">İl seçiniz...</option>
                            <option value="Q40549">Adana</option>
                            <option value="Q43924">Adıyaman</option>
                            <option value="Q45220">Afyonkarahisar</option>
                            <option value="Q80051">Ağrı</option>
                            <option value="Q83073">Aksaray</option>
                            <option value="Q80036">Amasya</option>
                            <option value="Q2297724">Ankara</option>
                            <option value="Q40249">Antalya</option>
                            <option value="Q79840">Ardahan</option>
                            <option value="Q43745">Artvin</option>
                            <option value="Q79846">Aydın</option>
                            <option value="Q47117">Balıkesir</option>
                            <option value="Q83342">Bartın</option>
                            <option value="Q80370">Batman</option>
                            <option value="Q483063">Bayburt</option>
                            <option value="Q46763">Bilecik</option>
                            <option value="Q79760">Bingöl</option>
                            <option value="Q83239">Bitlis</option>
                            <option value="Q82089">Bolu</option>
                            <option value="Q80088">Burdur</option>
                            <option value="Q43690">Bursa</option>
                            <option value="Q47813">Çanakkale</option>
                            <option value="Q272662">Çankırı</option>
                            <option value="Q272947">Çorum</option>
                            <option value="Q82096">Denizli</option>
                            <option value="Q83081">Diyarbakır</option>
                            <option value="Q432391">Düzce</option>
                            <option value="Q83102">Edirne</option>
                            <option value="Q483091">Elazığ</option>
                            <option value="Q483173">Erzincan</option>
                            <option value="Q376797">Erzurum</option>
                            <option value="Q483053">Eskişehir</option>
                            <option value="Q483154">Gaziantep</option>
                            <option value="Q482779">Giresun</option>
                            <option value="Q482788">Gümüşhane</option>
                            <option value="Q93209">Hakkari</option>
                            <option value="Q83274">Hatay</option>
                            <option value="Q125506">Iğdır</option>
                            <option value="Q268043">Isparta</option>
                            <option value="Q534799">İstanbul</option>
                            <option value="Q344490">İzmir</option>
                            <option value="Q482834">Kahramanmaraş</option>
                            <option value="Q483168">Karabük</option>
                            <option value="Q482975">Karaman</option>
                            <option value="Q83077">Kars</option>
                            <option value="Q483191">Kastamonu</option>
                            <option value="Q483472">Kayseri</option>
                            <option value="Q128978">Kilis</option>
                            <option value="Q484392">Kırıkkale</option>
                            <option value="Q131597">Kırklareli</option>
                            <option value="Q134187">Kırşehir</option>
                            <option value="Q83965">Kocaeli</option>
                            <option value="Q81551">Konya</option>
                            <option value="Q126874">Kütahya</option>
                            <option value="Q131384">Malatya</option>
                            <option value="Q130553">Manisa</option>
                            <option value="Q131293">Mardin</option>
                            <option value="Q132637">Mersin</option>
                            <option value="Q123934">Muğla</option>
                            <option value="Q131387">Muş</option>
                            <option value="Q430693">Nevşehir</option>
                            <option value="Q155219">Niğde</option>
                            <option value="Q483180">Ordu</option>
                            <option value="Q281206">Osmaniye</option>
                            <option value="Q483481">Rize</option>
                            <option value="Q83069">Sakarya</option>
                            <option value="Q483040">Samsun</option>
                            <option value="Q388469">Şanlıurfa</option>
                            <option value="Q482825">Siirt</option>
                            <option value="Q134413">Sinop</option>
                            <option value="Q483100">Sivas</option>
                            <option value="Q647378">Şırnak</option>
                            <option value="Q129387">Tekirdağ</option>
                            <option value="Q483195">Tokat</option>
                            <option value="Q388995">Trabzon</option>
                            <option value="Q620742">Tunceli</option>
                            <option value="Q483078">Uşak</option>
                            <option value="Q80550">Van</option>
                            <option value="Q483083">Yalova</option>
                            <option value="Q75445">Yozgat</option>
                            <option value="Q219956">Zonguldak</option>
                        </select>
                    </div>

                    <div class="form-group" id="districtGroup" style="display: none;">
                        <label for="districtSelect">İlçe seçin (İsteğe bağlı):</label>
                        <select id="districtSelect">
                            <option value="">Tüm ilçeler</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn" onclick="loadData()" id="loadBtn">
                            📍 Verileri Getir
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="legend">
                <h4 style="margin: 0 0 10px 0;">🎨 Harita Gösterimi</h4>
                <div class="legend-item">
                    <div class="legend-color osm-exists"></div>
                    <span>P11729 VAR (Kulturenvanteri monument ID mevcut)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color osm-missing"></div>
                    <span>P11729 YOK</span>
                </div>
            </div>
        </div>
        
        <div id="stats" class="stats" style="display: none;">
            <div class="stat-item">
                <div class="stat-number" id="totalResults">0</div>
                <div class="stat-label">Toplam Alan</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="keExists">0</div>
                <div class="stat-label">P11729 VAR</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="keMissing">0</div>
                <div class="stat-label">P11729 YOK</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="queryTime">0</div>
                <div class="stat-label">Sorgu Süresi (sn)</div>
            </div>
        </div>
        
        <div id="messages"></div>
        
        <div id="loading" class="loading" style="display: none;">
            🔄 Wikidata'dan veriler yükleniyor...
        </div>
        
        <div id="map"></div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
    <script>
        // İstanbul ilçeleri
        const istanbulDistricts = [
            {qid: "Q1020668", name: "Adalar"},
            {qid: "Q691764", name: "Arnavutköy"},
            {qid: "Q753882", name: "Ataşehir"},
            {qid: "Q340148", name: "Avcılar"},
            {qid: "Q746516", name: "Bağcılar"},
            {qid: "Q788634", name: "Bahçelievler"},
            {qid: "Q752528", name: "Bakırköy"},
            {qid: "Q791607", name: "Başakşehir"},
            {qid: "Q791567", name: "Bayrampaşa"},
            {qid: "Q459495", name: "Beşiktaş"},
            {qid: "Q794351", name: "Beykoz"},
            {qid: "Q794356", name: "Beylikdüzü"},
            {qid: "Q217411", name: "Beyoğlu"},
            {qid: "Q840258", name: "Büyükçekmece"},
            {qid: "Q272681", name: "Çatalca"},
            {qid: "Q122320", name: "Çekmeköy"},
            {qid: "Q378714", name: "Esenler"},
            {qid: "Q268983", name: "Esenyurt"},
            {qid: "Q673073", name: "Eyüpsultan"},
            {qid: "Q732923", name: "Fatih"},
            {qid: "Q570826", name: "Gaziosmanpaşa"},
            {qid: "Q932166", name: "Güngören"},
            {qid: "Q932886", name: "Kadıköy"},
            {qid: "Q284489", name: "Kağıthane"},
            {qid: "Q639014", name: "Kartal"},
            {qid: "Q639240", name: "Küçükçekmece"},
            {qid: "Q739547", name: "Maltepe"},
            {qid: "Q857056", name: "Pendik"},
            {qid: "Q253182", name: "Sancaktepe"},
            {qid: "Q857107", name: "Sarıyer"},
            {qid: "Q732028", name: "Silivri"},
            {qid: "Q673890", name: "Sultanbeyli"},
            {qid: "Q268747", name: "Sultangazi"},
            {qid: "Q241631", name: "Şile"},
            {qid: "Q390637", name: "Şişli"},
            {qid: "Q938548", name: "Tuzla"},
            {qid: "Q334924", name: "Ümraniye"},
            {qid: "Q326339", name: "Üsküdar"},
            {qid: "Q197095", name: "Zeytinburnu"}
        ];

        function handleProvinceChange() {
            const provinceSelect = document.getElementById('provinceSelect');
            const districtGroup = document.getElementById('districtGroup');
            const districtSelect = document.getElementById('districtSelect');
            
            if (provinceSelect.value === 'Q534799') { // İstanbul seçildi
                districtGroup.style.display = 'block';
                districtSelect.innerHTML = '<option value="">Tüm ilçeler</option>';
                istanbulDistricts.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.qid;
                    option.textContent = district.name;
                    districtSelect.appendChild(option);
                });
            } else {
                districtGroup.style.display = 'none';
                districtSelect.innerHTML = '<option value="">Tüm ilçeler</option>';
            }
        }
        
        // Harita başlatma
        let map = L.map('map').setView([39.0, 35.0], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        let markersGroup = L.layerGroup().addTo(map);
        
        function showMessage(text, type = 'info') {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = type;
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            setTimeout(() => { messageDiv.remove(); }, 5000);
        }
        
        function loadData() {
            const provinceSelect = document.getElementById('provinceSelect');
            const districtSelect = document.getElementById('districtSelect');
            const selectedProvince = provinceSelect.value;
            const selectedDistrict = districtSelect.value;
            if (!selectedProvince) {
                showMessage('Lütfen bir il seçin!', 'error');
                return;
            }
            const provinceName = provinceSelect.options[provinceSelect.selectedIndex].text;
            runKEQuery(selectedProvince, provinceName, selectedDistrict);
        }
        
        // P11729 var/yok durumunu sorgulayan SPARQL
        async function runKEQuery(provinceQID, provinceName, districtQID = null) {
            let locationPath = '';
            let locationName = provinceName;
            if (districtQID) {
                locationPath = `wdt:P131*/wdt:P131* wd:${districtQID};`;
                const districtName = istanbulDistricts.find(d => d.qid === districtQID)?.name;
                locationName = `${districtName}, ${provinceName}`;
            } else {
                locationPath = `wdt:P131*/wdt:P131* wd:${provinceQID};`;
            }
            
            const query = `SELECT DISTINCT ?place ?placeLabel ?coordinates (SAMPLE(?kid) AS ?keID)
WHERE {
  ?place wdt:P17 wd:Q43;               # Ülkesi Türkiye
         ${locationPath}               # Seçilen alan içinde
         wdt:P625 ?coordinates .       # Koordinatı olanlar
  OPTIONAL { ?place wdt:P11729 ?kid }  # Kulturenvanteri monument ID (P11729)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],tr,en". }
}`;
            await runQuery(query, locationName);
        }
        
        async function runQuery(query, locationName) {
            const loading = document.getElementById('loading');
            const loadBtn = document.getElementById('loadBtn');
            loading.style.display = 'block';
            loadBtn.disabled = true;
            loadBtn.textContent = '⏳ Yükleniyor...';
            markersGroup.clearLayers();
            
            const startTime = Date.now();
            
            try {
                const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                
                const data = await response.json();
                const results = data.results.bindings;
                const queryTime = ((Date.now() - startTime) / 1000).toFixed(2);
                
                let mappedCount = 0;
                let keMissingCount = 0;
                let keExistsCount = 0;
                let bounds = [];
                
                results.forEach(result => {
                    if (!result.coordinates || !result.coordinates.value) return;
                    const coordString = result.coordinates.value;
                    const match = coordString.match(/Point\(([^ ]+) ([^ ]+)\)/);
                    if (!match) return;
                    
                    const lng = parseFloat(match[1]);
                    const lat = parseFloat(match[2]);
                    const label = result.placeLabel ? result.placeLabel.value : 'Bilinmeyen';
                    const itemUrl = result.place.value;
                    const qid = itemUrl.split('/').pop();
                    const keID = result.keID ? result.keID.value : null;
                    
                    const hasKE = !!keID;
                    const markerColor = hasKE ? '#2ed573' : '#ff4757';
                    if (hasKE) keExistsCount++; else keMissingCount++;
                    
                    const customIcon = L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    });
                    
                    let popupContent = `<div style="max-width: 300px;">`;
                    popupContent += `<h4 style="margin: 0 0 10px 0; color: #006699;">${escapeHtml(label)}</h4>`;
                    popupContent += `<p><strong>P11729:</strong> ${
                        hasKE 
                        ? `<a href="https://kulturenvanteri.com/yer/?p=${encodeURIComponent(keID)}" target="_blank" style="color:#006699;text-decoration:none;background:#e8f4fd;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.9em;">${keID}</a>` 
                        : `<span style="color:#ff4757;">YOK</span>`}</p>`;
                    popupContent += `<p><strong>Konum:</strong> ${escapeHtml(locationName)}</p>`;
                    popupContent += `<p><strong>Wikidata:</strong> <a href="${itemUrl}" target="_blank" style="color:#006699;">${qid}</a></p>`;
                    
                    // Harici harita bağlantıları
                    const googleMapsUrl = `https://www.google.com/maps/place/${lat},${lng}`;
                    popupContent += `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">`;
                    popupContent += `<h5 style="margin:0 0 8px 0;color:#666;font-size:0.9em;">🔗 Bağlantılar</h5>`;
                    popupContent += `<p style="margin:5px 0;"><a href="${googleMapsUrl}" target="_blank" style="color:#006699;background:#f0f8ff;padding:3px 8px;border-radius:4px;display:inline-block;font-size:0.9em;">🌍 Google Maps</a></p>`;
                    
                    // Google Earth DMS
                    function convertToDMS(coord, isLat) {
                        const absCoord = Math.abs(coord);
                        const degrees = Math.floor(absCoord);
                        const minutes = Math.floor((absCoord - degrees) * 60);
                        const seconds = ((absCoord - degrees - minutes/60) * 3600).toFixed(1);
                        const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
                        return `${degrees}%C2%B0${minutes}'${seconds}%22${direction}`;
                    }
                    const latDMS = convertToDMS(lat, true);
                    const lngDMS = convertToDMS(lng, false);
                    const googleEarthUrl = `https://earth.google.com/web/search/${latDMS}%20${lngDMS}/@${lat},${lng},1000a,2000d,35y,0h,0t,0r`;
                    popupContent += `<p style="margin:5px 0;"><a href="${googleEarthUrl}" target="_blank" style="color:#006699;background:#f0f8ff;padding:3px 8px;border-radius:4px;display:inline-block;font-size:0.9em;">🌎 Google Earth</a></p>`;
                    
                    // Yandex
                    const yandexMapsUrl = `https://yandex.com/maps/?ll=${lng}%2C${lat}&z=16`;
                    popupContent += `<p style="margin:5px 0;"><a href="${yandexMapsUrl}" target="_blank" style="color:#006699;background:#f0f8ff;padding:3px 8px;border-radius:4px;display:inline-block;font-size:0.9em;">🗺️ Yandex Maps</a></p>`;
                    
                    // İBB katmanı (yalnız İstanbul için)
                    const provinceVal = document.getElementById('provinceSelect').value;
                    const districtVal = document.getElementById('districtSelect').value;
                    if (provinceVal === 'Q534799' || (districtVal && istanbulDistricts.some(d => d.qid === districtVal))) {
                        const ibbUrl = `https://kulturenvanteri.ibb.gov.tr/portal/apps/webappviewer/index.html?id=62758a0e55e6462e9dbff7d5737e5ed2&marker=${lng},${lat},&level=18`;
                        popupContent += `<p style="margin:5px 0;"><a href="${ibbUrl}" target="_blank" style="color:#006699;background:#f0f8ff;padding:3px 8px;border-radius:4px;display:inline-block;font-size:0.9em;">🏢 İBB Katmanı</a></p>`;
                    }
                    popupContent += `</div></div>`;
                    
                    const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent);
                    markersGroup.addLayer(marker);
                    bounds.push([lat, lng]);
                    mappedCount++;
                });
                
                if (bounds.length > 0) map.fitBounds(bounds);
                else showMessage(`${locationName} bölgesinde bu kriterlere uygun veri bulunamadı.`, 'error');
                
                // İstatistikler
                document.getElementById('totalResults').textContent = results.length;
                document.getElementById('keExists').textContent = keExistsCount;
                document.getElementById('keMissing').textContent = keMissingCount;
                document.getElementById('queryTime').textContent = queryTime;
                document.getElementById('stats').style.display = 'flex';
                
                showMessage(`✅ ${locationName}: ${mappedCount} konum haritada gösterildi`, 'success');
                
            } catch (error) {
                console.error('Sorgu hatası:', error);
                showMessage(`❌ Sorgu hatası: ${error.message}`, 'error');
            } finally {
                loading.style.display = 'none';
                loadBtn.disabled = false;
                loadBtn.textContent = '📍 Verileri Getir';
            }
        }

        // Basit HTML escape
        function escapeHtml(s) {
          return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
        }
    </script>
</body>
</html>
```
