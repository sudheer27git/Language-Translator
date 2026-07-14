const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'bn', name: 'Bengali' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
];

const fromLang = document.getElementById('fromLang');
const toLang = document.getElementById('toLang');
const swapBtn = document.getElementById('swapBtn');
const sourceText = document.getElementById('sourceText');
const targetText = document.getElementById('targetText');
const charCount = document.getElementById('charCount');
const statusEl = document.getElementById('status');
const speakSourceBtn = document.getElementById('speakSource');
const speakTargetBtn = document.getElementById('speakTarget');
const copyBtn = document.getElementById('copyBtn');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

const HISTORY_KEY = 'lingua_history';
let lastTranslation = '';
let debounceTimer = null;
let requestToken = 0;

function populateSelects() {
  const optionsHtml = LANGUAGES.map(l => `<option value="${l.code}">${l.name}</option>`).join('');
  fromLang.innerHTML = optionsHtml;
  toLang.innerHTML = optionsHtml;
  fromLang.value = 'en';
  toLang.value = 'es';
}

function langName(code) {
  const l = LANGUAGES.find(l => l.code === code);
  return l ? l.name : code;
}

function setStatus(text) {
  statusEl.textContent = text;
  if (text) setTimeout(() => { if (statusEl.textContent === text) statusEl.textContent = ''; }, 2000);
}

function showPlaceholder() {
  targetText.textContent = 'Translation will appear here';
  targetText.classList.add('placeholder');
  targetText.classList.remove('loading');
}

async function translate() {
  const text = sourceText.value.trim();
  charCount.textContent = sourceText.value.length;

  if (!text) {
    showPlaceholder();
    lastTranslation = '';
    return;
  }

  const from = fromLang.value;
  const to = toLang.value;
  const myToken = ++requestToken;

  targetText.classList.remove('placeholder');
  targetText.classList.add('loading');
  targetText.textContent = 'Translating…';

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    const res = await fetch(url);
    const data = await res.json();

    if (myToken !== requestToken) return; // a newer request superseded this one

    const translated = data?.responseData?.translatedText;
    if (!translated) throw new Error('empty response');

    targetText.classList.remove('loading', 'placeholder');
    targetText.textContent = translated;
    lastTranslation = translated;

    saveToHistory({ from, to, source: text, target: translated });
  } catch (err) {
    if (myToken !== requestToken) return;
    targetText.classList.remove('loading', 'placeholder');
    targetText.textContent = 'Could not reach the translation service. Check your connection and try again.';
    lastTranslation = '';
  }
}

function scheduleTranslate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(translate, 500);
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToHistory(entry) {
  let hist = loadHistory();
  hist = hist.filter(h => !(h.source === entry.source && h.from === entry.from && h.to === entry.to));
  hist.unshift({ ...entry, ts: Date.now() });
  hist = hist.slice(0, 8);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  renderHistory();
}

function renderHistory() {
  const hist = loadHistory();
  if (!hist.length) {
    historyList.innerHTML = '<li class="history-empty">Your translations will show up here.</li>';
    return;
  }
  historyList.innerHTML = hist.map((h, i) => `
    <li class="history-item" data-index="${i}">
      <div class="h-langs">${langName(h.from)} → ${langName(h.to)}</div>
      <div class="h-source">${h.source}</div>
      <div class="h-target">${h.target}</div>
    </li>
  `).join('');

  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const h = hist[Number(item.dataset.index)];
      fromLang.value = h.from;
      toLang.value = h.to;
      sourceText.value = h.source;
      charCount.textContent = h.source.length;
      targetText.classList.remove('placeholder', 'loading');
      targetText.textContent = h.target;
      lastTranslation = h.target;
    });
  });
}

function speak(text, langCode) {
  if (!text || !('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langCode;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

sourceText.addEventListener('input', scheduleTranslate);
fromLang.addEventListener('change', () => { if (sourceText.value.trim()) translate(); });
toLang.addEventListener('change', () => { if (sourceText.value.trim()) translate(); });

swapBtn.addEventListener('click', () => {
  const f = fromLang.value, t = toLang.value;
  fromLang.value = t;
  toLang.value = f;
  if (lastTranslation) {
    sourceText.value = lastTranslation;
    charCount.textContent = lastTranslation.length;
  }
  if (sourceText.value.trim()) translate();
});

speakSourceBtn.addEventListener('click', () => speak(sourceText.value, fromLang.value));
speakTargetBtn.addEventListener('click', () => speak(lastTranslation, toLang.value));

copyBtn.addEventListener('click', async () => {
  if (!lastTranslation) return;
  try {
    await navigator.clipboard.writeText(lastTranslation);
    setStatus('copied');
  } catch {
    setStatus('could not copy');
  }
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

populateSelects();
showPlaceholder();
renderHistory();
