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
        
        .osm-missing { background-color: #ff4757; }
        .osm-exists { background-color: #2ed573; }
        
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
            <p>Türkiye'deki kültürel miras alanlarının OpenStreetMap durumu</p>
            <div class="wikimedia-badge">
                <small>🏛️ GitHub Pages üzerinde barındırılmaktadır</small>
            </div>
        </div>

        <div class="guide-section">
            <h3>📚 OpenStreetMap ve Wikidata Arasında Bağlantı Kurma Rehberi</h3>
            <p>OpenStreetMap'teki coğrafi veriler ile Wikidata'daki bilgileri birbirine bağlamak için iki yönlü bir süreç izlenir:</p>
            
            <div class="step">
                <h4>1. Aşama: OpenStreetMap'e Wikidata Bilgisi Ekleme</h4>
                <p>OpenStreetMap üzerinde bulunan mevcut Way (yol/alan) veya Relation (ilişki) öğesine <span class="property-code">wikidata=</span> etiketi eklenir. Bu etiketin değeri olarak Wikidata'daki ilgili öğenin Qid numarası (örneğin Q12345) yazılır.</p>
            </div>

            <div class="step">
                <h4>2. Aşama: Wikidata'ya OpenStreetMap Bilgisi Ekleme</h4>
                <p>Wikidata'daki ilgili Qid öğesine OpenStreetMap'teki way veya relation numarası eklenir. Bu işlem için aşağıdaki özellikler (Property) kullanılır:</p>
                <ul>
                    <li><strong><span class="property-code">P10689</span> - OpenStreetMap yol tanımlayıcı:</strong>
                        <ul>
                            <li>Tekil yapılar için kullanılır</li>
                            <li>Binalar, camiler, müzeler, anıtlar gibi mimari yapılarda tercih edilir</li>
                            <li>Kültürel varlıkların büyük çoğunluğu bu kategori altında yer alır</li>
                        </ul>
                    </li>
                    <li><strong><span class="property-code">P402</span> - OpenStreetMap ilişki tanımlayıcı:</strong>
                        <ul>
                            <li>Çoklu yapı kompleksleri için kullanılır</li>
                            <li>Külliyeler, üniversite kampüsleri, hastane kompleksleri gibi birden fazla yapıyı içeren yapı gruplarında tercih edilir</li>
                        </ul>
                    </li>
                </ul>
            </div>
            
            <p><strong>Bu iki aşamalı süreç tamamlandığında, OpenStreetMap ve Wikidata arasında karşılıklı referans oluşturulmuş olur.</strong></p>
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
                    <div class="legend-color osm-missing"></div>
                    <span>OpenStreetMap verisi bulunmayan alanlar</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color osm-exists"></div>
                    <span>OpenStreetMap verisi bulunan alanlar</span>
                </div>
            </div>
        </div>
        
        <div id="stats" class="stats" style="display: none;">
            <div class="stat-item">
                <div class="stat-number" id="totalResults">0</div>
                <div class="stat-label">Toplam Alan</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="osmMissing">0</div>
                <div class="stat-label">OSM Verisi Yok</div>
            </div>
            <div class="stat-item">
                <div class="stat-number" id="osmExists">0</div>
                <div class="stat-label">OSM Verisi Var</div>
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
                // İlçe seçimini göster
                districtGroup.style.display = 'block';
                
                // İlçe listesini temizle ve yeniden doldur
                districtSelect.innerHTML = '<option value="">Tüm ilçeler</option>';
                istanbulDistricts.forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.qid;
                    option.textContent = district.name;
                    districtSelect.appendChild(option);
                });
            } else {
                // İlçe seçimini gizle
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
            
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
        
        function loadData() {
            console.log('loadData fonksiyonu çağrıldı');
            const provinceSelect = document.getElementById('provinceSelect');
            const districtSelect = document.getElementById('districtSelect');
            const selectedProvince = provinceSelect.value;
            const selectedDistrict = districtSelect.value;
            
            console.log('Seçilen il:', selectedProvince);
            console.log('Seçilen ilçe:', selectedDistrict);
            
            if (!selectedProvince) {
                showMessage('Lütfen bir il seçin!', 'error');
                return;
            }
            
            const provinceName = provinceSelect.options[provinceSelect.selectedIndex].text;
            console.log('İl adı:', provinceName);
            
            // Sadece OpenStreetMap verisi olmayan alanları göster
            runOSMQuery(selectedProvince, provinceName, selectedDistrict);
        }
        
        async function runOSMQuery(provinceQID, provinceName, districtQID = null) {
            let locationFilter = '';
            let locationName = provinceName;
            
            if (districtQID) {
                // İlçe seçildiyse, sadece o ilçede ara
                locationFilter = `wdt:P131*/wdt:P131* wd:${districtQID};`;
                const districtName = istanbulDistricts.find(d => d.qid === districtQID)?.name;
                locationName = `${districtName}, ${provinceName}`;
            } else {
                // İl genelinde ara
                locationFilter = `wdt:P131*/wdt:P131* wd:${provinceQID};`;
            }
            
            const query = `SELECT DISTINCT ?place ?placeLabel ?coordinates (SAMPLE(?layerLabel) AS ?layer) (SAMPLE(?osmWay) AS ?osmWay) (SAMPLE(?osmRel) AS ?osmRel) (SAMPLE(?osmNode) AS ?osmNode) (SAMPLE(?keID) AS ?keID)
WHERE {
  ?place wdt:P17 wd:Q43;              # Ülkesi Türkiye
         ${locationFilter}            # Seçilen alan içinde
         wdt:P11729 ?keID.             # KE ID mevcut
  OPTIONAL { ?place wdt:P5816 ?status. }    # Koruma durumu varsa al
  OPTIONAL { ?place wdt:P11693 ?osmNode. }      # OSM node ID
  OPTIONAL { ?place wdt:P10689 ?osmWay. }      # OSM way ID
  OPTIONAL { ?place wdt:P402 ?osmRel. }  # OSM relation ID
  OPTIONAL { ?place wdt:P625 ?coordinates. }  # Koordinat varsa
  # İstediğimiz filtre:
  FILTER(
    !BOUND(?status) || 
    (?status IN (wd:Q56557591, wd:Q75505084, wd:Q117841865, wd:Q27132179))
  )
  BIND(
    IF(BOUND(?osmNode) || BOUND(?osmWay) || BOUND(?osmRel),
      "OSM verisi var",
      "OSM verisi yok"
    ) AS ?layerLabel
  )
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],tr". }
}
GROUP BY ?place ?placeLabel ?coordinates`;

            await runQuery(query, locationName, 'openstreetmap');
        }
        
        async function runCommonsQuery(provinceQID, provinceName) {
            const query = `SELECT DISTINCT ?place ?placeLabel ?coordinates ?image
WHERE {
  ?place wdt:P17 wd:Q43;              # Ülkesi Türkiye
         wdt:P131*/wdt:P131* wd:${provinceQID}; # ${provinceName} ili içinde
         wdt:P11729 ?keID.             # KE ID mevcut
  OPTIONAL { ?place wdt:P625 ?coordinates. }  # Koordinat varsa
  OPTIONAL { ?place wdt:P18 ?image. }         # Görsel varsa
  FILTER(!BOUND(?image))              # Görseli olmayan
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],tr". }
}
LIMIT 100`;

            await runQuery(query, provinceName, 'commons');
        }
        
        async function runQuery(query, locationName, category) {
            const loading = document.getElementById('loading');
            const loadBtn = document.getElementById('loadBtn');
            const selectedProvince = document.getElementById('provinceSelect').value; // Bu satırı ekledik
            
            loading.style.display = 'block';
            loadBtn.disabled = true;
            loadBtn.textContent = '⏳ Yükleniyor...';
            markersGroup.clearLayers();
            
            const startTime = Date.now();
            
            try {
                const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                const results = data.results.bindings;
                const queryTime = ((Date.now() - startTime) / 1000).toFixed(2);
                
                let mappedCount = 0;
                let osmMissingCount = 0;
                let osmExistsCount = 0;
                let bounds = [];
                
                results.forEach(result => {
                    if (result.coordinates && result.coordinates.value) {
                        const coordString = result.coordinates.value;
                        const match = coordString.match(/Point\(([^ ]+) ([^ ]+)\)/);
                        
                        if (match) {
                            const lng = parseFloat(match[1]);
                            const lat = parseFloat(match[2]);
                            
                            const label = result.placeLabel ? result.placeLabel.value : 'Bilinmeyen';
                            const itemUrl = result.place.value;
                            const qid = itemUrl.split('/').pop();
                            const keID = result.keID ? result.keID.value : null;
                            
                            // OSM verilerini kontrol et
                            const osmWay = result.osmWay ? result.osmWay.value : null;
                            const osmRel = result.osmRel ? result.osmRel.value : null;
                            const osmNode = result.osmNode ? result.osmNode.value : null;
                            
                            // OSM durumunu belirle
                            let hasOsmData = false;
                            let markerColor = '#ff4757';
                            let osmUrl = null;
                            let osmId = null;
                            
                            if (category === 'openstreetmap') {
                                hasOsmData = result.layer && result.layer.value === "OSM verisi var";
                                markerColor = hasOsmData ? '#2ed573' : '#ff4757';
                                
                                // OSM URL'ini belirle (öncelik sırası: way > relation > node)
                                if (osmWay) {
                                    osmUrl = `https://www.openstreetmap.org/way/${osmWay}`;
                                    osmId = `way/${osmWay}`;
                                } else if (osmRel) {
                                    osmUrl = `https://www.openstreetmap.org/relation/${osmRel}`;
                                    osmId = `relation/${osmRel}`;
                                } else if (osmNode) {
                                    osmUrl = `https://www.openstreetmap.org/node/${osmNode}`;
                                    osmId = `node/${osmNode}`;
                                }
                                
                                if (hasOsmData) {
                                    osmExistsCount++;
                                } else {
                                    osmMissingCount++;
                                }
                            } else {
                                // Commons kategorisi için kırmızı (görsel yok)
                                osmMissingCount++;
                            }
                            
                            // Özel marker ikonu
                            const customIcon = L.divIcon({
                                className: 'custom-marker',
                                html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            });
                            
                            // Popup içeriği
                            let popupContent = `<div style="max-width: 300px;">`;
                            popupContent += `<h4 style="margin: 0 0 10px 0; color: #006699;">${label}</h4>`;
                            
                            if (category === 'openstreetmap') {
                                if (hasOsmData && osmUrl && osmId) {
                                    popupContent += `<p><strong>Durum:</strong> <span style="color: #2ed573;">✅ OSM verisi mevcut</span> - <a href="${osmUrl}" target="_blank" style="color: #006699; text-decoration: none; background: #e8f4fd; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">${osmId}</a></p>`;
                                } else {
                                    // OSM'de arama URL'i oluştur
                                    const osmSearchUrl = `https://www.openstreetmap.org/query?lat=${lat}&lon=${lng}#map=19/${lat}/${lng}`;
                                    popupContent += `<p><strong>Durum:</strong> <span style="color: #ff4757;">❌ OSM verisi eksik</span> - <a href="${osmSearchUrl}" target="_blank" style="color: #ff4757; text-decoration: none; background: #ffe8e8; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">🔍 OSM'de ara</a></p>`;
                                }
                            } else {
                                popupContent += `<p><strong>Durum:</strong> <span style="color: #ff4757;">📷 Commons görseli eksik</span></p>`;
                            }
                            
                            popupContent += `<p><strong>Konum:</strong> ${locationName}</p>`;
                            popupContent += `<p><strong>Wikidata:</strong> <a href="${itemUrl}" target="_blank" style="color: #006699;">${qid}</a></p>`;
                            
                            // Diğer bağlantılar bölümü
                            popupContent += `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">`;
                            popupContent += `<h5 style="margin: 0 0 8px 0; color: #666; font-size: 0.9em;">🔗 Diğer Bağlantılar</h5>`;
                            
                            // Google Maps bağlantısı
                            const googleMapsUrl = `https://www.google.com/maps/place/${lat},${lng}`;
                            popupContent += `<p style="margin: 5px 0;"><a href="${googleMapsUrl}" target="_blank" style="color: #006699; text-decoration: none; background: #f0f8ff; padding: 3px 8px; border-radius: 4px; display: inline-block; font-size: 0.9em;">🌍 Google Maps'te ara</a></p>`;
                            
                            // Google Earth bağlantısı
                            // Koordinatları derece, dakika, saniye formatına çevir
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
                            popupContent += `<p style="margin: 5px 0;"><a href="${googleEarthUrl}" target="_blank" style="color: #006699; text-decoration: none; background: #f0f8ff; padding: 3px 8px; border-radius: 4px; display: inline-block; font-size: 0.9em;">🌎 Google Earth'te ara</a></p>`;
                            
                            // Yandex Maps bağlantısı
                            const yandexMapsUrl = `https://yandex.com/maps/?ll=${lng}%2C${lat}&z=16`;
                            popupContent += `<p style="margin: 5px 0;"><a href="${yandexMapsUrl}" target="_blank" style="color: #006699; text-decoration: none; background: #f0f8ff; padding: 3px 8px; border-radius: 4px; display: inline-block; font-size: 0.9em;">🗺️ Yandex Maps'te ara</a></p>`;
                            
                            // İBB Kültür Envanteri bağlantısı (sadece İstanbul için)
                            const districtSelect = document.getElementById('districtSelect');
                            const selectedDistrict = districtSelect.value;
                            
                            if (selectedProvince === 'Q534799' || (selectedDistrict && istanbulDistricts.some(d => d.qid === selectedDistrict))) {
                                const ibbUrl = `https://kulturenvanteri.ibb.gov.tr/portal/apps/webappviewer/index.html?id=62758a0e55e6462e9dbff7d5737e5ed2&marker=${lng},${lat},&level=18`;
                                popupContent += `<p style="margin: 5px 0;"><a href="${ibbUrl}" target="_blank" style="color: #006699; text-decoration: none; background: #f0f8ff; padding: 3px 8px; border-radius: 4px; display: inline-block; font-size: 0.9em;">🏢 İBB'de ara</a></p>`;
                            }
                            
                            // Kültür Envanteri bağlantısı
                            if (keID) {
                                const keUrl = `https://kulturenvanteri.com/yer/?p=${keID}`;
                                popupContent += `<p style="margin: 5px 0;"><a href="${keUrl}" target="_blank" style="color: #006699; text-decoration: none; background: #f0f8ff; padding: 3px 8px; border-radius: 4px; display: inline-block; font-size: 0.9em;">🏛️ KE'de ara</a></p>`;
                            }
                            
                            popupContent += `</div>`;
                            popupContent += `</div>`;
                            
                            const marker = L.marker([lat, lng], { icon: customIcon })
                                .bindPopup(popupContent);
                            
                            // Marker'a tıklama olayı ekle
                            marker.on('click', function() {
                                // Popup'ı aç
                                this.openPopup();
                            });
                            
                            markersGroup.addLayer(marker);
                            bounds.push([lat, lng]);
                            mappedCount++;
                        }
                    }
                });
                
                if (bounds.length > 0) {
                    map.fitBounds(bounds);
                } else {
                    showMessage(`${locationName} bölgesinde bu kriterlere uygun veri bulunamadı.`, 'error');
                }
                
                // İstatistikleri güncelle
                document.getElementById('totalResults').textContent = results.length;
                document.getElementById('osmMissing').textContent = osmMissingCount;
                document.getElementById('osmExists').textContent = osmExistsCount;
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
    </script>
</body>
</html>
