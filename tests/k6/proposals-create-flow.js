import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Write-heavy happy path: cliente creates a request (DRAFT) -> publishes it ->
// provider submits a proposal. Stresses DB INSERTs and PostGIS point insertion.
// SLAs are RELAXED vs read-only flows because writes hit the DB transactionally.

const profile = __ENV.K6_PROFILE || 'smoke';

const PROFILES = {
  smoke:  { vus: 1,  duration: '30s', thresholds: { http_req_duration: ['p(95)<300'],  errors: ['rate<0.01'] } },
  load:   { vus: 10, duration: '2m',  thresholds: { http_req_duration: ['p(95)<1500'], errors: ['rate<0.05'] } },
  stress: { vus: 50, duration: '1m',  thresholds: { http_req_duration: ['p(95)<4000'], errors: ['rate<0.10'] } },
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

  const clienteRes = http.post(`${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: 'joao.silva@email.com', password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' } });

  const providerRes = http.post(`${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: 'agroservicos@email.com', password: 'password123' }),
    { headers: { 'Content-Type': 'application/json' } });

  return {
    clienteToken: clienteRes.json('accessToken'),
    providerToken: providerRes.json('accessToken'),
  };
}

export default function (data) {
  const clienteHeaders = {
    headers: {
      Authorization: `Bearer ${data.clienteToken}`,
      'Content-Type': 'application/json',
    },
  };
  const providerHeaders = {
    headers: {
      Authorization: `Bearer ${data.providerToken}`,
      'Content-Type': 'application/json',
    },
  };

  // 1) Cliente creates a DRAFT request. Coordinates target Angra do Heroismo
  // (Terceira), inside Azores bounds enforced by CreateServiceRequestDto.
  const requestPayload = JSON.stringify({
    categoryId: 1,
    title: `k6 load test request ${Date.now()}-${__VU}-${__ITER}`,
    description: 'Pedido de lavoura gerado por teste de carga k6.',
    latitude: 38.6667,
    longitude: -27.2167,
    parish: 'Sé',
    municipality: 'Angra do Heroísmo',
    island: 'Terceira',
    area: 1.5,
    areaUnit: 'hectares',
    urgency: 'MEDIUM',
  });
  const createRes = http.post(`${BASE}/api/v1/requests`, requestPayload, clienteHeaders);
  const okCreate = check(createRes, { 'request created (201)': (r) => r.status === 201 });
  errorRate.add(!okCreate);

  const requestId = createRes.json('id');
  if (!requestId) {
    sleep(1);
    return;
  }

  // 2) Publish the request so it becomes visible to providers and can accept proposals.
  const publishRes = http.post(`${BASE}/api/v1/requests/${requestId}/publish`, null, clienteHeaders);
  const okPublish = check(publishRes, { 'request published (200)': (r) => r.status === 200 });
  errorRate.add(!okPublish);

  if (!okPublish) {
    sleep(1);
    return;
  }

  // 3) Provider submits a proposal. requestId is a path param; CreateProposalDto
  // requires price + description.
  const proposalPayload = JSON.stringify({
    price: 250.00,
    pricingModel: 'FIXED',
    description: 'Proposta gerada por teste de carga k6 — lavoura com trator de 120cv.',
  });
  const proposalRes = http.post(
    `${BASE}/api/v1/requests/${requestId}/proposals`,
    proposalPayload,
    providerHeaders
  );
  const okProposal = check(proposalRes, { 'proposal created (201)': (r) => r.status === 201 });
  errorRate.add(!okProposal);

  sleep(1);
}
