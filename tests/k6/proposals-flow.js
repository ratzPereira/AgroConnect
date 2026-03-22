import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';

export default function () {
  // Login as provider
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'antonio@exemplo.pt',
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

  // List available requests
  const listRes = http.get(`${BASE_URL}/requests/available?page=0&size=20`, authHeaders);
  check(listRes, {
    'available requests 200': (r) => r.status === 200,
  });

  // Get own proposals
  const proposalsRes = http.get(`${BASE_URL}/proposals/mine`, authHeaders);
  check(proposalsRes, {
    'my proposals 200': (r) => r.status === 200,
  });

  sleep(1);
}
