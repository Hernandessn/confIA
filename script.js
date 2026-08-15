// ==========================================
// CONFIA v10.0 - FRONTEND (backend faz o trabalho pesado)
// Sistema de verificação de fake news com IA
// ==========================================
//
// NADA de chave de API aqui. Toda chamada externa (Groq, NewsData,
// Currents, OCR.space) passa pelas Netlify Functions em /netlify/functions.
// Isso é INTENCIONAL: as chaves ficam só nas env vars do servidor.

const FN = {
  search: '/.netlify/functions/search-news',
  ocr: '/.netlify/functions/ocr',
  analyze: '/.netlify/functions/analyze',
  recentNews: '/.netlify/functions/recent-news'
};

// ==========================================
// CACHE E CONFIGURAÇÕES GLOBAIS
// ==========================================
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_HISTORY_ITEMS = 10;

console.log('✅ ConfIA v10.0 - Backend via Netlify Functions');

// ==========================================
// UTIL: escape de HTML (crítico p/ conteúdo vindo de APIs externas)
// ==========================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const uploadBtn = document.getElementById("uploadBtn");
const imageInput = document.getElementById("imageInput");
const resultsSection = document.getElementById("resultsSection");
const verificationBox = document.getElementById("verificationBox");
const feedbackText = document.getElementById("feedbackText");
const sourcesGrid = document.getElementById("sourcesGrid");
const charCounter = document.getElementById("charCounter");
const apiStatus = document.getElementById("apiStatus");
const recentNewsWidget = document.getElementById("recentNewsWidget");
const recentNewsList = document.getElementById("recentNewsList");
const explanationBtn = document.getElementById("explanationBtn");
const confiaTip = document.getElementById("confiaTip");
const tipText = document.getElementById("tipText");

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
const historyBtn = document.getElementById('historyBtn');
const statsBtn = document.getElementById('statsBtn');

const modalData = {
  howItWorks: {
    icon: '⚙️',
    title: 'Como funciona o ConfIA?',
    content: `
      <p>O ConfIA utiliza <strong>Inteligência Artificial</strong> (Groq) e <strong>APIs de notícia</strong> para verificar manchetes e avaliar sua confiabilidade.</p>
      <h3 style="color: #3b82f6; margin-top: 1.5rem; margin-bottom: 0.75rem;">🔍 Sistema de Análise em 3 Camadas:</h3>
      <ul style="line-height: 2; padding-left: 1.5rem;">
        <li><strong>Camada Semântica:</strong> Analisa o significado e contexto das palavras</li>
        <li><strong>Camada Comportamental:</strong> Detecta padrões de sensacionalismo e clickbait</li>
        <li><strong>Camada Lógica:</strong> Identifica contradições e absurdos</li>
      </ul>
      <h3 style="color: #3b82f6; margin-top: 1.5rem; margin-bottom: 0.75rem;">🎯 Classificação de Confiabilidade:</h3>
      <ul style="line-height: 2; padding-left: 1.5rem;">
        <li>🟢 <strong>ALTA:</strong> Confirmada por múltiplas fontes confiáveis</li>
        <li>🟡 <strong>MÉDIA:</strong> Parcialmente verificada, requer cautela</li>
        <li>🔵 <strong>NEUTRA:</strong> Sem confirmação ampla (pode ser regional/recente)</li>
        <li>🔴 <strong>BAIXA:</strong> Sinais de desinformação detectados</li>
      </ul>
      <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 0.5rem;">
        <strong style="color: #ef4444;">⚠️ Importante:</strong> Este é um sistema educativo. Sempre confirme informações importantes em múltiplas fontes confiáveis.
      </div>
    `
  },
  about: {
    icon: 'ℹ️',
    title: 'Sobre o ConfIA',
    content: `
      <p>O ConfIA é um projeto educativo desenvolvido para <strong>combater a desinformação</strong> e ensinar as pessoas a identificarem fake news.</p>
      <h3 style="color: #3b82f6; margin-top: 1.5rem; margin-bottom: 0.75rem;">🛠️ Tecnologias Utilizadas:</h3>
      <ul style="line-height: 2; padding-left: 1.5rem;">
        <li><strong>Groq:</strong> Análise de linguagem natural.</li>
        <li><strong>NewsData.io:</strong> Base de notícias brasileiras.</li>
        <li><strong>OCR.space:</strong> Extração de texto de imagens.</li>
        <li><strong>Chart.js:</strong> Visualização de dados.</li>
      </ul>
      <h3 style="color: #3b82f6; margin-top: 1.5rem; margin-bottom: 0.75rem;">🔍 Fact-Checkers Recomendados:</h3>
      <ul style="line-height: 2; padding-left: 1.5rem;">
        <li><strong>Aos Fatos:</strong> aosfatos.org</li>
        <li><strong>Agência Lupa:</strong> piaui.folha.uol.com.br/lupa</li>
        <li><strong>Comprova:</strong> projetocomprova.com.br</li>
        <li><strong>Fato ou Fake (G1):</strong> g1.globo.com/fato-ou-fake</li>
      </ul>
    `
  },
  history: { icon: '📜', title: 'Histórico de Verificações', content: '<div id="historyContent"></div>' },
  stats: { icon: '📊', title: 'Estatísticas de Uso', content: '<div id="statsContent"></div>' }
};

