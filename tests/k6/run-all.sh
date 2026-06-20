#!/usr/bin/env bash
set -euo pipefail
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_DIR="$BASE_DIR/results"
mkdir -p "$RESULTS_DIR"
BASE_URL="${BASE_URL:-http://localhost:8080}"

echo "==> Checking backend health at $BASE_URL"
if ! curl -fsS "$BASE_URL/actuator/health" >/dev/null; then
  echo "ERROR: backend not healthy at $BASE_URL"
  echo "Run: docker-compose -f docker-compose.dev.yml up -d   (then wait ~30s)"
  exit 1
fi

SCRIPTS=("auth-flow" "proposals-flow" "requests-flow" "proposals-create-flow")
PROFILES=("smoke" "load" "stress")

for script in "${SCRIPTS[@]}"; do
  for profile in "${PROFILES[@]}"; do
    OUT="$RESULTS_DIR/summary-${script}-${profile}.json"
    echo "==> Running ${script} (${profile}) -> $OUT"
    K6_PROFILE="$profile" BASE_URL="$BASE_URL" \
      k6 run --summary-export="$OUT" --no-color "$BASE_DIR/${script}.js" \
      || echo "WARN: ${script} (${profile}) had threshold breaches"
  done
done

echo "==> All runs complete. Results in $RESULTS_DIR"
echo "==> Generate markdown report:"
echo "    python3 $BASE_DIR/generate-report.py > docs/performance/$(date +%Y-%m-%d)-load-test-results.md"
