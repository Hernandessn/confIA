// ==========================================
// CONFIGURAÇÃO - CONFIA v8.0 SISTEMA RIGOROSO
// ==========================================
const API_KEYS = {
  gemini: 'AIzaSyBqBVTSzHb2SbnFgnDnVeo4hvyoRG39sro',
  newsdata: 'pub_6dde2ebc4986466d82e1b5ac725fa99a',
  currents: 'CFpXp_zt6b7-MrwMlDsR8z15MqxySjHLLNWaB3RwCVbAJeyt',
  ocrspace: 'K86239280388957'
};

const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

console.log('✅ ConfIA v8.0 - Sistema Rigoroso Ativado');
console.log('🛡️ Detecção avançada + Classificação rigorosa');

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
    content: `O ConfIA utiliza <strong>Inteligência Artificial</strong> e <strong>APIs de notícias</strong> para verificar manchetes e avaliar sua confiabilidade.<br><br>O sistema analisa: <strong>padrões de linguagem</strong>, <strong>sinais de sensacionalismo</strong>, <strong>contradições lógicas</strong> e compara com <strong>fontes verificadas</strong>.<br><br>⚠️ <em>Este é um sistema educativo. Sempre confirme em múltiplas fontes confiáveis.</em>`
  },
  about: {
    icon: 'ℹ️',
    title: 'Sobre',
    content: `O ConfIA é um projeto educativo para <strong>combater a desinformação</strong>, desenvolvido para a <strong>Maratona Tech</strong>.<br><br>Nossa missão: democratizar o acesso à verificação de fatos e <strong>ensinar</strong> as pessoas a identificarem fake news.<br><br>📚 Dicas: Desconfie de linguagem emocional excessiva, promessas irreais e notícias sem fontes verificáveis.`
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
// VALIDAÇÃO DE ENTRADA REFORÇADA
// ==========================================
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  
  let clean = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  clean = clean.substring(0, 500).trim().replace(/\s+/g, ' ');
  
  return clean;
}

function validateInput(text) {
  const errors = [];
  
  if (!text || text.length < 15) {
    errors.push('Texto muito curto. Digite pelo menos 15 caracteres.');
  }
  
  if (text.length > 500) {
    errors.push('Texto muito longo. Máximo: 500 caracteres.');
  }
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  if (suspiciousPatterns.some(pattern => pattern.test(text))) {
    errors.push('Entrada contém caracteres não permitidos.');
  }
  
  if (/(.)\1{10,}/.test(text)) {
    errors.push('Texto com repetições suspeitas.');
  }
  
  return { valid: errors.length === 0, errors };
}

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
// VALIDAÇÃO DE IMAGEM
// ==========================================
function validateImage(file) {
  const errors = [];
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Formato inválido. Use apenas JPG ou PNG.');
  }
  
  const maxSize = 10 * 1024 * 1024;
  const minSize = 50 * 1024;
  
  if (file.size > maxSize) {
    errors.push(`Imagem muito grande (${(file.size/1024/1024).toFixed(1)}MB). Máximo: 10MB.`);
  }
  
  if (file.size < minSize) {
    errors.push('Imagem muito pequena. Pode estar corrompida ou sem conteúdo.');
  }
  
  return { valid: errors.length === 0, errors };
}

// ==========================================
// HANDLE UPLOAD
// ==========================================
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const validation = validateImage(file);
  if (!validation.valid) {
    alert('❌ ' + validation.errors.join('\n'));
    event.target.value = '';
    return;
  }
  
  if (!rateLimiter.canMakeRequest('ocr')) {
    alert(`⏱️ Limite de uploads atingido. Aguarde ${rateLimiter.getTimeUntilReset('ocr')}s.`);
    event.target.value = '';
    return;
  }
  
  resultsSection.classList.add('active');
  verificationBox.style.display = 'block';
  updateVerificationStatus('📷 Processando imagem...');
  
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
// DETECÇÃO DE SENSACIONALISMO RIGOROSA
// ==========================================
function detectSensationalism(text) {
  if (!text) return { score: 0, triggers: [] };
  const triggers = [];
  let score = 0;
  
  const patterns = [
    { pattern: /(você não vai acreditar|isso é incrível|isso vai te chocar)/i, name: 'Clickbait emocional', weight: 40 },
    { pattern: /(médicos odeiam|doutores não querem que você saiba|especialistas revelam)/i, name: 'Apelo a autoridade falsa', weight: 45 },
    { pattern: /(compartilhe antes que apaguem|urgente|rápido|imediatamente)/i, name: 'Criação de urgência', weight: 35 },
    { pattern: /(descubra o segredo|o segredo que|truque secreto|método secreto)/i, name: 'Promessa de revelação', weight: 35 },
    { pattern: /(governo esconde|mídia esconde|eles não mostram|não divulgam)/i, name: 'Teoria conspiratória', weight: 50 },
    { pattern: /(grátis|de graça|gratuito).*(agora|hoje|rápido|imediatamente)/i, name: 'Oferta gratuita urgente', weight: 40 },
    { pattern: /(corre|não perca|oportunidade única|tempo limitado)/i, name: 'Pressão por ação', weight: 30 },
    { pattern: /(surpreendente|chocante|inacreditável|incrível|fantástico)/i, name: 'Superlativo emocional', weight: 25 },
    { pattern: /(todo mundo|todos|ninguém te conta|você sabia)/i, name: 'Generalização excessiva', weight: 20 },
    { pattern: /(alerta|atenção|cuidado|perigo)/i, name: 'Alarme desnecessário', weight: 30 }
  ];
  
  patterns.forEach(({ pattern, name, weight }) => {
    const matches = text.match(pattern);
    if (matches) {
      triggers.push(`${name} [${matches.length}x]`);
      score += weight * matches.length;
    }
  });
  
  const sensationalWords = text.match(/urgente|chocante|inacreditável|bomba|escândalo|absurdo|polêmica|incrível|fantástico|surpreendente|revolucionário|extraordinário/gi) || [];
  if (sensationalWords.length >= 1) {
    triggers.push(`Linguagem sensacionalista (${sensationalWords.length}x)`);
    score += sensationalWords.length * 18;
  }
  
  const capsRatio = (text.match(/[A-ZÀ-Ú]/g) || []).length / text.length;
  if (capsRatio > 0.25) {
    triggers.push('Excesso de MAIÚSCULAS (' + (capsRatio * 100).toFixed(0) + '%)');
    score += 30;
  }
  
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  
  if (exclamations >= 2) {
    triggers.push(`Excesso de exclamações (${exclamations}x)`);
    score += exclamations * 12;
  }
  
  if (questions >= 3) {
    triggers.push(`Muitas interrogações (${questions}x)`);
    score += questions * 8;
  }
  
  const exaggeratedNumbers = text.match(/\b(\d{4,}|[0-9]+(?:mil|milhões|bilhões))\b/gi);
  if (exaggeratedNumbers && exaggeratedNumbers.length >= 2) {
    triggers.push(`Números exagerados (${exaggeratedNumbers.length}x)`);
    score += 25;
  }
  
  return { score, triggers };
}

