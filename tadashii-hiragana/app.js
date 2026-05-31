/* ただしいひらがな — ことば あなうめ型 */
'use strict';

// ===== データ =====
// 清音＋「ん」だけで書ける、絵文字にできる身近な語
const WORDS = [
  { w: 'いぬ',   e: '🐕' }, { w: 'ねこ',   e: '🐈' }, { w: 'とり',   e: '🐦' },
  { w: 'さかな', e: '🐟' }, { w: 'うし',   e: '🐄' }, { w: 'うま',   e: '🐎' },
  { w: 'かに',   e: '🦀' }, { w: 'たこ',   e: '🐙' }, { w: 'いか',   e: '🦑' },
  { w: 'とら',   e: '🐅' }, { w: 'さる',   e: '🐒' }, { w: 'くま',   e: '🐻' },
  { w: 'ひよこ', e: '🐤' }, { w: 'りす',   e: '🐿️' }, { w: 'はと',   e: '🕊️' },
  { w: 'はな',   e: '🌸' }, { w: 'ほし',   e: '⭐' }, { w: 'つき',   e: '🌙' },
  { w: 'やま',   e: '⛰️' }, { w: 'ゆき',   e: '❄️' }, { w: 'こおり', e: '🧊' },
  { w: 'くるま', e: '🚗' }, { w: 'ふね',   e: '🚢' }, { w: 'いす',   e: '🪑' },
  { w: 'かさ',   e: '☂️' }, { w: 'くつ',   e: '👟' }, { w: 'ほん',   e: '📖' },
  { w: 'とけい', e: '🕐' }, { w: 'はさみ', e: '✂️' }, { w: 'くすり', e: '💊' },
  { w: 'みかん', e: '🍊' }, { w: 'すいか', e: '🍉' }, { w: 'もも',   e: '🍑' },
  { w: 'とまと', e: '🍅' }, { w: 'みみ',   e: '👂' }, { w: 'たいこ', e: '🥁' },
];

// 混同しやすい字（向き・形）
const CONFUSE = {
  'い': ['り', 'こ'], 'り': ['い', 'れ'],
  'ぬ': ['め', 'ね', 'わ'], 'め': ['ぬ', 'ね'], 'ね': ['れ', 'わ', 'ぬ'],
  'れ': ['ね', 'わ'], 'わ': ['れ', 'ね'],
  'は': ['ほ', 'ま'], 'ほ': ['は', 'ま'], 'ま': ['は', 'ほ'],
  'さ': ['き', 'ち'], 'き': ['さ', 'ち'], 'ち': ['さ', 'き'],
  'そ': ['ろ', 'ら'], 'ろ': ['そ', 'る', 'ら'], 'る': ['ろ', 'ら'], 'ら': ['ろ', 'る'],
  'お': ['あ', 'む'], 'あ': ['お', 'む'], 'む': ['す', 'お'], 'す': ['む', 'る'],
  'く': ['へ', 'し'], 'し': ['つ', 'く'], 'つ': ['し', 'て'], 'て': ['と', 'つ'],
  'と': ['て', 'こ'], 'こ': ['に', 'い'], 'に': ['こ', 'た'], 'た': ['な', 'に'], 'な': ['た', 'は'],
  'け': ['は', 'ほ'], 'も': ['ま', 'ち'], 'み': ['ぬ', 'め'], 'ひ': ['か', 'こ'],
  'ふ': ['う', 'ら'], 'う': ['ら', 'ろ'], 'か': ['や', 'は'], 'や': ['か', 'ゆ'], 'ゆ': ['や'],
  'ん': ['そ', 'く'], 'よ': ['ま', 'は'],
};
const POOL = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'.split('');

// ===== 設定・状態 =====
const CFG_KEY = 'mst_1g_hiragana_cfg';
const REC_KEY = 'mst_1g_hiragana';
const cfg = Object.assign({ diff: 'normal', sound: false, len: 10 }, MST.load(CFG_KEY, {}));
const saveCfg = () => MST.save(CFG_KEY, cfg);

let studentId = null;          // 記録対象（null = きろくなし）
let qIndex = 0;                // セット内の現在の問題番号
let solved = 0;                // このセットで正解した数
let target = null;             // 正解の文字
let firstTry = true;           // 今の問題を1回で当てたか

