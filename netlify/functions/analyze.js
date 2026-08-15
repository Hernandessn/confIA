const { checkRateLimit, getClientIp } = require('./_utils/rateLimit');

const GROQ_KEY = process.env.GROQ_API_KEY;
// Troque aqui se quiser outro modelo Groq (ex: 'llama-3.1-8b-instant' pra respostas mais rápidas/baratas)
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const ip = getClientIp(event);
  const rl = await checkRateLimit(ip, 'analyze', 8, 60);
  if (!rl.allowed) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: `Limite atingido. Tente novamente em ${rl.resetIn}s.` })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido.' }) };
  }

  const { newsText, sourcesSummary, classification } = body;

  if (!newsText || typeof newsText !== 'string' || newsText.length > 500) {
    return { statusCode: 400, body: JSON.stringify({ error: 'newsText inválido.' }) };
  }
  if (!classification || !classification.level) {
    return { statusCode: 400, body: JSON.stringify({ error: 'classification inválida.' }) };
  }

  const prompt = `Análise de confiabilidade - ConfIA

Notícia: "${newsText}"
Classificação automática: ${classification.level}
${sourcesSummary || 'Sem fontes encontradas'}
Score de absurdo: ${classification.absurdityScore}
Score de sensacionalismo: ${classification.sensationalismScore}

IMPORTANTE: Mantenha a classificação ${classification.level}.

Retorne APENAS um JSON válido, sem markdown, no formato:
{"nivel": "${classification.level}", "explicacao": "explicação clara e educativa em português (máx 2 frases)", "recomendacao": "recomendação prática e objetiva"}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'Você é um assistente que responde APENAS em JSON válido, sem texto extra.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    parsed.nivel = classification.level; // trava a classificação, o modelo só explica

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    console.error('❌ [Groq]', err.message);
    // 502 é esperado pelo frontend como "IA indisponível, cai pro fallback local"
    return { statusCode: 502, body: JSON.stringify({ error: 'Groq indisponível' }) };
  }
};
