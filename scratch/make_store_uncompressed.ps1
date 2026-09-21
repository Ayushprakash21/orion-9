Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$destPath = "D:\ANtigravity\Orion-9-Full-Project-Uncompressed-400MB+.zip"
if (Test-Path $destPath) { Remove-Item $destPath -Force }

$zip = [System.IO.Compression.ZipFile]::Open($destPath, [System.IO.Compression.ZipArchiveMode]::Create)
$basePath = "d:\ANtigravity\Orion 9"

Get-ChildItem $basePath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $rel = $_.FullName.Substring($basePath.Length + 1)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::NoCompression)
}

$zip.Dispose()
Write-Host "Done creating uncompressed ZIP at $destPath"
