# A tiny web server for previewing the site at http://localhost:8765/
# (pages load shared .js files, which some previews can't do from plain files).
param([string]$Root = (Split-Path $PSScriptRoot -Parent), [int]$Port = 8765)
$Root = [IO.Path]::GetFullPath($Root)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/"
$types = @{ ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".css" = "text/css" }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($path -eq "") { $path = "index.html" }
  $file = [IO.Path]::GetFullPath((Join-Path $Root $path))
  if ((Test-Path $file -PathType Leaf) -and $file.StartsWith($Root)) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ext = [IO.Path]::GetExtension($file)
    $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" }
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
