/* ---- core.js ---- */
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
      '<p>광고 소재 만들기 9종 자판기 — 필요한 카드를 누르면 바로 시작합니다. 작업 내용은 이 브라우저에 자동 저장돼요.</p></div>' +
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
      '<p style="margin-top:8px">모든 기능은 이 브라우저 안에서만 동작하고, 입력한 내용은 서버로 보내지 않습니다. 아래 9개 자판기를 눌러 바로 쓸 수 있어요.</p>' +
      '<h4>9개 자판기</h4><ul>' + list + '</ul>' +
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

/* ---- mod-danggeun.js ---- */
/* =====================================================================
   Module 1 · 🥕 당근 광고 자판기
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc;

  var CATS = ['인터넷·통신', '렌탈·타이어', '이사·청소', '지원금·생활'];
  var EMOJI = { '인터넷·통신': '📶', '렌탈·타이어': '🛞', '이사·청소': '📦', '지원금·생활': '💰' };
  var DISCLOSURE = '#광고 이 글은 제휴(어필리에이트) 활동의 일환으로, 링크를 통해 가입·구매하시면 작성자에게 소정의 수수료가 지급될 수 있습니다.';
  var SAMPLES = [
    { id: 's1', emoji: '📶', category: '인터넷·통신', title: '인터넷 · TV 결합 가입 최대 혜택', benefit: '최대 47만원 혜택', note: '설치비 0원 · 3년 약정 기준 사은품 즉시 지급', url: '', sample: true },
    { id: 's2', emoji: '🛞', category: '렌탈·타이어', title: '타이어 렌탈 (4짝 기준)', benefit: '월 2만원대', note: '교체·보관·AS까지 한 번에, 목돈 없이 월 렌탈', url: '', sample: true },
    { id: 's3', emoji: '📦', category: '이사·청소', title: '포장이사 견적 비교', benefit: '최대 30% 절감', note: '3개 업체 견적을 한 번에 비교하고 이사일 확정', url: '', sample: true },
    { id: 's4', emoji: '💰', category: '지원금·생활', title: '소상공인 정책자금 진단', benefit: '최대 7,000만원', note: '업종·매출만 입력하면 받을 수 있는 지원금 3분 진단', url: '', sample: true }
  ];

  function load() {
    var v = S.get('danggeun.items', null);
    if (!Array.isArray(v) || !v.length) return SAMPLES.map(function (x) { return Object.assign({}, x); });
    return v;
  }

  function matchCat(raw) {
    var v = String(raw || '').replace(/\s/g, '');
    if (!v) return null;
    for (var i = 0; i < CATS.length; i++) {
      var flat = CATS[i].replace(/·/g, '');
      if (v === CATS[i] || v === flat || v.indexOf(flat) !== -1 || flat.indexOf(v) !== -1) return CATS[i];
    }
    var map = [
      [['인터넷', '통신', '폰', '요금제', '알뜰', 'iptv', 'tv', '결합'], '인터넷·통신'],
      [['렌탈', '렌트', '타이어', '정수기', '비데', '구독'], '렌탈·타이어'],
      [['이사', '청소', '입주', '포장', '원룸', '짐'], '이사·청소'],
      [['지원금', '정책', '정부', '카드', '보험', '적금', '대출', '소상공', '창업', '환급'], '지원금·생활']
    ];
    var low = v.toLowerCase(), i2, k;
    for (i2 = 0; i2 < map.length; i2++) for (k = 0; k < map[i2][0].length; k++) if (low.indexOf(map[i2][0][k]) !== -1) return map[i2][1];
    return null;
  }

  function normalizeUrl(raw) {
    var v = String(raw || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(v)) return 'https://' + v;
    return '';
  }
  function isLive(u) { return /^https?:\/\//i.test(String(u || '').trim()); }

  /* ---------- 홍보글 3종 ---------- */
  function castTexts(item) {
    var tags = { '인터넷·통신': '#인터넷가입', '렌탈·타이어': '#렌탈 #타이어', '이사·청소': '#이사 #입주청소', '지원금·생활': '#지원금 #생활정보' };
    var url = String(item.url || '').trim();
    var link = isLive(url) ? url : '(제휴 링크 미등록 — 카드 등록에서 링크를 넣어주세요)';
    var benefit = item.benefit || '';
    var note = item.note || '';
    var tag = tags[item.category] || '#' + String(item.category || '생활').replace(/[·\s]/g, '');

    var carrot = [
      (item.emoji || '🥕') + ' ' + item.title,
      '',
      benefit + (note ? ' · ' + note : ''),
      '',
      '동네 이웃님들께 먼저 알려드려요. 궁금한 건 편하게 댓글이나 채팅 주세요!',
      '👉 ' + link,
      '',
      '#광고 #동네정보 ' + tag,
      DISCLOSURE
    ].join('\n');

    var thread = [
      (item.emoji || '🥕') + ' ' + item.title,
      benefit + (note ? ' | ' + note : ''),
      '',
      '요즘 제일 많이 물어보는 그거, 링크 정리해뒀어요 👇',
      link,
      '',
      '저장해두고 필요할 때 보세요 🌱',
      '#생활혜택 #동네꿀팁 #제휴링크',
      DISCLOSURE
    ].join('\n');

    var cafe = [
      '[정보] ' + item.title + (benefit ? ' — ' + benefit : ''),
      '',
      '안녕하세요, 동네 소식 공유드립니다.',
      '· 혜택: ' + (benefit || '-'),
      '· 특징: ' + (note || '-'),
      '· 자세히 보기: ' + link,
      '',
      '관심 있으신 분들은 링크 확인해보시고, 궁금한 점은 댓글로 남겨주세요.',
      '',
      '※ ' + DISCLOSURE
    ].join('\n');

    return [
      { key: 'carrot', label: '① 당근 비즈프로필 / 동네홍보', hint: '짧고 다정하게, 이웃에게 말 걸듯이', text: carrot },
      { key: 'thread', label: '② 스레드 / 인스타그램', hint: '줄바꿈 위주로 눈에 띄게', text: thread },
      { key: 'cafe', label: '③ 지역 카페', hint: '정보글 톤으로 자세하게', text: cafe }
    ];
  }

  /* ---------- 배포용 순수 HTML ---------- */
  function buildPublicHtml(items) {
    var data = [];
    for (var i = 0; i < items.length; i++) {
      data.push({
        e: items[i].emoji || '🥕', c: items[i].category || '지원금·생활',
        t: items[i].title || '', b: items[i].benefit || '', n: items[i].note || '', u: items[i].url || ''
      });
    }
    var payload = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    var cats = JSON.stringify(CATS);

    var css = [
      '*{box-sizing:border-box}',
      'body{margin:0;background:#fff;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif;line-height:1.5}',
      '.app{max-width:720px;margin:0 auto;padding:0 0 60px}',
      '.top{display:flex;align-items:center;gap:9px;padding:12px 18px;border-bottom:1px solid #ECECEC;position:sticky;top:0;background:rgba(255,255,255,.94);backdrop-filter:blur(10px)}',
      '.top .m{width:34px;height:34px;display:grid;place-items:center;background:#FFF1E6;border-radius:11px;font-size:18px}',
      '.top b{font-size:15px;font-weight:800}',
      '.top small{display:block;font-size:10.5px;color:#9A9A9A;font-weight:700}',
      '.hero{padding:22px 18px 4px}',
      '.hero i{display:inline-block;padding:5px 10px;border-radius:999px;background:#FFF1E6;color:#E15B00;font-size:11px;font-weight:800;font-style:normal}',
      '.hero h1{margin:11px 0 5px;font-size:26px;font-weight:800;letter-spacing:-.035em}',
      '.hero p{color:#6B6B6B;font-size:13.5px}',
      '.chips{display:flex;gap:7px;overflow:auto;padding:14px 18px 4px;scrollbar-width:none}',
      '.chips::-webkit-scrollbar{display:none}',
      '.chip{flex:none;padding:8px 13px;border:1px solid #ECECEC;border-radius:999px;background:#fff;font-size:13px;font-weight:700;color:#4B4B4B}',
      '.chip.on{background:#FF6F0F;border-color:#FF6F0F;color:#fff}',
      '.chip span{margin-left:5px;font-size:10.5px;opacity:.7}',
      '.meta{padding:8px 20px 2px;font-size:12px;color:#9A9A9A;font-weight:700}',
      '.list{display:grid;gap:11px;padding:8px 18px}',
      '.c{border:1px solid #ECECEC;border-radius:16px;padding:15px}',
      '.c .h{display:flex;gap:10px;align-items:flex-start}',
      '.c .ic{width:42px;height:42px;flex:none;display:grid;place-items:center;background:#FFF7F0;border-radius:13px;font-size:20px}',
      '.c .bd{min-width:0}',
      '.c .bg{display:inline-block;padding:2px 8px;border-radius:999px;background:#F4F5F7;color:#6E6E73;font-size:10.5px;font-weight:800;margin-bottom:4px}',
      '.c h3{margin:0;font-size:15px;font-weight:800;letter-spacing:-.02em;word-break:keep-all}',
      '.c .bf{margin-top:11px;font-size:20px;font-weight:800;letter-spacing:-.03em;color:#FF6F0F}',
      '.c p{margin:4px 0 0;font-size:12.5px;color:#6B6B6B;line-height:1.6;word-break:keep-all}',
      '.c a,.c button{display:flex;align-items:center;justify-content:center;margin-top:12px;height:42px;border-radius:11px;background:#FFF1E6;color:#E15B00;font-size:13.5px;font-weight:800;text-decoration:none;border:0;width:100%}',
      '.empty{padding:40px 18px;text-align:center;border:1px dashed #E4E4E4;border-radius:16px;color:#9A9A9A;font-size:12.5px}',
      '.foot{margin:16px 18px 0;padding-top:14px;border-top:1px solid #ECECEC;font-size:11px;line-height:1.65;color:#9A9A9A}',
      '@media(min-width:640px){.list{grid-template-columns:1fr 1fr}}'
    ].join('');

    var script = [
      '(function(){',
      'var ITEMS=' + payload + ',CATS=' + cats + ',cur="전체";',
      'var chips=document.getElementById("chips"),list=document.getElementById("list"),meta=document.getElementById("meta");',
      'function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}',
      'function live(u){return /^https?:\\/\\//i.test(String(u||"").trim())}',
      'function pick(c){return c==="전체"?ITEMS:ITEMS.filter(function(i){return i.c===c})}',
      'function renderChips(){var all=["전체"].concat(CATS),h="";for(var i=0;i<all.length;i++){var n=all[i],c=pick(n).length;h+=\'<button class="chip\'+(n===cur?" on":"")+\'" data-cat="\'+esc(n)+\'">\'+esc(n)+\'<span>\'+c+\'</span></button>\'}chips.innerHTML=h}',
      'function card(i){var badge=\'<span class="bg">\'+esc(i.c)+\'</span>\';var b=i.b?\'<div class="bf">\'+esc(i.b)+\'</div>\':"";var n=i.n?\'<p>\'+esc(i.n)+\'</p>\':"";var act=live(i.u)?\'<a href="\'+esc(i.u)+\'" target="_blank" rel="noopener noreferrer sponsored">바로가기 ›</a>\':\'<button data-missing="1">바로가기 ›</button>\';return \'<article class="c"><div class="h"><div class="ic">\'+esc(i.e)+\'</div><div class="bd">\'+badge+\'<h3>\'+esc(i.t)+\'</h3></div></div>\'+b+n+act+\'</article>\'}',
      'function render(){var l=pick(cur);meta.innerHTML="<b>"+l.length+"</b>개 혜택";if(!l.length){list.innerHTML=\'<div class="empty">아직 등록된 혜택이 없어요.</div>\';list.style.gridTemplateColumns="1fr";return}list.style.gridTemplateColumns="";var h="";for(var i=0;i<l.length;i++)h+=card(l[i]);list.innerHTML=h}',
      'chips.addEventListener("click",function(e){var b=e.target.closest(".chip");if(!b)return;cur=b.getAttribute("data-cat");renderChips();render()});',
      'list.addEventListener("click",function(e){if(e.target.closest("[data-missing]"))alert("제휴 링크가 아직 등록되지 않은 카드예요.")});',
      'renderChips();render();})();'
    ].join('\n');

    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="theme-color" content="#FF6F0F">\n<title>생활 혜택 자판기</title>\n' +
      '<style>' + css + '</style>\n</head>\n<body>\n<div class="app">\n' +
      '<header class="top"><span class="m">🥕</span><div><b>생활 혜택 자판기</b><small>동네 혜택 모음</small></div></header>\n' +
      '<div class="hero"><i>#광고 · 제휴 링크 안내</i><h1>생활 혜택 자판기</h1><p>동네에서 쓸 만한 혜택만 모았어요. 버튼 한 번이면 바로 확인!</p></div>\n' +
      '<div class="chips" id="chips"></div>\n<div class="meta" id="meta"></div>\n<div class="list" id="list"></div>\n' +
      '<div class="foot">이 페이지의 링크는 <b>제휴(어필리에이트) 링크</b>를 포함하고 있으며, 링크를 통한 가입·구매 시 운영자에게 소정의 수수료가 지급될 수 있습니다. 상품의 조건과 혜택은 판매처 사정에 따라 달라질 수 있으니 신청 전 꼭 확인해 주세요.</div>\n' +
      '</div>\n<script>\n' + script + '\n<\/script>\n</body>\n</html>\n';
  }

  /* ---------- 화면 ---------- */
  var state = { items: [], cat: '전체', editing: null };

  App.register({
    id: 'danggeun', emoji: '🥕', name: '당근 광고 자판기', free: false, tag: '제휴·홍보',
    desc: '동네 혜택 카드 등록 → 홍보글 3종 자동 생성 → 배포용 HTML까지.',
    help: '카드를 등록하고 일괄 붙여넣기로 한 번에 추가하면, 당근·스레드·카페 홍보글이 자동으로 만들어집니다. 배포용 HTML을 내려받아 Netlify·GitHub Pages에 올리면 그대로 사이트가 됩니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent = '.dgfeed{display:grid;gap:8px;max-height:430px;overflow:auto;padding-right:2px}' +
        '.dgfeed .c{border:1px solid var(--line);border-radius:12px;padding:11px 12px;background:#fff;display:flex;gap:10px;align-items:flex-start}' +
        '.dgfeed .ic{width:34px;height:34px;flex:none;display:grid;place-items:center;background:#FFF6EE;border-radius:10px;font-size:17px}' +
        '.dgfeed .t{font-size:12.5px;font-weight:800;letter-spacing:-.02em;line-height:1.4;word-break:keep-all}' +
        '.dgfeed .b{margin-top:3px;font-size:13px;font-weight:800;color:#E15B00;letter-spacing:-.02em}' +
        '.dgfeed .n{margin-top:2px;font-size:11px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
        '.dgfeed .cat{display:inline-block;font-size:10px;font-weight:800;color:#8A8A8F;background:#F4F5F7;border-radius:999px;padding:1px 6px;margin-bottom:3px}';
      document.head.appendChild(st);

      state.items = load();

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack">' +
            '<section class="panel"><h3>➕ 카드 등록 / 수정</h3>' +
              '<p class="psub">저장하면 아래 자판기 미리보기에 바로 반영됩니다.</p>' +
              '<div class="row2"><div class="field"><label for="dg-emoji">아이콘</label><input id="dg-emoji" type="text" maxlength="4" placeholder="🥕"></div>' +
              '<div class="field"><label for="dg-cat">카테고리</label><select id="dg-cat">' + CATS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div></div>' +
              '<div class="field"><label for="dg-title">제목 *</label><input id="dg-title" type="text" placeholder="예: 인터넷 가입 최대 혜택"></div>' +
              '<div class="field"><label for="dg-benefit">혜택 / 가격 문구 *</label><input id="dg-benefit" type="text" placeholder="예: 최대 47만원 혜택"></div>' +
              '<div class="field"><label for="dg-note">한 줄 특징</label><input id="dg-note" type="text" placeholder="예: 설치비 0원, 사은품 즉시 지급"></div>' +
              '<div class="field"><label for="dg-url">제휴 링크</label><input id="dg-url" type="text" inputmode="url" placeholder="https://... (비워도 저장 가능)"></div>' +
              '<div class="actions"><button class="btn btn-primary" type="button" id="dg-save">카드 추가</button>' +
              '<button class="btn btn-ghost" type="button" id="dg-cancel" hidden>수정 취소</button></div>' +
            '</section>' +
            '<section class="panel"><h3>📥 일괄 자동 등록</h3>' +
              '<p class="psub">한 줄에 하나씩 <code>상품명 | 카테고리 | 혜택 | 한줄특징 | 링크</code> 순서. 엑셀 복사(탭 구분)도 인식합니다.</p>' +
              '<div class="field"><textarea id="dg-bulk" placeholder="인터넷 가입 최대 혜택 | 인터넷·통신 | 최대 47만원 | 설치비 0원 · 사은품 즉시 지급 | https://example.com/internet&#10;타이어 렌탈 4짝 | 렌탈·타이어 | 월 2만원대 | 교체·보관·AS 포함 | https://example.com/tire"></textarea></div>' +
              '<div class="actions"><button class="btn btn-soft btn-block" type="button" id="dg-bulkrun">자동 파싱해서 한 번에 추가</button></div>' +
            '</section>' +
          '</div>' +
          '<div class="stack">' +
            '<section class="panel"><h3>🥕 자판기 미리보기 <span class="pill" id="dg-count">0</span></h3>' +
              '<div class="chiprow" id="dg-chips"></div>' +
              '<div class="dgfeed" id="dg-feed" style="margin-top:12px"></div>' +
            '</section>' +
            '<section class="panel"><h3>🗂 등록된 카드 <span class="pill" id="dg-admin-count">0</span></h3>' +
              '<div id="dg-list" style="margin-top:10px"></div>' +
              '<div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="dg-reset">샘플 4개로 되돌리기</button></div>' +
            '</section>' +
            '<section class="panel"><h3>✍️ 홍보글 3종 자동 생성</h3>' +
              '<div class="field"><label for="dg-cast">홍보할 카드</label><select id="dg-cast"></select></div>' +
              '<div class="out" id="dg-castout" style="margin-top:12px"></div>' +
            '</section>' +
            '<section class="panel"><h3>🚀 배포용 순수 자판기 HTML</h3>' +
              '<p class="psub">관리 기능을 뺀 고객용 페이지만 담긴 HTML 파일입니다. 파일 하나만 올리면 진짜 사이트가 됩니다.</p>' +
              '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="dg-export">배포용 HTML 다운로드</button></div>' +
              '<p class="hint" id="dg-expsum"></p>' +
            '</section>' +
          '</div>' +
        '</div>';

      var el = {
        emoji: H.$('#dg-emoji', root), cat: H.$('#dg-cat', root), title: H.$('#dg-title', root),
        benefit: H.$('#dg-benefit', root), note: H.$('#dg-note', root), url: H.$('#dg-url', root),
        save: H.$('#dg-save', root), cancel: H.$('#dg-cancel', root),
        bulk: H.$('#dg-bulk', root), feed: H.$('#dg-feed', root), chips: H.$('#dg-chips', root),
        list: H.$('#dg-list', root), cast: H.$('#dg-cast', root), castout: H.$('#dg-castout', root)
      };

      function persist() { S.set('danggeun.items', state.items); }

      function renderChips() {
        var html = '';
        var all = ['전체'].concat(CATS);
        for (var i = 0; i < all.length; i++) {
          var n = all[i];
          var c = n === '전체' ? state.items.length : state.items.filter(function (x) { return x.category === n; }).length;
          html += '<button class="chip' + (n === state.cat ? ' on' : '') + '" type="button" data-cat="' + esc(n) + '">' + esc(n) + '<span class="n">' + c + '</span></button>';
        }
        el.chips.innerHTML = html;
      }

      function renderFeed() {
        var list = state.cat === '전체' ? state.items : state.items.filter(function (x) { return x.category === state.cat; });
        H.$('#dg-count', root).textContent = list.length;
        if (!list.length) {
          el.feed.innerHTML = '<div class="empty"><b>아직 카드가 없어요</b>왼쪽 폼이나 일괄 등록으로 추가해 보세요.</div>';
          return;
        }
        el.feed.innerHTML = list.map(function (it) {
          return '<div class="c"><div class="ic">' + esc(it.emoji || '🥕') + '</div><div style="min-width:0">' +
            '<span class="cat">' + esc(it.category) + (it.sample ? ' · 샘플' : '') + '</span>' +
            '<div class="t">' + esc(it.title) + '</div>' +
            (it.benefit ? '<div class="b">' + esc(it.benefit) + '</div>' : '') +
            (it.note ? '<div class="n">' + esc(it.note) + '</div>' : '') +
            '<div class="small" style="margin-top:5px;color:' + (isLive(it.url) ? '#158449' : '#B0B0BC') + '">' + (isLive(it.url) ? '링크 등록됨' : '링크 없음') + '</div>' +
            '</div></div>';
        }).join('');
      }

      function renderList() {
        H.$('#dg-admin-count', root).textContent = state.items.length;
        if (!state.items.length) { el.list.innerHTML = '<p class="psub">등록된 카드가 없습니다.</p>'; return; }
        el.list.innerHTML = state.items.map(function (it) {
          return '<div class="rowitem"><div class="ri">' + esc(it.emoji || '🥕') + '</div>' +
            '<div class="rm"><div class="rt">' + esc(it.title) + (it.sample ? ' <span class="tag">샘플</span>' : '') + '</div>' +
            '<div class="rs">' + esc(it.category) + ' · ' + esc(it.benefit || '혜택 문구 없음') + '</div></div>' +
            '<button class="btn btn-sm btn-line" type="button" data-edit="' + esc(it.id) + '">수정</button>' +
            '<button class="btn btn-sm btn-danger" type="button" data-del="' + esc(it.id) + '">삭제</button></div>';
        }).join('');
      }

      function renderCast() {
        var prev = el.cast.value;
        el.cast.innerHTML = state.items.length
          ? state.items.map(function (i) { return '<option value="' + esc(i.id) + '">' + esc(i.emoji || '🥕') + ' ' + esc(i.title) + '</option>'; }).join('')
          : '<option value="">등록된 카드가 없어요</option>';
        if (prev && state.items.some(function (i) { return i.id === prev; })) el.cast.value = prev;
        renderCastOut();
      }

      function renderCastOut() {
        var item = state.items.filter(function (i) { return i.id === el.cast.value; })[0];
        if (!item) { el.castout.innerHTML = '<div class="empty">카드를 먼저 등록하면 홍보글이 자동으로 만들어집니다.</div>'; return; }
        el.castout.innerHTML = castTexts(item).map(function (v, idx) {
          return '<div class="cardout"><div class="ch"><span class="t">' + esc(v.label) + '</span><span class="m">' + esc(v.hint) + '</span>' +
            '<button class="btn btn-sm btn-soft" type="button" data-copy-v="' + idx + '">복사</button></div>' +
            '<div class="cb scroll">' + esc(v.text) + '</div></div>';
        }).join('');
        Array.prototype.forEach.call(el.castout.querySelectorAll('[data-copy-v]'), function (b) {
          b.addEventListener('click', function () {
            var idx = Number(b.getAttribute('data-copy-v'));
            App.copy(castTexts(item)[idx].text, b);
          });
        });
      }

      function refresh() { renderChips(); renderFeed(); renderList(); renderCast(); updateSummary(); }

      function updateSummary() {
        var live = state.items.filter(function (i) { return isLive(i.url); }).length;
        H.$('#dg-expsum', root).textContent = state.items.length
          ? '지금 카드 ' + state.items.length + '개 중 제휴 링크가 있는 카드 ' + live + '개가 배포본에 들어갑니다.'
          : '카드를 먼저 등록해 주세요.';
      }

      function resetForm() {
        state.editing = null;
        el.title.value = ''; el.benefit.value = ''; el.note.value = ''; el.url.value = ''; el.emoji.value = '';
        el.cat.value = CATS[0];
        el.save.textContent = '카드 추가';
        el.cancel.hidden = true;
        renderList();
      }

      el.chips.addEventListener('click', function (e) {
        var b = e.target.closest('.chip'); if (!b) return;
        state.cat = b.getAttribute('data-cat'); renderChips(); renderFeed();
      });

      el.save.addEventListener('click', function () {
        var title = el.title.value.trim();
        var benefit = el.benefit.value.trim();
        if (!title) { App.toast('제목을 입력해 주세요.'); el.title.focus(); return; }
        if (!benefit) { App.toast('혜택 문구를 입력해 주세요.'); el.benefit.focus(); return; }
        var cat = el.cat.value;
        var data = {
          emoji: el.emoji.value.trim() || EMOJI[cat] || '🥕', category: cat,
          title: title, benefit: benefit, note: el.note.value.trim(),
          url: normalizeUrl(el.url.value), sample: false
        };
        if (state.editing) {
          var idx = -1, i;
          for (i = 0; i < state.items.length; i++) if (state.items[i].id === state.editing) idx = i;
          if (idx !== -1) state.items[idx] = Object.assign({}, state.items[idx], data);
          App.toast('카드를 수정했어요.');
        } else {
          data.id = H.uid('d');
          state.items.push(data);
          App.toast('카드를 추가했어요. 미리보기에 반영됐습니다.');
        }
        persist(); resetForm(); refresh();
      });

      el.cancel.addEventListener('click', function () { resetForm(); App.toast('수정을 취소했어요.'); });

      el.list.addEventListener('click', function (e) {
        var ed = e.target.closest('[data-edit]');
        if (ed) {
          var id = ed.getAttribute('data-edit');
          var it = state.items.filter(function (x) { return x.id === id; })[0];
          if (!it) return;
          state.editing = id;
          el.emoji.value = it.emoji; el.cat.value = it.category; el.title.value = it.title;
          el.benefit.value = it.benefit; el.note.value = it.note; el.url.value = it.url;
          el.save.textContent = '수정 저장'; el.cancel.hidden = false;
          renderList();
          el.title.focus();
          App.toast('수정할 내용을 불러왔어요.');
          return;
        }
        var de = e.target.closest('[data-del]');
        if (de) {
          var did = de.getAttribute('data-del');
          var target = state.items.filter(function (x) { return x.id === did; })[0];
          if (!target) return;
          if (!window.confirm('"' + target.title + '" 카드를 삭제할까요? 되돌릴 수 없어요.')) return;
          state.items = state.items.filter(function (x) { return x.id !== did; });
          if (state.editing === did) resetForm();
          persist(); refresh(); App.toast('카드를 삭제했어요.');
        }
      });

      H.$('#dg-bulkrun', root).addEventListener('click', function () {
        var text = el.bulk.value;
        if (!text.trim()) { App.toast('붙여넣은 내용이 없어요.'); return; }
        var added = [], guessed = 0, rows = H.lines(text);
        rows.forEach(function (line) {
          if (line.charAt(0) === '#') return;
          var parts = line.indexOf('|') !== -1 || line.indexOf('｜') !== -1 ? line.split(/[|｜]/) : (line.indexOf('\t') !== -1 ? line.split('\t') : [line]);
          parts = parts.map(function (p) { return p.trim(); });
          if (!parts[0]) return;
          var cat = matchCat(parts[1]);
          if (!cat) { if (parts[1]) guessed++; cat = '지원금·생활'; }
          added.push({
            id: H.uid('d'), emoji: EMOJI[cat] || '🥕', category: cat, title: parts[0],
            benefit: parts[2] || '', note: parts[3] || '', url: normalizeUrl(parts[4] || ''), sample: false
          });
        });
        if (!added.length) { App.toast('추가할 줄을 찾지 못했어요. 형식을 확인해 주세요.'); return; }
        state.items = state.items.concat(added);
        persist(); el.bulk.value = ''; refresh();
        App.toast(added.length + '개 카드를 한 번에 추가했어요!' + (guessed ? ' (카테고리를 못 읽은 ' + guessed + '개는 지원금·생활)' : ''));
      });

      el.cast.addEventListener('change', renderCastOut);

      H.$('#dg-reset', root).addEventListener('click', function () {
        if (!window.confirm('지금 등록된 카드를 모두 지우고 샘플 4개로 되돌릴까요?')) return;
        state.items = SAMPLES.map(function (x) { return Object.assign({}, x); });
        persist(); resetForm(); refresh(); App.toast('샘플로 되돌렸어요.');
      });

      H.$('#dg-export', root).addEventListener('click', function () {
        if (!state.items.length) { App.toast('카드를 먼저 등록해 주세요.'); return; }
        App.download('danggeun-japanki-public.html', buildPublicHtml(state.items), 'text/html;charset=utf-8');
        App.toast('배포용 HTML을 내려받았어요.');
      });

      refresh();
    }
  });
})();

