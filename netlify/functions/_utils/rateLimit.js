// ==========================================
// Rate limiting via Upstash Redis REST API
// ==========================================
// Usa a API REST do Upstash (sem SDK, sem conexão persistente —
// funciona bem em serverless). Janela fixa por IP + rota.
//
// Env vars necessárias (Netlify > Site settings > Environment variables):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Verifica e incrementa o contador de requisições de um IP para uma rota.
 * @param {string} ip
 * @param {string} route - identificador da rota (ex: 'search', 'ocr', 'analyze')
 * @param {number} max - número máximo de requisições na janela
 * @param {number} windowSeconds - duração da janela em segundos
 * @returns {Promise<{allowed: boolean, remaining: number, resetIn: number}>}
 */
async function checkRateLimit(ip, route, max, windowSeconds) {
  // Se o Upstash não estiver configurado, deixa passar (fail-open) mas avisa no log.
  // Isso evita que a app fique 100% fora do ar se a env var não foi setada,
  // mas significa que SEM essa config o rate limit não existe de fato.
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.warn('⚠️ UPSTASH não configurado — rate limiting DESATIVADO nesta rota:', route);
    return { allowed: true, remaining: max, resetIn: windowSeconds };
  }

  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${route}:${ip}:${windowStart}`;

  try {
    // Pipeline: INCR seguido de EXPIRE (idempotente, EXPIRE é reaplicado sempre,
    // mas como a key muda a cada janela isso é seguro)
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds]
      ])
    });

    if (!res.ok) {
      console.error('❌ Upstash respondeu erro HTTP', res.status);
      return { allowed: true, remaining: max, resetIn: windowSeconds }; // fail-open
    }

    const data = await res.json();
    const count = data?.[0]?.result ?? 0;

    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      resetIn: windowSeconds
    };
  } catch (err) {
    console.error('❌ Erro ao consultar Upstash:', err.message);
    return { allowed: true, remaining: max, resetIn: windowSeconds }; // fail-open
  }
}

/**
 * Extrai o IP do cliente a partir do evento da Netlify Function.
 */
function getClientIp(event) {
  return (
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    'unknown'
  );
}

module.exports = { checkRateLimit, getClientIp };
