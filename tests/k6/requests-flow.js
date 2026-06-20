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
  const health = http.get(`${BASE}/api/actuator/health`);
  if (health.status !== 200) throw new Error('Backend not healthy');
  const loginRes = http.post(`${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: 'joao.silva@email.com', password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' } });
  return { token: loginRes.json('accessToken') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  const r1 = http.get(`${BASE}/api/v1/requests/mine`, params);
  const r2 = http.get(`${BASE}/api/v1/categories`, params);
  const ok = check(r1, { 'requests 200': (r) => r.status === 200 }) &&
             check(r2, { 'categories 200': (r) => r.status === 200 });
  errorRate.add(!ok);
  sleep(1);
}
