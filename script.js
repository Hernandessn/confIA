// ==========================================
// CONFIGURAÇÃO - APENAS FRONTEND
// ==========================================
const API_KEYS = {
  gemini: 'AIzaSyBqBVTSzHb2SbnFgnDnVeo4hvyoRG39sro',
  gnews: '60b4b4d5be152526fe0b37f78a2b60c2',
  ocrspace: 'K86239280388957'
};

// Proxy CORS para contornar bloqueios
const CORS_PROXY = 'https://corsproxy.io/?';

console.log('✅ ConfIA - Modo Frontend Only');

// ==========================================
// DOM ELEMENTS
// ==========================================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("imageInput");
const resultsSection = document.getElementById("resultsSection");
const verificationBox = document.getElementById("verificationBox");
const feedbackText = document.getElementById("feedbackText");
const sourcesGrid = document.getElementById("sourcesGrid");

// ==========================================
// SISTEMA DE MODAIS
// ==========================================
const modalOverlay = document.getElementById('modalOverlay');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const howItWorksBtn = document.getElementById('howItWorksBtn');
const aboutBtn = document.getElementById('aboutBtn');

const modalData = {
  howItWorks: {
    icon: '⚙️',
    title: 'Como funciona?',
    content: `O ConfIA utiliza <strong>Inteligência Artificial</strong> e <strong>APIs de notícias</strong> para verificar manchetes e avaliar sua confiabilidade.<br><br>Ele compara as informações com fontes amplamente reconhecidas e gera um relatório explicativo sobre a notícia, incluindo <strong>níveis de confiabilidade</strong> e <strong>fontes verificadas</strong>.<br><br>O sistema analisa padrões de linguagem, detecta sinais de desinformação e busca em múltiplas bases de dados para oferecer uma análise completa e transparente.`
  },
  about: {
    icon: 'ℹ️',
    title: 'Sobre',
    content: `O ConfIA é um projeto criado com o objetivo de <strong>combater a desinformação</strong>, ajudando pessoas a analisarem notícias de forma crítica e consciente.<br><br>Ele faz parte da <strong>Maratona Tech</strong>, iniciativa que estimula jovens a criarem soluções tecnológicas com impacto social.<br><br>Nossa missão é democratizar o acesso à verificação de fatos e promover a educação midiática, capacitando as pessoas a identificarem conteúdos falsos e compartilharem informações confiáveis.`
  }
};

function openModal(type) {
  const data = modalData[type];
  if (!data) return;
  modalIcon.textContent = data.icon;
  modalTitle.textContent = data.title;
  modalContent.innerHTML = data.content;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (howItWorksBtn) howItWorksBtn.addEventListener('click', () => openModal('howItWorks'));
if (aboutBtn) aboutBtn.addEventListener('click', () => openModal('about'));
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
    closeModal();
  }
});

// ==========================================
// BOTÃO DE UPLOAD
// ==========================================
if (uploadBtn && imageInput) {
  uploadBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageUpload);
}

// ==========================================
// COMPRESSÃO DE IMAGEM
// ==========================================
async function compressImage(file, maxSizeKB = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.5) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        console.log(`🗜️ Comprimido: ${(file.size/1024).toFixed(2)}KB → ${(compressedDataUrl.length/1024/1.37).toFixed(2)}KB`);
        fetch(compressedDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(compressedFile);
          });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// OCR (EXTRAÇÃO DE TEXTO)