function openModal(type) {
  const data = modalData[type];
  if (!data) return;
  modalIcon.textContent = data.icon;
  modalTitle.textContent = data.title;
  modalContent.innerHTML = data.content;
  if (type === 'history') renderHistoryModal();
  else if (type === 'stats') renderStatsModal();
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

if (howItWorksBtn) howItWorksBtn.addEventListener('click', () => openModal('howItWorks'));
if (aboutBtn) aboutBtn.addEventListener('click', () => openModal('about'));
if (historyBtn) historyBtn.addEventListener('click', () => openModal('history'));
if (statsBtn) statsBtn.addEventListener('click', () => openModal('stats'));
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) closeModal();
});

// ==========================================
// HISTÓRICO LOCAL (localStorage — por navegador, não por backend)
// ==========================================

function saveToHistory(query, level, sourcesCount) {
  try {
    const history = getHistory();
    history.unshift({ id: Date.now(), query: query.substring(0, 200), level, sourcesCount, timestamp: new Date().toISOString() });
    if (history.length > MAX_HISTORY_ITEMS) history.splice(MAX_HISTORY_ITEMS);
    localStorage.setItem('confiaHistory', JSON.stringify(history));
  } catch (error) {
    console.warn('⚠️ Erro ao salvar histórico:', error);
  }
}

