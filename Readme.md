# 🧠 ConfIA — Detector Inteligente de Fake News

<img src="./public/screenshots/logo-screenshots.png" width="300" align="left" />  

O **ConfIA** (de "confiança" e "IA") é um detector inteligente de **fake news** que analisa manchetes e notícias em tempo real, usando **IA Gemini** e **APIs de notícias** confiáveis.  
Ele verifica se a notícia é verdadeira, duvidosa ou sensacionalista — explicando o motivo e mostrando as fontes analisadas.

> ⚡ Projeto desenvolvido para a **Maratona Tech 2025**, unindo tecnologia, ética digital e pensamento computacional.

---

## 🚀 Funcionalidades Principais

✅ Verifica manchetes em **texto ou imagem (OCR)**  
✅ Analisa o contexto com a **IA Gemini**  
✅ Consulta notícias reais em **NewsAPI, GNews e Google RSS**  
✅ Classifica em **Alta, Média, Neutra ou Baixa Confiabilidade**  
✅ Detecta **linguagem sensacionalista e clickbait**  
✅ Mostra **fontes reais** com logos, links e datas  
✅ Interface moderna inspirada no estilo do **ChatGPT**  
✅ Sistema híbrido: roda **localmente** ou **via Netlify Functions**  
✅ Cache inteligente e logs explicativos no console  

---

## 💡 Como Funciona

1. O usuário insere uma **manchete ou imagem**.  
2. O sistema extrai o texto (caso seja imagem).  
3. O texto é enviado para análise via **APIs de notícias**.  
4. A **IA Gemini** interpreta contexto, linguagem e coerência.  
5. O ConfIA mostra o **nível de confiabilidade** com explicações.  

> ⚠️ O ConfIA verifica apenas notícias amplamente divulgadas em portais nacionais e internacionais.  
> Notícias locais ou muito recentes podem não ter cobertura ainda.

---

## 🧩 Pilares do Pensamento Computacional Aplicados

| Pilar | Aplicação no ConfIA |
|-------|----------------------|
| **Decomposição** | Separação das etapas de análise: OCR, APIs, IA e exibição dos resultados. |
| **Reconhecimento de Padrões** | Identificação de linguagem sensacionalista e padrões de fake news. |
| **Abstração** | Foco apenas nas informações essenciais (texto da notícia e fontes relevantes). |
| **Algoritmo** | Sequência de passos automatizados desde o input até o resultado final. |

---

## 🔄 Fluxograma do Sistema

O diagrama abaixo representa o fluxo lógico do **ConfIA**, desde a entrada do usuário até a resposta final:

<p align="center">
  <img src="./public/screenshots/Fluxograma-ConfIA.png" width="800" alt="Fluxograma ConfIA" />
</p>

### 📘 Descrição do Fluxo:

1. **Início →** O usuário entra no site.  
2. **Entrada →** Digita uma manchete ou envia uma imagem.  
3. **OCR (se imagem) →** Extrai o texto e envia para o sistema.  
4. **Análise →** Gemini organiza e interpreta o conteúdo.  
5. **Busca →** APIs (NewsAPI, GNews, Google RSS) pesquisam fontes.  
6. **Classificação →** IA define o nível de confiabilidade (ALTA, MÉDIA, NEUTRA, BAIXA).  
7. **Feedback →** Exibe resultado com explicação e fontes verificadas.  
8. **Fim.**

---

## 🧰 Tecnologias Utilizadas

| Categoria | Ferramenta |
|------------|-------------|
| Frontend | HTML, CSS, JavaScript Puro |
| IA | Gemini (Google AI) |
| APIs de Notícias | NewsAPI, GNews, Google News RSS |
| OCR | OCR.Space |
| Hospedagem | Netlify |
| Controle de Versão | Git + GitHub |

---

## 📸 Interface

<p align="center">
  <img src="./public/screenshots/interface-desktop.png" width="800" alt="Interface ConfIA" />
  <img src="./public/screenshots/interface-celular.png" width="300" alt="Interface ConfIA" />

</p>




---

# Link 
<a href="https://conf-ia.netlify.app/" target="_blank">ConfIA</a>
