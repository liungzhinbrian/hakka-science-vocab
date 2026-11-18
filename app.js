/* 生活中的科學　客語詞彙篇｜詞彙卡與詞彙總表
   原生 HTML／CSS／JavaScript，不使用框架、外部函式庫或伺服器。
   ─ 修改詞彙：vocab-data.js
   ─ 修改外觀：styles.css 最上方的變數
   ─ 音檔：assets/audio/，清單在 audio-manifest.js
   ─ 語音工具：phonology-tools.js、phonology-rimes-data.js（獨立運作）
   ─ 每次改版請更新 vocab-data.js 的 version，並在 CHANGELOG.md、versions.html 各加一筆。
*/
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const DATA = window.VOCAB_DATA;
  if (!DATA || !Array.isArray(DATA.topics) || !DATA.topics.length) {
    $('main').textContent = '找不到 vocab-data.js，請確認檔案與 index.html 放在同一資料夾。';
    return;
  }

  /* ── 聲調對照（依曾櫳震老師提供版本）。海陸、四縣各自獨立，不做跨腔推算。 ── */
  const TONE_TABLE = {
    hailu: [['陰平', '53', 'ˋ'], ['陽平', '55', ''], ['上聲', '24', 'ˊ'], ['陰去', '11', 'ˇ'], ['陽去', '33', '+'], ['陰入', '5', ''], ['陽入', '2', 'ˋ']],
    sixian: [['陰平', '24', 'ˊ'], ['陽平', '11', 'ˇ'], ['上聲', '31', 'ˋ'], ['去聲', '55', ''], ['陰入', '2', 'ˋ'], ['陽入', '5', '']]
  };
  const TONE_MARKS = {};
  for (const [dialect, rows] of Object.entries(TONE_TABLE)) {
    TONE_MARKS[dialect] = Object.fromEntries(rows.map(([, value, mark]) => [value, mark]));
  }
  const SUPERSCRIPT = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const DIALECTS = { hailu: '海陸腔', sixian: '四縣腔' };

  const TOPICS = DATA.topics;
  // 網址加上 ?topic=主題代號（例如 ?topic=chem）可以直接開啟某個主題。
  const wantedTopic = new URLSearchParams(location.search).get('topic');
  // 「所有詞彙」：把各主題的詞彙接在一起看，不分主題、也不分類。網址用 ?topic=all。
  for (const t of TOPICS) for (const w of t.words) { w._topic = t.id; w._topicLabel = t.label; w._uid = `${t.id}/${w.id}`; }
  const ALL_TOPIC = { id: 'all', label: '所有詞彙', groups: [], words: TOPICS.flatMap(t => t.words) };
  const TOPIC_TABS = [...TOPICS, ALL_TOPIC];
  const state = { topic: TOPIC_TABS.some(t => t.id === wantedTopic) ? wantedTopic : TOPICS[0].id, dialect: 'hailu', toneMode: 'value', view: 'card', group: 'all', idx: 0, shown: false, showAll: false, fontUp: 1 };
  const topic = () => TOPIC_TABS.find(t => t.id === state.topic) || TOPICS[0];

  // 單一檔預覽版會把圖檔內嵌在 window.__ASSET；正式網站直接用路徑。
  const asset = path => (window.__ASSET && window.__ASSET[path]) || path;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* 資料一律存調值；只在顯示時轉成上標數字或調型符號。
     遇到該腔調沒有的調值會原樣保留，方便發現資料錯誤。 */
  function formatPinyin(source, dialect, mode = state.toneMode) {
    const marks = TONE_MARKS[dialect];
    if (!marks) return String(source ?? '');
    return String(source ?? '').replace(/([a-z]+)(53|55|24|11|33|31|5|2)(?=[^a-z0-9]|$)/gi, (raw, syllable, tone) => {
      if (!Object.prototype.hasOwnProperty.call(marks, tone)) return raw.toLowerCase();
      const ending = mode === 'value' ? [...tone].map(d => SUPERSCRIPT[d]).join('') : marks[tone];
      return syllable.toLowerCase() + ending;
    });
  }

  const groupLabel = id => id === 'all' ? '全部' : ((topic().groups || []).find(g => g.id === id)?.label ?? id);
  const wordsIn = id => id === 'all' ? topic().words : topic().words.filter(w => w.group === id);
  const currentWords = () => wordsIn(state.group);
  const entryOf = (word, dialect = state.dialect) => word[dialect] || null;

  /* ── 音檔：只在按下按鈕時播放，換詞不自動播放。 ── */
  const AUDIO = window.VOCAB_AUDIO || null;
  const audioKey = (word, dialect, alt) => {
    const set = AUDIO && AUDIO.topics && AUDIO.topics[word._topic];   // 音檔跟著詞彙原本所屬的主題走
    if (!set) return '';
    const key = String(word.id).padStart(2, '0') + (alt ? '-alt' : '');
    return (set[dialect] || []).includes(key) ? `${set.dir ? set.dir + '/' : ''}${dialect}/${key}` : '';
  };
  const audioUrl = key => (AUDIO.inline && AUDIO.inline[key]) || `${AUDIO.base}/${key}.${AUDIO.ext}`;
  const audioButtons = (word, dialect) => {
    const main = audioKey(word, dialect, false), alt = audioKey(word, dialect, true);
    return (main ? `<button type="button" class="audio-btn" data-audio-key="${esc(main)}" title="播放讀音（P）"><span aria-hidden="true">▶</span> 播放</button>` : '')
      + (alt ? `<button type="button" class="audio-btn" data-audio-key="${esc(alt)}" title="播放又音"><span aria-hidden="true">▶</span> 又音</button>` : '');
  };
  let player = null, playingButton = null;
  function stopAudio() {
    if (player) { player.pause(); player = null; }
    if (playingButton) { playingButton.classList.remove('playing'); playingButton = null; }
  }
  function playAudio(key, button) {
    stopAudio();
    if (!key || !AUDIO) return;
    const audio = new Audio(audioUrl(key));
    player = audio; playingButton = button || null;
    if (button) { button.classList.remove('failed'); button.classList.add('playing'); }
    const finish = failed => {
      if (player !== audio) return;
      if (button) { button.classList.remove('playing'); if (failed) { button.classList.add('failed'); button.title = '音檔無法播放，請確認檔案已上傳'; } }
      player = null; playingButton = null;
    };
    audio.addEventListener('ended', () => finish(false));
    audio.addEventListener('error', () => finish(true));
    audio.play().catch(() => finish(true));
  }

  /* ── 色票：顏色詞在漢字旁顯示圓形色塊，一律顯示（不必揭曉）。只接受 #RGB／#RRGGBB 色號。 ── */
  const swatchColors = word => (word.colors || []).filter(c => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c));
  const swatchHTML = (word, cls) => swatchColors(word).map(c => `<span class="${cls}" style="background:${c}"></span>`).join('');

  /* ── 畫面更新 ── */
  function renderControls() {
    const sync = (attr, value) => document.querySelectorAll(`[data-${attr}]`).forEach(el => {
      const on = el.dataset[attr] === value;
      el.classList.toggle('active', on);
      el.setAttribute('aria-pressed', String(on));
    });
    sync('dialect', state.dialect);
    sync('tone', state.toneMode);
    sync('view', state.view);
    $('fontToggle').textContent = state.fontUp > 1 ? '字級－' : '字級＋';
    const meaningToggle = $('meaningToggle');
    meaningToggle.textContent = state.showAll ? '華語：全部顯示' : '華語：逐詞揭曉';
    meaningToggle.setAttribute('aria-pressed', String(state.showAll));
    meaningToggle.classList.toggle('active', state.showAll);
    $('app').style.setProperty('--fontup', state.fontUp);
    $('topicTabs').innerHTML = TOPIC_TABS.map(t => {
      const on = t.id === state.topic;
      return `<button type="button" data-topic="${esc(t.id)}" class="${on ? 'active' : ''}" aria-pressed="${on}">${esc(t.label)}<small>${t.words.length}</small></button>`;
    }).join('');
    $('siteSub').textContent = state.topic === 'all' ? topic().label : `${topic().label}詞彙`;
    const extras = topic().extras, extraBtn = $('extraBtn');
    if (!extras && state.view === 'extra') state.view = 'card';
    extraBtn.hidden = !extras;
    extraBtn.textContent = extras ? extras.label : '';
    extraBtn.classList.toggle('active', state.view === 'extra');
    extraBtn.setAttribute('aria-pressed', String(state.view === 'extra'));
    const groups = topic().groups || [];
    $('groupTabs').hidden = !groups.length || state.view === 'extra';   // 主題沒有分類、或正在看補充區時，不顯示分類頁籤
    $('groupTabs').innerHTML = [{ id: 'all' }, ...groups].map(g => {
      const on = g.id === state.group;
      return `<button type="button" data-group="${esc(g.id)}" class="${on ? 'active' : ''}" aria-pressed="${on}">${esc(groupLabel(g.id))}<small>${wordsIn(g.id).length}</small></button>`;
    }).join('');
  }

  function renderCard() {
    const words = currentWords();
    const main = document.querySelector('.card-main');
    if (!words.length) { main.classList.add('is-empty'); $('cardProgress').textContent = '這個分類目前沒有詞彙。'; return; }
    main.classList.remove('is-empty');
    state.idx = Math.max(0, Math.min(words.length - 1, state.idx));
    const word = words[state.idx];
    const entry = entryOf(word);
    $('cardProgress').textContent = `${DIALECTS[state.dialect]}・${state.group === 'all' ? topic().label : groupLabel(state.group)}・第${state.idx + 1}／${words.length}詞${state.topic === 'all' ? `（${word._topicLabel}）` : ''}`;
    $('cardPos').textContent = word.pos ? `【${word.pos}】` : '';
    $('cardPos').hidden = !word.pos;
    $('cardHan').textContent = entry ? entry.han : '（此腔調尚未建立資料）';
    const swatch = $('cardSwatch'), colorCount = swatchColors(word).length;
    swatch.innerHTML = swatchHTML(word, 'swatch'); swatch.hidden = !colorCount; swatch.classList.toggle('multi', colorCount > 1);
    $('cardPinyin').textContent = entry ? formatPinyin(entry.pinyin, state.dialect) : '';
    const alt = $('cardAlt');
    alt.hidden = !(entry && entry.alt);
    alt.textContent = entry && entry.alt ? `又音 ${formatPinyin(entry.alt, state.dialect)}` : '';
    // 播放鈕只在換了詞或腔調時重畫，揭曉答案時不打斷正在播放的音檔。
    const audioBox = $('cardAudio'), audioId = `${state.dialect}/${word._uid}`;
    if (audioBox.dataset.for !== audioId) {
      audioBox.dataset.for = audioId;
      audioBox.innerHTML = entry ? audioButtons(word, state.dialect) : '';
      audioBox.hidden = !audioBox.innerHTML;
    }

    // 「華語：全部顯示」開啟時，每張卡片直接顯示釋義與備註，不必逐詞揭曉。
    const shown = state.showAll || state.shown;
    $('cardGuess').hidden = shown;
    $('cardAnswer').hidden = !shown;
    const meaning = $('cardMeaning');
    meaning.textContent = shown ? word.meaning : '';
    meaning.classList.toggle('long', String(word.meaning).length > 8);
    const note = $('cardNote');
    note.hidden = !(shown && word.note);
    note.textContent = shown && word.note ? word.note : '';
    const image = $('cardImage');
    if (shown && word.image && word.image.src) {
      const credit = word.image.credit ? esc(word.image.credit) : '';
      const caption = word.image.url ? `<a href="${esc(word.image.url)}" target="_blank" rel="noopener noreferrer">${credit || '圖片來源'}</a>` : credit;
      image.innerHTML = `<figure><img src="${esc(word.image.src)}" alt="${esc(entry ? entry.han : word.meaning)}"><figcaption>${caption}</figcaption></figure>`;
      image.hidden = false;
    } else { image.hidden = true; image.innerHTML = ''; }
    $('revealBtn').textContent = shown ? '蓋回答案' : '揭曉華語詞義';
    $('revealBtn').hidden = state.showAll;
  }

  function renderList() {
    const table = document.querySelector('.vocab-table');
    table.classList.toggle('no-pos', !topic().words.some(w => w.pos));        // 整個主題都沒標詞性時，隱藏詞性欄
    table.classList.toggle('show-topic', state.topic === 'all');              // 「所有詞彙」才顯示主題欄
    table.classList.toggle('no-audio', !topic().words.some(w => audioKey(w, state.dialect, false)));  // 還沒有音檔時，隱藏讀音欄
    $('listBody').innerHTML = currentWords().map((word, index) => {
      const entry = entryOf(word);
      const pinyin = entry ? esc(formatPinyin(entry.pinyin, state.dialect)) : '';
      const alt = entry && entry.alt ? `<small>又音 ${esc(formatPinyin(entry.alt, state.dialect))}</small>` : '';
      return `<tr><td>${state.topic === 'all' ? index + 1 : esc(word.id)}</td><td class="col-topic">${esc(word._topicLabel)}</td><td class="col-pos">${esc(word.pos || '')}</td>`
        + `<td><button type="button" class="list-word" data-open="${esc(word._uid)}" lang="hak">${esc(entry ? entry.han : '—')}</button><span class="dots" aria-hidden="true">${swatchHTML(word, 'dot')}</span></td>`
        + `<td class="pinyin-cell" lang="hak">${pinyin}${alt}</td><td class="audio-cell col-audio">${entry ? audioButtons(word, state.dialect) : ''}</td><td>${esc(word.meaning)}</td><td>${esc(word.note || '')}</td></tr>`;
    }).join('');
  }

  function render() {
    stopAudio();
    renderControls();
    $('cardView').hidden = state.view !== 'card';
    $('listView').hidden = state.view !== 'list';
    $('extraView').hidden = state.view !== 'extra';
    if (state.view === 'card') renderCard(); else if (state.view === 'list') renderList(); else renderExtra();
  }

  /* ── 補充區（參考圖）：縮圖用靜態圖，點開才載入動態圖。 ── */
  function renderExtra() {
    const extras = topic().extras; if (!extras) return;
    $('extraTitle').textContent = extras.title || extras.label;
    $('extraNotice').innerHTML = (extras.notice || []).map(line => `<p>${esc(line)}</p>`).join('');
    $('extraGrid').innerHTML = extras.items.map((item, i) => `<button type="button" class="extra-card" data-extra-open="${i}"><img src="${esc(asset(item.thumb || item.src))}" alt="" loading="lazy"><strong>${esc(item.title)}</strong>${item.time ? `<small>${esc(item.time)}</small>` : ''}</button>`).join('');
  }
  let viewerIndex = -1;
  function showViewer(i) {
    const items = topic().extras ? topic().extras.items : []; if (!items.length) return;
    viewerIndex = (i + items.length) % items.length;
    const item = items[viewerIndex];
    $('viewerTitle').textContent = item.title;
    $('viewerMeta').textContent = [item.time, `第${viewerIndex + 1}／${items.length}張`].filter(Boolean).join('　');
    const note = $('viewerNote'); note.hidden = !item.note; note.textContent = item.note || '';
    document.querySelector('.viewer').classList.toggle('has-note', Boolean(item.note));
    const img = $('viewerImg'); img.src = asset(item.src); img.alt = `${item.title}示意圖`;
    $('viewerOverlay').hidden = false;
  }
  function closeViewer() {
    if ($('viewerOverlay').hidden) return;
    $('viewerOverlay').hidden = true; $('viewerImg').removeAttribute('src');
    document.querySelector(`[data-extra-open="${viewerIndex}"]`)?.focus();
    viewerIndex = -1;
  }

  /* ── 詞彙卡操作 ── */
  function randomIndex(length) {
    if (globalThis.crypto?.getRandomValues) { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] % length; }
    return Math.floor(Math.random() * length);
  }
  function step(delta) {
    const n = currentWords().length; if (!n) return;
    state.idx = (state.idx + delta + n) % n; state.shown = false; stopAudio(); renderCard();
  }
  function jumpRandom() {
    const n = currentWords().length; if (n < 2) return;
    state.idx = (state.idx + 1 + randomIndex(n - 1)) % n; state.shown = false; stopAudio(); renderCard();
  }
  function toggleReveal() { if (!currentWords().length || state.showAll) return; state.shown = !state.shown; renderCard(); }

  /* ── 凡例視窗 ── */
  let dialogReturnFocus = null;
  function openLegend() {
    $('dialogTitle').textContent = '凡例';
    $('dialogContent').innerHTML = `<ul>${(DATA.legend || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
    dialogReturnFocus = document.activeElement;
    $('dialogOverlay').hidden = false; $('dialogClose').focus();
  }
  function closeDialog() {
    if ($('dialogOverlay').hidden) return;
    $('dialogOverlay').hidden = true; dialogReturnFocus?.focus?.();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }

  /* ── 事件 ── */
  document.addEventListener('click', e => {
    if (e.target === $('dialogOverlay') || e.target.closest('#dialogClose')) { closeDialog(); return; }
    if (e.target === $('viewerOverlay')) { closeViewer(); return; }
    const t = e.target.closest('button'); if (!t) return;
    // 用滑鼠或觸控操作後，把焦點放回「揭曉」鈕，接著按空白鍵就能揭曉；
    // 用鍵盤操作（e.detail 為 0）時不移動焦點，維持原本的操作位置。
    const refocus = () => { if (e.detail > 0 && state.view === 'card' && !state.showAll) $('revealBtn').focus({ preventScroll: true }); };
    if (t.dataset.viewer) { if (t.dataset.viewer === 'close') closeViewer(); else showViewer(viewerIndex + (t.dataset.viewer === 'next' ? 1 : -1)); return; }
    if (t.dataset.extraOpen) { showViewer(Number(t.dataset.extraOpen)); document.querySelector('[data-viewer="close"]').focus(); return; }
    if (t.id === 'extraBtn') { state.view = state.view === 'extra' ? 'card' : 'extra'; render(); return; }
    if (t.dataset.audioKey) { playAudio(t.dataset.audioKey, t); refocus(); return; }
    if (t.dataset.topic) { state.topic = t.dataset.topic; state.group = 'all'; state.idx = 0; state.shown = false; render(); refocus(); return; }
    if (t.dataset.dialect) { state.dialect = t.dataset.dialect; state.shown = false; render(); refocus(); return; }
    if (t.dataset.tone) { state.toneMode = t.dataset.tone; render(); refocus(); return; }
    if (t.dataset.view) { state.view = t.dataset.view; render(); refocus(); return; }
    if (t.dataset.group) { state.group = t.dataset.group; state.idx = 0; state.shown = false; render(); refocus(); return; }
    if (t.dataset.open) {
      const i = currentWords().findIndex(w => w._uid === t.dataset.open);
      if (i >= 0) { state.idx = i; state.shown = false; state.view = 'card'; render(); if (!state.showAll) $('revealBtn').focus(); }
      return;
    }
    if (t.dataset.action === 'reveal') toggleReveal();
    if (t.dataset.action === 'prev') { step(-1); refocus(); }
    if (t.dataset.action === 'next') { step(1); refocus(); }
    if (t.dataset.action === 'random') { jumpRandom(); refocus(); }
    if (t.id === 'meaningToggle') { state.showAll = !state.showAll; state.shown = false; render(); refocus(); }
    if (t.id === 'fontToggle') { state.fontUp = state.fontUp > 1 ? 1 : 1.2; render(); refocus(); }
    if (t.id === 'legendBtn') openLegend();
    if (t.id === 'fullscreenToggle') toggleFullscreen();
  });

  document.addEventListener('keydown', e => {
    if (!$('viewerOverlay').hidden) {
      if (e.key === 'Escape') closeViewer();
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showViewer(viewerIndex - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); showViewer(viewerIndex + 1); }
      return;
    }
    if (e.key === 'Escape') { closeDialog(); return; }
    // 凡例或語音工具開著時，不讓方向鍵、空白鍵去翻後面的詞彙卡。
    if (document.querySelector('.dialog-overlay:not([hidden]), .phonology-overlay:not([hidden])')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target;
    if (target.matches?.('input,textarea,select') || target.isContentEditable) return;
    if (e.key.toLowerCase() === 'f') { toggleFullscreen(); return; }
    if (e.key.toLowerCase() === 'p' && state.view === 'card') { const b = document.querySelector('#cardAudio .audio-btn'); if (b) playAudio(b.dataset.audioKey, b); return; }
    if (state.view !== 'card') return;
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); step(1); }
    else if (e.key === ' ' && !target.closest?.('button,summary,a')) { e.preventDefault(); toggleReveal(); }
  });

  /* ── 啟動 ── */
  $('siteTitle').textContent = DATA.title || '客語詞彙';
  $('siteVersion').textContent = DATA.version || '';
  document.title = [DATA.title, DATA.version].filter(Boolean).join('｜');
  $('footInfo').textContent = [[DATA.school, DATA.course].filter(Boolean).join('　'), DATA.term, DATA.teachers, DATA.credit].filter(Boolean).join('｜');
  render();
})();
