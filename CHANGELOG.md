# Değişiklik Günlüğü

## 1.0.1 — 2026-11-18

### Güvenlik
- CSV: `=`, `+`, `-`, `@` ile başlayan isimler artık "Excel'de açacağım" seçeneği kapalıyken de formül olarak çalıştırılmıyor. Kayıtsız kişilerin profil adını karşı taraf belirlediği için bu önemli.
- VCF: profil adındaki tek başına `\r` karakteri kaçırılıyor. Daha önce bu karakterle dosyaya sahte kişi kartı eklenebiliyordu.
- İsimlerdeki kontrol karakterleri ve yazı yönünü değiştiren Unicode karakterleri (ör. U+202E) temizleniyor.

## 1.0.0 — 2026-11-17

- İlk sürüm: WhatsApp Web'deki kayıtlı kişileri CSV ve VCF olarak dışa aktarma, önizleme, arama, tek tek seçim, Türkçe Excel uyumlu CSV.
