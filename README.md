# Türkiye Mezarlıkları Haritası

Bu depo, Wikidata'daki `cemetery (Q39614)` ve `graveyard (Q1107656)` olarak işaretlenmiş öğeleri Türkiye sınırlarında sorgulayan ve Leaflet ile harita üzerinde gösteren bir GitHub Pages sitesi barındırır. Kullanıcılar seçtikleri il (ve İstanbul için ilçe) bazında mezarlıkları görüntüleyebilir ve yerel olarak saklanan bilgi kartları oluşturabilir.

## Özellikler
- İl ve isteğe bağlı olarak İstanbul ilçesi seçimi ile Wikidata SPARQL sorgusu çalıştırma
- Haritada mezarlık noktalarını katmanlı olarak gösterme
- Türüne göre farklı renkli işaretçiler
- Harita üzerinden açılan yan panelde tür, tarih, kültür, görsel ve açıklama içeren entry kayıtları tutma
- Entry kayıtlarını tarayıcı `localStorage` alanında saklama

## Geliştirme
Projeyi yerelde görüntülemek için herhangi bir statik dosya sunucusu kullanılabilir. Örneğin Python 3 ile:

```bash
python -m http.server
```

Ardından tarayıcıda `http://localhost:8000` adresine giderek siteyi inceleyebilirsiniz.
