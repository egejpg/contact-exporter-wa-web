# Değişiklik Günlüğü

## 1.1.0 — 2026-11-18

### Yeni
- İngilizce arayüz. Chrome'un diline göre Türkçe ya da İngilizce açılır (diğer dillerde İngilizce). Eklentinin adı ve açıklaması da iki dilde.
- Ülke adları ve CSV başlıkları arayüz dilinde ("Ad/Telefon" ya da "Name/Phone").
- "Excel'de açacağım" seçeneği ayırıcıyı bölge ayarına göre seçer: ondalık virgül kullanan bölgelerde `;`, nokta kullananlarda `,` (İngilizce Excel'de sütunlar artık doğru ayrılır).

### Düzeltme
- Arama, Türkçe ve İngilizce küçük harf kurallarının ikisiyle de eşleşir (ör. "ivan" → "Ivan").

## 1.0.2 — 2026-11-18

### Yeni
- Numara biçimi seçenekleri: Uluslararası (+905321234567), Uluslararası boşluklu (+90 532 123 45 67), Yerel (0532 123 45 67), 00 ile ve Yalnızca rakam.
- Yerel biçim için 240'tan fazla ülke arasından seçim. Rehberdeki ülkeler kişi sayısıyla listenin başında; varsayılan, rehberde en çok görülen ülke.
- Seçeneklerdeki örnekler kendi numaralarından birine göre gösterilir.
- Biçim ve ülke tercihi hatırlanır (yalnızca bu tarayıcıda, yeni izin gerekmeden).
- Numara araması her ülkede yerel yazımla da çalışır (ör. 0151…).

## 1.0.1 — 2026-11-18

### Güvenlik
- CSV: `=`, `+`, `-`, `@` ile başlayan isimler artık "Excel'de açacağım" seçeneği kapalıyken de formül olarak çalıştırılmıyor. Kayıtsız kişilerin profil adını karşı taraf belirlediği için bu önemli.
- VCF: profil adındaki tek başına `\r` karakteri kaçırılıyor. Daha önce bu karakterle dosyaya sahte kişi kartı eklenebiliyordu.
- İsimlerdeki kontrol karakterleri ve yazı yönünü değiştiren Unicode karakterleri (ör. U+202E) temizleniyor.

### Diğer
- `homepage_url`: https://egejpg.github.io/contact-exporter/

## 1.0.0 — 2026-11-17

- İlk sürüm: WhatsApp Web'deki kayıtlı kişileri CSV ve VCF olarak dışa aktarma, önizleme, arama, tek tek seçim, Türkçe Excel uyumlu CSV.
