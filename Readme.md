# 🧠 ConfIA — Sistema de Verificação de Fake News com IA

<div align="center">
  <img src="./public/screenshots/logo-screenshots.png" width="300" />
  
  [![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://conf-ia.netlify.app/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
</div>

> Sistema inteligente de verificação de notícias que utiliza **IA Gemini 2.0 Flash**, **APIs de notícias confiáveis** e **técnicas avançadas de detecção de desinformação** para classificar manchetes em tempo real.

Desenvolvido para a **Maratona Tech 2025**, o ConfIA combina tecnologia, ética digital e pensamento computacional para combater a desinformação.

---
## 🏅 Reconhecimentos

<<<<<<< HEAD
Este projeto foi desenvolvido durante a **Maratona Tech 2025** e recebeu os seguintes reconhecimentos:

- 🥈 **Medalha de Prata**:  [Certificado de Medalha de Prata](./public/screenshots/certificado%20de%20prata.png)

- 📜 **Menção Honrosa**: [Certificado de Menção Honrosa](./public/screenshots/certificado%20de%20menção%20honrosa%20HERNANDES%20SALES%20NEVES.png)

Os certificados estão disponíveis para consulta e comprovam a avaliação externa do projeto durante a competição.

=======
>>>>>>> 6541868 (Update Readme.md)
## ⚡ Funcionalidades

### 🔍 Verificação Inteligente
- Análise de manchetes em **texto ou imagem (OCR)**
- Verificação com **IA Gemini 2.0 Flash**
- Consulta em **NewsData.io** e outras APIs
- Classificação em 4 níveis: Alta, Média, Neutra ou Baixa confiabilidade
- Sistema de análise em **3 camadas** (Semântica, Comportamental, Lógica)

### 🛡️ Detecção Avançada
- Identificação de **linguagem sensacionalista e clickbait**
- Detecção de **promessas irreais e teorias conspiratórias**
- Análise semântica contextual com similaridade entre fontes
- Sistema de pontuação para absurdos e sensacionalismo

### 📊 Recursos Educativos
- **Dicas educativas** contextualizadas por nível de confiabilidade
- **Histórico** das últimas 10 verificações
- **Dashboard de estatísticas** com gráficos visuais
- **Modais informativos** (Como funciona, Sobre, Histórico)

### 🎨 Interface Moderna
- Design inspirado em **ChatGPT e Claude**
- **Modo escuro** com gradientes modernos
- **Responsivo** para desktop e mobile
- Animações suaves e feedback visual

---

## 💡 Como Funciona

### Fluxo de Análise (3 Camadas)

**1. Entrada e Processamento**
- Texto (máx 500 caracteres) ou imagem (JPG/PNG, máx 10MB)
- OCR para extração de texto de imagens
- Validação e sanitização

**2. Busca de Fontes**
- Extração de keywords relevantes
- Busca em NewsData.io e Currents API
- Cache inteligente de 5 minutos

**3. Análise Multicamada**

🔍 **Camada Semântica**
- Cálculo de similaridade contextual (0-100%)
- Identificação de fontes tier-1 (G1, Folha, BBC, etc.)

🚨 **Camada Comportamental**
- Detecção de sensacionalismo (0-100 pts)
- Identificação de clickbait e urgência artificial

⚠️ **Camada Lógica**
- Detecção de absurdos (0-100 pts)
- Identificação de promessas irreais
- Teorias conspiratórias conhecidas

**4. Análise com IA e Classificação**
- Interpretação contextual com Gemini
- Sistema de pontuação rigoroso
- Feedback visual com explicação detalhada

<div align="center">
  <img src="./public/screenshots/Fluxograma-ConfIA.png" width="700" alt="Fluxograma" />
</div>

---

## 🎯 Sistema de Classificação

### 🟢 ALTA Confiabilidade (88-92%)
- 3+ fontes tier-1
- Similaridade contextual > 60%
- Score de absurdidade < 15 pts
- Score de sensacionalismo < 20 pts

### 🟡 MÉDIA Confiabilidade (65-75%)
- 2+ fontes com relevância moderada
- Sensacionalismo leve ou moderado
- Score de absurdidade < 25 pts

### 🔵 NEUTRA Confiabilidade (45-50%)
- Poucas ou nenhuma fonte encontrada
- Sem sinais críticos de alerta
- Pode ser notícia local ou muito recente

### 🔴 BAIXA Confiabilidade
- Score de absurdidade ≥ 50 pts OU
- Absurdidade ≥ 30 pts + sensacionalismo ≥ 40 pts OU
- Sensacionalismo ≥ 50 pts sem fontes tier-1 OU
- Múltiplos padrões de desinformação

---

## 🧩 Pensamento Computacional

| Pilar | Aplicação |
|-------|-----------|
| **Decomposição** | Sistema modular: validação, OCR, keywords, busca, análise, classificação |
| **Reconhecimento de Padrões** | 30+ padrões de sensacionalismo, absurdos e teorias conspiratórias |
| **Abstração** | Métricas essenciais: similaridade, scores, relevância de fontes |
| **Algoritmo** | Sequência automatizada com cache, rate limiting e fallback |

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ |
| **IA** | Google Gemini 2.0 Flash |
| **APIs** | NewsData.io, Currents API, OCR.space |
| **Gráficos** | Chart.js |
| **Hospedagem** | Netlify |

---

## 🚀 Como Usar

### Online
Acesse: **[conf-ia.netlify.app](https://conf-ia.netlify.app/)**

### Localmente
```bash
# Clone o repositório
git clone https://github.com/hernandessn/confia.git

# Entre na pasta
cd confia

# Abra o index.html no navegador
# Ou use um servidor local
python -m http.server 8000
```

---

## 🔒 Segurança e Privacidade

✅ Sanitização de entrada — remove scripts maliciosos  
✅ Validação rigorosa — previne injeção de código  
✅ Rate limiting — previne abuso  
✅ Sem rastreamento — não coletamos dados pessoais  
✅ Dados locais — histórico salvo apenas no navegador  
✅ Open source — código auditável  

---

## 📊 Limitações

### APIs (Planos Gratuitos)
- **NewsData.io**: 200 req/dia
- **Currents API**: 600 req/dia
- **Gemini 2.0**: ~1500 req/dia
- **OCR.space**: 25.000 req/mês

### Otimizações
✅ Cache de 5 minutos  
✅ Busca paralela  
✅ Timeout de 8 segundos com fallback  
✅ Rate limiting (8 buscas/min, 3 OCR/min)  
✅ Compressão automática de imagens  

---

## 💬 FAQ

**O ConfIA é 100% preciso?**  
Não. É uma ferramenta educativa. Para informações críticas, sempre verifique em fact-checkers profissionais.

**Por que minha notícia apareceu como "Neutra"?**  
Notícias muito recentes, locais ou regionais podem não ter cobertura ampla.

**Como o ConfIA protege minha privacidade?**  
Todos os dados ficam apenas no seu navegador. Não coletamos informações.

**Posso usar comercialmente?**  
Sim! Licença MIT. Use, modifique e distribua livremente.

---

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📞 Contato

- 📧 **Email**: hernandesneves07@gmail.com
- 💼 **LinkedIn**: [linkedin.com/in/hernandes-sales](https://linkedin.com/in/hernandes-sales)
- 🐙 **GitHub**: [@hernandessn](https://github.com/hernandessn)

