/* =====================================================================
   Module 4 · 🎱 로또 자판기 (무료)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc;

  function ballColor(n) {
    if (n <= 10) return '#F2B705';
    if (n <= 20) return '#3B7CF6';
    if (n <= 30) return '#E5484D';
    if (n <= 40) return '#6B7280';
    return '#10A36B';
  }
  function ballHtml(n, small) {
    return '<span class="ball' + (small ? ' sm' : '') + '" style="background:' + ballColor(n) + (n <= 10 ? ';color:#3A2A00' : '') + '">' + n + '</span>';
  }
  function parseNums(text) {
    var raw = String(text || '').split(/[^0-9]+/).filter(Boolean);
    var out = [], seen = {};
    raw.forEach(function (r) {
      var n = parseInt(r, 10);
      if (n >= 1 && n <= 45 && !seen[n]) { seen[n] = 1; out.push(n); }
    });
    return out;
  }

  function drawOnce(fixed, excluded, useOdd, useHigh) {
    var taken = {}, pool = [], i, n;
    fixed.concat(excluded).forEach(function (v) { taken[v] = 1; });
    for (i = 1; i <= 45; i++) if (!taken[i]) pool.push(i);

    for (var attempt = 0; attempt < 600; attempt++) {
      var bag = H.shuffle(pool);
      var pick = fixed.slice();
      for (i = 0; i < bag.length && pick.length < 6; i++) pick.push(bag[i]);
      if (pick.length < 6) return null;
      pick.sort(function (a, b) { return a - b; });
      var odd = pick.filter(function (v) { return v % 2 === 1; }).length;
      var low = pick.filter(function (v) { return v <= 22; }).length;
      if (useOdd && (odd < 2 || odd > 4)) continue;
      if (useHigh && (low < 2 || low > 4)) continue;
      return pick;
    }
    return null;
  }

  App.register({
    id: 'lotto', emoji: '🎱', name: '로또 자판기', free: true, tag: '무료 · 재미',
    desc: '1~45 번호 5게임 — 고정수·제외수·홀짝/고저 밸런스까지.',
    help: '고정수와 제외수를 지정하고 홀짝·고저 균형을 켜면 조건에 맞는 5게임을 뽑아줍니다. 뽑은 이력은 이 브라우저에 저장됩니다. 재미용이며 당첨을 보장하지 않습니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent = '.balls{display:flex;gap:7px;flex-wrap:wrap;align-items:center}' +
        '.ball{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:13.5px;font-weight:800;box-shadow:inset 0 -2px 4px rgba(0,0,0,.14)}' +
        '.ball.sm{width:26px;height:26px;font-size:11px}' +
        '.game{display:flex;align-items:center;gap:10px;padding:12px 4px;border-bottom:1px solid var(--line-2)}' +
        '.game:last-child{border-bottom:0}' +
        '.game .no{width:22px;font-size:11.5px;font-weight:800;color:var(--muted)}' +
        '.hist{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:9px;background:#FCFCFE}' +
        '.hist .ht{display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted);font-weight:700}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🎱 번호 뽑기</h3>' +
            '<div class="row2"><div class="field"><label for="lo-fixed">고정수 <span class="muted small">(최대 5)</span></label><input id="lo-fixed" type="text" placeholder="예: 7, 21"></div>' +
            '<div class="field"><label for="lo-ex">제외수</label><input id="lo-ex" type="text" placeholder="예: 13, 44"></div></div>' +
            '<div class="field"><label>밸런스 필터</label><div class="chiprow" style="margin-top:0">' +
              '<button class="chip on" type="button" id="lo-odd" aria-pressed="true">홀짝 균형 (2~4)</button>' +
              '<button class="chip on" type="button" id="lo-high" aria-pressed="true">고저 균형 (2~4)</button>' +
            '</div><p class="tip">홀수·짝수, 1~22·23~45 개수가 한쪽으로 몰리지 않게 뽑습니다.</p></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="lo-run">5게임 뽑기</button></div>' +
            '<p class="hint">재미용 번호입니다. 당첨을 보장하지 않아요.</p>' +
          '</section>' +
          '<section class="panel"><h3>📜 최근 이력 <span class="pill" id="lo-hcount">0</span></h3>' +
            '<div class="actions" style="margin-top:10px"><button class="btn btn-ghost btn-sm" type="button" id="lo-clear">이력 전체 삭제</button></div>' +
            '<div id="lo-hist" style="margin-top:10px"></div>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>🎉 이번 추첨 <span class="pill" id="lo-round">1회</span></h3>' +
            '<div id="lo-games" style="margin-top:12px"><div class="empty"><b>아직 뽑은 번호가 없어요</b>왼쪽에서 조건을 정하고 5게임 뽑기를 눌러주세요.</div></div>' +
            '<div class="actions"><button class="btn btn-soft" type="button" id="lo-copy">번호 복사</button>' +
            '<button class="btn btn-line" type="button" id="lo-save">이력에 저장</button></div>' +
          '</section></div>' +
        '</div>';

      var el = {
        fixed: H.$('#lo-fixed', root), ex: H.$('#lo-ex', root), odd: H.$('#lo-odd', root), high: H.$('#lo-high', root),
        games: H.$('#lo-games', root), hist: H.$('#lo-hist', root)
      };
      var state = { round: 0, games: [], saved: false };

      function toggle(btn) {
        btn.classList.toggle('on');
        btn.setAttribute('aria-pressed', btn.classList.contains('on') ? 'true' : 'false');
      }
      el.odd.addEventListener('click', function () { toggle(el.odd); });
      el.high.addEventListener('click', function () { toggle(el.high); });

      function renderHist() {
        var hist = S.get('lotto.history', []);
        H.$('#lo-hcount', root).textContent = hist.length;
        if (!hist.length) { el.hist.innerHTML = '<p class="psub">저장된 이력이 없습니다. 뽑은 뒤 <b>이력에 저장</b>을 누르면 여기에 쌓여요.</p>'; return; }
        el.hist.innerHTML = hist.slice(0, 12).map(function (h, idx) {
          return '<div class="hist"><div class="ht"><span>' + esc(h.at) + '</span>' +
            '<button class="btn btn-sm btn-danger right" type="button" data-hdel="' + esc(h.id) + '">삭제</button></div>' +
            h.games.map(function (g) {
              return '<div class="balls" style="margin-top:8px">' + g.map(function (n) { return ballHtml(n, true); }).join('') + '</div>';
            }).join('') + '</div>';
        }).join('');
      }

      function run() {
        var fixed = parseNums(el.fixed.value);
        var excluded = parseNums(el.ex.value);
        if (fixed.length > 5) { App.toast('고정수는 5개까지 가능해요.'); return; }
        var conflict = fixed.filter(function (n) { return excluded.indexOf(n) !== -1; });
        if (conflict.length) { App.toast('고정수와 제외수가 겹칩니다: ' + conflict.join(', ')); return; }
        if (6 - fixed.length > 45 - fixed.length - excluded.length) { App.toast('제외수가 너무 많아 6개를 채울 수 없어요.'); return; }

        var useOdd = el.odd.classList.contains('on');
        var useHigh = el.high.classList.contains('on');
        var games = [], seen = {}, i, g, key, guard;
        for (i = 0; i < 5; i++) {
          g = null;
          for (guard = 0; guard < 40; guard++) {
            g = drawOnce(fixed, excluded, useOdd, useHigh);
            if (!g) break;
            key = g.join('-');
            if (!seen[key]) break;
          }
          if (!g) {
            App.toast('조건이 너무 빡빡해서 5게임을 채우지 못했어요. 고정수·제외수를 줄여보세요.');
            return;
          }
          seen[g.join('-')] = 1;
          games.push(g);
        }
        state.games = games; state.saved = false; state.round++;
        H.$('#lo-round', root).textContent = state.round + '회';
        el.games.innerHTML = games.map(function (g, idx) {
          return '<div class="game"><span class="no">' + (idx + 1) + '</span><div class="balls">' +
            g.map(function (n) { return ballHtml(n); }).join('') + '</div></div>';
        }).join('');
        App.toast('5게임을 뽑았어요!');
      }

      function stamp() { return H.nowStamp(); }

      H.$('#lo-run', root).addEventListener('click', run);

      H.$('#lo-copy', root).addEventListener('click', function () {
        if (!state.games.length) { App.toast('먼저 번호를 뽑아 주세요.'); return; }
        var text = state.games.map(function (g, i) {
          return '[' + (i + 1) + '게임] ' + g.map(function (n) { return (n < 10 ? '0' : '') + n; }).join('  ');
        }).join('\n');
        App.copy(text, this);
      });

      H.$('#lo-save', root).addEventListener('click', function () {
        if (!state.games.length) { App.toast('먼저 번호를 뽑아 주세요.'); return; }
        if (state.saved) { App.toast('이미 저장한 회차예요.'); return; }
        var hist = S.get('lotto.history', []);
        hist.unshift({ id: H.uid('l'), at: stamp(), games: state.games });
        S.set('lotto.history', hist.slice(0, 30));
        state.saved = true;
        renderHist();
        App.toast('이력에 저장했어요.');
      });

      el.hist.addEventListener('click', function (e) {
        var b = e.target.closest('[data-hdel]');
        if (!b) return;
        var id = b.getAttribute('data-hdel');
        S.set('lotto.history', S.get('lotto.history', []).filter(function (h) { return h.id !== id; }));
        renderHist();
        App.toast('이력을 삭제했어요.');
      });

      H.$('#lo-clear', root).addEventListener('click', function () {
        if (!window.confirm('저장된 이력을 모두 지울까요?')) return;
        S.set('lotto.history', []);
        renderHist();
        App.toast('이력을 비웠어요.');
      });

      renderHist();
    }
  });
})();
