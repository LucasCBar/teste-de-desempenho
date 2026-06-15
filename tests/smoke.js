// k6 run tests/smoke.js
// Etapa 1 - Smoke Test: verifica se a API está operacional antes dos testes pesados.

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,           // 1 usuário virtual
  duration: '30s',  // por 30 segundos

  thresholds: {
    http_req_failed: ['rate==0'],          // 100% de sucesso obrigatório
    http_req_duration: ['p(95)<200'],      // respostas rápidas esperadas para /health
  },
};

export default function () {
  const res = http.get('http://localhost:3000/health');

  check(res, {
    'status é 200':          (r) => r.status === 200,
    'body contém status UP': (r) => r.json('status') === 'UP',
    'resposta em < 200ms':   (r) => r.timings.duration < 200,
  });
}
