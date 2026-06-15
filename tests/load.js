// k6 run tests/load.js
// Etapa 2 - Teste de Carga: simula pico esperado de 50 usuários simultâneos (promoção de marketing).

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m',  target: 50 }, // Ramp-up: 0 → 50 usuários em 1 minuto
    { duration: '2m',  target: 50 }, // Platô: mantém 50 usuários por 2 minutos
    { duration: '30s', target: 0  }, // Ramp-down: 50 → 0 usuários em 30 segundos
  ],

  // SLA definido pelo enunciado
  thresholds: {
    http_req_duration: ['p(95)<500'], // p95 da latência < 500ms
    http_req_failed:   ['rate<0.01'], // taxa de erros < 1%
  },
};

export default function () {
  const payload = JSON.stringify({ userId: `user_${__VU}`, productId: 'PROMO-001' });
  const params  = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post('http://localhost:3000/checkout/simple', payload, params);

  check(res, {
    'status é 201':           (r) => r.status === 201,
    'resposta APPROVED':      (r) => r.json('status') === 'APPROVED',
    'latência < 500ms':       (r) => r.timings.duration < 500,
  });

  sleep(1); // pacing: simula tempo de "pensar" do usuário
}
