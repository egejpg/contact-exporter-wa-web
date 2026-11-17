# Chrome Web Store — yayınlama notları

## Yükleme

1. `npm run package` → `dist/contact-exporter-wa-web-<sürüm>.zip`
2. chrome.google.com/webstore/devconsole → öğe → **Paket** → yeni zip'i yükle.
3. Görseller `store-assets/` klasöründe:
   - Ekran görüntüleri (1280×800): `01-ana`, `02-telefon`, `03-excel`, `04-gizlilik`
   - Küçük tanıtım kutusu (440×280): `tanitim-kucuk-440x280.png`
   - Kayan tanıtım (1400×560): `tanitim-kayan-1400x560.png`
   - Mağaza simgesi (128×128): `magaza-simgesi-128.png`

## Gizlilik sekmesi

- **Tek amaç:** WhatsApp Web'de kayıtlı kişileri CSV/VCF olarak dışa aktarmak.
- **`activeTab` gerekçesi:** Kullanıcı simgeye tıkladığında yalnızca açık WhatsApp Web sekmesindeki kişi listesini okumak için.
- **`scripting` gerekçesi:** Kişi listesini okuyan fonksiyonu o sekmede çalıştırmak için.
- **Veri kullanımı:** "Kişisel iletişim bilgileri" işlenir; toplanmaz, aktarılmaz, satılmaz.
- **Gizlilik politikası adresi:** geliştirici sitesindeki `/contact-exporter/privacy` sayfası (yayına girince). O zamana kadar GitHub'daki `PRIVACY.md` bağlantısı da kullanılabilir.

## Marka

İsimde ve simgede "WhatsApp" markasını kullanma. Açıklamada "WhatsApp Web ile çalışır" demek yeterli; aksi halde marka şikâyetiyle kaldırılma riski artar.

## Mağaza açıklaması

**Kısa:** WhatsApp Web'de kayıtlı kişilerini tek tıkla CSV ve VCF olarak dışa aktar. Veriler bilgisayarından hiç çıkmaz.

**Uzun:**

Telefon değiştirdin ama rehberini aktarmayı unuttun mu? WhatsApp Web hâlâ kişilerini isimleriyle gösteriyorsa, Contact Exporter for WA Web onları tek tıkla geri alır.

• Telefona aktarmak için VCF, Excel için CSV
• Önizleme, arama ve tek tek seçim
• Türk numaraları için yerel biçim (0532 123 45 67)
• Türkçe Excel uyumlu CSV
• Tamamen yerel: sunucu yok, hesap yok, takip yok. Sadece simgeye tıkladığın sekmeye erişir.
• Açık kaynak: kodu GitHub'da herkes inceleyebilir.

Bu eklenti WhatsApp veya Meta ile bağlantılı değildir.
