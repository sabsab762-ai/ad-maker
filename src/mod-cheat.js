/* =====================================================================
   Module 7 · 🥷 광고 컨닝페이퍼
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc;

  var PURPOSES = ['CPA', '로컬매장', '커머스', '앱설치'];
  var KINDS = ['헤드라인', '공식', 'CTA'];

  var LIB = [
    /* ---------- CPA ---------- */
    { p: 'CPA', k: '헤드라인', t: '3분이면 끝, ○○ 신청하고 혜택 확인', n: '숫자로 진입장벽을 낮춥니다. "3분"은 가장 잘 먹히는 시간 약속입니다.' },
    { p: 'CPA', k: '헤드라인', t: '○○ 때문에 고민이라면, 30초만 읽어보세요', n: '문제를 먼저 짚고 시간을 약속하면 이탈이 줄어듭니다.' },
    { p: 'CPA', k: '헤드라인', t: '안 해봤으면 모르는 ○○, 결과부터 보여드립니다', n: '결과 선제시형. 증거(수치·후기)가 뒤에 있어야 합니다.' },
    { p: 'CPA', k: '헤드라인', t: '월 3만원으로 시작하는 ○○', n: '가격을 구체적인 숫자로. 조건(약정·기간)은 본문에 명시.' },
    { p: 'CPA', k: '공식', t: 'PAS — 문제(Pain) → 확대(Agitate) → 해결(Solution)', n: '가장 범용적인 리드 광고 공식. 문제를 3문장으로 확대한 뒤 해결책을 제시.' },
    { p: 'CPA', k: '공식', t: 'BAB — Before(현재) → After(이후) → Bridge(방법)', n: '상태 변화를 보여줄 때 강합니다. Before를 구체적으로 그릴수록 After가 선명해집니다.' },
    { p: 'CPA', k: '공식', t: '4U — Useful · Urgent · Unique · Ultra-specific', n: '헤드라인 4요소 체크. 3개 이상이면 통과, 2개 이하면 다시 쓰세요.' },
    { p: 'CPA', k: 'CTA', t: '무료로 진단받기', n: '"무료"는 가장 강력한 진입 장벽 제거 장치입니다. 조건을 함께 적으세요.' },
    { p: 'CPA', k: 'CTA', t: '1분 만에 확인하기', n: '짧은 시간 약속 + 즉시성. 버튼 문구로도 좋습니다.' },
    { p: 'CPA', k: 'CTA', t: '카톡으로 상담 신청', n: '채널을 명시하면 심리적 거리가 줄어듭니다.' },

    /* ---------- 로컬매장 ---------- */
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

    /* ---------- 커머스 ---------- */
    { p: '커머스', k: '헤드라인', t: '한 달 써보고 남은 후기 — {제품}', n: '경험 기간을 밝히면 신뢰가 올라갑니다.' },
    { p: '커머스', k: '헤드라인', t: '설치 필요 없이 5분이면 끝', n: '사용 장면을 시간으로 환산하면 상상이 쉬워집니다.' },
    { p: '커머스', k: '헤드라인', t: '교환·환불 조건까지 투명하게', n: '구매 불안을 먼저 없애는 헤드라인. 상세페이지 이탈 방지.' },
    { p: '커머스', k: '헤드라인', t: '{타겟}이 가장 많이 찾는 {카테고리}', n: '"1위" 같은 최상급 표현은 근거가 없으면 쓰지 마세요.' },
    { p: '커머스', k: '공식', t: 'FAB — 기능(Feature) → 이점(Benefit) → 혜택(Advantage)', n: '스펙 나열에서 멈추지 말고 "그래서 나에게 뭐가 좋은지"까지.' },
    { p: '커머스', k: '공식', t: '문제 → 해결 → 증거(후기) → CTA', n: '상세페이지 기본 구조. 증거에는 사진·수치·실사용 후기를 넣으세요.' },
    { p: '커머스', k: '공식', t: '숫자 3개 — 가격 · 기간 · 수량', n: '구매 판단에 필요한 숫자를 3개로 정리하면 망설임이 줄어듭니다.' },
    { p: '커머스', k: 'CTA', t: '장바구니 담기', n: '구매보다 부담이 낮은 1차 행동.' },
    { p: '커머스', k: 'CTA', t: '재고 확인하기', n: '희소성과 궁금증을 동시에 자극합니다.' },
    { p: '커머스', k: 'CTA', t: '실사용 후기 보러 가기', n: '후기 수는 실제로 있을 때만 숫자로 적으세요.' },

    /* ---------- 앱설치 ---------- */
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

  App.register({
    id: 'cheat', emoji: '🥷', name: '광고 컨닝페이퍼', free: false, tag: '카피 사전',
    desc: '업종·목적별 후킹 헤드라인·카피 공식·CTA — 검색하고 바로 복사.',
    help: 'CPA·로컬매장·커머스·앱설치 목적별로 검증된 헤드라인, 카피 공식, CTA 문구를 모았습니다. 검색·필터 후 복사하고, 나만의 문구를 추가해 저장할 수 있습니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent = '.cheatgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:12px;margin-top:14px}' +
        '.cheat{border:1px solid var(--line);border-radius:14px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:8px}' +
        '.cheat .tags{display:flex;gap:5px;flex-wrap:wrap}' +
        '.cheat .txt{font-size:13.5px;font-weight:800;letter-spacing:-.02em;line-height:1.5;word-break:keep-all}' +
        '.cheat .note{font-size:11.5px;color:var(--sub);line-height:1.6;flex:1;word-break:keep-all}' +
        '.cheat .row{display:flex;gap:6px;align-items:center}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols wide"><div class="stack">' +
          '<section class="panel"><h3>🔍 문구 찾기</h3>' +
            '<div class="row2" style="margin-top:10px"><div class="field" style="margin-top:0"><label for="ch-q">검색</label><input id="ch-q" type="text" placeholder="예: 지역, 후기, 3분, CTA"></div>' +
            '<div class="field" style="margin-top:0"><label>종류</label><div class="chiprow" id="ch-kinds" style="margin-top:0">' +
              '<button class="chip on" type="button" data-kind="전체">전체</button>' +
              KINDS.map(function (k) { return '<button class="chip" type="button" data-kind="' + k + '">' + k + '</button>'; }).join('') +
            '</div></div></div>' +
            '<div class="chiprow" id="ch-purposes" style="margin-top:12px">' +
              '<button class="chip on" type="button" data-purpose="전체">전체 목적</button>' +
              PURPOSES.map(function (p) { return '<button class="chip" type="button" data-purpose="' + p + '">' + p + '</button>'; }).join('') +
            '</div>' +
            '<p class="hint" id="ch-count"></p>' +
          '</section>' +
          '<section class="panel"><h3>➕ 나만의 문구 추가</h3>' +
            '<div class="field"><label for="ch-new">문구 *</label><input id="ch-new" type="text" placeholder="예: 이번 주말, 가족과 함께"></div>' +
            '<div class="row2"><div class="field"><label for="ch-newp">목적</label><select id="ch-newp">' + PURPOSES.map(function (p) { return '<option>' + p + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label for="ch-newk">종류</label><select id="ch-newk">' + KINDS.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select></div></div>' +
            '<div class="field"><label for="ch-newn">메모</label><input id="ch-newn" type="text" placeholder="어떨 때 쓰는 문구인지"></div>' +
            '<div class="actions"><button class="btn btn-primary" type="button" id="ch-add">저장하기</button>' +
            '<button class="btn btn-ghost" type="button" id="ch-reset">내 문구 전체 삭제</button></div>' +
          '</section>' +
          '<div id="ch-grid" class="cheatgrid"></div>' +
        '</div></div>';

      var el = { q: H.$('#ch-q', root), grid: H.$('#ch-grid', root) };
      var filter = { purpose: '전체', kind: '전체' };

      function mine() { return S.get('cheat.mine', []); }

      function all() {
        return LIB.map(function (x, i) { return { id: 'lib' + i, p: x.p, k: x.k, t: x.t, n: x.n, lib: true }; })
          .concat(mine().map(function (x) { return { id: x.id, p: x.p, k: x.k, t: x.t, n: x.n, lib: false }; }));
      }

      function render() {
        var q = el.q.value.trim().toLowerCase();
        var list = all().filter(function (x) {
          if (filter.purpose !== '전체' && x.p !== filter.purpose) return false;
          if (filter.kind !== '전체' && x.k !== filter.kind) return false;
          if (q && (x.t + ' ' + x.n + ' ' + x.p).toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        H.$('#ch-count', root).textContent = list.length + '개 문구 · 복사해서 바로 쓰세요.';
        if (!list.length) { el.grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><b>조건에 맞는 문구가 없어요</b>검색어나 필터를 바꿔보세요.</div>'; return; }
        el.grid.innerHTML = list.map(function (x) {
          return '<div class="cheat"><div class="tags"><span class="tag">' + esc(x.p) + '</span><span class="tag"' + (x.k === 'CTA' ? ' style="background:#F1ECFF;color:#4C24D6"' : '') + '>' + esc(x.k) + '</span>' +
            (x.lib ? '' : '<span class="tag ok">내 문구</span>') + '</div>' +
            '<div class="txt">' + esc(x.t) + '</div><div class="note">' + esc(x.n || '') + '</div>' +
            '<div class="row"><button class="btn btn-sm btn-soft" type="button" data-cheatcopy="' + esc(x.id) + '">복사</button>' +
            (x.lib ? '' : '<button class="btn btn-sm btn-danger" type="button" data-cheatdel="' + esc(x.id) + '">삭제</button>') + '</div></div>';
        }).join('');
      }

      el.q.addEventListener('input', render);

      H.$('#ch-purposes', root).addEventListener('click', function (e) {
        var b = e.target.closest('[data-purpose]');
        if (!b) return;
        filter.purpose = b.getAttribute('data-purpose');
        H.$$('#ch-purposes .chip', root).forEach(function (c) { c.classList.toggle('on', c === b); });
        render();
      });
      H.$('#ch-kinds', root).addEventListener('click', function (e) {
        var b = e.target.closest('[data-kind]');
        if (!b) return;
        filter.kind = b.getAttribute('data-kind');
        H.$$('#ch-kinds .chip', root).forEach(function (c) { c.classList.toggle('on', c === b); });
        render();
      });

      el.grid.addEventListener('click', function (e) {
        var cp = e.target.closest('[data-cheatcopy]');
        if (cp) {
          var id = cp.getAttribute('data-cheatcopy');
          var item = all().filter(function (x) { return x.id === id; })[0];
          if (item) App.copy(item.t, cp);
          return;
        }
        var del = e.target.closest('[data-cheatdel]');
        if (del) {
          var did = del.getAttribute('data-cheatdel');
          S.set('cheat.mine', mine().filter(function (x) { return x.id !== did; }));
          render();
          App.toast('내 문구를 삭제했어요.');
        }
      });

      H.$('#ch-add', root).addEventListener('click', function () {
        var t = H.$('#ch-new', root).value.trim();
        if (!t) { App.toast('문구를 입력해 주세요.'); H.$('#ch-new', root).focus(); return; }
        var list = mine();
        list.unshift({ id: H.uid('c'), p: H.$('#ch-newp', root).value, k: H.$('#ch-newk', root).value, t: t, n: H.$('#ch-newn', root).value.trim() });
        S.set('cheat.mine', list);
        H.$('#ch-new', root).value = ''; H.$('#ch-newn', root).value = '';
        render();
        App.toast('내 문구로 저장했어요.');
      });

      H.$('#ch-reset', root).addEventListener('click', function () {
        if (!mine().length) { App.toast('저장한 문구가 없어요.'); return; }
        if (!window.confirm('내가 추가한 문구를 모두 지울까요?')) return;
        S.set('cheat.mine', []);
        render();
        App.toast('내 문구를 비웠어요.');
      });

      render();
    }
  });
})();
