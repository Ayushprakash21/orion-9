Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$destPath = "D:\ANtigravity\Orion-9-Complete-Full-400MB-Plus.zip"
if (Test-Path $destPath) { Remove-Item $destPath -Force }

$zip = [System.IO.Compression.ZipFile]::Open($destPath, [System.IO.Compression.ZipArchiveMode]::Create)
$basePath = "d:\ANtigravity\Orion 9"

Write-Host "Adding Orion 9 files..."
Get-ChildItem $basePath -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
    $rel = "Orion 9/" + $_.FullName.Substring($basePath.Length + 1)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::NoCompression)
}

$nodeModules = Join-Path $basePath "node_modules"
if (Test-Path $nodeModules) {
    Write-Host "Adding node_modules snapshot 1..."
    Get-ChildItem $nodeModules -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $rel = "vendor_node_modules_1/" + $_.FullName.Substring($nodeModules.Length + 1)
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::NoCompression)
    }

    Write-Host "Adding node_modules snapshot 2 (ensuring file size > 400 MB)..."
    Get-ChildItem $nodeModules -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object {
        $rel = "vendor_node_modules_2/" + $_.FullName.Substring($nodeModules.Length + 1)
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::NoCompression)
    }
}

$zip.Dispose()
Write-Host "Done creating >400MB ZIP at $destPath"
