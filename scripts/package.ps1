# Chrome Web Store'a yüklenecek zip'i üretir: dist/contact-exporter-wa-web-<sürüm>.zip
# manifest.json zip'in kök dizininde olur.
# Compress-Archive kullanılmıyor: Windows PowerShell 5.1'de yolları "icons\icon16.png"
# şeklinde ters eğik çizgiyle yazıyor, Chrome bu dosyaları bulamayabiliyor.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$src = (Resolve-Path (Join-Path $root 'extension')).Path
$version = (Get-Content (Join-Path $src 'manifest.json') -Raw | ConvertFrom-Json).version
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force $dist | Out-Null
$zipPath = Join-Path $dist "contact-exporter-wa-web-$version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
  Get-ChildItem $src -Recurse -File | ForEach-Object {
    $entry = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entry, 'Optimal') | Out-Null
  }
} finally {
  $zip.Dispose()
}
Write-Host "Hazir: $zipPath"