// ===== ユーティリティ =====
const $ = (id) => document.getElementById(id);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ===== 音声（オフライン内蔵・無ければ無音） =====
let jaVoice = null;
function refreshVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  jaVoice = vs.find(v => /ja|Japan/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) {
  refreshVoice();
  speechSynthesis.onvoiceschanged = refreshVoice;
}
function speak(text) {
  if (!cfg.sound || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.85;
    if (jaVoice) u.voice = jaVoice;
    speechSynthesis.speak(u);
  } catch (e) { /* 無視 */ }
}

// ===== 〇マーク演出 =====
function showMaru() {
  const m = document.createElement('div');
  m.className = 'maru';
  document.body.appendChild(m);
  setTimeout(() => m.remove(), 900);
}

// ===== 記録 =====
function loadRecords() { return MST.load(REC_KEY, {}); }
function bumpRecord(field, missChar) {
  if (!studentId) return;
  const recs = loadRecords();
  const r = recs[studentId] || { q: 0, first: 0, miss: {}, last: '' };
  if (field === 'q') { r.q++; r.last = MST.today(); }
  if (field === 'first') r.first++;
  if (missChar) r.miss[missChar] = (r.miss[missChar] || 0) + 1;
  recs[studentId] = r;
  MST.save(REC_KEY, recs);
}

// ===== 出題 =====
function buildOptions(c) {
  let d = cfg.diff === 'mix' ? pick(['easy', 'normal', 'hard']) : cfg.diff;
  const recipes = {
    easy:   ['mirror', 'char'],
    normal: ['char', 'char'],
    hard:   ['char', 'mirror', 'char'],
  };
  const recipe = recipes[d] || recipes.normal;
  const opts = [{ char: c, tf: 'none', correct: true }];
  const used = new Set([c + '|none']);
  const confus = (CONFUSE[c] || []).slice();

  const addChar = () => {
    let char = null;
    while (confus.length) {
      const cand = confus.splice(Math.floor(Math.random() * confus.length), 1)[0];
      if (cand !== c && !used.has(cand + '|none')) { char = cand; break; }
    }
    if (!char) {
      for (let t = 0; t < 60 && !char; t++) {
        const r = pick(POOL);
        if (r !== c && !used.has(r + '|none')) char = r;
      }
    }
    if (char) { used.add(char + '|none'); opts.push({ char, tf: 'none', correct: false }); }
  };
  const addMirror = () => {
    for (const tf of shuffle(['mirrorX', 'mirrorY', 'rotate'])) {
      if (!used.has(c + '|' + tf)) { used.add(c + '|' + tf); opts.push({ char: c, tf, correct: false }); return; }
    }
    addChar();
  };

  recipe.forEach(k => (k === 'mirror' ? addMirror() : addChar()));
  return shuffle(opts);
}

