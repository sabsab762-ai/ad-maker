/* =====================================================================
   Module 10 · 🔮 사주 자판기 (만세력 60갑자 + 홍보/유입 카드)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, SC = window.SajuCore;

  var MODES = [
    { v: '1', label: '① 내 사주풀이' },
    { v: '2', label: '② 홍보글 + 카드' },
    { v: '3', label: '③ CPA 유입글' }
  ];

  function hourOptions() {
    var out = ['<option value="">모름 (시주 없이 6글자)</option>'];
    for (var b = 0; b < 12; b++) {
      var v = b === 0 ? 0 : b * 2 - 1;
      out.push('<option value="' + v + '">' + esc(SC.hourLabel(b)) + '</option>');
    }
    return out.join('');
  }

  function elemClass(i) { return 'e' + i; }
  function elemName(i) { return SC.ELEM[i]; }
  function nameOf(user) { return (user || '').trim() || '당신'; }

  /* ---------------- 풀이 텍스트 ---------------- */

  function pillarsHtml(r) {
    var cols = [
      { k: 'year', label: '년주', sub: '태어난 해' },
      { k: 'month', label: '월주', sub: '태어난 달' },
      { k: 'day', label: '일주', sub: '나' },
      { k: 'hour', label: '시주', sub: '태어난 시' }
    ];
    return '<div class="sj-pillars">' + cols.map(function (c) {
      var p = r.pillars[c.k];
      if (!p) {
        return '<div class="sj-pil"><div class="lb">' + c.label + '</div><div class="ch" style="color:#C9C9D6">?</div>' +
          '<div class="hj">모름</div><div class="et e3">6글자</div></div>';
      }
      var se = ['목', '화', '토', '금', '수'];
      var stemElem = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4][p.stem];
      var brElem = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4][p.branch];
      return '<div class="sj-pil"><div class="lb">' + c.label + '</div>' +
        '<div class="ch">' + esc(SC.STEM[p.stem]) + '</div>' +
        '<div class="hj">' + esc(SC.STEM_H[p.stem]) + ' · ' + se[stemElem] + '</div>' +
        '<div class="ch" style="margin-top:6px">' + esc(SC.BRANCH[p.branch]) + '</div>' +
        '<div class="hj">' + esc(SC.BRANCH_H[p.branch]) + ' · ' + se[brElem] + '</div>' +
        '<div><span class="et ' + elemClass(stemElem) + '">' + se[stemElem] + '</span> ' +
        '<span class="et ' + elemClass(brElem) + '">' + se[brElem] + '</span></div></div>';
    }).join('') + '</div>';
  }

  function elementsHtml(r) {
    var rows = '';
    for (var i = 0; i < 5; i++) {
      var pct = r.percents[i];
      rows += '<div class="mrow"><span class="lb">' + elemName(i) + ' ' + r.counts[i] + '</span>' +
        '<span class="meter"><i class="' + elemClass(i) + '-bar" style="width:' + pct + '%;background:' + SC.ELEM_INFO[i].color + '"></i></span>' +
        '<span class="vl">' + pct + '%</span></div>';
    }
    return rows;
  }

  function reading(r) {
    var dm = r.dayMaster;
    var html = '';
    html += '<div class="out">';

    html += '<div class="cardout"><div class="ch"><span class="t">🀄 사주팔자 (60갑자)</span>' +
      '<span class="m">' + r.input.y + '.' + r.input.m + '.' + r.input.d + ' · ' + esc(r.zodiac) + '띠</span></div>' +
      '<div class="cb">' + pillarsHtml(r) +
      '<p class="hint" style="margin-top:10px">' + (r.unknownHour ? '태어난 시를 모르면 시주를 뺀 6글자로 봅니다. ' : '') +
      '표준시(UTC+9) 기준 · 절기 경계로 월주가 바뀝니다.' +
      (r.input.hourKnown && r.input.hour === 0 ? ' 자시는 00:00 기준으로 계산했어요(23시 출생은 일주가 하루 달라질 수 있습니다).' : '') +
      '</p></div></div>';

    html += '<div class="cardout"><div class="ch"><span class="t">🌿 오행 분포</span><span class="m">' +
      (r.input.hourKnown ? '8글자' : '6글자') + ' 기준</span></div><div class="cb">' +
      '<div class="sj-bars">' + elementsHtml(r) + '</div>' +
      '<p class="hint" style="margin-top:8px">가장 두터운 기운은 <b>' + r.strongest.name + ' ' + r.strongest.pct + '%</b>, 가장 얇은 기운은 <b>' + r.weakest.name + ' ' + r.weakest.pct + '%</b>입니다.</p>' +
      '</div></div>';

    html += '<div class="cardout"><div class="ch"><span class="t">🧬 일간 성격</span><span class="m">' + esc(dm.stem) + ' · ' + esc(dm.elem) + ' · ' + esc(dm.yinyang) + '</span></div>' +
      '<div class="cb" style="white-space:normal">' +
      '<div class="sj-dm"><span class="big">' + esc(dm.stem) + '</span><div><b>' + esc(dm.title) + '</b>' +
      '<div class="chiprow" style="margin-top:6px">' + dm.keywords.map(function (k) { return '<span class="tag">' + esc(k) + '</span>'; }).join('') +
      '<span class="tag ' + (r.strength.label === '신강' ? 'ok' : (r.strength.label === '신약' ? 'warn' : '')) + '">' + r.strength.label + '</span></div></div></div>' +
      '<p class="sj-p">' + esc(dm.text) + '</p>' +
      '<p class="sj-p" style="margin-top:8px;color:#6D6D7A"><b>주의점</b> · ' + esc(dm.care) + '</p>' +
      '</div></div>';

    html += '<div class="sj-two">' +
      '<div class="cardout"><div class="ch"><span class="t">📅 오늘의 운</span><span class="m">' + esc(r.today.date) + ' · ' + esc(r.today.ganzhi) + '일</span></div>' +
      '<div class="cb" style="white-space:normal"><b class="sj-kw">' + esc(r.today.keyword) + '</b>' +
      '<p class="sj-p" style="margin-top:6px">' + esc(r.today.line) + '</p>' +
      '<p class="hint" style="margin-top:6px">일간과 오늘 일진의 관계: ' + esc(r.today.god) + '</p></div></div>' +
      '<div class="cardout"><div class="ch"><span class="t">🗓️ 올해의 운</span><span class="m">' + r.yearLuck.year + ' · ' + esc(r.yearLuck.ganzhi) + '년</span></div>' +
      '<div class="cb" style="white-space:normal"><b class="sj-kw">' + esc(r.yearLuck.keyword) + '</b>' +
      '<p class="sj-p" style="margin-top:6px">' + esc(r.yearLuck.line) + '</p>' +
      '<p class="hint" style="margin-top:6px">올해 천간과의 관계: ' + esc(r.yearLuck.god) + '</p></div></div>' +
      '</div>';

    html += '<div class="cardout"><div class="ch"><span class="t">💠 재물 · 연애 · 직업</span><span class="m">십신 분포</span></div>' +
      '<div class="cb" style="white-space:normal">' +
      '<div class="sj-point"><b>💰 재물</b><p class="sj-p">' + esc(r.points.money) + '</p></div>' +
      '<div class="sj-point"><b>💕 연애</b><p class="sj-p">' + esc(r.points.love) + '</p></div>' +
      '<div class="sj-point"><b>💼 직업</b><p class="sj-p">' + esc(r.points.work) + '</p></div>' +
      '<div class="chiprow" style="margin-top:10px">' +
      '<span class="tag">비겁 ' + r.groups['비겁'] + '</span><span class="tag">식상 ' + r.groups['식상'] + '</span>' +
      '<span class="tag">재성 ' + r.groups['재성'] + '</span><span class="tag">관성 ' + r.groups['관성'] + '</span>' +
      '<span class="tag">인성 ' + r.groups['인성'] + '</span></div>' +
      '</div></div>';

    html += '<div class="cardout"><div class="ch"><span class="t">🍀 개운 팁</span></div><div class="cb" style="white-space:normal">' +
      '<ul class="sj-list">' + r.luck.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '</div></div>';

    html += '<div class="actions" style="margin-top:2px">' +
      '<button class="btn btn-soft" type="button" id="sj-copy-all">풀이 전체 복사</button>' +
      '<button class="btn btn-line" type="button" id="sj-copy-short">한 줄 요약 복사</button></div>';

    html += '</div>';
    return html;
  }

  /* ---------------- 홍보 카드 ---------------- */

  function cardHtml(r, brand, link) {
    var nm = nameOf(r.input.name);
    var cta = brand ? brand : '무료 사주 맛보기';
    return '<div class="sj-card" id="sj-card">' +
      '<div class="sj-card-in">' +
      '<div class="sj-card-top"><span>' + esc(cta) + '</span><span>' + esc(r.input.gender === 'f' ? '여성' : '남성') + '</span></div>' +
      '<div class="sj-card-name">' + esc(nm) + '<small>님의 사주 맛보기</small></div>' +
      '<div class="sj-card-sub">' + r.input.y + '.' + r.input.m + '.' + r.input.d +
      (r.input.hourKnown ? ' · ' + esc(SC.hourLabel(SC.hourBranchOf(r.input.hour))) : ' · 시 모름') +
      ' · ' + esc(r.zodiac) + '띠</div>' +
      '<div class="sj-card-pils">' +
      [['년', r.names.year], ['월', r.names.month], ['일', r.names.day], ['시', r.names.hour || '?']].map(function (p) {
        return '<div><span>' + p[0] + '</span><b>' + esc(p[1]) + '</b></div>';
      }).join('') +
      '</div>' +
      '<div class="sj-card-dm"><span class="k">일간</span><b>' + esc(r.dayMaster.stem) + esc(r.dayMaster.elem) + '</b>' +
      '<span class="t">' + esc(r.dayMaster.title) + '</span></div>' +
      '<div class="sj-card-row"><span>오행</span><b>' + r.elementNames.map(function (n, i) { return n + r.counts[i]; }).join(' ') + '</b></div>' +
      '<div class="sj-card-row"><span>오늘의 키</span><b>' + esc(r.today.keyword) + '</b></div>' +
      '<div class="sj-card-cta">' + (link ? esc(shortLink(link)) : '프로필 링크에서 전체 풀이') + '</div>' +
      '<div class="sj-card-foot">재미로 보는 사주 · ' + esc(brand || '사주 자판기') + '</div>' +
      '</div></div>';
  }
  function shortLink(u) {
    var s = String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    return s.length > 34 ? s.slice(0, 33) + '…' : s;
  }

  function drawCard(r, brand, link, cb) {
    var W = 1080, Hh = 1350;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = Hh;
    var x = cv.getContext('2d');
    var g = x.createLinearGradient(0, 0, W, Hh);
    g.addColorStop(0, '#F3EEFF'); g.addColorStop(0.6, '#FFF7EE'); g.addColorStop(1, '#FFFFFF');
    x.fillStyle = g; x.fillRect(0, 0, W, Hh);
    x.fillStyle = '#6338F5'; x.fillRect(0, 0, W, 16);

    var sans = '-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif';
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#4C24D6'; x.font = '800 30px ' + sans;
    x.fillText(brand || '무료 사주 맛보기', 80, 120);
    x.textAlign = 'right'; x.fillStyle = '#9C9CA8'; x.font = '700 26px ' + sans;
    x.fillText(r.input.gender === 'f' ? '여성' : '남성', W - 80, 120);
    x.textAlign = 'left';

    x.fillStyle = '#17171B'; x.font = '800 76px ' + sans;
    x.fillText(nameOf(r.input.name), 80, 260);
    var nw = x.measureText(nameOf(r.input.name)).width;
    x.fillStyle = '#6D6D7A'; x.font = '700 34px ' + sans;
    x.fillText('님의 사주 맛보기', 80 + nw + 12, 260);

    x.fillStyle = '#8A8A96'; x.font = '600 30px ' + sans;
    x.fillText(r.input.y + '.' + r.input.m + '.' + r.input.d + ' · ' + r.zodiac + '띠' +
      (r.unknownHour ? ' · 시 모름' : ''), 80, 320);

    var pils = [['년', r.names.year], ['월', r.names.month], ['일', r.names.day], ['시', r.names.hour || '?']];
    var bx = 80, bw = (W - 160 - 3 * 20) / 4;
    for (var i = 0; i < pils.length; i++) {
      var px = bx + i * (bw + 20);
      x.fillStyle = '#FFFFFF'; x.strokeStyle = '#E8E3FA'; x.lineWidth = 3;
      roundRect(x, px, 380, bw, 200, 26); x.fill(); x.stroke();
      x.fillStyle = '#9C9CA8'; x.font = '800 26px ' + sans; x.textAlign = 'center';
      x.fillText(pils[i][0], px + bw / 2, 430);
      x.fillStyle = '#17171B'; x.font = '800 64px ' + sans;
      x.fillText(pils[i][1], px + bw / 2, 520);
      x.textAlign = 'left';
    }

    x.fillStyle = '#6338F5'; x.font = '800 28px ' + sans;
    x.fillText('일간', 80, 660);
    x.fillStyle = '#17171B'; x.font = '800 64px ' + sans;
    x.fillText(r.dayMaster.stem + r.dayMaster.elem, 150, 670);
    x.fillStyle = '#4E4E5A'; x.font = '700 32px ' + sans;
    x.fillText('“' + r.dayMaster.title + '”', 80, 730);

    x.fillStyle = '#6D6D7A'; x.font = '700 30px ' + sans;
    x.fillText('오행  ' + r.elementNames.map(function (n, j) { return n + r.counts[j]; }).join('  '), 80, 810);
    x.fillText('오늘의 키  ' + r.today.keyword, 80, 866);
    x.fillText('올해의 키  ' + r.yearLuck.keyword, 80, 922);

    /* 오행 막대 */
    var by = 990, barW = W - 160, total = 0, k;
    for (k = 0; k < 5; k++) total += r.counts[k];
    var cx = 80;
    for (k = 0; k < 5; k++) {
      var w = total ? Math.max(6, barW * r.counts[k] / total) : barW / 5;
      x.fillStyle = SC.ELEM_INFO[k].color;
      x.fillRect(cx, by, w - 6, 16);
      cx += w;
    }

    x.fillStyle = '#FFFFFF'; x.strokeStyle = '#E8E3FA';
    x.fillStyle = '#8A8A96'; x.font = '600 26px ' + sans; x.textAlign = 'center';
    x.fillText('“사주는 재미로, 선택은 내가.”', W / 2, 1075);
    x.textAlign = 'left';

    x.fillStyle = '#FFFFFF'; x.strokeStyle = '#E8E3FA';
    roundRect(x, 80, 1140, W - 160, 130, 24); x.fill(); x.stroke();
    x.fillStyle = '#4C24D6'; x.font = '800 34px ' + sans;
    x.fillText(link ? shortLink(link) : '프로필 링크에서 전체 풀이 보기', 110, 1208);
    x.fillStyle = '#9C9CA8'; x.font = '600 24px ' + sans;
    x.fillText('재미로 보는 사주입니다 · ' + (brand || '사주 자판기'), 110, 1246);

    if (cv.toBlob) {
      cv.toBlob(function (blob) {
        if (!blob) { cb(null); return; }
        cb(URL.createObjectURL(blob));
      }, 'image/png');
    } else { cb(null); }
  }
  function roundRect(ctx, x0, y0, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    ctx.lineTo(x0 + w - r, y0); ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    ctx.lineTo(x0 + w, y0 + h - r); ctx.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    ctx.lineTo(x0 + r, y0 + h); ctx.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
    ctx.closePath();
  }

  /* ---------------- 홍보글 ---------------- */

  function cardText(r, brand, link) {
    return '🔮 ' + nameOf(r.input.name) + '님의 사주 맛보기\n' +
      '· 사주: ' + r.names.year + '년 ' + r.names.month + '월 ' + r.names.day + '일' + (r.names.hour ? ' ' + r.names.hour + '시' : '') + '\n' +
      '· 일간: ' + r.dayMaster.stem + r.dayMaster.elem + ' · ' + r.dayMaster.title + '\n' +
      '· 오행: ' + r.elementNames.map(function (n, i) { return n + r.counts[i]; }).join(' ') + '\n' +
      '· 오늘의 키: ' + r.today.keyword + '\n' +
      (link ? '👉 전체 풀이: ' + link + '\n' : '') +
      (brand ? brand + ' · ' : '') + '재미로 보는 사주';
  }

  function promoPosts(r, brand, link, mode) {
    var nm = nameOf(r.input.name);
    var brandLine = brand ? brand : '사주 자판기';
    var linkLine = link || (mode === '3' ? '(제휴 링크 붙이기)' : '프로필 링크');
    var dm = r.dayMaster;
    var top = r.strongest.name;
    var today = r.today.keyword;

    var danggeun, thread, insta, blog, dm2;

    if (mode === '3') {
      danggeun = [
        '요즘 사주 보러 오시는 분들 중에 "내가 무슨 기운인지부터 궁금하다" 하시는 분이 많아서, 무료 맛보기 먼저 드리고 있어요.',
        '',
        '제 사주로 예를 들면 ' + r.names.day + '일 · ' + dm.stem + dm.elem + ' 일간에 ' + top + ' 기운이 강한 편이라, ' + dm.keywords[0] + ' 쪽으로 풀리는 게 많더라고요.',
        '',
        '✔ 사주팔자(년·월·일·시) 계산',
        '✔ 일간 성격·오행 분포',
        '✔ 오늘·올해 키워드까지 무료',
        '',
        '정확한 상담은 생년월일·태어난 시간만 있으면 됩니다.',
        '👉 ' + linkLine,
        '',
        '#광고 #제휴 · 상담 링크를 통해 신청 시 소정의 수수료를 받을 수 있습니다.'
      ].join('\n');

      thread = [
        '사주는 "내 기질"부터 확인하는 게 빠릅니다.',
        '',
        '저는 ' + r.names.day + '일 ' + dm.stem + dm.elem + ' 일간, ' + top + ' 기운 ' + r.strongest.pct + '%.',
        '그래서 ' + dm.keywords.join(' · ') + ' 쪽으로 움직일 때 일이 잘 풀렸어요.',
        '',
        '무료 맛보기 (사주팔자·오행·오늘 운) → ' + linkLine,
        '#광고'
      ].join('\n');

      insta = [
        '🔮 무료 사주 맛보기',
        '',
        nm + '님 사주로 보면 ' + dm.stem + dm.elem + ' 일간 · ' + top + ' 기운이 ' + r.strongest.pct + '%.',
        '오늘의 키워드는 "' + today + '".',
        '',
        '생년월일만 넣으면 사주팔자·오행·오늘 운까지 바로 나옵니다.',
        '프로필 링크에서 무료로 확인하세요!',
        '',
        '#광고 #사주 #무료사주 #사주풀이 #오늘의운세 #신년운세 #사주상담 #김카마'
      ].join('\n');

      blog = [
        '[무료 사주 맛보기] 생년월일만으로 사주팔자·오행·오늘 운 보는 법',
        '',
        '사주를 볼 때 가장 먼저 확인하는 건 "일간"입니다. 태어난 날의 천간, 즉 나를 뜻하는 글자예요.',
        '',
        '예를 들어 ' + r.names.year + '년 ' + r.names.month + '월 ' + r.names.day + '일생은 일간이 ' + dm.stem + '(' + dm.hanja + ') · ' + dm.elem + '입니다. ' + dm.title + '의 기운으로 보고, 여기에 ' + top + ' 기운이 ' + r.strongest.pct + '%로 가장 두텁습니다.',
        '',
        '1) 사주팔자 확인 — 년·월·일·시 60갑자',
        '2) 오행 분포 — 목·화·토·금·수 비율',
        '3) 오늘·올해 키워드 — 지금 흐름',
        '',
        '무료 맛보기: ' + linkLine,
        '',
        '※ 본 글은 제휴 링크를 포함하며, 링크를 통한 상담 신청 시 소정의 수수료를 받을 수 있습니다.'
      ].join('\n');

      dm2 = [
        '[무료 사주 맛보기 안내]',
        '생년월일(양력)과 태어난 시간만 알려주시면 사주팔자·오행·오늘 운까지 무료로 봐 드립니다.',
        '정확한 상담은 ' + linkLine + ' 에서 신청하실 수 있어요.',
        '(광고 · 제휴 링크 포함)'
      ].join('\n');

      return [
        { key: 'blog', label: '📝 블로그·카페형', text: blog },
        { key: 'danggeun', label: '🥕 당근형', text: danggeun },
        { key: 'thread', label: '🧵 스레드형', text: thread },
        { key: 'insta', label: '📸 인스타 캡션', text: insta },
        { key: 'dm', label: '💬 문자·DM형', text: dm2 }
      ];
    }

    danggeun = [
      '동네분들 사주 한번 재미로 보세요 😊',
      '',
      '저는 ' + r.names.day + '일 ' + dm.stem + dm.elem + ' 일간이라 ' + dm.keywords[0] + ' 쪽으로 움직일 때 일이 잘 풀린대요.',
      '오늘의 키워드는 "' + today + '".',
      '',
      '생년월일만 넣으면 사주팔자·오행·오늘 운까지 무료로 나옵니다.',
      '👉 ' + linkLine
    ].join('\n');

    thread = [
      '사주에서 제일 먼저 봐야 하는 건 "일간"이에요.',
      '',
      '저는 ' + dm.stem + dm.elem + ' 일간 · ' + dm.title + '.',
      '오행은 ' + top + ' 기운이 ' + r.strongest.pct + '%로 제일 강하고요.',
      '',
      '이걸 알면 "왜 나는 이럴 때 잘 풀리지"가 설명됩니다.',
      '무료 맛보기 → ' + linkLine
    ].join('\n');

    insta = [
      '🔮 내 사주 3초 만에 보는 법',
      '',
      nm + '님은 ' + r.names.year + '년 ' + r.names.month + '월 ' + r.names.day + '일생, ' + dm.stem + dm.elem + ' 일간.',
      '"' + dm.title + '" 기운이고 ' + top + ' 기운이 ' + r.strongest.pct + '%로 가장 강해요.',
      '오늘의 키워드는 "' + today + '".',
      '',
      '생년월일만 넣으면 사주팔자·오행·오늘 운까지 무료!',
      '프로필 링크에서 확인하세요 ✨',
      '',
      '#사주 #무료사주 #사주풀이 #오늘의운세 #사주테스트 #운세 #김카마'
    ].join('\n');

    return [
      { key: 'danggeun', label: '🥕 당근', text: danggeun },
      { key: 'thread', label: '🧵 스레드', text: thread },
      { key: 'insta', label: '📸 인스타 캡션', text: insta }
    ];
  }

  /* ---------------- 상태 / 렌더 ---------------- */

  function plainReading(r) {
    var L = [];
    L.push('🔮 ' + nameOf(r.input.name) + '님의 사주 풀이');
    L.push('생년월일: ' + r.input.y + '.' + r.input.m + '.' + r.input.d + ' (' + r.zodiac + '띠)' + (r.unknownHour ? ' · 시 모름' : ''));
    L.push('');
    L.push('[사주팔자]');
    L.push('년주 ' + r.names.year + ' / 월주 ' + r.names.month + ' / 일주 ' + r.names.day + (r.names.hour ? ' / 시주 ' + r.names.hour : ' / 시주 모름'));
    L.push('');
    L.push('[오행] ' + r.elementNames.map(function (n, i) { return n + ' ' + r.counts[i] + '(' + r.percents[i] + '%)'; }).join(' · '));
    L.push('');
    L.push('[일간] ' + r.dayMaster.stem + r.dayMaster.elem + ' · ' + r.dayMaster.title + ' (' + r.strength.label + ')');
    L.push(r.dayMaster.text);
    L.push('주의: ' + r.dayMaster.care);
    L.push('');
    L.push('[오늘의 운] ' + r.today.date + ' ' + r.today.ganzhi + '일 · ' + r.today.keyword);
    L.push(r.today.line);
    L.push('[올해의 운] ' + r.yearLuck.year + ' ' + r.yearLuck.ganzhi + '년 · ' + r.yearLuck.keyword);
    L.push(r.yearLuck.line);
    L.push('');
    L.push('[재물] ' + r.points.money);
    L.push('[연애] ' + r.points.love);
    L.push('[직업] ' + r.points.work);
    L.push('');
    L.push('[개운 팁]');
    r.luck.forEach(function (x) { L.push('· ' + x); });
    L.push('');
    L.push('재미로 보는 사주입니다.');
    return L.join('\n');
  }

  App.register({
    id: 'saju', emoji: '🔮', name: '사주 자판기', free: true, tag: '무료 · 만세력',
    desc: '생년월일로 60갑자 사주팔자 · 오행 · 오늘 운 + 홍보 카드까지.',
    help: '생년월일(양력)과 태어난 시를 넣으면 년·월·일·시 60갑자와 오행 분포, 일간 성격, 오늘·올해 운, 재물·연애·직업 포인트를 계산합니다. ②③ 모드에서는 무료 맛보기 카드(PNG 저장)와 제휴 링크가 들어간 홍보글을 바로 복사할 수 있어요. 재미·콘텐츠용이며 전문 상담을 대체하지 않습니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent =
        '.sj-pillars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}' +
        '.sj-pil{border:1px solid var(--line);border-radius:12px;padding:10px 6px;text-align:center;background:#FCFCFE;min-width:0}' +
        '.sj-pil .lb{font-size:11px;color:var(--muted);font-weight:800}' +
        '.sj-pil .ch{font-size:26px;font-weight:800;line-height:1.15;letter-spacing:-.02em}' +
        '.sj-pil .hj{font-size:10px;color:var(--muted);font-weight:700}' +
        '.sj-pil .et{display:inline-block;margin-top:5px;font-size:10px;font-weight:800;padding:1px 6px;border-radius:999px}' +
        '.e0{background:#E7F6EE;color:#1E7A4B}.e1{background:#FFECEC;color:#C63636}.e2{background:#FBF1DC;color:#8A6114}' +
        '.e3{background:#EEF0F4;color:#55606F}.e4{background:#E8F0FF;color:#2456B8}' +
        '.sj-bars .mrow{margin-top:9px}.sj-bars .mrow .lb{width:44px}' +
        '.sj-dm{display:flex;align-items:center;gap:12px}' +
        '.sj-dm .big{width:56px;height:56px;flex:none;display:grid;place-items:center;border-radius:14px;background:var(--violet-soft);color:var(--violet-d);font-size:28px;font-weight:800}' +
        '.sj-dm b{font-size:14.5px;letter-spacing:-.02em}' +
        '.sj-p{margin-top:9px;font-size:12.5px;line-height:1.75;color:#3A3A44;word-break:keep-all}' +
        '.sj-kw{display:inline-block;font-size:14px;color:var(--violet-d)}' +
        '.sj-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}' +
        '.sj-point{padding:10px 0;border-bottom:1px dashed var(--line)}.sj-point:last-of-type{border-bottom:0}' +
        '.sj-point b{font-size:12.5px}' +
        '.sj-list{margin:0;padding-left:17px;font-size:12.5px;line-height:1.8;color:#3A3A44}' +
        '.sj-list li{margin-top:2px}' +
        '.sj-card{max-width:340px;margin:0 auto;border-radius:18px;padding:9px;background:linear-gradient(150deg,#F3EEFF,#FFF7EE 60%,#fff);border:1px solid #EDE7FF}' +
        '.sj-card-in{border-radius:13px;padding:16px 16px 14px;background:#fff;border:1px solid #F1ECFF}' +
        '.sj-card-top{display:flex;justify-content:space-between;font-size:10.5px;font-weight:800;color:#6338F5}' +
        '.sj-card-name{margin-top:12px;font-size:21px;font-weight:800;letter-spacing:-.03em}' +
        '.sj-card-name small{font-size:11.5px;font-weight:700;color:#6D6D7A;margin-left:5px}' +
        '.sj-card-sub{margin-top:4px;font-size:11px;color:#8A8A96;font-weight:700}' +
        '.sj-card-pils{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:12px}' +
        '.sj-card-pils div{background:#FAF8FF;border:1px solid #F0EBFF;border-radius:9px;padding:7px 2px;text-align:center}' +
        '.sj-card-pils span{display:block;font-size:9.5px;color:#9C9CA8;font-weight:800}' +
        '.sj-card-pils b{display:block;margin-top:2px;font-size:15px;letter-spacing:-.02em}' +
        '.sj-card-dm{margin-top:12px;display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}' +
        '.sj-card-dm .k{font-size:10px;font-weight:800;color:#6338F5}' +
        '.sj-card-dm b{font-size:17px}' +
        '.sj-card-dm .t{font-size:11px;color:#6D6D7A;font-weight:700}' +
        '.sj-card-row{display:flex;gap:8px;margin-top:7px;font-size:11px;color:#6D6D7A;font-weight:700}' +
        '.sj-card-row b{color:#2A2A33}' +
        '.sj-card-cta{margin-top:12px;padding:9px;border-radius:9px;background:#6338F5;color:#fff;text-align:center;font-size:11px;font-weight:800;word-break:break-all}' +
        '.sj-card-foot{margin-top:8px;text-align:center;font-size:9.5px;color:#9C9CA8}' +
        '@media (max-width:720px){.sj-two{grid-template-columns:1fr}.sj-pil .ch{font-size:22px}}' +
        '#sj-modes .chip{white-space:nowrap}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🔮 사주 정보 <span class="pill">양력</span></h3>' +
            '<div class="field"><label for="sj-name">이름 / 닉네임 <span class="muted small">(선택)</span></label>' +
              '<input id="sj-name" type="text" placeholder="예: 김카마" maxlength="20"></div>' +
            '<div class="field"><label for="sj-date">생년월일</label><input id="sj-date" type="date" min="1900-01-01" max="2100-12-31"></div>' +
            '<div class="row2"><div class="field"><label for="sj-hour">태어난 시</label><select id="sj-hour">' + hourOptions() + '</select></div>' +
            '<div class="field"><label>성별</label><div class="chiprow" style="margin-top:0">' +
              '<button class="chip on" type="button" data-gender="m" aria-pressed="true">남성</button>' +
              '<button class="chip" type="button" data-gender="f" aria-pressed="false">여성</button></div></div></div>' +
            '<div class="field"><label>모드</label><div class="chiprow" id="sj-modes" style="margin-top:0">' +
              MODES.map(function (m, i) {
                return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-mode="' + m.v + '" aria-pressed="' + (i === 0) + '">' + m.label + '</button>';
              }).join('') + '</div></div>' +
            '<div id="sj-promo-fields" hidden>' +
              '<div class="field"><label for="sj-brand">상담소 · 채널명 <span class="muted small">(선택)</span></label>' +
                '<input id="sj-brand" type="text" placeholder="예: 김카마 사주상담" maxlength="30"></div>' +
              '<div class="field"><label for="sj-link">제휴 · 상담 링크</label>' +
                '<input id="sj-link" type="url" placeholder="https://... (없으면 비워 두세요)">' +
                '<p class="tip">②홍보 모드에서는 내 채널·상담 링크, ③CPA 모드에서는 제휴 링크를 넣으세요. 입력한 링크는 카드와 홍보글에 그대로 들어갑니다.</p></div>' +
            '</div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="sj-run">🔮 사주 풀기</button></div>' +
            '<div class="actions" style="margin-top:8px"><button class="btn btn-ghost btn-sm" type="button" id="sj-reset">입력 초기화</button>' +
              '<button class="btn btn-ghost btn-sm" type="button" id="sj-demo">예시로 채우기</button></div>' +
            '<p class="hint">계산 기준: 태양 황경으로 찾은 24절기 · 표준시(UTC+9) · 1900-01-01 갑술일 기준 60일 순환. 진태양시 보정과 지장간은 넣지 않았습니다. 재미·콘텐츠용이에요.</p>' +
          '</section></div>' +
          '<div class="stack"><div id="sj-out"><section class="panel"><h3>🔮 풀이 결과</h3>' +
            '<div class="empty"><b>아직 사주를 보지 않았어요</b>왼쪽에 생년월일을 넣고 <b>사주 풀기</b>를 눌러주세요.<br>시를 모르면 6글자로 계산합니다.</div>' +
          '</section></div></div>' +
        '</div>';

      var el = {
        name: H.$('#sj-name', root), date: H.$('#sj-date', root), hour: H.$('#sj-hour', root),
        brand: H.$('#sj-brand', root), link: H.$('#sj-link', root),
        promoFields: H.$('#sj-promo-fields', root), out: H.$('#sj-out', root)
      };
      var state = { gender: 'm', mode: '1', result: null, posts: [] };

      /* 저장된 입력 복원 */
      var saved = S.get('saju.last', null);
      if (saved) {
        if (saved.name) el.name.value = saved.name;
        if (saved.date) el.date.value = saved.date;
        if (saved.hour != null) el.hour.value = String(saved.hour);
        if (saved.brand) el.brand.value = saved.brand;
        if (saved.link) el.link.value = saved.link;
        if (saved.gender) state.gender = saved.gender;
        if (saved.mode) state.mode = saved.mode;
        var gb = H.$('[data-gender="' + state.gender + '"]', root);
        H.$$('[data-gender]', root).forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
        if (gb) { gb.classList.add('on'); gb.setAttribute('aria-pressed', 'true'); }
        var mb = H.$('[data-mode="' + state.mode + '"]', root);
        H.$$('[data-mode]', root).forEach(function (b) { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
        if (mb) { mb.classList.add('on'); mb.setAttribute('aria-pressed', 'true'); }
        el.promoFields.hidden = state.mode === '1';
      }

      H.$$('[data-gender]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          state.gender = b.getAttribute('data-gender');
          H.$$('[data-gender]', root).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
        });
      });
      H.$$('[data-mode]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          state.mode = b.getAttribute('data-mode');
          H.$$('[data-mode]', root).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
          el.promoFields.hidden = state.mode === '1';
          if (state.result) paint(state.result);
        });
      });

      H.$('#sj-demo', root).addEventListener('click', function () {
        el.date.value = '1995-05-15';
        el.hour.value = '9';
        el.name.value = el.name.value || '김카마';
        App.toast('예시 정보를 채웠어요. 사주 풀기를 눌러보세요.');
      });

      H.$('#sj-reset', root).addEventListener('click', function () {
        el.name.value = ''; el.date.value = ''; el.hour.value = '';
        el.brand.value = ''; el.link.value = '';
        state.result = null; state.posts = [];
        S.del('saju.last');
        el.out.innerHTML = '<section class="panel"><h3>🔮 풀이 결과</h3><div class="empty"><b>비웠어요</b>생년월일을 다시 넣고 사주 풀기를 눌러주세요.</div></section>';
      });

      function parseInput() {
        var v = el.date.value;
        var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
        if (!m) return null;
        var y = +m[1], mo = +m[2], da = +m[3];
        if (y < 1900 || y > 2100) return null;
        return { y: y, m: mo, d: da, hour: el.hour.value === '' ? null : +el.hour.value };
      }

      function paint(r) {
        state.result = r;
        var brand = el.brand.value.trim();
        var link = String(el.link.value || '').trim();
        var html = reading(r);
        if (state.mode !== '1') {
          state.posts = promoPosts(r, brand, link, state.mode);
          html += '<section class="panel" style="margin-top:14px"><h3>📣 홍보 카드 + 글 <span class="pill">' + (state.mode === '3' ? 'CPA' : 'SNS') + '</span></h3>' +
            '<p class="psub">카드를 PNG로 저장하거나 문구를 복사해 바로 올릴 수 있어요.' +
            (state.mode === '3' ? ' 제휴 링크를 넣으면 <b>#광고 · 수수료 안내</b> 문구가 자동으로 붙습니다.' : '') + '</p>' +
            '<div style="margin-top:12px">' + cardHtml(r, brand, link) + '</div>' +
            '<div class="actions"><button class="btn btn-soft" type="button" id="sj-card-png">카드 PNG 저장</button>' +
            '<button class="btn btn-line" type="button" id="sj-card-copy">카드 문구 복사</button></div>' +
            '<div id="sj-posts" style="margin-top:8px">' +
            state.posts.map(function (p, i) {
              return '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">' + esc(p.label) + '</span>' +
                '<span class="m">' + p.text.length + '자</span></div>' +
                '<div class="cb scroll">' + esc(p.text) + '</div>' +
                '<div style="padding:0 13px 12px"><button class="btn btn-sm btn-soft" type="button" data-post="' + i + '">복사</button></div></div>';
            }).join('') + '</div></section>';
        }
        el.out.innerHTML = html;

        H.$('#sj-copy-all', el.out).addEventListener('click', function () {
          App.copy(plainReading(r), this);
        });
        H.$('#sj-copy-short', el.out).addEventListener('click', function () {
          App.copy(r.summary, this);
        });

        if (state.mode !== '1') {
          H.$('#sj-card-png', el.out).addEventListener('click', function () {
            var btn = this;
            drawCard(r, brand, link, function (url) {
              if (!url) { App.toast('카드 이미지를 만들지 못했어요. 브라우저를 바꿔 보세요.'); return; }
              var a = document.createElement('a');
              a.href = url;
              a.download = '사주카드_' + (r.input.name || '사주') + '_' + r.input.y + '-' +
                (r.input.m < 10 ? '0' + r.input.m : r.input.m) + '-' + (r.input.d < 10 ? '0' + r.input.d : r.input.d) + '.png';
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
              App.toast('카드 PNG를 저장했어요.');
            });
          });
          H.$('#sj-card-copy', el.out).addEventListener('click', function () {
            App.copy(cardText(r, brand, link), this, '카드 문구를 복사했어요.');
          });
          H.$$('[data-post]', el.out).forEach(function (b) {
            b.addEventListener('click', function () {
              var i = +b.getAttribute('data-post');
              App.copy(state.posts[i].text, b, '홍보글을 복사했어요. 그대로 붙여넣으세요!');
            });
          });
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
      }

      H.$('#sj-run', root).addEventListener('click', function () {
        var inp = parseInput();
        if (!inp) { App.toast('생년월일을 먼저 선택해 주세요.'); el.date.focus(); return; }
        var r = SC.buildSaju({
          name: el.name.value, y: inp.y, m: inp.m, d: inp.d, hour: inp.hour, gender: state.gender
        }, new Date());
        S.set('saju.last', {
          name: el.name.value, date: el.date.value, hour: el.hour.value === '' ? null : +el.hour.value,
          brand: el.brand.value, link: el.link.value, gender: state.gender, mode: state.mode
        });
        paint(r);
        App.toast('사주를 풀었어요!' + (r.unknownHour ? ' (시주 제외 6글자)' : ''));
      });
    }
  });
})();
