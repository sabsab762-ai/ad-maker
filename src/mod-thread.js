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