function nextQuestion() {
  if (qIndex >= cfg.len) { showResult(); return; }
  qIndex++;
  firstTry = true;

  const word = pick(WORDS);
  const blank = Math.floor(Math.random() * word.w.length);
  target = word.w[blank];

  $('emoji').textContent = word.e;

  // ことば（あなあき）
  const wordEl = $('word');
  wordEl.innerHTML = '';
  word.w.split('').forEach((ch, i) => {
    const t = document.createElement('div');
    if (i === blank) { t.className = 'tile blank'; t.dataset.blank = '1'; t.textContent = ch; }
    else { t.className = 'tile'; t.textContent = ch; }
    wordEl.appendChild(t);
  });

  // せんたくし
  const optsEl = $('options');
  optsEl.innerHTML = '';
  buildOptions(target).forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="glyph ${o.tf}">${o.char}</span>`;
    b.addEventListener('click', () => onPick(b, o));
    optsEl.appendChild(b);
  });

  renderStars();
  speak(word.w);
}

function onPick(btn, o) {
  if (o.correct) {
    btn.classList.add('correct', 'done');
    document.querySelectorAll('.opt').forEach(el => el.classList.add('done'));
    const blankTile = document.querySelector('.tile.blank');
    if (blankTile) { blankTile.classList.remove('blank'); blankTile.classList.add('filled'); }
    solved++;
    renderStars();
    bumpRecord('q');
    if (firstTry) bumpRecord('first');
    MST.toast(pick(['すごい！', 'せいかい！', 'やったね！', 'はなまる！']));
    MST.confetti();
    showMaru();
    setTimeout(nextQuestion, 1100);
  } else {
    firstTry = false;
    bumpRecord(null, target);
    btn.classList.add('wrong');
    MST.toast('おしい！ もういちど');
  }
}

function renderStars() {
  let s = '';
  for (let i = 0; i < cfg.len; i++) s += (i < solved ? '⭐' : '☆');
  $('stars').textContent = s;
}

// ===== 画面遷移 =====
function startSet() {
  qIndex = 0; solved = 0;
  $('start').classList.add('hidden');
  $('result').classList.add('hidden');
  $('game').classList.remove('hidden');
  nextQuestion();
}
function showResult() {
  $('game').classList.add('hidden');
  $('result').classList.remove('hidden');
  $('result-title').textContent = `はなまる ${solved}こ！`;
  $('result-stars').textContent = '⭐'.repeat(solved) || '🌱';
  MST.confetti();
}
function toStart() {
  $('game').classList.add('hidden');
  $('result').classList.add('hidden');
  $('start').classList.remove('hidden');
  renderWhoNow();
}

// ===== だれが あそぶ =====
function renderWhoNow() {
  const students = MST.loadStudents();
  const s = students.find(x => x.id === studentId);
  $('who-now').textContent = s ? `いま： ${s.name}` : 'きろくなし（れんしゅう）';
}
function openWho() {
  const students = MST.loadStudents();
  const wrap = $('who-chips');
  wrap.innerHTML = '';
  const make = (id, name, color) => {
    const c = document.createElement('button');
    c.className = 'chip' + (studentId === id ? ' active' : '');
    c.textContent = name;
    if (color) c.style.background = color, c.style.color = '#fff', c.style.borderColor = color;
    c.addEventListener('click', () => {
      studentId = id;
      wrap.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
    });
    wrap.appendChild(c);
  };
  make(null, 'きろくなし', null);
  students.forEach(s => make(s.id, s.name, s.color));
  $('who-dialog').showModal();
}

// ===== せんせい がめん =====
function syncSeg() {
  document.querySelectorAll('#diff-seg button').forEach(b => b.classList.toggle('active', b.dataset.diff === cfg.diff));
  document.querySelectorAll('#len-seg button').forEach(b => b.classList.toggle('active', +b.dataset.len === cfg.len));
  $('sound-toggle').checked = cfg.sound;
}
function renderRecords() {
  const recs = loadRecords();
  const students = MST.loadStudents();
  const box = $('records');
  box.innerHTML = '';
  let any = false;
  students.forEach(s => {
    const r = recs[s.id];
    if (!r || !r.q) return;
    any = true;
    const rate = Math.round((r.first / r.q) * 100);
    const miss = Object.entries(r.miss).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const missHtml = miss.length
      ? miss.map(([ch]) => `<b>${ch}</b>`).join('')
      : '<span style="color:var(--accent)">なし</span>';
    const row = document.createElement('div');
    row.className = 'rec-row';
    row.innerHTML = `
      <span class="rec-name">${s.name}</span>
      <span class="rec-rate">せいかい ${rate}%</span>
      <span class="rec-miss">つまずき: ${missHtml}</span>`;
    box.appendChild(row);
  });
  if (!any) box.innerHTML = '<div class="rec-empty">まだ きろくが ありません。</div>';
}

// ===== イベント =====
$('start-btn').addEventListener('click', startSet);
$('again-btn').addEventListener('click', startSet);
$('finish-btn').addEventListener('click', toStart);
$('speak-btn').addEventListener('click', () => {
  // 表示中のことばを読み上げ
  const chars = [...document.querySelectorAll('#word .tile')].map(t => t.textContent).join('');
  if (chars) speak(chars);
});

$('who-btn').addEventListener('click', openWho);
$('who-close').addEventListener('click', () => { $('who-dialog').close(); renderWhoNow(); });

$('teacher-btn').addEventListener('click', () => { syncSeg(); renderRecords(); $('teacher-dialog').showModal(); });
$('teacher-close').addEventListener('click', () => $('teacher-dialog').close());
$('diff-seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  cfg.diff = b.dataset.diff; saveCfg(); syncSeg();
});
$('len-seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  cfg.len = +b.dataset.len; saveCfg(); syncSeg();
});
$('sound-toggle').addEventListener('change', e => { cfg.sound = e.target.checked; saveCfg(); });
$('reset-records').addEventListener('click', () => {
  MST.save(REC_KEY, {});
  renderRecords();
  MST.toast('きろくを けしました');
});

// ===== 初期化 =====
MST.loadStudents();
renderWhoNow();
