/* =====================================================================
   Module 13 · 🃏 타로카드 자판기 (메이저 아르카나 22장 · 직접 뒤집기)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, TC = window.TarotCore;

  function deckHtml() {
    var out = '';
    for (var i = 0; i < 22; i++) {
      out += '<button class="tt-card" type="button" data-card="' + i + '" aria-label="' + (i + 1) + '번째 카드 뒤집기" aria-pressed="false">' +
        '<span class="tt-inner"><span class="tt-back"><i>✦</i><b>?</b></span>' +
        '<span class="tt-face" data-face></span></span></button>';
    }
    return out;
  }

  function cardFace(c) {
    return '<span class="tt-emoji">' + c.card.emoji + '</span>' +
      '<span class="tt-roman">' + esc(TC.romanOf(c.card.n)) + '</span>' +
      '<span class="tt-cname">' + esc(c.card.name) + '</span>' +
      (c.reversed ? '<span class="tt-rev">역</span>' : '');
  }

  function readingHtml(r) {
    var html = '<div class="out">';
    r.cards.forEach(function (c, i) {
      html += '<div class="cardout"><div class="ch"><span class="t">' + esc(c.pos) + ' · ' + esc(c.roman) + '. ' + esc(c.name) + '</span>' +
        '<span class="m">' + (c.reversed ? '카드가 거꾸로' : '바른 방향') + '</span></div>' +
        '<div class="cb" style="white-space:normal">' +
        '<div class="tt-read-top"><span class="tt-read-emoji">' + c.emoji + '</span>' +
        '<div><b>' + esc(c.name) + ' <small>' + esc(c.en) + '</small></b>' +
        '<div class="chiprow" style="margin-top:4px">' + c.kw.map(function (k) {
          return '<span class="tag">' + esc(k) + '</span>';
        }).join('') + '<span class="tag ' + (c.reversed ? 'warn' : 'ok') + '">' + (c.reversed ? '역방향' : '정방향') + '</span></div></div></div>' +
        '<p class="tt-line">' + esc(c.topicLine) + '</p>' +
        '<p class="tt-mean">' + esc(c.line) + '</p>' +
        '<p class="tt-advice"><b>조언</b> ' + esc(c.advice) + '</p>' +
        '</div></div>';
    });

    html += '<div class="cardout"><div class="ch"><span class="t">🧭 종합 결론</span><span class="m">' + esc(r.verdict.label) + '</span></div>' +
      '<div class="cb" style="white-space:normal">' +
      '<b class="tt-verdict">' + esc(r.verdict.label) + '</b>' +
      '<p class="tt-line" style="margin-top:6px">' + esc(r.conclusion) + '</p>' +
      '<p class="hint" style="margin-top:8px">' + esc(r.flow) + '</p>' +
      '<div class="actions"><button class="btn btn-soft" type="button" id="tt-copy-all">리딩 전체 복사</button>' +
      '<button class="btn btn-line" type="button" id="tt-again">카드 다시 뽑기</button></div>' +
      '</div></div>';
    html += '</div>';
    return html;
  }

  function postsHtml(posts) {
    return '<section class="panel" style="margin-top:14px"><h3>📣 공유 문구 <span class="pill">원클릭 복사</span></h3>' +
      '<p class="psub">뽑은 카드로 만든 SNS 캡션·릴스 대본·제휴 CTA입니다. 링크를 비우면 “프로필 링크”로 표시됩니다.</p>' +
      posts.map(function (p, i) {
        return '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">' + esc(p.label) + '</span>' +
          '<span class="m">' + p.text.length + '자</span></div>' +
          '<div class="cb scroll">' + esc(p.text) + '</div>' +
          '<div style="padding:0 13px 12px"><button class="btn btn-sm btn-soft" type="button" data-post="' + i + '">복사</button></div></div>';
      }).join('') + '</section>';
  }

  App.register({
    id: 'tarot', emoji: '🃏', name: '타로카드 자판기', free: true, tag: '무료 · 22장',
    desc: '질문 고르고 카드를 직접 뒤집어 리딩 + 릴스 대본·제휴 CTA까지.',
    help: '질문 주제(연애·재회 / 재물·돈 / 이직·진로 / 대인·관계 / 오늘의 한 장)와 스프레드(1장 원카드, 3장 과거·현재·미래)를 고르고 카드를 직접 뒤집으면, 메이저 아르카나 22장의 정방향·역방향 의미와 핵심 조언으로 리딩을 만들어 줍니다. 마지막에 SNS 공유 문구·릴스 대본·제휴 CTA를 원클릭으로 복사할 수 있어요. 재미·콘텐츠용입니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent =
        '.tt-deck{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:7px;margin-top:12px}' +
        '.tt-card{position:relative;padding:0;border:0;background:none;aspect-ratio:2/3;perspective:700px;cursor:pointer;min-width:0}' +
        '.tt-card:disabled{cursor:default}' +
        '.tt-inner{position:relative;display:block;width:100%;height:100%;transform-style:preserve-3d;transition:transform .42s cubic-bezier(.3,.9,.3,1)}' +
        '.tt-card.flipped .tt-inner{transform:rotateY(180deg)}' +
        '.tt-back,.tt-face{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;' +
        'border-radius:8px;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}' +
        '.tt-back{background:linear-gradient(150deg,#5A2EE8,#8B6CF0 55%,#4C24D6);border:1px solid #4C24D6;color:#fff}' +
        '.tt-back i{font-size:11px;opacity:.85;font-style:normal}' +
        '.tt-back b{font-size:13px;font-weight:800;opacity:.5}' +
        '.tt-back::after{content:"";position:absolute;inset:4px;border:1px solid rgba(255,255,255,.32);border-radius:5px}' +
        '.tt-face{transform:rotateY(180deg);background:#fff;border:1px solid #E4DDFB;box-shadow:0 2px 8px rgba(99,56,245,.14)}' +
        '.tt-emoji{font-size:17px;line-height:1}' +
        '.tt-roman{font-size:8.5px;font-weight:800;color:#9C9CA8;letter-spacing:.02em}' +
        '.tt-cname{font-size:8.5px;font-weight:800;color:#3A3A44;text-align:center;line-height:1.15;word-break:keep-all;padding:0 1px}' +
        '.tt-rev{position:absolute;top:2px;right:2px;font-size:8px;font-weight:800;color:#C63A3A;background:#FFEDED;border-radius:4px;padding:0 3px}' +
        '.tt-card.picked{transform:translateY(-3px)}' +
        '.tt-card.picked .tt-face{border-color:#6338F5;box-shadow:0 6px 16px rgba(99,56,245,.26)}' +
        '.tt-status{display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap;font-size:12.5px;color:var(--sub);font-weight:700}' +
        '.tt-status b{color:var(--violet-d)}' +
        '.tt-read-top{display:flex;align-items:center;gap:11px}' +
        '.tt-read-emoji{width:46px;height:46px;flex:none;display:grid;place-items:center;font-size:24px;background:var(--violet-soft);border-radius:12px}' +
        '.tt-read-top b{font-size:14.5px;letter-spacing:-.02em}' +
        '.tt-read-top small{font-size:10.5px;font-weight:700;color:var(--muted);margin-left:4px}' +
        '.tt-line{margin-top:9px;font-size:13px;line-height:1.75;color:#2A2A33;font-weight:700;word-break:keep-all}' +
        '.tt-mean{margin-top:5px;font-size:12.5px;line-height:1.75;color:#5A5A66;word-break:keep-all}' +
        '.tt-advice{margin-top:8px;font-size:12px;line-height:1.7;color:#43337F;background:var(--violet-soft);border-radius:9px;padding:9px 11px}' +
        '.tt-advice b{font-weight:800;color:var(--violet-d);margin-right:4px}' +
        '.tt-verdict{font-size:14px;color:var(--violet-d)}' +
        '@media (max-width:960px){.tt-deck{grid-template-columns:repeat(8,minmax(0,1fr))}}' +
        '@media (max-width:720px){.tt-deck{grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.tt-emoji{font-size:15px}.tt-cname{font-size:8px}}';
      document.head.appendChild(st);

      var topicChips = TC.TOPICS.map(function (t, i) {
        return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-topic="' + t.v + '" aria-pressed="' + (i === 0) + '">' +
          t.icon + ' ' + esc(t.label) + '</button>';
      }).join('');
      var spreadChips = TC.SPREADS.map(function (t, i) {
        return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-spread="' + t.v + '" aria-pressed="' + (i === 0) + '">' + esc(t.label) + '</button>';
      }).join('');

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🃏 질문과 방식</h3>' +
            '<div class="field"><label>질문 주제</label><div class="chiprow" style="margin-top:0" id="tt-topics">' + topicChips + '</div></div>' +
            '<div class="field"><label for="tt-q">질문 <span class="muted small">(선택)</span></label>' +
              '<input id="tt-q" type="text" placeholder="예: 그 사람이 다시 연락할까요?" maxlength="60"></div>' +
            '<div class="field"><label>스프레드</label><div class="chiprow" style="margin-top:0" id="tt-spreads">' + spreadChips + '</div>' +
              '<p class="tip" id="tt-spread-desc">1장 원카드 — 지금 가장 필요한 한 가지</p></div>' +
            '<div class="sep"></div>' +
            '<div class="field"><label for="tt-brand">채널 · 상담소 이름 <span class="muted small">(선택)</span></label>' +
              '<input id="tt-brand" type="text" placeholder="예: 김카마 타로" maxlength="30"></div>' +
            '<div class="field"><label for="tt-link">제휴 · 상담 링크 <span class="muted small">(선택)</span></label>' +
              '<input id="tt-link" type="url" placeholder="https://... (없으면 비워 두세요)">' +
              '<p class="tip">공유 문구·릴스 대본·CTA에 그대로 들어갑니다.</p></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="tt-run" disabled>🔮 리딩 보기</button></div>' +
            '<p class="hint">리딩은 뽑은 카드로만 만들어집니다. 카드를 다시 뽑으면 결과도 새로 나옵니다. 재미로 보는 타로예요.</p>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>🎴 카드 섞기 · 직접 뒤집기 <span class="pill" id="tt-need">1장</span></h3>' +
            '<p class="psub">아래 카드 더미에서 뽑고 싶은 카드를 눌러 뒤집으세요. <b>카드를 누르면 그 자리에서 정방향/역방향이 정해집니다.</b></p>' +
            '<div class="tt-deck" id="tt-deck">' + deckHtml() + '</div>' +
            '<div class="tt-status"><span id="tt-count">0 / 1장 선택</span>' +
              '<button class="btn btn-sm btn-line" type="button" id="tt-shuffle" style="margin-left:auto">🔄 다시 섞기</button></div>' +
          '</section></div>' +
        '</div>' +
        '<div id="tt-out" style="margin-top:14px"><section class="panel"><h3>🃏 리딩 결과</h3>' +
          '<div class="empty"><b>아직 카드를 뽑지 않았어요</b>주제와 스프레드를 고르고 카드를 뒤집으면 리딩이 나옵니다.</div>' +
        '</section></div>';

      var el = {
        q: H.$('#tt-q', root), brand: H.$('#tt-brand', root), link: H.$('#tt-link', root),
        deck: H.$('#tt-deck', root), out: H.$('#tt-out', root),
        run: H.$('#tt-run', root), count: H.$('#tt-count', root), need: H.$('#tt-need', root),
        spreadDesc: H.$('#tt-spread-desc', root)
      };
      var state = { topic: 'love', spread: '1', deck: [], picked: [], reading: null, posts: [] };

      var saved = S.get('tarot.last', null);
      if (saved) {
        if (saved.topic) state.topic = saved.topic;
        if (saved.spread) state.spread = saved.spread;
        if (saved.brand) el.brand.value = saved.brand;
        if (saved.link) el.link.value = saved.link;
        H.$$('[data-topic]', root).forEach(function (x) {
          var on = x.getAttribute('data-topic') === state.topic;
          x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        H.$$('[data-spread]', root).forEach(function (x) {
          var on = x.getAttribute('data-spread') === state.spread;
          x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        var sp0 = TC.spreadOf(state.spread);
        el.need.textContent = sp0.count + '장';
        el.spreadDesc.textContent = sp0.label + ' — ' + sp0.desc;
      }

      H.$$('[data-topic]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          state.topic = b.getAttribute('data-topic');
          H.$$('[data-topic]', root).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
          if (state.picked.length === needCount()) {
            state.reading = TC.buildReading({
              topic: state.topic, spread: state.spread, question: el.q.value, cards: state.picked
            });
            showReading(state.reading);
          }
        });
      });
      H.$$('[data-spread]', root).forEach(function (b) {
        b.addEventListener('click', function () {
          state.spread = b.getAttribute('data-spread');
          H.$$('[data-spread]', root).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
          b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
          var sp = TC.spreadOf(state.spread);
          el.need.textContent = sp.count + '장';
          el.spreadDesc.textContent = sp.label + ' — ' + sp.desc;
          reshuffle();
        });
      });

      function needCount() { return TC.spreadOf(state.spread).count; }

      function updateStatus() {
        el.count.textContent = state.picked.length + ' / ' + needCount() + '장 선택';
        el.run.disabled = state.picked.length !== needCount();
        el.run.textContent = el.run.disabled
          ? '🔮 리딩 보기 (' + (needCount() - state.picked.length) + '장 더)'
          : '🔮 리딩 보기';
      }

      function reshuffle(initial) {
        state.deck = TC.shuffleAll();      /* 22장을 새로 섞어 두고, 뒤집은 순서대로 사용 */
        state.picked = [];
        state.reading = null;
        var cards = H.$$('[data-card]', el.deck);
        cards.forEach(function (c, i) {
          c.classList.remove('flipped', 'picked');
          c.disabled = false;
          c.setAttribute('aria-pressed', 'false');
          c.setAttribute('aria-label', (i + 1) + '번째 카드 뒤집기');
          var face = H.$('[data-face]', c);
          if (face) face.innerHTML = '';
        });
        el.need.textContent = needCount() + '장';
        el.out.innerHTML = '<section class="panel"><h3>🃏 리딩 결과</h3><div class="empty"><b>' +
          (initial ? '카드 22장을 섞어 두었어요' : '카드를 다시 섞었어요') +
          '</b>뽑고 싶은 카드를 눌러 뒤집어 주세요.</div></section>';
        updateStatus();
      }

      el.deck.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-card]');
        if (!btn || btn.disabled || btn.classList.contains('flipped')) return;
        var idx = +btn.getAttribute('data-card');
        if (state.picked.length >= needCount()) {
          App.toast(needCount() + '장을 이미 뽑았어요. 다시 섞으면 새로 뽑을 수 있습니다.');
          return;
        }
        var drawn = state.deck[idx];
        if (!drawn) return;
        var face = H.$('[data-face]', btn);
        if (face) face.innerHTML = cardFace(drawn);   /* 뒤집는 순간에만 앞면을 그립니다 */
        btn.classList.add('flipped', 'picked');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', drawn.card.name + (drawn.reversed ? ' 역방향' : ' 정방향'));
        state.picked.push(drawn);
        updateStatus();
        if (state.picked.length === needCount()) {
          App.toast('카드 ' + needCount() + '장을 다 뽑았어요. 리딩 보기를 눌러주세요.');
          el.run.focus({ preventScroll: true });
        }
      });

      el.run.addEventListener('click', function () {
        if (state.picked.length !== needCount()) { App.toast('카드를 먼저 뽑아 주세요.'); return; }
        var r = TC.buildReading({
          topic: state.topic, spread: state.spread,
          question: el.q.value, cards: state.picked
        });
        state.reading = r;
        S.set('tarot.last', { topic: state.topic, spread: state.spread, brand: el.brand.value, link: el.link.value });
        showReading(r);
        App.toast('리딩을 봤어요 — ' + r.verdict.label);
      });

      H.$('#tt-shuffle', root).addEventListener('click', function () {
        reshuffle();
        App.toast('카드를 새로 섞었어요.');
      });

      function showReading(r) {
        var brand = el.brand.value.trim();
        var link = String(el.link.value || '').trim();
        state.posts = TC.promo(r, brand, link);
        el.out.innerHTML = '<section class="panel"><h3>🃏 리딩 결과 <span class="pill">' + esc(r.input.spreadLabel) + '</span></h3>' +
          '<p class="psub"><b>' + esc(r.headline) + '</b> · ' + esc(r.verdict.label) + '</p>' +
          '<div style="margin-top:12px">' + readingHtml(r) + '</div></section>' + postsHtml(state.posts);

        H.$('#tt-copy-all', el.out).addEventListener('click', function () { App.copy(r.plain, this, '리딩 전체를 복사했어요.'); });
        H.$('#tt-again', el.out).addEventListener('click', function () { reshuffle(); el.out.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        H.$$('[data-post]', el.out).forEach(function (b) {
          b.addEventListener('click', function () {
            var i = +b.getAttribute('data-post');
            App.copy(state.posts[i].text, b, '공유 문구를 복사했어요. 그대로 붙여넣으세요!');
          });
        });
        el.out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      reshuffle(true);
    }
  });
})();
