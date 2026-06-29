param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$ProjectName,

    [string]$Tag
)

$TemplateRepo = "https://github.com/AlexanderFarrell/spindle-template"

if (Test-Path $ProjectName) {
    Write-Error "Directory '$ProjectName' already exists."
    exit 1
}

Write-Host "Creating Spindle project '$ProjectName'..."

git clone --recurse-submodules $TemplateRepo $ProjectName
if ($LASTEXITCODE -ne 0) { exit 1 }

Push-Location $ProjectName

git remote remove origin

if ($Tag) {
    Write-Host "Checking out Spindle $Tag..."
    Push-Location spindle
    git checkout $Tag
    Pop-Location
}

# Replace placeholder names with the project name
(Get-Content package.json) -replace '"name": "your-game-here"', "`"name`": `"$ProjectName`"" | Set-Content package.json
(Get-Content game/package.json) -replace '"name": "game-name-here"', "`"name`": `"$ProjectName`"" | Set-Content game/package.json
(Get-Content game/package.json) -replace '"productName": "Game Name Here"', "`"productName`": `"$ProjectName`"" | Set-Content game/package.json
(Get-Content game/package.json) -replace 'com\.yourname\.gamenamehere', "com.example.$ProjectName" | Set-Content game/package.json
(Get-Content game/index.html) -replace '<title>Untitled Game</title>', "<title>$ProjectName</title>" | Set-Content game/index.html

Pop-Location

Write-Host ""
Write-Host "Project '$ProjectName' created successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  cd $ProjectName"
Write-Host "  npm install"
Write-Host "  npm run dev"
