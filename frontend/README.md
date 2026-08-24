# PRAGMA-AI — Frontend

TEKNOFEST Problem 5 (Yapay Zeka Destekli SSS ve Chatbot Asistanı) için hazırlanan
React + Vite + TypeScript + Tailwind CSS arayüzü. Ana projedeki README'de
tanımlanan `frontend/` klasörüyle birebir uyumludur.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` açılır.

## Mock mod (backend olmadan çalıştırma)

`.env` dosyasında `VITE_USE_MOCK=true` iken arayüz, `src/mock/` klasöründeki
sahte veriler ve sahte RAG mantığıyla **tamamen bağımsız çalışır** — backend
hazır olmasa bile demo yapılabilir, PDR/jüri sunumu için idealdir.

`.env.example`'daki varsayılan zaten `VITE_USE_MOCK=false`'tur (gerçek
backend'e gider); mock modu SADECE backend hiç çalışmıyorsa/hazır değilse
bilerek `true` yapmanız gerekir:

```
VITE_USE_MOCK=true
```

Tüm `src/api/*.ts` dosyaları zaten gerçek endpoint'lere (`/api/questions`,
`/api/resources`, `/api/escalations`, `/api/analytics`, `/api/auth/login`)
istek atacak şekilde yazıldı — sadece bu bayrağı kapatmanız yeterli.

## Demo giriş

Giriş ekranında e-posta/parola isteğe bağlıdır (mock modda otomatik demo
kullanıcısı atanır); "Rol" alanından 4 kullanıcı tipini (Yarışmacı, İçerik
Yöneticisi, Destek Ekibi, Sistem Yöneticisi) seçip ilgili paneli görebilirsiniz.
Backend bağlandığında bu alan kaldırılıp gerçek `/api/auth/login` üzerinden
role backend belirler.

## Klasör yapısı

```
src/
├── api/          # backend endpoint çağrıları (mock/gerçek geçişli)
├── components/   # AppShell, ChatBubble, SourceCard (kaynak kartı), ...
├── context/      # AuthContext (rol bazlı erişim)
├── mock/         # demo veri + sahte RAG üretici
├── pages/        # LoginPage, CompetitorChatPage, ContentManagerPage,
│                 # SupportQueuePage, AdminDashboardPage
└── types/        # paylaşılan TS tipleri
```

## Tasarım tokenleri

`src/index.css` içindeki `@theme` bloğunda tanımlı: lacivert (`--color-navy-900`),
kırmızı vurgu (`--color-flag-600`), altın/güven rengi (`--color-gold-500`) —
T3/TEKNOFEST kimliğinden esinlenmiştir. Kesin kurumsal Pantone/HEX değerleri
için T3 Vakfı'nın resmi Kurumsal Kimlik kılavuzunu (t3vakfi.org) baz alıp bu
değerleri güncelleyebilirsiniz.