// ==========================================
async function extractTextFromImage(file) {
  console.log('🟢 [OCR] Iniciando...');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('language', 'por');
        formData.append('apikey', API_KEYS.ocrspace);
        formData.append('isOverlayRequired', 'false');
        formData.append('OCREngine', '2');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');
        
        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const data = await response.json();
        if (data.IsErroredOnProcessing) throw new Error(data.ErrorMessage || 'Erro no OCR');
        
        if (data.ParsedResults && data.ParsedResults.length > 0) {
          const extractedText = data.ParsedResults[0].ParsedText || '';
          console.log('✅ [OCR] Extraído:', extractedText.length, 'chars');
          resolve(extractedText.trim().length === 0 ? '' : extractedText);
        } else {
          resolve('');
        }
      } catch (error) {
        console.error('❌ [OCR]:', error);
        reject(new Error('Falha ao reconhecer texto: ' + error.message));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

// ==========================================
// HANDLE UPLOAD
// ==========================================
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    alert('❌ Use apenas JPG ou PNG.');
    return;
  }
  
  if (file.size > 10 * 1024 * 1024) {
    alert('❌ Imagem muito grande. Máximo: 10MB.');
    return;
  }
  
  resultsSection.classList.add('active');
  verificationBox.style.display = 'block';
  updateVerificationStatus('📷 Processando...');
  
  try {
    let processedFile = file;
    if (file.size > 800 * 1024) {
      updateVerificationStatus('🗜️ Comprimindo...');
      processedFile = await compressImage(file);
    }
    
    updateVerificationStatus('🔍 Reconhecendo texto...');
    const extractedText = await extractTextFromImage(processedFile);
    
    if (!extractedText || extractedText.trim().length === 0) {
      verificationBox.style.display = 'none';
      feedbackText.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
          <strong style="color: #ef4444; font-size: 1.2rem;">Nenhum texto detectado</strong>
          <p style="color: #9ca3af; margin-top: 1rem;">Use uma imagem com texto mais nítido.</p>
        </div>
      `;
      return;
    }
    
    verificationBox.style.display = 'none';
    showExtractedText(extractedText);
    await analyzeExtractedText(extractedText);
    
  } catch (error) {
    console.error('❌ [UPLOAD]:', error);
    verificationBox.style.display = 'none';
    feedbackText.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
        <strong style="color: #ef4444; font-size: 1.2rem;">Erro ao processar</strong>
        <p style="color: #9ca3af; margin-top: 1rem;">${error.message}</p>
      </div>
    `;
  } finally {
    event.target.value = '';
  }
}

