/* =====================================================================
   Module 6 · ☕ 카페 글쓰기 자판기 (상품 → 원고 6개 + 카페 미리보기)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, A = App.ads;

  var st = {
    product: null, cafeName: '', purpose: 'intro', extra: '',
    personas: [], persona: null, customPersona: null,
    deadline: '', quota: '', nick: '오늘도담음',
    drafts: [], cur: 0, edit: false, edits: {}
  };

  function reset() {
    st.product = null; st.cafeName = ''; st.purpose = 'intro'; st.extra = '';
    st.personas = []; st.persona = null; st.customPersona = null;
    st.deadline = ''; st.quota = ''; st.drafts = []; st.cur = 0; st.edit = false; st.edits = {}; st.comments = [];
  }

  App.register({
    id: 'cafe', emoji: '☕', name: '카페 글쓰기 자판기', free: false, tag: '카페 · 원고',
    desc: '상품·페르소나만 고르면 카페에 올릴 원고 6개(일상2·고민2·정보2)를 씁니다.',
    help: '상세페이지에서 분석한 상품을 불러오고 타깃 카페·글의 목적·페르소나를 고르면, 일상 2편·고민 2편·정보 2편의 원고를 만들어 줍니다. 카페 화면 미리보기, 댓글 예시, 금칙어 검사, 직접 수정까지 됩니다.',
    render: function (root) {
      reset();
      var pickId = S.get('pick', null);
      if (pickId) {
        S.del('pick');
        var p = A.products.get(pickId);
        if (p) st.product = p;
      }
      root.innerHTML = '<div id="cf-app"></div>';
      paint(H.$('#cf-app', root));
    }
  });

  function paint(root) {
    var hasProduct = !!st.product;
    var hasBase = hasProduct || st.customPersona;

    root.innerHTML =
      '<div class="cols">' +
        '<div class="stack">' +

          /* 1 */
          '<section class="stepcard"><div class="sh"><span class="sno">1</span>' +
            '<div><b>어떤 상품을 광고할까요?</b><span class="ss">사이트 분석해 둔 상품을 고르면 카페에 올릴 글을 대신 써 드려요.</span></div></div>' +
            '<div class="field"><label for="cf-load">전에 등록한 상품 불러오기</label>' +
              '<select id="cf-load">' + A.products.options(st.product ? st.product.id : '', '전에 등록한 상품 불러오기') + '</select></div>' +
            (st.product
              ? '<div class="sumline"><em>' + esc(st.product.title) + '</em>' + (st.product.price ? ' · ' + esc(st.product.price) : '') + '</div>' +
                (st.product.benefits[0] ? '<div class="sumline muted">' + esc(A.cut(st.product.benefits[0], 90)) + '</div>' : '')
              : '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:12.5px;font-weight:800;color:var(--violet-d)">상품이 없으면 직접 입력</summary>' +
                '<div class="field"><label for="cf-mtitle">상품·업체 이름</label><input id="cf-mtitle" type="text" placeholder="예: 넥센타이어 렌탈"></div>' +
                '<div class="row2"><div class="field"><label for="cf-mprice">가격·혜택</label><input id="cf-mprice" type="text" placeholder="예: 월 3,000원부터"></div>' +
                '<div class="field"><label for="cf-mlink">링크</label><input id="cf-mlink" type="text" placeholder="https://..."></div></div>' +
                '<div class="actions"><button class="btn btn-soft btn-block" type="button" id="cf-mrun">이 상품으로 시작</button></div></details>') +
            '<div class="field"><label for="cf-cafe">타깃 카페</label>' +
              '<input id="cf-cafe" type="text" placeholder="예: 워킹맘 카페, 1인 가구 생활 카페" value="' + esc(st.cafeName) + '"></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="cf-start"' + (hasProduct ? '' : ' disabled style="opacity:.5"') + '>카페 글 만들기 시작</button></div>' +
          '</section>' +

          /* 2 */
          '<section class="stepcard' + (hasProduct ? '' : ' off') + '"><div class="sh"><span class="sno">2</span>' +
            '<div><b>어떤 글을 쓸까요?</b><span class="ss">글의 목적을 고르면 다음 단계에서 누구의 입장에서 쓸지 정해요.</span></div></div>' +
            '<div class="stepgrid" id="cf-purposes" style="grid-template-columns:1fr">' +
              '<button class="pickcard' + (st.purpose === 'intro' ? ' on' : '') + '" type="button" data-purpose="intro">' +
                '<b>상품·업체 소개</b><span>제목에 [협찬]을 달고, 써본 후기·혜택을 본 질문·관심 있는 분 공유 형태로 상품을 소개해요.</span></button>' +
              '<button class="pickcard' + (st.purpose === 'ask' ? ' on' : '') + '" type="button" data-purpose="ask">' +
                '<b>추천 요청</b><span>고민을 가진 사람의 입장에서 추천을 구해요. 업체 정보는 다른 회원이 추천하는 댓글로 다뤄요.</span></button>' +
            '</div>' +
            '<div class="field"><label for="cf-extra">추가 요청 <span class="muted small">(선택)</span></label>' +
              '<textarea id="cf-extra" style="min-height:70px" placeholder="예: 비용에 대한 고민을 다뤄 주세요. 과한 감탄사는 줄여 주세요.">' + esc(st.extra) + '</textarea></div>' +
          '</section>' +

          /* 3 */
          '<section class="stepcard"><div class="sh"><span class="sno">3</span>' +
            '<div><b>누구의 입장에서 물어볼까요?</b><span class="ss">추천을 받거나 직접 만들어요.</span></div></div>' +
            '<div class="actions" style="margin-top:10px"><button class="btn btn-primary btn-sm" type="button" id="cf-mkpersona">✨ 추천 페르소나 3개 만들기</button>' +
              '<button class="btn btn-line btn-sm" type="button" id="cf-custom">＋ 직접 설정하기</button></div>' +
            '<div id="cf-personas" style="margin-top:11px"></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="cf-done3">다음: 원고 만들기 →</button></div>' +
          '</section>' +

          /* 4 */
          '<section class="stepcard"><div class="sh"><span class="sno">4</span>' +
            '<div><b>원고 만들기</b><span class="ss">원고 6개(일상 2 · 고민 2 · 정보 2)를 한 번에 만들어요. 각 원고는 제목·본문·댓글 답변으로 되어 있어요.</span></div></div>' +
            '<div class="field"><label for="cf-dead">마감·기간 안내 <span class="muted small">(선택)</span></label>' +
              '<input id="cf-dead" type="text" placeholder="예: 이번 주 일요일(2026년 12월 6일)까지 모집" value="' + esc(st.deadline) + '"></div>' +
            '<div class="field"><label for="cf-quota">인원·수량 안내 <span class="muted small">(선택)</span></label>' +
              '<input id="cf-quota" type="text" placeholder="예: 선착순 50명 모집" value="' + esc(st.quota) + '"></div>' +
            '<p class="hint">상품에 없는 문구는 비워 두세요. “기본 안내”처럼 보이게 자동으로 다듬어 넣습니다.</p>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="cf-run">카페 글 생성하기</button></div>' +
          '</section>' +
        '</div>' +

        '<div class="stack" id="cf-right"></div>' +
      '</div>';

    renderPersonas(root);
    renderRight(root);
    bind(root);
  }

  function renderPersonas(root) {
    var box = H.$('#cf-personas', root);
    if (!box) return;
    if (!st.personas.length && !st.customPersona) {
      box.innerHTML = '<p class="psub">“추천 페르소나 3개 만들기”를 누르면 상품에 맞는 고객 입장을 제안해요. 직접 설정해도 됩니다.</p>';
      return;
    }
    if (st.customPersona) {
      box.innerHTML = '<div class="pcard" style="border-color:var(--violet);background:#FBFAFF"><span class="pn">직접 설정</span>' +
        '<b>' + esc(st.customPersona.name) + '</b><p>' + esc(st.customPersona.desc || '') + '</p></div>';
      return;
    }
    box.innerHTML = st.personas.map(function (x, i) {
      return '<button class="pickcard' + (st.persona === i ? ' on' : '') + '" type="button" data-persona="' + i + '" style="width:100%;text-align:left;margin-top:7px">' +
        '<b>추천 ' + ('0' + (i + 1)).slice(-2) + ' · ' + esc(x.name) + '</b>' +
        '<span>' + esc(x.desc) + '</span>' +
        '<span style="color:var(--violet-d);font-weight:800">' + (st.persona === i ? '✓ 선택됨' : '') + '</span></button>';
    }).join('');
  }

  function renderRight(root) {
    var right = H.$('#cf-right', root);
    if (!right) return;
    if (!st.drafts.length) {
      right.innerHTML = '<section class="panel"><div class="empty"><b>아직 쓴 글이 없어요</b>' +
        '1~4단계를 채우고 <b>카페 글 생성하기</b>를 누르면 원고 6개가 여기에 나옵니다.<br>' +
        '카페 화면 그대로 미리 보고, 댓글까지 확인할 수 있어요.</div></section>';
      return;
    }
    var d = st.drafts[st.cur];
    var body = st.edits[d.key] != null ? st.edits[d.key] : d.body;
    var comments = st.comments || [];

    right.innerHTML =
      '<section class="panel"><h3>📝 원고 6개</h3>' +
        '<div class="drafttabs" id="cf-tabs" style="margin-top:10px">' +
          st.drafts.map(function (x, i) {
            return '<button type="button" class="' + (i === st.cur ? 'on' : '') + '" data-draft="' + i + '">' + esc(x.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="seg" id="cf-view" style="margin-top:11px">' +
          '<button type="button" class="' + (!st.edit ? 'on' : '') + '" data-view="preview">카페 미리보기</button>' +
          '<button type="button" class="' + (st.edit ? 'on' : '') + '" data-view="edit">직접 수정</button>' +
        '</div>' +
        (st.edit
          ? '<div class="field"><label for="cf-title">제목</label><input id="cf-title" type="text" value="' + esc(d.title) + '"></div>' +
            '<div class="field"><label for="cf-body">본문</label><textarea id="cf-body" style="min-height:280px">' + esc(body) + '</textarea></div>' +
            '<div class="actions"><button class="btn btn-primary" type="button" id="cf-apply">수정 반영</button>' +
            '<button class="btn btn-ghost" type="button" id="cf-revert">되돌리기</button></div>'
          : cafepostHtml(d, body, comments)) +
        '<div class="actions"><button class="btn btn-primary" type="button" id="cf-copyall">제목 + 본문 복사</button>' +
        '<button class="btn btn-soft" type="button" id="cf-copybody">본문만 복사</button></div>' +
        '<p class="hint" id="cf-len">' + body.replace(/\s/g, '').length + '자</p>' +
      '</section>' +
      '<section class="panel"><h3>🚨 금칙어·규정 체크</h3><div id="cf-banned" style="margin-top:10px"></div></section>' +
      '<section class="panel"><h3>💬 댓글 시뮬레이션</h3>' +
        '<p class="psub">실제로 올리면 이런 댓글이 달릴 수 있어요. 미리 답변을 준비해 두면 좋습니다.</p>' +
        '<div class="cmts" style="margin-top:6px;padding:0">' +
          comments.map(function (c) {
            return '<div class="cmt"><i></i><div class="cw"><div class="cn">' + esc(c.u) + (c.me ? '<em>작성자</em>' : '') + '</div>' +
              '<div class="ct">' + esc(c.t) + '</div><div class="cd">' + esc(c.at || '방금 전') + '</div></div></div>';
          }).join('') +
        '</div>' +
      '</section>';

    renderBanned(root, d, body);
    bindRight(root, d, body);
  }

  function cafepostHtml(d, body, comments) {
    return '<div class="cafepost" style="margin-top:12px">' +
      '<div class="cph"><span class="bd">' + esc(st.cafeName || '자유게시판') + ' › ' + (st.purpose === 'intro' ? '정보' : '질문') + '</span>' +
        '<h4>' + esc(d.title) + '</h4>' +
        '<div class="who"><i></i><span>' + esc(st.nick) + '</span><span>·</span><span>' + H.nowStamp() + '</span><span>·</span><span>조회 ' + (120 + d.body.length % 300) + '</span>' +
        '<span style="margin-left:auto">💬 댓글 ' + (comments.length || 0) + '</span></div></div>' +
      '<div class="cpb">' + esc(body) + '</div>' +
      '<div class="cpf"><span>❤️ 좋아요 ' + (3 + d.body.length % 20) + '</span><span>💬 댓글 ' + (comments.length || 0) + '</span><span>🔗 URL 복사</span></div>' +
    '</div>';
  }

  function renderBanned(root, d, body) {
    var box = H.$('#cf-banned', root);
    if (!box) return;
    var found = A.bannedCheck(d.title + ' ' + body);
    var ad = /협찬|광고|제휴|업체로부터|소정의/.test(body);
    box.innerHTML =
      (found.length
        ? '<div class="graybox" style="background:#FFF6F6;border-color:#FFD9D9"><b style="color:#C63A3A">금칙 표현 ' + found.length + '건</b><br>' +
          found.map(function (f) { return esc(f.w) + ' → <b>' + esc(f.fix) + '</b>'; }).join('<br>') + '</div>'
        : '<div class="graybox" style="color:#158449"><b>금칙 표현 없음 ✓</b><br>최상급·보장·과장 표현이 발견되지 않았어요.</div>') +
      '<div class="graybox" style="margin-top:8px"><b>카페 규정 체크</b><br>' +
        '· 광고·협찬 표기: ' + (ad ? '있음 ✓' : '없음 — 카페 규정에 따라 표기가 필요할 수 있어요') + '<br>' +
        '· 링크 1개 이하인지 확인<br>' +
        '· 같은 글을 여러 카페에 그대로 올리면 홍보성으로 신고될 수 있어요<br>' +
        '· 카페마다 홍보 게시판 여부가 다르니 게시판부터 확인하세요</div>';
  }

  function bind(root) {
    H.$('#cf-load', root).addEventListener('change', function () {
      var p = A.products.get(this.value);
      if (!p) return;
      st.product = p;
      st.personas = []; st.persona = null;
      paint(root);
      App.toast('상품을 불러왔어요.');
    });
    H.$('#cf-cafe', root).addEventListener('input', function () { st.cafeName = this.value; });
    H.$('#cf-extra', root).addEventListener('input', function () { st.extra = this.value; });
    H.$('#cf-dead', root).addEventListener('input', function () { st.deadline = this.value; });
    H.$('#cf-quota', root).addEventListener('input', function () { st.quota = this.value; });

    var mrun = H.$('#cf-mrun', root);
    if (mrun) mrun.addEventListener('click', function () {
      var t = H.$('#cf-mtitle', root).value.trim();
      if (!t) { App.toast('상품 이름을 넣어 주세요.'); return; }
      var p = A.analyze({ text: [t, H.$('#cf-mprice', root).value, H.$('#cf-mlink', root).value].join('\n'), rawTitle: t, via: '직접 입력' });
      p.price = H.$('#cf-mprice', root).value.trim() || p.price;
      p.url = A.normalizeUrl(H.$('#cf-mlink', root).value);
      st.product = p;
      paint(root);
    });

    H.$('#cf-start', root).addEventListener('click', function () {
      if (!st.product && !st.customPersona) { App.toast('먼저 상품을 불러오거나 직접 입력해 주세요.'); return; }
      var p2 = H.$('.stepcard:nth-child(2)', root);
      if (p2) p2.scrollIntoView({ behavior: 'smooth', block: 'center' });
      App.toast('2단계로 넘어갔어요. 글의 목적을 골라 주세요.');
      if (!st.personas.length && st.product) {
        st.personas = (st.product.personas || []).slice(0, 3);
        renderPersonas(root);
      }
    });

    H.$('#cf-purposes', root).addEventListener('click', function (e) {
      var pu = e.target.closest('[data-purpose]');
      if (pu) {
        st.purpose = pu.getAttribute('data-purpose');
        H.$$('#cf-purposes [data-purpose]', root).forEach(function (x) { x.classList.toggle('on', x === pu); });
      }
    });

    H.$('#cf-mkpersona', root).addEventListener('click', function () {
      if (!st.product) { App.toast('상품을 먼저 정해 주세요.'); return; }
      st.customPersona = null;
      st.personas = (st.product.personas || []).slice(0, 3);
      if (!st.personas.length) { App.toast('상품 분석에 고객 정보가 없어요.'); return; }
      st.persona = st.persona == null ? 0 : st.persona;
      renderPersonas(root);
      App.toast('페르소나 3개를 만들었어요. 하나를 골라 주세요.');
    });
    H.$('#cf-custom', root).addEventListener('click', function () {
      var name = window.prompt('누구의 입장에서 쓸까요? (예: 이사 앞둔 30대 직장인)');
      if (!name) return;
      var desc = window.prompt('그 사람의 상황을 한 줄로 적어 주세요. (예: 견적을 여러 곳 받을 시간이 없음)') || '';
      st.customPersona = { name: name, desc: desc };
      st.personas = []; st.persona = null;
      renderPersonas(root);
    });
    H.$('#cf-personas', root).addEventListener('click', function (e) {
      var b = e.target.closest('[data-persona]'); if (!b) return;
      st.persona = Number(b.getAttribute('data-persona'));
      renderPersonas(root);
    });
    H.$('#cf-done3', root).addEventListener('click', function () {
      if (!st.customPersona && (st.persona == null || !st.personas.length)) { App.toast('페르소나를 먼저 골라 주세요.'); return; }
      var cards = H.$$('.stepcard', root);
      if (cards[3]) cards[3].scrollIntoView({ behavior: 'smooth', block: 'center' });
      App.toast('4단계에서 원고를 만들 수 있어요.');
    });

    H.$('#cf-run', root).addEventListener('click', generate);
  }

  function generate() {
    if (!st.product) { App.toast('상품을 먼저 정해 주세요.'); return; }
    var root = H.$('#cf-app');
    if (!root) return;
    var persona = st.customPersona || (st.personas[st.persona] || (st.product.personas || [])[0] || { name: '동네 이웃', desc: '' });
    var res = A.cafeDrafts(st.product, {
      purpose: st.purpose, persona: persona, cafeName: st.cafeName || '동네 카페',
      nick: st.nick, deadline: st.deadline, quota: st.quota, extra: st.extra
    });
    st.drafts = res.drafts;
    st.comments = res.comments;
    st.cur = 0; st.edit = false; st.edits = {};
    renderRight(root);
    var right = H.$('#cf-right', root);
    if (right) right.scrollIntoView({ behavior: 'smooth', block: 'start' });
    App.toast('원고 6개를 만들었어요. 탭을 눌러 확인하세요.');
    renderBanned(root, st.drafts[0], st.drafts[0].body);
  }

  function bindRight(root, d, body) {
    var right = H.$('#cf-right', root);
    if (!right) return;
    var tabs = H.$('#cf-tabs', right);
    if (tabs) tabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-draft]'); if (!b) return;
      st.cur = Number(b.getAttribute('data-draft'));
      renderRight(root);
    });
    H.$('#cf-view', right).addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]'); if (!b) return;
      st.edit = b.getAttribute('data-view') === 'edit';
      renderRight(root);
    });
    if (st.edit) {
      H.$('#cf-apply', right).addEventListener('click', function () {
        var t = H.$('#cf-title', right).value.trim();
        var bd = H.$('#cf-body', right).value;
        if (t) d.title = t;
        st.edits[d.key] = bd;
        st.edit = false;
        renderRight(root);
        App.toast('수정 내용을 반영했어요.');
      });
      H.$('#cf-revert', right).addEventListener('click', function () {
        delete st.edits[d.key];
        st.edit = false;
        renderRight(root);
        App.toast('원래 원고로 되돌렸어요.');
      });
    }
    H.$('#cf-copybody', right).addEventListener('click', function () { App.copy(body, this); });
    H.$('#cf-copyall', right).addEventListener('click', function () {
      App.copy('[제목] ' + d.title + '\n\n' + body, this);
    });
  }
})();
