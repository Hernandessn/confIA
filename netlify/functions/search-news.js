const { checkRateLimit, getClientIp } = require('./_utils/rateLimit');

const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY;
const CURRENTS_KEY = process.env.CURRENTS_API_KEY;

async function searchNewsData(keywords) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent(keywords)}&language=pt&country=br`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.results) return [];
    return data.results.map(a => ({
      title: a.title,
      source: a.source_id || 'NewsData',
      url: a.link,
      publishedAt: a.pubDate,
      description: a.description || '',
      domain: safeDomain(a.link),
      api: 'NewsData.io'
    }));
  } catch (err) {
    console.error('❌ [NewsData]', err.message);
    return [];
  }
}

async function searchCurrents(keywords) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(keywords)}&language=pt&apiKey=${CURRENTS_KEY}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.news) return [];
    return data.news.map(a => ({
      title: a.title,
      source: a.author || 'Currents',
      url: a.url,
      publishedAt: a.published,
      description: a.description || '',
      domain: safeDomain(a.url),
      api: 'Currents API'
    }));
  } catch (err) {
    console.error('❌ [Currents]', err.message);
    return [];
  }
}

function safeDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const ip = getClientIp(event);
  const rl = await checkRateLimit(ip, 'search', 8, 60); // 8 buscas/min por IP
  if (!rl.allowed) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: `Limite de buscas atingido. Tente novamente em ${rl.resetIn}s.` })
    };
  }

  const keywords = (event.queryStringParameters?.keywords || '').trim();
  if (!keywords || keywords.length > 200) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetro "keywords" inválido.' }) };
  }

  const [newsdata, currents] = await Promise.all([
    searchNewsData(keywords),
    searchCurrents(keywords)
  ]);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ results: [...newsdata, ...currents] })
  };
};
