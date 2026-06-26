<#
DesignAI one-shot deploy + seed + smoke orchestrator (Windows / PowerShell).

Wraps work that already exists, in the order already decided. Every step is a
HARD STOP on failure with the actual reason surfaced — no cascading red herrings.

Usage:
  ./deploy.ps1                          # full: preflight -> deploy -> seed -> smoke
  ./deploy.ps1 -SkipDeploy              # redeploy skipped; just seed + smoke
  ./deploy.ps1 -Region us-east-1

Final line is unambiguous:
  "DEMO-READY: ..."   (clean pass, baseline saved)
  "BLOCKED at <step>: <reason>"  (single line, names the broken step)
#>
param(
  [string]$Region = "us-east-1",
  [switch]$SkipDeploy,
  [switch]$SkipSeed,
  [string]$Image = "../seed/sample_room.jpg"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$infra = Join-Path $root "infrastructure"
$backend = Join-Path $root "backend"

function Fail([string]$step, [string]$reason) {
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor Red
  Write-Host "BLOCKED at $step`: $reason" -ForegroundColor Red
  Write-Host "============================================================" -ForegroundColor Red
  exit 1
}

function Step([string]$msg) { Write-Host "`n>>> $msg" -ForegroundColor Cyan }

# ---------------------------------------------------------------------------
# 0. Pre-flight: accountId placeholder + Bedrock model access
# ---------------------------------------------------------------------------
Step "Pre-flight checks"

$cdkJsonPath = Join-Path $infra "cdk.json"
$cdkJson = Get-Content $cdkJsonPath -Raw
if ($cdkJson -match "REPLACE_WITH_ACCOUNT_ID") {
  Fail "preflight (accountId)" "infrastructure/cdk.json still has REPLACE_WITH_ACCOUNT_ID. Set the real account id before deploying."
}
Write-Host "  [PASS] cdk.json accountId is set" -ForegroundColor Green

Push-Location $backend
try {
  python -m scripts.preflight_bedrock --region $Region
  if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Fail "preflight (Bedrock)" "Required Bedrock models are not ACTIVE in $Region. Enable them in Bedrock console -> Model access. (This is the IAM-error red herring if skipped.)"
  }
} finally {
  if ((Get-Location).Path -eq $backend) { Pop-Location }
}
Write-Host "  [PASS] Bedrock models ACTIVE" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 1. Deploy stacks (AI first so SageMaker warm-up clock starts immediately)
# ---------------------------------------------------------------------------
if (-not $SkipDeploy) {
  Push-Location $infra
  try {
    if (-not (Test-Path (Join-Path $infra "node_modules"))) {
      Step "Installing CDK dependencies (npm install)"
      npm install
      if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "npm install" "CDK dependency install failed." }
    }

    Step "Deploying network + AI stacks FIRST"
    Write-Host "    NOTE: SageMaker endpoints (SAM2/Depth/ControlNet/SDXL) take ~8-15 min to warm up." -ForegroundColor Yellow
    Write-Host "    This is EXPECTED, not a stall. data/auth/api/pipeline deploy while they warm." -ForegroundColor Yellow
    npx cdk deploy designai-network designai-ai --require-approval never
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "cdk deploy (network/ai)" "Network or AI stack deploy failed. Check CloudFormation console for the failing resource." }

    Step "Deploying data + auth stacks"
    npx cdk deploy designai-data designai-auth --require-approval never
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "cdk deploy (data/auth)" "Data or Auth stack deploy failed." }

    Step "Deploying api + pipeline stacks"
    npx cdk deploy designai-api designai-pipeline --require-approval never
    if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "cdk deploy (api/pipeline)" "API or Pipeline stack deploy failed." }
  } finally {
    if ((Get-Location).Path -eq $infra) { Pop-Location }
  }
  Write-Host "  [PASS] all stacks deployed" -ForegroundColor Green
} else {
  Write-Host "  [SKIP] -SkipDeploy set; using existing stacks" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# Resolve API + WS URLs from CloudFormation outputs
# ---------------------------------------------------------------------------
Step "Resolving deployed endpoint URLs"
$apiUrl = (aws cloudformation list-exports --region $Region --query "Exports[?Name=='designai-api-url'].Value" --output text 2>$null)
$wsUrl  = (aws cloudformation list-exports --region $Region --query "Exports[?Name=='designai-ws-url'].Value" --output text 2>$null)
if ([string]::IsNullOrWhiteSpace($apiUrl) -or $apiUrl -eq "None") {
  Fail "resolve URLs" "Could not read 'designai-api-url' export. Did the api stack deploy succeed?"
}
Write-Host "  API: $apiUrl" -ForegroundColor Green
Write-Host "  WS : $wsUrl" -ForegroundColor Green

# ---------------------------------------------------------------------------
# 2. Seed OpenSearch — MUST verify before smoke test runs
# ---------------------------------------------------------------------------
if (-not $SkipSeed) {
  Step "Seeding OpenSearch furniture-index (with 3-query verification)"
  Push-Location $backend
  try {
    python -m scripts.seed_opensearch ../seed/products.json
    if ($LASTEXITCODE -ne 0) {
      Pop-Location
      Fail "seed (OpenSearch)" "Seed or its sample-query verification failed. Retrieval would fail downstream for an upstream reason; stopping before smoke test."
    }
  } finally {
    if ((Get-Location).Path -eq $backend) { Pop-Location }
  }
  Write-Host "  [PASS] OpenSearch seeded and sample queries returned results" -ForegroundColor Green
} else {
  Write-Host "  [SKIP] -SkipSeed set" -ForegroundColor Yellow
}

# ---------------------------------------------------------------------------
# 3. Smoke test against the LIVE API + WS, saving the baseline
# ---------------------------------------------------------------------------
Step "Running end-to-end smoke test against live API"
Push-Location $backend
try {
  $baselineDir = Join-Path $backend "baselines"
  if (-not (Test-Path $baselineDir)) { New-Item -ItemType Directory -Force -Path $baselineDir | Out-Null }
  $baseline = Join-Path $baselineDir ("baseline-{0}.json" -f (Get-Date -Format "yyyyMMdd-HHmmss"))

  python -m scripts.smoke_test --image $Image --api-url $apiUrl --ws-url $wsUrl --save-baseline $baseline
  $smokeExit = $LASTEXITCODE
} finally {
  if ((Get-Location).Path -eq $backend) { Pop-Location }
}

Write-Host ""
if ($smokeExit -eq 0) {
  Write-Host "============================================================" -ForegroundColor Green
  Write-Host "DEMO-READY: pipeline passed end-to-end. Baseline saved." -ForegroundColor Green
  Write-Host "API: $apiUrl" -ForegroundColor Green
  Write-Host "============================================================" -ForegroundColor Green
  exit 0
} else {
  Fail "smoke test" "End-to-end run failed. See the per-stage [FAIL] line above for the exact broken stage + reason."
}
