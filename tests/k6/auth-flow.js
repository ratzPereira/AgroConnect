import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api/v1';

export default function () {
  // Login
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'maria@exemplo.pt',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has accessToken': (r) => JSON.parse(r.body).accessToken !== undefined,
  });

  if (loginRes.status !== 200) return;

  const token = JSON.parse(loginRes.body).accessToken;
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Get profile
  const profileRes = http.get(`${BASE_URL}/profile/me`, authHeaders);
  check(profileRes, {
    'profile status 200': (r) => r.status === 200,
  });

  sleep(1);
}
