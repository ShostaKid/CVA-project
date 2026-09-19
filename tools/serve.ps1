# Máy chủ web cục bộ tối giản, để chạy sa bàn và bộ đo mà không cần cài gì thêm.
#   powershell -ExecutionPolicy Bypass -File tools\serve.ps1
#   rồi mở  http://localhost:8000/  hoặc  http://localhost:8000/tools/kiemtra.html
# Dừng bằng Ctrl+C. Chỉ phục vụ tệp bên trong thư mục gốc của repo.
#
# Cần máy chủ thật vì mở thẳng bằng file:// thì trình duyệt chặn fetch (bộ đo đọc mau.json,
# kho GitHub đọc .txt) và chặn trang cha đọc vào iframe.
param(
  [int]$Port = 8000,
  [string]$Root = (Split-Path $PSScriptRoot -Parent),
  [string]$PidFile = ""            # nếu cho, ghi PID vào đó để công cụ khác dừng đúng tiến trình này
)
$rootFull = [System.IO.Path]::GetFullPath($Root)
if ($PidFile) { $PID | Out-File -FilePath $PidFile -Encoding ascii }

# Bảng MIME: CSS gắn nhầm text/html bị trình duyệt từ chối ở chế độ chuẩn.
$mime = @{
  ".html"="text/html; charset=utf-8"; ".htm"="text/html; charset=utf-8";
  ".js"="text/javascript; charset=utf-8"; ".css"="text/css; charset=utf-8";
  ".json"="application/json; charset=utf-8"; ".txt"="text/plain; charset=utf-8";
  ".md"="text/plain; charset=utf-8";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".svg"="image/svg+xml"
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Output "Đang phục vụ $rootFull tại http://localhost:$Port/  (Ctrl+C để dừng)"
while ($listener.IsListening) {
  try {
    $ctx  = $listener.GetContext()
    $rel  = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ([string]::IsNullOrEmpty($rel)) { $rel = "index.html" }
    $file = [System.IO.Path]::GetFullPath((Join-Path $rootFull $rel))
    if (Test-Path $file -PathType Container) { $file = Join-Path $file "index.html" }
    # StartsWith chặn ../ chui ra ngoài thư mục gốc
    $ok = $file.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $file -PathType Leaf)
    if ($ok) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ctx.Response.ContentType = $(if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" })
      $ctx.Response.Headers.Add("Cache-Control", "no-store")     # sửa xong tải lại là thấy ngay
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.OutputStream.Close()
  } catch { Write-Output ("lỗi: " + $_.Exception.Message) }
}
