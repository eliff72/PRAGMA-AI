# TEKNOFEST RAG Chatbot - Jüri Sunum Senaryosu (Demo)

## 1. Giriş ve Karşılama (Tahmini Süre: 1 Dk)
* Jürinin karşısına çıkılır ve projenin temel amacı (Problemin 5. maddesi olan halüsinasyon kontrolü ve kaynak gösterimi) tek cümleyle özetlenir.
* Sistemde 4 farklı rol olduğu belirtilir.

## 2. Yarışmacı Akışı Testi (Tahmini Süre: 2 Dk)
* **Aksiyon:** Yarışmacı rolüyle sisteme giriş yapılır.
* **Aksiyon:** 'İHA Şartnamesi' kategorisi seçilir.
* **Soru 1 (Başarılı):** "İHA kanat açıklığı en fazla ne kadar olmalıdır?"
* **Beklenen Yanıt:** Sistem doğru cevabı vermeli ve altına `[Kaynak: İHA Şartnamesi Sayfa X]` eklemelidir.

## 3. İçerik Yöneticisi Akışı Testi (Tahmini Süre: 2 Dk)
* **Aksiyon:** İçerik Yöneticisi rolüyle sisteme giriş yapılır.
* **Aksiyon:** Yeni bir TEKNOFEST kural kitapçığı (PDF dosyası) yüklenir.
* **Not:** Yüklenen PDF belgelerinin metin formatlarının bozulmadığı ve temiz olduğu ONLYOFFICE gibi filigransız bir belge görüntüleyici ile önden teyit edilir.
* **Aksiyon:** Eski yarışma kaynağı pasife alınır ve sistem havuzu güncellenir.
* **Beklenen Yanıt:** Ekranın sağ üst köşesinde "Kaynak başarıyla güncellendi" yeşil bildirimi çıkmalıdır.

## 4. Destek Ekibi Akışı Testi (Tahmini Süre: 2 Dk)
* **Aksiyon:** Destek Ekibi rolüyle yönetim paneline girilir.
* **Aksiyon:** Chatbot'un yanıtlayamayıp "insana yönlendirdiği" zor bir soru listesi açılır.
* **Aksiyon:** Soruya manuel yanıt yazılır ve bu konu tek tuşla SSS (Sık Sorulan Sorular) havuzuna eklenir.
* **Beklenen Yanıt:** Yarışmacının ekranında, cevabın yapay zekâdan değil "Destek Ekibi"nden geldiğine dair bir ikon belirmelidir.