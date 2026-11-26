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
