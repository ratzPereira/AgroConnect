import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const profile = __ENV.K6_PROFILE || 'smoke';

const PROFILES = {
  smoke:  { vus: 1,  duration: '30s', thresholds: { http_req_duration: ['p(95)<200'],  errors: ['rate<0.01'] } },
  load:   { vus: 10, duration: '2m',  thresholds: { http_req_duration: ['p(95)<1000'], errors: ['rate<0.05'] } },
  stress: { vus: 50, duration: '1m',  thresholds: { http_req_duration: ['p(95)<2500'], errors: ['rate<0.10'] } },
};

const cfg = PROFILES[profile];
if (!cfg) throw new Error(`Unknown K6_PROFILE: ${profile}`);

const errorRate = new Rate('errors');

export const options = {
  vus: cfg.vus,
  duration: cfg.duration,
  thresholds: cfg.thresholds,
  summaryTrendStats: ['min', 'med', 'avg', 'p(95)', 'p(99)', 'max'],
};

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export function setup() {
  const res = http.get(`${BASE}/api/actuator/health`);
  if (res.status !== 200) throw new Error('Backend not healthy');
  return {};
}

export default function () {
  const payload = JSON.stringify({
    email: 'joao.silva@email.com',
    password: 'password123',
  });
  // Unique X-Forwarded-For per request so each login lands in its own
  // rate-limit bucket (login is capped at 5/60s per IP). This measures raw
  // login latency for the baseline, bypassing only the protective cap.
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.0.${__VU}.${__ITER % 250}`,
    },
  };

  const res = http.post(`${BASE}/api/v1/auth/login`, payload, params);

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'has accessToken': (r) => !!r.json('accessToken'),
  });
  errorRate.add(!ok);

  sleep(1);
}