/* ---- mod-insta.js ---- */
/* =====================================================================
   Module 2 · 📸 인스타 캐러셀 사진 자판기  (Canvas 1080×1350)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  var THEMES = {
    dark:   { name: '모던 다크', bg: '#141418', bg2: '#1E1E26', fg: '#FFFFFF', sub: 'rgba(255,255,255,.66)', accent: '#B9A6FF', line: 'rgba(255,255,255,.16)' },
    cream:  { name: '크림',      bg: '#FBF4E9', bg2: '#F6ECDC', fg: '#2B2118', sub: 'rgba(43,33,24,.62)', accent: '#C2683A', line: 'rgba(43,33,24,.14)' },
    purple: { name: '퍼플',      bg: '#5A2EE8', bg2: '#4A1FD1', fg: '#FFFFFF', sub: 'rgba(255,255,255,.78)', accent: '#FFD36B', line: 'rgba(255,255,255,.24)' },
    carrot: { name: '당근',      bg: '#FFF3EA', bg2: '#FFE7D6', fg: '#2A1A12', sub: 'rgba(42,26,18,.60)', accent: '#FF6F0F', line: 'rgba(42,26,18,.12)' },
    mint:   { name: '민트',      bg: '#EDFAF4', bg2: '#DFF5EC', fg: '#0F271E', sub: 'rgba(15,39,30,.60)', accent: '#0E9E74', line: 'rgba(15,39,30,.12)' }
  };

  var BODY_TEMPLATES = [
    '여기서 갈리는 게 결과 차이를 만듭니다.',
    '처음엔 이 한 가지만 기억해도 충분해요.',
    '대부분 이 부분을 놓쳐서 다시 돌아옵니다.',
    '기준을 정해두면 고민할 시간이 줄어요.',
    '작게 시작하고, 잘 되는 것만 늘리면 됩니다.',
    '숫자로 확인할 수 있게 적어두는 게 핵심이에요.'
  ];
  var FALLBACK_POINTS = [
    '지금 확인해야 하는 이유',
    '처음 시작할 때 체크할 3가지',
    '실수 줄이는 가장 쉬운 방법',
    '바로 써먹는 실전 팁',
    '마지막으로 꼭 기억할 것'
  ];

  function font(weight, size) {
    return weight + ' ' + size + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(ctx, text, maxWidth) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    var out = [], line = '', i, test;
    for (i = 0; i < words.length; i++) {
      test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = words[i]; }
      else line = test;
    }
    if (line) out.push(line);
    if (!out.length) out.push('');
    return out;
  }
  function drawLines(ctx, linesArr, x, y, lineHeight, maxLines) {
    var n = Math.min(linesArr.length, maxLines || 99), i;
    for (i = 0; i < n; i++) {
      ctx.fillText(linesArr[i], x, y + i * lineHeight);
      if (i === n - 1 && linesArr.length > n) {
        var last = linesArr[i];
        while (last.length > 1 && ctx.measureText(last + '…').width > ctx.canvas.width - x * 2) last = last.slice(0, -1);
        ctx.fillText(last + '…', x, y + i * lineHeight);
      }
    }
    return y + n * lineHeight;
  }
  function tracked(ctx, text, x, y, gap) {
    var cur = x, i;
    for (i = 0; i < text.length; i++) {
      ctx.fillText(text.charAt(i), cur, y);
      cur += ctx.measureText(text.charAt(i)).width + gap;
    }
  }

  function slidePlan(topic, points, count, handle) {
    var pts = points.length ? points.slice(0, count - 2) : [];
    while (pts.length < count - 2) pts.push(FALLBACK_POINTS[pts.length % FALLBACK_POINTS.length]);
    var slides = [];
    slides.push({
      kind: 'cover',
      kicker: 'CAROUSEL',
      title: topic,
      sub: '끝까지 보면 체크리스트가 됩니다 · 저장해 두세요',
      handle: handle
    });
    for (var i = 0; i < pts.length; i++) {
      slides.push({
        kind: 'body',
        no: i + 1,
        title: pts[i],
        body: BODY_TEMPLATES[(i + Math.floor(Math.random() * BODY_TEMPLATES.length)) % BODY_TEMPLATES.length],
        handle: handle
      });
    }
    slides.push({
      kind: 'cta',
      title: '저장하고\n나중에 다시 보기',
      sub: '도움이 됐다면 저장 · 공유\n궁금한 점은 댓글로 남겨주세요',
      handle: handle
    });
    return slides.map(function (s, i) { s.index = i; s.total = count; return s; });
  }

  function paint(slide, t) {
    var c = document.createElement('canvas');
    c.width = 1080; c.height = 1350;
    var ctx = c.getContext('2d');
    var W = 1080, PAD = 96;

    var g = ctx.createLinearGradient(0, 0, W, 1350);
    g.addColorStop(0, t.bg); g.addColorStop(1, t.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1350);

    // accent glow
    var rg = ctx.createRadialGradient(880, 220, 40, 880, 220, 520);
    rg.addColorStop(0, t.accent + '55');
    rg.addColorStop(1, t.accent + '00');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, 900);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    if (slide.kind === 'cover') {
      ctx.fillStyle = t.accent;
      ctx.font = font(800, 26);
      tracked(ctx, slide.kicker, PAD, PAD + 8, 6);

      ctx.fillStyle = t.fg;
      var size = 92, linesArr;
      do {
        ctx.font = font(800, size);
        linesArr = wrap(ctx, slide.title, W - PAD * 2);
        if (linesArr.length <= 4) break;
        size -= 4;
      } while (size > 52);
      ctx.font = font(500, 36);
      var subLines = wrap(ctx, slide.sub, W - PAD * 2 - 40);
      var titleH = Math.min(linesArr.length, 5) * size * 1.24;
      var blockH = titleH + 40 + Math.min(subLines.length, 3) * 54;
      var y = Math.max(300, Math.min(470, (1350 - blockH) / 2 - 40));

      ctx.font = font(800, size);
      ctx.fillStyle = t.fg;
      drawLines(ctx, linesArr, PAD, y, size * 1.24, 5);

      var after = y + titleH + 34;
      ctx.fillStyle = t.accent; ctx.fillRect(PAD, after, 86, 6);

      ctx.fillStyle = t.sub;
      ctx.font = font(500, 36);
      drawLines(ctx, subLines, PAD, after + 44, 54, 3);

      // bottom
      ctx.fillStyle = t.line; ctx.fillRect(PAD, 1176, W - PAD * 2, 2);
      ctx.fillStyle = t.sub; ctx.font = font(700, 30);
      ctx.fillText(slide.handle || '@my_brand', PAD, 1214);
      ctx.textAlign = 'right';
      ctx.fillText('1 / ' + slide.total, W - PAD, 1214);
      ctx.textAlign = 'left';
    } else if (slide.kind === 'body') {
      ctx.fillStyle = t.accent; ctx.font = font(800, 30);
      ctx.fillText(('0' + (slide.index + 1)).slice(-2) + ' / ' + ('0' + slide.total).slice(-2), PAD, PAD + 6);

      // watermark number
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = t.fg;
      ctx.font = font(800, 420);
      ctx.textAlign = 'right';
      ctx.fillText(('0' + slide.no).slice(-2), W + 40, 860);
      ctx.restore();
      ctx.textAlign = 'left';

      ctx.fillStyle = t.fg;
      var hs = 84, hl;
      do {
        ctx.font = font(800, hs);
        hl = wrap(ctx, slide.title, W - PAD * 2);
        if (hl.length <= 4) break;
        hs -= 3;
      } while (hs > 46);
      ctx.font = font(500, 42);
      var bodyLines = wrap(ctx, slide.body, W - PAD * 2 - 30);
      var blockH2 = Math.min(hl.length, 5) * hs * 1.26 + 40 + Math.min(bodyLines.length, 5) * 58;
      var hy = Math.max(300, Math.min(470, (1350 - blockH2) / 2 - 30));

      ctx.fillStyle = t.accent;
      ctx.fillRect(PAD, hy - 44, 64, 6);

      ctx.font = font(800, hs);
      ctx.fillStyle = t.fg;
      drawLines(ctx, hl, PAD, hy, hs * 1.26, 5);

      var by = hy + Math.min(hl.length, 5) * hs * 1.26 + 40;
      ctx.fillStyle = t.sub;
      ctx.font = font(500, 42);
      drawLines(ctx, bodyLines, PAD, by, 58, 5);

      ctx.fillStyle = t.line; ctx.fillRect(PAD, 1176, W - PAD * 2, 2);
      ctx.fillStyle = t.sub; ctx.font = font(700, 30);
      ctx.fillText(slide.handle || '@my_brand', PAD, 1214);
      ctx.textAlign = 'right';
      ctx.fillText((slide.index + 1) + ' / ' + slide.total, W - PAD, 1214);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = t.accent; ctx.font = font(800, 26);
      tracked(ctx, 'SAVE & SHARE', PAD, PAD + 8, 6);

      ctx.fillStyle = t.fg;
      ctx.font = font(800, 96);
      var cl = wrap(ctx, slide.title.replace(/\n/g, ' '), W - PAD * 2);
      drawLines(ctx, cl, PAD, 470, 118, 3);

      ctx.fillStyle = t.sub; ctx.font = font(500, 38);
      drawLines(ctx, wrap(ctx, slide.sub.replace(/\n/g, ' '), W - PAD * 2 - 60), PAD, 470 + cl.length * 118 + 40, 58, 3);

      ctx.fillStyle = t.accent;
      roundRect(ctx, PAD, 1000, 300, 76, 38); ctx.fill();
      ctx.fillStyle = t.bg;
      ctx.font = font(800, 30);
      ctx.fillText('@' + String(slide.handle || 'my_brand').replace(/^@/, ''), PAD + 40, 1022);
    }
    return c;
  }

  /* caption */
  function captionFor(topic, points, handle) {
    var tags = ['#카드뉴스', '#인스타카드뉴스', '#콘텐츠제작', '#정보공유', '#저장각'];
    var body = '📌 ' + topic + '\n\n' +
      (points.length ? points.slice(0, 4).map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') + '\n\n' : '') +
      '도움이 됐다면 저장 · 공유해 주세요.\n궁금한 점은 댓글로 남겨 주세요 🙌\n\n' +
      tags.join(' ') + (handle ? '\n\n' + handle : '');
    return body;
  }

  App.register({
    id: 'insta', emoji: '📸', name: '인스타 캐러셀 사진 자판기', free: false, tag: '이미지',
    desc: '주제만 넣으면 3~7장 카드뉴스 슬라이드를 1080×1350 PNG로 뽑아줍니다.',
    help: '주제와 핵심 포인트를 넣고 장수를 고르면, 표지·본문·CTA 슬라이드가 자동으로 만들어집니다. 슬라이드마다 PNG로 저장해 인스타에 그대로 올리세요.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent = '.shots{margin-top:2px}.shot .cap button{padding:2px 8px;height:24px;border:1px solid var(--line);border-radius:7px;background:#fff;font-size:10.5px;font-weight:800;color:var(--violet-d)}' +
        '.theme-dots{display:flex;gap:5px;margin-top:6px}.theme-dots i{width:12px;height:12px;border-radius:50%;display:block}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🎞 슬라이드 만들기</h3>' +
            '<div class="field"><label for="in-topic">주제 / 제목 *</label><input id="in-topic" type="text" placeholder="예: 월 3만원으로 시작하는 재테크"></div>' +
            '<div class="field"><label for="in-points">핵심 포인트 <span class="muted small">(한 줄에 하나 · 비워도 자동 생성)</span></label>' +
            '<textarea id="in-points" placeholder="적금 먼저, 투자는 나중&#10;월급의 30%부터&#10;자동이체로 습관 만들기"></textarea></div>' +
            '<div class="row2"><div class="field"><label for="in-count">슬라이드 장수</label><select id="in-count"><option>3</option><option>4</option><option selected>5</option><option>6</option><option>7</option></select></div>' +
            '<div class="field"><label for="in-theme">컬러 테마</label><select id="in-theme">' +
              Object.keys(THEMES).map(function (k) { return '<option value="' + k + '">' + esc(THEMES[k].name) + '</option>'; }).join('') +
            '</select><div class="theme-dots" id="in-dots"></div></div></div>' +
            '<div class="field"><label for="in-handle">계정 핸들</label><input id="in-handle" type="text" placeholder="@my_brand"></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="in-run">카드뉴스 생성</button></div>' +
            '<p class="hint">생성 후 각 슬라이드의 <b>PNG</b>를 눌러 저장하세요. 1080×1350 비율 그대로 저장됩니다.</p>' +
          '</section>' +
          '<section class="panel"><h3>✍️ 인스타 캡션</h3><div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">캡션 + 해시태그</span><button class="btn btn-sm btn-soft" type="button" id="in-capcopy">복사</button></div><div class="cb" id="in-cap">카드뉴스를 만들면 캡션도 함께 만들어집니다.</div></div></section>' +
          '</div>' +
          '<div class="stack"><section class="panel"><h3>🖼 미리보기 <span class="pill" id="in-total">0</span></h3>' +
            '<div class="shots" id="in-shots" style="margin-top:12px"><div class="empty" style="grid-column:1/-1"><b>아직 만든 카드뉴스가 없어요</b>왼쪽에서 주제를 넣고 생성을 눌러주세요.</div></div>' +
            '<div class="actions"><button class="btn btn-soft" type="button" id="in-all">전체 PNG 저장</button>' +
            '<button class="btn btn-ghost" type="button" id="in-again">같은 설정으로 다시 생성</button></div>' +
          '</section></div>' +
        '</div>';

      var el = {
        topic: H.$('#in-topic', root), points: H.$('#in-points', root), count: H.$('#in-count', root),
        theme: H.$('#in-theme', root), handle: H.$('#in-handle', root), shots: H.$('#in-shots', root),
        cap: H.$('#in-cap', root), dots: H.$('#in-dots', root)
      };
      var canvases = [];

      function paintDots() {
        var t = THEMES[el.theme.value];
        el.dots.innerHTML = '<i style="background:' + t.bg + ';border:1px solid #D8D8E2"></i>' +
          '<i style="background:' + t.accent + '"></i><i style="background:' + t.fg + ';border:1px solid #D8D8E2"></i>';
      }

      function generate() {
        var topic = el.topic.value.trim();
        if (!topic) { App.toast('주제를 먼저 입력해 주세요.'); el.topic.focus(); return; }
        var pts = el.points.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        var count = Number(el.count.value) || 5;
        var handle = (el.handle.value.trim() || '@my_brand');
        var t = THEMES[el.theme.value];
        var plan = slidePlan(topic, pts, count, handle);

        canvases = plan.map(function (s) { return paint(s, t); });
        el.shots.innerHTML = '';
        canvases.forEach(function (cv, i) {
          var url = cv.toDataURL('image/png');
          var d = document.createElement('div');
          d.className = 'shot';
          d.innerHTML = '<img src="' + url + '" alt="' + esc((i + 1) + '번째 슬라이드') + '">' +
            '<div class="cap"><span>' + (i + 1) + ' / ' + canvases.length + '</span><button type="button" data-png="' + i + '">PNG</button></div>';
          el.shots.appendChild(d);
        });
        H.$('#in-total', root).textContent = canvases.length;
        el.cap.textContent = captionFor(topic, pts.length ? pts : FALLBACK_POINTS.slice(0, 3), handle);
        App.toast(canvases.length + '장 카드뉴스를 만들었어요. PNG로 저장해 보세요!');
      }

      function saveOne(i) {
        var cv = canvases[i];
        if (!cv) return;
        var a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'carousel-' + (i + 1) + '-' + Date.now().toString(36) + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }

      el.theme.addEventListener('change', paintDots);
      H.$('#in-run', root).addEventListener('click', generate);
      H.$('#in-again', root).addEventListener('click', generate);
      el.shots.addEventListener('click', function (e) {
        var b = e.target.closest('[data-png]');
        if (!b) return;
        saveOne(Number(b.getAttribute('data-png')));
        App.toast('PNG를 저장했어요.');
      });
      H.$('#in-all', root).addEventListener('click', function () {
        if (!canvases.length) { App.toast('먼저 카드뉴스를 생성해 주세요.'); return; }
        var i = 0;
        (function next() {
          if (i >= canvases.length) { App.toast('전체 PNG 저장을 시작했어요. 브라우저가 여러 파일 저장을 물으면 허용해 주세요.'); return; }
          saveOne(i++);
          setTimeout(next, 420);
        })();
      });
      H.$('#in-capcopy', root).addEventListener('click', function () {
        App.copy(el.cap.textContent, this);
      });

      paintDots();
      el.cap.textContent = captionFor('예시: 월 3만원으로 시작하는 재테크', FALLBACK_POINTS.slice(0, 3), '@my_brand');
      el.cap.textContent = '카드뉴스를 만들면 캡션도 함께 만들어집니다.';
    }
  });
})();