function getHistory() {
  try {
    const stored = localStorage.getItem('confiaHistory');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function clearHistory() {
  try { localStorage.removeItem('confiaHistory'); } catch (error) { console.warn(error); }
}

function renderHistoryModal() {
  const container = document.getElementById('historyContent');
  if (!container) return;
  const history = getHistory();

  if (history.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon">📭</div>
        <p>Nenhuma verificação realizada ainda.</p>
      </div>`;
    return;
  }

  let html = '<div class="history-list">';
  history.forEach(item => {
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    html += `
      <div class="history-item">
        <div class="history-header">
          <span class="history-date">📅 ${escapeHtml(dateStr)}</span>
          <span class="history-level ${escapeHtml(item.level)}">${escapeHtml(item.level)}</span>
        </div>
        <div class="history-query">${escapeHtml(item.query)}</div>
        <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #9ca3af;">
          📰 ${item.sourcesCount} fonte${item.sourcesCount !== 1 ? 's' : ''} encontrada${item.sourcesCount !== 1 ? 's' : ''}
        </div>
      </div>`;
  });
  html += '</div>';
  html += `
    <div style="margin-top: 1.5rem; text-align: center;">
      <button onclick="clearHistoryAndRefresh()" style="background: #ef4444; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; font-weight: 600;">
        🗑️ Limpar Histórico
      </button>
    </div>`;
  container.innerHTML = html;
}

function clearHistoryAndRefresh() {
  if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
    clearHistory();
    renderHistoryModal();
  }
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
    saveToHistory(query, level, sourcesCount);
    this.saveStats();
  },

  saveStats() {
    try {
      localStorage.setItem('confiaStats', JSON.stringify({
        totalSearches: this.totalSearches,
        classifications: this.classifications,
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) { console.warn(error); }
  },

  loadStats() {
    try {
      const stored = localStorage.getItem('confiaStats');
      if (stored) {
        const stats = JSON.parse(stored);
        this.totalSearches = stats.totalSearches || 0;
        this.classifications = stats.classifications || { ALTA: 0, MEDIA: 0, NEUTRA: 0, BAIXA: 0 };
      }
    } catch (error) { console.warn(error); }
  },

  getStats() {
    return {
      total: this.totalSearches,
      classifications: this.classifications,
      avgPerLevel: Object.entries(this.classifications).map(([k, v]) => ({
        nivel: k, count: v,
        percentage: this.totalSearches > 0 ? ((v / this.totalSearches) * 100).toFixed(1) + '%' : '0%'
      }))
    };
  }
};
analytics.loadStats();

function renderStatsModal() {
  const container = document.getElementById('statsContent');
  if (!container) return;
  const stats = analytics.getStats();

  if (stats.total === 0) {
    container.innerHTML = `<div class="history-empty"><div class="history-empty-icon">📊</div><p>Nenhuma análise realizada ainda.</p></div>`;
    return;
  }

  let html = `
    <div class="dashboard-grid">
      <div class="dashboard-card"><div class="dashboard-value">${stats.total}</div><div class="dashboard-label">Total de Análises</div></div>
      <div class="dashboard-card"><div class="dashboard-value" style="color: #10b981;">${stats.classifications.ALTA}</div><div class="dashboard-label">Alta Confiabilidade</div></div>
      <div class="dashboard-card"><div class="dashboard-value" style="color: #f59e0b;">${stats.classifications.MEDIA}</div><div class="dashboard-label">Média Confiabilidade</div></div>
      <div class="dashboard-card"><div class="dashboard-value" style="color: #6366f1;">${stats.classifications.NEUTRA}</div><div class="dashboard-label">Neutra</div></div>
      <div class="dashboard-card"><div class="dashboard-value" style="color: #ef4444;">${stats.classifications.BAIXA}</div><div class="dashboard-label">Baixa Confiabilidade</div></div>
    </div>
    <div class="dashboard-chart">
      <h3 style="color: #ffffff; margin-bottom: 1rem;">📊 Distribuição de Classificações</h3>
      <div class="chart-bars">`;

  const maxValue = Math.max(...Object.values(stats.classifications));
  const colors = { ALTA: '#10b981', MEDIA: '#f59e0b', NEUTRA: '#6366f1', BAIXA: '#ef4444' };

  stats.avgPerLevel.forEach(item => {
    const height = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
    html += `
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; position: relative;">
        <div class="chart-bar-value">${item.count}</div>
        <div class="chart-bar" style="height: ${height}%; background: linear-gradient(to top, ${colors[item.nivel]}, ${colors[item.nivel]}dd);"></div>
        <div class="chart-bar-label">${item.nivel}<br>${item.percentage}</div>
      </div>`;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

// ==========================================
// VALIDAÇÃO E SANITIZAÇÃO DE ENTRADA (texto digitado pelo usuário)
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
  if (!text || text.length < 15) errors.push('❌ Texto muito curto. Digite pelo menos 15 caracteres.');
  if (text.length > 500) errors.push('❌ Texto muito longo. Máximo: 500 caracteres.');
  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
  if (suspiciousPatterns.some(p => p.test(text))) errors.push('❌ Entrada contém caracteres não permitidos.');
  if (/(.)\1{10,}/.test(text)) errors.push('❌ Texto com repetições suspeitas.');
  return { valid: errors.length === 0, errors };
}

function updateCharCounter() {
  if (!searchInput || !charCounter) return;
  const length = searchInput.value.length;
  const max = 500;
  charCounter.textContent = `${length} / ${max} caracteres`;
  charCounter.classList.remove('warning', 'error');
  if (length > max * 0.9) charCounter.classList.add('error');
  else if (length > max * 0.7) charCounter.classList.add('warning');
}
if (searchInput) searchInput.addEventListener('input', updateCharCounter);

// ==========================================
// UPLOAD E OCR (via backend)
// ==========================================

function validateImage(file) {
  const errors = [];
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) errors.push('❌ Formato inválido. Use apenas JPG ou PNG.');
  const maxSize = 10 * 1024 * 1024;
  const minSize = 10 * 1024;
  if (file.size > maxSize) errors.push(`❌ Imagem muito grande (${(file.size/1024/1024).toFixed(1)}MB). Máximo: 10MB.`);
  if (file.size < minSize) errors.push('❌ Imagem muito pequena ou corrompida. Tente uma imagem maior.');
  return { valid: errors.length === 0, errors };
}

async function compressImage(file, maxSizeKB = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) { height = (height / width) * maxDimension; width = maxDimension; }
          else { width = (width / height) * maxDimension; height = maxDimension; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.9;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.5) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        fetch(compressedDataUrl).then(res => res.blob()).then(blob => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

async function extractTextFromImage(file) {
  const dataUrl = await fileToDataUrl(file);
  const response = await fetch(FN.ocr, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image: dataUrl })
  });

  if (response.status === 429) {
    const err = await response.json();
    throw new Error(err.error || 'Limite de uploads atingido.');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Erro HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.text || '';
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const validation = validateImage(file);
  if (!validation.valid) {
    alert(validation.errors.join('\n'));
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
        </div>`;
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
        <p style="color: #9ca3af; margin-top: 1rem;">${escapeHtml(error.message)}</p>
      </div>`;
  } finally {
    event.target.value = '';
  }
}

function showExtractedText(text) {
  const old = document.getElementById('extractedTextBox');
  if (old) old.remove();
  const extractedTextBox = document.createElement('div');
  extractedTextBox.id = 'extractedTextBox';
  extractedTextBox.className = 'extracted-text-box';
  extractedTextBox.innerHTML = `
    <div class="extracted-header">
      <span class="extracted-icon">📝</span>
      <h3 class="extracted-title">Texto Reconhecido</h3>
    </div>
    <div class="extracted-content">${escapeHtml(text.trim())}</div>`;
  const feedbackBox = document.querySelector('.feedback-box');
  feedbackBox.parentNode.insertBefore(extractedTextBox, feedbackBox);
}

async function analyzeExtractedText(text) {
  verificationBox.style.display = 'block';
  const oldChart = document.getElementById('trustChartContainer');
  if (oldChart) oldChart.remove();
  if (recentNewsWidget) recentNewsWidget.style.display = 'none';

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
    renderTrustChart(analysis.nivel, analysis.confidence || 70);
    renderSources(sources);
    showConfiaTip(analysis.nivel);
    if (recentNewsWidget && resultsSection) {
      recentNewsWidget.style.display = 'block';
      resultsSection.appendChild(recentNewsWidget);
    }
  } catch (error) {
    console.error('Erro:', error);
    verificationBox.style.display = 'none';
    feedbackText.innerHTML = `<div style="padding: 2rem; text-align: center;"><div style="font-size: 3rem;">❌</div><strong style="color: #ef4444;">Erro ao analisar</strong></div>`;
    if (recentNewsWidget) recentNewsWidget.style.display = 'block';
  }
}

if (uploadBtn && imageInput) {
  uploadBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageUpload);
}

// ==========================================
// DETECÇÃO DE SENSACIONALISMO (lógica local, sem custo de API)
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
    if (matches) { triggers.push(`${name} [${matches.length}x]`); score += weight * matches.length; }
  });

  const sensationalWords = text.match(/urgente|chocante|inacreditável|bomba|escândalo|absurdo|polêmica|incrível|fantástico|surpreendente|revolucionário|extraordinário/gi) || [];
  if (sensationalWords.length >= 1) { triggers.push(`Linguagem sensacionalista (${sensationalWords.length}x)`); score += sensationalWords.length * 18; }

  const capsRatio = (text.match(/[A-ZÀ-Ú]/g) || []).length / text.length;
  if (capsRatio > 0.25) { triggers.push('Excesso de MAIÚSCULAS (' + (capsRatio * 100).toFixed(0) + '%)'); score += 30; }

  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  if (exclamations >= 2) { triggers.push(`Excesso de exclamações (${exclamations}x)`); score += exclamations * 12; }
  if (questions >= 3) { triggers.push(`Muitas interrogações (${questions}x)`); score += questions * 8; }

  const exaggeratedNumbers = text.match(/\b(\d{4,}|[0-9]+(?:mil|milhões|bilhões))\b/gi);
  if (exaggeratedNumbers && exaggeratedNumbers.length >= 2) { triggers.push(`Números exagerados (${exaggeratedNumbers.length}x)`); score += 25; }

  return { score, triggers };
}

// ==========================================
// DETECÇÃO DE ABSURDOS
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
    if (matches) { reasons.push(`${reason} [${matches.length}x]`); score += weight * matches.length; }
  }

  const capsRatio = (text.match(/[A-ZÀ-Ú]/g) || []).length / text.length;
  if (capsRatio > 0.35) { reasons.push('Excesso de MAIÚSCULAS (' + (capsRatio * 100).toFixed(0) + '%)'); score += 40; }

  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 2) { reasons.push(`Excesso de exclamações (${exclamations}x)`); score += exclamations * 15; }

  const absolutePatterns = [
    /(?:nunca|sempre|todo|todos|ninguém|jamais).*(?:deve|precisa|tem)/gi,
    /(?:com certeza|absolutamente|definitivamente).*(?:verdade|real)/gi
  ];
  absolutePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) { reasons.push(`Afirmação absoluta [${matches.length}x]`); score += matches.length * 20; }
  });

  return { isAbsurd: score >= 25, isCritical: score >= 50, reasons, score };
}

// ==========================================
// SIMILARIDADE SEMÂNTICA
// ==========================================

function calculateSemanticSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  const normalize = (text) => text.toLowerCase().replace(/[^\wáéíóúâêôãõç\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const words1 = normalize(text1);
  const words2 = normalize(text2);
  if (words1.length === 0 || words2.length === 0) return 0;
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  let commonWords = 0;
  set1.forEach(word => { if (set2.has(word)) commonWords++; });
  return (commonWords / (set1.size + set2.size - commonWords)) * 100;
}

// ==========================================
// ANÁLISE CONTEXTUAL DE FONTES
// ==========================================

function analyzeSourcesContextualRelevance(originalText, sources) {
  if (!sources || sources.length === 0) return { avgSimilarity: 0, relevantSources: 0, contextMatch: 'NONE', tier1Count: 0 };

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
    const similarity = calculateSemanticSimilarity(originalText, source.title + ' ' + (source.description || ''));
    source.semanticSimilarity = similarity;
    if (similarity >= 40) relevantCount++;
    if (tier1Sources.some(t => source.domain.includes(t))) { source.isTier1 = true; tier1Count++; }
    totalSimilarity += similarity;
  });

  const avgSimilarity = totalSimilarity / sources.length;
  let contextMatch;
  if (avgSimilarity >= 60) contextMatch = 'HIGH';
  else if (avgSimilarity >= 40) contextMatch = 'MEDIUM';
  else if (avgSimilarity >= 25) contextMatch = 'LOW';
  else contextMatch = 'NONE';

  return { avgSimilarity, relevantSources: relevantCount, contextMatch, tier1Count };
}

// ==========================================
// SISTEMA DE CLASSIFICAÇÃO RIGOROSO
// ==========================================

function determineAdvancedLevel(newsText, sources, contextAnalysis) {
  const absurdityCheck = detectAbsurdity(newsText);
  const sensationalismCheck = detectSensationalism(newsText);

  if (absurdityCheck.isCritical || absurdityCheck.score >= 50) {
    return { level: 'BAIXA', reason: 'Conteúdo extremamente suspeito detectado', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch, confidence: 95 };
  }
  if ((absurdityCheck.score >= 30 && sensationalismCheck.score >= 40) || (absurdityCheck.score >= 25 && sensationalismCheck.score >= 50)) {
    return { level: 'BAIXA', reason: 'Múltiplos padrões de desinformação', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch, confidence: 90 };
  }
  if (sensationalismCheck.score >= 50 && contextAnalysis.tier1Count === 0) {
    return { level: 'BAIXA', reason: 'Sensacionalismo extremo sem fontes confiáveis', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch, confidence: 85 };
  }
  if (absurdityCheck.score >= 30 && contextAnalysis.relevantSources < 2) {
    return { level: 'BAIXA', reason: 'Conteúdo suspeito sem confirmação suficiente', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch, confidence: 80 };
  }
  if (sources.length === 0 && sensationalismCheck.score >= 30) {
    return { level: 'BAIXA', reason: 'Notícia sem fontes e com linguagem sensacionalista', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch, confidence: 75 };
  }

  let baseLevel;
  let confidence = 60;

  if (contextAnalysis.tier1Count >= 3 && contextAnalysis.contextMatch === 'HIGH' && absurdityCheck.score < 15 && sensationalismCheck.score < 20) {
    baseLevel = 'ALTA'; confidence = 92;
  } else if (sources.length >= 6 && contextAnalysis.contextMatch === 'HIGH' && contextAnalysis.relevantSources >= 5 && contextAnalysis.tier1Count >= 2) {
    baseLevel = 'ALTA'; confidence = 88;
  } else if (sources.length >= 4 && contextAnalysis.relevantSources >= 3 && absurdityCheck.score < 25) {
    baseLevel = 'MEDIA'; confidence = 75;
  } else if (sources.length >= 2 && contextAnalysis.relevantSources >= 1 && absurdityCheck.score < 30) {
    baseLevel = 'MEDIA'; confidence = 65;
  } else if (sources.length >= 1) {
    baseLevel = 'NEUTRA'; confidence = 50;
  } else {
    baseLevel = 'NEUTRA'; confidence = 45;
  }

  if (sensationalismCheck.score >= 30) {
    confidence -= 25;
    if (baseLevel === 'ALTA') baseLevel = 'MEDIA';
    else if (baseLevel === 'MEDIA') baseLevel = 'NEUTRA';
    else if (baseLevel === 'NEUTRA') baseLevel = 'BAIXA';
  }
  if (absurdityCheck.score >= 20) {
    confidence -= 20;
    if (baseLevel === 'ALTA') baseLevel = 'MEDIA';
    else if (baseLevel === 'MEDIA') baseLevel = 'NEUTRA';
  }
  if (contextAnalysis.tier1Count === 0 && sources.length > 0) {
    confidence -= 10;
    if (baseLevel === 'ALTA') baseLevel = 'MEDIA';
  }
  if (contextAnalysis.tier1Count >= 3) confidence += 10;

  return { level: baseLevel, reason: 'Análise contextual rigorosa completa', absurdityScore: absurdityCheck.score, sensationalismScore: sensationalismCheck.score, contextMatch: contextAnalysis.contextMatch, confidence: Math.max(45, Math.min(95, confidence)) };
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
  if (sensationalismCheck.score > 0) pontos_atencao.push(`⚠️ Sensacionalismo detectado (${sensationalismCheck.score} pts): ${sensationalismCheck.triggers.join(', ')}`);
  if (absurdityCheck.score > 0) pontos_atencao.push(`🚨 Sinais de desinformação (${absurdityCheck.score} pts): ${absurdityCheck.reasons.join(', ')}`);
  pontos_atencao.push(`Confiança da análise: ${classification.confidence}%`);

  let explicacao, recomendacao;
  if (classification.level === 'ALTA') {
    explicacao = `✅ ${sources.length} fontes confiáveis encontradas com alta relevância contextual (${contextAnalysis.avgSimilarity.toFixed(0)}%). ${contextAnalysis.tier1Count > 0 ? `Inclui ${contextAnalysis.tier1Count} veículo(s) de referência.` : ''} Notícia amplamente coberta e verificável.`;
    recomendacao = '✅ Notícia verificada por múltiplas fontes. Pode compartilhar com segurança, mas sempre cite a fonte original.';
  } else if (classification.level === 'MEDIA') {
    explicacao = `⚠️ ${sources.length} fonte(s) encontrada(s) com relevância moderada. ${sensationalismCheck.score > 0 ? 'Linguagem sensacionalista detectada. ' : ''}${contextAnalysis.contextMatch === 'LOW' ? 'Fontes não confirmam totalmente o conteúdo.' : ''}`;
    recomendacao = '⚠️ Verifique as fontes listadas abaixo antes de compartilhar. Busque confirmação em veículos de referência (G1, Folha, BBC, Estadão).';
  } else if (classification.level === 'BAIXA') {
    explicacao = `🚨 Múltiplos sinais de alerta detectados. ${absurdityCheck.reasons.length > 0 ? 'Padrões de desinformação identificados: ' + absurdityCheck.reasons.join(', ') + '. ' : ''}Alto risco de fake news.`;
    recomendacao = '🚨 NÃO COMPARTILHE. Notícia apresenta características típicas de desinformação. Verifique em fact-checkers (Aos Fatos, Lupa, Comprova).';
  } else {
    explicacao = `ℹ️ Nenhuma fonte ampla encontrada. ${sensationalismCheck.score > 0 ? 'Linguagem sensacionalista detectada. ' : ''}Pode ser notícia muito recente, local ou sem cobertura jornalística.`;
    recomendacao = '🔍 Busque confirmar em fontes oficiais e veículos de referência antes de acreditar ou compartilhar.';
  }

  try {
    const groqAnalysis = await analyzeWithGroq(newsText, sources, classification);
    return {
      nivel: classification.level,
      explicacao: groqAnalysis.explicacao || explicacao,
      pontos_atencao,
      recomendacao: groqAnalysis.recomendacao || recomendacao,
      sensacionalismo: sensationalismCheck.score > 0 ? sensationalismCheck : null,
      absurdo: absurdityCheck.score > 0 ? absurdityCheck : null,
      contextMatch: contextAnalysis.contextMatch,
      confidence: classification.confidence,
      tier1Count: contextAnalysis.tier1Count
    };
  } catch (error) {
    console.warn('⚠️ Groq indisponível, usando análise local:', error.message);
    return {
      nivel: classification.level, explicacao, pontos_atencao, recomendacao,
      sensacionalismo: sensationalismCheck.score > 0 ? sensationalismCheck : null,
      absurdo: absurdityCheck.score > 0 ? absurdityCheck : null,
      contextMatch: contextAnalysis.contextMatch, confidence: classification.confidence, tier1Count: contextAnalysis.tier1Count
    };
  }
}

// ==========================================
// ANÁLISE VIA BACKEND (Groq)
// ==========================================

async function analyzeWithGroq(newsText, sources, classification) {
  const sourcesSummary = sources.length > 0
    ? `Fontes: ${sources.slice(0, 3).map(s => s.source).join(', ')}`
    : 'Sem fontes encontradas';

  const response = await fetch(FN.analyze, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newsText, sourcesSummary, classification })
  });

  if (response.status === 429) {
    const err = await response.json();
    throw new Error(err.error || 'Limite de análises atingido.');
  }
  if (!response.ok) throw new Error('Backend de análise indisponível');

  const analysis = await response.json();
  analysis.nivel = classification.level;
  return analysis;
}

// ==========================================
// EXTRAÇÃO DE KEYWORDS (local)
// ==========================================

function extractKeywords(text) {
  if (!text) return '';
  const properNouns = text.match(/\b[A-ZÀÁÂÃ][a-zàáâãäåèéêë]+(?:\s+[A-ZÀÁÂÃ][a-zàáâãäåèéêë]+)*/g);
  if (properNouns && properNouns.length > 0) return properNouns.slice(0, 3).join(' ');
  const stopWords = ['o', 'a', 'de', 'da', 'do', 'em', 'para', 'com', 'por', 'que', 'os', 'as', 'um', 'uma'];
  const words = text.toLowerCase().replace(/[^\wáéíóúâêôãõç\s]/g, ' ').split(/\s+/).filter(w => w.length > 4 && !stopWords.includes(w));
  return words.sort((a, b) => b.length - a.length).slice(0, 4).join(' ');
}

function calculateRelevance(query, title, desc = '') {
  if (!query || !title) return 0;
  const q = query.toLowerCase(), t = title.toLowerCase(), d = desc.toLowerCase();
  const queryWords = q.split(/\s+/).filter(w => w.length > 3);
  let matches = 0;
  queryWords.forEach(word => { if (t.includes(word)) matches += 2; else if (d.includes(word)) matches += 1; });
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
    if (relevance >= 20) { article.relevance = relevance; seen.add(normalized); filtered.push(article); }
  });
  return filtered.sort((a, b) => b.relevance - a.relevance);
}

function getLogoUrl(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch { return null; }
}

// ==========================================
// BUSCA DE FONTES VIA BACKEND
// ==========================================

async function searchAllAPIs(keywords, originalQuery) {
  const cacheKey = keywords.toLowerCase();
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) return cached.results;

  const response = await fetch(`${FN.search}?keywords=${encodeURIComponent(keywords)}`);

  if (response.status === 429) {
    const err = await response.json();
    throw new Error(err.error || 'Limite de buscas atingido.');
  }
  if (!response.ok) throw new Error('Backend de busca indisponível');

  const data = await response.json();
  const withLogos = (data.results || []).map(a => ({ ...a, logoUrl: getLogoUrl(a.url) }));
  const uniqueResults = removeDuplicates(withLogos, originalQuery);

  searchCache.set(cacheKey, { results: uniqueResults, timestamp: Date.now() });
  return uniqueResults;
}

function updateVerificationStatus(message) {
  if (verificationBox && verificationBox.querySelector('.verification-loading')) {
    const el = verificationBox.querySelector('.verification-loading span:first-child');
    if (el) el.textContent = message;
  }
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
        <strong style="color: ${color.bg}; font-size: 1.3rem; text-transform: uppercase;">${escapeHtml(analysis.nivel)} Confiabilidade</strong>
      </div>
    </div>`;

  if (analysis.sensacionalismo && analysis.sensacionalismo.score >= 20) {
    html += `
      <div style="padding: 1.25rem; background: #7c2d12; border: 2px solid #f97316; border-radius: 12px; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: start; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">🚨</span>
          <div>
            <strong style="color: #fdba74; font-size: 1.05rem;">Linguagem Sensacionalista Detectada</strong><br><br>
            <span style="color: #fed7aa; line-height: 1.6; font-size: 0.95rem;">
              Clickbait (${analysis.sensacionalismo.score} pts): ${escapeHtml(analysis.sensacionalismo.triggers.join(', '))}
            </span>
          </div>
        </div>
      </div>`;
  }

  if (analysis.absurdo && analysis.absurdo.score >= 25) {
    html += `
      <div style="padding: 1.25rem; background: #7f1d1d; border: 2px solid #ef4444; border-radius: 12px; margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: start; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">⛔</span>
          <div>
            <strong style="color: #fca5a5; font-size: 1.05rem;">Padrões de Desinformação</strong><br><br>
            <span style="color: #fecaca; line-height: 1.6; font-size: 0.95rem;">
              Detectado (${analysis.absurdo.score} pts): ${escapeHtml(analysis.absurdo.reasons.join(', '))}
            </span>
          </div>
        </div>
      </div>`;
  }

  html += `
    <div style="margin-bottom: 1.5rem;">
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span style="font-size: 1.5rem;">🤖</span>
        <strong style="color: #e5e5e5; font-size: 1.05rem;">Análise Inteligente</strong>
      </div>
      <p style="margin: 0; padding: 1rem; background: #1a1a1a; border-radius: 8px; line-height: 1.7; color: #e5e5e5;">
        ${escapeHtml(analysis.explicacao)}
      </p>
    </div>`;

  if (analysis.pontos_atencao && analysis.pontos_atencao.length > 0) {
    html += `
      <div style="margin-bottom: 1.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
          <span style="font-size: 1.5rem;">🔍</span>
          <strong style="color: #e5e5e5; font-size: 1.05rem;">Detalhes da Análise</strong>
        </div>
        <ul style="margin: 0; padding: 1rem 1rem 1rem 2.5rem; background: #1a1a1a; border-radius: 8px; line-height: 1.7; color: #e5e5e5;">
          ${analysis.pontos_atencao.map(p => `<li style="margin-bottom: 0.5rem;">${escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>`;
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
        </div>
      </div>
    </div>`;

  html += `
    <div>
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
        <span style="font-size: 1.5rem;">💡</span>
        <strong style="color: #e5e5e5; font-size: 1.05rem;">Recomendação</strong>
      </div>
      <p style="margin: 0; padding: 1rem; background: #422006; border-left: 4px solid #facc15; border-radius: 8px; line-height: 1.7; color: #fef08a; font-weight: 500;">
        ${escapeHtml(analysis.recomendacao)}
      </p>
    </div>`;

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
      </div>`;
  }

  feedbackTextEl.innerHTML = html;
}

// ==========================================
// RENDERIZAÇÃO DE FONTES (conteúdo externo → sempre escapado)
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
        <p style="margin: 0.5rem 0 0 0; color: #cbd5e1; font-size: 0.9rem;">
          ${sources.length} fonte${sources.length > 1 ? 's' : ''} encontrada${sources.length > 1 ? 's' : ''}
        </p>
      </div>
    </div>`;
  sourcesGrid.appendChild(title);

  sources.forEach(source => {
    const card = document.createElement('a');
    // href só aceita http(s) — evita javascript: vindo de fontes externas
    card.href = /^https?:\/\//i.test(source.url || '') ? source.url : '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.className = 'source-card';

    const publishDate = source.publishedAt
      ? new Date(source.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

    const safeSourceName = escapeHtml(source.source || '');
    const logoHTML = source.logoUrl
      ? `<img src="${escapeHtml(source.logoUrl)}" alt="${safeSourceName}" class="source-logo-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="source-logo-fallback" style="display: none;">${safeSourceName.charAt(0).toUpperCase()}</div>`
      : `<div class="source-logo-fallback">${safeSourceName.charAt(0).toUpperCase()}</div>`;

    const safeDescription = source.description ? escapeHtml(source.description.substring(0, 150)) + (source.description.length > 150 ? '...' : '') : '';

    card.innerHTML = `
      <div class="source-logo-container">${logoHTML}</div>
      <div class="source-content">
        <h3 class="source-article-title">${escapeHtml(source.title)}</h3>
        <div class="source-meta">
          <span class="source-publisher"><i class="ph ph-newspaper"></i> ${safeSourceName}</span>
          ${publishDate ? `<span class="source-date"><i class="ph ph-calendar-blank"></i> ${escapeHtml(publishDate)}</span>` : ''}
        </div>
        ${safeDescription ? `<p class="source-description">${safeDescription}</p>` : ''}
        <div class="source-cta"><span>Ler notícia completa</span><i class="ph ph-arrow-right"></i></div>
      </div>`;

    sourcesGrid.appendChild(card);
  });
}

// ==========================================
// GRÁFICO DE CONFIABILIDADE
// ==========================================

let trustChartInstance = null;

function renderTrustChart(level, confidence = 70) {
  const oldChart = document.getElementById('trustChartContainer');
  if (oldChart) oldChart.remove();
  if (trustChartInstance) { trustChartInstance.destroy(); trustChartInstance = null; }

  const chartContainer = document.createElement('div');
  chartContainer.id = 'trustChartContainer';
  chartContainer.className = 'trust-chart-container';
  chartContainer.innerHTML = `
    <h3 class="chart-title">📊 Análise Visual da Confiabilidade</h3>
    <div class="chart-canvas-wrapper"><canvas id="trustChart"></canvas></div>`;

  const feedbackBox = document.querySelector('.feedback-box');
  feedbackBox.parentNode.insertBefore(chartContainer, feedbackBox.nextSibling);

  let chartData = { alta: 0, media: 0, neutra: 0, baixa: 0 };
  switch (level) {
    case 'ALTA':
      chartData.alta = confidence;
      chartData.media = Math.round((100 - confidence) * 0.6);
      chartData.neutra = Math.round((100 - confidence) * 0.3);
      chartData.baixa = 100 - chartData.alta - chartData.media - chartData.neutra;
      break;
    case 'MEDIA':
      chartData.media = confidence;
      chartData.alta = Math.round((100 - confidence) * 0.4);
      chartData.neutra = Math.round((100 - confidence) * 0.35);
      chartData.baixa = 100 - chartData.alta - chartData.media - chartData.neutra;
      break;
    case 'NEUTRA':
      chartData.neutra = confidence;
      chartData.media = Math.round((100 - confidence) * 0.45);
      chartData.alta = Math.round((100 - confidence) * 0.3);
      chartData.baixa = 100 - chartData.alta - chartData.media - chartData.neutra;
      break;
    case 'BAIXA':
      chartData.baixa = confidence;
      chartData.neutra = Math.round((100 - confidence) * 0.4);
      chartData.media = Math.round((100 - confidence) * 0.35);
      chartData.alta = 100 - chartData.baixa - chartData.media - chartData.neutra;
      break;
  }

  const ctx = document.getElementById('trustChart').getContext('2d');
  trustChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Alta', 'Média', 'Neutra', 'Baixa'],
      datasets: [{
        data: [chartData.alta, chartData.media, chartData.neutra, chartData.baixa],
        backgroundColor: ['#00b894', '#fdcb6e', '#6c5ce7', '#d63031'],
        borderColor: '#1e1e2e', borderWidth: 3, hoverOffset: 15
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#c3d1f7', font: { size: 14, weight: '600' }, padding: 20, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: {
          backgroundColor: 'rgba(30, 30, 46, 0.95)', titleColor: '#c3d1f7', bodyColor: '#c3d1f7',
          borderColor: '#3b82f6', borderWidth: 2, padding: 12, displayColors: true,
          callbacks: { label: (ctx) => ctx.label + ': ' + ctx.parsed + '%' }
        }
      },
      animation: { animateRotate: true, animateScale: true, duration: 1500, easing: 'easeOutQuart' }
    }
  });
}

// ==========================================
// DICAS EDUCATIVAS
// ==========================================

const confiaTips = {
  ALTA: ["✅ Notícia verificada! Mesmo assim, sempre cite a fonte ao compartilhar.", "💡 Fontes confiáveis confirmam, mas sempre verifique a data da publicação.", "📚 Boa prática: Leia a notícia completa antes de compartilhar apenas o título."],
  MEDIA: ["⚠️ Verifique em múltiplas fontes antes de considerar como verdade absoluta.", "🔍 Busque confirmação em veículos tradicionais como G1, Folha, BBC ou Estadão.", "💡 Desconfie se apenas um veículo divulgou. Aguarde mais confirmações."],
  NEUTRA: ["🔍 Sem confirmação ampla. Pode ser notícia local, recente ou sem cobertura.", "⏰ Notícias muito recentes podem ainda não ter sido verificadas amplamente.", "📍 Notícias locais muitas vezes não aparecem em APIs nacionais."],
  BAIXA: ["🚨 NÃO COMPARTILHE. Verifique em fact-checkers como Aos Fatos, Lupa ou Comprova.", "❌ Desconfie de linguagem emocional excessiva, urgência artificial e promessas irreais.", "📚 Evite cair em clickbait. Leia a notícia completa e verifique a fonte."]
};

function showConfiaTip(level) {
  if (!confiaTip || !tipText) return;
  const tips = confiaTips[level] || confiaTips['NEUTRA'];
  tipText.textContent = tips[Math.floor(Math.random() * tips.length)];
  confiaTip.style.display = 'block';
}

// ==========================================
// HANDLE SEARCH
// ==========================================

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) { alert('❌ Digite uma notícia para verificar.'); return; }

  const cleanQuery = sanitizeInput(query);
  const validation = validateInput(cleanQuery);
  if (!validation.valid) { alert(validation.errors.join('\n')); return; }

  const old = document.getElementById('extractedTextBox');
  if (old) old.remove();
  const oldChart = document.getElementById('trustChartContainer');
  if (oldChart) oldChart.remove();
  if (recentNewsWidget) recentNewsWidget.style.display = 'none';

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
    renderTrustChart(analysis.nivel, analysis.confidence || 70);
    renderSources(sources);
    showConfiaTip(analysis.nivel);

    if (recentNewsWidget && resultsSection) {
      recentNewsWidget.style.display = 'block';
      resultsSection.appendChild(recentNewsWidget);
    }
  } catch (error) {
    console.error('❌ Erro na análise:', error);
    verificationBox.style.display = 'none';
    feedbackText.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
        <strong style="color: #ef4444; font-size: 1.2rem;">Erro ao verificar notícia</strong>
        <p style="color: #9ca3af; margin-top: 1rem;">${escapeHtml(error.message || 'Tente novamente em alguns instantes.')}</p>
      </div>`;
    if (recentNewsWidget) recentNewsWidget.style.display = 'block';
  }
}

if (searchBtn) searchBtn.addEventListener('click', handleSearch);
if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

// ==========================================
// WIDGET DE NOTÍCIAS RECENTES (via backend)
// ==========================================

async function loadRecentNews() {
  if (!recentNewsList) return;
  try {
    const response = await fetch(FN.recentNews);
    if (!response.ok) throw new Error('Erro ao carregar notícias');
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      recentNewsList.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 1rem;">Nenhuma notícia disponível no momento.</div>';
      return;
    }

    recentNewsList.innerHTML = data.results.map(news => `
      <a href="${/^https?:\/\//i.test(news.link) ? news.link : '#'}" target="_blank" rel="noopener noreferrer" class="widget-news-item">
        <div class="widget-news-title">${escapeHtml(news.title)}</div>
        <div class="widget-news-source">${escapeHtml(news.source)}</div>
      </a>`).join('');
  } catch (error) {
    console.error('❌ Erro ao carregar notícias recentes:', error);
    recentNewsList.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 1rem;">⚠️ Erro ao carregar notícias</div>';
  }
}
loadRecentNews();

// Status de API não faz mais sentido no cliente (chaves vivem no backend) — oculto.
if (apiStatus) apiStatus.style.display = 'none';

// ==========================================
// LIMPEZA DE CACHE AUTOMÁTICA
// ==========================================

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) searchCache.delete(key);
  }
}, CACHE_DURATION);

// ==========================================
// DEBUG
// ==========================================

window.ConfIADebug = {
  getStats: () => analytics.getStats(),
  getHistory: () => getHistory(),
  clearCache: () => searchCache.clear(),
  clearHistory: () => clearHistory(),
  version: '10.0 BACKEND-FIRST'
};

console.log('✅ Sistema pronto. Chaves de API vivem só no backend (Netlify Functions).');