// ==========================================
// DETECÇÃO DE ABSURDOS RIGOROSA
// ==========================================
function detectAbsurdity(text) {
  if (!text) return { isAbsurd: false, reasons: [], score: 0 };
  const reasons = [];
  let score = 0;
  
  const patterns = [
    { pattern: /(?:dinheiro|grana|din)\s*(?:gr[aá]tis|gratis|de graça|facil|fácil)/gi, reason: 'Dinheiro fácil', weight: 85 },
    { pattern: /(?:ganhe?|receba?)\s+(?:graça|grátis|fácil)/gi, reason: 'Promessa de ganho fácil', weight: 75 },
    { pattern: /(?:ganhe?)\s+(?:r\$|reais?)?\s*\d{3,}.*(?:mil|k)/gi, reason: 'Ganhos irreais', weight: 80 },
    { pattern: /(?:ganhe?|lucro)\s+.*(?:sem sair de casa|trabalhando em casa)/gi, reason: 'Trabalho fácil suspeito', weight: 65 },
    { pattern: /corre?!!*/gi, reason: 'Criação de urgência artificial', weight: 45 },
    { pattern: /(?:urgente|rápido|limitado).*(?:oferta|promoção)/gi, reason: 'Pressão por ação imediata', weight: 55 },
    { pattern: /cura.*(aids|câncer|diabetes).*(caseiro|chá|natural)/i, reason: 'Cura milagrosa', weight: 100 },
    { pattern: /(?:elimine|acabe com).*(gordura|peso).*(?:1|uma) semana/i, reason: 'Emagrecimento irreal', weight: 75 },
    { pattern: /(?:remédio|tratamento).*(proibido|secret[ao])/i, reason: 'Tratamento secreto', weight: 70 },
    { pattern: /chip.*(vacina|covid)/i, reason: 'Teoria conspiratória - Chip', weight: 85 },
    { pattern: /nova ordem mundial/i, reason: 'Teoria conspiratória - NOM', weight: 75 },
    { pattern: /illuminati|maçonaria.*controla/i, reason: 'Teoria conspiratória', weight: 70 },
    { pattern: /(?:terra|planeta).*(plana|chata)/i, reason: 'Terra plana', weight: 80 },
    { pattern: /(?:morto|falecido).*(?:aparece|ressurge|fala)/i, reason: 'Impossibilidade física', weight: 95 },
    { pattern: /fim do mundo.*(?:confirmado|previsto para)/i, reason: 'Profecia apocalíptica', weight: 80 },
    { pattern: /(?:alien[íi]gena|ovni|et).*(?:governo|nasa)/i, reason: 'Teoria alienígena', weight: 70 },
    { pattern: /(?:comunista|socialista).*(?:dominar|controlar)/i, reason: 'Teoria política radical', weight: 60 },
    { pattern: /(?:ditadura|autoritarismo).*(?:brasil|país)/i, reason: 'Alarme político exagerado', weight: 55 },
    { pattern: /(?:vacina).*(?:mata|doente|perigo)/i, reason: 'Teoria anti-vacina', weight: 80 },
    { pattern: /(?:5g).*(?:cancer|doença)/i, reason: 'Teoria conspiratória 5G', weight: 75 }
  ];
  
  for (const { pattern, reason, weight } of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      reasons.push(`${reason} [${matches.length}x]`);
      score += weight * matches.length;
    }
  }
  
  const capsRatio = (text.match(/[A-ZÀ-Ú]/g) || []).length / text.length;
  if (capsRatio > 0.35) {
    reasons.push('Excesso de MAIÚSCULAS (' + (capsRatio * 100).toFixed(0) + '%)');
    score += 40;
  }
  
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 2) {
    reasons.push(`Excesso de exclamações (${exclamations}x)`);
    score += exclamations * 15;
  }
  
  const absolutePatterns = [
    /(?:nunca|sempre|todo|todos|ninguém|jamais).*(?:deve|precisa|tem)/gi,
    /(?:com certeza|absolutamente|definitivamente).*(?:verdade|real)/gi
  ];
  
  absolutePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      reasons.push(`Afirmação absoluta [${matches.length}x]`);
      score += matches.length * 20;
    }
  });
  
  return { 
    isAbsurd: score >= 25,
    isCritical: score >= 50,
    reasons, 
    score 
  };
}

