import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'maria@exemplo.pt',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (loginRes.status !== 200) return;

  const token = JSON.parse(loginRes.body).accessToken;
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // List own requests
  const listRes = http.get(`${BASE_URL}/requests/mine?page=0&size=20`, authHeaders);
  check(listRes, {
    'list requests 200': (r) => r.status === 200,
    'list has content': (r) => JSON.parse(r.body).content !== undefined,
  });

  // Get single request detail
  const detailRes = http.get(`${BASE_URL}/requests/1`, authHeaders);
  check(detailRes, {
    'request detail 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}