/* ---- mod-thread.js ---- */
/* =====================================================================
   Module 3 · 🧵 스레드 대본 자판기
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  var TONES = {
    calm:     { name: '담백하게', flavor: '한 번에 다 바꾸려 하지 않아도 됩니다.', cta: '궁금한 점은 댓글로 남겨주세요.' },
    friendly: { name: '친근하게', flavor: '저도 처음엔 뭐가 뭔지 몰라서 한참 헤맸어요 ㅎㅎ', cta: '같이 고민하는 분들께 도움이 되면 좋겠어요. 댓글 환영!' },
    direct:   { name: '직설적으로', flavor: '결론부터 말하면, 순서 문제입니다.', cta: '의견은 댓글로 주세요.' },
    humor:    { name: '유머러스하게', flavor: '이거 알아보다가 하루 다 쓴 사람 여기 있습니다 🙋', cta: '저만 몰랐던 거면 댓글로 조용히 알려주세요 😅' }
  };

  function tone(key) { return TONES[key] || TONES.calm; }

  function build(topic, target, toneKey, seed) {
    var t = tone(toneKey);
    var tg = target || '요즘 이걸 고민하는 분';
    var flavors = [t.flavor, '기준을 정해두면 고민할 시간이 줄어요.', '작게 시작하고 잘 되는 것만 늘리면 됩니다.', '숫자로 적어두면 판단이 빨라집니다.'];
    var fl = flavors[(seed || 0) % flavors.length];

    var empathy = [
      '👀 ' + topic + ', 저도 똑같이 고민했어요.',
      '',
      tg + H.josa(tg, '이라면', '라면') + ' 한 번쯤 겪어봤을 그 상황.',
      '',
      topic + ' 때문에 이것저것 알아보다 보면',
      '정보는 많은데 뭐가 맞는지 모르겠죠.',
      '',
      '저는 결국 이렇게 정리했습니다.',
      '① 내 상황을 숫자로 적기',
      '② 한 번에 하나만 바꾸기',
      '③ 2주 뒤에 다시 보기',
      '',
      fl,
      '',
      t.cta,
      '',
      '#고민상담 #정보공유 #' + tagOf(topic)
    ].join('\n');

    var twist = [
      '🙃 ' + topic + ', 비싼 게 답인 줄 알았는데 아니었습니다.',
      '',
      '처음엔 "좋은 건 원래 비싼 거지" 싶었어요.',
      '그런데 ' + tg + '에게 필요한 건 가격이 아니라 순서였습니다.',
      '',
      '순서만 바꿔도 체감이 달라지더라고요.',
      '· 먼저 기준 정하기',
      '· 그다음 비교하기',
      '· 마지막에 결정하기',
      '',
      '이 순서가 결론을 바꿉니다.',
      fl,
      '',
      t.cta,
      '',
      '#반전 #정보공유 #' + tagOf(topic)
    ].join('\n');

    var list = [
      '📌 ' + topic + ' 고를 때 꼭 보는 3가지',
      '',
      '1. 기준 — ' + tg + '에게 중요한 게 뭔지 먼저 정하기',
      '2. 조건 — 숨은 비용·기간·해지 조건 확인',
      '3. 후기 — 비슷한 상황의 실제 사용자 3명 이상',
      '',
      '이 셋만 확인하면 실패 확률이 확 줄어요.',
      '저장해두고 비교할 때 꺼내 보세요.',
      '',
      fl,
      '',
      t.cta,
      '',
      '#체크리스트 #정보공유 #' + tagOf(topic)
    ].join('\n');

    var story = [
      '🕒 어제 ' + topic + ' 알아보다가 3시간을 날렸습니다.',
      '',
      '정보가 다 달라서 뭐가 맞는지 모르겠더라고요.',
      '그래서 직접 정리했습니다.',
      '',
      '· 처음엔 광고부터 보지 않기',
      '· 조건표 만들어서 같은 줄에 놓기',
      '· "나중에" 대신 오늘 하나만 결정하기',
      '',
      '이렇게 하니 30분 만에 끝났어요.',
      tg + '에게도 이 순서를 추천합니다.',
      '',
      fl,
      '',
      t.cta,
      '',
      '#썰 #경험담 #' + tagOf(topic)
    ].join('\n');

    return [
      { key: 'empathy', label: '① 공감형', hint: '같은 고민 → 내 해결법', text: empathy },
      { key: 'twist', label: '② 반전형', hint: '통념 부정 → 진짜 이유', text: twist },
      { key: 'list', label: '③ 리스트형', hint: '저장 유도 · 숫자 3개', text: list },
      { key: 'story', label: '④ 썰형', hint: '경험담으로 신뢰 쌓기', text: story }
    ];
  }

  function tagOf(topic) {
    return String(topic || '일상').replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g, '').slice(0, 10) || '일상';
  }

  App.register({
    id: 'thread', emoji: '🧵', name: '스레드 대본 자판기', free: false, tag: '카피',
    desc: '첫 줄 훅부터 댓글 유도까지, 4가지 스타일 스레드 대본을 즉시.',
    help: '주제·타겟·톤을 고르면 공감형·반전형·리스트형·썰형 대본이 한 번에 나옵니다. 글자 수를 보고 그대로 복사해 스레드에 붙여넣으세요.',
    render: function (root) {
      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🧵 대본 조건</h3>' +
            '<div class="field"><label for="th-topic">주제 / 상품 *</label><input id="th-topic" type="text" placeholder="예: 첫 차 구매, 다이어트 식단, 무선청소기"></div>' +
            '<div class="field"><label for="th-target">타겟</label><input id="th-target" type="text" placeholder="예: 사회초년생, 30대 직장인, 육아맘"></div>' +
            '<div class="field"><label for="th-tone">톤</label><select id="th-tone">' +
              Object.keys(TONES).map(function (k) { return '<option value="' + k + '">' + esc(TONES[k].name) + '</option>'; }).join('') +
            '</select></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="th-run">대본 4종 생성</button></div>' +
            '<p class="hint">같은 조건으로 다시 누르면 표현이 조금씩 달라집니다.</p>' +
          '</section>' +
          '<section class="panel"><h3>💡 스레드 팁</h3><div class="graybox">' +
            '· 첫 줄(훅)에서 3초 안에 멈추게 해야 합니다. 숫자·반전·질문이 잘 먹혀요.<br>' +
            '· 한 문단은 1~2줄. 모바일에서 줄바꿈이 곧 가독성입니다.<br>' +
            '· 마지막은 저장·댓글 유도로 닫으면 노출이 늘어납니다.<br>' +
            '· 광고라면 본문 하단에 <b>#광고</b> 표기를 잊지 마세요.' +
          '</div></section></div>' +
          '<div class="stack"><section class="panel"><h3>📄 생성된 대본 <span class="pill" id="th-count">0</span></h3>' +
            '<div class="actions" style="margin-top:10px"><button class="btn btn-soft" type="button" id="th-copyall">4종 전체 복사</button></div>' +
            '<div class="out" id="th-out" style="margin-top:12px"><div class="empty"><b>아직 대본이 없어요</b>주제를 넣고 생성을 눌러주세요.</div></div>' +
          '</section></div>' +
        '</div>';

      var el = { topic: H.$('#th-topic', root), target: H.$('#th-target', root), tone: H.$('#th-tone', root), out: H.$('#th-out', root) };
      var last = [];

      function render() {
        var topic = el.topic.value.trim();
        if (!topic) { App.toast('주제를 먼저 입력해 주세요.'); el.topic.focus(); return; }
        last = build(topic, el.target.value.trim(), el.tone.value, Math.floor(Math.random() * 4));
        H.$('#th-count', root).textContent = last.length;
        el.out.innerHTML = last.map(function (v, i) {
          var len = v.text.replace(/\s/g, '').length;
          return '<div class="cardout"><div class="ch"><span class="t">' + esc(v.label) + '</span>' +
            '<span class="m">' + esc(v.hint) + ' · ' + len + '자</span>' +
            '<button class="btn btn-sm btn-soft" type="button" data-copy-n="' + i + '">복사</button></div>' +
            '<div class="cb scroll">' + esc(v.text) + '</div></div>';
        }).join('');
        App.toast('대본 4종을 만들었어요.');
      }

      el.out.addEventListener('click', function (e) {
        var b = e.target.closest('[data-copy-n]');
        if (!b) return;
        var i = Number(b.getAttribute('data-copy-n'));
        if (last[i]) App.copy(last[i].text, b);
      });
      H.$('#th-run', root).addEventListener('click', render);
      H.$('#th-copyall', root).addEventListener('click', function () {
        if (!last.length) { App.toast('먼저 대본을 생성해 주세요.'); return; }
        var all = last.map(function (v) { return '[' + v.label + ']\n' + v.text; }).join('\n\n────────────\n\n');
        App.copy(all, this, '4종 전체를 복사했어요.');
      });
    }
  });
})();

/* ---- mod-lotto.js ---- */
/* =====================================================================
   Module 4 · 🎱 로또 자판기 (무료)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc;

  function ballColor(n) {
    if (n <= 10) return '#F2B705';
    if (n <= 20) return '#3B7CF6';
    if (n <= 30) return '#E5484D';
    if (n <= 40) return '#6B7280';
    return '#10A36B';
  }
  function ballHtml(n, small) {
    return '<span class="ball' + (small ? ' sm' : '') + '" style="background:' + ballColor(n) + (n <= 10 ? ';color:#3A2A00' : '') + '">' + n + '</span>';
  }
  function parseNums(text) {
    var raw = String(text || '').split(/[^0-9]+/).filter(Boolean);
    var out = [], seen = {};
    raw.forEach(function (r) {
      var n = parseInt(r, 10);
      if (n >= 1 && n <= 45 && !seen[n]) { seen[n] = 1; out.push(n); }
    });
    return out;
  }

  function drawOnce(fixed, excluded, useOdd, useHigh) {
    var taken = {}, pool = [], i, n;
    fixed.concat(excluded).forEach(function (v) { taken[v] = 1; });
    for (i = 1; i <= 45; i++) if (!taken[i]) pool.push(i);

    for (var attempt = 0; attempt < 600; attempt++) {
      var bag = H.shuffle(pool);
      var pick = fixed.slice();
      for (i = 0; i < bag.length && pick.length < 6; i++) pick.push(bag[i]);
      if (pick.length < 6) return null;
      pick.sort(function (a, b) { return a - b; });
      var odd = pick.filter(function (v) { return v % 2 === 1; }).length;
      var low = pick.filter(function (v) { return v <= 22; }).length;
      if (useOdd && (odd < 2 || odd > 4)) continue;
      if (useHigh && (low < 2 || low > 4)) continue;
      return pick;
    }
    return null;
  }

  App.register({
    id: 'lotto', emoji: '🎱', name: '로또 자판기', free: true, tag: '무료 · 재미',
    desc: '1~45 번호 5게임 — 고정수·제외수·홀짝/고저 밸런스까지.',
    help: '고정수와 제외수를 지정하고 홀짝·고저 균형을 켜면 조건에 맞는 5게임을 뽑아줍니다. 뽑은 이력은 이 브라우저에 저장됩니다. 재미용이며 당첨을 보장하지 않습니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent = '.balls{display:flex;gap:7px;flex-wrap:wrap;align-items:center}' +
        '.ball{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:13.5px;font-weight:800;box-shadow:inset 0 -2px 4px rgba(0,0,0,.14)}' +
        '.ball.sm{width:26px;height:26px;font-size:11px}' +
        '.game{display:flex;align-items:center;gap:10px;padding:12px 4px;border-bottom:1px solid var(--line-2)}' +
        '.game:last-child{border-bottom:0}' +
        '.game .no{width:22px;font-size:11.5px;font-weight:800;color:var(--muted)}' +
        '.hist{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:9px;background:#FCFCFE}' +
        '.hist .ht{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted);font-weight:700}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🎱 번호 뽑기</h3>' +
            '<div class="row2"><div class="field"><label for="lo-fixed">고정수 <span class="muted small">(최대 5)</span></label><input id="lo-fixed" type="text" placeholder="예: 7, 21"></div>' +
            '<div class="field"><label for="lo-ex">제외수</label><input id="lo-ex" type="text" placeholder="예: 13, 44"></div></div>' +
            '<div class="field"><label>밸런스 필터</label><div class="chiprow" style="margin-top:0">' +
              '<button class="chip on" type="button" id="lo-odd" aria-pressed="true">홀짝 균형 (2~4)</button>' +
              '<button class="chip on" type="button" id="lo-high" aria-pressed="true">고저 균형 (2~4)</button>' +
            '</div><p class="tip">홀수·짝수, 1~22·23~45 개수가 한쪽으로 몰리지 않게 뽑습니다.</p></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="lo-run">5게임 뽑기</button></div>' +
            '<p class="hint">재미용 번호입니다. 당첨을 보장하지 않아요.</p>' +
          '</section>' +
          '<section class="panel"><h3>📜 최근 이력 <span class="pill" id="lo-hcount">0</span></h3>' +
            '<div class="actions" style="margin-top:10px"><button class="btn btn-ghost btn-sm" type="button" id="lo-clear">이력 전체 삭제</button></div>' +
            '<div id="lo-hist" style="margin-top:10px"></div>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>🎉 이번 추첨 <span class="pill" id="lo-round">—</span></h3>' +
            '<div id="lo-games" style="margin-top:12px"><div class="empty"><b>아직 뽑은 번호가 없어요</b>왼쪽에서 조건을 정하고 5게임 뽑기를 눌러주세요.</div></div>' +
            '<div class="actions"><button class="btn btn-soft" type="button" id="lo-copy">번호 복사</button>' +
            '<button class="btn btn-line" type="button" id="lo-save">이력에 저장</button></div>' +
          '</section></div>' +
        '</div>';

      var el = {
        fixed: H.$('#lo-fixed', root), ex: H.$('#lo-ex', root), odd: H.$('#lo-odd', root), high: H.$('#lo-high', root),
        games: H.$('#lo-games', root), hist: H.$('#lo-hist', root)
      };
      var state = { round: 0, games: [], saved: false };

      function toggle(btn) {
        btn.classList.toggle('on');
        btn.setAttribute('aria-pressed', btn.classList.contains('on') ? 'true' : 'false');
      }
      el.odd.addEventListener('click', function () { toggle(el.odd); });
      el.high.addEventListener('click', function () { toggle(el.high); });

      function renderHist() {
        var hist = S.get('lotto.history', []);
        H.$('#lo-hcount', root).textContent = hist.length;
        if (!hist.length) { el.hist.innerHTML = '<p class="psub">저장된 이력이 없습니다. 뽑은 뒤 <b>이력에 저장</b>을 누르면 여기에 쌓여요.</p>'; return; }
        el.hist.innerHTML = hist.slice(0, 12).map(function (h, idx) {
          return '<div class="hist"><div class="ht"><span>' + esc(h.at) + '</span>' +
            '<button class="btn btn-sm btn-danger right" type="button" data-hdel="' + esc(h.id) + '">삭제</button></div>' +
            h.games.map(function (g) {
              return '<div class="balls" style="margin-top:8px">' + g.map(function (n) { return ballHtml(n, true); }).join('') + '</div>';
            }).join('') + '</div>';
        }).join('');
      }

      function run() {
        var fixed = parseNums(el.fixed.value);
        var excluded = parseNums(el.ex.value);
        if (fixed.length > 5) { App.toast('고정수는 5개까지 가능해요.'); return; }
        var conflict = fixed.filter(function (n) { return excluded.indexOf(n) !== -1; });
        if (conflict.length) { App.toast('고정수와 제외수가 겹칩니다: ' + conflict.join(', ')); return; }
        if (6 - fixed.length > 45 - fixed.length - excluded.length) { App.toast('제외수가 너무 많아 6개를 채울 수 없어요.'); return; }

        var useOdd = el.odd.classList.contains('on');
        var useHigh = el.high.classList.contains('on');
        var games = [], seen = {}, i, g, key, guard;
        for (i = 0; i < 5; i++) {
          g = null;
          for (guard = 0; guard < 40; guard++) {
            g = drawOnce(fixed, excluded, useOdd, useHigh);
            if (!g) break;
            key = g.join('-');
            if (!seen[key]) break;
          }
          if (!g) {
            App.toast('조건이 너무 빡빡해서 5게임을 채우지 못했어요. 고정수·제외수를 줄여보세요.');
            return;
          }
          seen[g.join('-')] = 1;
          games.push(g);
        }
        state.games = games; state.saved = false; state.round++;
        H.$('#lo-round', root).textContent = state.round + '회';
        el.games.innerHTML = games.map(function (g, idx) {
          return '<div class="game"><span class="no">' + (idx + 1) + '</span><div class="balls">' +
            g.map(function (n) { return ballHtml(n); }).join('') + '</div></div>';
        }).join('');
        App.toast('5게임을 뽑았어요!');
      }

      function stamp() { return H.nowStamp(); }

      H.$('#lo-run', root).addEventListener('click', run);

      H.$('#lo-copy', root).addEventListener('click', function () {
        if (!state.games.length) { App.toast('먼저 번호를 뽑아 주세요.'); return; }
        var text = state.games.map(function (g, i) {
          return '[' + (i + 1) + '게임] ' + g.map(function (n) { return (n < 10 ? '0' : '') + n; }).join('  ');
        }).join('\n');
        App.copy(text, this);
      });

      H.$('#lo-save', root).addEventListener('click', function () {
        if (!state.games.length) { App.toast('먼저 번호를 뽑아 주세요.'); return; }
        if (state.saved) { App.toast('이미 저장한 회차예요.'); return; }
        var hist = S.get('lotto.history', []);
        hist.unshift({ id: H.uid('l'), at: stamp(), games: state.games });
        S.set('lotto.history', hist.slice(0, 30));
        state.saved = true;
        renderHist();
        App.toast('이력에 저장했어요.');
      });

      el.hist.addEventListener('click', function (e) {
        var b = e.target.closest('[data-hdel]');
        if (!b) return;
        var id = b.getAttribute('data-hdel');
        S.set('lotto.history', S.get('lotto.history', []).filter(function (h) { return h.id !== id; }));
        renderHist();
        App.toast('이력을 삭제했어요.');
      });

      H.$('#lo-clear', root).addEventListener('click', function () {
        if (!window.confirm('저장된 이력을 모두 지울까요?')) return;
        S.set('lotto.history', []);
        renderHist();
        App.toast('이력을 비웠어요.');
      });

      renderHist();
    }
  });
})();

/* ---- mod-video.js ---- */
/* =====================================================================
   Module 5 · 🎬 AI 영상 만들기  (대본 + 컷별 프롬프트 + 스토리보드)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  var FRAMES = [
    { name: '훅', label: 'HOOK', len: 3, shot: '정면 클로즈업', en: 'extreme close-up of {p} held toward camera, eyes to lens', ko: '제품을 카메라 쪽으로 들고 정면을 바라보는 클로즈업' },
    { name: '문제', label: 'PROBLEM', len: 4, shot: '일상 공간 미디엄샷', en: 'medium shot in a cluttered home, frustrated expression, handheld', ko: '어수선한 집 안, 답답한 표정의 미디엄샷, 핸드헬드' },
    { name: '해결', label: 'SOLUTION', len: 5, shot: '제품 사용 장면', en: 'smooth shot of {p} in use, slow push-in, soft daylight', ko: '제품을 사용하는 장면, 천천히 다가가는 카메라, 부드러운 자연광' },
    { name: '증거', label: 'PROOF', len: 4, shot: '비포·애프터 대비', en: 'split-screen before and after, clean composition, top light', ko: '비포·애프터 분할 화면, 깔끔한 구도, 상단 조명' },
    { name: '반전/포인트', label: 'TWIST', len: 3, shot: '디테일 인서트', en: 'macro insert shot of a product detail, shallow depth of field', ko: '디테일 매크로 인서트, 얕은 심도' },
    { name: 'CTA', label: 'CTA', len: 3, shot: '텍스트 오버레이 엔드카드', en: 'clean end card with space for text overlay, brand color background', ko: '텍스트를 얹을 여백이 있는 엔드카드, 브랜드 컬러 배경' }
  ];

  var SCRIPTS = {
    hook: [
      '{t}, 아직도 이렇게 하고 계세요?',
      '{t} 때문에 시간 버리는 사람만 보면 안타까워서요.',
      '솔직히 {t}, 이거 하나로 정리됩니다.'
    ],
    problem: [
      '매번 같은 자리에서 막히죠. 방법은 많은데 뭐가 맞는지 모르겠고요.',
      '알고 보면 간단한데, 순서를 몰라서 왕복하는 경우가 많습니다.',
      '한 번 잘못 고르면 다시 되돌리기 어렵다는 게 문제입니다.'
    ],
    solution: [
      '그래서 순서를 바꿨습니다. 기준 → 비교 → 결정, 이 세 단계면 끝.',
      '핵심은 {t}를 한 번에 바꾸지 않는 것. 하나씩만 바꿔도 체감이 다릅니다.',
      '이렇게 쓰면 준비 시간이 절반으로 줄어요.'
    ],
    proof: [
      '직접 써보니 차이가 눈에 보였습니다. 전후를 같이 놓고 보면 확실해요.',
      '같은 조건에서 비교해보니 결과가 이렇게 갈렸습니다.',
      '숫자로 보면 더 분명합니다. 걸리는 시간이 줄었어요.'
    ],
    twist: [
      '반전은 여기 있습니다. 비싼 게 답이 아니었어요.',
      '사실 가장 중요한 건 스펙이 아니라 순서였습니다.',
      '이 한 가지를 모르면 나머지는 다 소용없습니다.'
    ],
    cta: [
      '자세한 건 프로필 링크에 정리해뒀어요. 저장해 두고 보세요.',
      '궁금하면 댓글에 "정보" 남겨주세요. 링크 보내드릴게요.',
      '오늘 하나만 바꿔보세요. 다음 영상에서 결과 알려드릴게요.'
    ]
  };

  function fill(tpl, topic) { return String(tpl).replace(/\{t\}/g, topic); }

  function build(topic, productEn, target, cuts) {
    var plan = cuts >= 6 ? FRAMES.slice(0, 6) : FRAMES.slice(0, Math.max(2, cuts - 1)).concat([FRAMES[5]]);
    var total = 0, i;
    for (i = 0; i < plan.length; i++) total += plan[i].len;
    var t = 0;
    return plan.map(function (f, idx) {
      var start = t, end = t + f.len;
      t = end;
      var key = f.label.toLowerCase();
      var line = fill(H.pick(SCRIPTS[key] || SCRIPTS.solution), topic);
      if (f.label === 'CTA' && target) line = target + '께 필요한 정보만 정리해뒀어요. 프로필 링크 확인해 주세요.';
      var subj = productEn || 'the product';
      var en = 'Vertical 9:16 short-form video, ' + f.en.replace(/\{p\}/g, subj) +
        ', natural color grade, shot on 35mm, 4k, no text';
      var ko = f.shot + ' — ' + f.ko;
      return {
        idx: idx + 1, label: f.label, name: f.name, start: start, end: end,
        narration: line, screen: ko, en: en, koPrompt: ko + ', 세로 9:16, 자연광, 시네마틱, 자막 없음'
      };
    });
  }

  App.register({
    id: 'video', emoji: '🎬', name: 'AI 영상 만들기', free: false, tag: '쇼츠·릴스',
    desc: '쇼츠 대본 + 컷별 영문/한글 프롬프트 + 자동 재생 스토리보드.',
    help: '실제 영상 파일은 렌더링하지 않습니다(외부 유료 API 필요). 대신 쇼츠·릴스용 대본, 컷별 영상 생성 프롬프트, 재생 가능한 스토리보드를 즉시 만들어 줍니다.',
    render: function (root) {
      root.innerHTML =
        '<div class="notice" style="margin-bottom:14px">🎬 <div><strong>실제 AI 영상 파일 렌더링은 외부 유료 API가 필요합니다.</strong><br>' +
        '여기서는 <b>쇼츠/릴스 대본 + 컷별 영문/한글 영상 프롬프트 + 자동 재생 슬라이드 스토리보드 미리보기</b>를 즉시 생성합니다. ' +
        '만든 프롬프트를 Runway·Veo·Kling 같은 영상 생성 도구에 붙여넣으면 됩니다.</div></div>' +
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🎥 영상 조건</h3>' +
            '<div class="field"><label for="vd-topic">주제 / 상품 *</label><input id="vd-topic" type="text" placeholder="예: 무선청소기, 다이어트 도시락"></div>' +
            '<div class="field"><label for="vd-en">영문 제품·키워드 <span class="muted small">(프롬프트용, 선택)</span></label><input id="vd-en" type="text" placeholder="예: cordless vacuum cleaner"></div>' +
            '<div class="field"><label for="vd-target">타겟</label><input id="vd-target" type="text" placeholder="예: 30대 맞벌이 부부"></div>' +
            '<div class="row2"><div class="field"><label for="vd-cuts">컷 수</label><select id="vd-cuts"><option>3</option><option>4</option><option selected>5</option><option>6</option></select></div>' +
            '<div class="field"><label>길이</label><div class="graybox" id="vd-len" style="padding:12px 13px">약 20초</div></div></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="vd-run">대본 + 프롬프트 생성</button></div>' +
          '</section>' +
          '<section class="panel"><h3>🧾 촬영 메모</h3><div class="graybox">' +
            '· 세로 9:16 · 20초 내외가 쇼츠·릴스 기본값입니다.<br>' +
            '· 첫 3초에 훅, 마지막 3초에 CTA를 고정하세요.<br>' +
            '· 광고 표기(#광고)는 영상 설명란에 꼭 넣어주세요.<br>' +
            '· 자막은 컷당 12자 이내가 읽기 좋습니다.' +
          '</div></section></div>' +
          '<div class="stack"><section class="panel"><h3>▶ 스토리보드 미리보기</h3>' +
            '<div class="player" id="vd-player" style="margin-top:12px">' +
              '<div class="scr"><span class="no" id="vd-no">CUT 01</span><h4 id="vd-h">대본을 생성하면 여기에서 자동 재생됩니다.</h4><p id="vd-p">컷별 화면·내레이션을 순서대로 넘겨보세요.</p></div>' +
              '<div class="bar"><i id="vd-bar"></i></div>' +
              '<div class="ctrl"><button type="button" id="vd-play">▶ 재생</button>' +
                '<button type="button" id="vd-prev">‹</button><button type="button" id="vd-next">›</button>' +
                '<span class="sp" id="vd-pos">0 / 0</span></div>' +
            '</div>' +
            '<div class="actions"><button class="btn btn-soft" type="button" id="vd-copyall">프롬프트 전체 복사</button></div>' +
          '</section>' +
          '<section class="panel"><h3>🎞 컷별 대본 + 프롬프트</h3><div class="out" id="vd-out" style="margin-top:12px"><div class="empty"><b>아직 만든 영상이 없어요</b>왼쪽에서 조건을 넣고 생성을 눌러주세요.</div></div></section></div>' +
        '</div>';

      var el = { topic: H.$('#vd-topic', root), en: H.$('#vd-en', root), target: H.$('#vd-target', root), cuts: H.$('#vd-cuts', root), out: H.$('#vd-out', root) };
      var state = { cuts: [], i: 0, timer: null, playing: false };

      function draw() {
        var c = state.cuts[state.i];
        if (!c) return;
        H.$('#vd-no', root).textContent = 'CUT ' + H.pad2(c.idx) + ' · ' + c.start + '~' + c.end + '초 · ' + c.name;
        H.$('#vd-h', root).textContent = c.narration;
        H.$('#vd-p', root).textContent = c.screen;
        H.$('#vd-pos', root).textContent = (state.i + 1) + ' / ' + state.cuts.length;
      }
      function stop() {
        state.playing = false;
        if (state.timer) { clearInterval(state.timer); state.timer = null; }
        H.$('#vd-play', root).textContent = '▶ 재생';
        H.$('#vd-bar', root).style.width = '0%';
      }
      function play() {
        if (!state.cuts.length) { App.toast('먼저 대본을 생성해 주세요.'); return; }
        if (state.playing) { stop(); return; }
        state.playing = true;
        H.$('#vd-play', root).textContent = '❚❚ 멈춤';
        var step = 0;
        var per = 600;
        state.timer = setInterval(function () {
          step++;
          var c = state.cuts[state.i];
          if (!c) { stop(); return; }
          var pct = Math.min(100, (step / (c.end - c.start) / (1 / per * 1000) * 100));
          H.$('#vd-bar', root).style.width = pct + '%';
          if (step % Math.round((c.end - c.start) * 1000 / per) === 0) {
            if (state.i < state.cuts.length - 1) { state.i++; step = 0; draw(); H.$('#vd-bar', root).style.width = '0%'; }
            else { stop(); }
          }
        }, per);
      }

      function generate() {
        var topic = el.topic.value.trim();
        if (!topic) { App.toast('주제를 먼저 입력해 주세요.'); el.topic.focus(); return; }
        stop();
        var n = Number(el.cuts.value) || 5;
        state.cuts = build(topic, el.en.value.trim(), el.target.value.trim(), n);
        state.i = 0;
        var total = state.cuts[state.cuts.length - 1].end;
        H.$('#vd-len', root).textContent = '약 ' + total + '초 · ' + n + '컷';
        el.out.innerHTML = state.cuts.map(function (c) {
          return '<div class="cardout"><div class="ch"><span class="t">CUT ' + H.pad2(c.idx) + ' · ' + esc(c.name) + '</span>' +
            '<span class="m">' + c.start + '~' + c.end + '초</span></div>' +
            '<div class="cb"><b>내레이션</b>\n' + esc(c.narration) + '\n\n<b>화면</b>\n' + esc(c.screen) +
            '\n\n<b>EN prompt</b>\n<span class="mono">' + esc(c.en) + '</span>' +
            '\n\n<b>KO prompt</b>\n<span class="mono">' + esc(c.koPrompt) + '</span></div>' +
            '<div class="ch" style="border-top:1px solid var(--line-2);border-bottom:0"><button class="btn btn-sm btn-soft right" type="button" data-vcopy="' + c.idx + '">이 컷 프롬프트 복사</button></div></div>';
        }).join('');
        draw();
        App.toast(n + '컷 스토리보드를 만들었어요.');
      }

      el.out.addEventListener('click', function (e) {
        var b = e.target.closest('[data-vcopy]');
        if (!b) return;
        var idx = Number(b.getAttribute('data-vcopy'));
        var c = state.cuts.filter(function (x) { return x.idx === idx; })[0];
        if (!c) return;
        App.copy('EN: ' + c.en + '\nKO: ' + c.koPrompt, b);
      });

      H.$('#vd-run', root).addEventListener('click', generate);
      H.$('#vd-play', root).addEventListener('click', play);
      H.$('#vd-prev', root).addEventListener('click', function () {
        if (!state.cuts.length) return;
        stop(); state.i = (state.i - 1 + state.cuts.length) % state.cuts.length; draw();
      });
      H.$('#vd-next', root).addEventListener('click', function () {
        if (!state.cuts.length) return;
        stop(); state.i = (state.i + 1) % state.cuts.length; draw();
      });
      H.$('#vd-copyall', root).addEventListener('click', function () {
        if (!state.cuts.length) { App.toast('먼저 대본을 생성해 주세요.'); return; }
        var text = state.cuts.map(function (c) {
          return '[CUT ' + H.pad2(c.idx) + ' · ' + c.start + '~' + c.end + '초]\n내레이션: ' + c.narration + '\nEN: ' + c.en + '\nKO: ' + c.koPrompt;
        }).join('\n\n');
        App.copy(text, this, '컷별 프롬프트를 전체 복사했어요.');
      });
    }
  });
})();

/* ---- mod-cafe.js ---- */
/* =====================================================================
   Module 6 · ☕ 카페 글쓰기 자판기
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  var TYPES = {
    review:   { name: '내돈내산 후기형', hint: '신뢰가 핵심' },
    question: { name: '질문형', hint: '댓글·조회수 유도' },
    info:     { name: '정보공유형', hint: '저장·스크랩 유도' },
    deal:     { name: '핫딜형', hint: '즉시 클릭 유도' }
  };

  var BANNED = [
    { w: '최고', fix: '만족스러웠다' }, { w: '최상', fix: '상태가 좋았다' }, { w: '최저가', fix: '가격이 좋은 곳' },
    { w: '완벽', fix: '흠이 거의 없다' }, { w: '유일', fix: '몇 안 되는' }, { w: '무조건', fix: '대체로' },
    { w: '100%', fix: '대부분' }, { w: '만병통치', fix: '도움이 된다' }, { w: '부작용 없음', fix: '사용감은 개인차' },
    { w: '부작용', fix: '사용 전 확인 필요' }, { w: '효과 보장', fix: '도움을 기대할 수 있다' },
    { w: '특효', fix: '도움이 된다' }, { w: '1위', fix: '많이 쓰는' }, { w: '파격', fix: '할인된' },
    { w: '반값', fix: '할인가' }, { w: '평생', fix: '장기간' }, { w: '전액 환급', fix: '환불 조건 확인' },
    { w: '허위', fix: '' }, { w: '과장', fix: '' }, { w: '사은품 증정', fix: '사은품 제공(조건 확인)' }
  ];

  function checkBanned(text) {
    var found = [];
    BANNED.forEach(function (b) {
      if (text.indexOf(b.w) !== -1) found.push(b);
    });
    return found;
  }

  function priceText(p) {
    var v = String(p || '').trim();
    if (!v) return '가격은 조건에 따라 다름';
    if (/[0-9]/.test(v) && !/원|만|₩/.test(v)) return H.won(v) + '원';
    return v;
  }

  function build(type, topic, price, target, link, nick) {
    var t = topic || '이번에 산 물건';
    var tg = target || '처음 알아보는 분';
    var p = priceText(price);
    var nk = nick || '동네주민';
    var url = link || '(링크 자리 — 카페 규정에 맞게 넣어주세요)';

    var titles = {
      review: [t + ' 한 달 써본 솔직 후기', '내 돈 주고 산 ' + t + ', 살 만했을까?', t + ' 사기 전에 알았으면 좋았을 3가지'],
      question: [t + ' 이거 원래 이런가요?', t + ' 고민인데 조언 부탁드려요', '초보 질문) ' + t + ' 어떻게 고르세요?'],
      info: [t + ' 정리해봤습니다 (조건 비교)', t + ' 초보자 체크리스트', t + ' 고르는 기준 3가지'],
      deal: [t + ' ' + p + ' 올라왔습니다', t + ' 지금 ' + p + ', 조건 정리', t + ' 가격 좋은 곳 찾았습니다']
    };

    var bodies = {
      review: [
        '안녕하세요, ' + nk + '입니다.',
        '',
        t + H.josa(t, '을', '를') + ' 지난달에 직접 돈 주고 샀습니다.',
        '광고가 아니라 제 돈으로 산 후기라서 좋았던 점과 아쉬웠던 점을 같이 적어봅니다.',
        '',
        '■ 좋았던 점',
        '· 생각보다 마감이 깔끔했습니다.',
        '· ' + tg + '에게 필요한 기능은 다 들어 있었습니다.',
        '',
        '■ 아쉬웠던 점',
        '· 배송이 예상보다 하루 늦었습니다.',
        '· 옵션 설명이 조금 부족했습니다.',
        '',
        '정리하면, 저는 만족스러웠습니다. 가격은 ' + p + ' 정도였어요.',
        '자세한 조건은 아래 링크에 있습니다.',
        url
      ].join('\n'),
      question: [
        t + ' 때문에 며칠째 검색만 하고 있습니다.',
        '',
        '상황: ' + tg + ' / 예산: ' + p,
        '',
        '궁금한 점',
        '1. 조건 볼 때 어디를 먼저 봐야 할까요?',
        '2. ' + t + ' 처음 사는 사람이 놓치기 쉬운 부분이 있을까요?',
        '',
        url + ' 이쪽은 봐뒀는데, 다른 곳도 볼 만한 데 있으면 알려주세요.',
        '',
        '답변 주시면 정리해서 다시 올리겠습니다. 감사합니다!'
      ].join('\n'),
      info: [
        t + ' 정리해봤습니다.',
        '',
        '1. 기준 — ' + tg + '에게 중요한 게 무엇인지 먼저 정하기',
        '2. 조건 — 숨은 비용과 기간, 해지 조건까지 확인',
        '3. 확인 — 비슷한 상황의 실제 후기 3개 이상',
        '',
        '가격은 보통 ' + p + ' 선입니다.',
        '참고 링크: ' + url,
        '',
        '도움이 되셨으면 추천 눌러주세요. 틀린 내용은 댓글로 알려주시면 수정하겠습니다.'
      ].join('\n'),
      deal: [
        t + ' 가격 좋은 곳 찾았습니다.',
        '',
        '· 가격: ' + p,
        '· 챙길 것: 사은품·배송비 조건 확인',
        '· 주의: 기간이 짧으니 결제 전에 한 번 더 확인하세요',
        '',
        '링크 → ' + url,
        '',
        '가격은 금방 바뀔 수 있습니다.',
        '',
        '※ 이 글은 제휴(어필리에이트) 링크를 포함하며, 구매 시 소정의 수수료를 받을 수 있습니다.'
      ].join('\n')
    };

    var comments = {
      review: ['읽어주셔서 감사합니다. 궁금한 점은 댓글로 남겨주세요!', '비슷한 제품 쓰신 분 있으면 후기도 같이 공유해 주세요 :)'],
      question: ['경험 있으신 분 답변 부탁드립니다. 채택은 가장 도움 된 댓글로 하겠습니다!', '혹시 같은 고민이셨던 분 계시면 어떻게 결정하셨는지 궁금합니다.'],
      info: ['필요하신 분께 도움이 되었으면 좋겠습니다. 스크랩해두세요!', '추가로 알려주실 정보 있으면 댓글로 남겨주세요. 글에 반영하겠습니다.'],
      deal: ['가격 변동이 있으면 댓글로 알려주세요. 확인하는 대로 업데이트하겠습니다!', '구매하신 분들은 어떤 조건으로 사셨는지 공유해 주시면 좋겠습니다.']
    };

    var tt = titles[type] || titles.info;
    return {
      titles: tt,
      body: bodies[type] || bodies.info,
      comment: (comments[type] || comments.info)[0],
      altComment: (comments[type] || comments.info)[1],
      type: type
    };
  }

  App.register({
    id: 'cafe', emoji: '☕', name: '카페 글쓰기 자판기', free: false, tag: '블로그·카페',
    desc: '네이버 카페 스타일 제목·본문·댓글 유도 + 광고성 금칙어 체크.',
    help: '후기형·질문형·정보공유형·핫딜형 중 고르면 카페에 바로 붙여넣을 수 있는 글을 만들어 줍니다. 제목·본문에 쓴 광고성 금칙어를 자동으로 찾아 대체 표현을 제안합니다.',
    render: function (root) {
      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>☕ 글 종류</h3>' +
            '<div class="chiprow" id="cf-types">' +
              Object.keys(TYPES).map(function (k, i) {
                return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-type="' + k + '">' + esc(TYPES[k].name) + '</button>';
              }).join('') +
            '</div>' +
            '<div class="field"><label for="cf-topic">주제 / 상품 *</label><input id="cf-topic" type="text" placeholder="예: 반려견 자동급식기"></div>' +
            '<div class="row2"><div class="field"><label for="cf-price">가격 / 혜택</label><input id="cf-price" type="text" placeholder="예: 49,000원"></div>' +
            '<div class="field"><label for="cf-target">타겟</label><input id="cf-target" type="text" placeholder="예: 맞벌이 견주"></div></div>' +
            '<div class="field"><label for="cf-link">링크</label><input id="cf-link" type="text" placeholder="https://..."></div>' +
            '<div class="field"><label for="cf-nick">닉네임</label><input id="cf-nick" type="text" placeholder="예: 댕댕이집사"></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="cf-run">글 만들기</button></div>' +
          '</section>' +
          '<section class="panel"><h3>🚨 광고성 금칙어 체크</h3>' +
            '<p class="psub">제목·본문에서 아래 표현이 발견되면 카페 규정상 제재될 수 있어요.</p>' +
            '<div id="cf-banned" style="margin-top:10px"><div class="graybox">아직 검사한 글이 없습니다.</div></div>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>📝 제목 3안</h3><div class="out" id="cf-titles" style="margin-top:10px"><div class="empty"><b>아직 글이 없어요</b>왼쪽에서 조건을 넣고 글 만들기를 눌러주세요.</div></div></section>' +
          '<section class="panel"><h3>📄 본문 <span class="pill" id="cf-len">0자</span></h3>' +
            '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">본문</span><button class="btn btn-sm btn-soft" type="button" id="cf-copybody">복사</button></div>' +
            '<div class="cb scroll" id="cf-body">—</div></div>' +
            '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">댓글 유도 문구</span><button class="btn btn-sm btn-soft" type="button" id="cf-copycmt">복사</button></div>' +
            '<div class="cb" id="cf-cmt">—</div></div>' +
            '<div class="actions"><button class="btn btn-soft" type="button" id="cf-copyall">제목 + 본문 + 댓글 전체 복사</button></div>' +
          '</section></div>' +
        '</div>';

      var el = {
        topic: H.$('#cf-topic', root), price: H.$('#cf-price', root), target: H.$('#cf-target', root),
        link: H.$('#cf-link', root), nick: H.$('#cf-nick', root), body: H.$('#cf-body', root),
        cmt: H.$('#cf-cmt', root), titles: H.$('#cf-titles', root), banned: H.$('#cf-banned', root)
      };
      var type = 'review';
      var result = null;

      H.$('#cf-types', root).addEventListener('click', function (e) {
        var b = e.target.closest('[data-type]');
        if (!b) return;
        type = b.getAttribute('data-type');
        H.$$('#cf-types .chip', root).forEach(function (c) { c.classList.toggle('on', c === b); });
      });

      function generate() {
        var topic = el.topic.value.trim();
        if (!topic) { App.toast('주제를 먼저 입력해 주세요.'); el.topic.focus(); return; }
        result = build(type, topic, el.price.value, el.target.value, el.link.value.trim(), el.nick.value.trim());
        el.titles.innerHTML = result.titles.map(function (t, i) {
          return '<div class="cardout"><div class="ch"><span class="t">제목 ' + (i + 1) + '</span><button class="btn btn-sm btn-soft" type="button" data-title="' + i + '">복사</button></div>' +
            '<div class="cb" style="padding:11px 13px">' + esc(t) + '</div></div>';
        }).join('');
        el.body.textContent = result.body;
        el.cmt.textContent = result.comment + '\n' + result.altComment;
        H.$('#cf-len', root).textContent = result.body.replace(/\s/g, '').length + '자';
        var all = result.titles[0] + '\n' + result.body;
        var found = checkBanned(all);
        el.banned.innerHTML = found.length
          ? '<div class="graybox"><b>발견 ' + found.length + '건</b> — 아래 표현을 바꿔 주세요.</div>' +
            found.map(function (b) {
              return '<div class="rowitem" style="margin-top:8px"><div class="ri">🚨</div><div class="rm"><div class="rt">' + esc(b.w) + '</div>' +
                '<div class="rs">대체 표현: ' + esc(b.fix || '삭제 권장') + '</div></div></div>';
            }).join('')
          : '<div class="graybox" style="color:#158449"><b>금칙어 없음 ✓</b><br>현재 제목·본문에서 광고성 금칙어가 발견되지 않았습니다. 그래도 가격·효과 표현은 사실대로 적어주세요.</div>';
        App.toast('카페 글을 만들었어요.');
      }

      el.titles.addEventListener('click', function (e) {
        var b = e.target.closest('[data-title]');
        if (!b || !result) return;
        App.copy(result.titles[Number(b.getAttribute('data-title'))], b);
      });
      H.$('#cf-copybody', root).addEventListener('click', function () {
        if (!result) { App.toast('먼저 글을 만들어 주세요.'); return; }
        App.copy(result.body, this);
      });
      H.$('#cf-copycmt', root).addEventListener('click', function () {
        if (!result) { App.toast('먼저 글을 만들어 주세요.'); return; }
        App.copy(result.comment + '\n' + result.altComment, this);
      });
      H.$('#cf-copyall', root).addEventListener('click', function () {
        if (!result) { App.toast('먼저 글을 만들어 주세요.'); return; }
        App.copy('[제목]\n' + result.titles[0] + '\n\n[본문]\n' + result.body + '\n\n[댓글 유도]\n' + result.comment + '\n' + result.altComment, this);
      });
      H.$('#cf-run', root).addEventListener('click', generate);
    }
  });
})();

/* ---- mod-cheat.js ---- */
/* =====================================================================
   Module 7 · 🥷 광고 컨닝페이퍼
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc;

  var PURPOSES = ['CPA', '로컬매장', '커머스', '앱설치'];
  var KINDS = ['헤드라인', '공식', 'CTA'];

  var LIB = [
    /* ---------- CPA ---------- */
    { p: 'CPA', k: '헤드라인', t: '3분이면 끝, ○○ 신청하고 혜택 확인', n: '숫자로 진입장벽을 낮춥니다. "3분"은 가장 잘 먹히는 시간 약속입니다.' },
    { p: 'CPA', k: '헤드라인', t: '○○ 때문에 고민이라면, 30초만 읽어보세요', n: '문제를 먼저 짚고 시간을 약속하면 이탈이 줄어듭니다.' },
    { p: 'CPA', k: '헤드라인', t: '안 해봤으면 모르는 ○○, 결과부터 보여드립니다', n: '결과 선제시형. 증거(수치·후기)가 뒤에 있어야 합니다.' },
    { p: 'CPA', k: '헤드라인', t: '월 3만원으로 시작하는 ○○', n: '가격을 구체적인 숫자로. 조건(약정·기간)은 본문에 명시.' },
    { p: 'CPA', k: '공식', t: 'PAS — 문제(Pain) → 확대(Agitate) → 해결(Solution)', n: '가장 범용적인 리드 광고 공식. 문제를 3문장으로 확대한 뒤 해결책을 제시.' },
    { p: 'CPA', k: '공식', t: 'BAB — Before(현재) → After(이후) → Bridge(방법)', n: '상태 변화를 보여줄 때 강합니다. Before를 구체적으로 그릴수록 After가 선명해집니다.' },
    { p: 'CPA', k: '공식', t: '4U — Useful · Urgent · Unique · Ultra-specific', n: '헤드라인 4요소 체크. 3개 이상이면 통과, 2개 이하면 다시 쓰세요.' },
    { p: 'CPA', k: 'CTA', t: '무료로 진단받기', n: '"무료"는 가장 강력한 진입 장벽 제거 장치입니다. 조건을 함께 적으세요.' },
    { p: 'CPA', k: 'CTA', t: '1분 만에 확인하기', n: '짧은 시간 약속 + 즉시성. 버튼 문구로도 좋습니다.' },
    { p: 'CPA', k: 'CTA', t: '카톡으로 상담 신청', n: '채널을 명시하면 심리적 거리가 줄어듭니다.' },

    /* ---------- 로컬매장 ---------- */
    { p: '로컬매장', k: '헤드라인', t: '{지역}에서 {업종} 찾는다면? 이번 주 예약 가능', n: '지역명을 앞에 두면 동네 검색에서 잡힙니다.' },
    { p: '로컬매장', k: '헤드라인', t: '도보 5분, {지역} 주민만 아는 {업종}', n: '거리 + 희소성. "주민만 아는"은 소구력이 큽니다.' },
    { p: '로컬매장', k: '헤드라인', t: '주차 걱정 없는 {업종}, {지역}역 2번 출구', n: '로컬 매장의 3대 불안: 주차·위치·가격. 그중 하나를 없애 주세요.' },
    { p: '로컬매장', k: '헤드라인', t: '사장님이 직접 만드는 {메뉴}, 하루 20개 한정', n: '한정 수량·직접 제조는 신선함과 희소성을 함께 전달합니다.' },
    { p: '로컬매장', k: '공식', t: '지역명 + 목적 + 즉시 혜택', n: '예: "망원동에서 회식 장소? 오늘 예약 시 1인 5천원 할인".' },
    { p: '로컬매장', k: '공식', t: '동선 기반 — 어디서 → 몇 분 → 무엇', n: '지도 앱과 함께 쓸 때 효과적. 역 출구·주차 위치까지 적습니다.' },
    { p: '로컬매장', k: '공식', t: '희소성 — 시간·수량·예약 단위', n: '"오늘 3팀", "주말 2자리"처럼 실제로 확인 가능한 숫자만 쓰세요.' },
    { p: '로컬매장', k: 'CTA', t: '네이버 예약하기', n: '플랫폼명을 버튼에 넣으면 신뢰와 익숙함이 붙습니다.' },
    { p: '로컬매장', k: 'CTA', t: '전화 한 통으로 예약', n: '전화 선호 고객층(40대 이상)에 확실히 먹힙니다.' },
    { p: '로컬매장', k: 'CTA', t: '오늘 방문 가능 여부 확인', n: '문의 부담을 낮추는 질문형 CTA.' },

    /* ---------- 커머스 ---------- */
    { p: '커머스', k: '헤드라인', t: '한 달 써보고 남은 후기 — {제품}', n: '경험 기간을 밝히면 신뢰가 올라갑니다.' },
    { p: '커머스', k: '헤드라인', t: '설치 필요 없이 5분이면 끝', n: '사용 장면을 시간으로 환산하면 상상이 쉬워집니다.' },
    { p: '커머스', k: '헤드라인', t: '교환·환불 조건까지 투명하게', n: '구매 불안을 먼저 없애는 헤드라인. 상세페이지 이탈 방지.' },
    { p: '커머스', k: '헤드라인', t: '{타겟}이 가장 많이 찾는 {카테고리}', n: '"1위" 같은 최상급 표현은 근거가 없으면 쓰지 마세요.' },
    { p: '커머스', k: '공식', t: 'FAB — 기능(Feature) → 이점(Benefit) → 혜택(Advantage)', n: '스펙 나열에서 멈추지 말고 "그래서 나에게 뭐가 좋은지"까지.' },
    { p: '커머스', k: '공식', t: '문제 → 해결 → 증거(후기) → CTA', n: '상세페이지 기본 구조. 증거에는 사진·수치·실사용 후기를 넣으세요.' },
    { p: '커머스', k: '공식', t: '숫자 3개 — 가격 · 기간 · 수량', n: '구매 판단에 필요한 숫자를 3개로 정리하면 망설임이 줄어듭니다.' },
    { p: '커머스', k: 'CTA', t: '장바구니 담기', n: '구매보다 부담이 낮은 1차 행동.' },
    { p: '커머스', k: 'CTA', t: '재고 확인하기', n: '희소성과 궁금증을 동시에 자극합니다.' },
    { p: '커머스', k: 'CTA', t: '실사용 후기 보러 가기', n: '후기 수는 실제로 있을 때만 숫자로 적으세요.' },

    /* ---------- 앱설치 ---------- */
    { p: '앱설치', k: '헤드라인', t: '설치 10초, 하루 3분이면 끝', n: '설치 허들·사용 시간을 동시에 낮춥니다.' },
    { p: '앱설치', k: '헤드라인', t: '출석만 해도 쌓이는 ○○', n: '즉시 보상형. 보상의 실제 조건을 함께 적어주세요.' },
    { p: '앱설치', k: '헤드라인', t: '가입 없이 둘러보기 → 마음에 들면 설치', n: '2단계 허들 낮추기. 이탈 많은 앱 광고에 특히 효과적.' },
    { p: '앱설치', k: '헤드라인', t: '지금 설치하면 첫 달 프리미엄', n: '기간 한정 혜택은 종료 시점을 명확히.' },
    { p: '앱설치', k: '공식', t: '3초 룰 — 첫 화면에서 가치를 보여주기', n: '스토어 스크린샷 첫 장이 설치율을 좌우합니다.' },
    { p: '앱설치', k: '공식', t: '행동 2단계 — 둘러보기 → 설치', n: '한 번에 설치를 요구하지 말고 작은 행동부터.' },
    { p: '앱설치', k: '공식', t: '보상 즉시성 — 설치 후 바로 체감', n: '보상이 늦으면 삭제율이 올라갑니다.' },
    { p: '앱설치', k: 'CTA', t: '앱에서 계속하기', n: '웹에서 앱으로 자연스럽게 넘기는 문구.' },
    { p: '앱설치', k: 'CTA', t: '10초 만에 설치', n: '시간을 숫자로 보여주는 설치 CTA.' },
    { p: '앱설치', k: 'CTA', t: '무료로 시작하기', n: '가장 무난하고 전환율이 안정적인 기본 CTA.' }
  ];

  App.register({
    id: 'cheat', emoji: '🥷', name: '광고 컨닝페이퍼', free: false, tag: '카피 사전',
    desc: '업종·목적별 후킹 헤드라인·카피 공식·CTA — 검색하고 바로 복사.',
    help: 'CPA·로컬매장·커머스·앱설치 목적별로 검증된 헤드라인, 카피 공식, CTA 문구를 모았습니다. 검색·필터 후 복사하고, 나만의 문구를 추가해 저장할 수 있습니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent = '.cheatgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:12px;margin-top:14px}' +
        '.cheat{border:1px solid var(--line);border-radius:14px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:8px}' +
        '.cheat .tags{display:flex;gap:5px;flex-wrap:wrap}' +
        '.cheat .txt{font-size:13.5px;font-weight:800;letter-spacing:-.02em;line-height:1.5;word-break:keep-all}' +
        '.cheat .note{font-size:11.5px;color:var(--sub);line-height:1.6;flex:1;word-break:keep-all}' +
        '.cheat .row{display:flex;gap:6px;align-items:center}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols wide"><div class="stack">' +
          '<section class="panel"><h3>🔍 문구 찾기</h3>' +
            '<div class="row2" style="margin-top:10px"><div class="field" style="margin-top:0"><label for="ch-q">검색</label><input id="ch-q" type="text" placeholder="예: 지역, 후기, 3분, CTA"></div>' +
            '<div class="field" style="margin-top:0"><label>종류</label><div class="chiprow" id="ch-kinds" style="margin-top:0">' +
              '<button class="chip on" type="button" data-kind="전체">전체</button>' +
              KINDS.map(function (k) { return '<button class="chip" type="button" data-kind="' + k + '">' + k + '</button>'; }).join('') +
            '</div></div></div>' +
            '<div class="chiprow" id="ch-purposes" style="margin-top:12px">' +
              '<button class="chip on" type="button" data-purpose="전체">전체 목적</button>' +
              PURPOSES.map(function (p) { return '<button class="chip" type="button" data-purpose="' + p + '">' + p + '</button>'; }).join('') +
            '</div>' +
            '<p class="hint" id="ch-count"></p>' +
          '</section>' +
          '<section class="panel"><h3>➕ 나만의 문구 추가</h3>' +
            '<div class="field"><label for="ch-new">문구 *</label><input id="ch-new" type="text" placeholder="예: 이번 주말, 가족과 함께"></div>' +
            '<div class="row2"><div class="field"><label for="ch-newp">목적</label><select id="ch-newp">' + PURPOSES.map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label for="ch-newk">종류</label><select id="ch-newk">' + KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div></div>' +
            '<div class="field"><label for="ch-newn">메모</label><input id="ch-newn" type="text" placeholder="어떨 때 쓰는 문구인지"></div>' +
            '<div class="actions"><button class="btn btn-primary" type="button" id="ch-add">저장하기</button>' +
            '<button class="btn btn-ghost" type="button" id="ch-reset">내 문구 전체 삭제</button></div>' +
          '</section>' +
          '<div id="ch-grid" class="cheatgrid"></div>' +
        '</div></div>';

      var el = { q: H.$('#ch-q', root), grid: H.$('#ch-grid', root) };
      var filter = { purpose: '전체', kind: '전체' };

      function mine() { return S.get('cheat.mine', []); }

      function all() {
        return LIB.map(function (x, i) { return { id: 'lib' + i, p: x.p, k: x.k, t: x.t, n: x.n, lib: true }; })
          .concat(mine().map(function (x) { return { id: x.id, p: x.p, k: x.k, t: x.t, n: x.n, lib: false }; }));
      }

      function render() {
        var q = el.q.value.trim().toLowerCase();
        var list = all().filter(function (x) {
          if (filter.purpose !== '전체' && x.p !== filter.purpose) return false;
          if (filter.kind !== '전체' && x.k !== filter.kind) return false;
          if (q && (x.t + ' ' + x.n + ' ' + x.p).toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        H.$('#ch-count', root).textContent = list.length + '개 문구 · 복사해서 바로 쓰세요.';
        if (!list.length) { el.grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><b>조건에 맞는 문구가 없어요</b>검색어나 필터를 바꿔보세요.</div>'; return; }
        el.grid.innerHTML = list.map(function (x) {
          return '<div class="cheat"><div class="tags"><span class="tag">' + esc(x.p) + '</span><span class="tag"' + (x.k === 'CTA' ? ' style="background:#F1ECFF;color:#4C24D6"' : '') + '>' + esc(x.k) + '</span>' +
            (x.lib ? '' : '<span class="tag ok">내 문구</span>') + '</div>' +
            '<div class="txt">' + esc(x.t) + '</div><div class="note">' + esc(x.n || '') + '</div>' +
            '<div class="row"><button class="btn btn-sm btn-soft" type="button" data-cheatcopy="' + esc(x.id) + '">복사</button>' +
            (x.lib ? '' : '<button class="btn btn-sm btn-danger" type="button" data-cheatdel="' + esc(x.id) + '">삭제</button>') + '</div></div>';
        }).join('');
      }

      el.q.addEventListener('input', render);

      H.$('#ch-purposes', root).addEventListener('click', function (e) {
        var b = e.target.closest('[data-purpose]');
        if (!b) return;
        filter.purpose = b.getAttribute('data-purpose');
        H.$$('#ch-purposes .chip', root).forEach(function (c) { c.classList.toggle('on', c === b); });
        render();
      });
      H.$('#ch-kinds', root).addEventListener('click', function (e) {
        var b = e.target.closest('[data-kind]');
        if (!b) return;
        filter.kind = b.getAttribute('data-kind');
        H.$$('#ch-kinds .chip', root).forEach(function (c) { c.classList.toggle('on', c === b); });
        render();
      });

      el.grid.addEventListener('click', function (e) {
        var cp = e.target.closest('[data-cheatcopy]');
        if (cp) {
          var id = cp.getAttribute('data-cheatcopy');
          var item = all().filter(function (x) { return x.id === id; })[0];
          if (item) App.copy(item.t, cp);
          return;
        }
        var del = e.target.closest('[data-cheatdel]');
        if (del) {
          var did = del.getAttribute('data-cheatdel');
          S.set('cheat.mine', mine().filter(function (x) { return x.id !== did; }));
          render();
          App.toast('내 문구를 삭제했어요.');
        }
      });

      H.$('#ch-add', root).addEventListener('click', function () {
        var t = H.$('#ch-new', root).value.trim();
        if (!t) { App.toast('문구를 입력해 주세요.'); H.$('#ch-new', root).focus(); return; }
        var list = mine();
        list.unshift({ id: H.uid('c'), p: H.$('#ch-newp', root).value, k: H.$('#ch-newk', root).value, t: t, n: H.$('#ch-newn', root).value.trim() });
        S.set('cheat.mine', list);
        H.$('#ch-new', root).value = ''; H.$('#ch-newn', root).value = '';
        render();
        App.toast('내 문구로 저장했어요.');
      });

      H.$('#ch-reset', root).addEventListener('click', function () {
        if (!mine().length) { App.toast('저장한 문구가 없어요.'); return; }
        if (!window.confirm('내가 추가한 문구를 모두 지울까요?')) return;
        S.set('cheat.mine', []);
        render();
        App.toast('내 문구를 비웠어요.');
      });

      render();
    }
  });
})();

