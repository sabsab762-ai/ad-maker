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