// ==========================================
// SIMILARIDADE SEMÂNTICA
// ==========================================
function calculateSemanticSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const normalize = (text) => {
    return text.toLowerCase()
      .replace(/[^\wáéíóúâêôãõç\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);
  };
  
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

// ==========================================
// ANÁLISE CONTEXTUAL DE FONTES RIGOROSA
// ==========================================
function analyzeSourcesContextualRelevance(originalText, sources) {
  if (!sources || sources.length === 0) {
    return { avgSimilarity: 0, relevantSources: 0, contextMatch: 'NONE', tier1Count: 0 };
  }
  
  let totalSimilarity = 0;
  let relevantCount = 0;
  
  const tier1Sources = [
    'g1.globo', 'uol.com.br', 'folha.uol', 'estadao.com.br', 'bbc.com', 
    'cnn.com.br', 'oglobo.globo', 'reuters.com', 'agenciabrasil.ebc',
    'apnews.com', 'afp.com', 'dw.com', 'valor.com.br', 'nexojornal.com.br',
    'piaui.folha.uol', 'brasil.elpais.com'
  ];
  let tier1Count = 0;
  
  sources.forEach(source => {
    const similarity = calculateSemanticSimilarity(
      originalText, 
      source.title + ' ' + (source.description || '')
    );
    
    source.semanticSimilarity = similarity;
    
    if (similarity >= 40) relevantCount++;
    
    if (tier1Sources.some(t => source.domain.includes(t))) {
      source.isTier1 = true;
      tier1Count++;
    }
    
    totalSimilarity += similarity;
  });
  
  const avgSimilarity = totalSimilarity / sources.length;
  
  let contextMatch;
  if (avgSimilarity >= 60) contextMatch = 'HIGH';
  else if (avgSimilarity >= 40) contextMatch = 'MEDIUM';
  else if (avgSimilarity >= 25) contextMatch = 'LOW';
  else contextMatch = 'NONE';
  
  console.log(`🔍 Análise Rigorosa: ${avgSimilarity.toFixed(1)}% similaridade | ${relevantCount}/${sources.length} relevantes | ${tier1Count} tier 1`);
  
  return { avgSimilarity, relevantSources: relevantCount, contextMatch, tier1Count };
}

// ==========================================
// SISTEMA DE CLASSIFICAÇÃO RIGOROSO
// ==========================================
function determineAdvancedLevel(newsText, sources, contextAnalysis) {
  const absurdityCheck = detectAbsurdity(newsText);
  const sensationalismCheck = detectSensationalism(newsText);
  
  console.log('🔍 [ANÁLISE RIGOROSA]', {
    texto: newsText.substring(0, 100) + '...',
    absurdo: absurdityCheck.score,
    sensacionalismo: sensationalismCheck.score,
    fontes: sources.length,
    relevantes: contextAnalysis.relevantSources,
    tier1: contextAnalysis.tier1Count
  });
  
  // REGRA 1: Conteúdo crítico = BAIXA imediata
  if (absurdityCheck.isCritical || absurdityCheck.score >= 50) {
    return { 
      level: 'BAIXA', 
      reason: 'Conteúdo extremamente suspeito detectado', 
      absurdityScore: absurdityCheck.score, 
      sensationalismScore: sensationalismCheck.score, 
      contextMatch: contextAnalysis.contextMatch,
      confidence: 95
    };
  }
  
  // REGRA 2: Múltiplos sinais de alerta = BAIXA
  if ((absurdityCheck.score >= 30 && sensationalismCheck.score >= 40) || 
      (absurdityCheck.score >= 25 && sensationalismCheck.score >= 50)) {
    return { 
      level: 'BAIXA', 
      reason: 'Múltiplos padrões de desinformação', 
      absurdityScore: absurdityCheck.score, 
      sensationalismScore: sensationalismCheck.score, 
      contextMatch: contextAnalysis.contextMatch,
      confidence: 90
    };
  }
  
  // REGRA 3: Sensacionalismo alto sem fontes confiáveis = BAIXA
  if (sensationalismCheck.score >= 50 && contextAnalysis.tier1Count === 0) {
    return { 
      level: 'BAIXA', 
      reason: 'Sensacionalismo extremo sem fontes confiáveis', 
      absurdityScore: absurdityCheck.score, 
      sensationalismScore: sensationalismCheck.score, 
      contextMatch: contextAnalysis.contextMatch,
      confidence: 85
    };
  }
  
  // REGRA 4: Absurdo moderado sem confirmação = BAIXA
  if (absurdityCheck.score >= 30 && contextAnalysis.relevantSources < 2) {
    return { 
      level: 'BAIXA', 
      reason: 'Conteúdo suspeito sem confirmação suficiente', 
      absurdityScore: absurdityCheck.score, 
      sensationalismScore: sensationalismCheck.score, 
      contextMatch: contextAnalysis.contextMatch,
      confidence: 80
    };
  }
  
  // REGRA 5: Sem fontes + sensacionalismo = BAIXA
  if (sources.length === 0 && sensationalismCheck.score >= 30) {
    return { 
      level: 'BAIXA', 
      reason: 'Notícia sem fontes e com linguagem sensacionalista', 
      absurdityScore: absurdityCheck.score, 
      sensationalismScore: sensationalismCheck.score, 
      contextMatch: contextAnalysis.contextMatch,
      confidence: 75
    };
  }
  
  // CLASSIFICAÇÃO POR FONTES E RELEVÂNCIA (MAIS RIGOROSA)
  let baseLevel;
  let confidence = 60;
  
  // ALTA: Requisitos MUITO rigorosos
  if (contextAnalysis.tier1Count >= 3 && 
      contextAnalysis.contextMatch === 'HIGH' && 
      absurdityCheck.score < 15 &&
      sensationalismCheck.score < 20) {
    baseLevel = 'ALTA';
    confidence = 92;
  }
  // ALTA: Muitas fontes com alta relevância
  else if (sources.length >= 6 && 
           contextAnalysis.contextMatch === 'HIGH' && 
           contextAnalysis.relevantSources >= 5 &&
           contextAnalysis.tier1Count >= 2) {
    baseLevel = 'ALTA';
    confidence = 88;
  }
  // MÉDIA: Boa confirmação com algumas ressalvas
  else if (sources.length >= 4 && 
           contextAnalysis.relevantSources >= 3 &&
           absurdityCheck.score < 25) {
    baseLevel = 'MEDIA';
    confidence = 75;
  }
  // MÉDIA: Confirmação básica
  else if (sources.length >= 2 && 
           contextAnalysis.relevantSources >= 1 &&
           absurdityCheck.score < 30) {
    baseLevel = 'MEDIA';
    confidence = 65;
  }
  // NEUTRA: Pouca ou nenhuma confirmação
  else if (sources.length >= 1) {
    baseLevel = 'NEUTRA';
    confidence = 50;
  }
  // BAIXA: Sem fontes
  else {
    baseLevel = 'NEUTRA';
    confidence = 45;
  }
  
  // PENALIZAÇÕES RIGOROSAS
  
  // Penalidade por sensacionalismo
  if (sensationalismCheck.score >= 30) {
    confidence -= 25;
    if (baseLevel === 'ALTA') baseLevel = 'MEDIA';
    else if (baseLevel === 'MEDIA') baseLevel = 'NEUTRA';
    else if (baseLevel === 'NEUTRA') baseLevel = 'BAIXA';
  }
  
  // Penalidade por absurdo moderado
  if (absurdityCheck.score >= 20) {
    confidence -= 20;
    if (baseLevel === 'ALTA') baseLevel = 'MEDIA';
    else if (baseLevel === 'MEDIA') baseLevel = 'NEUTRA';
  }
  
  // Penalidade por poucas fontes tier 1
  if (contextAnalysis.tier1Count === 0 && sources.length > 0) {
    confidence -= 10;
    if (baseLevel === 'ALTA') baseLevel = 'MEDIA';
  }
  
  // Bônus por múltiplas fontes tier 1
  if (contextAnalysis.tier1Count >= 3) {
    confidence += 10;
  }
  
  return { 
    level: baseLevel, 
    reason: 'Análise contextual rigorosa completa', 
    absurdityScore: absurdityCheck.score, 
    sensationalismScore: sensationalismCheck.score, 
    contextMatch: contextAnalysis.contextMatch,
    confidence: Math.max(45, Math.min(95, confidence))
  };
}

// ==========================================
// ANÁLISE COMPLETA DO SISTEMA
// ==========================================
async function analyzeWithAdvancedSystem(newsText, sources) {
  const absurdityCheck = detectAbsurdity(newsText);
  const sensationalismCheck = detectSensationalism(newsText);
  const contextAnalysis = analyzeSourcesContextualRelevance(newsText, sources);
  const classification = determineAdvancedLevel(newsText, sources, contextAnalysis);
  
  const pontos_atencao = [];
  
  if (sources.length > 0) {
    pontos_atencao.push(
      `${contextAnalysis.relevantSources}/${sources.length} fontes relevantes (${contextAnalysis.avgSimilarity.toFixed(0)}% similaridade)`,
      `${contextAnalysis.tier1Count} fonte(s) de alta confiabilidade detectada(s)`
    );
  } else {
    pontos_atencao.push('Nenhuma fonte encontrada - pode ser notícia muito recente ou local');
  }
  
  if (sensationalismCheck.score > 0) {
    pontos_atencao.push(`⚠️ Sensacionalismo detectado (${sensationalismCheck.score} pts): ${sensationalismCheck.triggers.join(', ')}`);
  }
  
  if (absurdityCheck.score > 0) {
    pontos_atencao.push(`🚨 Sinais de desinformação (${absurdityCheck.score} pts): ${absurdityCheck.reasons.join(', ')}`);
  }
  
  pontos_atencao.push(`Confiança da análise: ${classification.confidence}%`);
  
  let explicacao, recomendacao;
  
  if (classification.level === 'ALTA') {
    explicacao = `✅ ${sources.length} fontes confiáveis encontradas com alta relevância contextual (${contextAnalysis.avgSimilarity.toFixed(0)}%). ${contextAnalysis.tier1Count > 0 ? `Inclui ${contextAnalysis.tier1Count} veículo(s) de referência.` : ''} Notícia amplamente coberta e verificável.`;
    recomendacao = '✅ Notícia verificada por múltiplas fontes. Pode compartilhar com segurança, mas sempre cite a fonte original.';
  } 
  else if (classification.level === 'MEDIA') {
    explicacao = `⚠️ ${sources.length} fonte(s) encontrada(s) com relevância moderada. ${sensationalismCheck.score > 0 ? 'Linguagem sensacionalista detectada. ' : ''}${contextAnalysis.contextMatch === 'LOW' ? 'Fontes não confirmam totalmente o conteúdo.' : ''}`;
    recomendacao = '⚠️ Verifique as fontes listadas abaixo antes de compartilhar. Busque confirmação em veículos de referência (G1, Folha, BBC, Estadão).';
  } 
  else if (classification.level === 'BAIXA') {
    explicacao = `🚨 Múltiplos sinais de alerta detectados. ${absurdityCheck.reasons.length > 0 ? 'Padrões de desinformação identificados: ' + absurdityCheck.reasons.join(', ') + '. ' : ''}Alto risco de fake news.`;
    recomendacao = '🚨 NÃO COMPARTILHE. Notícia apresenta características típicas de desinformação. Verifique em fact-checkers (Aos Fatos, Lupa, Comprova).';
  } 
  else {
    explicacao = `ℹ️ Nenhuma fonte ampla encontrada. ${sensationalismCheck.score > 0 ? 'Linguagem sensacionalista detectada. ' : ''}Pode ser notícia muito recente, local ou sem cobertura jornalística.`;
    recomendacao = '🔍 Busque confirmar em fontes oficiais e veículos de referência antes de acreditar ou compartilhar.';
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
      contextMatch: contextAnalysis.contextMatch,
      confidence: classification.confidence,
      tier1Count: contextAnalysis.tier1Count
    };
  } catch (error) {
    console.warn('⚠️ Gemini indisponível, usando análise local');
    return {
      nivel: classification.level,
      explicacao,
      pontos_atencao,
      recomendacao,
      sensacionalismo: sensationalismCheck.score > 0 ? sensationalismCheck : null,
      absurdo: absurdityCheck.score > 0 ? absurdityCheck : null,
      contextMatch: contextAnalysis.contextMatch,
      confidence: classification.confidence,
      tier1Count: contextAnalysis.tier1Count
    };
  }
}

