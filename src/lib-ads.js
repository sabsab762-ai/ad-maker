/* =====================================================================
   광고 만들기 · 공용 엔진 (lib-ads)
   - 상세페이지 읽기(리더 3경로 + 붙여넣기/캡처 폴백)
   - 페이지 분석(신청 조건·페르소나·소구점·출처 문장)
   - 상품 보관함(localStorage)
   - 카피 엔진(제목·페르소나·소구점·캐러셀·카페 원고·금칙어)
   - 캔버스 그리기 도구
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc;

  /* ===================================================================
     0. 공통 텍스트 유틸
     =================================================================== */
  var STOP = ('그리고 그러나 하지만 또한 그래서 때문에 위한 통해 대한 있는 없습니다 있습니다 합니다 드립니다 입니다 습니다 저희 우리 이번 지금 오늘 가장 정말 너무 많은 모든 어떤 이런 그런 이런저런 쇼핑몰 상품 페이지 안내 공지 이벤트 회원 가입 로그인 주문 결제 배송 반품 교환 환불 고객센터 이용약관 개인정보 처리방침 전체보기 더보기 자세히 보기 클릭하세요 확인하세요 신청하세요').split(/\s+/);

  function won(n) {
    var num = Number(String(n == null ? '' : n).replace(/[^0-9.-]/g, ''));
    if (!isFinite(num)) return String(n == null ? '' : n);
    return String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function wonAuto(n) {
    var v = Number(n) || 0;
    if (!v) return '';
    if (v >= 100000000) {
      var eok = Math.floor(v / 100000000), man = Math.round((v % 100000000) / 10000);
      return eok + '억' + (man ? ' ' + won(man) + '만' : '') + '원';
    }
    if (v >= 10000) {
      var m = Math.floor(v / 10000), r = v % 10000;
      return (m ? won(m) + '만' : '') + (r ? ' ' + won(r) : '') + '원';
    }
    return won(v) + '원';
  }
  function trimPunct(s) {
    return String(s || '').replace(/^[\s\-–—·•*,:;"'“”‘’()\[\]<>|#]+/, '').replace(/[\s\-–—·•,;:"'“”‘’]+$/, '').trim();
  }
  function cut(s, n) {
    var v = String(s || '').trim();
    if (v.length <= n) return v;
    return v.slice(0, Math.max(1, n - 1)).replace(/[\s,·]+$/, '') + '…';
  }
  function deent(s) {
    return String(s || '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&middot;/g, '·')
      .replace(/&#(\d+);/g, function (m, d) { try { return String.fromCharCode(Number(d)); } catch (e) { return ' '; } });
  }

  function htmlToText(html) {
    var s = String(html || '');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
    s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
    s = s.replace(/<!--[\s\S]*?-->/g, ' ');
    s = s.replace(/<(br|hr)\s*\/?>/gi, '\n');
    s = s.replace(/<\/(p|div|li|tr|h[1-6]|section|article|td|th|dd|dt|figcaption|button|a)>/gi, '\n');
    s = s.replace(/<li[^>]*>/gi, '· ');
    s = s.replace(/<[^>]+>/g, ' ');
    s = deent(s);
    return s.replace(/[ \t\u00a0]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
  }

  function mdToPlain(md) {
    var s = String(md || '');
    s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');          // images
    s = s.replace(/\[([^\]]{1,120})\]\([^)]*\)/g, '$1');   // links -> text
    s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '\n');            // headings
    s = s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1').replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2');
    s = s.replace(/`([^`]*)`/g, '$1');
    s = s.replace(/^\s*[-*+]\s+/gm, '· ');
    s = s.replace(/^\s*>\s?/gm, '');
    s = s.replace(/^\s*\|.*\|\s*$/gm, function (row) {
      return row.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
    });
    s = s.replace(/[ \t\u00a0]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n');
    return s.trim();
  }

  /* ===================================================================
     1. 상세페이지 읽기
     =================================================================== */
  var PROXIES = [
    {
      id: 'jina', label: '리더 A (본문 변환)',
      build: function (u) { return 'https://r.jina.ai/' + u; },
      kind: 'md'
    },
    {
      id: 'allorigins', label: '리더 B (원본 HTML)',
      build: function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
      kind: 'html'
    },
    {
      id: 'corslol', label: '리더 C (원본 HTML)',
      build: function (u) { return 'https://api.cors.lol/?url=' + encodeURIComponent(u); },
      kind: 'html'
    }
  ];

  function fetchText(url, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        if (ctrl) { try { ctrl.abort(); } catch (e) {} }
        reject(new Error('응답이 없어 시간이 초과됐어요'));
      }, ms);
      var opt = { method: 'GET', mode: 'cors', credentials: 'omit' };
      if (ctrl) opt.signal = ctrl.signal;
      fetch(url, opt).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }).then(function (t) {
        if (done) return;
        done = true; clearTimeout(timer); resolve(t);
      }).catch(function (e) {
        if (done) return;
        done = true; clearTimeout(timer);
        reject(new Error((e && e.message) || '연결 실패'));
      });
    });
  }

  function normalizeUrl(raw) {
    var v = String(raw || '').trim().replace(/^["'<\s]+|["'>\s]+$/g, '');
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) return v;
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(v)) return 'https://' + v;
    return '';
  }
  function isLive(u) { return /^https?:\/\//i.test(String(u || '').trim()); }
  function domainOf(u) {
    try { return String(new URL(u).hostname).replace(/^www\./, ''); } catch (e) { return ''; }
  }

  /* jina 결과의 머리말 분리 */
  function splitReader(raw, kind) {
    var text = String(raw || ''), title = '', srcUrl = '';
    if (kind === 'md') {
      var mTitle = text.match(/^Title:\s*(.+)$/m);
      if (mTitle) title = trimPunct(mTitle[1]);
      var mSrc = text.match(/^URL Source:\s*(\S+)$/m);
      if (mSrc) srcUrl = mSrc[1];
      var idx = text.indexOf('Markdown Content:');
      if (idx >= 0) text = text.slice(idx + 'Markdown Content:'.length);
      text = mdToPlain(text);
    } else {
      text = htmlToText(text);
    }
    return { text: text, title: title, srcUrl: srcUrl };
  }

  /**
   * readPage(url, onStep) -> Promise<{ok, text, title, via, tries:[{id,label,ok,msg}]}>
   */
  function readPage(url, onStep) {
    var u = normalizeUrl(url);
    if (!u) return Promise.reject(new Error('주소 형식이 아니에요. https:// 로 시작하는 상세페이지 주소를 넣어 주세요.'));
    var tries = [];
    var idx = 0;
    function step(s) { if (typeof onStep === 'function') { try { onStep(s); } catch (e) {} } }

    function next() {
      if (idx >= PROXIES.length) {
        var err = new Error('이 사이트는 읽기를 막고 있어요(로그인·차단·해외 접속 제한 등). 본문 붙여넣기나 캡처 이미지로 넘어가 주세요.');
        err.tries = tries;
        return Promise.reject(err);
      }
      var p = PROXIES[idx++];
      step({ phase: 'try', label: p.label, id: p.id });
      return fetchText(p.build(u), 30000).then(function (raw) {
        var parsed = splitReader(raw, p.kind);
        var plain = String(parsed.text || '').replace(/\s/g, '');
        if (plain.length < 120) throw new Error('읽은 내용이 너무 적어요(' + plain.length + '자)');
        if (/서비스\s*접속이\s*(불가|차단)|접속이\s*차단|Too Many Requests|Just a moment|Access Denied|에러페이지|error_page/i.test(parsed.text)) {
          throw new Error('사이트가 접속을 막았어요');
        }
        tries.push({ id: p.id, label: p.label, ok: true, msg: plain.length + '자 읽음' });
        step({ phase: 'ok', label: p.label, id: p.id, chars: plain.length });
        return {
          ok: true, url: u, via: p.label, viaId: p.id,
          text: parsed.text, raw: raw, title: parsed.title || ''
        };
      }).catch(function (e) {
        tries.push({ id: p.id, label: p.label, ok: false, msg: (e && e.message) || '실패' });
        step({ phase: 'fail', label: p.label, id: p.id, msg: (e && e.message) || '실패' });
        return next();
      });
    }
    return next();
  }

  /* ===================================================================
     2. 분석 (추출 + 페르소나 + 소구점)
     =================================================================== */
  function sentencesOf(text) {
    var cleaned = String(text || '')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .split(/\n+/).map(function (l) { return trimPunct(l); }).filter(Boolean)
      .map(function (l) {
        return l.replace(/([.!?。])\s*/g, '$1\n').split('\n');
      });
    var out = [];
    cleaned.forEach(function (arr) {
      arr.forEach(function (s) {
        var v = trimPunct(s);
        if (v.length >= 8 && v.length <= 220) out.push(v);
      });
    });
    return out;
  }

  function has(s, list) {
    var low = String(s || '');
    for (var i = 0; i < list.length; i++) if (low.indexOf(list[i]) !== -1) return true;
    return false;
  }
  function pickSent(arr, words, max, exclude) {
    var out = [];
    for (var i = 0; i < arr.length && out.length < max; i++) {
      var s = arr[i];
      if (!has(s, words)) continue;
      if (exclude && has(s, exclude)) continue;
      var dup = false;
      for (var j = 0; j < out.length; j++) {
        if (out[j].indexOf(s.slice(0, 12)) !== -1 || s.indexOf(out[j].slice(0, 12)) !== -1) { dup = true; break; }
      }
      if (!dup) out.push(s);
    }
    return out;
  }

  var CATEGORY_MAP = [
    { key: '렌탈·타이어', emoji: '🛞', words: ['타이어', '렌탈', '렌트', '정수기', '비데', '구독', '교체'] },
    { key: '인터넷·통신', emoji: '📶', words: ['인터넷', '통신', '요금제', '알뜰폰', 'iptv', '결합', '와이파이', 'kt', 'skt', 'lg'] },
    { key: '이사·청소', emoji: '📦', words: ['이사', '입주청소', '청소', '포장이사', '원룸', '짐'] },
    { key: '지원금·금융', emoji: '💰', words: ['지원금', '정책자금', '대출', '카드', '보험', '적금', '환급', '소상공인', '창업'] },
    { key: '뷰티·건강', emoji: '💆', words: ['피부', '다이어트', '헬스', 'pt', '병원', '치과', '시술', '화장품', '샴푸'] },
    { key: '식품·맛집', emoji: '🍽️', words: ['식당', '카페', '맛집', '배달', '식품', '정육', '과일', '커피', '디저트'] },
    { key: '교육·클래스', emoji: '📚', words: ['강의', '클래스', '학원', '교육', '자격증', '수강', '온라인 강의'] },
    { key: '여행·숙박', emoji: '✈️', words: ['여행', '숙소', '호텔', '펜션', '항공', '투어', '체험'] },
    { key: '생활·가전', emoji: '🏠', words: ['가전', '냉장고', '세탁기', '에어컨', '가구', '침구', '생활'] },
    { key: '쇼핑·패션', emoji: '🛍️', words: ['의류', '신발', '가방', '패션', '액세서리', '원피스', '티셔츠'] }
  ];

  function categoryOf(text) {
    var low = String(text || '').toLowerCase(), best = null, bestN = 0;
    CATEGORY_MAP.forEach(function (c) {
      var n = 0;
      c.words.forEach(function (w) { if (low.indexOf(w) !== -1) n += 1; });
      if (n > bestN) { bestN = n; best = c; }
    });
    return best || { key: '생활·기타', emoji: '🧩', words: [] };
  }

  function keywordsOf(text, n) {
    var counts = {}, i, w;
    var words = String(text || '').replace(/[^가-힣a-zA-Z ]/g, ' ').split(/\s+/);
    for (i = 0; i < words.length; i++) {
      w = words[i];
      if (w.length < 2 || w.length > 10) continue;
      if (/[0-9]/.test(w)) continue;
      if (STOP.indexOf(w) !== -1) continue;
      if (/^(있습니다|합니다|됩니다|입니다|습니다|드립니다|주세요|하세요|보세요|있어요|해요|이고|이며)$/.test(w)) continue;
      counts[w] = (counts[w] || 0) + 1;
    }
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, n || 12);
  }

  function pricesOf(text) {
    var re = /([0-9][0-9,]{2,})\s*(원|만원|원부터|원~)/g, m, list = [], seen = {};
    var src = String(text || '');
    while ((m = re.exec(src))) {
      var raw = m[1].replace(/,/g, '');
      var val = Number(raw) * (m[2].indexOf('만원') === 0 ? 10000 : 1);
      if (!val || val < 100) continue;
      if (val > 200000000) continue;
      if (seen[val]) continue;
      seen[val] = 1;
      list.push(val);
    }
    list.sort(function (a, b) { return a - b; });
    return list;
  }

  function shortTitle(title, fallback) {
    var t = String(title || '').replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
    t = t.split(/\s*[|｜]\s*/)[0].split(/\s*[-–—]\s*(?:공식|쇼핑몰|스토어|네이버|쿠팡|공식몰)/)[0];
    t = t.replace(/(공식몰|공식 스토어|공식스토어|스마트스토어|온라인 스토어|쇼핑몰)$/g, '').trim();
    if (!t) t = String(fallback || '').trim();
    return cut(t, 40);
  }

  function analyze(opts) {
    opts = opts || {};
    var text = String(opts.text || '');
    var url = opts.url || '';
    var domain = opts.domain || domainOf(url);
    var sents = sentencesOf(text);
    var low = text;

    var title = shortTitle(opts.rawTitle, '');
    if (!title) {
      var firstShort = sents.filter(function (s) { return s.length >= 6 && s.length <= 60; })[0];
      title = shortTitle(firstShort || (sents[0] || ''), domain || '상품');
    }
    var titleKey = title.replace(/\s/g, '').slice(0, 8);

    var prices = pricesOf(text);
    var minP = prices.length ? prices[0] : 0;
    var maxP = prices.length ? prices[prices.length - 1] : 0;

    var discount = '';
    var mDisc = text.match(/([0-9]{1,3})\s*%\s*(할인|세일|off|OFF)/);
    if (mDisc) discount = mDisc[1] + '% 할인';
    else if (/무료배송/.test(text)) discount = '무료배송';

    /* --- 혜택 문장 정리 --- */
    var CAUTION_W = ['불가', '어렵', '제외', '유의', '제한', '주의', '별도 상담'];
    function isTitleLike(s) {
      var flat = s.replace(/\s/g, '');
      var key = title.slice(0, 5).replace(/\s/g, '');
      return key && flat.indexOf(key) === 0;
    }
    function cleanBenefit(s) {
      var v = trimPunct(s).replace(/^[·・\-]\s*/, '');
      v = v.replace(/\s*\([^)]{0,40}\)\s*/g, ' ');
      v = v.replace(/\s+/g, ' ').replace(/\s*\.\s*$/, '').trim();
      /* 제품명 반복 제거 */
      if (title && v.indexOf(title) === 0) {
        v = trimPunct(v.slice(title.length).replace(/^[,\-–—:]\s*/, ''));
      }
      if (v.length > 44) {
        var cutAt = v.slice(0, 44);
        var lastSpace = cutAt.lastIndexOf(' ');
        if (lastSpace > 18) cutAt = cutAt.slice(0, lastSpace);
        v = trimPunct(cutAt);
      }
      return v;
    }
    var benefitSents = pickSent(sents, ['무료', '할인', '증정', '사은품', '쿠폰', '적립', '면제', '지원', '혜택', '개월', '만원', '원', '서비스', '체험'], 10, ['배송비', '반품', '교환', '환불 규정']);
    var benefitLines = [];
    benefitSents.forEach(function (s) {
      if (isTitleLike(s)) return;
      var v = cleanBenefit(s);
      if (v.length < 6) return;
      for (var i = 0; i < benefitLines.length; i++) {
        if (benefitLines[i].slice(0, 10) === v.slice(0, 10)) return;
      }
      benefitLines.push(v);
    });
    if (!benefitLines.length) benefitLines = ['혜택 정보를 페이지에서 찾지 못했어요. 직접 입력해 주세요.'];

    var forWhomSents = pickSent(sents, ['대상', '자격', '누구나', '만 1', '만 2', '세 이상', '직장인', '주부', '학생', '사장', '소상공인', '운전자', '가구', '가정'], 4);
    var howSents = pickSent(sents, ['신청', '예약', '전화', '방문', '가입', '클릭', '구매', '주문', '신청서'], 5, CAUTION_W).filter(function (s) { return has(s, ['신청', '예약', '전화', '방문', '가입', '클릭', '구매', '주문', '링크']); });
    var cautionSents = pickSent(sents, ['주의', '제외', '불가', '제한', '유의', '조건', '별도', '경우', '어려'], 5);

    var cat = categoryOf(title + ' ' + low);
    var kws = keywordsOf(title + ' ' + sents.join(' '), 12);
    var priceLabel = '';
    if (minP && maxP && minP !== maxP) priceLabel = wonAuto(minP) + ' ~ ' + wonAuto(maxP);
    else if (minP) priceLabel = wonAuto(minP);
    else if (/무료/.test(text)) priceLabel = '무료';

    var product = {
      id: opts.id || H.uid('p'),
      url: url,
      domain: domain,
      title: title,
      rawTitle: opts.rawTitle || '',
      via: opts.via || '',
      text: text.slice(0, 24000),
      chars: text.replace(/\s/g, '').length,
      createdAt: opts.createdAt || H.nowStamp(),
      category: cat.key,
      emoji: cat.emoji,
      price: priceLabel,
      priceMin: minP,
      priceMax: maxP,
      discount: discount,
      benefits: benefitLines.slice(0, 6),
      forWhom: forWhomSents.slice(0, 3),
      howTo: howSents.slice(0, 3),
      cautions: cautionSents.slice(0, 5),
      keywords: kws,
      personas: [],
      points: [],
      fields: []
    };
    product.personas = personasOf(product);
    product.points = pointsOf(product);
    product.fields = fieldsOf(product);
    return product;
  }

  /* ---- 페르소나 3종 ---- */
  var PERSONA_BANK = {
    '렌탈·타이어': [
      { n: '타이어 교체를 앞둔 운전자', d: '정비소에서 견적을 받아본 적은 있지만, 월 얼마인지 감이 안 잡히는 사람', t: '가격' },
      { n: '차량 지출을 나눠 관리하고 싶은 운전자', d: '목돈이 한 번에 나가는 게 부담스러워 고정비로 바꾸고 싶은 사람', t: '가격' },
      { n: '교체 후 관리까지 챙기고 싶은 운전자', d: '타이어를 바꾼 뒤 점검·보관까지 알아서 되는지를 먼저 보는 사람', t: '관리' }
    ],
    '인터넷·통신': [
      { n: '이사 앞두고 인터넷을 다시 알아보는 사람', d: '설치일과 사은품 조건을 동시에 확인해야 하는 상황', t: '혜택' },
      { n: '약정이 끝나 요금제를 갈아타려는 사람', d: '현재 요금과 결합 혜택을 비교하다 지친 사람', t: '가격' },
      { n: '부모님 댁 통신비를 대신 챙기는 사람', d: '본인 이름이 아닌 가족 명의로도 되는지가 관건', t: '절차' }
    ],
    '이사·청소': [
      { n: '이사 날짜만 정하고 업체는 아직인 사람', d: '견적을 여러 곳 받을 시간이 없는 상태', t: '시간' },
      { n: '입주 청소를 처음 맡겨보는 사람', d: '어디까지 해주는지(베란다·샷시) 기준이 궁금한 사람', t: '범위' },
      { n: '원룸 이사로 비용을 줄이고 싶은 사람', d: '짐이 적어 반포장·용달도 고민 중', t: '가격' }
    ],
    '지원금·금융': [
      { n: '내가 받을 수 있는 지원금이 있는지 궁금한 사람', d: '업종·매출 조건이 맞는지 스스로 판단이 안 서는 상태', t: '자격' },
      { n: '카드·대출 조건을 비교하다 지친 사람', d: '혜택은 많은데 실제로 얼마가 남는지 모르는 사람', t: '가격' },
      { n: '신청 절차가 복잡해 미뤄둔 자영업자', d: '서류와 기간을 놓칠까 봐 망설이는 사람', t: '절차' }
    ],
    '뷰티·건강': [
      { n: '처음 시술·관리를 알아보는 사람', d: '가격보다 안전과 후기를 먼저 보는 사람', t: '신뢰' },
      { n: '꾸준히 다니던 곳이 아쉬웠던 사람', d: '같은 가격이면 관리 항목이 많은 곳을 찾는 사람', t: '혜택' },
      { n: '기념일 전에 빠르게 관리하고 싶은 사람', d: '남은 날짜가 정해져 있어 예약 가능 시간이 중요', t: '시간' }
    ],
    '식품·맛집': [
      { n: '동네에서 새로 생긴 곳을 찾는 사람', d: '주말에 가족과 갈 만한 곳을 찾고 있음', t: '위치' },
      { n: '회식·모임 장소를 정해야 하는 사람', d: '인원 수용과 주차가 걸림돌', t: '편의' },
      { n: '가성비를 우선하는 혼밥러', d: '양과 가격을 먼저 보고 결정', t: '가격' }
    ],
    '교육·클래스': [
      { n: '퇴근 후에 배울 것을 찾는 직장인', d: '시간대와 기간이 맞아야 시작할 수 있는 사람', t: '시간' },
      { n: '독학으로 한계를 느낀 사람', d: '피드백이 있는 수업을 원함', t: '관리' },
      { n: '자격증 취득이 목표인 사람', d: '합격까지의 커리큘럼을 먼저 확인', t: '결과' }
    ],
    '여행·숙박': [
      { n: '주말에 가볍게 떠나려는 사람', d: '이동 시간과 체크인 시간이 중요', t: '시간' },
      { n: '가족과 함께 갈 숙소를 찾는 사람', d: '인원과 취사 가능 여부를 먼저 봄', t: '편의' },
      { n: '사진 찍기 좋은 곳을 찾는 사람', d: '분위기와 뷰가 결정 기준', t: '감성' }
    ],
    '생활·가전': [
      { n: '이사·혼수로 가전을 맞추는 사람', d: '설치와 배송일이 한 번에 잡히길 원함', t: '설치' },
      { n: '고장 난 가전을 바꿀 때를 놓친 사람', d: '수리비와 신품 가격을 비교 중', t: '가격' },
      { n: '관리 서비스까지 원하는 사람', d: '설치 후 AS가 되는지를 확인', t: '관리' }
    ],
    '쇼핑·패션': [
      { n: '사이즈 때문에 망설이는 사람', d: '교환·반품 조건을 먼저 보는 사람', t: '신뢰' },
      { n: '한 벌로 여러 코디를 하고 싶은 사람', d: '실사용 후기 사진을 찾아보는 편', t: '활용' },
      { n: '세일 기간을 기다리던 사람', d: '할인율과 종료일이 기준', t: '가격' }
    ],
    '생활·기타': [
      { n: '처음 알아보는 사람', d: '무엇을 먼저 확인해야 하는지부터 궁금한 상태', t: '기본' },
      { n: '가격을 비교 중인 사람', d: '숨은 비용과 조건까지 보고 싶은 사람', t: '가격' },
      { n: '이미 써본 적 있는 사람', d: '관리·AS와 재구매 조건을 확인', t: '관리' }
    ]
  };

  function personasOf(p) {
    var bank = PERSONA_BANK[p.category] || PERSONA_BANK['생활·기타'];
    var priceHint = p.price ? ('가격은 ' + p.price + ' 언저리로 알고 있는') : '가격 조건을 아직 모르는';
    var benefitHint = (p.benefits[0] ? cut(p.benefits[0], 34) : '');
    return bank.slice(0, 3).map(function (x, i) {
      var d = x.d;
      if (i === 0 && benefitHint) d = d + '. 눈에 들어온 문구는 "' + benefitHint + '"';
      if (i === 1 && p.price) d = d + ' (' + priceHint + ' 상태)';
      return { name: x.n, desc: d, tag: x.t };
    });
  }

  /* ---- 소구점 5가지 ---- */
  function pointsOf(p) {
    var out = [];
    var b = (p.benefits || []).filter(function (x) { return x.length > 6 && !/찾지 못했/.test(x); });
    var personas = p.personas;

    function add(title, desc, pi) {
      var t = trimPunct(title);
      if (!t || t.length < 4) return;
      for (var i = 0; i < out.length; i++) if (out[i].title === t) return;
      out.push({ title: cut(t, 40), desc: cut(desc || '', 90), persona: (personas[pi % personas.length] || {}).name || '' });
    }

    if (p.price) add(p.price + ' 기준으로 비교', '가격을 먼저 궁금해하는 사람에게 가장 빠른 훅이 됩니다. 조건(기간·약정·설치비)을 함께 적어야 심사에서 문제가 없습니다.', 1);
    b.slice(0, 3).forEach(function (s, i) { add(s, '페이지에 적힌 혜택 문장을 그대로 살려 소재 첫 줄에 씁니다. 출처 문장을 확인한 뒤 숫자만 바꿔 쓰세요.', i); });
    if (p.forWhom[0]) add('누가 신청할 수 있는지 먼저 보여주기', p.forWhom[0], 0);
    if (p.howTo[0]) add('신청 방법이 간단하다는 점', p.howTo[0], 2);
    if (p.discount) add(p.discount + ' 안내', '할인·무료 조건은 종료일과 함께 적어야 합니다.', 1);
    if (p.category === '렌탈·타이어') add('교체 후 관리까지 포함', '렌탈은 "바꾸고 끝"이 아니라 점검·보관이 붙는다는 점이 결정 요인입니다.', 2);
    if (out.length < 5 && p.keywords.length) {
      p.keywords.slice(0, 5).forEach(function (k) { if (out.length < 5) add(k + ' 키워드로 검색 잡기', '손님이 실제로 검색할 단어(' + k + ')를 제목·소개문구에 자연스럽게 넣습니다.', out.length); });
    }
    while (out.length < 5) {
      var fill = ['믿을 수 있는 조건 안내', '상담·문의 응답 속도', '주변 이웃의 실제 후기'][out.length % 3];
      add(fill, '페이지에서 근거 문장을 찾지 못했습니다. 실제 확인 후 숫자·후기를 채워 주세요.', out.length);
    }
    return out.slice(0, 5);
  }

  /* ---- 신청 조건 필드(출처 포함) ---- */
  function fieldsOf(p) {
    var src = function (arr) { return arr && arr.length ? arr[0] : ''; };
    var f = [];
    f.push({
      k: 'what', label: '어떤 신청을 받아야 하나요?', hint: '상담 신청, 회원가입 등 광고의 목표',
      value: p.title + ' 신청', source: p.rawTitle || p.title, badge: '페이지에서 추출'
    });
    f.push({
      k: 'who', label: '누가 신청할 수 있나요?', hint: '나이, 지역, 자격 등 신청 대상',
      value: p.forWhom.length ? p.forWhom.join(' / ') : '확인 필요', source: src(p.forWhom), badge: p.forWhom.length ? '페이지에서 추출' : '확인 필요'
    });
    f.push({
      k: 'price', label: '가격과 혜택', hint: '비용, 무료 여부, 제공하는 혜택',
      value: (p.price ? p.price + (p.discount ? ' · ' + p.discount : '') : '확인 필요') + (p.benefits.length ? ' — ' + p.benefits.slice(0, 3).join(' / ') : ''),
      source: src(p.benefits), badge: p.benefits.length ? '페이지에서 추출' : '확인 필요'
    });
    f.push({
      k: 'how', label: '신청은 어떻게 하나요?', hint: '고객이 신청을 마치기까지의 순서',
      value: p.howTo.length ? p.howTo.join(' → ') : '이름과 연락처를 남기면 담당자가 연락',
      source: src(p.howTo), badge: p.howTo.length ? '페이지에서 추출' : '확인 필요'
    });
    f.push({
      k: 'cpa', label: '어떤 신청이 실적으로 인정되나요?', hint: 'CPA 인정 조건과 제외되는 경우',
      value: '확인 필요', source: '', badge: '확인 필요'
    });
    f.push({
      k: 'ban', label: '꼭 지켜야 할 조건과 금지 표현', hint: '광고주 안내, 필수 고지, 사용하면 안 되는 문구',
      value: p.cautions.length ? p.cautions.join(' / ') : '확인 필요',
      source: src(p.cautions), badge: p.cautions.length ? '페이지에서 추출' : '확인 필요'
    });
    return f;
  }

  /* ===================================================================
     3. 상품 보관함
     =================================================================== */
  var Products = {
    list: function () {
      var v = S.get('products', null);
      return Array.isArray(v) ? v : [];
    },
    save: function (p) {
      if (!p || !p.title) return null;
      var list = Products.list();
      var item = p;
      var found = -1;
      for (var i = 0; i < list.length; i++) {
        if ((p.id && list[i].id === p.id) || (p.url && list[i].url === p.url && p.url)) { found = i; break; }
      }
      item.savedAt = H.nowStamp();
      if (found >= 0) { item.id = list[found].id; list[found] = item; }
      else { item.id = item.id || H.uid('p'); list.unshift(item); }
      S.set('products', list.slice(0, 40));
      return item;
    },
    get: function (id) {
      var list = Products.list();
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    },
    remove: function (id) {
      S.set('products', Products.list().filter(function (x) { return x.id !== id; }));
    },
    latest: function () { var l = Products.list(); return l.length ? l[0] : null; },
    options: function (selectedId, emptyLabel) {
      var list = Products.list();
      if (!list.length) return '<option value="">(보관함이 비어 있어요 — 먼저 사이트 분석으로 상품을 담아 주세요)</option>';
      var head = '<option value=""' + (selectedId ? '' : ' selected') + '>' + esc(emptyLabel || '전에 등록한 상품 불러오기') + '</option>';
      return head + list.map(function (p) {
        return '<option value="' + esc(p.id) + '"' + (p.id === selectedId ? ' selected' : '') + '>' + esc(p.emoji || '🧩') + ' ' + esc(cut(p.title, 30)) + ' · ' + esc(p.category) + '</option>';
      }).join('');
    }
  };

  /* ===================================================================
     4. 금칙어 / 심사 게이트
     =================================================================== */
  var BANNED = [
    { w: '최고', fix: '만족도가 높은' }, { w: '최상', fix: '상태가 좋은' }, { w: '최저가', fix: '가격이 좋은' },
    { w: '1위', fix: '많이 선택하는' }, { w: '유일', fix: '몇 안 되는' }, { w: '완벽', fix: '흠이 거의 없는' },
    { w: '최강', fix: '든든한' }, { w: '100%', fix: '대부분' }, { w: '보장', fix: '도움을 기대할 수 있는' },
    { w: '무조건', fix: '대부분의 경우' }, { w: '확실', fix: '가능성이 높은' }, { w: '부작용 없음', fix: '사용감은 개인차' },
    { w: '효과 보장', fix: '도움을 기대할 수 있음' }, { w: '만병통치', fix: '도움이 되는' }, { w: '특효', fix: '도움이 되는' },
    { w: '파격', fix: '할인된' }, { w: '반값', fix: '할인가' }, { w: '평생', fix: '장기간' },
    { w: '전액 환급', fix: '환불 조건 확인' }, { w: '무이자', fix: '조건부 무이자' }, { w: '원금보장', fix: '원금 보전 가능성' },
    { w: '수익 보장', fix: '수익 가능성' }, { w: '부업 보장', fix: '부수입 가능성' }, { w: '사은품 증정', fix: '사은품 제공(조건 확인)' }
  ];
  function bannedCheck(text) {
    var s = String(text || ''), out = [];
    BANNED.forEach(function (b) { if (s.indexOf(b.w) !== -1) out.push(b); });
    return out;
  }

  /* ===================================================================
     5. 카피 엔진 — 당근 제목
     =================================================================== */
  function shortOf(p) {
    var t = shortTitle(p.title, '상품');
    return cut(t.replace(/\s*[—–]\s*.*$/, ''), 22);
  }
  function priceShort(p) {
    if (!p.price) return '';
    return String(p.price).split(' ~')[0];
  }
  function benefitShort(p) {
    var b = (p.benefits || []).filter(function (x) { return x.length > 4 && !/찾지 못했/.test(x); })[0] || '';
    b = trimPunct(b).replace(/^[·・\-]\s*/, '');
    var s = shortOf(p);
    if (s && b.indexOf(s) === 0) b = trimPunct(b.slice(s.length).replace(/^[,\-–—:]\s*/, ''));
    b = b.replace(/(습니다|합니다|됩니다|입니다|이에요|예요|해요|돼요)\.?$/, '');
    b = b.replace(/,/g, ',');
    b = b.replace(/([0-9])([0-9]{3})\b/g, '$1,$2');
    return cut(b, 22);
  }

  function carrotTitles(p, opts) {
    opts = opts || {};
    var s = shortOf(p);
    var pr = priceShort(p);
    var bn = benefitShort(p);
    var dong = opts.dong || '{사용자 동네}';
    var out = [];
    function add(text, formula) {
      var t = trimPunct(String(text || '').replace(/\s+/g, ' '));
      if (!t || t.length < 6) return;
      /* 같은 단어가 두 번 나오면 버림 ("타이어 렌탈 타이어 4본") */
      var words = t.replace(/[0-9,]/g, '').split(/\s+/).filter(function (w) { return w.length >= 2; });
      var seen = {};
      for (var wi = 0; wi < words.length; wi++) {
        if (seen[words[wi]]) return;
        seen[words[wi]] = 1;
      }
      for (var i = 0; i < out.length; i++) if (out[i].text === t) return;
      out.push({ text: t, formula: formula, chars: t.length });
    }
    if (pr) add(s + ' ' + pr + '부터', '가격형');
    if (bn) add(s + ', ' + bn, '혜택형');
    add(dong + ' ' + s, '동네명형');
    if (pr) add(dong + ' ' + s + ' ' + pr, '동네·가격형');
    add(s + ', 이거 얼마인지 아세요?', '질문형');
    if (bn) add(s + ' 이렇게까지 됩니다', '반전형');
    add('이번 주까지 ' + s, '기간형');
    if (bn) add(s + ' ' + bn + ' 챙기세요', '혜택·행동형');
    add(s + ' 고민이면 3분만 보세요', '시간 약속형');
    if (pr) add(s + ' ' + pr + '이면 충분합니다', '가격 안심형');
    add(s + ' 비교하고 오세요', '비교형');
    add(s + ' 처음이어도 괜찮습니다', '진입장벽형');
    return out.slice(0, 10);
  }

  /* ===================================================================
     6. 카피 엔진 — 상세페이지 → 캐러셀 계획
     =================================================================== */
  function carouselPlan(p, opts) {
    opts = opts || {};
    var count = Math.max(3, Math.min(10, opts.count || 8));
    var sents = sentencesOf(opts.text || p.text || '');
    var heads = [], used = {}, usedBody = {};
    function phrase(s) {
      var v = trimPunct(s).replace(/[.。]$/, '');
      var parts = v.split(/[,·—–]/);
      var first = trimPunct(parts[0]);
      if (first.length >= 10 && first.length <= 30) return first;
      return cut(v, 30);
    }
    function addHead(t) {
      var v = phrase(t);
      if (v.length < 8 || v.length > 32) return;
      if (used[v]) return;
      used[v] = 1;
      heads.push(v);
    }
    (p.benefits || []).forEach(function (b) { addHead(b); });
    (p.points || []).forEach(function (pt) { addHead(pt.title); });
    sents.forEach(function (s) { if (heads.length < 20) addHead(s); });

    var bodies = [];
    function addBody(s) {
      var v = trimPunct(s).replace(/[.。]$/, '');
      if (v.length < 16) return;
      if (usedBody[v.slice(0, 14)]) return;
      usedBody[v.slice(0, 14)] = 1;
      bodies.push(cut(v, 110));
    }
    (p.benefits || []).forEach(function (b) { addBody(b); });
    sents.forEach(function (s) { addBody(s); });
    if (!bodies.length) bodies.push('자세한 조건은 신청 페이지에서 확인하세요.');

    var blocks = [];
    blocks.push({
      kind: 'cover', eyebrow: (opts.eyebrow || p.category || '정보'),
      title: opts.title || cut(p.title, 40),
      sub: opts.sub || (benefitShort(p) ? benefitShort(p) + ' — 끝까지 보면 정리됩니다' : '끝까지 보면 정리됩니다 · 저장해 두세요')
    });
    var bodyCount = count - 2, usedB = {};
    for (var i = 0; i < bodyCount; i++) {
      var h = heads[i % Math.max(1, heads.length)] || '핵심 정리';
      var bi = i % bodies.length, guard = 0;
      while (usedB[bi] && guard < bodies.length) { bi = (bi + 1) % bodies.length; guard++; }
      usedB[bi] = 1;
      var b = bodies[bi];
      if (b && b.indexOf(h.slice(0, 8)) === 0 && bodies.length > 1) b = bodies[(bi + 1) % bodies.length];
      blocks.push({ kind: 'body', no: i + 1, title: h, body: b });
    }
    blocks.push({
      kind: 'cta', title: opts.ctaTitle || '정리해 두고 필요할 때 보세요',
      sub: (p.price ? '가격 ' + p.price + '\n' : '') + (p.url ? domainOf(p.url) + ' 에서 확인' : '자세한 조건은 프로필 링크에서')
    });
    return blocks.map(function (b, i) { b.index = i; b.total = blocks.length; return b; });
  }

  /* ===================================================================
     7. 카피 엔진 — 카페 원고 6개
     =================================================================== */
  function cafeDrafts(p, opts) {
    opts = opts || {};
    var purpose = opts.purpose || 'intro'; /* intro | ask */
    var persona = opts.persona || (p.personas[0] || { name: '동네 이웃', desc: '' });
    var cafe = opts.cafeName || '동네 카페';
    var nick = opts.nick || '오늘도담음';
    var deadline = opts.deadline || '';
    var quota = opts.quota || '';
    var extra = trimPunct(opts.extra || '');
    var link = isLive(p.url) ? p.url : '(링크 자리 — 카페 규정에 맞게 넣어 주세요)';
    var priceTxt = p.price || '가격은 조건에 따라 다름';
    var ben = (p.benefits || []).filter(function (b) { return !/찾지 못했/.test(b); });
    var b1 = ben[0] || '혜택은 페이지에서 확인';
    var b2 = ben[1] || '';
    var b3 = ben[2] || '';
    var name = shortOf(p);
    var who = persona.name;
    var cond = [];
    if (deadline) cond.push(deadline);
    if (quota) cond.push(quota);

    function condLine() {
      if (!cond.length) return '';
      if (deadline && quota) return '\n이번에는 ' + deadline + '이고, ' + quota + '예요.';
      return '\n이번에는 ' + cond[0] + '예요.';
    }
    function tail() {
      return '\n\n' + link + (extra ? '\n\n(' + extra + ')' : '') + '\n\n※ 이 글은 업체로부터 소정의 혜택을 받고 작성했을 수 있습니다.';
    }

    var drafts = [];

    /* 일상 1 */
    drafts.push({
      key: 'daily1', label: '일상 1', kind: '일상',
      title: cut('요즘 ' + name + ' 이야기 듣고 비용부터 견적 내봤어요', 48),
      body: [
        '평일 퇴근하고 ' + cafe + ' 눈팅만 하다가 오늘은 글을 써봅니다.',
        '',
        '얼마 전 ' + who + ' 입장에서 ' + name + ' 이야기를 듣게 됐는데, 조건이 생각보다 단순해서 놀랐어요.',
        '· ' + b1,
        b2 ? '· ' + b2 : '',
        priceTxt ? '· 가격은 ' + priceTxt + ' 정도로 보면 됩니다' : '',
        '',
        cond.length ? condLine().trim() : '',
        '저처럼 처음 알아보는 분들은 ' + (p.forWhom[0] ? cut(trimPunct(p.forWhom[0]).replace(/[.。]$/, ''), 38) : '조건부터 확인') + ' — 이 부분을 먼저 보시면 될 것 같아요.',
        tail()
      ].filter(Boolean).join('\n')
    });

    /* 일상 2 */
    drafts.push({
      key: 'daily2', label: '일상 2', kind: '일상',
      title: cut('이번 주말에 ' + name + ' 알아본 후기 (광고 아님)', 48),
      body: [
        '주말에 시간이 나서 ' + name + ' 관련해서 이것저것 비교해봤습니다.',
        '',
        '결론부터 말하면, 저는 "' + b1 + '" 이 문구에서 멈췄어요.',
        '처음엔 다 비슷해 보이는데, 조건을 하나씩 뜯어보면 차이가 꽤 있더라고요.',
        '',
        '제가 본 기준은 세 가지입니다.',
        '1. 실제로 내가 쓸 수 있는 조건인지',
        '2. 나중에 추가로 나가는 비용이 있는지',
        '3. 문의했을 때 언제까지 답을 주는지',
        '',
        '참고로 ' + priceTxt + ' 정도면 ' + who + ' 기준에서 무리 없는 선이에요.',
        '혹시 더 좋은 조건 아시는 분 있으면 댓글로 알려주세요.',
        tail()
      ].filter(Boolean).join('\n')
    });

    /* 고민 1 */
    drafts.push({
      key: 'worry1', label: '고민 1', kind: '고민',
      title: cut(name + ' 때문에 며칠째 고민 중입니다', 48),
      body: [
        '안녕하세요, ' + cafe + '에서 처음 글 씁니다.',
        '',
        '상황은 이렇습니다. ' + (persona.desc || who + ' 입장에서 결정을 못 하고 있어요.'),
        '',
        '궁금한 점',
        '1. ' + b1 + ' 이 조건이 실제로 지켜지는지',
        '2. 신청하고 나서 취소나 변경이 어려운지',
        '3. ' + (p.cautions[0] ? cut(p.cautions[0], 60) : '따로 챙겨야 하는 서류나 조건이 있는지'),
        '',
        '가격은 ' + priceTxt + ' 정도로 알고 있는데, 이 정도면 괜찮은 편인가요?',
        '경험 있으신 분 답변 주시면 정말 감사하겠습니다.',
        '',
        link
      ].filter(Boolean).join('\n')
    });

    /* 고민 2 */
    drafts.push({
      key: 'worry2', label: '고민 2', kind: '고민',
      title: cut(name + ' 지금 해도 될까요? 조언 부탁드려요', 48),
      body: [
        ' ' + (deadline ? deadline + '라서 마음이 급해졌습니다.' : '시기가 애매해서 계속 미루고 있어요.'),
        '',
        '제가 걱정하는 건 두 가지예요.',
        '· ' + (p.cautions[0] ? cut(p.cautions[0], 70) : '조건이 바뀌면 손해가 아닐까'),
        '· ' + (p.cautions[1] ? cut(p.cautions[1], 70) : '나중에 해지·변경이 어렵지 않을까'),
        '',
        '반대로 마음이 기운 이유는 ' + b1 + ' 때문입니다.',
        b2 ? '· ' + b2 : '',
        '',
        who + ' 입장에서 먼저 해보신 분 계시면 어떤 점을 확인하고 결정하셨는지 궁금합니다.',
        tail()
      ].filter(Boolean).join('\n')
    });

    /* 정보 1 */
    var info1 = [
      '[' + p.category + '] ' + name + ' 조건 정리해봤습니다',
      '',
      '페이지에 적힌 내용을 제가 이해한 대로만 정리했습니다. 숫자는 꼭 원문에서 다시 확인하세요.'
    ];
    if (priceTxt) info1.push('', '■ 가격', '· ' + priceTxt);
    if (ben.length) {
      info1.push('', '■ 혜택');
      ben.slice(0, 4).forEach(function (b) { info1.push('· ' + cut(b, 70)); });
    }
    if (p.forWhom.length) {
      info1.push('', '■ 대상');
      p.forWhom.slice(0, 2).forEach(function (b) { info1.push('· ' + cut(b, 70)); });
    }
    if (p.howTo[0]) info1.push('', '■ 신청 방법', '· ' + cut(p.howTo[0], 80));
    if (p.cautions.length) {
      info1.push('', '■ 주의');
      p.cautions.slice(0, 3).forEach(function (b) { info1.push('· ' + cut(b, 70)); });
    }
    info1.push(condLine() || '');
    info1.push('', '도움 되셨으면 추천 한 번 눌러주세요. 틀린 내용은 댓글로 알려주시면 고치겠습니다.');
    drafts.push({
      key: 'info1', label: '정보 1', kind: '정보',
      title: cut('[' + p.category + '] ' + name + ' 조건 한 번에 정리', 48),
      body: info1.filter(function (x) { return x !== '' || true; }).join('\n').replace(/\n\n\n+/g, '\n\n') + '\n\n' + link
    });

    /* 정보 2 */
    drafts.push({
      key: 'info2', label: '정보 2', kind: '정보',
      title: cut(who + '가 ' + name + ' 고를 때 보는 기준 3가지', 48),
      body: [
        '같은 상품도 ' + who + '에게는 보는 순서가 다릅니다. 제가 정리한 기준 공유합니다.',
        '',
        '1. 먼저 확인 — ' + (p.forWhom[0] ? cut(p.forWhom[0], 60) : '내가 대상인지'),
        '2. 숫자 확인 — ' + (priceTxt ? priceTxt + ' 이 실제로 얼마인지(기간·부가비용 포함)' : '가격과 기간'),
        '3. 마지막 — ' + (p.cautions[0] ? cut(p.cautions[0], 60) : '해지·변경 조건'),
        '',
        '이 순서로 보면 ' + name + ' 말고 다른 곳을 볼 때도 판단이 빨라집니다.',
        b1 ? '참고로 이번 건은 "' + cut(b1, 40) + '" 부분이 가장 눈에 들어왔습니다.' : '',
        tail()
      ].filter(Boolean).join('\n')
    });

    var comments = [
      { u: '봄날의곰', t: '정보 감사합니다. 저도 같은 고민이었는데 도움됐어요.' },
      { u: '초보살림꾼', t: (p.cautions[0] ? cut(p.cautions[0], 50) + ' 부분이 있던데 이것도 확인하셨나요?' : '혹시 신청 기간은 언제까지인가요?') },
      { u: nick, me: true, t: cond.length ? (cond.join(', ') + '라고 합니다. 저도 그 부분 확인하고 있어요.') : '확인되는 대로 글에 업데이트할게요.' },
      { u: '동네주민A', t: '저는 지난달에 알아봤는데 상담이 빨랐어요. 참고하세요.' },
      { u: nick, me: true, t: '알려주셔서 감사합니다. 결정하게 되면 후기도 남길게요.' }
    ];
    if (purpose === 'ask') {
      drafts.forEach(function (d) {
        if (d.kind === '정보') return;
        d.body = d.body.replace(/\n\n※ 이 글은[^\n]*/, '');
      });
    }
    return { drafts: drafts, comments: comments, persona: persona };
  }

  /* ===================================================================
     8. 카피 엔진 — 컨닝페이퍼
     =================================================================== */
  function cheatSheet(p, opts) {
    opts = opts || {};
    var s = shortOf(p);
    var pr = priceShort(p);
    var ben = (p.benefits || []).filter(function (b) { return !/찾지 못했/.test(b); });
    var heads = [];
    function hd(t) { var v = trimPunct(t); if (v && heads.indexOf(v) === -1 && v.length >= 6) heads.push(v); }
    if (pr) hd(s + ', ' + pr + '부터');
    if (ben[0]) hd(cut(ben[0], 40));
    hd(s + ' 이 조건이면 해볼 만합니다');
    if (pr) hd(pr + '에 끝내는 ' + s);
    hd(s + ', 신청 전 1분만 확인하세요');
    var subs = [];
    if (ben[1]) subs.push(cut(ben[1], 46));
    if (p.forWhom[0]) subs.push(cut(p.forWhom[0], 46));
    subs.push(cut((p.cautions[0] ? p.cautions[0] : '자세한 조건은 신청 페이지에서 확인하세요'), 46));
    var bullets = [];
    (ben.length ? ben : p.points.map(function (x) { return x.title; })).slice(0, 4).forEach(function (b) { bullets.push(cut(b, 34)); });
    while (bullets.length < 4) bullets.push(['조건 확인', '신청 절차', '사후 관리', '비용 안내'][bullets.length]);
    return {
      headline: heads.slice(0, 5),
      sub: subs.slice(0, 3),
      bullets: bullets.slice(0, 4),
      cta: [s + ' 신청하기', '조건 확인하기', pr ? pr + '부터 시작하기' : '무료로 확인하기', '문의 남기기'],
      caution: p.cautions.slice(0, 3),
      banned: bannedCheck([heads[0] || ''].concat(bullets).join(' '))
    };
  }

  /* ===================================================================
     9. 캔버스 도구
     =================================================================== */
  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
  function wrapText(ctx, text, maxWidth) {
    var keep = String(text || '').split('\n'), out = [];
    keep.forEach(function (para) {
      if (!para) { out.push(''); return; }
      var words = para.split(/\s+/).filter(Boolean), line = '';
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = words[i]; }
        else line = test;
      }
      if (line) out.push(line);
    });
    return out.length ? out : [''];
  }
  function drawLines(ctx, arr, x, y, lh, max) {
    var n = Math.min(arr.length, max || 99), i;
    for (i = 0; i < n; i++) ctx.fillText(arr[i], x, y + i * lh);
    return y + n * lh;
  }
  function coverDraw(ctx, img, x, y, w, h) {
    var ir = img.width / img.height, br = w / h, sw, sh, sx, sy;
    if (ir > br) { sh = img.height; sw = sh * br; sx = (img.width - sw) / 2; sy = 0; }
    else { sw = img.width; sh = sw / br; sx = 0; sy = (img.height - sh) / 2; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  /* *별표* 강조 → 구간 목록 */
  function segments(text, accent) {
    var parts = String(text || '').split(/\*([^*]+)\*/g);
    return parts.map(function (p, i) { return { text: p, accent: i % 2 === 1 }; });
  }
  /* 한 줄 안에서 강조 부분에 형광펜 */
  function drawRichLine(ctx, line, x, y, accent, pad) {
    var segs = segments(line, accent);
    var cx = x;
    var total = 0;
    segs.forEach(function (s) { total += ctx.measureText(s.text).width; });
    if (segs.some(function (s) { return s.accent; })) {
      var startX = x + total; // placeholder to avoid lint
      startX = x;
      segs.forEach(function (s) {
        var w = ctx.measureText(s.text).width;
        if (s.accent) {
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = accent;
          var p = pad == null ? 6 : pad;
          ctx.fillRect(cx - 3, y - ctx.measureText('M').width * 0.72 - p, w + 6, ctx.measureText('M').width * 0.98 + p * 2);
          ctx.restore();
        }
        ctx.fillText(s.text, cx, y);
        cx += w;
      });
    } else {
      ctx.fillText(line, x, y);
    }
  }
  function hexA(hex, a) {
    var h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function downloadCanvas(cv, name) {
    var a = document.createElement('a');
    a.href = cv.toDataURL('image/png');
    a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('이미지를 읽지 못했어요')); };
        img.src = fr.result;
      };
      fr.onerror = function () { reject(new Error('파일을 읽지 못했어요')); };
      fr.readAsDataURL(file);
    });
  }
  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(new Error('파일을 읽지 못했어요')); };
      fr.readAsDataURL(file);
    });
  }

  /* ===================================================================
     10. 진행 패널 헬퍼 (각 자판기 공용)
     =================================================================== */
  function progressHtml(title, rows) {
    return '<div class="aiwork"><div class="aih"><span class="spin"></span><b>' + esc(title) + '</b></div>' +
      '<div class="airows">' + rows.map(function (r, i) {
        return '<div class="airow" data-prow="' + i + '"><span class="pdot"></span>' +
          '<span class="plabel">' + esc(r.label) + '</span>' +
          '<span class="pmsg">' + esc(r.msg || '대기') + '</span></div>';
      }).join('') + '</div></div>';
  }

  /* ===================================================================
     export
     =================================================================== */
  App.ads = {
    /* 텍스트 */
    won: won, wonAuto: wonAuto, cut: cut, trimPunct: trimPunct, deent: deent,
    htmlToText: htmlToText, mdToPlain: mdToPlain, sentencesOf: sentencesOf,
    normalizeUrl: normalizeUrl, isLive: isLive, domainOf: domainOf,
    /* 읽기/분석 */
    readPage: readPage, analyze: analyze, bump: analyze,
    /* 보관함 */
    products: Products,
    /* 카피 */
    carrotTitles: carrotTitles, carouselPlan: carouselPlan, cafeDrafts: cafeDrafts,
    cheatSheet: cheatSheet, bannedCheck: bannedCheck, shortOf: shortOf,
    benefitShort: benefitShort, priceShort: priceShort, shortTitle: shortTitle,
    /* 그리기 */
    canvas: {
      roundRect: roundRect, wrap: wrapText, drawLines: drawLines, cover: coverDraw,
      drawRichLine: drawRichLine, hexA: hexA, download: downloadCanvas
    },
    loadImage: loadImageFromFile, fileToDataUrl: fileToDataUrl,
    progressHtml: progressHtml
  };
})();
