const { checkRateLimit, getClientIp } = require('./_utils/rateLimit');

const OCR_KEY = process.env.OCRSPACE_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  const ip = getClientIp(event);
  const rl = await checkRateLimit(ip, 'ocr', 3, 60); // 3 uploads/min por IP
  if (!rl.allowed) {
    return {
      statusCode: 429,
      body: JSON.stringify({ error: `Limite de uploads atingido. Tente novamente em ${rl.resetIn}s.` })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido.' }) };
  }

  const { base64Image } = body; // data URL completo: "data:image/jpeg;base64,...."
  if (!base64Image || !base64Image.startsWith('data:image/')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Imagem inválida.' }) };
  }

  // Limite de tamanho grosseiro (base64 infla ~33% o tamanho original; 10MB de imagem ~ 13.5MB aqui)
  if (base64Image.length > 14 * 1024 * 1024) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Imagem muito grande.' }) };
  }

  try {
    const params = new URLSearchParams();
    params.append('base64Image', base64Image);
    params.append('language', 'por');
    params.append('apikey', OCR_KEY);
    params.append('isOverlayRequired', 'false');
    params.append('OCREngine', '2');
    params.append('detectOrientation', 'true');
    params.append('scale', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(data.ErrorMessage?.join?.(', ') || 'Erro no processamento OCR');
    }

    const text = data.ParsedResults?.[0]?.ParsedText || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() })
    };
  } catch (err) {
    console.error('❌ [OCR]', err.message);
    return { statusCode: 502, body: JSON.stringify({ error: 'Falha ao reconhecer texto: ' + err.message }) };
  }
};