// ==========================================
// INTEGRAÇÃO COM GEMINI
// ==========================================
async function analyzeWithGemini(newsText, sources, classification) {
  const sourcesInfo = sources.length > 0 
    ? `Fontes: ${sources.slice(0, 3).map(s => s.source).join(', ')}` 
    : 'Sem fontes encontradas';
  
  const prompt = `Análise de confiabilidade - ConfIA

Notícia: "${newsText}"
Classificação automática: ${classification.level}
${sourcesInfo}
Score de absurdo: ${classification.absurdityScore}
Score de sensacionalismo: ${classification.sensationalismScore}

IMPORTANTE: Mantenha a classificação ${classification.level}.

Retorne JSON:
{
  "nivel": "${classification.level}",
  "explicacao": "explicação clara e educativa em português (máx 2 frases)",
  "recomendacao": "recomendação prática e objetiva"
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEYS.gemini}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.3, 
        maxOutputTokens: 500 
      }
    })
  });
  
  if (!response.ok) {
    throw new Error('Gemini API error');
  }
  
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text
    .replace(/```json\n?/g, '')
    .replace(/```/g, '')
    .trim();
  
  const analysis = JSON.parse(text);
  analysis.nivel = classification.level;
  
  return analysis;
}

// ==========================================
// BUSCA DE NOTÍCIAS - EXTRAÇÃO DE KEYWORDS
// ==========================================
function extractKeywords(text) {
  if (!text) return '';
  
  const properNouns = text.match(/\b[A-ZÀÁÂÃ][a-zàáâãäåèéêë]+(?:\s+[A-ZÀÁÂÃ][a-zàáâãäåèéêë]+)*/g);
  if (properNouns && properNouns.length > 0) {
    return properNouns.slice(0, 3).join(' ');
  }
  
  const stopWords = ['o', 'a', 'de', 'da', 'do', 'em', 'para', 'com', 'por', 'que', 'os', 'as', 'um', 'uma'];
  const words = text.toLowerCase()
    .replace(/[^\wáéíóúâêôãõç\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4 && !stopWords.includes(w));
  
  return words.sort((a, b) => b.length - a.length).slice(0, 4).join(' ');
}

// ==========================================
// CÁLCULO DE RELEVÂNCIA
// ==========================================
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

// ==========================================
// REMOÇÃO DE DUPLICATAS
// ==========================================
function removeDuplicates(articles, query) {
  if (!Array.isArray(articles)) return [];
  
  const seen = new Set();
  const filtered = [];
  
  articles.forEach(article => {
    if (!article || !article.title) return;
    
    const normalized = article.title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .substring(0, 50);
    
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

// ==========================================
// NEWSDATA.IO API
// ==========================================
async function searchNewsData(keywords, originalQuery) {
  try {
    console.log('🔍 [NewsData] Buscando...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const url = `https://newsdata.io/api/1/news?apikey=${API_KEYS.newsdata}&q=${encodeURIComponent(keywords)}&language=pt&country=br`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn('⚠️ [NewsData] HTTP', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log('ℹ️ [NewsData] Sem resultados');
      return [];
    }
    
    console.log(`✅ [NewsData] ${data.results.length} notícias`);
    
    return data.results.map(a => ({
      title: a.title,
      source: a.source_id || 'NewsData',
      url: a.link,
      publishedAt: a.pubDate,
      description: a.description || '',
      logoUrl: getLogoUrl(a.link),
      domain: extractDomain(a.link),
      api: 'NewsData.io'
    }));
  } catch (error) {
    console.error('❌ [NewsData]:', error.name === 'AbortError' ? 'Timeout' : error.message);
    return [];
  }
}

