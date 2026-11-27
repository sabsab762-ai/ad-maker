/* =====================================================================
   광고 만들기 · 통합 대시보드  —  core
   ===================================================================== */
(function () {
  'use strict';

  var PREFIX = 'admk1.';
  var app = document.getElementById('app');
  var modal = document.getElementById('modal');
  var modalCard = document.getElementById('modal-card');

  var App = {
    modules: [],
    cache: {},
    current: 'home'
  };

  /* ---------- tiny helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function uid(p) { return (p || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function nowStamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' +
      pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
  }
  function won(n) {
    var num = Number(String(n == null ? '' : n).replace(/[^0-9.-]/g, ''));
    if (!isFinite(num) || !num) return String(n == null ? '' : n);
    return num.toLocaleString('ko-KR');
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function lines(text) {
    return String(text || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function oneLine(text) { return String(text || '').replace(/\s+/g, ' ').trim(); }
  function josa(word, withBatchim, withoutBatchim) {
    var s = String(word == null ? '' : word).trim();
    if (!s) return withoutBatchim;
    var c = s.charCodeAt(s.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return withoutBatchim;
    return ((c - 0xAC00) % 28) ? withBatchim : withoutBatchim;
  }

  /* ---------- storage ---------- */
  var Store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(PREFIX + key);
        if (raw == null) return fallback;
        return JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (e) { toast('저장 공간이 부족해 저장하지 못했어요.'); return false; }
    },
    del: function (key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) {}
    },
    keys: function () {
      var out = [], i, k;
      try {
        for (i = 0; i < localStorage.length; i++) {
          k = localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
        }
      } catch (e) {}
      return out;
    }
  };

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2600);
  }

  /* ---------- copy ---------- */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', 'readonly');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copyText(text, btn, doneMsg) {
    var value = String(text == null ? '' : text);
    if (!value.trim()) { toast('복사할 내용이 없어요.'); return; }
    function finish(ok) {
      if (!ok) { toast('복사가 막혔어요. 내용을 길게 눌러 직접 복사해 주세요.'); return; }
      toast(doneMsg || '복사했어요. 그대로 붙여넣으면 됩니다!');
      if (btn) {
        var raw = btn.getAttribute('data-label') || btn.textContent;
        btn.setAttribute('data-label', raw);
        btn.textContent = '복사됨 ✓';
        btn.classList.add('is-done');
        setTimeout(function () {
          btn.textContent = raw;
          btn.classList.remove('is-done');
        }, 1600);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () { finish(true); }, function () { finish(legacyCopy(value)); });
    } else {
      finish(legacyCopy(value));
    }
  }

  /* ---------- download ---------- */
  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ---------- modal ---------- */
  function openModal(html) {
    modalCard.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.hidden = true;
    modalCard.innerHTML = '';
    document.body.style.overflow = '';
  }
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  /* ---------- home ---------- */
  function renderHome() {
    App.current = 'home';
    var cards = App.modules.map(function (m) {
      return '<button class="mcard" type="button" data-go="' + esc(m.id) + '">' +
        '<span class="ico" aria-hidden="true">' + m.emoji + '</span>' +
        '<span class="body"><span class="name">' + esc(m.name) + '</span>' +
        '<span class="desc">' + esc(m.desc) + '</span></span>' +
        '<span class="foot">' + (m.free ? '<span class="free">무료</span>' : '') +
        '<span class="arrow" aria-hidden="true">›</span></span>' +
        '</button>';
    }).join('');

    app.innerHTML = '<div class="wrap">' +
      '<div class="hello"><h1>환영합니다, 운영 관리자님</h1>' +
      '<p>광고 소재 만들기 ' + App.modules.length + '종 자판기 — 필요한 카드를 누르면 바로 시작합니다. 작업 내용은 이 브라우저에 자동 저장돼요.</p></div>' +
      '<div class="grid">' + cards + '</div>' +
      '</div>';
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- module page ---------- */
  function renderModule(mod) {
    App.current = mod.id;
    var page = document.createElement('div');
    page.className = 'page';

    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'back';
    back.setAttribute('data-nav', 'home');
    back.innerHTML = '<span aria-hidden="true">←</span> 대시보드';

    var head = document.createElement('div');
    head.className = 'mhead';
    head.innerHTML = '<span class="mico" aria-hidden="true">' + mod.emoji + '</span>' +
      '<div><h2>' + esc(mod.name) + (mod.free ? ' <span class="free" style="vertical-align:3px">무료</span>' : '') + '</h2>' +
      '<p>' + esc(mod.desc) + '</p></div>';

    var body = document.createElement('div');
    /* 다른 자판기에서 넘긴 상품이 있으면 화면을 새로 그립니다 */
    if (Store.get('pick', null) && App.cache[mod.id]) delete App.cache[mod.id];
    if (!App.cache[mod.id]) {
      try { mod.render(body); } catch (err) {
        body.innerHTML = '<div class="panel"><h3>화면을 여는 중 문제가 생겼어요</h3><p class="psub mono">' + esc(err && err.message) + '</p></div>';
      }
      App.cache[mod.id] = body;
    }

    page.appendChild(back);
    page.appendChild(head);
    page.appendChild(App.cache[mod.id]);
    app.innerHTML = '';
    app.appendChild(page);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- routing ---------- */
  function route() {
    var hash = String(location.hash || '').replace(/^#\/?/, '').trim();
    if (!hash) { renderHome(); return; }
    var found = null, i;
    for (i = 0; i < App.modules.length; i++) { if (App.modules[i].id === hash) { found = App.modules[i]; break; } }
    if (found) renderModule(found); else renderHome();
  }
  function go(id) {
    if (!id || id === 'home') {
      if (location.hash && location.hash !== '#/') location.hash = '#/';
      else renderHome();
      return;
    }
    location.hash = '#/' + id;
  }

  document.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-nav]');
    if (nav) { e.preventDefault(); go(nav.getAttribute('data-nav')); return; }
    var card = e.target.closest('[data-go]');
    if (card) { go(card.getAttribute('data-go')); return; }
    var act = e.target.closest('[data-act]');
    if (act) {
      var a = act.getAttribute('data-act');
      if (a === 'help') showHelp();
      if (a === 'ask') showAsk();
      if (a === 'backup') backupData();
      return;
    }
  });

  window.addEventListener('hashchange', route);

  /* ---------- help / ask / backup ---------- */
  function showHelp() {
    var list = App.modules.map(function (m) {
      return '<li><b>' + m.emoji + ' ' + esc(m.name) + '</b> — ' + esc(m.help || m.desc) + '</li>';
    }).join('');
    openModal('<button class="x" type="button" data-close>✕</button>' +
      '<h3>이 기능 도움말</h3>' +
      '<p style="margin-top:8px">모든 기능은 이 브라우저 안에서만 동작하고, 입력한 내용은 서버로 보내지 않습니다. 아래 ' + App.modules.length + '개 자판기를 눌러 바로 쓸 수 있어요.</p>' +
      '<h4>' + App.modules.length + '개 자판기</h4><ul>' + list + '</ul>' +
      '<h4>기억해 두세요</h4><ul>' +
      '<li>작업 내용은 <b>이 브라우저(localStorage)</b>에 자동 저장됩니다. 브라우저 기록을 지우면 함께 사라지니, 중요하면 상단 <b>데이터 백업</b>으로 JSON을 받아 두세요.</li>' +
      '<li>인스타 카드·상세페이지처럼 파일로 내려받는 기능은 버튼을 누르면 바로 다운로드 폴더에 저장됩니다.</li>' +
      '<li>AI 영상은 실제 영상 파일을 렌더링하지 않습니다. 촬영·생성에 바로 쓸 수 있는 <b>대본·프롬프트·스토리보드</b>를 만들어 줍니다.</li>' +
      '<li>사이트 분석은 브라우저 보안(CORS) 때문에 남의 사이트를 자동으로 읽지 못합니다. 본문을 붙여넣거나 김호퍼에게 URL 분석을 맡기세요.</li>' +
      '</ul>');
  }

  function showAsk() {
    var text = '[광고 만들기 대시보드 문의]\n' +
      '· 쓰던 자판기: (예: 인스타 캐러셀 사진 자판기)\n' +
      '· 하려던 일: \n' +
      '· 지금 상태 / 막힌 부분: \n' +
      '· 원하는 결과물: ';
    openModal('<button class="x" type="button" data-close>✕</button>' +
      '<h3>문의하기</h3>' +
      '<p style="margin-top:8px">아래 문구를 복사해 김호퍼에게 그대로 보내 주세요. 필요한 내용만 채우면 됩니다.</p>' +
      '<textarea id="ask-text" class="mono" style="min-height:150px;margin-top:10px">' + esc(text) + '</textarea>' +
      '<div class="actions"><button class="btn btn-primary" type="button" data-copy="#ask-text">문의 문구 복사</button>' +
      '<button class="btn btn-ghost" type="button" data-close>닫기</button></div>');
  }

  function backupData() {
    var data = { app: 'ad-maker', exportedAt: new Date().toISOString(), store: {} };
    Store.keys().forEach(function (k) { data.store[k] = Store.get(k, null); });
    download('ad-maker-backup-' + todayKey() + '.json', JSON.stringify(data, null, 2), 'application/json');
    toast('백업 파일을 내려받았어요.');
  }

  /* ---------- copy delegation ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var sel = btn.getAttribute('data-copy');
    var el = sel ? $(sel) : null;
    var text = el ? (el.value != null && el.value !== '' && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') ? el.value : el.textContent) : '';
    copyText(text, btn, btn.getAttribute('data-copy-msg'));
  });

  /* ---------- exports ---------- */
  App.register = function (mod) { App.modules.push(mod); return mod; };
  App.go = go;
  App.toast = toast;
  App.copy = copyText;
  App.download = download;
  App.esc = esc;
  App.store = Store;
  App.helpers = {
    $: $, $$: $$, pick: pick, shuffle: shuffle, randInt: randInt,
    lines: lines, oneLine: oneLine, won: won, nowStamp: nowStamp, pad2: pad2, uid: uid, clamp: clamp, josa: josa
  };
  window.App = App;

  App.start = function () {
    route();
    if (!location.hash) { try { history.replaceState(null, '', '#/'); } catch (e) {} }
  };
})();