/* ---- mod-analyze.js ---- */
/* =====================================================================
   Module 8 · 🔍 사이트 분석하기 (무료)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  var CTA_WORDS = ['신청', '구매', '예약', '상담', '문의', '시작', '다운로드', '확인', '클릭', '가입', '장바구니', '전화', '방문', '체험', '무료', '결제', '신청하기', '예약하기'];
  var TRUST_WORDS = ['후기', '리뷰', '별점', '인증', '보증', '환불', '교환', '고객', '수상', '언론', '안전', '보안', '누적', '만족', 'A/S', 'AS', '책임', '보험', '전문가', '실사용'];
  var BENEFIT_WORDS = ['무료', '할인', '최대', '혜택', '지금', '오늘', '분', '초', '방법', '체크', '후기', '비교', '정리', '가이드'];
  var URGENCY = ['지금', '오늘', '한정', '마감', '마지막', '선착', '이번 주', '당일'];

  function countWords(text, words) {
    var n = 0, hits = [];
    words.forEach(function (w) {
      if (text.indexOf(w) !== -1) { n++; hits.push(w); }
    });
    return { n: n, hits: hits };
  }

  function analyze(raw) {
    var text = String(raw || '').replace(/\r/g, '');
    var trimmed = text.trim();
    var chars = trimmed.replace(/\s/g, '').length;
    var linesArr = trimmed.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var sentences = trimmed.split(/[.!?。！？\n]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; });
    var avg = sentences.length ? Math.round(sentences.reduce(function (a, s) { return a + s.length; }, 0) / sentences.length) : 0;
    var longParas = linesArr.filter(function (l) { return l.length > 220; }).length;
    var headline = linesArr[0] || '';
    if (headline.length > 80) {
      var firstSentence = trimmed.split(/[.!?。！？\n]/)[0].trim();
      if (firstSentence.length >= 6) headline = firstSentence;
    }
    var firstChunk = trimmed.slice(0, 300);

    var cta = countWords(trimmed, CTA_WORDS);
    var trust = countWords(trimmed, TRUST_WORDS);
    var benefit = countWords(headline, BENEFIT_WORDS);
    var urgency = countWords(trimmed, URGENCY);
    var digits = (trimmed.match(/[0-9]/g) || []).length;

    var good = [], improve = [];

    /* 헤드라인 */
    var hScore = 8;
    if (headline.length >= 8 && headline.length <= 40) { hScore += 6; good.push('첫 줄이 ' + headline.length + '자로, 한눈에 읽히는 길이입니다.'); }
    else if (headline.length < 8) improve.push('첫 줄이 너무 짧습니다(' + headline.length + '자). "누구에게 · 무엇을 · 왜"가 들어간 12~30자 헤드라인으로 바꿔보세요.');
    else improve.push('첫 줄이 ' + headline.length + '자로 깁니다. 30자 안쪽으로 줄이고 부연은 아래로 내리세요.');
    if (digits > 0) { hScore += 4; good.push('숫자가 포함되어 구체적으로 읽힙니다.'); }
    else improve.push('숫자를 하나 넣어보세요. "3분", "월 3만원", "후기 300개" 같은 숫자는 신뢰를 만듭니다.');
    if (benefit.n > 0) { hScore += 4; good.push('헤드라인에 혜택/시간 표현(' + benefit.hits.slice(0, 3).join(', ') + ')이 있습니다.'); }
    else improve.push('헤드라인에 혜택 단어(무료·할인·최대·지금·3분 등)를 넣으면 클릭률이 올라갑니다.');
    if (avg > 0 && avg <= 45) hScore += 3;
    hScore = H.clamp(hScore, 0, 25);

    /* CTA */
    var cScore = 3;
    cScore += Math.min(13, cta.n * 3);
    if (cta.n === 0) improve.push('행동 유도(CTA) 문구를 찾지 못했습니다. "무료로 진단받기" 같은 버튼 문구를 화면 안에 2개 이상 배치하세요.');
    else if (cta.n <= 2) improve.push('CTA 표현이 ' + cta.n + '종류뿐입니다. 주 CTA 1개 + 보조 CTA 1개(예: 상담·자료 받기)를 두세요.');
    else good.push('CTA 표현이 ' + cta.n + '종류(' + cta.hits.slice(0, 4).join(', ') + ')로 충분합니다.');
    if (countWords(firstChunk, CTA_WORDS).n > 0) { cScore += 4; good.push('첫 화면 안에 CTA가 있어 바로 행동할 수 있습니다.'); }
    else improve.push('첫 화면(스크롤 전)에 CTA가 없습니다. 첫 화면에 주 버튼 하나는 꼭 두세요.');
    if (urgency.n > 0) { cScore += 5; good.push('즉시성을 주는 표현(' + urgency.hits.slice(0, 3).join(', ') + ')이 있습니다.'); }
    else improve.push('즉시성 표현(오늘·한정·마감)을 하나 넣으면 미루는 비율이 줄어듭니다.');
    cScore = H.clamp(cScore, 0, 25);

    /* 신뢰 */
    var tScore = 4 + Math.min(15, trust.n * 3);
    if (trust.n === 0) improve.push('신뢰 요소(후기·별점·인증·환불·A/S)가 보이지 않습니다. 실제 후기 3개와 환불 조건을 넣으세요.');
    else if (trust.n <= 2) improve.push('신뢰 요소가 ' + trust.n + '종류(' + trust.hits.join(', ') + ')입니다. 후기 수·재구매율 같은 숫자를 더하면 설득력이 커집니다.');
    else { tScore += 6; good.push('신뢰 요소가 ' + trust.n + '종류(' + trust.hits.slice(0, 4).join(', ') + ')로 잘 갖춰져 있습니다.'); }
    tScore = H.clamp(tScore, 0, 25);

    /* 가독성 */
    var rScore = 25;
    if (chars < 160) { rScore -= 6; improve.push('분석할 본문이 ' + chars + '자로 적습니다. 실제 랜딩페이지 본문을 더 붙여넣으면 정확해집니다.'); }
    if (avg > 60) { rScore -= 8; improve.push('평균 문장 길이가 ' + avg + '자로 깁니다. 35자 안쪽으로 끊으면 모바일에서 읽기 쉬워집니다.'); }
    else if (avg > 45) { rScore -= 4; improve.push('평균 문장이 ' + avg + '자입니다. 조금만 더 짧게 끊어보세요(권장 35자 이내).'); }
    else if (avg > 0) good.push('평균 문장 길이 ' + avg + '자로 모바일 가독성이 좋습니다.');
    if (longParas > 0) { rScore -= Math.min(8, longParas * 3); improve.push('220자를 넘는 긴 문단이 ' + longParas + '개 있습니다. 3~4줄마다 줄바꿈하세요.'); }
    if (linesArr.length > 0 && linesArr.length <= 2 && chars > 400) { rScore -= 4; improve.push('문단 구분이 거의 없습니다. 소제목과 줄바꿈으로 덩어리를 나누세요.'); }
    if (chars > 1200 && !/■|▶|·|•|- /.test(trimmed)) { rScore -= 3; improve.push('목록·구분 기호가 없습니다. 혜택은 불릿으로 정리하면 스캔이 빨라집니다.'); }
    rScore = H.clamp(rScore, 0, 25);

    var total = hScore + cScore + tScore + rScore;
    var grade = total >= 85 ? '아주 좋아요 — 바로 집행해도 됩니다' :
      total >= 70 ? '탄탄해요 — 한두 곳만 다듬으면 완성' :
      total >= 55 ? '괜찮지만 보완이 필요해요' :
      total >= 40 ? '손볼 곳이 많아요' : '기본 구조부터 다시 잡아야 해요';

    return {
      total: total, grade: grade,
      parts: [
        { label: '헤드라인', score: hScore }, { label: 'CTA', score: cScore },
        { label: '신뢰 요소', score: tScore }, { label: '가독성', score: rScore }
      ],
      good: good, improve: improve,
      stats: { chars: chars, sentences: sentences.length, avg: avg, lines: linesArr.length, cta: cta.n, trust: trust.n }
    };
  }

  App.register({
    id: 'analyze', emoji: '🔍', name: '사이트 분석하기', free: true, tag: '무료 · 진단',
    desc: '랜딩페이지 카피를 점수화하고 개선점을 바로 제안합니다.',
    help: '브라우저 보안(CORS) 때문에 남의 사이트를 자동으로 읽을 수는 없습니다. 랜딩페이지 본문을 붙여넣으면 헤드라인·CTA·신뢰요소·가독성을 100점으로 점수화하고 개선점을 제안합니다. URL 직접 분석은 김호퍼에게 요청 문구를 복사해 맡기세요.',
    render: function (root) {
      root.innerHTML =
        '<div class="notice" style="margin-bottom:14px">🔍 <div><strong>정적 페이지의 CORS 제약을 먼저 알려드려요.</strong><br>' +
        '이 페이지는 브라우저에서만 돌아가기 때문에, 다른 사이트의 HTML을 직접 가져와 읽을 수 없습니다(브라우저 보안 정책). ' +
        '그래서 <b>(a) 본문을 붙여넣으면 즉시 분석</b>하고, <b>(b) URL을 김호퍼에게 넘겨 실제 페이지 분석을 요청</b>하는 두 가지 길을 드립니다.</div></div>' +
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>a) 즉시 분석</h3>' +
            '<div class="field"><label for="an-url">랜딩페이지 URL <span class="muted small">(기록용)</span></label><input id="an-url" type="text" placeholder="https://..."></div>' +
            '<div class="field"><label for="an-text">본문 / 카피 붙여넣기 *</label><textarea id="an-text" style="min-height:200px" placeholder="페이지의 제목, 첫 문단, 버튼 문구, 후기 등을 그대로 복사해 붙여넣으세요."></textarea></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="an-run">지금 분석하기</button></div>' +
            '<p class="hint">헤드라인 · CTA · 신뢰 요소 · 모바일 가독성 4개 항목을 각 25점으로 채점합니다.</p>' +
            '<div class="field" style="margin-top:16px"><label>샘플로 해보기</label>' +
            '<div class="chiprow" style="margin-top:0"><button class="chip" type="button" data-sample="bad">개선 필요한 예시</button>' +
            '<button class="chip" type="button" data-sample="good">잘 만든 예시</button></div></div>' +
          '</section>' +
          '<section class="panel"><h3>b) 김호퍼에게 URL 직접 분석 맡기기</h3>' +
            '<p class="psub">김호퍼는 실제로 페이지를 열어 첫 화면 구성·버튼 위치·모바일 화면까지 볼 수 있습니다. 아래 요청 문구를 복사해 채팅에 붙여넣으세요.</p>' +
            '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">요청 문구</span><button class="btn btn-sm btn-soft" type="button" id="an-copyreq">복사</button></div>' +
            '<div class="cb mono" id="an-req" style="max-height:230px;overflow:auto"></div></div>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>📊 분석 결과</h3>' +
            '<div id="an-result" style="margin-top:12px"><div class="empty"><b>아직 분석한 페이지가 없어요</b>왼쪽에 본문을 붙여넣고 분석을 눌러주세요.</div></div>' +
          '</section></div>' +
        '</div>';

      var el = { url: H.$('#an-url', root), text: H.$('#an-text', root), res: H.$('#an-result', root), req: H.$('#an-req', root) };

      function requestText() {
        var url = el.url.value.trim() || '(URL을 입력하세요)';
        return '김호퍼, 아래 사이트를 직접 열어서 광고 관점으로 분석해줘.\n\n' +
          'URL: ' + url + '\n\n' +
          '보고 싶은 것\n' +
          '1. 첫 화면에서 3초 안에 "무엇을 파는지" 이해되는가 — 헤드라인·서브카피\n' +
          '2. CTA는 몇 개이고, 가장 눈에 띄는 것은 무엇인가\n' +
          '3. 신뢰 요소(후기·인증·환불·수치)가 충분한가\n' +
          '4. 모바일 화면에서 읽기 편한가 — 줄 길이·여백·폰트\n' +
          '5. 개선 우선순위 3가지 + 바로 바꿀 수 있는 카피 예시\n\n' +
          '가능하면 실제 화면 스크린샷도 같이 보여줘.';
      }

      function renderReq() { el.req.textContent = requestText(); }

      var SAMPLES = {
        bad: '좋은 제품입니다. 저희는 오래전부터 좋은 물건을 만들기 위해 노력해왔으며 많은 고객님들께 사랑을 받고 있습니다. 품질은 물론 디자인까지 뛰어나며 가격 또한 합리적입니다. 자세한 내용은 홈페이지를 참고해 주시기 바랍니다. 문의는 게시판을 이용해 주세요. 감사합니다.',
        good: '하루 3분, 허리 통증 관리 루틴\n\n· 30일 사용 후기 1,200개 · 평균 4.8점\n· 첫 달 무료 체험 · 언제든 해지\n· 물리치료사 3인이 설계한 12가지 동작\n\n지금 무료로 시작하기 →\n결제 없이 7일 동안 사용해 보세요. 오늘 가입 시 1:1 자세 코칭을 함께 드립니다.\n\n"허리 때문에 병원만 다녔는데, 3주 만에 앉아있는 시간이 편해졌어요." — 김○○님 후기'
      };

      H.$('#an-run', root).addEventListener('click', function () {
        var text = el.text.value;
        if (!text.trim()) { App.toast('분석할 본문을 먼저 붙여넣어 주세요.'); el.text.focus(); return; }
        var r = analyze(text);
        var parts = r.parts.map(function (p) {
          return '<div class="mrow"><span class="lb">' + p.label + '</span><div class="meter"><i style="width:' + (p.score / 25 * 100) + '%"></i></div><span class="vl">' + p.score + '</span></div>';
        }).join('');
        el.res.innerHTML =
          '<div class="score"><div class="num">' + r.total + '<small>/100</small></div><div class="grade">' + esc(r.grade) + '</div></div>' +
          '<div style="margin-top:14px">' + parts + '</div>' +
          '<div class="sep"></div>' +
          '<div class="kv"><b>글자 수</b><span>' + r.stats.chars + '자 · 문장 ' + r.stats.sentences + '개 · 평균 ' + r.stats.avg + '자</span></div>' +
          '<div class="kv"><b>CTA 후보</b><span>' + r.stats.cta + '종 · 신뢰 요소 ' + r.stats.trust + '종</span></div>' +
          '<div class="sep"></div>' +
          '<h3 style="font-size:13.5px">✓ 잘한 점</h3>' +
          '<ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;line-height:1.8;color:#3A3A44">' +
            (r.good.length ? r.good.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') : '<li class="muted">뚜렷한 강점이 아직 보이지 않습니다.</li>') + '</ul>' +
          '<h3 style="font-size:13.5px;margin-top:16px">→ 개선할 점</h3>' +
          '<ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;line-height:1.8;color:#3A3A44">' +
            (r.improve.length ? r.improve.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') : '<li>바로 고칠 곳이 없습니다. 좋은 상태예요.</li>') + '</ul>' +
          '';
        App.toast('분석을 마쳤어요. 점수 ' + r.total + '점.');
      });

      root.addEventListener('click', function (e) {
        var s = e.target.closest('[data-sample]');
        if (s) {
          el.text.value = SAMPLES[s.getAttribute('data-sample')] || '';
          App.toast('샘플 본문을 넣었어요. 분석하기를 눌러보세요.');
        }
      });

      el.url.addEventListener('input', renderReq);
      H.$('#an-copyreq', root).addEventListener('click', function () {
        App.copy(requestText(), this);
      });
      renderReq();
    }
  });
})();

