const { checkRateLimit, getClientIp } = require('./_utils/rateLimit');

const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const ip = getClientIp(event);
  const rl = await checkRateLimit(ip, 'recent-news', 20, 60);
  if (!rl.allowed) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Limite atingido, tente mais tarde.' }) };
  }

  try {
    const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&language=pt&country=br&category=top`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao consultar NewsData');
    const data = await response.json();
    const results = (data.results || []).slice(0, 5).map(a => ({
      title: a.title,
      link: a.link,
      source: a.source_id || 'Fonte desconhecida'
    }));
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ results }) };
  } catch (err) {
    console.error('❌ [recent-news]', err.message);
    return { statusCode: 502, body: JSON.stringify({ error: 'Falha ao buscar notícias recentes.' }) };
  }
};