function showExtractedText(text) {
  const extractedTextBox = document.createElement('div');
  extractedTextBox.id = 'extractedTextBox';
  extractedTextBox.style.cssText = `background: #2a2a2a; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; border: 2px solid #3b82f6;`;
  extractedTextBox.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
      <span style="font-size: 1.5rem;">📝</span>
      <strong style="color: #3b82f6; font-size: 1.1rem;">Texto Reconhecido</strong>
    </div>
    <div style="background: #1a1a1a; border-radius: 0.75rem; padding: 1.25rem; line-height: 1.7; color: #e5e5e5; white-space: pre-wrap;">
      ${text.trim()}
    </div>
  `;
  const feedbackBox = document.querySelector('.feedback-box');
  feedbackBox.parentNode.insertBefore(extractedTextBox, feedbackBox);
}

async function analyzeExtractedText(text) {
  verificationBox.style.display = 'block';
  try {
    updateVerificationStatus('🔍 Extraindo keywords...');
    const keywords = extractKeywords(text);
    updateVerificationStatus('📰 Buscando fontes...');
    const sources = await searchAllAPIs(keywords, text);
    updateVerificationStatus('🤖 Analisando...');
    const analysis = await analyzeWithAdvancedSystem(text, sources);
    verificationBox.style.display = 'none';
    analytics.logSearch(text, analysis.nivel, sources.length);
    renderFeedback(analysis, sources);
    renderSources(sources);
  } catch (error) {
    console.error('Erro:', error);
    verificationBox.style.display = 'none';
    feedbackText.innerHTML = `<div style="padding: 2rem; text-align: center;"><div style="font-size: 3rem;">❌</div><strong style="color: #ef4444;">Erro ao analisar</strong></div>`;
  }
}

// ==========================================
// ANÁLISE SEMÂNTICA
// ==========================================
function detectSensationalism(text) {
  if (!text) return { score: 0, triggers: [] };
  const triggers = [];
  let score = 0;
  const patterns = [
    { pattern: /você não vai acreditar/i, name: 'Clickbait clássico', weight: 25 },
    { pattern: /isso vai te chocar/i, name: 'Apelo ao choque', weight: 25 },
    { pattern: /médicos odeiam/i, name: 'Teoria conspiratória', weight: 30 },
    { pattern: /compartilhe antes que apaguem/i, name: 'Urgência falsa', weight: 30 },
    { pattern: /descubra o segredo/i, name: 'Promessa de revelação', weight: 20 },
    { pattern: /governo esconde/i, name: 'Conspiração', weight: 30 }
  ];
  patterns.forEach(({ pattern, name, weight }) => {
    if (pattern.test(text)) {
      triggers.push(name);
      score += weight;
    }
  });
  const sensationalWords = text.match(/urgente|chocante|inacreditável|bomba|escândalo/gi) || [];
  if (sensationalWords.length >= 2) {
    triggers.push(`Linguagem sensacionalista (${sensationalWords.length}x)`);
    score += sensationalWords.length * 10;
  }
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.3) {
    triggers.push('Excesso de MAIÚSCULAS');
    score += 15;
  }
  return { score, triggers };
}

function detectAbsurdity(text) {
  if (!text) return { isAbsurd: false, reasons: [], score: 0 };
  const reasons = [];
  let score = 0;
  const patterns = [
    { pattern: /(?:ganhe?|receba?)\s+(?:graça|grátis|fácil)/gi, reason: 'Dinheiro fácil', weight: 45 },
    { pattern: /(?:ganhe?)\s+(?:r\$|reais?)?\s*\d{3,}.*(?:mil|k)/gi, reason: 'Ganhos irreais', weight: 50 },
    { pattern: /cura.*(aids|câncer).*(caseiro|chá)/i, reason: 'Cura falsa', weight: 100 },
    { pattern: /chip.*(vacina)/i, reason: 'Teoria conspiratória', weight: 35 }
  ];
  for (const { pattern, reason, weight } of patterns) {
    if (pattern.test(text)) {
      reasons.push(reason);
      score += weight;
    }
  }
  return { isAbsurd: score >= 20, isCritical: score >= 50, reasons, score };
}

function calculateSemanticSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const normalize = (text) => text.toLowerCase().replace(/[^\wáéíóúâêôãõç\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const words1 = normalize(text1);
  const words2 = normalize(text2);
  if (words1.length === 0 || words2.length === 0) return 0;
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let commonWords = 0;
  set1.forEach(word => {
    if (set2.has(word)) commonWords++;
  });
  return (commonWords / (set1.size + set2.size - commonWords)) * 100;
}

function analyzeSourcesContextualRelevance(originalText, sources) {
  if (!sources || sources.length === 0) {
    return { avgSimilarity: 0, relevantSources: 0, contextMatch: 'NONE' };
  }
  let totalSimilarity = 0;
  let relevantCount = 0;
  sources.forEach(source => {
    const similarity = calculateSemanticSimilarity(originalText, source.title + ' ' + (source.description || ''));
    source.semanticSimilarity = similarity;
    if (similarity >= 30) relevantCount++;
    totalSimilarity += similarity;
  });
  const avgSimilarity = totalSimilarity / sources.length;
  let contextMatch;
  if (avgSimilarity >= 50) contextMatch = 'HIGH';
  else if (avgSimilarity >= 30) contextMatch = 'MEDIUM';
  else if (avgSimilarity >= 15) contextMatch = 'LOW';
  else contextMatch = 'NONE';
  console.log(`🔍 Similaridade: ${avgSimilarity.toFixed(1)}% | Relevantes: ${relevantCount}/${sources.length}`);
  return { avgSimilarity, relevantSources: relevantCount, contextMatch };
}

function determineAdvancedLevel(newsText, sources, contextAnalysis) {
  const absurdityCheck = detectAbsurdity(newsText);
  const sensationalismCheck = detectSensationalism(newsText);
  
  if (absurdityCheck.isCritical) {
    return { level: 'BAIXA', reason: 'Conteúdo perigoso detectado', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch };
  }
  if (sensationalismCheck.score >= 40 && contextAnalysis.contextMatch === 'NONE') {
    return { level: 'BAIXA', reason: 'Sensacionalismo extremo', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch };
  }
  if (absurdityCheck.score >= 30 && sources.length < 2) {
    return { level: 'BAIXA', reason: 'Desinformação sem confirmação', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch };
  }
  if (sources.length >= 3 && contextAnalysis.contextMatch === 'NONE') {
    return { level: 'MEDIA', reason: 'Fontes falam de temas diferentes', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch };
  }
  
  const tier1Sources = ['cnn', 'uol', 'g1', 'bbc', 'folha', 'estadao', 'oglobo'];
  const tier1Count = sources.filter(s => tier1Sources.some(t => s.domain.includes(t))).length;
  
  let baseLevel;
  if (tier1Count >= 3 && contextAnalysis.contextMatch === 'HIGH') baseLevel = 'ALTA';
  else if (sources.length >= 5 && contextAnalysis.contextMatch !== 'NONE') baseLevel = 'ALTA';
  else if (sources.length >= 2 && contextAnalysis.relevantSources >= 1) baseLevel = 'MEDIA';
  else if (sources.length >= 1) baseLevel = 'MEDIA';
  else baseLevel = 'NEUTRA';
  
  if (sensationalismCheck.score >= 25 && sensationalismCheck.score < 40) {
    if (baseLevel === 'ALTA') baseLevel = 'MEDIA';
    else if (baseLevel === 'MEDIA') baseLevel = 'NEUTRA';
  }
  
  return { level: baseLevel, reason: 'Análise contextual', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch };
}

async function analyzeWithAdvancedSystem(newsText, sources) {
  const absurdityCheck = detectAbsurdity(newsText);
  const sensationalismCheck = detectSensationalism(newsText);
  const contextAnalysis = analyzeSourcesContextualRelevance(newsText, sources);
  const classification = determineAdvancedLevel(newsText, sources, contextAnalysis);
  
  const pontos_atencao = [];
  if (sources.length > 0) {
    pontos_atencao.push(`${contextAnalysis.relevantSources}/${sources.length} fontes relevantes (${contextAnalysis.avgSimilarity.toFixed(0)}% similaridade)`);
  } else {
    pontos_atencao.push('Nenhuma fonte encontrada');
  }
  if (sensationalismCheck.score > 0) {
    pontos_atencao.push(`Sensacionalismo (${sensationalismCheck.score} pts): ${sensationalismCheck.triggers.join(', ')}`);
  }
  if (absurdityCheck.score > 0) {
    pontos_atencao.push(`Desinformação (${absurdityCheck.score} pts): ${absurdityCheck.reasons.join(', ')}`);
  }
  
  let explicacao, recomendacao;
  if (classification.level === 'ALTA') {
    explicacao = `${sources.length} fontes confiáveis com alta relevância (${contextAnalysis.avgSimilarity.toFixed(0)}%). Ampla cobertura jornalística.`;
    recomendacao = 'Notícia verificada. Pode compartilhar com segurança.';
  } else if (classification.level === 'MEDIA') {
    explicacao = `${sources.length} fonte(s) com relevância moderada. ${sensationalismCheck.score > 0 ? 'Linguagem sensacionalista detectada.' : ''}`;
    recomendacao = 'Verifique as fontes antes de compartilhar.';
  } else if (classification.level === 'BAIXA') {
    explicacao = `Sinais de alerta detectados. Alto risco de fake news.`;
    recomendacao = '🚨 NÃO COMPARTILHE. Características de desinformação.';
  } else {
    explicacao = `Nenhuma fonte ampla encontrada. ${sensationalismCheck.score > 0 ? 'Linguagem sensacionalista.' : 'Pode ser notícia local/recente.'}`;
    recomendacao = 'Busque confirmar em fontes oficiais.';
  }
  
  try {
    const geminiAnalysis = await analyzeWithGemini(newsText, sources, classification);
    return {
      nivel: classification.level,
      explicacao: geminiAnalysis.explicacao || explicacao,
      pontos_atencao,
      recomendacao: geminiAnalysis.recomendacao || recomendacao,
      sensacionalismo: sensationalismCheck.score > 0 ? sensationalismCheck : null,
      absurdo: absurdityCheck.score > 0 ? absurdityCheck : null,
      contextMatch: contextAnalysis.contextMatch
    };
  } catch {
    return {
      nivel: classification.level,
      explicacao,
      pontos_atencao,
      recomendacao,
      sensacionalismo: sensationalismCheck.score > 0 ? sensationalismCheck : null,
      absurdo: absurdityCheck.score > 0 ? absurdityCheck : null,
      contextMatch: contextAnalysis.contextMatch
    };
  }
}

async function analyzeWithGemini(newsText, sources, classification) {
  const sourcesList = sources.slice(0, 5).map(s => `• ${s.source}`).join('\n');
  const prompt = `Análise ConfIA.

Notícia: "${newsText}"
Classificação: ${classification.level}
Fontes: ${sources.length}

Mantenha ${classification.level}. Retorne JSON:
{"nivel": "${classification.level}", "explicacao": "breve", "recomendacao": "prática"}`;

  const response = await fetch(`${CORS_PROXY}https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEYS.gemini}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 600 }
    })
  });
  
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
  const analysis = JSON.parse(text);
  analysis.nivel = classification.level;
  return analysis;
}