// ==========================================
// CURRENTS API
// ==========================================
async function searchCurrents(keywords, originalQuery) {
  try {
    console.log('🔍 [Currents] Buscando...');
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    
    const url = `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(keywords)}&language=pt&apiKey=${API_KEYS.currents}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.warn('⚠️ [Currents] HTTP', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.news || data.news.length === 0) {
      console.log('ℹ️ [Currents] Sem resultados');
      return [];
    }
    
    console.log(`✅ [Currents] ${data.news.length} notícias`);
    
    return data.news.map(a => ({
      title: a.title,
      source: a.author || 'Currents',
      url: a.url,
      publishedAt: a.published,
      description: a.description || '',
      logoUrl: getLogoUrl(a.url),
      domain: extractDomain(a.url),
      api: 'Currents API'
    }));
  } catch (error) {
    console.error('❌ [Currents]:', error.name === 'AbortError' ? 'Timeout' : error.message);
    return [];
  }
}

// ==========================================
// BUSCA EM TODAS AS APIS
// ==========================================
async function searchAllAPIs(keywords, originalQuery) {
  console.log('🔍 Buscando fontes...');
  
  const cacheKey = keywords.toLowerCase();
  const cached = searchCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log('💾 Cache hit! Usando resultados salvos');
    return cached.results;
  }
  
  const [newsdataResults, currentsResults] = await Promise.all([
    searchNewsData(keywords, originalQuery),
    searchCurrents(keywords, originalQuery)
  ]);
  
  const allResults = [...newsdataResults, ...currentsResults];
  const uniqueResults = removeDuplicates(allResults, originalQuery);
  
  console.log(`✅ Total: ${allResults.length} → ${uniqueResults.length} (após filtros)`);
  
  searchCache.set(cacheKey, {
    results: uniqueResults,
    timestamp: Date.now()
  });
  
  return uniqueResults;
}

// ==========================================
// UTILITÁRIOS
// ==========================================
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
// RENDERIZAÇÃO DE FEEDBACK
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
            <strong style="color: #fdba74; font-size: 1.05rem;">Linguagem Sensacionalista Detectada</strong><br><br>
            <span style="color: #fed7aa; line-height: 1.6; font-size: 0.95rem;">
              Clickbait (${analysis.sensacionalismo.score} pts): ${analysis.sensacionalismo.triggers.join(', ')}
            </span>
          </div>
        </div>
      </div>
    `;
  }
  
  if (analysis.absurdo && analysis.absurdo.score >= 25) {
    html += `
      <div style="padding: 1.25rem; background: #7f1d1d; border: 2px solid #ef4444; border-radius: 12px; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: start; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">⛔</span>
          <div>
            <strong style="color: #fca5a5; font-size: 1.05rem;">Padrões de Desinformação</strong><br><br>
            <span style="color: #fecaca; line-height: 1.6; font-size: 0.95rem;">
              Detectado (${analysis.absurdo.score} pts): ${analysis.absurdo.reasons.join(', ')}
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
        <strong style="color: #e5e5e5; font-size: 1.05rem;">Análise Inteligente</strong>
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
          <strong style="color: #e5e5e5; font-size: 1.05rem;">Detalhes da Análise</strong>
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
        <strong style="color: #e5e5e5; font-size: 1.05rem;">Fontes Consultadas</strong>
      </div>
      <div style="padding: 1rem; background: #1a1a1a; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <div style="color: #93c5fd; line-height: 1.8;">
          • <strong>${sources.length}</strong> notícia(s) encontrada(s)<br>
          • APIs utilizadas: NewsData.io, Currents API<br>
          • Análise: ${analysis.contextMatch} relevância contextual
        </div>
      </div>
    </div>
  `;
  
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
  
  if (analysis.nivel === 'BAIXA') {
    html += `
      <div style="margin-top: 1.5rem; padding: 1rem; background: #1e293b; border: 2px solid #64748b; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="font-size: 1.3rem;">📚</span>
          <strong style="color: #94a3b8; font-size: 0.95rem;">Dica Educativa</strong>
        </div>
        <p style="margin: 0; color: #cbd5e1; font-size: 0.9rem; line-height: 1.6;">
          Confira em fact-checkers: <strong>Aos Fatos</strong>, <strong>Agência Lupa</strong>, <strong>Comprova</strong>. 
          Desconfie de linguagem emocional, promessas irreais e notícias sem fonte identificável.
        </p>
      </div>
    `;
  }
  
  feedbackTextEl.innerHTML = html;
}

// ==========================================
// RENDERIZAÇÃO DE FONTES
// ==========================================
function renderSources(sources) {
  sourcesGrid.innerHTML = '';
  if (sources.length === 0) return;
  
  const title = document.createElement('div');
  title.style.cssText = `margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 12px; border-left: 4px solid #3b82f6;`;
  title.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <span style="font-size: 1.8rem;">📰</span>
      <div>
        <strong style="color: #93c5fd; font-size: 1.2rem;">Notícias Relacionadas</strong>
        <p style="margin: 0.5rem 0 0 0; color: #cbd5e1; font-size: 0.9rem;">${sources.length} notícia${sources.length > 1 ? 's' : ''} • Ordenadas por relevância</p>
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
    
    card.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: start;">
        <div style="flex-shrink: 0;">${logoHTML}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: #e5e5e5; margin-bottom: 0.25rem;">
            ${source.source}
          </div>
          <div style="color: #9ca3af; font-size: 0.8rem; margin-bottom: 0.75rem;">
            🌐 ${source.domain} ${publishDate ? `• 📅 ${publishDate}` : ''} • ${source.api}
            ${source.semanticSimilarity ? `<br>📊 Relevância: ${source.semanticSimilarity.toFixed(0)}%` : ''}
          </div>
          <div style="color: #d1d5db; line-height: 1.5; margin-bottom: 0.75rem; font-weight: 500;">${source.title}</div>
          ${source.description ? `<div style="color: #9ca3af; font-size: 0.9rem; line-height: 1.4; margin-bottom: 0.75rem;">${source.description.substring(0, 150)}${source.description.length > 150 ? '...' : ''}</div>` : ''}
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.85rem; background: #3b82f6; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
            🔗 Ler notícia completa
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
// RATE LIMITER MELHORADO
// ==========================================
const rateLimiter = {
  requests: {
    search: [],
    ocr: []
  },
  limits: {
    search: { max: 8, window: 60000 },
    ocr: { max: 3, window: 60000 }
  },
  
  canMakeRequest(type = 'search') {
    const now = Date.now();
    const limit = this.limits[type];
    
    if (!this.requests[type]) this.requests[type] = [];
    
    this.requests[type] = this.requests[type].filter(t => now - t < limit.window);
    
    if (this.requests[type].length >= limit.max) {
      return false;
    }
    
    this.requests[type].push(now);
    return true;
  },
  
  getTimeUntilReset(type = 'search') {
    const limit = this.limits[type];
    const requests = this.requests[type] || [];
    
    if (requests.length === 0) return 0;
    
    const oldest = Math.min(...requests);
    return Math.max(0, Math.ceil((limit.window - (Date.now() - oldest)) / 1000));
  }
};

// ==========================================
// HANDLE SEARCH
// ==========================================
async function handleSearch() {
  const query = searchInput.value.trim();
  
  if (!query) {
    alert('❌ Digite uma notícia para verificar.');
    return;
  }
  
  const cleanQuery = sanitizeInput(query);
  
  const validation = validateInput(cleanQuery);
  if (!validation.valid) {
    alert('❌ ' + validation.errors.join('\n'));
    return;
  }
  
  if (!rateLimiter.canMakeRequest('search')) {
    alert(`⏱️ Limite de buscas atingido.\nAguarde ${rateLimiter.getTimeUntilReset('search')} segundos.`);
    return;
  }
  
  const old = document.getElementById('extractedTextBox');
  if (old) old.remove();
  
  resultsSection.classList.add('active');
  verificationBox.style.display = 'block';
  
  try {
    updateVerificationStatus('🔍 Extraindo keywords...');
    const keywords = extractKeywords(cleanQuery);
    
    updateVerificationStatus('📰 Buscando em múltiplas fontes...');
    const sources = await searchAllAPIs(keywords, cleanQuery);
    
    updateVerificationStatus('🤖 Analisando confiabilidade...');
    const analysis = await analyzeWithAdvancedSystem(cleanQuery, sources);
    
    verificationBox.style.display = 'none';
    
    analytics.logSearch(cleanQuery, analysis.nivel, sources.length);
    
    renderFeedback(analysis, sources);
    renderSources(sources);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    verificationBox.style.display = 'none';
    
    feedbackText.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
        <strong style="color: #ef4444; font-size: 1.2rem;">Erro ao verificar notícia</strong>
        <p style="color: #9ca3af; margin-top: 1rem;">${error.message || 'Tente novamente em alguns instantes.'}</p>
      </div>
    `;
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
    
    console.log('📊 Estatísticas:', { 
      total: this.totalSearches, 
      nivel: level, 
      fontes: sourcesCount,
      distribuicao: this.classifications 
    });
    
    if (this.totalSearches % 10 === 0) {
      console.log('📈 Milestone: 10 análises realizadas');
      console.log('📊 Distribuição:', this.classifications);
    }
  },
  
  getStats() {
    return {
      total: this.totalSearches,
      classifications: this.classifications,
      avgPerLevel: Object.entries(this.classifications).map(([k, v]) => ({
        nivel: k,
        count: v,
        percentage: ((v / this.totalSearches) * 100).toFixed(1) + '%'
      }))
    };
  }
};

// ==========================================
// LIMPEZA DE CACHE AUTOMÁTICA
// ==========================================
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      searchCache.delete(key);
      removed++;
    }
  }
  
  if (removed > 0) {
    console.log(`🧹 Cache limpo: ${removed} entrada(s) removida(s)`);
  }
}, CACHE_DURATION);

// ==========================================
// HEALTH CHECK DO SISTEMA
// ==========================================
function healthCheck() {
  const checks = {
    dom: !!(searchInput && searchBtn && resultsSection && verificationBox),
    apis: Object.values(API_KEYS).every(key => key && key.length > 10),
    cache: searchCache instanceof Map,
    rateLimiter: typeof rateLimiter.canMakeRequest === 'function'
  };
  
  const healthy = Object.values(checks).every(v => v === true);
  
  console.log('🏥 Health Check:', {
    status: healthy ? '✅ SAUDÁVEL' : '⚠️ PROBLEMAS',
    checks
  });
  
  return healthy;
}

// ==========================================
// INICIALIZAÇÃO DO SISTEMA
// ==========================================
console.log('═══════════════════════════════════════');
console.log('✅ ConfIA v8.0 - Sistema RIGOROSO Carregado!');
console.log('═══════════════════════════════════════');
console.log('');
console.log('🔑 APIs Configuradas:');
console.log('  ✓ NewsData.io (notícias brasileiras)');
console.log('  ✓ Currents API (notícias internacionais)');
console.log('  ✓ Google Gemini 2.0 Flash (análise IA)');
console.log('  ✓ OCR.space (extração de texto)');
console.log('');
console.log('🚀 Recursos Ativos:');
console.log('  ✓ Validação de entrada reforçada');
console.log('  ✓ Detecção RIGOROSA de sensacionalismo');
console.log('  ✓ Identificação RIGOROSA de padrões de fake news');
console.log('  ✓ Análise semântica contextual aprimorada');
console.log('  ✓ Sistema de score de confiabilidade rigoroso');
console.log('  ✓ Priorização de fontes tier 1 expandida');
console.log('  ✓ Cache inteligente (5min)');
console.log('  ✓ Rate limiting (8 buscas/min, 3 OCR/min)');
console.log('  ✓ Busca paralela em 2 APIs');
console.log('  ✓ Timeout de 8 segundos por API');
console.log('');
console.log('🛡️ Melhorias RIGOROSAS v8.0:');
console.log('  ✓ Threshold de absurdidade: 25 → 50 pts (crítico)');
console.log('  ✓ Detecção "dinheiro grátis": 85 pontos');
console.log('  ✓ Detecção "CORRE!!": 45 pontos');
console.log('  ✓ CAPS LOCK > 25%: penalidade alta');
console.log('  ✓ 2+ exclamações: penalização automática');
console.log('  ✓ Classificação BAIXA mais sensível');
console.log('  ✓ Sem fontes + sensacionalismo = BAIXA');
console.log('');
console.log('🎯 Detecção de Fake News RIGOROSA:');
console.log('  ✓ Teorias conspiratórias');
console.log('  ✓ Promessas financeiras irreais (85 pts)');
console.log('  ✓ Curas milagrosas (100 pts)');
console.log('  ✓ Clickbait e sensacionalismo (40-50 pts)');
console.log('  ✓ Impossibilidades físicas/temporais');
console.log('  ✓ Urgência artificial detectada');
console.log('  ✓ Análise de consenso entre fontes');
console.log('');
console.log('📊 Analytics:');
console.log('  ✓ Rastreamento de classificações');
console.log('  ✓ Estatísticas de uso');
console.log('  ✓ Performance monitoring');
console.log('');

setTimeout(() => {
  const healthy = healthCheck();
  if (!healthy) {
    console.error('⚠️ Sistema com problemas detectados!');
  }
}, 1000);

// ==========================================
// UTILITÁRIOS DE DEBUG
// ==========================================
window.ConfIADebug = {
  getStats: () => analytics.getStats(),
  getCache: () => ({
    size: searchCache.size,
    keys: Array.from(searchCache.keys())
  }),
  getRateLimits: () => ({
    search: {
      current: rateLimiter.requests.search.length,
      max: rateLimiter.limits.search.max,
      reset: rateLimiter.getTimeUntilReset('search')
    },
    ocr: {
      current: rateLimiter.requests.ocr.length,
      max: rateLimiter.limits.ocr.max,
      reset: rateLimiter.getTimeUntilReset('ocr')
    }
  }),
  clearCache: () => {
    const size = searchCache.size;
    searchCache.clear();
    console.log(`🧹 Cache limpo: ${size} entrada(s) removida(s)`);
  },
  healthCheck: healthCheck,
  version: '8.0 RIGOROSO',
  features: [
    'Validação reforçada',
    'Detecção RIGOROSA de fake news',
    'Análise semântica melhorada',
    'Sistema de confiança rigoroso',
    'Priorização de fontes tier 1',
    'Rate limiting aprimorado',
    'Penalizações mais severas',
    'Classificação BAIXA mais sensível'
  ]
};

console.log('');
console.log('💡 Dica: Use window.ConfIADebug para acessar ferramentas de debug');
console.log('   Exemplo: window.ConfIADebug.getStats()');
console.log('');
console.log('⚠️ MODO RIGOROSO: Fake news será classificada como BAIXA');
console.log('═══════════════════════════════════════');