# k6 Load Tests

## Scripts

| Script | What it tests |
|---|---|
| `auth-flow.js` | POST /auth/login |
| `requests-flow.js` | Cliente reads (`GET /requests/mine`, `GET /categories`) |
| `proposals-flow.js` | Provider reads (`GET /requests/available`, `GET /proposals/mine`) |
| `proposals-create-flow.js` | Write-heavy: cliente creates request, provider submits proposal |

## Profiles

| Profile | VUs × Duration | p95 SLA | Err SLA |
|---|---|---|---|
| `smoke` | 1 × 30s | <200ms (write: 300ms) | <1% |
| `load`  | 10 × 2m | <1000ms (write: 1500ms) | <5% |
| `stress`| 50 × 1m | <2500ms (write: 4000ms) | <10% |

## Run

```bash
# 1. Reset backend to clean seed
cd C:/AgroConnect
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
sleep 30  # wait for Flyway + seeds

# 2. Run all scripts × all profiles
bash tests/k6/run-all.sh

# 3. Generate markdown report
python3 tests/k6/generate-report.py > docs/performance/$(date +%Y-%m-%d)-load-test-results.md
```

## Tuning

- Override base URL: `BASE_URL=https://staging.agroconnect.pt bash run-all.sh`
- Run single script: `K6_PROFILE=load k6 run auth-flow.js`

## Windows tip

When piping `generate-report.py` to a file on Windows, the default `cp1252` stdout encoding will mangle the em-dashes (`—`). Force UTF-8:

```bash
PYTHONIOENCODING=utf-8 python tests/k6/generate-report.py > docs/performance/$(date +%Y-%m-%d)-load-test-results.md
```