// ==========================================
// BUSCA DE NOTÍCIAS
// ==========================================
function extractKeywords(text) {
  if (!text) return '';
  const properNouns = text.match(/\b[A-ZÀÁÂÃ][a-zàáâãäåèéêë]+(?:\s+[A-ZÀÁÂÃ][a-zàáâãäåèéêë]+)*/g);
  if (properNouns && properNouns.length > 0) return properNouns.slice(0, 3).join(' ');
  const stopWords = ['o', 'a', 'de', 'da', 'do', 'em', 'para', 'com', 'por', 'que'];
  const words = text.toLowerCase().replace(/[^\wáéíóúâêô\s]/g, ' ').split(/\s+/).filter(w => w.length > 4 && !stopWords.includes(w));
  return words.sort((a, b) => b.length - a.length).slice(0, 4).join(' ');
}

function calculateRelevance(query, title, desc = '') {
  if (!query || !title) return 0;
  const q = query.toLowerCase();
  const t = title.toLowerCase();
  const d = desc.toLowerCase();
  const queryWords = q.split(/\s+/).filter(w => w.length > 3);
  let matches = 0;
  queryWords.forEach(word => {
    if (t.includes(word)) matches += 2;
    else if (d.includes(word)) matches += 1;
  });
  return Math.min(100, (matches / queryWords.length) * 50);
}

