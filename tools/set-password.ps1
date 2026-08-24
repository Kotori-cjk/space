$ErrorActionPreference = 'Stop'
$securePassword = Read-Host 'Enter the new Space password' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $salt = New-Object byte[] 16
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $random.GetBytes($salt)
    } finally {
        $random.Dispose()
    }
    $derive = [Security.Cryptography.Rfc2898DeriveBytes]::new(
        $password,
        $salt,
        310000,
        [Security.Cryptography.HashAlgorithmName]::SHA256
    )
    try {
        $hash = $derive.GetBytes(32)
    } finally {
        $derive.Dispose()
    }
    $configPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'gate-config.js'
    $content = @"
window.SPACE_GATE_CONFIG = Object.freeze({
  iterations: 310000,
  salt: '$([Convert]::ToBase64String($salt))',
  hash: '$([Convert]::ToBase64String($hash))'
});
"@
    $utf8NoBom = New-Object Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($configPath, $content, $utf8NoBom)
    Write-Host 'Password hash written to gate-config.js. The password was not saved.' -ForegroundColor Green
} finally {
    if ($pointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
    $password = $null
}
