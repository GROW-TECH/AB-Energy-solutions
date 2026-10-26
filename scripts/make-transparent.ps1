Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location).Path "public\logo.jpg"
$dstPath = Join-Path (Get-Location).Path "public\logo.png"

$original = [System.Drawing.Bitmap]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap($original.Width, $original.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($x = 0; $x -lt $original.Width; $x++) {
    for ($y = 0; $y -lt $original.Height; $y++) {
        $c = $original.GetPixel($x, $y)
        # Check if pixel is white / background
        if ($c.R -gt 238 -and $c.G -gt 238 -and $c.B -gt 238) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Smooth anti-aliased edge
            if ($c.R -gt 215 -and $c.G -gt 215 -and $c.B -gt 215) {
                $avg = ($c.R + $c.G + $c.B) / 3
                $alpha = [int](255 * (1.0 - ($avg - 215) / 24.0))
                if ($alpha -lt 0) { $alpha = 0 }
                if ($alpha -gt 255) { $alpha = 255 }
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
            } else {
                $bmp.SetPixel($x, $y, $c)
            }
        }
    }
}

$bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$original.Dispose()
Write-Output "Transparent logo created successfully at: $dstPath"