function removeDuplicates(articles, query) {
  if (!Array.isArray(articles)) return [];
  const seen = new Set();
  const filtered = [];
  articles.forEach(article => {
    if (!article || !article.title) return;
    const normalized = article.title.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 50);
    if (seen.has(normalized)) return;
    const relevance = calculateRelevance(query, article.title, article.description);
    if (relevance >= 20) {
      article.relevance = relevance;
      seen.add(normalized);
      filtered.push(article);
    }
  });
  return filtered.sort((a, b) => b.relevance - a.relevance);
}

async function searchGNews(keywords, originalQuery) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = `${CORS_PROXY}https://gnews.io/api/v4/search?q=${encodeURIComponent(keywords)}&lang=pt&country=br&max=20&apikey=${API_KEYS.gnews}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.articles) return [];
    return data.articles.map(a => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
      description: a.description,
      logoUrl: getLogoUrl(a.url),
      domain: extractDomain(a.url),
      api: 'GNews'
    }));
  } catch (error) {
    console.error('GNews erro:', error.name === 'AbortError' ? 'Timeout' : error.message);
    return [];
  }
}

async function searchGoogleNewsRSS(keywords) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const url = `${CORS_PROXY}https://news.google.com/rss/search?q=${encodeURIComponent(keywords)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return [];
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = xml.querySelectorAll('item');
    const results = [];
    items.forEach((item, index) => {
      if (index >= 20) return;
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const sourceMatch = title.match(/- (.+)$/);
      const sourceName = sourceMatch ? sourceMatch[1] : 'Google News';
      if (link && title) {
        results.push({
          title: title.replace(/ - .+$/, ''),
          source: sourceName,
          url: link,
          publishedAt: pubDate,
          description: '',
          logoUrl: getLogoUrl(link),
          domain: extractDomain(link),
          api: 'Google RSS'
        });
      }
    });
    return results;
  } catch (error) {
    console.error('Google RSS erro:', error.name === 'AbortError' ? 'Timeout' : error.message);
    return [];
  }
}

