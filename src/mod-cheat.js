/* =====================================================================
   Module 7 · 🥷 광고 컨닝페이퍼 (상세페이지·캡처 → 재구성 광고 카드 + 카피 사전)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, A = App.ads;

  var PURPOSES = ['CPA', '로컬매장', '커머스', '앱설치'];
  var KINDS = ['헤드라인', '공식', 'CTA'];
  var LIB = [
    { p: 'CPA', k: '헤드라인', t: '3분이면 끝, ○○ 신청하고 혜택 확인', n: '숫자로 진입장벽을 낮춥니다. "3분"은 가장 잘 먹히는 시간 약속입니다.' },
    { p: 'CPA', k: '헤드라인', t: '○○ 때문에 고민이라면, 30초만 읽어보세요', n: '문제를 먼저 짚고 시간을 약속하면 이탈이 줄어듭니다.' },
    { p: 'CPA', k: '헤드라인', t: '안 해봤으면 모르는 ○○, 결과부터 보여드립니다', n: '결과 선제시형. 증거(수치·후기)가 뒤에 있어야 합니다.' },
    { p: 'CPA', k: '헤드라인', t: '월 3만원으로 시작하는 ○○', n: '가격을 구체적인 숫자로. 조건(약정·기간)은 본문에 명시.' },
    { p: 'CPA', k: '공식', t: 'PAS — 문제(Pain) → 확대(Agitate) → 해결(Solution)', n: '가장 범용적인 리드 광고 공식. 문제를 3문장으로 확대한 뒤 해결책을 제시.' },
    { p: 'CPA', k: '공식', t: 'BAB — Before → After → Bridge', n: '상태 변화를 보여줄 때 강합니다. Before를 구체적으로 그릴수록 After가 선명해집니다.' },
    { p: 'CPA', k: '공식', t: '4U — Useful · Urgent · Unique · Ultra-specific', n: '헤드라인 4요소 체크. 3개 이상이면 통과, 2개 이하면 다시 쓰세요.' },
    { p: 'CPA', k: 'CTA', t: '무료로 진단받기', n: '"무료"는 가장 강력한 진입 장벽 제거 장치입니다. 조건을 함께 적으세요.' },
    { p: 'CPA', k: 'CTA', t: '1분 만에 확인하기', n: '짧은 시간 약속 + 즉시성. 버튼 문구로도 좋습니다.' },
    { p: 'CPA', k: 'CTA', t: '카톡으로 상담 신청', n: '채널을 명시하면 심리적 거리가 줄어듭니다.' },
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
    { p: '커머스', k: '헤드라인', t: '한 달 써보고 남은 후기 — {제품}', n: '경험 기간을 밝히면 신뢰가 올라갑니다.' },
    { p: '커머스', k: '헤드라인', t: '설치 필요 없이 5분이면 끝', n: '사용 장면을 시간으로 환산하면 상상이 쉬워집니다.' },
    { p: '커머스', k: '헤드라인', t: '교환·환불 조건까지 투명하게', n: '구매 불안을 먼저 없애는 헤드라인. 상세페이지 이탈 방지.' },
    { p: '커머스', k: '헤드라인', t: '{타겟}이 가장 많이 찾는 {카테고리}', n: '"1위" 같은 최상급 표현은 근거가 없으면 쓰지 마세요.' },
    { p: '커머스', k: '공식', t: 'FAB — 기능 → 이점 → 혜택', n: '스펙 나열에서 멈추지 말고 "그래서 나에게 뭐가 좋은지"까지.' },
    { p: '커머스', k: '공식', t: '문제 → 해결 → 증거(후기) → CTA', n: '상세페이지 기본 구조. 증거에는 사진·수치·실사용 후기를 넣으세요.' },
    { p: '커머스', k: '공식', t: '숫자 3개 — 가격 · 기간 · 수량', n: '구매 판단에 필요한 숫자를 3개로 정리하면 망설임이 줄어듭니다.' },
    { p: '커머스', k: 'CTA', t: '장바구니 담기', n: '구매보다 부담이 낮은 1차 행동.' },
    { p: '커머스', k: 'CTA', t: '재고 확인하기', n: '희소성과 궁금증을 동시에 자극합니다.' },
    { p: '커머스', k: 'CTA', t: '실사용 후기 보러 가기', n: '후기 수는 실제로 있을 때만 숫자로 적으세요.' },
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

  var st = {
    tab: 'make', product: null, shots: [], sheet: null,
    headline: '', filter: { purpose: '전체', kind: '전체' }, q: '', busy: false
  };

  /* --------------- 컨닝페이퍼 카드 그리기 --------------- */
  function paintSheet(p, cs, opt) {
    opt = opt || {};
    var W = 1080, Hh = 1350;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = Hh;
    var ctx = cv.getContext('2d');
    var C = A.canvas;
    var accent = opt.accent || '#FFE24B';
    var brand = opt.brand || '#2F54EB';

    /* 배경 */
    ctx.fillStyle = '#F4F7FF'; ctx.fillRect(0, 0, W, Hh);
    var g = ctx.createLinearGradient(0, 0, W, Hh * 0.6);
    g.addColorStop(0, '#DCE9FF'); g.addColorStop(1, '#F7FAFF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh * 0.62);

    /* 상단 배지 */
    ctx.textBaseline = 'top';
    ctx.font = '800 28px Pretendard, "Apple SD Gothic Neo", sans-serif';
    var tag = opt.tag || (p.category || '동네 혜택');
    ctx.fillStyle = 'rgba(47,84,235,.12)';
    C.roundRect(ctx, 64, 56, ctx.measureText(tag).width + 40, 50, 25); ctx.fill();
    ctx.fillStyle = brand;
    ctx.fillText(tag, 84, 68);

    /* 헤드라인 (강조 하이라이트) */
    var head = cs.headline[0] || p.title;
    var size = 96, lines;
    do {
      ctx.font = '800 ' + size + 'px Pretendard, "Apple SD Gothic Neo", sans-serif';
      lines = C.wrap(ctx, head, W - 128);
      if (lines.length <= 3) break;
      size -= 6;
    } while (size > 52);
    ctx.font = '800 ' + size + 'px Pretendard, "Apple SD Gothic Neo", sans-serif';
    var y = 150;
    for (var i = 0; i < Math.min(lines.length, 3); i++) {
      var lw = ctx.measureText(lines[i]).width;
      if (i === Math.min(lines.length, 3) - 1 || lines.length === 1) {
        /* 마지막 줄에 형광펜 */
        ctx.save();
        ctx.fillStyle = accent;
        ctx.fillRect(58, y + size * 0.12, Math.min(lw + 20, W - 116), size * 0.82);
        ctx.restore();
      }
      ctx.fillStyle = '#111';
      ctx.fillText(lines[i], 64, y);
      y += Math.round(size * 1.18);
    }

    /* 서브 */
    y += 8;
    ctx.font = '700 44px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#2A2A33';
    var sub = cs.sub[0] || (p.benefits[0] || '');
    var sl = C.wrap(ctx, A.cut(sub, 60), W - 128);
    y = C.drawLines(ctx, sl, 64, y, 58, 2);

    /* 혜택 4블록 */
    var by = Math.max(y + 46, 560);
    var bw = (W - 128 - 28) / 2, bh = 190;
    (cs.bullets || []).slice(0, 4).forEach(function (b, i) {
      var bx = 64 + (i % 2) * (bw + 28);
      var byy = by + Math.floor(i / 2) * (bh + 24);
      ctx.save();
      ctx.shadowColor = 'rgba(30,50,120,.10)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#FFFFFF';
      C.roundRect(ctx, bx, byy, bw, bh, 24); ctx.fill();
      ctx.restore();
      var icons = ['🎁', '🚚', '🛠', '✅', '💳', '📦'];
      ctx.font = '56px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
      ctx.fillText(icons[i % icons.length], bx + 26, byy + 26);
      ctx.font = '800 30px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillStyle = '#111';
      var tl = C.wrap(ctx, b, bw - 130);
      C.drawLines(ctx, tl, bx + 106, byy + 34, 40, 3);
    });

    /* CTA 바 */
    var ctaY = Hh - 230;
    ctx.fillStyle = brand;
    ctx.fillRect(0, ctaY, W, 150);
    ctx.fillStyle = '#FFFFFF';
    var cs2 = 54;
    do {
      ctx.font = '800 ' + cs2 + 'px Pretendard, "Apple SD Gothic Neo", sans-serif';
      if (ctx.measureText(cs.cta[0] || '').width <= W - 160) break;
      cs2 -= 4;
    } while (cs2 > 30);
    ctx.font = '800 ' + cs2 + 'px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillText(cs.cta[0] || '자세히 보기  ▶', 64, ctaY + (150 - cs2) / 2 - 6);

    /* 하단 표기 */
    ctx.font = '600 24px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#6D6D7A';
    var foot = (opt.foot || '조건과 혜택은 신청 페이지에서 확인하세요') + (p.domain ? ' · ' + p.domain : '');
    ctx.fillText(A.cut(foot, 60), 64, Hh - 62);
    return cv;
  }

  /* --------------- 화면 --------------- */
  App.register({
    id: 'cheat', emoji: '🥷', name: '광고 컨닝페이퍼', free: false, tag: '카피 · 카드',
    desc: '상세페이지·캡처를 넣으면 재구성 광고 카드 + 헤드라인·혜택·CTA 세트.',
    help: '상세페이지 주소나 캡처 이미지를 넣으면 광고 카드(1080×1350)로 다시 구성하고, 헤드라인 5안·서브 3안·혜택 4블록·CTA 4안을 만들어 줍니다. 업종별 카피 사전(40종)도 그대로 들어 있습니다.',
    render: function (root) {
      st = { tab: 'make', product: null, shots: [], sheet: null, headline: '', filter: { purpose: '전체', kind: '전체' }, q: '', busy: false };
      var pickId = S.get('pick', null);
      if (pickId) {
        S.del('pick');
        var pp = A.products.get(pickId);
        if (pp) st.product = pp;
      }

      root.innerHTML =
        '<div class="panel" style="padding:0;overflow:hidden">' +
          '<div class="seg" style="border-radius:0;padding:5px 6px;background:#F7F7FB" id="ch-tabs">' +
            '<button type="button" class="' + (st.tab === 'make' ? 'on' : '') + '" data-tab="make">🥷 컨닝페이퍼 만들기</button>' +
            '<button type="button" class="' + (st.tab === 'lib' ? 'on' : '') + '" data-tab="lib">📚 카피 사전 40종</button>' +
          '</div>' +
          '<div id="ch-body" style="padding:18px"></div>' +
        '</div>';

      H.$('#ch-tabs', root).addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]'); if (!b) return;
        st.tab = b.getAttribute('data-tab');
        H.$$('#ch-tabs button', root).forEach(function (x) { x.classList.toggle('on', x === b); });
        paint(root);
      });
      paint(root);
    }
  });

  function paint(root) {
    var body = H.$('#ch-body', root);
    if (!body) return;
    if (st.tab === 'lib') renderLib(body);
    else renderMake(body);
  }

  /* ---------------- 만들기 ---------------- */
  function renderMake(body) {
    body.innerHTML =
      '<div class="cols">' +
        '<div class="stack">' +
          '<section class="stepcard"><div class="sh"><span class="sno">1</span>' +
            '<div><b>어떤 상품을 광고할까요?</b><span class="ss">상세페이지 주소 또는 캡처 이미지로 알려주세요.</span></div></div>' +
            '<div class="field"><label for="ch-url">상세페이지 주소</label>' +
              '<input id="ch-url" type="text" inputmode="url" placeholder="https://... 상세페이지 링크를 넣어주세요"></div>' +
            '<div class="field"><label for="ch-load">또는 전에 등록한 상품 불러오기</label>' +
              '<select id="ch-load">' + A.products.options('', '전에 등록한 상품 불러오기') + '</select></div>' +
            '<div class="field"><label>또는 캡처 이미지 등록</label>' +
              '<div class="actions" style="margin-top:0"><label class="btn btn-line" for="ch-shot" style="cursor:pointer">🖼 캡처 올리기</label>' +
              '<input id="ch-shot" type="file" accept="image/*" multiple hidden></div>' +
              '<div id="ch-shots"></div></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="ch-run">컨닝페이퍼 만들기</button></div>' +
            '<p class="hint">캡처만 있을 때는 카드 문구를 직접 다듬을 수 있어요. 주소를 넣으면 혜택·가격·주의사항까지 자동으로 뽑습니다.</p>' +
          '</section>' +
          '<section class="stepcard"><div class="sh"><span class="sno">2</span>' +
            '<div><b>카드에 넣을 헤드라인</b><span class="ss">마음에 드는 안을 고르면 카드 위쪽 문구가 바뀝니다.</span></div></div>' +
            '<div id="ch-heads"><p class="psub">먼저 1단계를 실행해 주세요.</p></div>' +
            '<div class="field"><label for="ch-custom">직접 쓰기</label><input id="ch-custom" type="text" placeholder="예: 타이어 4본 교체, 월 3,000원부터"></div>' +
          '</section>' +
        '</div>' +
        '<div class="stack" id="ch-right"></div>' +
      '</div>';

    renderShots(body);
    renderRight(body);

    H.$('#ch-shot', body).addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []).slice(0, 4);
      var done = 0;
      if (!files.length) return;
      files.forEach(function (f) {
        A.fileToDataUrl(f).then(function (d) {
          st.shots.push(d);
          if (++done === files.length) renderShots(body);
        }, function (e) { App.toast(e.message); });
      });
      this.value = '';
    });
    H.$('#ch-load', body).addEventListener('change', function () {
      var p = A.products.get(this.value);
      if (!p) return;
      st.product = p;
      buildSheet(body);
      App.toast('상품을 불러왔어요.');
    });
    H.$('#ch-custom', body).addEventListener('input', function () {
      if (!st.sheet) return;
      st.headline = this.value;
      st.sheet.headline = [this.value].concat(st.sheet.headline.slice(1));
      renderCard(body);
    });
    H.$('#ch-run', body).addEventListener('click', function () {
      var url = A.normalizeUrl(H.$('#ch-url', body).value);
      if (url) { readThen(body, url); return; }
      if (st.product) { buildSheet(body); return; }
      if (st.shots.length) {
        st.product = null;
        st.sheet = {
          headline: ['상품 헤드라인을 입력해 주세요', '혜택을 한 줄로 정리', '지금 확인하세요'],
          sub: ['캡처 이미지를 참고해 문구를 다듬어 주세요'],
          bullets: ['혜택 1', '혜택 2', '혜택 3', '혜택 4'],
          cta: ['자세히 확인하기']
        };
        buildSheet(body, true);
        return;
      }
      App.toast('주소를 넣거나, 상품을 불러오거나, 캡처를 올려 주세요.');
    });
  }

  function renderShots(body) {
    var box = H.$('#ch-shots', body);
    if (!box) return;
    box.innerHTML = st.shots.length ? '<div class="creatives" style="grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">' +
      st.shots.map(function (s, i) {
        return '<div class="creative"><img src="' + s + '" alt="캡처 ' + (i + 1) + '"><div class="cf"><span>' + (i + 1) + '</span>' +
          '<button class="btn btn-sm btn-danger" type="button" data-sdel="' + i + '">빼기</button></div></div>';
      }).join('') + '</div>' : '';
    box.onclick = function (e) {
      var b = e.target.closest('[data-sdel]');
      if (!b) return;
      st.shots.splice(Number(b.getAttribute('data-sdel')), 1);
      renderShots(body);
    };
  }

  function readThen(body, url) {
    if (st.busy) return;
    st.busy = true;
    var right = H.$('#ch-right', body);
    right.innerHTML = '<section class="panel">' + A.progressHtml('상세페이지 읽는 중', [
      { label: '페이지 읽기' }, { label: '혜택·주의사항 추출' }, { label: '카드 만들기' }
    ]) + '</section>';
    var box = H.$('.aiwork', right);
    function row(i, cls, msg) {
      var r = H.$('[data-prow="' + i + '"]', box);
      if (!r) return;
      r.className = 'airow ' + cls;
      if (msg) H.$('.pmsg', r).textContent = msg;
    }
    row(0, 'run', '여러 경로 시도');
    A.readPage(url, function (s) {
      if (s.phase === 'try') row(0, 'run', s.label + ' 시도');
      if (s.phase === 'ok') row(0, 'on', s.label + ' · ' + s.chars + '자');
      if (s.phase === 'fail') row(0, 'run', s.label + ' 실패 → 다음');
    }).then(function (res) {
      row(0, 'on', res.via + ' · ' + res.text.replace(/\s/g, '').length + '자');
      row(1, 'run');
      var p = A.analyze({ text: res.text, url: url, via: res.via, rawTitle: res.title });
      p.shots = st.shots.slice(0, 3);
      st.product = p;
      A.products.save(p);
      row(1, 'on', '혜택 ' + p.benefits.length + ' · 주의 ' + p.cautions.length);
      row(2, 'run');
      setTimeout(function () {
        row(2, 'on', '헤드라인 5안');
        st.busy = false;
        buildSheet(body);
      }, 260);
    }).catch(function (err) {
      st.busy = false;
      right.innerHTML = '<section class="panel"><div class="notice" style="background:#FFF6F6;border-color:#FFD9D9;color:#8A2F2F"><div>' +
        '<strong>읽지 못했어요.</strong><br>' + esc(err.message) +
        (err.tries ? '<br><span class="small">' + err.tries.map(function (t) { return esc(t.label + ': ' + t.msg); }).join(' · ') + '</span>' : '') +
        '<br><br>캡처 이미지를 올리거나, <b>사이트 분석하기</b>에서 본문을 붙여넣어 상품을 담은 뒤 불러와 주세요.</div></div></section>';
    });
  }

  function buildSheet(body, manual) {
    var p = st.product;
    if (!p && !manual) { App.toast('상품이 없어요.'); return; }
    var cs = p ? A.cheatSheet(p) : st.sheet;
    st.sheet = cs;
    st.headline = cs.headline[0] || '';
    H.$('#ch-custom', body).value = manual ? '' : st.headline;
    renderHeads(body);
    renderRight(body);
    if (manual) App.toast('카드를 만들었어요. 헤드라인을 직접 입력해 다듬어 보세요.');
    else App.toast('컨닝페이퍼를 만들었어요. 헤드라인을 골라 보세요.');
  }

  function renderHeads(body) {
    var box = H.$('#ch-heads', body);
    if (!box || !st.sheet) return;
    box.innerHTML = st.sheet.headline.map(function (h, i) {
      return '<div class="cand' + (h === st.headline ? ' pick' : '') + '">' +
        '<span class="f">' + (i + 1) + '안</span><span class="c">' + esc(h) + '</span>' +
        '<button class="btn btn-sm btn-soft" type="button" data-head="' + i + '">쓰기</button></div>';
    }).join('');
    box.onclick = function (e) {
      var b = e.target.closest('[data-head]');
      if (!b) return;
      var i = Number(b.getAttribute('data-head'));
      st.headline = st.sheet.headline[i];
      H.$('#ch-custom', body).value = st.headline;
      renderHeads(body); renderCard(body);
    };
  }

  function renderRight(body) {
    var right = H.$('#ch-right', body);
    if (!right) return;
    if (!st.sheet) {
      right.innerHTML = '<section class="panel"><div class="empty"><b>아직 컨닝페이퍼가 없어요</b>' +
        '왼쪽에서 상세페이지 주소·캡처·상품을 넣고 <b>컨닝페이퍼 만들기</b>를 눌러 주세요.<br>' +
        '왼쪽 원본과 오른쪽 재구성 카드를 나란히 놓고 비교할 수 있어요.</div></section>';
      return;
    }
    right.innerHTML =
      '<section class="panel"><h3>🔁 원본 → 재구성 카드</h3>' +
        '<p class="psub">왼쪽이 원본, 오른쪽이 광고용으로 다시 만든 카드입니다.</p>' +
        '<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin-top:12px">' +
          '<div id="ch-orig"></div>' +
          '<div style="width:34px;height:34px;border-radius:50%;background:var(--violet);color:#fff;display:grid;place-items:center;font-weight:800">→</div>' +
          '<div id="ch-card"></div>' +
        '</div>' +
        '<div class="actions"><button class="btn btn-primary" type="button" id="ch-save">사진 저장하기</button>' +
        '<button class="btn btn-ghost" type="button" id="ch-resave">카드 다시 그리기</button></div>' +
      '</section>' +
      '<section class="panel" id="ch-sets"></section>' +
      '<section class="panel" id="ch-audit"></section>';
    renderCard(body);
    renderCopySets(body);
    H.$('#ch-save', right).addEventListener('click', function () {
      if (!st.cardCanvas) { App.toast('카드를 먼저 만들어 주세요.'); return; }
      A.canvas.download(st.cardCanvas, 'cheat-sheet-' + Date.now().toString(36) + '.png');
      App.toast('카드를 저장했어요.');
    });
    H.$('#ch-resave', right).addEventListener('click', function () { renderCard(body); App.toast('카드를 다시 그렸어요.'); });
  }

  function renderCard(body) {
    var right = H.$('#ch-right', body);
    if (!right || !st.sheet) return;
    var orig = H.$('#ch-orig', right);
    var card = H.$('#ch-card', right);
    if (!orig || !card) return;

    /* 원본 */
    var shotSrc = st.shots[0] || (st.product && st.product.shots && st.product.shots[0]) || '';
    if (shotSrc) {
      orig.innerHTML = '<img src="' + shotSrc + '" alt="원본 상세페이지 캡처" style="width:100%;border-radius:10px;border:1px solid var(--line)">' +
        '<p class="hint" style="text-align:center">원본 캡처</p>';
    } else if (st.product) {
      orig.innerHTML = '<div class="graybox" style="max-height:260px;overflow:auto;font-size:11px">' +
        '<b>원본에서 읽은 내용</b><br>' + esc(A.cut(st.product.text || st.product.benefits.join(' / '), 320)) + '</div>' +
        '<p class="hint" style="text-align:center">텍스트 원본</p>';
    } else {
      orig.innerHTML = '<div class="empty" style="padding:24px 10px"><b>원본 없음</b>캡처를 올리면 여기에 나옵니다.</div>';
    }

    /* 카드 */
    var cs = {
      headline: [st.headline || (st.sheet.headline[0] || '')].concat(st.sheet.headline.slice(1)),
      sub: st.sheet.sub, bullets: st.sheet.bullets, cta: st.sheet.cta
    };
    var cv = paintSheet(st.product || { title: st.headline, category: '광고', benefits: [], domain: '' }, cs, {});
    st.cardCanvas = cv;
    card.innerHTML = '<img src="' + cv.toDataURL('image/png') + '" alt="재구성 광고 카드" style="width:100%;border-radius:10px;border:1px solid var(--line)">' +
      '<p class="hint" style="text-align:center">재구성 카드 1080×1350</p>';
  }

  function renderCopySets(body) {
    var right = H.$('#ch-right', body);
    if (!right || !st.sheet) return;
    var sets = H.$('#ch-sets', right);
    var audit = H.$('#ch-audit', right);
    var cs = st.sheet;
    if (sets) {
      sets.innerHTML = '<h3>✍️ 복사해서 쓰는 카피 세트</h3>' +
        '<div class="psub">헤드라인 · 서브 · 혜택 · CTA 순서로 붙여넣으면 됩니다.</div>' +
        '<div class="out" style="margin-top:10px">' +
          block('헤드라인 5안', cs.headline.join('\n'), 'h') +
          block('서브 카피 3안', cs.sub.join('\n'), 's') +
          block('혜택 4줄', cs.bullets.map(function (b) { return '· ' + b; }).join('\n'), 'b') +
          block('CTA 4안', cs.cta.join('\n'), 'c') +
          block('카드 한 장 요약 (전체 복사)', [cs.headline[0], cs.sub[0], ''].concat(cs.bullets.map(function (b) { return '· ' + b; })).concat(['', cs.cta[0]]).join('\n'), 'all') +
        '</div>';
      sets.onclick = function (e) {
        var b = e.target.closest('[data-copy-block]');
        if (!b) return;
        var map = { h: cs.headline.join('\n'), s: cs.sub.join('\n'), b: cs.bullets.map(function (x) { return '· ' + x; }).join('\n'), c: cs.cta.join('\n') };
        var key = b.getAttribute('data-copy-block');
        if (key === 'all') map.all = [cs.headline[0], cs.sub[0], ''].concat(cs.bullets.map(function (x) { return '· ' + x; })).concat(['', cs.cta[0]]).join('\n');
        App.copy(map[key] || '', b);
      };
    }
    if (audit) {
      var all = cs.headline.join(' ') + ' ' + cs.bullets.join(' ') + ' ' + cs.sub.join(' ');
      var found = A.bannedCheck(all);
      audit.innerHTML = '<h3>✅ 심사 · 필수 표기</h3>' +
        (found.length
          ? '<div class="graybox" style="margin-top:10px;background:#FFF6F6;border-color:#FFD9D9"><b style="color:#C63A3A">금칙 표현 ' + found.length + '건</b><br>' +
            found.map(function (f) { return esc(f.w) + ' → <b>' + esc(f.fix) + '</b>'; }).join('<br>') + '</div>'
          : '<div class="graybox" style="margin-top:10px;color:#158449"><b>금칙 표현 없음 ✓</b><br>최상급·보장·비방 표현이 발견되지 않았어요.</div>') +
        '<div class="graybox" style="margin-top:8px"><b>꼭 넣을 것</b><br>' +
          '· 가격·혜택의 조건(기간·약정·카드 조건)을 카드나 본문에 함께 적기<br>' +
          '· 사은품·할인은 종료일과 수량 명시<br>' +
          '· 실제로 확인한 숫자만 사용 (후기 수, 할인율)<br>' +
          '· 업종별 필수 고지(의료·금융·교육) 확인</div>' +
        (st.product ? '<div class="graybox" style="margin-top:8px"><b>읽어 온 주의사항</b><br>' +
          (st.product.cautions.length ? st.product.cautions.map(function (c) { return '· ' + esc(A.cut(c, 90)); }).join('<br>') : '페이지에서 별도 주의 문구를 찾지 못했어요. 상담 시 확인하세요.') + '</div>' : '');
    }
  }

  function block(title, text, key) {
    return '<div class="cardout"><div class="ch"><span class="t">' + esc(title) + '</span>' +
      '<button class="btn btn-sm btn-soft" type="button" data-copy-block="' + key + '">복사</button></div>' +
      '<div class="cb scroll">' + esc(text) + '</div></div>';
  }

  /* ---------------- 카피 사전 ---------------- */
  function renderLib(body) {
    body.innerHTML =
      '<div class="row2" style="align-items:end"><div class="field" style="margin-top:0"><label for="ch-q">검색</label>' +
        '<input id="ch-q" type="text" placeholder="예: 지역, 후기, 3분, CTA" value="' + esc(st.q) + '"></div>' +
        '<div class="field" style="margin-top:0"><label>종류</label><div class="chiprow" id="ch-kinds" style="margin-top:0">' +
          '<button class="chip' + (st.filter.kind === '전체' ? ' on' : '') + '" type="button" data-kind="전체">전체</button>' +
          KINDS.map(function (k) { return '<button class="chip' + (st.filter.kind === k ? ' on' : '') + '" type="button" data-kind="' + k + '">' + k + '</button>'; }).join('') +
        '</div></div></div>' +
      '<div class="chiprow" id="ch-purposes" style="margin-top:12px">' +
        '<button class="chip' + (st.filter.purpose === '전체' ? ' on' : '') + '" type="button" data-purpose="전체">전체 목적</button>' +
        PURPOSES.map(function (p) { return '<button class="chip' + (st.filter.purpose === p ? ' on' : '') + '" type="button" data-purpose="' + p + '">' + p + '</button>'; }).join('') +
      '</div>' +
      '<p class="hint" id="ch-count"></p>' +
      '<div class="cheatgrid" id="ch-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:12px;margin-top:14px"></div>' +
      '<div class="sep"></div>' +
      '<h3 style="font-size:14px">➕ 나만의 문구 추가</h3>' +
      '<div class="field"><label for="ch-new">문구</label><input id="ch-new" type="text" placeholder="예: 이번 주말, 가족과 함께"></div>' +
      '<div class="row2"><div class="field"><label for="ch-newp">목적</label><select id="ch-newp">' + PURPOSES.map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="ch-newk">종류</label><select id="ch-newk">' + KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field"><label for="ch-newn">메모</label><input id="ch-newn" type="text" placeholder="어떨 때 쓰는 문구인지"></div>' +
      '<div class="actions"><button class="btn btn-primary" type="button" id="ch-add">저장하기</button>' +
      '<button class="btn btn-ghost" type="button" id="ch-reset">내 문구 전체 삭제</button></div>';

    var el = { q: H.$('#ch-q', body), grid: H.$('#ch-grid', body) };

    function mine() { return S.get('cheat.mine', []); }
    function all() {
      return LIB.map(function (x, i) { return { id: 'lib' + i, p: x.p, k: x.k, t: x.t, n: x.n, lib: true }; })
        .concat(mine().map(function (x) { return { id: x.id, p: x.p, k: x.k, t: x.t, n: x.n, lib: false }; }));
    }
    function render() {
      var q = el.q.value.trim().toLowerCase();
      var list = all().filter(function (x) {
        if (st.filter.purpose !== '전체' && x.p !== st.filter.purpose) return false;
        if (st.filter.kind !== '전체' && x.k !== st.filter.kind) return false;
        if (q && (x.t + ' ' + x.n + ' ' + x.p).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      H.$('#ch-count', body).textContent = list.length + '개 문구 · 복사해서 바로 쓰세요.';
      if (!list.length) { el.grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><b>조건에 맞는 문구가 없어요</b>검색어나 필터를 바꿔보세요.</div>'; return; }
      el.grid.innerHTML = list.map(function (x) {
        return '<div class="ptcard"><div style="display:flex;gap:5px;flex-wrap:wrap"><span class="tag">' + esc(x.p) + '</span>' +
          '<span class="tag"' + (x.k === 'CTA' ? ' style="background:#F1ECFF;color:#4C24D6"' : '') + '>' + esc(x.k) + '</span>' +
          (x.lib ? '' : '<span class="tag ok">내 문구</span>') + '</div>' +
          '<b>' + esc(x.t) + '</b><p>' + esc(x.n || '') + '</p>' +
          '<div style="display:flex;gap:6px;margin-top:9px"><button class="btn btn-sm btn-soft" type="button" data-libcopy="' + esc(x.id) + '">복사</button>' +
          (x.lib ? '' : '<button class="btn btn-sm btn-danger" type="button" data-libdel="' + esc(x.id) + '">삭제</button>') + '</div></div>';
      }).join('');
    }

    el.q.addEventListener('input', function () { st.q = this.value; render(); });
    H.$('#ch-purposes', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-purpose]'); if (!b) return;
      st.filter.purpose = b.getAttribute('data-purpose');
      H.$$('#ch-purposes .chip', body).forEach(function (c) { c.classList.toggle('on', c === b); });
      render();
    });
    H.$('#ch-kinds', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-kind]'); if (!b) return;
      st.filter.kind = b.getAttribute('data-kind');
      H.$$('#ch-kinds .chip', body).forEach(function (c) { c.classList.toggle('on', c === b); });
      render();
    });
    el.grid.addEventListener('click', function (e) {
      var cp = e.target.closest('[data-libcopy]');
      if (cp) {
        var item = all().filter(function (x) { return x.id === cp.getAttribute('data-libcopy'); })[0];
        if (item) App.copy(item.t, cp);
        return;
      }
      var del = e.target.closest('[data-libdel]');
      if (del) {
        S.set('cheat.mine', mine().filter(function (x) { return x.id !== del.getAttribute('data-libdel'); }));
        render(); App.toast('내 문구를 삭제했어요.');
      }
    });
    H.$('#ch-add', body).addEventListener('click', function () {
      var t = H.$('#ch-new', body).value.trim();
      if (!t) { App.toast('문구를 입력해 주세요.'); return; }
      var list = mine();
      list.unshift({ id: H.uid('c'), p: H.$('#ch-newp', body).value, k: H.$('#ch-newk', body).value, t: t, n: H.$('#ch-newn', body).value.trim() });
      S.set('cheat.mine', list);
      H.$('#ch-new', body).value = ''; H.$('#ch-newn', body).value = '';
      render(); App.toast('내 문구로 저장했어요.');
    });
    H.$('#ch-reset', body).addEventListener('click', function () {
      if (!mine().length) { App.toast('저장한 문구가 없어요.'); return; }
      if (!window.confirm('내가 추가한 문구를 모두 지울까요?')) return;
      S.set('cheat.mine', []); render(); App.toast('내 문구를 비웠어요.');
    });
    render();
  }
})();
