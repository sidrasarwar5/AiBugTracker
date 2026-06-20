# Bug Tracker -- Seed Test Data via API
# Run this from PowerShell while your Django server is running
# (python manage.py runserver) in another window.
#
# Usage:  .\seed_test_data.ps1

$base = "http://127.0.0.1:8000/api"

Write-Host "=== 1. Signing up Ali (Manager) ===" -ForegroundColor Cyan
$aliBody = @{ full_name = "Ali Ahmed"; email = "ali@gmail.com"; password = "testpass123"; role = "manager" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$base/auth/signup/" -Method Post -Body $aliBody -ContentType "application/json" | Out-Null
    Write-Host "Created Ali" -ForegroundColor Green
} catch {
    Write-Host "Ali signup skipped (maybe already exists): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "=== 2. Signing up Sarah (QA) ===" -ForegroundColor Cyan
$sarahBody = @{ full_name = "Sarah Khan"; email = "sarah@gmail.com"; password = "testpass123"; role = "qa" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$base/auth/signup/" -Method Post -Body $sarahBody -ContentType "application/json" | Out-Null
    Write-Host "Created Sarah" -ForegroundColor Green
} catch {
    Write-Host "Sarah signup skipped (maybe already exists): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "=== 3. Signing up John (Developer) ===" -ForegroundColor Cyan
$johnBody = @{ full_name = "John Smith"; email = "john@gmail.com"; password = "testpass123"; role = "developer" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$base/auth/signup/" -Method Post -Body $johnBody -ContentType "application/json" | Out-Null
    Write-Host "Created John" -ForegroundColor Green
} catch {
    Write-Host "John signup skipped (maybe already exists): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "=== 4. Logging in as Ali ===" -ForegroundColor Cyan
$loginBody = @{ email = "ali@gmail.com"; password = "testpass123" } | ConvertTo-Json
$aliLogin = Invoke-RestMethod -Uri "$base/auth/login/" -Method Post -Body $loginBody -ContentType "application/json"
$aliToken = $aliLogin.access
Write-Host "Logged in as Ali" -ForegroundColor Green

Write-Host "=== 5. Ali creates project 'E-commerce Website' ===" -ForegroundColor Cyan
$headers = @{ Authorization = "Bearer $aliToken" }
$projectBody = @{ name = "E-commerce Website"; description = "Our online shop" } | ConvertTo-Json
try {
    $project = Invoke-RestMethod -Uri "$base/projects/" -Method Post -Body $projectBody -ContentType "application/json" -Headers $headers
    Write-Host "Created project: $($project.id)" -ForegroundColor Green
} catch {
    Write-Host "Project creation failed, fetching existing projects instead..." -ForegroundColor Yellow
    $projects = Invoke-RestMethod -Uri "$base/projects/" -Method Get -Headers $headers
    $project = $projects[0]
}
$projectId = $project.id

Write-Host "=== 6. Ali adds Sarah as QA ===" -ForegroundColor Cyan
$addSarahBody = @{ email = "sarah@gmail.com"; role = "qa" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$base/projects/$projectId/add-member/" -Method Post -Body $addSarahBody -ContentType "application/json" -Headers $headers | Out-Null
    Write-Host "Sarah added as QA" -ForegroundColor Green
} catch {
    Write-Host "Sarah add skipped (maybe already a member): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "=== 7. Ali adds John as Developer ===" -ForegroundColor Cyan
$addJohnBody = @{ email = "john@gmail.com"; role = "developer" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$base/projects/$projectId/add-member/" -Method Post -Body $addJohnBody -ContentType "application/json" -Headers $headers | Out-Null
    Write-Host "John added as Developer" -ForegroundColor Green
} catch {
    Write-Host "John add skipped (maybe already a member): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "=== 8. Logging in as Sarah ===" -ForegroundColor Cyan
$sarahLoginBody = @{ email = "sarah@gmail.com"; password = "testpass123" } | ConvertTo-Json
$sarahLogin = Invoke-RestMethod -Uri "$base/auth/login/" -Method Post -Body $sarahLoginBody -ContentType "application/json"
$sarahToken = $sarahLogin.access
$sarahHeaders = @{ Authorization = "Bearer $sarahToken" }

Write-Host "=== 9. Sarah creates a bug: 'Login button not working' ===" -ForegroundColor Cyan
$bugBody = @{
    title       = "Login button not working"
    description = "Nothing happens on click"
    type        = "bug"
    project     = $projectId
} | ConvertTo-Json
try {
    $bug = Invoke-RestMethod -Uri "$base/bugs/" -Method Post -Body $bugBody -ContentType "application/json" -Headers $sarahHeaders
    Write-Host "Created bug: $($bug.id)" -ForegroundColor Green
} catch {
    Write-Host "Bug creation failed (maybe already exists): $($_.Exception.Message)" -ForegroundColor Yellow
    $bugs = Invoke-RestMethod -Uri "$base/bugs/?project=$projectId" -Method Get -Headers $sarahHeaders
    $bug = $bugs[0]
}
$bugId = $bug.id

Write-Host "=== 10. Sarah assigns the bug to John ===" -ForegroundColor Cyan
$johnLoginBody = @{ email = "john@gmail.com"; password = "testpass123" } | ConvertTo-Json
$johnLogin = Invoke-RestMethod -Uri "$base/auth/login/" -Method Post -Body $johnLoginBody -ContentType "application/json"
$johnId = $johnLogin.user.id

$assignBody = @{ assigned_to_id = $johnId } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri "$base/bugs/$bugId/assign/" -Method Post -Body $assignBody -ContentType "application/json" -Headers $sarahHeaders | Out-Null
    Write-Host "Bug assigned to John" -ForegroundColor Green
} catch {
    Write-Host "Assign skipped: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DONE. Test accounts (all use password: testpass123) ===" -ForegroundColor Magenta
Write-Host "Manager:   ali@gmail.com"
Write-Host "QA:        sarah@gmail.com"
Write-Host "Developer: john@gmail.com"
Write-Host ""
Write-Host "Project ID: $projectId"
Write-Host "Bug ID:     $bugId"