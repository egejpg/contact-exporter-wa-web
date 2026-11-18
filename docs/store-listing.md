# Chrome Web Store — yayınlama notları

Mağaza sayfası: https://chromewebstore.google.com/detail/contact-exporter-for-wa-w/eaipkkaokidhcalpnlhmmnicjgnggjmp

## Güncelleme yükleme

1. `npm run package` → `dist/contact-exporter-wa-web-<sürüm>.zip` (zip'i açmadan yükle).
2. chrome.google.com/webstore/devconsole → öğe → **Paket** → **Yeni paket yükle**.
3. Mağaza girişi ve Gizlilik sekmelerini gerekirse güncelle → **İncelemeye gönder**.
4. Görseller `store-assets/` klasöründe:
   - Ekran görüntüleri (1280×800): `01-ana`, `02-telefon`, `03-excel`, `04-gizlilik`
   - Küçük tanıtım kutusu (440×280): `tanitim-kucuk-440x280.png`
   - Kayan tanıtım (1400×560): `tanitim-kayan-1400x560.png`
   - Mağaza simgesi (128×128): `magaza-simgesi-128.png`

## Diller

Eklenti 1.1.0'dan itibaren `_locales/en` ve `_locales/tr` içeriyor, varsayılan dil İngilizce. Paket yüklendikten sonra **Mağaza girişi** sekmesinin üstünde bir dil seçici çıkar; her dil için açıklamayı (ve istersen ekran görüntülerini) ayrı girersin. Eklentinin adı ve kısa açıklaması `messages.json` dosyalarından gelir, panelden değiştirilmez.

## Gizlilik sekmesi

- **Tek amaç:** WhatsApp Web'de kayıtlı kişileri CSV/VCF olarak dışa aktarmak.
- **`activeTab` gerekçesi:** Kullanıcı simgeye tıkladığında yalnızca açık WhatsApp Web sekmesindeki kişi listesini okumak için.
- **`scripting` gerekçesi:** Kişi listesini okuyan fonksiyonu o sekmede çalıştırmak için.
- **Veri kullanımı:** "Kişisel iletişim bilgileri" işlenir; toplanmaz, aktarılmaz, satılmaz.
- **Gizlilik politikası adresi:** https://egejpg.github.io/contact-exporter/privacy/
- **Ana sayfa:** https://egejpg.github.io/contact-exporter/

## Marka

İsimde ve simgede "WhatsApp" markasını kullanma. Açıklamada "WhatsApp Web ile çalışır" demek yeterli; aksi halde marka şikâyetiyle kaldırılma riski artar.

## Açıklama — Türkçe

```
Telefon değiştirdin ama rehberini aktarmayı unuttun mu? WhatsApp Web kişilerini hâlâ isimleriyle gösteriyorsa, bu eklenti onları tek tıkla geri alır.

NASIL ÇALIŞIR
1. web.whatsapp.com'u aç ve sohbetlerin yüklenmesini bekle.
2. Eklenti simgesine tıkla.
3. Kişileri gözden geçir, istemediklerinin işaretini kaldır.
4. Telefona aktarmak için VCF, Excel için CSV indir.

ÖZELLİKLER
• Telefona aktarma (VCF): Dosyayı telefonuna gönderip aç, kişiler tek seferde rehbere eklenir. Android ve iPhone ile uyumlu.
• Excel'e uygun CSV: Sütunlar doğru ayrılır, numaralar bozulmaz.
• Önizleme ve arama: İsim veya numarayla ara, kişileri tek tek seç.
• Numara biçimi: +905321234567, +90 532 123 45 67, yerel yazım (0532 123 45 67), 00905321234567 ya da yalnızca rakam.
• 240'tan fazla ülke: Yerel yazımı istediğin ülkeye göre seç (ör. Almanya'da 0151 23456789). Rehberindeki ülkeler listenin başında çıkar, tercihin hatırlanır.
• İsteğe bağlı: Rehberde kayıtlı olmayan numaraları da profil adlarıyla ekle.
• Türkçe ve İngilizce arayüz.

GİZLİLİK
• Verilerin bilgisayarından hiç çıkmaz. Sunucu yok, hesap yok, takip yok.
• Eklenti yalnızca simgesine tıkladığın sekmeye, o an için erişir.
• Mesajlarını ve sohbetlerini okumaz, WhatsApp'ta hiçbir şeyi değiştirmez, mesaj göndermez.
• Açık kaynak: Kodun tamamı GitHub'da, herkes inceleyebilir. github.com/egejpg/contact-exporter-wa-web

NOTLAR
• WhatsApp Web'de oturum açık olmalıdır.
• Her kişi için WhatsApp'taki numara alınır. E-posta, adres gibi rehber bilgileri WhatsApp'ta bulunmadığı için aktarılamaz.

Bu eklenti WhatsApp LLC veya Meta Platforms ile bağlantılı değildir ve onlar tarafından onaylanmamıştır.
```

## Açıklama — İngilizce

```
Switched phones and forgot to move your contacts? If WhatsApp Web still shows them by name, this extension gets them back in one click.

HOW IT WORKS
1. Open web.whatsapp.com and wait for your chats to load.
2. Click the extension icon.
3. Review your contacts and untick the ones you don't want.
4. Download a VCF file for your phone or a CSV file for Excel.

FEATURES
• Send to your phone (VCF): Send the file to your phone and open it to add every contact at once. Works with Android and iPhone.
• Excel-ready CSV: Columns split correctly and phone numbers stay intact.
• Preview and search: Search by name or number and pick contacts one by one.
• Number formats: +905321234567, +90 532 123 45 67, local format (e.g. (202) 555-0123), 00905321234567 or digits only.
• 240+ countries: Choose which country's local format to use. Countries from your contacts appear first, and your choice is remembered.
• Optional: Also include numbers you never saved, using their WhatsApp profile names.
• English and Turkish interface.

PRIVACY
• Your data never leaves your computer. No servers, no accounts, no tracking.
• The extension only accesses the tab you click its icon on, and only at that moment.
• It doesn't read your messages or chats, change anything in WhatsApp, or send messages.
• Open source: All of the code is on GitHub for anyone to review. github.com/egejpg/contact-exporter-wa-web

NOTES
• You need to be signed in to WhatsApp Web.
• The phone number from WhatsApp is exported for each contact. Details such as email addresses or postal addresses aren't stored in WhatsApp, so they can't be exported.

This extension is not affiliated with, or endorsed by, WhatsApp LLC or Meta Platforms.
```
