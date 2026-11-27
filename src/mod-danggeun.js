/* =====================================================================
   Module 1 · 🥕 당근 광고 자판기 (상세페이지 → 제목 + 소재 이미지)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, A = App.ads;

  var DONG_DEFAULT = '공덕동';
  var BUTTONS = ['바로가기', '문의하기', '구매하기', '신청하기'];
  var BUDGETS = [5000, 10000, 20000];
  var DISCLOSURE = '#광고 이 글은 제휴(어필리에이트) 활동의 일환으로, 링크를 통해 가입·구매하시면 작성자에게 소정의 수수료가 지급될 수 있습니다.';

  var st = {
    product: null,
    titles: [],
    picked: '',
    custom: '',
    creatives: [],
    photos: [],
    adType: 'display',
    landing: 'profile',
    button: '바로가기',
    dong: DONG_DEFAULT,
    budget: 10000,
    days: 7,
    busy: false,
    phase: 'input' /* input | work | result */
  };

  function reset() {
    st.product = null; st.titles = []; st.picked = ''; st.custom = '';
    st.creatives = []; st.photos = []; st.busy = false; st.phase = 'input';
  }

  /* ---------------- 소재 이미지 그리기 ---------------- */
  function fitFont(ctx, text, maxW, start, min, weight) {
    var size = start;
    do {
      ctx.font = (weight || 800) + ' ' + size + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      if (ctx.measureText(text).width <= maxW) break;
      size -= 6;
    } while (size > min);
    return size;
  }

  function paint(p, opt) {
    opt = opt || {};
    var W = opt.w || 1080, Hh = opt.h || 1080;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = Hh;
    var ctx = cv.getContext('2d');
    var C = A.canvas;
    var variant = opt.variant || 'carrot';
    var title = opt.title || p.title;
    var price = p.price || '';
    var ben = (p.benefits || []).filter(function (b) { return !/찾지 못했/.test(b); })[0] || '';
    ben = A.trimPunct(ben).replace(/^[·・\-]\s*/, '');
    var photo = opt.photo || null;
    var dong = (st.dong || '').trim();

    if (variant === 'photo' && photo) {
      C.cover(ctx, photo, 0, 0, W, Hh);
      var gr = ctx.createLinearGradient(0, Hh * 0.35, 0, Hh);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.55, 'rgba(0,0,0,.55)');
      gr.addColorStop(1, 'rgba(0,0,0,.86)');
      ctx.fillStyle = gr; ctx.fillRect(0, Hh * 0.35, W, Hh * 0.65);
    } else if (variant === 'dark') {
      ctx.fillStyle = '#141418'; ctx.fillRect(0, 0, W, Hh);
      var rg = ctx.createRadialGradient(W * 0.85, Hh * 0.1, 30, W * 0.85, Hh * 0.1, W * 0.9);
      rg.addColorStop(0, 'rgba(99,56,245,.5)');
      rg.addColorStop(1, 'rgba(99,56,245,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, Hh);
    } else if (variant === 'clean') {
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, Hh);
      ctx.fillStyle = '#6338F5'; ctx.fillRect(0, 0, W, 16);
      ctx.fillStyle = '#F4F1FF'; ctx.fillRect(0, Hh - 150, W, 150);
    } else {
      var g = ctx.createLinearGradient(0, 0, W, Hh);
      g.addColorStop(0, '#FF7A22'); g.addColorStop(1, '#F2540B');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(W * 0.86, Hh * 0.14, W * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    var dark = (variant === 'dark' || variant === 'photo');
    var fg = dark ? '#FFFFFF' : (variant === 'clean' ? '#17171B' : '#FFFFFF');
    var sub = dark ? 'rgba(255,255,255,.72)' : (variant === 'clean' ? '#6D6D7A' : 'rgba(255,255,255,.88)');
    ctx.textBaseline = 'top';

    /* 상단 배지 */
    var badge = dong ? dong + ' 이웃' : '동네 이웃';
    ctx.font = '800 34px Pretendard, "Apple SD Gothic Neo", sans-serif';
    var bw = ctx.measureText(badge).width + 44;
    ctx.fillStyle = dark ? 'rgba(255,255,255,.16)' : (variant === 'clean' ? '#F1ECFF' : 'rgba(255,255,255,.22)');
    C.roundRect(ctx, 72, 72, bw, 62, 31); ctx.fill();
    ctx.fillStyle = variant === 'clean' ? '#4C24D6' : '#FFFFFF';
    ctx.fillText(badge, 94, 87);

    /* 상단 브랜드(검색광고형) */
    if (p.domain) {
      ctx.font = '700 30px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillStyle = sub; ctx.textAlign = 'right';
      ctx.fillText(A.cut(p.domain, 26), W - 72, 92);
      ctx.textAlign = 'left';
    }

    var y;
    if (variant === 'dark') {
      /* 큰 가격 */
      if (price) {
        ctx.font = '800 46px Pretendard, "Apple SD Gothic Neo", sans-serif';
        ctx.fillStyle = sub; ctx.fillText('지금 조건', 72, 300);
        var ps = fitFont(ctx, price, W - 144, 168, 56, 800);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(price, 72, 360);
        y = 360 + ps + 70;
      } else {
        y = 330;
      }
      ctx.font = '800 74px Pretendard, "Apple SD Gothic Neo", sans-serif';
      var tl = C.wrap(ctx, title, W - 144);
      y = C.drawLines(ctx, tl, 72, y, 92, 4);
      y += 46;
      ctx.font = '600 38px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillStyle = sub;
      var bl = C.wrap(ctx, ben || '자세한 조건은 프로필에서 확인하세요', W - 144);
      C.drawLines(ctx, bl, 72, y, 56, 3);
      ctx.fillStyle = '#6338F5'; ctx.fillRect(0, Hh - 132, W, 132);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '800 40px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillText(st.button + '  →', 72, Hh - 92);
    } else if (variant === 'clean') {
      y = 210;
      ctx.fillStyle = '#FF6F0F';
      ctx.font = '800 40px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillText(A.cut(p.category || '동네 광고', 20), 72, y - 60);
      ctx.fillStyle = fg;
      ctx.font = '800 84px Pretendard, "Apple SD Gothic Neo", sans-serif';
      var tl2 = C.wrap(ctx, title, W - 144);
      y = C.drawLines(ctx, tl2, 72, y, 104, 4);
      if (price) {
        y += 40;
        ctx.fillStyle = '#17171B';
        var ps2 = fitFont(ctx, price, W - 144, 104, 48, 800);
        ctx.fillStyle = '#FF6F0F';
        ctx.fillText(price, 72, y);
        y += ps2 + 30;
      }
      if (ben) {
        ctx.fillStyle = '#45454F';
        ctx.font = '600 38px Pretendard, "Apple SD Gothic Neo", sans-serif';
        C.drawLines(ctx, C.wrap(ctx, ben, W - 144), 72, y, 56, 3);
      }
      ctx.fillStyle = '#17171B'; ctx.font = '800 36px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillText(st.button + ' →', 72, Hh - 88);
    } else if (variant === 'photo' && photo) {
      var ty = Hh - 430;
      if (price) {
        ctx.font = '800 40px Pretendard, "Apple SD Gothic Neo", sans-serif';
        var pw = ctx.measureText(price).width + 56;
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        C.roundRect(ctx, 72, ty - 96, pw, 72, 20); ctx.fill();
        ctx.fillStyle = '#FF6F0F'; ctx.fillText(price, 100, ty - 76);
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 78px Pretendard, "Apple SD Gothic Neo", sans-serif';
      var tl3 = C.wrap(ctx, title, W - 144);
      y = C.drawLines(ctx, tl3, 72, ty, 94, 4);
      if (ben) {
        ctx.fillStyle = 'rgba(255,255,255,.82)';
        ctx.font = '600 36px Pretendard, "Apple SD Gothic Neo", sans-serif';
        C.drawLines(ctx, C.wrap(ctx, ben, W - 144), 72, y + 18, 52, 2);
      }
    } else {
      /* carrot */
      var by = 330;
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.font = '700 36px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillText(A.cut(p.category || '동네 혜택', 24), 72, by - 60);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 88px Pretendard, "Apple SD Gothic Neo", sans-serif';
      var tl4 = C.wrap(ctx, title, W - 144);
      y = C.drawLines(ctx, tl4, 72, by, 110, 4);
      y += 34;
      if (price) {
        var ps3 = fitFont(ctx, price, W - 144, 120, 56, 800);
        ctx.fillStyle = '#FFF3B0';
        ctx.font = '800 ' + ps3 + 'px Pretendard, "Apple SD Gothic Neo", sans-serif';
        ctx.fillText(price, 72, y);
        y += ps3 + 22;
      }
      if (ben) {
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.font = '600 38px Pretendard, "Apple SD Gothic Neo", sans-serif';
        var bl2 = C.wrap(ctx, ben, W - 144);
        y = C.drawLines(ctx, bl2, 72, y, 54, 3);
      }
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, Hh - 122, W, 122);
      ctx.fillStyle = '#FFFFFF'; ctx.font = '800 38px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillText(st.button + '  →', 72, Hh - 86);
    }

    /* 하단 안내 */
    ctx.font = '600 26px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = dark ? 'rgba(255,255,255,.5)' : (variant === 'clean' ? '#9C9CA8' : 'rgba(255,255,255,.72)');
    ctx.textAlign = 'right';
    ctx.fillText('광고 · 조건은 신청 페이지에서 확인', W - 72, Hh - (variant === 'clean' ? 46 : 46));
    ctx.textAlign = 'left';
    return cv;
  }

  /* ---------------- 화면 ---------------- */
  function shell(root) {
    root.innerHTML =
      '<div class="cols">' +
        '<div class="stack" id="dg-left"></div>' +
        '<div class="stack" id="dg-right"></div>' +
      '</div>';
    return { left: H.$('#dg-left', root), right: H.$('#dg-right', root) };
  }

  function renderInput(box) {
    var saved = A.products.list();
    box.innerHTML =
      '<section class="stepcard"><div class="sh"><span class="sno">1</span>' +
        '<div><b>상세페이지에서 광고 만들기</b><span class="ss">상세페이지 주소를 넣으면 제목 후보와 소재 이미지를 자동으로 만들어요.</span></div></div>' +
        '<div class="field"><label for="dg-url">상세페이지 주소</label>' +
        '<input id="dg-url" type="text" inputmode="url" placeholder="https://... 광고할 상품 상세페이지"></div>' +
        '<div class="field"><label for="dg-load">또는 전에 등록한 상품 불러오기</label>' +
        '<select id="dg-load">' + A.products.options('', '전에 등록한 상품 불러오기') + '</select>' +
        (saved.length ? '<p class="tip">보관함에 ' + saved.length + '개 상품이 있어요. 고르면 바로 2단계로 넘어갑니다.</p>' : '<p class="tip">보관함이 비어 있다면 <b>사이트 분석하기</b>에서 먼저 상품을 담아 두세요.</p>') +
        '</div>' +
        '<details style="margin-top:12px"><summary style="cursor:pointer;font-size:12.5px;font-weight:800;color:var(--violet-d)">직접 입력으로 시작하기</summary>' +
          '<div class="field"><label for="dg-m-title">상품 이름</label><input id="dg-m-title" type="text" placeholder="예: 타이어 4본 렌탈"></div>' +
          '<div class="row2"><div class="field"><label for="dg-m-price">가격</label><input id="dg-m-price" type="text" placeholder="예: 월 3,000원부터"></div>' +
          '<div class="field"><label for="dg-m-benefit">대표 혜택</label><input id="dg-m-benefit" type="text" placeholder="예: 장착 후 상품권 3만원"></div></div>' +
          '<div class="actions"><button class="btn btn-soft btn-block" type="button" id="dg-manual">직접 입력으로 만들기</button></div>' +
        '</details>' +
        '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="dg-go">당근 광고 만들기</button></div>' +
        '<p class="hint">읽기가 막히는 사이트는 사이트 분석하기의 <b>본문 붙여넣기</b>로 상품을 먼저 담아 주세요.</p>' +
      '</section>' +
      '<section class="stepcard off"><div class="sh"><span class="sno">2</span>' +
        '<div><b>광고 설정</b><span class="ss">광고 종류·랜딩·지역·예산·기간을 정합니다. (1단계 뒤에 열려요)</span></div></div></section>';

    H.$('#dg-go', box).addEventListener('click', function () {
      var url = A.normalizeUrl(H.$('#dg-url', box).value);
      if (!url) { App.toast('상세페이지 주소를 넣거나, 전에 등록한 상품을 골라 주세요.'); H.$('#dg-url', box).focus(); return; }
      readAndBuild(box, url);
    });
    H.$('#dg-load', box).addEventListener('change', function () {
      var id = this.value;
      if (!id) return;
      var p = A.products.get(id);
      if (!p) return;
      st.product = p;
      buildAll(box, '보관함에서 불러옴 · ' + (p.via || '저장된 분석'));
    });
    H.$('#dg-manual', box).addEventListener('click', function () {
      var t = H.$('#dg-m-title', box).value.trim();
      if (!t) { App.toast('상품 이름을 넣어 주세요.'); return; }
      var p = A.analyze({
        text: [t, H.$('#dg-m-price', box).value, H.$('#dg-m-benefit', box).value].filter(Boolean).join('\n'),
        rawTitle: t, via: '직접 입력'
      });
      p.price = H.$('#dg-m-price', box).value.trim() || p.price;
      var b = H.$('#dg-m-benefit', box).value.trim();
      if (b) p.benefits = [b].concat(p.benefits);
      st.product = p;
      buildAll(box, '직접 입력');
    });
  }

  function readAndBuild(box, url) {
    if (st.busy) return;
    st.busy = true;
    box.innerHTML =
      '<section class="stepcard"><div class="sh"><span class="sno">1</span><div><b>상세페이지 읽는 중</b><span class="ss">' + esc(url) + '</span></div></div>' +
      '<div id="dg-prog" style="margin-top:12px">' + A.progressHtml('사이트 분석 중', [
        { label: '주소 확인' }, { label: '페이지 읽기' }, { label: '상품 정보 정리' }, { label: '제목·이미지 준비' }
      ]) + '</div></section>';
    var box2 = H.$('.aiwork', box);
    function setRow(i, cls, msg) {
      var r = H.$('[data-prow="' + i + '"]', box2);
      if (!r) return;
      r.className = 'airow ' + cls;
      if (msg) H.$('.pmsg', r).textContent = msg;
    }
    setRow(0, 'on', A.domainOf(url));
    setRow(1, 'run', '여러 경로 시도');
    A.readPage(url, function (s) {
      if (s.phase === 'try') setRow(1, 'run', s.label + ' 시도');
      if (s.phase === 'ok') setRow(1, 'on', s.label + ' · ' + s.chars + '자');
      if (s.phase === 'fail') setRow(1, 'run', s.label + ' 실패 → 다음');
    }).then(function (res) {
      setRow(1, 'on', res.via + ' · ' + res.text.replace(/\s/g, '').length + '자');
      setRow(2, 'run');
      var p = A.analyze({ text: res.text, url: url, via: res.via, rawTitle: res.title });
      setRow(2, 'on', '혜택 ' + p.benefits.length + ' · 고객 3 · 소구점 ' + p.points.length);
      setRow(3, 'run');
      st.product = p;
      A.products.save(p);
      setTimeout(function () {
        setRow(3, 'on', '제목 10안 준비');
        st.busy = false;
        buildAll(box, res.via);
      }, 320);
    }).catch(function (err) {
      st.busy = false;
      box.innerHTML =
        '<section class="stepcard"><div class="sh"><span class="sno">1</span><div><b>읽지 못했어요</b><span class="ss">' + esc(err.message) + '</span></div></div>' +
        '<div class="notice" style="margin-top:12px;background:#FFF6F6;border-color:#FFD9D9;color:#8A2F2F"><div>' +
        (err.tries ? err.tries.map(function (t) { return esc(t.label + ': ' + t.msg); }).join('<br>') + '<br><br>' : '') +
        '① <b>사이트 분석하기</b>에서 본문을 붙여넣어 상품을 담은 뒤 여기서 불러오거나 ② 아래에 상품 이름·가격·혜택을 직접 넣어 주세요.' +
        '</div></div>' +
        '<div class="field"><label for="dg-m-title">상품 이름</label><input id="dg-m-title" type="text" placeholder="예: 타이어 4본 렌탈"></div>' +
        '<div class="row2"><div class="field"><label for="dg-m-price">가격</label><input id="dg-m-price" type="text"></div>' +
        '<div class="field"><label for="dg-m-benefit">대표 혜택</label><input id="dg-m-benefit" type="text"></div></div>' +
        '<div class="actions"><button class="btn btn-primary" type="button" id="dg-manual2">직접 입력으로 만들기</button>' +
        '<button class="btn btn-ghost" type="button" id="dg-retry">주소 다시 넣기</button></div></section>';
      H.$('#dg-manual2', box).addEventListener('click', function () {
        var t = H.$('#dg-m-title', box).value.trim();
        if (!t) { App.toast('상품 이름을 넣어 주세요.'); return; }
        var p = A.analyze({ text: [t, H.$('#dg-m-price', box).value, H.$('#dg-m-benefit', box).value].join('\n'), rawTitle: t, via: '직접 입력' });
        p.price = H.$('#dg-m-price', box).value.trim() || p.price;
        st.product = p;
        buildAll(box, '직접 입력');
      });
      H.$('#dg-retry', box).addEventListener('click', function () { renderInput(box); });
    });
  }

  /* ---------------- 2단계 설정 + 결과 ---------------- */
  function buildAll(box, via) {
    st.phase = 'result';
    st.titles = A.carrotTitles(st.product, { dong: st.dong });
    st.picked = st.titles.length ? st.titles[0].text : st.product.title;
    st.custom = '';
    renderSetup(box, via);
    renderResult(box);
    regenerate();
  }

  function renderSetup(box, via) {
    var p = st.product;
    box.innerHTML =
      '<section class="stepcard"><div class="sh"><span class="sno">1</span>' +
        '<div><b>상세페이지</b><span class="ss">' + esc(p.domain || '직접 입력') + ' · ' + esc(via || '') + '</span></div>' +
        '<button class="btn btn-sm btn-line sact" type="button" id="dg-restart">바꾸기</button></div>' +
        '<div class="sumline"><em>' + esc(p.title) + '</em>' + (p.price ? ' · ' + esc(p.price) : '') + '</div>' +
        (p.benefits && p.benefits[0] ? '<div class="sumline muted">' + esc(A.cut(p.benefits[0], 90)) + '</div>' : '') +
      '</section>' +
      '<section class="stepcard"><div class="sh"><span class="sno">2</span>' +
        '<div><b>광고 설정</b><span class="ss">당근비즈니스 간편모드 기준이에요.</span></div></div>' +
        '<div class="field"><label>광고 종류</label><div class="seg" id="dg-type">' +
          '<button type="button" class="' + (st.adType === 'display' ? 'on' : '') + '" data-type="display">디스플레이광고</button>' +
          '<button type="button" class="' + (st.adType === 'search' ? 'on' : '') + '" data-type="search">검색광고</button>' +
        '</div></div>' +
        '<div class="row2"><div class="field"><label for="dg-dong">동네</label><input id="dg-dong" type="text" value="' + esc(st.dong) + '" placeholder="예: 공덕동"></div>' +
        '<div class="field"><label for="dg-budget">하루 예산</label><select id="dg-budget">' +
          BUDGETS.map(function (b) { return '<option value="' + b + '"' + (st.budget === b ? ' selected' : '') + '>' + A.won(b) + '원</option>'; }).join('') +
        '</select></div></div>' +
        '<div class="row2"><div class="field"><label for="dg-days">기간</label><select id="dg-days">' +
          [2, 3, 7, 14, 30].map(function (d) { return '<option value="' + d + '"' + (st.days === d ? ' selected' : '') + '>' + d + '일</option>'; }).join('') +
        '</select></div>' +
        '<div class="field"><label for="dg-landing">랜딩</label><select id="dg-landing">' +
          '<option value="profile"' + (st.landing === 'profile' ? ' selected' : '') + '>비즈프로필</option>' +
          '<option value="site"' + (st.landing === 'site' ? ' selected' : '') + '>웹사이트 URL</option>' +
        '</select></div></div>' +
        '<div class="field"><label>버튼</label><div class="chiprow" id="dg-btns" style="margin-top:0">' +
          BUTTONS.map(function (b) { return '<button class="chip' + (st.button === b ? ' on' : '') + '" type="button" data-btn="' + b + '">' + b + '</button>'; }).join('') +
        '</div></div>' +
        '<div class="field"><label>사진 <span class="muted small">(있으면 소재에 사진을 깔아요 · 선택)</span></label>' +
          '<div class="actions" style="margin-top:0"><label class="btn btn-line" for="dg-photo" style="cursor:pointer">📷 사진 올리기</label>' +
          '<input id="dg-photo" type="file" accept="image/*" multiple hidden>' +
          (st.photos.length ? '<button class="btn btn-ghost" type="button" id="dg-photoclr">사진 비우기</button>' : '') +
          '</div>' +
          (st.photos.length ? '<p class="tip">' + st.photos.length + '장 올림 — 소재 B부터 사진 배경으로 씁니다.</p>' : '') +
        '</div>' +
      '</section>';

    H.$('#dg-restart', box).addEventListener('click', function () { reset(); renderInput(box); renderRightEmpty(); });
    H.$('#dg-type', box).addEventListener('click', function (e) {
      var b = e.target.closest('[data-type]'); if (!b) return;
      st.adType = b.getAttribute('data-type');
      H.$$('#dg-type button', box).forEach(function (x) { x.classList.toggle('on', x === b); });
    });
    H.$('#dg-dong', box).addEventListener('input', function () {
      st.dong = this.value;
      st.titles = A.carrotTitles(st.product, { dong: st.dong });
      renderTitles();
    });
    H.$('#dg-budget', box).addEventListener('change', function () { st.budget = Number(this.value); renderSetting(); });
    H.$('#dg-days', box).addEventListener('change', function () { st.days = Number(this.value); renderSetting(); });
    H.$('#dg-landing', box).addEventListener('change', function () { st.landing = this.value; });
    H.$('#dg-btns', box).addEventListener('click', function (e) {
      var b = e.target.closest('[data-btn]'); if (!b) return;
      st.button = b.getAttribute('data-btn');
      H.$$('#dg-btns .chip', box).forEach(function (x) { x.classList.toggle('on', x === b); });
      regenerate();
    });
    H.$('#dg-photo', box).addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []).slice(0, 5);
      if (!files.length) return;
      var loaded = 0;
      files.forEach(function (f) {
        A.loadImage(f).then(function (img) {
          st.photos.push(img);
          loaded++;
          if (loaded === files.length) { renderSetup(box, via); regenerate(); App.toast('사진 ' + files.length + '장을 올렸어요.'); }
        }, function (e) { App.toast(e.message); });
      });
      this.value = '';
    });
    var clr = H.$('#dg-photoclr', box);
    if (clr) clr.addEventListener('click', function () { st.photos = []; renderSetup(box, via); regenerate(); });
  }

  function renderRightEmpty() {
    if (!els.right) return;
    els.right.innerHTML = '<section class="panel"><div class="empty"><b>아직 만든 광고가 없어요</b>' +
      '왼쪽에서 상세페이지 주소를 넣고 <b>당근 광고 만들기</b>를 눌러 주세요. 제목 후보·이미지·미리보기가 여기에 나옵니다.</div></section>';
  }

  /* ---------------- 실제 결과 렌더 ---------------- */
  var els = {};

  function renderResult(rootBox) {
    var right = els.right;
    if (!right || !st.product) return;
    var p = st.product;
    right.innerHTML =
      '<section class="panel"><h3>✏️ 광고 제목 고르기 <span class="pill" id="dg-tcount">' + st.titles.length + '</span></h3>' +
        '<p class="psub">제목은 <b>30자</b>까지 표시돼요. 30자를 넘으면 당근에서 동네 이름이 “우리 동네”로 바뀌어 보입니다. 마음에 드는 걸 고르고 복사하세요.</p>' +
        '<div id="dg-titles" style="margin-top:11px"></div>' +
        '<div class="field" style="margin-top:12px"><label for="dg-custom">고른 제목 고치기</label>' +
          '<input id="dg-custom" type="text" maxlength="60" placeholder="제목을 직접 다듬어 보세요">' +
          '<p class="tip" id="dg-customcount">0자 / 30자</p></div>' +
        '<div class="actions"><button class="btn btn-primary" type="button" id="dg-copyfinal">고른 제목 복사하기</button>' +
        '<button class="btn btn-soft" type="button" id="dg-regen">제목 다시 뽑기</button></div>' +
      '</section>' +
      '<section class="panel"><h3>🖼 광고 이미지 <span class="pill">' + st.creatives.length + '</span></h3>' +
        '<p class="psub">당근 규격 1080×1080 PNG. 세트마다 제목과 디자인을 다르게 만들어 A/B 테스트에 쓰세요.</p>' +
        '<div class="creatives" id="dg-creatives" style="margin-top:12px"></div>' +
        '<div class="actions"><button class="btn btn-soft btn-block" type="button" id="dg-allpng">이미지 전체 다운로드</button></div>' +
      '</section>' +
      '<section class="panel"><h3>📱 당근 피드 미리보기</h3>' +
        '<div id="dg-feed" style="margin-top:12px"></div>' +
      '</section>' +
      '<section class="panel"><h3>✅ 심사 체크</h3><div id="dg-review" style="margin-top:10px"></div></section>' +
      '<section class="panel"><h3>⚙️ 집행 설정표</h3><div id="dg-setting" style="margin-top:10px"></div>' +
        '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="dg-copyset">설정표 복사</button></div>' +
      '</section>' +
      '<section class="panel"><h3>📣 동네 홍보글 3종 <span class="muted small">(기존 기능)</span></h3>' +
        '<p class="psub">당근·스레드·지역 카페에 올릴 글도 같은 상품 정보로 만들어 드려요.</p>' +
        '<div class="out" id="dg-promo" style="margin-top:10px"></div>' +
      '</section>';

    var custom = H.$('#dg-custom', right);
    custom.value = st.custom || '';
    custom.addEventListener('input', function () {
      st.custom = this.value;
      var n = this.value.length;
      H.$('#dg-customcount', right).textContent = n + '자 / 30자' + (n > 30 ? ' — 30자를 넘으면 동네 이름이 “우리 동네”로 보여요' : '');
      st.picked = this.value || (st.titles[0] ? st.titles[0].text : p.title);
      updateFeed();
    });

    H.$('#dg-copyfinal', right).addEventListener('click', function () {
      App.copy(currentTitle(), this);
    });
    H.$('#dg-regen', right).addEventListener('click', function () {
      st.titles = A.carrotTitles(p, { dong: st.dong }).reverse().slice(0, 10);
      renderTitles();
      App.toast('제목을 다시 뽑았어요.');
    });
    H.$('#dg-allpng', right).addEventListener('click', function () {
      if (!st.creatives.length) { App.toast('이미지를 먼저 만들어 주세요.'); return; }
      var i = 0;
      (function next() {
        if (i >= st.creatives.length) { App.toast('저장을 시작했어요. 여러 파일 저장을 물으면 허용해 주세요.'); return; }
        var c = st.creatives[i++];
        A.canvas.download(c.canvas, 'danggeun-' + c.key + '-' + Date.now().toString(36) + '.png');
        setTimeout(next, 420);
      })();
    });
    H.$('#dg-copyset', right).addEventListener('click', function () {
      App.copy(settingText(), this);
    });

    H.$('#dg-creatives', right).addEventListener('click', function (e) {
      var b = e.target.closest('[data-csave]');
      if (!b) return;
      var c = st.creatives.filter(function (x) { return x.key === b.getAttribute('data-csave'); })[0];
      if (!c) return;
      A.canvas.download(c.canvas, 'danggeun-' + c.key + '.png');
      App.toast('세트 ' + c.key + ' 이미지를 저장했어요.');
    });

    renderTitles();
    renderCreativeGrid();
    updateFeed();
    renderReview();
    renderSetting();
    renderPromo();
  }

  function currentTitle() {
    var t = (st.custom || '').trim();
    return t || st.picked || (st.product ? st.product.title : '');
  }

  function renderTitles() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#dg-titles', right);
    if (!box) return;
    box.innerHTML = st.titles.map(function (t, i) {
      return '<div class="cand' + (t.text === currentTitle() ? ' pick' : '') + '">' +
        '<span class="f">' + esc(t.formula || '제목') + '</span>' +
        '<span class="c">' + esc(t.text) + '</span>' +
        '<span class="n' + (t.chars > 30 ? ' over' : '') + '">' + t.chars + '</span>' +
        '<button class="btn btn-sm btn-soft" type="button" data-pick="' + i + '">복사</button>' +
        '</div>';
    }).join('');
    H.$('#dg-tcount', right).textContent = st.titles.length;
    box.onclick = function (e) {
      var b = e.target.closest('[data-pick]');
      if (!b) return;
      var t = st.titles[Number(b.getAttribute('data-pick'))];
      if (!t) return;
      st.picked = t.text; st.custom = '';
      H.$('#dg-custom', right).value = '';
      H.$('#dg-customcount', right).textContent = '0자 / 30자';
      renderTitles(); updateFeed();
      App.copy(t.text, b);
    };
  }

  function regenerate() {
    if (!st.product) return;
    var p = st.product;
    var variants = ['carrot', 'dark', 'photo', 'clean', 'carrot'];
    st.creatives = [];
    for (var i = 0; i < 5; i++) {
      var t = st.titles[i] ? st.titles[i].text : p.title;
      var v = variants[i];
      var photo = st.photos.length ? st.photos[i % st.photos.length] : null;
      if (v === 'photo' && !photo) v = i % 2 ? 'clean' : 'dark';
      var cv = paint(p, { variant: v, title: t, photo: photo });
      st.creatives.push({ key: String.fromCharCode(65 + i), title: t, variant: v, canvas: cv });
    }
    renderCreativeGrid();
    updateFeed();
    renderReview();
  }

  function renderCreativeGrid() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#dg-creatives', right);
    if (!box) return;
    box.innerHTML = st.creatives.map(function (c) {
      return '<div class="creative"><img src="' + c.canvas.toDataURL('image/png') + '" alt="세트 ' + c.key + ' 광고 이미지">' +
        '<div class="cf"><span>세트 ' + c.key + '</span>' +
        '<button class="btn btn-sm btn-soft" type="button" data-csave="' + c.key + '">저장</button></div></div>';
    }).join('');
  }

  function updateFeed() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#dg-feed', right);
    if (!box || !st.product) return;
    var p = st.product;
    var img = st.creatives.length ? st.creatives[0].canvas.toDataURL('image/png') : '';
    var t = currentTitle();
    var priceLabel = p.price ? p.price : (p.benefits[0] ? A.cut(p.benefits[0], 22) : '조건 확인');
    box.innerHTML = '<div class="dgphone">' +
      '<div class="rho"><i>🥕</i><span>당근</span><span style="margin-left:auto;color:#9C9CA8;font-weight:700">' + esc(st.dong || '내 동네') + '</span></div>' +
      '<div class="ph">' + (img ? '<img src="' + img + '" alt="광고 이미지">' : '<div class="non">소재 이미지가 여기에 나옵니다</div>') + '</div>' +
      '<h4>' + esc(t) + '</h4>' +
      '<div class="pr">' + esc(priceLabel) + '</div>' +
      '<div class="mt">' + esc(st.dong || '동네') + ' · ' + esc(st.button) + ' · 광고</div>' +
      '<div class="chipsm"><span>' + (st.adType === 'search' ? '검색광고' : '디스플레이광고') + '</span><span>' + (st.landing === 'site' ? '웹사이트' : '비즈프로필') + '</span></div>' +
      '</div>' +
      '<p class="hint">제목 ' + t.length + '자 · 이미지 ' + (img ? '1080×1080' : '없음') + '</p>';
  }

  function renderReview() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#dg-review', right);
    if (!box || !st.product) return;
    var text = [currentTitle()].concat(st.product.benefits || []).join(' ');
    var found = A.bannedCheck(text);
    var over = currentTitle().length > 30;
    var noPhoto = !st.photos.length;
    var rows = [];
    if (found.length) {
      rows.push('<div class="graybox" style="background:#FFF6F6;border-color:#FFD9D9"><b style="color:#C63A3A">금칙 표현 ' + found.length + '건</b><br>' +
        found.map(function (f) { return esc(f.w) + ' → <b>' + esc(f.fix) + '</b>'; }).join('<br>') + '</div>');
    } else {
      rows.push('<div class="graybox" style="color:#158449"><b>금칙 표현 없음 ✓</b><br>최상급·보장·비방 표현이 제목과 혜택에서 발견되지 않았어요.</div>');
    }
    if (over) rows.push('<div class="graybox" style="margin-top:8px"><b>제목 ' + currentTitle().length + '자</b><br>30자를 넘어 동네 이름이 “우리 동네”로 표시됩니다. 줄이는 편이 좋아요.</div>');
    if (noPhoto) rows.push('<div class="graybox" style="margin-top:8px"><b>사진을 올리면 더 좋아요</b><br>당근은 직접 찍은 자연스러운 사진이 유리합니다. 지금은 글자 소재만 있습니다.</div>');
    rows.push('<div class="graybox" style="margin-top:8px"><b>심사 안내</b><br>영업일 1~2일. 사진·문구·랜딩·업종을 모두 봅니다. 아래 표현은 증빙이 없으면 지워 주세요.<br>' +
      '<span class="small">최고·최저·1위·유일·완벽 / 100%·보장·무조건·부작용 없음 / 경쟁사 실명 비교 / 당근 로고·남의 사진</span></div>');
    box.innerHTML = rows.join('');
  }

  function monthlyCost() {
    var daily = st.budget || 0;
    return daily * Math.min(st.days, 30);
  }
  function settingText() {
    var p = st.product || {};
    return [
      '[당근 광고 집행 설정]',
      '· 상품: ' + (p.title || ''),
      '· 광고 종류: ' + (st.adType === 'search' ? '검색광고' : '디스플레이광고'),
      '· 랜딩: ' + (st.landing === 'site' ? '웹사이트 URL · ' + (p.url || '') : '비즈프로필') + ' / 버튼: ' + st.button,
      '· 지역: ' + (st.dong || '') + ' (최소 3만 명 이상 권장)',
      '· 하루 예산: ' + A.won(st.budget) + '원 · 기간 ' + st.days + '일 · 최대 지출 ' + A.won(monthlyCost()) + '원',
      '· 소재: 제목 ' + st.creatives.length + '세트 + 이미지 ' + st.creatives.length + '장',
      '· 제목: ' + currentTitle(),
      '',
      '※ 클릭당 과금(CPC). 노출만으로는 지출되지 않고, 예산을 다 쓰면 그날은 멈춥니다.'
    ].join('\n');
  }
  function renderSetting() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#dg-setting', right);
    if (!box) return;
    box.innerHTML =
      '<div class="kv"><b>광고 종류</b><span>' + (st.adType === 'search' ? '검색광고 (사진+제목+소개)' : '디스플레이광고 (피드 카드형)') + '</span></div>' +
      '<div class="kv"><b>랜딩</b><span>' + (st.landing === 'site' ? '웹사이트 URL' : '비즈프로필') + ' · 버튼 ' + esc(st.button) + '</span></div>' +
      '<div class="kv"><b>지역</b><span>' + esc(st.dong || '—') + ' · 최소 3만 명 이상 권장</span></div>' +
      '<div class="kv"><b>하루 예산</b><span>' + A.won(st.budget) + '원 (최소 5,000원)</span></div>' +
      '<div class="kv"><b>기간</b><span>' + st.days + '일 · 최대 ' + A.won(monthlyCost()) + '원</span></div>' +
      '<div class="kv"><b>소재</b><span>' + st.creatives.length + '세트 (제목·이미지 각각 다르게)</span></div>' +
      '<p class="hint">검색광고 클릭당 최대비용은 90~100,000원. 높을수록 상단에 노출됩니다.</p>';
  }

  /* ---------------- 홍보글 (기존 기능 유지) ---------------- */
  function promoTexts(p) {
    var title = currentTitle();
    var ben = (p.benefits || [])[0] || '';
    var link = A.isLive(p.url) ? p.url : '(상세페이지 링크를 넣어 주세요)';
    var tag = '#' + String(p.category || '동네정보').replace(/[·\s]/g, '');
    return [
      {
        label: '① 당근 비즈프로필 / 동네홍보',
        text: ['🥕 ' + title, '', ben, '', (st.dong || '동네') + ' 이웃님들께 먼저 알려드려요. 궁금한 건 편하게 채팅 주세요!',
          '👉 ' + link, '', '#광고 #동네정보 ' + tag, DISCLOSURE].join('\n')
      },
      {
        label: '② 스레드 / 인스타그램',
        text: ['🥕 ' + title, ben, '', '요즘 제일 많이 물어보는 그거, 정리해뒀어요 👇', link, '', '저장해두고 필요할 때 보세요 🌱',
          '#생활혜택 #동네꿀팁 #제휴링크', DISCLOSURE].join('\n')
      },
      {
        label: '③ 지역 카페',
        text: ['[정보] ' + title, '', '안녕하세요, 동네 소식 공유드립니다.', '· 혜택: ' + (ben || '-'), '· 특징: ' + A.cut((p.benefits[1] || ''), 60),
          '· 자세히 보기: ' + link, '', '관심 있으신 분들은 링크 확인해보시고, 궁금한 점은 댓글로 남겨주세요.', '', '※ ' + DISCLOSURE].join('\n')
      }
    ];
  }
  function renderPromo() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#dg-promo', right);
    if (!box || !st.product) return;
    var list = promoTexts(st.product);
    box.innerHTML = list.map(function (v, i) {
      return '<div class="cardout"><div class="ch"><span class="t">' + esc(v.label) + '</span>' +
        '<button class="btn btn-sm btn-soft" type="button" data-promo="' + i + '">복사</button></div>' +
        '<div class="cb scroll">' + esc(v.text) + '</div></div>';
    }).join('');
    box.onclick = function (e) {
      var b = e.target.closest('[data-promo]');
      if (!b) return;
      App.copy(list[Number(b.getAttribute('data-promo'))].text, b);
    };
  }

  /* ---------------- 등록 ---------------- */
  App.register({
    id: 'danggeun', emoji: '🥕', name: '당근 광고 자판기', free: false, tag: '당근 · 소재',
    desc: '상세페이지 주소 → 광고 제목 후보 10개 + 1080px 이미지 5세트 + 심사 체크.',
    help: '상세페이지 주소를 넣으면 상품을 읽고 당근 규격(제목 30자·소재 5세트·1080×1080)에 맞춰 제목 후보 10개와 광고 이미지 5세트를 만듭니다. 금칙 표현·30자 초과·사진 유무를 자동으로 점검하고, 지역·예산·기간 집행 설정표까지 복사해 쓸 수 있습니다.',
    render: function (root) {
      reset();
      var e = shell(root);
      els.left = e.left; els.right = e.right;
      renderInput(e.left);
      var pickId = S.get('pick', null);
      if (pickId) {
        S.del('pick');
        var p = A.products.get(pickId);
        if (p) {
          st.product = p;
          setTimeout(function () { buildAll(e.left, '보관함 · ' + (p.via || '분석')); }, 30);
          return;
        }
      }
      e.right.innerHTML = '';
      renderRightEmpty();
    }
  });
})();
