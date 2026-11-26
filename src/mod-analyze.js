/* =====================================================================
   Module 8 · 🔍 사이트 분석하기 (무료)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  var CTA_WORDS = ['신청', '구매', '예약', '상담', '문의', '시작', '다운로드', '확인', '클릭', '가입', '장바구니', '전화', '방문', '체험', '무료', '결제', '신청하기', '예약하기'];
  var TRUST_WORDS = ['후기', '리뷰', '별점', '인증', '보증', '환불', '교환', '고객', '수상', '언론', '안전', '보안', '누적', '만족', 'A/S', 'AS', '책임', '보험', '전문가', '실사용'];
  var BENEFIT_WORDS = ['무료', '할인', '최대', '혜택', '지금', '오늘', '분', '초', '방법', '체크', '후기', '비교', '정리', '가이드'];
  var URGENCY = ['지금', '오늘', '한정', '마감', '마지막', '선착', '이번 주', '당일'];

  function countWords(text, words) {
    var n = 0, hits = [];
    words.forEach(function (w) {
      if (text.indexOf(w) !== -1) { n++; hits.push(w); }
    });
    return { n: n, hits: hits };
  }

  function analyze(raw) {
    var text = String(raw || '').replace(/\r/g, '');
    var trimmed = text.trim();
    var chars = trimmed.replace(/\s/g, '').length;
    var linesArr = trimmed.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var sentences = trimmed.split(/[.!?。！？\n]+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; });
    var avg = sentences.length ? Math.round(sentences.reduce(function (a, s) { return a + s.length; }, 0) / sentences.length) : 0;
    var longParas = linesArr.filter(function (l) { return l.length > 220; }).length;
    var headline = linesArr[0] || '';
    var firstChunk = trimmed.slice(0, 300);

    var cta = countWords(trimmed, CTA_WORDS);
    var trust = countWords(trimmed, TRUST_WORDS);
    var benefit = countWords(headline, BENEFIT_WORDS);
    var urgency = countWords(trimmed, URGENCY);
    var digits = (trimmed.match(/[0-9]/g) || []).length;

    var good = [], improve = [];

    /* 헤드라인 */
    var hScore = 8;
    if (headline.length >= 8 && headline.length <= 40) { hScore += 6; good.push('첫 줄이 ' + headline.length + '자로, 한눈에 읽히는 길이입니다.'); }
    else if (headline.length < 8) improve.push('첫 줄이 너무 짧습니다(' + headline.length + '자). "누구에게 · 무엇을 · 왜"가 들어간 12~30자 헤드라인으로 바꿔보세요.');
    else improve.push('첫 줄이 ' + headline.length + '자로 깁니다. 30자 안쪽으로 줄이고 부연은 아래로 내리세요.');
    if (digits > 0) { hScore += 4; good.push('숫자가 포함되어 구체적으로 읽힙니다.'); }
    else improve.push('숫자를 하나 넣어보세요. "3분", "월 3만원", "후기 300개" 같은 숫자는 신뢰를 만듭니다.');
    if (benefit.n > 0) { hScore += 4; good.push('헤드라인에 혜택/시간 표현(' + benefit.hits.slice(0, 3).join(', ') + ')이 있습니다.'); }
    else improve.push('헤드라인에 혜택 단어(무료·할인·최대·지금·3분 등)를 넣으면 클릭률이 올라갑니다.');
    if (avg > 0 && avg <= 45) hScore += 3;
    hScore = H.clamp(hScore, 0, 25);

    /* CTA */
    var cScore = 3;
    cScore += Math.min(13, cta.n * 3);
    if (cta.n === 0) improve.push('행동 유도(CTA) 문구를 찾지 못했습니다. "무료로 진단받기" 같은 버튼 문구를 화면 안에 2개 이상 배치하세요.');
    else if (cta.n <= 2) improve.push('CTA 표현이 ' + cta.n + '종류뿐입니다. 주 CTA 1개 + 보조 CTA 1개(예: 상담·자료 받기)를 두세요.');
    else good.push('CTA 표현이 ' + cta.n + '종류(' + cta.hits.slice(0, 4).join(', ') + ')로 충분합니다.');
    if (countWords(firstChunk, CTA_WORDS).n > 0) { cScore += 4; good.push('첫 화면 안에 CTA가 있어 바로 행동할 수 있습니다.'); }
    else improve.push('첫 화면(스크롤 전)에 CTA가 없습니다. 첫 화면에 주 버튼 하나는 꼭 두세요.');
    if (urgency.n > 0) { cScore += 5; good.push('즉시성을 주는 표현(' + urgency.hits.slice(0, 3).join(', ') + ')이 있습니다.'); }
    else improve.push('즉시성 표현(오늘·한정·마감)을 하나 넣으면 미루는 비율이 줄어듭니다.');
    cScore = H.clamp(cScore, 0, 25);

    /* 신뢰 */
    var tScore = 4 + Math.min(15, trust.n * 3);
    if (trust.n === 0) improve.push('신뢰 요소(후기·별점·인증·환불·A/S)가 보이지 않습니다. 실제 후기 3개와 환불 조건을 넣으세요.');
    else if (trust.n <= 2) improve.push('신뢰 요소가 ' + trust.n + '종류(' + trust.hits.join(', ') + ')입니다. 후기 수·재구매율 같은 숫자를 더하면 설득력이 커집니다.');
    else { tScore += 6; good.push('신뢰 요소가 ' + trust.n + '종류(' + trust.hits.slice(0, 4).join(', ') + ')로 잘 갖춰져 있습니다.'); }
    tScore = H.clamp(tScore, 0, 25);

    /* 가독성 */
    var rScore = 25;
    if (chars < 160) { rScore -= 6; improve.push('분석할 본문이 ' + chars + '자로 적습니다. 실제 랜딩페이지 본문을 더 붙여넣으면 정확해집니다.'); }
    if (avg > 60) { rScore -= 8; improve.push('평균 문장 길이가 ' + avg + '자로 깁니다. 35자 안쪽으로 끊으면 모바일에서 읽기 쉬워집니다.'); }
    else if (avg > 45) { rScore -= 4; improve.push('평균 문장이 ' + avg + '자입니다. 조금만 더 짧게 끊어보세요(권장 35자 이내).'); }
    else if (avg > 0) good.push('평균 문장 길이 ' + avg + '자로 모바일 가독성이 좋습니다.');
    if (longParas > 0) { rScore -= Math.min(8, longParas * 3); improve.push('220자를 넘는 긴 문단이 ' + longParas + '개 있습니다. 3~4줄마다 줄바꿈하세요.'); }
    if (linesArr.length > 0 && linesArr.length <= 2 && chars > 400) { rScore -= 4; improve.push('문단 구분이 거의 없습니다. 소제목과 줄바꿈으로 덩어리를 나누세요.'); }
    if (chars > 1200 && !/■|▶|·|•|- /.test(trimmed)) { rScore -= 3; improve.push('목록·구분 기호가 없습니다. 혜택은 불릿으로 정리하면 스캔이 빨라집니다.'); }
    rScore = H.clamp(rScore, 0, 25);

    var total = hScore + cScore + tScore + rScore;
    var grade = total >= 85 ? '아주 좋아요 — 바로 집행해도 됩니다' :
      total >= 70 ? '탄탄해요 — 한두 곳만 다듬으면 완성' :
      total >= 55 ? '괜찮지만 보완이 필요해요' :
      total >= 40 ? '손볼 곳이 많아요' : '기본 구조부터 다시 잡아야 해요';

    return {
      total: total, grade: grade,
      parts: [
        { label: '헤드라인', score: hScore }, { label: 'CTA', score: cScore },
        { label: '신뢰 요소', score: tScore }, { label: '가독성', score: rScore }
      ],
      good: good, improve: improve,
      stats: { chars: chars, sentences: sentences.length, avg: avg, lines: linesArr.length, cta: cta.n, trust: trust.n }
    };
  }

  App.register({
    id: 'analyze', emoji: '🔍', name: '사이트 분석하기', free: true, tag: '무료 · 진단',
    desc: '랜딩페이지 카피를 점수화하고 개선점을 바로 제안합니다.',
    help: '브라우저 보안(CORS) 때문에 남의 사이트를 자동으로 읽을 수는 없습니다. 랜딩페이지 본문을 붙여넣으면 헤드라인·CTA·신뢰요소·가독성을 100점으로 점수화하고 개선점을 제안합니다. URL 직접 분석은 김호퍼에게 요청 문구를 복사해 맡기세요.',
    render: function (root) {
      root.innerHTML =
        '<div class="notice" style="margin-bottom:14px">🔍 <div><strong>정적 페이지의 CORS 제약을 먼저 알려드려요.</strong><br>' +
        '이 페이지는 브라우저에서만 돌아가기 때문에, 다른 사이트의 HTML을 직접 가져와 읽을 수 없습니다(브라우저 보안 정책). ' +
        '그래서 <b>(a) 본문을 붙여넣으면 즉시 분석</b>하고, <b>(b) URL을 김호퍼에게 넘겨 실제 페이지 분석을 요청</b>하는 두 가지 길을 드립니다.</div></div>' +
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>a) 즉시 분석</h3>' +
            '<div class="field"><label for="an-url">랜딩페이지 URL <span class="muted small">(기록용)</span></label><input id="an-url" type="text" placeholder="https://..."></div>' +
            '<div class="field"><label for="an-text">본문 / 카피 붙여넣기 *</label><textarea id="an-text" style="min-height:200px" placeholder="페이지의 제목, 첫 문단, 버튼 문구, 후기 등을 그대로 복사해 붙여넣으세요."></textarea></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="an-run">지금 분석하기</button></div>' +
            '<p class="hint">헤드라인 · CTA · 신뢰 요소 · 모바일 가독성 4개 항목을 각 25점으로 채점합니다.</p>' +
            '<div class="field" style="margin-top:16px"><label>샘플로 해보기</label>' +
            '<div class="chiprow" style="margin-top:0"><button class="chip" type="button" data-sample="bad">개선 필요한 예시</button>' +
            '<button class="chip" type="button" data-sample="good">잘 만든 예시</button></div></div>' +
          '</section>' +
          '<section class="panel"><h3>b) 김호퍼에게 URL 직접 분석 맡기기</h3>' +
            '<p class="psub">김호퍼는 실제로 페이지를 열어 첫 화면 구성·버튼 위치·모바일 화면까지 볼 수 있습니다. 아래 요청 문구를 복사해 채팅에 붙여넣으세요.</p>' +
            '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">요청 문구</span><button class="btn btn-sm btn-soft" type="button" id="an-copyreq">복사</button></div>' +
            '<div class="cb mono" id="an-req" style="max-height:230px;overflow:auto"></div></div>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>📊 분석 결과</h3>' +
            '<div id="an-result" style="margin-top:12px"><div class="empty"><b>아직 분석한 페이지가 없어요</b>왼쪽에 본문을 붙여넣고 분석을 눌러주세요.</div></div>' +
          '</section></div>' +
        '</div>';

      var el = { url: H.$('#an-url', root), text: H.$('#an-text', root), res: H.$('#an-result', root), req: H.$('#an-req', root) };

      function requestText() {
        var url = el.url.value.trim() || '(URL을 입력하세요)';
        return '김호퍼, 아래 사이트를 직접 열어서 광고 관점으로 분석해줘.\n\n' +
          'URL: ' + url + '\n\n' +
          '보고 싶은 것\n' +
          '1. 첫 화면에서 3초 안에 "무엇을 파는지" 이해되는가 — 헤드라인·서브카피\n' +
          '2. CTA는 몇 개이고, 가장 눈에 띄는 것은 무엇인가\n' +
          '3. 신뢰 요소(후기·인증·환불·수치)가 충분한가\n' +
          '4. 모바일 화면에서 읽기 편한가 — 줄 길이·여백·폰트\n' +
          '5. 개선 우선순위 3가지 + 바로 바꿀 수 있는 카피 예시\n\n' +
          '가능하면 실제 화면 스크린샷도 같이 보여줘.';
      }

      function renderReq() { el.req.textContent = requestText(); }

      var SAMPLES = {
        bad: '좋은 제품입니다. 저희는 오래전부터 좋은 물건을 만들기 위해 노력해왔으며 많은 고객님들께 사랑을 받고 있습니다. 품질은 물론 디자인까지 뛰어나며 가격 또한 합리적입니다. 자세한 내용은 홈페이지를 참고해 주시기 바랍니다. 문의는 게시판을 이용해 주세요. 감사합니다.',
        good: '하루 3분, 허리 통증 관리 루틴\n\n· 30일 사용 후기 1,200개 · 평균 4.8점\n· 첫 달 무료 체험 · 언제든 해지\n· 물리치료사 3인이 설계한 12가지 동작\n\n지금 무료로 시작하기 →\n결제 없이 7일 동안 사용해 보세요. 오늘 가입 시 1:1 자세 코칭을 함께 드립니다.\n\n"허리 때문에 병원만 다녔는데, 3주 만에 앉아있는 시간이 편해졌어요." — 김○○님 후기'
      };

      H.$('#an-run', root).addEventListener('click', function () {
        var text = el.text.value;
        if (!text.trim()) { App.toast('분석할 본문을 먼저 붙여넣어 주세요.'); el.text.focus(); return; }
        var r = analyze(text);
        var parts = r.parts.map(function (p) {
          return '<div class="mrow"><span class="lb">' + p.label + '</span><div class="meter"><i style="width:' + (p.score / 25 * 100) + '%"></i></div><span class="vl">' + p.score + '</span></div>';
        }).join('');
        el.res.innerHTML =
          '<div class="score"><div class="num">' + r.total + '<small>/100</small></div><div class="grade">' + esc(r.grade) + '</div></div>' +
          '<div style="margin-top:14px">' + parts + '</div>' +
          '<div class="sep"></div>' +
          '<div class="kv"><b>글자 수</b><span>' + r.stats.chars + '자 · 문장 ' + r.stats.sentences + '개 · 평균 ' + r.stats.avg + '자</span></div>' +
          '<div class="kv"><b>CTA 후보</b><span>' + r.stats.cta + '종 · 신뢰 요소 ' + r.stats.trust + '종</span></div>' +
          '<div class="sep"></div>' +
          '<h3 style="font-size:13.5px">✓ 잘한 점</h3>' +
          '<ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;line-height:1.8;color:#3A3A44">' +
            (r.good.length ? r.good.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') : '<li class="muted">뚜렷한 강점이 아직 보이지 않습니다.</li>') + '</ul>' +
          '<h3 style="font-size:13.5px;margin-top:16px">→ 개선할 점</h3>' +
          '<ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;line-height:1.8;color:#3A3A44">' +
            (r.improve.length ? r.improve.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') : '<li>바로 고칠 곳이 없습니다. 좋은 상태예요.</li>') + '</ul>' +
          '';
        App.toast('분석을 마쳤어요. 점수 ' + r.total + '점.');
      });

      root.addEventListener('click', function (e) {
        var s = e.target.closest('[data-sample]');
        if (s) {
          el.text.value = SAMPLES[s.getAttribute('data-sample')] || '';
          App.toast('샘플 본문을 넣었어요. 분석하기를 눌러보세요.');
        }
      });

      el.url.addEventListener('input', renderReq);
      H.$('#an-copyreq', root).addEventListener('click', function () {
        App.copy(requestText(), this);
      });
      renderReq();
    }
  });
})();
