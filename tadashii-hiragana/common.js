// MSTbase 1年生サポートアプリ 共通ユーティリティ
const MST = (() => {
  const KEY_STUDENTS = 'mst_1g_students';
  const DEFAULT_COLORS = ['#ffb74d', '#81c784', '#64b5f6', '#f48fb1', '#ba68c8', '#4dd0e1'];
  const DEFAULT_STUDENTS = ['Aさん', 'Bさん', 'Cさん', 'Dさん', 'Eさん', 'Fさん']
    .map((name, i) => ({ id: 's' + (i + 1), name, color: DEFAULT_COLORS[i] }));

  const load = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };
  const save = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error(e); }
  };

  const loadStudents = () => {
    const s = load(KEY_STUDENTS, null);
    if (!s) { save(KEY_STUDENTS, DEFAULT_STUDENTS); return JSON.parse(JSON.stringify(DEFAULT_STUDENTS)); }
    return s;
  };
  const saveStudents = (list) => save(KEY_STUDENTS, list);

  const today = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  const toast = (msg) => {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 1800);
  };

  const confetti = () => {
    const emojis = ['🎉', '⭐', '✨', '🌟', '🎊', '💫'];
    for (let i = 0; i < 24; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      c.style.left = Math.random() * 100 + 'vw';
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  };

  // データのエクスポート/インポート（JSON）
  const exportAll = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mst_1g_')) {
        try { data[k] = JSON.parse(localStorage.getItem(k)); }
        catch { data[k] = localStorage.getItem(k); }
      }
    }
    return data;
  };
  const importAll = (obj) => {
    Object.entries(obj).forEach(([k, v]) => {
      if (k.startsWith('mst_1g_')) localStorage.setItem(k, JSON.stringify(v));
    });
  };

  return { load, save, loadStudents, saveStudents, today, toast, confetti, exportAll, importAll, KEY_STUDENTS };
})();
