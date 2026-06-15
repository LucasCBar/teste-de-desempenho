// k6 run tests/spike.js
// Etapa 4 - Teste de Pico (Spike): simula Flash Sale — queda e subida abruptas de usuários.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10  }, // Carga baixa: linha de base com 10 usuários
    { duration: '10s', target: 300 }, // Spike: salto imediato para 300 usuários
    { duration: '1m',  target: 300 }, // Manter pico por 1 minuto
    { duration: '10s', target: 10  }, // Queda imediata de volta para 10 usuários
    { duration: '30s', target: 10  }, // Observar estabilização pós-pico
  ],

  thresholds: {
    http_req_duration: ['p(95)<1000'], // SLA relaxado para spike: p95 < 1s
    http_req_failed:   ['rate<0.05'],  // menos de 5% de erros aceitável durante o pico
  },
};

export default function () {
  const payload = JSON.stringify({ userId: `user_${__VU}`, productId: 'FLASH-SALE-001' });
  const params  = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post('http://localhost:3000/checkout/simple', payload, params);

  check(res, {
    'status é 201':      (r) => r.status === 201,
    'resposta APPROVED': (r) => r.json('status') === 'APPROVED',
  });

  sleep(1);
}
