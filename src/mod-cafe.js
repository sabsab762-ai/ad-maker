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
