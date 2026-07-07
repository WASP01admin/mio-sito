# Hostinger FTP Deployment Script
# Uploads production build to www.waspnest.org

$FtpHost = "92.113.19.9"
$FtpUser = "u654299043"
$FtpPass = "AnimalFarm1984!"
$RemotePath = "/public_html"
$LocalBuildPath = "C:\Users\robbu\Documents\mio-sito\web"

Write-Host "🚀 WASP Deployment to Hostinger" -ForegroundColor Green
Write-Host "================================`n"

# Helper function to upload files via FTP
function Upload-FtpFile {
    param(
        [string]$LocalPath,
        [string]$RemotePath,
        [string]$FtpUri,
        [PSCredential]$Credential
    )

    try {
        $FtpRequest = [System.Net.FtpWebRequest]::Create($FtpUri)
        $FtpRequest.Credentials = $Credential
        $FtpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $FtpRequest.UseBinary = $true

        $FileStream = [System.IO.File]::OpenRead($LocalPath)
        $FtpRequest.GetRequestStream() | ForEach-Object {
            $FileStream.CopyTo($_)
            $_.Close()
        }
        $FileStream.Close()

        $Response = $FtpRequest.GetResponse()
        $Response.Close()
        return $true
    }
    catch {
        Write-Host "✗ Error uploading $(Split-Path $LocalPath -Leaf): $_" -ForegroundColor Red
        return $false
    }
}

function Create-FtpDirectory {
    param(
        [string]$FtpUri,
        [PSCredential]$Credential
    )

    try {
        $FtpRequest = [System.Net.FtpWebRequest]::Create($FtpUri)
        $FtpRequest.Credentials = $Credential
        $FtpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $Response = $FtpRequest.GetResponse()
        $Response.Close()
    }
    catch {
        # Directory might already exist, ignore error
    }
}

# Create FTP credentials
$Credential = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)

Write-Host "Uploading build artifacts...`n"

# List of files and folders to upload
$FilesToUpload = @(
    @{Local = "$LocalBuildPath\package.json"; Remote = "$RemotePath/package.json" },
    @{Local = "$LocalBuildPath\package-lock.json"; Remote = "$RemotePath/package-lock.json" }
)

# Upload individual files
$uploadedCount = 0
foreach ($file in $FilesToUpload) {
    $filename = Split-Path $file.Local -Leaf
    Write-Host "Uploading $filename..." -NoNewline

    if (Test-Path $file.Local) {
        $FtpUri = "ftp://$FtpHost$($file.Remote)"
        if (Upload-FtpFile -LocalPath $file.Local -RemotePath $file.Remote -FtpUri $FtpUri -Credential $Credential) {
            Write-Host " ✓" -ForegroundColor Green
            $uploadedCount++
        }
    }
    else {
        Write-Host " ✗ (file not found)" -ForegroundColor Red
    }
}

Write-Host "`nNote: Large folder uploads (.next, public) are best handled with WinSCP or FileZilla GUI."
Write-Host "Use these tools to upload:"
Write-Host "  • Local: $LocalBuildPath\.next → Remote: $RemotePath/.next"
Write-Host "  • Local: $LocalBuildPath\public → Remote: $RemotePath/public"
Write-Host "`nFiles uploaded via FTP: $uploadedCount/2"
Write-Host "`n📋 Next steps:"
Write-Host "  1. Upload .next and public folders using FileZilla or WinSCP"
Write-Host "  2. SSH into server: ssh u654299043@92.113.19.9"
Write-Host "  3. cd ~/public_html && npm install --production"
Write-Host "  4. Create .env.production with database credentials"
Write-Host "  5. Set up Node.js app in Hostinger cPanel"
Write-Host "  6. Visit https://www.waspnest.org to verify"
