// k6 run tests/stress.js
// Etapa 3 - Teste de Estresse: descobre o ponto de ruptura do endpoint CPU-bound (/checkout/crypto).
// Observar: momento em que latência sobe exponencialmente ou ocorrem timeouts.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 200  }, // 0 → 200 usuários em 2 minutos
    { duration: '2m', target: 500  }, // 200 → 500 usuários em 2 minutos
    { duration: '2m', target: 1000 }, // 500 → 1000 usuários em 2 minutos
    { duration: '1m', target: 0    }, // Ramp-down / recuperação
  ],

  // Sem thresholds rígidos — objetivo é observar a degradação, não bloquear o teste
  thresholds: {
    http_req_duration: ['p(95)<10000'], // limite amplo apenas para não travar o runner
    http_req_failed:   ['rate<0.50'],   // aceita até 50% de erro para coletar dados do ponto de ruptura
  },
};

export default function () {
  const payload = JSON.stringify({ userId: `user_${__VU}`, operation: 'HASH' });
  const params  = {
    headers: { 'Content-Type': 'application/json' },
    timeout: '15s', // timeout explícito para evitar stall indefinido
  };

  const res = http.post('http://localhost:3000/checkout/crypto', payload, params);

  check(res, {
    'status é 201':                (r) => r.status === 201,
    'resposta SECURE_TRANSACTION': (r) => r.json('status') === 'SECURE_TRANSACTION',
  });

  sleep(0.5); // pacing reduzido para maximizar pressão sobre a CPU
}
