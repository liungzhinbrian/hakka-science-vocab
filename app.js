/* 生活中的科學　客語詞彙篇｜詞彙卡與詞彙總表
   原生 HTML／CSS／JavaScript，不使用框架、外部函式庫或伺服器。
   ─ 修改詞彙：vocab-data.js
   ─ 修改外觀：styles.css 最上方的變數
   ─ 音檔：assets/audio/，清單在 audio-manifest.js
   ─ 元素週期表：資料在 vocab-data.js 的 elem 主題，畫面由本檔的 renderPtable 產生
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
  // 「元素週期表」（type: "periodic"）以週期表呈現，不做成詞彙卡，也不併入「所有詞彙」。
  const isPeriodic = t => Boolean(t) && t.type === 'periodic';
  // 「科學實驗語句練習」（type: "reading"）：逐句練習，每句一個音檔，另有「聆聽全文」。同樣不併入「所有詞彙」。
  const isReading = t => Boolean(t) && t.type === 'reading';
  const ALL_TOPIC = { id: 'all', label: '所有詞彙', groups: [], words: TOPICS.filter(t => !t.type).flatMap(t => t.words) };
  const TOPIC_TABS = [ALL_TOPIC, ...TOPICS];
  // 主題列與標題下方顯示的名稱：詞彙主題加上「詞彙」兩字。
  const tabLabel = t => t.id === 'all' || t.type ? t.label : `${t.label}詞彙`;
  const tabCount = t => isReading(t) ? (t.passages || []).length : t.words.length;
  const state = { topic: TOPIC_TABS.some(t => t.id === wantedTopic) ? wantedTopic : TOPICS[0].id, dialect: 'hailu', toneMode: 'value', view: 'card', group: 'all', idx: 0, shown: false, showAll: false, fontUp: 1, el: 1, ptCat: '', passage: 0 };
  const topic = () => TOPIC_TABS.find(t => t.id === state.topic) || TOPICS[0];
  const specialView = t => isPeriodic(t) ? 'ptable' : isReading(t) ? 'reading' : '';
  if (specialView(topic())) state.view = specialView(topic());

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
      + (alt ? `<button type="button" class="audio-btn" data-audio-key="${esc(alt)}" title="播放${word.aka ? '「' + esc(word.aka.han) + '」' : '又音'}"><span aria-hidden="true">▶</span> ${word.aka ? esc(word.aka.han) : '又音'}</button>` : '');
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
    // 詞彙卡：整張卡鎖在一個畫面的高度裡，下方的按鈕位置固定；內容太長時只在卡片中間那一塊捲動。
    document.body.classList.toggle('card-lock', state.view === 'card');
    // 元素週期表：換成深色玻璃風格的底，並收起用不到的按鈕（檢視方式、華語揭曉、字級），免得按了沒有反應。
    const periodic = isPeriodic(topic()), reading = isReading(topic()), special = periodic || reading;
    document.body.classList.toggle('theme-tech', periodic);
    $('viewSeg').hidden = special; $('meaningToggle').hidden = special; $('fontToggle').hidden = special;
    const notice = $('topicNotice'); notice.textContent = topic().notice || ''; notice.hidden = !topic().notice;
    $('footKeys').textContent = periodic ? '←／→ 換元素　P 播放　F 全螢幕' : reading ? 'F 全螢幕' : '←／→ 換詞　空白鍵 揭曉　P 播放　F 全螢幕';
    $('fontToggle').textContent = state.fontUp > 1 ? '字級－' : '字級＋';
    const meaningToggle = $('meaningToggle');
    meaningToggle.textContent = state.showAll ? '華語：全部顯示' : '華語：逐詞揭曉';
    meaningToggle.setAttribute('aria-pressed', String(state.showAll));
    meaningToggle.classList.toggle('active', state.showAll);
    $('app').style.setProperty('--fontup', state.fontUp);
    $('topicTabs').innerHTML = TOPIC_TABS.map(t => {
      const on = t.id === state.topic;
      return `<button type="button" data-topic="${esc(t.id)}" class="${on ? 'active' : ''}" aria-pressed="${on}">${esc(tabLabel(t))}<small>${tabCount(t)}</small></button>`;
    }).join('');
    $('siteSub').textContent = tabLabel(topic());
    const extras = topic().extras, extraBtn = $('extraBtn');
    if (!extras && state.view === 'extra') state.view = 'card';
    extraBtn.hidden = !extras;
    extraBtn.textContent = extras ? extras.label : '';
    extraBtn.classList.toggle('active', state.view === 'extra');
    extraBtn.setAttribute('aria-pressed', String(state.view === 'extra'));
    const groups = topic().groups || [];
    $('groupTabs').hidden = !groups.length || state.view === 'extra' || special;
    // 語句練習：分類那一排換成各篇的頁籤
    const passages = reading ? (topic().passages || []) : [];
    if (state.passage >= passages.length) state.passage = 0;
    $('passageTabs').hidden = !reading;
    $('passageTabs').innerHTML = passages.map((p, i) => `<button type="button" data-passage="${i}" class="${i === state.passage ? 'active' : ''}" aria-pressed="${i === state.passage}">${esc(p.title)}</button>`).join('');   // 主題沒有分類、或正在看補充區時，不顯示分類頁籤
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
    // 示意圖（例如結構式）：圖在 figures.js，直接以 SVG 畫在漢字旁，沒有底色。每次換到這張卡都會重播一次動畫。
    const fig = (window.VOCAB_FIGURES || {})[word.figure], figBox = $('cardFigure');
    // 只有換到另一個詞時才重畫（動畫從頭播一次）；同一張卡揭曉、切換腔調時不重播。
    figBox.closest('.word-area').classList.toggle('has-figure', Boolean(fig));   // 有圖時，左邊的文字讓出右側一欄
    const figKey = fig ? `${word._uid}:${word.figure}` : '';
    if (figBox.dataset.fig !== figKey) {
      figBox.dataset.fig = figKey; figBox.hidden = !fig; figBox.innerHTML = fig ? fig.svg : '';
      if (fig) figBox.querySelector('svg')?.setAttribute('aria-label', fig.label || '');
    }
    $('cardPinyin').textContent = entry ? formatPinyin(entry.pinyin, state.dialect) : '';
    const alt = $('cardAlt');
    // 又音（同一個詞的另一個讀法）與又稱（另一個說法，例如漏斗又稱酒漏仔）都放在這一行
    const altParts = [];
    if (entry && entry.alt) altParts.push(`又音 ${formatPinyin(entry.alt, state.dialect)}`);
    if (word.aka && word.aka[state.dialect]) altParts.push(`又稱 ${word.aka.han} ${formatPinyin(word.aka[state.dialect], state.dialect)}`);
    alt.hidden = !altParts.length;
    alt.textContent = altParts.join('　');
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
      const alt = (entry && entry.alt ? `<small>又音 ${esc(formatPinyin(entry.alt, state.dialect))}</small>` : '')
        + (word.aka && word.aka[state.dialect] ? `<small>又稱 ${esc(word.aka.han)} ${esc(formatPinyin(word.aka[state.dialect], state.dialect))}</small>` : '');
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
    $('ptableView').hidden = state.view !== 'ptable';
    $('readingView').hidden = state.view !== 'reading';
    if (state.view === 'card') renderCard(); else if (state.view === 'list') renderList(); else if (state.view === 'ptable') renderPtable(); else if (state.view === 'reading') renderReading(); else renderExtra();
  }

  /* ── 科學實驗語句練習：每句一列（漢字、拼音、播放鈕），上方是「聆聽全文」。
     音檔檔名：〔篇〕-〔句，兩位數〕，全文是〔篇〕-full；清單在 audio-manifest.js 的 read 主題。 ── */
  const readKey = (pid, name, dialect) => {
    const set = AUDIO && AUDIO.topics && AUDIO.topics[topic().id], key = `${pid}-${name}`;
    return set && (set[dialect] || []).includes(key) ? `${set.dir ? set.dir + '/' : ''}${dialect}/${key}` : '';
  };
  function renderReading() {
    const p = (topic().passages || [])[state.passage]; if (!p) return;
    $('readingTitle').textContent = p.title;
    $('readingDialect').textContent = DIALECTS[state.dialect];
    const full = readKey(p.id, 'full', state.dialect);
    $('readingFull').innerHTML = full ? `<button type="button" class="audio-btn reading-full" data-audio-key="${esc(full)}" title="從頭到尾播放整篇"><span aria-hidden="true">▶</span> 聆聽全文</button>` : '';
    $('readingLines').innerHTML = p.lines.map(line => {
      const entry = line[state.dialect], key = readKey(p.id, String(line.id).padStart(2, '0'), state.dialect);
      return `<li><span class="reading-n">${esc(line.id)}</span><div class="reading-text"><span class="reading-han" lang="hak">${esc(entry ? entry.han : '')}</span><span class="pinyin" lang="hak">${esc(entry ? formatPinyin(entry.pinyin, state.dialect) : '')}</span></div>`
        + (key ? `<button type="button" class="audio-btn" data-audio-key="${esc(key)}" title="播放第${esc(line.id)}句"><span aria-hidden="true">▶</span> 播放</button>` : '') + '</li>';
    }).join('');
  }

  /* ── 元素週期表 ──
     位置由原子序算出：第 1 欄放週期，元素在第（族＋1）欄；第 1 列放族名，元素在第（週期＋1）列；
     鑭系、錒系拉到下方兩列。點選的元素顯示在上方空白處（週期 1–3、第 3–12 族的位置）。 */
  const PT_GROUPS = ['I A', 'II A', 'III B', 'IV B', 'V B', 'VI B', 'VII B', 'VIII B', 'VIII B', 'VIII B', 'I B', 'II B', 'III A', 'IV A', 'V A', 'VI A', 'VII A', 'VIII A'];
  function ptPos(z) {
    if (z === 1) return [1, 1]; if (z === 2) return [18, 1];
    if (z <= 4) return [z - 2, 2]; if (z <= 10) return [z + 8, 2];
    if (z <= 12) return [z - 10, 3]; if (z <= 18) return [z, 3];
    if (z <= 36) return [z - 18, 4]; if (z <= 54) return [z - 36, 5];
    if (z <= 56) return [z - 54, 6]; if (z <= 71) return [z - 53, 9]; if (z <= 86) return [z - 68, 6];
    if (z <= 88) return [z - 86, 7]; if (z <= 103) return [z - 85, 10]; return [z - 100, 7];
  }
  const ptCats = () => Object.fromEntries((topic().categories || []).map(c => [c.id, c]));
  const ptColor = (cats, id) => (cats[id] && /^\d{1,3},\d{1,3},\d{1,3}$/.test(cats[id].color)) ? cats[id].color : '200,205,220';
  const ptElement = z => topic().words.find(w => w.id === z);
  function renderPtable() {
    const cats = ptCats(), at = (g, p) => `grid-column:${g + 1};grid-row:${p + 1}`;
    if (!ptElement(state.el)) state.el = topic().words[0].id;
    let html = '<div class="pt-detail" id="ptDetail" aria-live="polite"></div>';
    for (let p = 1; p <= 7; p++) html += `<div class="pt-period" style="grid-column:1;grid-row:${p + 1}">週期${p}</div>`;
    PT_GROUPS.forEach((g, i) => { const col = i + 1, above = col === 1 || col === 18 ? 0 : col === 2 || col >= 13 ? 1 : 3;   // 族名放在該欄第一個元素的正上方
      html += `<div class="pt-group" style="grid-column:${col + 1};grid-row:${above + 1}">${g}</div>`; });
    for (const w of topic().words) {
      const [g, p] = ptPos(w.id), entry = entryOf(w);
      html += `<button type="button" class="pt-el${w.id > 99 ? ' z3' : ''}" data-el="${w.id}" data-cat="${esc(w.cat)}" style="--c:${ptColor(cats, w.cat)};${at(g, p)}" aria-label="${w.id} ${esc(w.sym)} ${esc(entry ? entry.han : '')}"><span class="z">${w.id}</span><span class="sym">${esc(w.sym)}</span><span class="han" lang="hak">${esc(entry ? entry.han : '')}</span></button>`;
    }
    html += `<div class="pt-series" data-cat="lanth" style="--c:${ptColor(cats, 'lanth')};${at(3, 6)}">57–71<br>鑭系</div><div class="pt-series" data-cat="act" style="--c:${ptColor(cats, 'act')};${at(3, 7)}">89–103<br>錒系</div>`
      + '<div class="pt-series-label" style="grid-column:1 / 5;grid-row:10">鑭系</div><div class="pt-series-label" style="grid-column:1 / 5;grid-row:11">錒系</div>';
    $('pt').innerHTML = html;
    $('ptLegend').innerHTML = (topic().categories || []).map(c => `<button type="button" data-pt-cat="${esc(c.id)}" aria-pressed="false" title="點一下，這一類元素會在表上閃爍；再點一次取消" style="--c:${ptColor(cats, c.id)}"><i class="pt-dot"></i>${esc(c.label)}</button>`).join('');
    renderElement(); renderPtFocus();
  }
  // 點圖例：該類別的元素閃爍、其餘變暗，讓人看出它們在表上的位置。再點一次同一個類別，或按 Esc，就取消。
  function renderPtFocus() {
    if (!(topic().categories || []).some(c => c.id === state.ptCat)) state.ptCat = '';
    $('pt').classList.toggle('has-focus', Boolean(state.ptCat));
    $('pt').querySelectorAll('[data-cat]').forEach(el => el.classList.toggle('hl', Boolean(state.ptCat) && el.dataset.cat === state.ptCat));
    $('ptLegend').querySelectorAll('[data-pt-cat]').forEach(b => { const on = b.dataset.ptCat === state.ptCat; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
  }
  function renderElement() {
    const w = ptElement(state.el); if (!w) return;
    const cats = ptCats(), entry = entryOf(w), detail = $('ptDetail');
    $('pt').querySelectorAll('.pt-el.on').forEach(b => b.classList.remove('on'));
    $('pt').querySelector(`.pt-el[data-el="${w.id}"]`)?.classList.add('on');
    const main = audioKey(w, state.dialect, false), akaKey = audioKey(w, state.dialect, true);
    const play = main ? `<button type="button" class="audio-btn" data-audio-key="${esc(main)}" title="播放讀音（P）"><span aria-hidden="true">▶</span> 播放</button>` : '';
    const aka = w.aka ? `<div class="pt-aka">俗稱<strong lang="hak">${esc(w.aka.han)}</strong><span class="pinyin" lang="hak">${esc(formatPinyin(w.aka[state.dialect], state.dialect))}</span>`
      + (akaKey ? `<button type="button" class="audio-btn" data-audio-key="${esc(akaKey)}" title="播放「${esc(w.aka.han)}」"><span aria-hidden="true">▶</span> ${esc(w.aka.han)}</button>` : '') + '</div>' : '';
    detail.style.setProperty('--c', ptColor(cats, w.cat));
    detail.innerHTML = `<div class="pt-name"><span class="han" lang="hak">${esc(entry ? entry.han : '')}</span><span class="en">${esc(w.en || '')}</span></div>`
      + `<div class="pt-meta"><span class="sym">${esc(w.sym)}</span><span class="z">原子序 ${w.id}${w.state ? '・' + esc(w.state) : ''}</span><span class="cat"><i class="pt-dot"></i>${esc(cats[w.cat] ? cats[w.cat].label : '')}</span></div>`
      // 左邊是客語讀音（與俗稱），右邊靠右放華語注音符號。
      + `<div class="pt-hak"><div class="pt-hakka"><div class="pt-reading"><span class="pt-dialect">${DIALECTS[state.dialect]}</span><span class="pinyin" lang="hak">${esc(entry ? formatPinyin(entry.pinyin, state.dialect) : '')}</span>${play}</div>${aka}</div>`
      + (w.zhuyin ? `<div class="pt-zh"><span class="pt-dialect">華語</span><span class="zhuyin" lang="zh-Hant-TW">${esc(w.zhuyin)}</span></div>` : '') + '</div>';
  }
  function selectElement(z, moveFocus) {
    const ids = topic().words.map(w => w.id); if (!ids.length) return;
    state.el = ids.includes(z) ? z : (z < ids[0] ? ids[ids.length - 1] : ids[0]);   // 超出範圍就繞回另一端
    stopAudio(); renderElement();
    // 用方向鍵換元素時，焦點跟著移到新的那一格，免得空白鍵又按回原本點過的格子。
    if (moveFocus) $('pt').querySelector('.pt-el.on')?.focus({ preventScroll: true });
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
    if (t.dataset.el) { selectElement(Number(t.dataset.el)); return; }
    if (t.dataset.passage) { state.passage = Number(t.dataset.passage); render(); return; }
    if (t.dataset.ptCat) { state.ptCat = state.ptCat === t.dataset.ptCat ? '' : t.dataset.ptCat; renderPtFocus(); return; }
    if (t.dataset.topic) {
      state.topic = t.dataset.topic; state.group = 'all'; state.idx = 0; state.shown = false;
      state.view = specialView(topic()) || (state.view === 'ptable' || state.view === 'reading' ? 'card' : state.view);
      render(); refocus(); return;
    }
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
    if (e.key === 'Escape') { if (!$('dialogOverlay').hidden) closeDialog(); else if (state.view === 'ptable' && state.ptCat) { state.ptCat = ''; renderPtFocus(); } return; }
    // 凡例或語音工具開著時，不讓方向鍵、空白鍵去翻後面的詞彙卡。
    if (document.querySelector('.dialog-overlay:not([hidden]), .phonology-overlay:not([hidden])')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target;
    if (target.matches?.('input,textarea,select') || target.isContentEditable) return;
    if (e.key.toLowerCase() === 'f') { toggleFullscreen(); return; }
    if (e.key.toLowerCase() === 'p' && state.view === 'card') { const b = document.querySelector('#cardAudio .audio-btn'); if (b) playAudio(b.dataset.audioKey, b); return; }
    if (state.view === 'ptable') {
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); selectElement(state.el - 1, true); }
      else if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); selectElement(state.el + 1, true); }
      else if (e.key.toLowerCase() === 'p') { const b = document.querySelector('#ptDetail .audio-btn'); if (b) playAudio(b.dataset.audioKey, b); }
      return;
    }
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
