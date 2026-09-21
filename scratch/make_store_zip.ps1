Add-Type -AssemblyName System.IO.Compression.FileSystem
$source = "d:\ANtigravity\Orion 9"
$destination = "D:\ANtigravity\Orion-9-Full-Project-400MB+.zip"
if (Test-Path $destination) { Remove-Item $destination -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($source, $destination, [System.IO.Compression.CompressionLevel]::NoCompression, $false)
Write-Host "Zip created successfully at $destination"
