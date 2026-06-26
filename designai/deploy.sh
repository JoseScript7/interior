#!/usr/bin/env bash
#
# DesignAI one-shot deploy + seed + smoke orchestrator (Linux / macOS / CI).
# Wraps existing work in the already-decided order. HARD STOP on any failure,
# with the actual reason surfaced. Final line is unambiguous.
#
# Usage:
#   ./deploy.sh                      # full: preflight -> deploy -> seed -> smoke
#   SKIP_DEPLOY=1 ./deploy.sh        # redeploy skipped; just seed + smoke
#   REGION=us-east-1 ./deploy.sh
#
set -euo pipefail

REGION="${REGION:-us-east-1}"
IMAGE="${IMAGE:-../seed/sample_room.jpg}"
SKIP_DEPLOY="${SKIP_DEPLOY:-0}"
SKIP_SEED="${SKIP_SEED:-0}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA="$ROOT/infrastructure"
BACKEND="$ROOT/backend"

RED='\033[91m'; GREEN='\033[92m'; YELLOW='\033[93m'; CYAN='\033[96m'; NC='\033[0m'

fail() {
  echo ""
  echo -e "${RED}============================================================${NC}"
  echo -e "${RED}BLOCKED at $1: $2${NC}"
  echo -e "${RED}============================================================${NC}"
  exit 1
}
step() { echo -e "\n${CYAN}>>> $1${NC}"; }

# 0. Pre-flight ---------------------------------------------------------------
step "Pre-flight checks"
if grep -q "REPLACE_WITH_ACCOUNT_ID" "$INFRA/cdk.json"; then
  fail "preflight (accountId)" "infrastructure/cdk.json still has REPLACE_WITH_ACCOUNT_ID. Set the real account id first."
fi
echo -e "${GREEN}  [PASS] cdk.json accountId is set${NC}"

( cd "$BACKEND" && python -m scripts.preflight_bedrock --region "$REGION" ) \
  || fail "preflight (Bedrock)" "Required Bedrock models not ACTIVE in $REGION. Enable in Bedrock console -> Model access. (This is the IAM-error red herring if skipped.)"
echo -e "${GREEN}  [PASS] Bedrock models ACTIVE${NC}"

# 1. Deploy (AI first to start the 8-15 min SageMaker warm-up clock) ----------
if [ "$SKIP_DEPLOY" != "1" ]; then
  cd "$INFRA"
  if [ ! -d node_modules ]; then
    step "Installing CDK dependencies (npm install)"
    npm install || fail "npm install" "CDK dependency install failed."
  fi

  step "Deploying network + AI stacks FIRST"
  echo -e "${YELLOW}    NOTE: SageMaker endpoints take ~8-15 min to warm up. EXPECTED, not a stall.${NC}"
  echo -e "${YELLOW}    data/auth/api/pipeline deploy while they warm.${NC}"
  npx cdk deploy designai-network designai-ai --require-approval never \
    || fail "cdk deploy (network/ai)" "Network/AI stack deploy failed. Check CloudFormation console."

  step "Deploying data + auth stacks"
  npx cdk deploy designai-data designai-auth --require-approval never \
    || fail "cdk deploy (data/auth)" "Data/Auth stack deploy failed."

  step "Deploying api + pipeline stacks"
  npx cdk deploy designai-api designai-pipeline --require-approval never \
    || fail "cdk deploy (api/pipeline)" "API/Pipeline stack deploy failed."

  cd "$ROOT"
  echo -e "${GREEN}  [PASS] all stacks deployed${NC}"
else
  echo -e "${YELLOW}  [SKIP] SKIP_DEPLOY=1; using existing stacks${NC}"
fi

# Resolve endpoint URLs -------------------------------------------------------
step "Resolving deployed endpoint URLs"
API_URL="$(aws cloudformation list-exports --region "$REGION" --query "Exports[?Name=='designai-api-url'].Value" --output text 2>/dev/null || true)"
WS_URL="$(aws cloudformation list-exports --region "$REGION" --query "Exports[?Name=='designai-ws-url'].Value" --output text 2>/dev/null || true)"
if [ -z "$API_URL" ] || [ "$API_URL" = "None" ]; then
  fail "resolve URLs" "Could not read 'designai-api-url' export. Did the api stack deploy succeed?"
fi
echo -e "${GREEN}  API: $API_URL${NC}"
echo -e "${GREEN}  WS : $WS_URL${NC}"

# 2. Seed (verify before smoke) ----------------------------------------------
if [ "$SKIP_SEED" != "1" ]; then
  step "Seeding OpenSearch furniture-index (with 3-query verification)"
  ( cd "$BACKEND" && python -m scripts.seed_opensearch ../seed/products.json ) \
    || fail "seed (OpenSearch)" "Seed or sample-query verification failed. Stopping before smoke test so retrieval failures aren't misattributed to the render worker."
  echo -e "${GREEN}  [PASS] OpenSearch seeded; sample queries returned results${NC}"
else
  echo -e "${YELLOW}  [SKIP] SKIP_SEED=1${NC}"
fi

# 3. Smoke test against live API ---------------------------------------------
step "Running end-to-end smoke test against live API"
cd "$BACKEND"
mkdir -p baselines
BASELINE="baselines/baseline-$(date +%Y%m%d-%H%M%S).json"
if python -m scripts.smoke_test --image "$IMAGE" --api-url "$API_URL" --ws-url "$WS_URL" --save-baseline "$BASELINE"; then
  echo ""
  echo -e "${GREEN}============================================================${NC}"
  echo -e "${GREEN}DEMO-READY: pipeline passed end-to-end. Baseline: $BASELINE${NC}"
  echo -e "${GREEN}API: $API_URL${NC}"
  echo -e "${GREEN}============================================================${NC}"
  exit 0
else
  fail "smoke test" "End-to-end run failed. See the per-stage [FAIL] line above for the exact broken stage + reason."
fi