async function searchAllAPIs(keywords, originalQuery) {
  console.log('🔍 Buscando fontes...');
  const [gnewsResults, googleRSSResults] = await Promise.all([
    searchGNews(keywords, originalQuery),
    searchGoogleNewsRSS(keywords, originalQuery)
  ]);
  const allResults = [...gnewsResults, ...googleRSSResults];
  const uniqueResults = removeDuplicates(allResults, originalQuery);
  console.log(`✅ ${allResults.length} → ${uniqueResults.length} (após filtro)`);
  return uniqueResults;
}

function extractDomain(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function getLogoUrl(url) {
  const domain = extractDomain(url);
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================
function renderFeedback(analysis, sources) {
  const feedbackBox = document.querySelector('.feedback-box');
  const feedbackIcon = feedbackBox.querySelector('.feedback-icon');
  const feedbackTextEl = feedbackBox.querySelector('.feedback-text');
  const colors = {
    'ALTA': { bg: '#10b981', icon: '✓', emoji: '✅' },
    'MEDIA': { bg: '#f59e0b', icon: '⚠', emoji: '⚠️' },
    'NEUTRA': { bg: '#6366f1', icon: '?', emoji: '🟡' },
    'BAIXA': { bg: '#ef4444', icon: '✗', emoji: '❌' }
  };
  const color = colors[analysis.nivel] || colors['NEUTRA'];
  feedbackIcon.textContent = color.icon;
  feedbackIcon.style.color = color.bg;
  
  let html = `
    <div style="padding: 1.5rem; background: linear-gradient(135deg, ${color.bg}20, ${color.bg}10); border: 2px solid ${color.bg}; border-radius: 12px; margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <span style="font-size: 2rem;">${color.emoji}</span>
        <strong style="color: ${color.bg}; font-size: 1.3rem; text-transform: uppercase;">${analysis.nivel} Confiabilidade</strong>
      </div>
    </div>
  `;
  
  if (analysis.sensacionalismo && analysis.sensacionalismo.score >= 20) {
    html += `
      <div style="padding: 1.25rem; background: #7c2d12; border: 2px solid #f97316; border-radius: 12px; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: start; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">🚨</span>
          <div>
            <strong style="color: #fdba74; font-size: 1.05rem;">Linguagem Sensacionalista</strong><br><br>
            <span style="color: #fed7aa; line-height: 1.6; font-size: 0.95rem;">
              Clickbait detectado (${analysis.sensacionalismo.score} pts): ${analysis.sensacionalismo.triggers.join(', ')}
            </span>
          </div>
        </div>
      </div>
    `;
  }
  
  html += `
    <div style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span style="font-size: 1.5rem;">🤖</span>
        <strong style="color: #e5e5e5; font-size: 1.05rem;">Análise</strong>
      </div>
      <p style="margin: 0; padding: 1rem; background: #1a1a1a; border-radius: 8px; line-height: 1.7; color: #e5e5e5;">
        ${analysis.explicacao}
      </p>
    </div>
  `;
  
  if (analysis.pontos_atencao && analysis.pontos_atencao.length > 0) {
    html += `
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="font-size: 1.5rem;">🔍</span>
          <strong style="color: #e5e5e5; font-size: 1.05rem;">Observações</strong>
        </div>
        <ul style="margin: 0; padding: 1rem 1rem 1rem 2.5rem; background: #1a1a1a; border-radius: 8px; line-height: 1.7; color: #e5e5e5;">
          ${analysis.pontos_atencao.map(p => `<li style="margin-bottom: 0.5rem;">${p}</li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  html += `
    <div style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span style="font-size: 1.5rem;">📊</span>
        <strong style="color: #e5e5e5; font-size: 1.05rem;">Fontes</strong>
      </div>
      <div style="padding: 1rem; background: #1a1a1a; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <div style="color: #93c5fd; line-height: 1.8;">
          • <strong>${sources.length}</strong> notícias encontradas<br>
          • APIs: GNews, Google News RSS
        </div>
      </div>
    </div>
  `;
  
  if (analysis.nivel === 'BAIXA') {
    html += `
      <div style="padding: 1.25rem; background: #7f1d1d; border: 2px solid #ef4444; border-radius: 12px; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: start; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">🚨</span>
          <div>
            <strong style="color: #fca5a5; font-size: 1.05rem;">ALERTA: Desinformação</strong><br><br>
            <span style="color: #fecaca; line-height: 1.6;">
              Características de fake news. <strong>NÃO compartilhe.</strong>
            </span>
          </div>
        </div>
      </div>
    `;
  }
  
  html += `
    <div>
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span style="font-size: 1.5rem;">💡</span>
        <strong style="color: #e5e5e5; font-size: 1.05rem;">Recomendação</strong>
      </div>
      <p style="margin: 0; padding: 1rem; background: #422006; border-left: 4px solid #facc15; border-radius: 8px; line-height: 1.7; color: #fef08a; font-weight: 500;">
        ${analysis.recomendacao}
      </p>
    </div>
  `;
  
  feedbackTextEl.innerHTML = html;
}

function renderSources(sources) {
  sourcesGrid.innerHTML = '';
  if (sources.length === 0) return;
  
  const title = document.createElement('div');
  title.style.cssText = `margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 12px; border-left: 4px solid #3b82f6;`;
  title.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <span style="font-size: 1.8rem;">📰</span>
      <div>
        <strong style="color: #93c5fd; font-size: 1.2rem;">Fontes Relacionadas</strong>
        <p style="margin: 0.5rem 0 0 0; color: #cbd5e1; font-size: 0.9rem;">${sources.length} notícia${sources.length > 1 ? 's' : ''}</p>
      </div>
    </div>
  `;
  sourcesGrid.appendChild(title);
  
  sources.forEach(source => {
    const card = document.createElement('a');
    card.href = source.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.style.cssText = `display: block; padding: 1.5rem; background: #1a1a1a; border: 2px solid #3a3a3a; border-radius: 12px; text-decoration: none; transition: all 0.2s; cursor: pointer;`;
    card.onmouseenter = function() {
      this.style.transform = 'translateY(-3px)';
      this.style.borderColor = '#3b82f6';
    };
    card.onmouseleave = function() {
      this.style.transform = 'translateY(0)';
      this.style.borderColor = '#3a3a3a';
    };
    
    const logoHTML = source.logoUrl 
      ? `<img src="${source.logoUrl}" alt="${source.source}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: contain; background: #f9fafb; padding: 4px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div style="display: none; width: 48px; height: 48px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">${source.source.charAt(0)}</div>`
      : `<div style="width: 48px; height: 48px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">${source.source.charAt(0)}</div>`;
    
    const publishDate = source.publishedAt ? new Date(source.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const similarity = source.semanticSimilarity || source.relevance || 0;
    const simColor = similarity >= 50 ? '#10b981' : similarity >= 30 ? '#f59e0b' : '#6b7280';
    
    card.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: start;">
        <div style="flex-shrink: 0;">${logoHTML}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: #e5e5e5; margin-bottom: 0.25rem;">${source.source}</div>
          <div style="color: #9ca3af; font-size: 0.8rem; margin-bottom: 0.75rem;">
            🌐 ${source.domain} ${publishDate ? `• 📅 ${publishDate}` : ''} • ${source.api}<br>
            <span style="color: ${simColor}; font-weight: 600;">🎯 ${similarity.toFixed(0)}%</span>
          </div>
          <div style="color: #d1d5db; line-height: 1.5; margin-bottom: 0.75rem;">${source.title}</div>
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; background: #3b82f6; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
            🔗 Ler completa
          </div>
        </div>
      </div>
    `;
    sourcesGrid.appendChild(card);
  });
}

function updateVerificationStatus(message) {
  if (verificationBox && verificationBox.querySelector('.verification-loading')) {
    const el = verificationBox.querySelector('.verification-loading span:first-child');
    if (el) el.textContent = message;
  }
}

// ==========================================
// RATE LIMITER
// ==========================================
const rateLimiter = {
  requests: [],
  maxRequests: 10,
  timeWindow: 60000,
  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.timeWindow);
    if (this.requests.length >= this.maxRequests) return false;
    this.requests.push(now);
    return true;
  },
  getTimeUntilReset() {
    if (this.requests.length === 0) return 0;
    const oldest = Math.min(...this.requests);
    return Math.max(0, Math.ceil((this.timeWindow - (Date.now() - oldest)) / 1000));
  }
};

// ==========================================
// HANDLE SEARCH
// ==========================================
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    alert('Digite uma notícia para verificar.');
    return;
  }
  if (query.length < 10) {
    alert('⚠️ Muito curto. Mínimo: 10 caracteres.');
    return;
  }
  if (query.length > 500) {
    alert('⚠️ Muito longo. Máximo: 500 caracteres.');
    return;
  }
  if (!rateLimiter.canMakeRequest()) {
    alert(`⏱️ Limite atingido. Aguarde ${rateLimiter.getTimeUntilReset()}s.`);
    return;
  }
  
  const old = document.getElementById('extractedTextBox');
  if (old) old.remove();
  
  resultsSection.classList.add('active');
  verificationBox.style.display = 'block';
  
  try {
    updateVerificationStatus('🔍 Extraindo keywords...');
    const keywords = extractKeywords(query);
    updateVerificationStatus('📰 Buscando fontes...');
    const sources = await searchAllAPIs(keywords, query);
    updateVerificationStatus('🤖 Analisando...');
    const analysis = await analyzeWithAdvancedSystem(query, sources);
    verificationBox.style.display = 'none';
    analytics.logSearch(query, analysis.nivel, sources.length);
    renderFeedback(analysis, sources);
    renderSources(sources);
  } catch (error) {
    console.error('Erro:', error);
    verificationBox.style.display = 'none';
    feedbackText.innerHTML = `<div style="padding: 2rem; text-align: center;"><div style="font-size: 3rem;">❌</div><strong style="color: #ef4444;">Erro ao verificar</strong></div>`;
  }
}

if (searchBtn) searchBtn.addEventListener('click', handleSearch);
if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
}

// ==========================================
// ANALYTICS
// ==========================================
const analytics = {
  totalSearches: 0,
  classifications: { ALTA: 0, MEDIA: 0, NEUTRA: 0, BAIXA: 0 },
  logSearch(query, level, sourcesCount) {
    this.totalSearches++;
    this.classifications[level]++;
    console.log('📊 Stats:', { total: this.totalSearches, level, sources: sourcesCount });
  }
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
console.log('✅ ConfIA v5.0 - Frontend Only');
console.log('🔑 APIs: GNews, Google RSS, OCR.space, Gemini');
console.log('🌐 CORS Proxy:', CORS_PROXY);
console.log('✅ ConfIA v5.0 - SISTEMA SIMPLIFICADO - Carregado!');
console.log('⚠️ API Keys expostas diretamente no código');
console.log('🚀 Funcionalidades ativas:');
console.log('  ✓ Análise semântica de contexto');
console.log('  ✓ Detecção avançada de sensacionalismo');
console.log('  ✓ Sistema de pontuação de absurdos');
console.log('  ✓ Comparação contextual com fontes');
console.log('  ✓ Classificação inteligente multinível');
console.log('  ✓ OCR para extração de texto de imagens');
console.log('  ✓ Integração com Gemini, NewsAPI, GNews e Google News RSS');