/* ---- mod-detail.js ---- */
/* =====================================================================
   Module 9 · 🛍️ 상세페이지 자판기
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  function readData(root) {
    var strengths = H.lines(H.$('#dt-strength', root).value);
    var reviews = H.lines(H.$('#dt-review', root).value).map(function (l) {
      var m = l.split(/\s*[:|]\s*/);
      if (m.length >= 2) return { who: m[0], text: m.slice(1).join(' ') };
      return { who: '구매자', text: l };
    });
    return {
      brand: H.$('#dt-brand', root).value.trim() || 'BRAND',
      name: H.$('#dt-name', root).value.trim(),
      target: H.$('#dt-target', root).value.trim(),
      price: H.$('#dt-price', root).value.trim(),
      listPrice: H.$('#dt-list', root).value.trim(),
      strengths: strengths.length ? strengths : ['핵심 강점을 입력하면 여기에 표시됩니다.'],
      reviews: reviews,
      cta: H.$('#dt-cta', root).value.trim() || '지금 구매하기',
      notice: H.$('#dt-notice', root).value.trim()
    };
  }

  function previewHtml(d) {
    var price = d.price ? H.won(d.price) + '원' : '가격 미입력';
    var list = d.listPrice ? '<s>' + esc(H.won(d.listPrice)) + '원</s>' : '';
    var off = '';
    var p1 = Number(String(d.listPrice).replace(/[^0-9]/g, ''));
    var p2 = Number(String(d.price).replace(/[^0-9]/g, ''));
    if (p1 && p2 && p1 > p2) off = '<em>' + Math.round((1 - p2 / p1) * 100) + '% 할인</em>';

    return '<div class="dp"><div class="hero">' +
      '<div class="brand">' + esc(d.brand) + '</div>' +
      '<h1>' + esc(d.name || '상품명을 입력하세요') + '</h1>' +
      (d.target ? '<div class="sub">' + esc(d.target) + '를 위한 선택</div>' : '') +
      '<div class="price"><b>' + esc(price) + '</b>' + list + off + '</div>' +
      '</div>' +
      '<section><h2>이런 점이 좋아요</h2><ul>' +
        d.strengths.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
      '</ul></section>' +
      (d.reviews.length ? '<section><h2>실제 후기</h2>' + d.reviews.map(function (r) {
        return '<div class="rv"><b>' + esc(r.who) + '</b>' + esc(r.text) + '</div>';
      }).join('') + '</section>' : '') +
      '<section><h2>구매 안내</h2><ul>' +
        '<li>배송: 결제 후 2~3일 이내 발송</li>' +
        '<li>교환·환불: 수령 후 7일 이내 가능</li>' +
        (d.notice ? '<li>' + esc(d.notice) + '</li>' : '') +
      '</ul></section>' +
      '<div class="cta"><div>' + esc(d.cta) + '</div></div>' +
      '<div class="foot">※ 본 상품의 조건·가격은 판매처 사정에 따라 달라질 수 있습니다.<br>© ' + esc(d.brand) + '</div>' +
      '</div>';
  }

  function fullHtml(d) {
    var price = d.price ? H.won(d.price) + '원' : '가격 문의';
    var inner = previewHtml(d);
    var css = [
      '*{box-sizing:border-box}',
      'body{margin:0;background:#EDEDF2;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif;color:#1B1B21;line-height:1.5;-webkit-font-smoothing:antialiased}',
      '.wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh}',
      '.hero{padding:30px 22px 24px;background:linear-gradient(160deg,#F3EEFF,#FFF6EC)}',
      '.hero .brand{font-size:12px;font-weight:800;color:#4C24D6;letter-spacing:.02em}',
      '.hero h1{margin:10px 0 0;font-size:26px;font-weight:800;letter-spacing:-.04em;line-height:1.3;word-break:keep-all}',
      '.hero .sub{margin-top:8px;font-size:13px;color:#6D6D7A}',
      '.price{margin-top:18px;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}',
      '.price b{font-size:28px;font-weight:800;letter-spacing:-.04em}',
      '.price s{font-size:13px;color:#A6A6B2}',
      '.price em{font-style:normal;font-size:12.5px;font-weight:800;color:#E25B2E}',
      'section{padding:22px;border-top:7px solid #F6F6F9}',
      'h2{margin:0;font-size:15px;font-weight:800;letter-spacing:-.03em}',
      'ul{margin:12px 0 0;padding:0;list-style:none}',
      'li{position:relative;padding-left:26px;font-size:13.5px;line-height:1.75;color:#3A3A44;margin-top:8px;word-break:keep-all}',
      'li:before{content:"✓";position:absolute;left:0;top:1px;width:17px;height:17px;border-radius:50%;background:#F1ECFF;color:#4C24D6;font-size:10px;font-weight:800;display:grid;place-items:center}',
      '.rv{background:#FAFAFC;border-radius:12px;padding:13px;font-size:12.5px;line-height:1.7;color:#3A3A44;margin-top:10px}',
      '.rv b{display:block;font-size:11px;color:#4C24D6;margin-bottom:4px}',
      '.cta{position:sticky;bottom:0;padding:12px 16px 16px;background:#fff;border-top:1px solid #F0F0F5}',
      '.cta div{display:block;height:48px;border-radius:12px;background:#6338F5;color:#fff;font-size:14.5px;font-weight:800;text-align:center;line-height:48px}',
      '.foot{padding:16px 22px 30px;font-size:11px;line-height:1.7;color:#9A9AA6}'
    ].join('\n');
    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(d.name || '상세페이지') + '</title>\n' +
      '<meta name="description" content="' + esc((d.name || '') + ' ' + (d.target || '')) + '">\n' +
      '<style>' + css + '</style>\n</head>\n<body>\n<div class="wrap">' + inner + '</div>\n</body>\n</html>\n';
  }

  App.register({
    id: 'detail', emoji: '🛍️', name: '상세페이지 자판기', free: false, tag: '판매 페이지',
    desc: '상품 정보만 넣으면 모바일 세로형 상세페이지 완성 — HTML로 저장.',
    help: '상품명·가격·강점·후기를 넣으면 모바일 세로형 상세페이지가 실시간으로 만들어집니다. 완성된 HTML을 내려받아 그대로 올리면 판매 페이지가 됩니다.',
    render: function (root) {
      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🛍️ 상품 정보</h3>' +
            '<div class="row2"><div class="field"><label for="dt-brand">브랜드</label><input id="dt-brand" type="text" placeholder="예: 댕댕랩"></div>' +
            '<div class="field"><label for="dt-name">상품명 *</label><input id="dt-name" type="text" placeholder="예: 반려견 자동급식기"></div></div>' +
            '<div class="row2"><div class="field"><label for="dt-list">정가</label><input id="dt-list" type="text" placeholder="69000"></div>' +
            '<div class="field"><label for="dt-price">판매가</label><input id="dt-price" type="text" placeholder="49000"></div></div>' +
            '<div class="field"><label for="dt-target">타겟</label><input id="dt-target" type="text" placeholder="예: 맞벌이 견주"></div>' +
            '<div class="field"><label for="dt-strength">핵심 강점 3가지 <span class="muted small">(한 줄에 하나)</span></label>' +
            '<textarea id="dt-strength" placeholder="예약 급식으로 하루 4번 자동 배식&#10;앱으로 양·시간 조절&#10;분해 세척 가능한 STS304"></textarea></div>' +
            '<div class="field"><label for="dt-review">후기 <span class="muted small">(닉네임: 내용)</span></label>' +
            '<textarea id="dt-review" placeholder="댕댕이집사: 출근할 때 걱정이 없어졌어요.&#10;초보견주: 세척이 쉬워서 좋습니다."></textarea></div>' +
            '<div class="row2"><div class="field"><label for="dt-cta">구매 버튼 문구</label><input id="dt-cta" type="text" placeholder="지금 구매하기"></div>' +
            '<div class="field"><label for="dt-notice">추가 안내</label><input id="dt-notice" type="text" placeholder="예: 무료 배송"></div></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="dt-build">미리보기 갱신</button>' +
            '<button class="btn btn-soft btn-block" type="button" id="dt-down">HTML 파일 다운로드</button></div>' +
            '<p class="hint">입력하는 대로 오른쪽 미리보기가 바뀝니다. 다운로드한 HTML은 그대로 배포할 수 있습니다.</p>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>📱 모바일 미리보기</h3>' +
            '<div class="phone" style="margin-top:12px"><div class="notch"><i></i></div><div class="screen" id="dt-screen"></div></div>' +
          '</section></div>' +
        '</div>';

      var fields = ['dt-brand', 'dt-name', 'dt-target', 'dt-price', 'dt-list', 'dt-strength', 'dt-review', 'dt-cta', 'dt-notice'];
      var screen = H.$('#dt-screen', root);

      function refresh() {
        var d = readData(root);
        screen.innerHTML = previewHtml(d);
      }

      fields.forEach(function (id) {
        H.$('#' + id, root).addEventListener('input', refresh);
      });
      H.$('#dt-build', root).addEventListener('click', function () {
        refresh();
        App.toast('미리보기를 갱신했어요.');
      });
      H.$('#dt-down', root).addEventListener('click', function () {
        var d = readData(root);
        if (!d.name) { App.toast('상품명을 먼저 입력해 주세요.'); H.$('#dt-name', root).focus(); return; }
        var safe = d.name.replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 30);
        App.download('detail-' + (safe || 'page') + '.html', fullHtml(d), 'text/html;charset=utf-8');
        App.toast('상세페이지 HTML을 내려받았어요.');
      });

      H.$('#dt-name', root).value = '반려견 자동급식기';
      H.$('#dt-brand', root).value = '댕댕랩';
      H.$('#dt-target', root).value = '맞벌이 견주';
      H.$('#dt-list', root).value = '69000';
      H.$('#dt-price', root).value = '49000';
      H.$('#dt-strength', root).value = '예약 급식으로 하루 4번 자동 배식\n앱으로 양·시간 조절\n분해 세척 가능한 STS304';
      H.$('#dt-review', root).value = '댕댕이집사: 출근할 때 걱정이 없어졌어요.\n초보견주: 세척이 쉬워서 좋습니다.';
      refresh();
    }
  });
})();

/* ---- init.js ---- */
/* =====================================================================
   init
   ===================================================================== */
(function () {
  'use strict';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.start(); });
  } else {
    App.start();
  }
})();
