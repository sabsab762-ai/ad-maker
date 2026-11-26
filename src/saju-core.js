/* =====================================================================
   saju-core · 만세력 60갑자 계산 + 사주 풀이 텍스트 (DOM 의존 없음)

   - 절기(節)는 태양 겉보기 황경을 계산해 시각까지 찾습니다 (Meeus 저정밀식).
   - 일주는 1900-01-01 갑술(甲戌)일 기준 60일 순환.
   - 표준시(UTC+9) 기준. 진태양시(경도) 보정은 하지 않습니다.
   - 지장간은 쓰지 않고 천간·지지 8글자의 본기만 셉니다.
   ===================================================================== */
(function (root) {
  'use strict';

  var STEM = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var STEM_H = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var BRANCH = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var BRANCH_H = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var ELEM = ['목', '화', '토', '금', '수'];
  var STEM_ELEM = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  var BRANCH_ELEM = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];

  var ELEM_INFO = [
    { name: '목', color: '#2E8B57', colorName: '청록·초록', dir: '동쪽', num: '3 · 8', act: '산책·독서·새로운 시작', food: '신맛(레몬·식초)과 채소' },
    { name: '화', color: '#E5484D', colorName: '빨강·주황', dir: '남쪽', num: '2 · 7', act: '햇볕 쬐기·가벼운 운동·사람 만나기', food: '쓴맛(커피·다크초콜릿)' },
    { name: '토', color: '#C08A2E', colorName: '노랑·베이지', dir: '중앙·남서쪽', num: '5 · 10', act: '규칙적인 식사·정리정돈·흙 만지기', food: '단맛(고구마·호박)' },
    { name: '금', color: '#7C8494', colorName: '흰색·금속', dir: '서쪽', num: '4 · 9', act: '책상 정리·미뤄둔 결정 끝내기', food: '매운맛(마늘·생강)' },
    { name: '수', color: '#2F6FED', colorName: '검정·남색', dir: '북쪽', num: '1 · 6', act: '물 충분히 마시기·수영·충분한 수면', food: '짠맛(해조류·콩)' }
  ];

  /* ---------------- 천문: 태양 황경 · 절기 ---------------- */

  function toJD(y, m, d, hourUT) {
    var day = d + (hourUT || 0) / 24;
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
  }
  function jdToMs(jd) { return (jd - 2440587.5) * 86400000; }

  function sunLon(jd) {
    var T = (jd - 2451545.0) / 36525;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var Mr = M * Math.PI / 180;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
      0.000289 * Math.sin(3 * Mr);
    var omega = 125.04 - 1934.136 * T;
    var lam = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
    return ((lam % 360) + 360) % 360;
  }

  function angDiff(a, b) {
    var d = a - b;
    return ((d + 180) % 360 + 360) % 360 - 180;
  }

  /* 태양 황경이 target(도)이 되는 시각(JD, UT) */
  function findTerm(year, target) {
    var approxDoy = ((target - 280 + 360) % 360) / 360 * 365.2422;
    var jd0 = toJD(year, 1, 1, 0) + approxDoy;
    var lo = jd0 - 6, hi = jd0 + 6, i;
    for (i = 0; i < 15 && angDiff(sunLon(lo), target) > 0; i++) lo -= 1;
    for (i = 0; i < 15 && angDiff(sunLon(hi), target) < 0; i++) hi += 1;
    if (angDiff(sunLon(lo), target) > 0 || angDiff(sunLon(hi), target) < 0) return null;
    for (i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      if (angDiff(sunLon(mid), target) < 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* 12절(節): 입춘~소한. [황경, 월지] */
  var JEOL = [
    [315, 2], [345, 3], [15, 4], [45, 5], [75, 6], [105, 7],
    [135, 8], [165, 9], [195, 10], [225, 11], [255, 0], [285, 1]
  ];
  var jeolCache = {};
  function jeolTimes(year) {
    if (jeolCache[year]) return jeolCache[year];
    var list = [], i, jd;
    for (i = 0; i < JEOL.length; i++) {
      jd = findTerm(year, JEOL[i][0]);
      if (jd != null) list.push({ jd: jd, branch: JEOL[i][1] });
    }
    list.sort(function (a, b) { return a.jd - b.jd; });
    jeolCache[year] = list;
    return list;
  }

  /* ---------------- 60갑자 ---------------- */

  function ganzhiName(stem, branch) { return STEM[stem] + BRANCH[branch]; }
  function ganjiHanja(stem, branch) { return STEM_H[stem] + BRANCH_H[branch]; }

  /* 1900-01-01 = 갑술일(甲戌, index 10) */
  function dayCycleIndex(y, m, d) {
    var days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 1)) / 86400000);
    return ((10 + days) % 60 + 60) % 60;
  }

  function hourBranchOf(hour) { return Math.floor(((hour + 1) % 24) / 2); }
  function hourLabel(branch) {
    var start = (branch * 2 + 23) % 24;
    var end = (start + 2) % 24;
    return BRANCH[branch] + '시(' + pad2(start) + ':00~' + pad2(end) + ':00)';
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------- 십신 ---------------- */

  var GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'];
  function tenGod(dayStem, otherStem) {
    var de = STEM_ELEM[dayStem], oe = STEM_ELEM[otherStem];
    var same = (dayStem % 2) === (otherStem % 2);
    if (de === oe) return same ? '비견' : '겁재';
    if ((de + 1) % 5 === oe) return same ? '식신' : '상관';
    if ((oe + 1) % 5 === de) return same ? '편인' : '정인';
    if ((de + 2) % 5 === oe) return same ? '편재' : '정재';
    if ((oe + 2) % 5 === de) return same ? '편관' : '정관';
    return '비견';
  }

  /* ---------------- 사주 세우기 ---------------- */

  function buildPillars(y, m, d, hour) {
    var birthJd = toJD(y, m, d, (hour == null ? 12 : hour) - 9);
    var ipchun = findTerm(y, 315);
    var sy = (ipchun != null && birthJd < ipchun) ? y - 1 : y;

    var yStem = ((sy - 4) % 10 + 10) % 10;
    var yBranch = ((sy - 4) % 12 + 12) % 12;

    var mb = 2;
    var cands = [];
    [-1, 0, 1].forEach(function (dy) {
      var list = jeolTimes(y + dy);
      for (var i = 0; i < list.length; i++) cands.push(list[i]);
    });
    cands.sort(function (a, b) { return a.jd - b.jd; });
    if (cands.length) {
      mb = cands[0].branch;
      for (var i = 0; i < cands.length; i++) if (cands[i].jd <= birthJd) mb = cands[i].branch;
    }
    var mIdx = ((mb - 2) % 12 + 12) % 12;
    var mStem = (yStem * 2 + 2 + mIdx) % 10;

    var dy = y, dm = m, dd = d;
    if (hour != null && hour >= 23) {
      var nd = new Date(Date.UTC(y, m - 1, d));
      nd.setUTCDate(nd.getUTCDate() + 1);
      dy = nd.getUTCFullYear(); dm = nd.getUTCMonth() + 1; dd = nd.getUTCDate();
    }
    var dIdx = dayCycleIndex(dy, dm, dd);
    var dStem = dIdx % 10, dBranch = dIdx % 12;

    var hPillar = null;
    if (hour != null) {
      var hb = hourBranchOf(hour);
      hPillar = { stem: (dStem * 2 + hb) % 10, branch: hb };
    }

    return {
      sajuYear: sy,
      year: { stem: yStem, branch: yBranch },
      month: { stem: mStem, branch: mb },
      day: { stem: dStem, branch: dBranch },
      hour: hPillar,
      dayMaster: { stem: dStem, elem: STEM_ELEM[dStem], yinyang: dStem % 2 === 0 ? '양' : '음' },
      zodiac: ZODIAC[yBranch]
    };
  }

  /* ---------------- 풀이 텍스트 ---------------- */

  var DAY_MASTER = [
    { title: '곧게 뻗는 큰 나무', kw: ['추진', '정직', '리더십'],
      text: '한번 세운 뜻을 잘 굽히지 않고 위로 자라나는 큰 나무의 기운이에요. 시작하는 일에서 강하고, 남 뒤에 서기보다 앞에서 길을 여는 편입니다. 약속과 원칙을 지키는 힘이 남보다 세요.',
      care: '곧은 만큼 휘어지는 법이 늦어요. 내 기준을 남에게 그대로 대면 관계가 뻣뻣해지니, 한 번만 물어보는 습관이 약이 됩니다.' },
    { title: '감아 올라가는 들풀', kw: ['유연', '친화', '끈기'],
      text: '바위 틈에서도 길을 찾아 감아 올라가는 덩굴의 기운이에요. 강하게 밀기보다 상대의 결을 타고 들어가 사람을 얻는 재주가 있습니다. 겉은 부드러운데 속은 생각보다 단단해요.',
      care: '눈치를 보다 내 몫을 놓치기 쉬워요. "저는 이렇게 하고 싶어요"를 먼저 말하는 연습이 필요합니다.' },
    { title: '숨김없이 환한 태양', kw: ['열정', '표현', '명랑'],
      text: '가리지 않고 비추는 태양의 기운이에요. 기분과 의욕이 얼굴에 그대로 나와서 사람들이 쉽게 모여듭니다. 무대·영업·방송처럼 사람을 향하는 자리에서 특히 강해요.',
      care: '에너지가 앞서 말이 먼저 나가기 쉬워요. 결정을 말로 굳히기 전에 한 번만 더 생각하면 실수가 크게 줄어요.' },
    { title: '조용히 마음을 밝히는 촛불', kw: ['섬세', '직관', '다정'],
      text: '어두운 방을 조용히 밝히는 촛불의 기운이에요. 말보다 분위기와 눈빛으로 마음을 읽고, 한 사람에게 깊게 집중합니다. 섬세한 손끝과 취향이 결과물의 질을 끌어올려요.',
      care: '혼자 오래 삭히면 상처가 커져요. 불편한 마음은 24시간 안에 꺼내는 편이 낫습니다.' },
    { title: '자리를 지키는 큰 산', kw: ['안정', '포용', '신뢰'],
      text: '쉽게 흔들리지 않고 그 자리를 지키는 산의 기운이에요. 사람들이 기대는 자리가 되고, 급한 상황에서도 중심을 잡습니다. 한 번 맡은 일은 끝까지 끌고 갑니다.',
      care: '변화 앞에서 몸이 먼저 굳어요. 작은 것부터 일부러 바꿔 보면 큰 변화가 덜 무섭습니다.' },
    { title: '기르고 가꾸는 밭', kw: ['현실감', '배려', '실행'],
      text: '씨를 뿌리고 물을 주며 결과를 만드는 밭의 기운이에요. 화려한 말보다 실제로 굴러가게 만드는 힘이 있고, 챙길 것을 놓치지 않습니다. 살림과 운영, 관리에 재능이 있어요.',
      care: '남의 일까지 떠안아 지치기 쉬워요. "여기까지가 제 몫"을 정해 두면 오래 갑니다.' },
    { title: '결단으로 끊는 강철', kw: ['결단', '의리', '추진'],
      text: '망설임을 한 번에 베어내는 도끼의 기운이에요. 옳다고 보면 빠르게 밀어붙이고, 뒤끝 없이 정리합니다. 위기에서 오히려 실력이 드러나는 타입이에요.',
      care: '끊는 힘이 세서 관계도 같이 잘려요. 결론을 내리기 전에 상대의 사정을 한 줄만 더 들어 보세요.' },
    { title: '결을 다듬는 보석', kw: ['감각', '완벽', '자존'],
      text: '거친 돌을 다듬어 빛을 내는 보석의 기운이에요. 눈썰미가 좋고 디테일에서 남들이 못 보는 걸 잡아냅니다. 자기 기준이 높아 결과물의 완성도가 높아요.',
      care: '기준이 높은 만큼 스스로에게도 엄격해요. 80점에서 내보내는 연습이 성과를 앞당깁니다.' },
    { title: '크게 흐르는 바다', kw: ['포부', '지혜', '활동'],
      text: '막히면 돌아가고 넘치면 넘기는 큰 물의 기운이에요. 생각의 폭이 넓고, 새로운 곳과 사람에게서 에너지를 얻습니다. 이동·여행·확장과 인연이 깊어요.',
      care: '벌여 놓은 일이 많아 마무리가 약해지기 쉬워요. 시작한 일 세 개만 골라 끝내는 규칙이 필요합니다.' },
    { title: '스며들어 읽는 이슬비', kw: ['공감', '직감', '섬세'],
      text: '소리 없이 스며들어 사람의 마음을 적시는 비의 기운이에요. 말하지 않아도 분위기를 읽고, 정보와 감정의 결을 잘 잡아냅니다. 조용히 오래 쌓는 쪽에서 강해요.',
      care: '감정을 많이 흡수해 쉽게 지쳐요. 사람이 많은 날 뒤에는 혼자 있는 시간을 꼭 확보하세요.' }
  ];

  var GOD_TODAY = {
    '비견': { kw: '내 힘', line: '내 페이스로 밀어붙이기 좋은 날이에요. 남과 비교하면 힘만 빠지니 내 속도만 보세요.' },
    '겁재': { kw: '경쟁·지출', line: '돈 나갈 구멍이 생기기 쉬운 날이에요. 큰 결제는 하루만 미뤄도 결과가 달라집니다.' },
    '식신': { kw: '표현·여유', line: '맛있는 것, 편한 사람과의 대화가 운을 열어요. 무리한 일정보다 여유가 이득입니다.' },
    '상관': { kw: '아이디어·직설', line: '말과 아이디어가 잘 나오는 날이에요. 다만 윗사람 앞에서는 한 박자 쉬어가세요.' },
    '편재': { kw: '뜻밖의 재물', line: '예상 못 한 기회나 수입이 스칠 수 있어요. 연락과 제안을 그냥 흘리지 마세요.' },
    '정재': { kw: '착실한 수입', line: '꾸준히 해온 일이 값을 매기는 날이에요. 약속과 영수증을 챙기면 그대로 남습니다.' },
    '편관': { kw: '압박·돌파', line: '압박은 세지만 뚫고 나가면 성취가 남아요. 무리한 승부수만 피하면 됩니다.' },
    '정관': { kw: '책임·평가', line: '맡은 자리에서 평가받는 날이에요. 정석대로 처리하면 점수가 남습니다.' },
    '편인': { kw: '직감·정보', line: '남들이 놓친 정보가 눈에 들어와요. 혼자만의 시간이 오늘의 약이에요.' },
    '정인': { kw: '도움·배움', line: '윗사람이나 스승의 말이 힌트가 돼요. 부탁할 일이 있다면 오늘이 좋습니다.' }
  };

  function branchRelation(a, b) {
    var d = ((a - b) % 12 + 12) % 12;
    if (d === 0) return { type: 'same', line: '같은 기운이 겹쳐 의욕이 앞서는 날이에요.' };
    if (d === 6) return { type: 'chung', line: '부딪히는 기운이라 일정 변동·이동이 생기기 쉬워요.' };
    var pairs = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
    for (var i = 0; i < pairs.length; i++) {
      if ((a === pairs[i][0] && b === pairs[i][1]) || (a === pairs[i][1] && b === pairs[i][0])) {
        return { type: 'hap', line: '서로 맞물리는 기운이라 사람을 통한 일이 풀려요.' };
      }
    }
    return { type: 'plain', line: '크게 튀지 않고 무난하게 흐르는 날이에요.' };
  }

  function elementPercents(counts) {
    var total = 0, i, out = [];
    for (i = 0; i < 5; i++) total += counts[i];
    for (i = 0; i < 5; i++) out.push(total ? Math.round(counts[i] / total * 100) : 0);
    return out;
  }

  function buildSaju(input, now) {
    var y = input.y, m = input.m, d = input.d;
    var hour = (input.hour == null || input.hour === '') ? null : Number(input.hour);
    var gender = input.gender === 'f' ? 'f' : 'm';
    var P = buildPillars(y, m, d, hour);
    var counts = [0, 0, 0, 0, 0];
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = P[k]; if (!p) return;
      counts[STEM_ELEM[p.stem]]++;
      counts[BRANCH_ELEM[p.branch]]++;
    });
    var pcts = elementPercents(counts);
    var strongest = 0;

    /* 십신 분포 (일간 자신은 제외) */
    var godCount = {}, i;
    for (i = 0; i < GODS.length; i++) godCount[GODS[i]] = 0;
    var chars = [];
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = P[k]; if (!p) return;
      chars.push({ pos: k, kind: 'stem', stem: p.stem, branch: p.branch });
      chars.push({ pos: k, kind: 'branch', elem: BRANCH_ELEM[p.branch] });
    });
    var dayStem = P.day.stem;
    chars.forEach(function (c) {
      if (c.kind === 'stem') {
        if (c.pos === 'day') return; /* 일간 자신은 제외 */
        godCount[tenGod(dayStem, c.stem)]++;
      } else {
        /* 지지는 본기 오행을 일간 기준 십신으로 근사 */
        var fakeStem = null;
        for (var s = 0; s < 10; s++) if (STEM_ELEM[s] === c.elem) { fakeStem = s; break; }
        if (fakeStem == null) return;
        /* 같은 오행이면 음양을 지지 순서로 근사 */
        var alt = (fakeStem % 2 === dayStem % 2) ? fakeStem : (fakeStem + 1) % 10;
        godCount[tenGod(dayStem, alt)]++;
      }
    });
    var group = {
      비겁: godCount['비견'] + godCount['겁재'],
      식상: godCount['식신'] + godCount['상관'],
      재성: godCount['편재'] + godCount['정재'],
      관성: godCount['편관'] + godCount['정관'],
      인성: godCount['편인'] + godCount['정인']
    };

    /* 신강/신약: 나를 돕는 기운(비겁+인성) vs 쓰는 기운 */
    var support = counts[P.dayMaster.elem] + counts[(P.dayMaster.elem + 4) % 5];
    var totalChars = hour == null ? 6 : 8;
    var ratio = Math.round(support / totalChars * 100);
    var strength = ratio >= 55 ? '신강' : (ratio <= 40 ? '신약' : '중화');

    /* 오늘 / 올해 */
    var nd = now || new Date();
    var todayIdx = dayCycleIndex(nd.getFullYear(), nd.getMonth() + 1, nd.getDate());
    var tStem = todayIdx % 10, tBranch = todayIdx % 12;
    var tGod = tenGod(dayStem, tStem);
    var tRel = branchRelation(tBranch, P.day.branch);
    var tInfo = GOD_TODAY[tGod];

    var cy = nd.getFullYear();
    var ipc = findTerm(cy, 315);
    var nowJd = toJD(nd.getFullYear(), nd.getMonth() + 1, nd.getDate(), nd.getHours() - 9);
    var syNow = (ipc != null && nowJd < ipc) ? cy - 1 : cy;
    var yStemNow = ((syNow - 4) % 10 + 10) % 10;
    var yBranchNow = ((syNow - 4) % 12 + 12) % 12;
    var yGod = tenGod(dayStem, yStemNow);
    var yInfo = GOD_TODAY[yGod];
    var yRel = branchRelation(yBranchNow, P.day.branch);

    /* 재물 */
    var money;
    if (group['재성'] === 0) {
      money = '재성(財星)이 원국에 없어 돈의 문이 좁은 대신, 한 번 열리면 크게 들어오는 그릇이에요. 통장·구독료·카드값처럼 새는 돈을 먼저 막으면 살이 붙습니다.';
    } else if (group['재성'] <= 2) {
      money = '재성이 ' + group['재성'] + '개로 알맞아요. 여러 곳에 손대기보다 한 우물의 단가를 올리는 쪽이 잘 맞습니다. ' + (group['식상'] >= 2 ? '식상이 받쳐줘서 내 기술·콘텐츠가 곧 돈이 됩니다.' : '조용히 모으는 저축·연금이 특히 잘 맞아요.');
    } else if (group['재성'] <= 4) {
      money = '재성이 ' + group['재성'] + '개로 여러 갈래에서 돈이 드나드는 팔이에요. 부업·제휴·중개처럼 여러 통로를 두면 수입이 자연히 늘어납니다. 다만 관리 계좌는 꼭 하나로 분리하세요.';
    } else {
      money = '재성이 ' + group['재성'] + '개로 넘칩니다. 버는 힘만큼 새는 곳도 커서, "지키는 계좌"를 따로 두지 않으면 손에 남지 않아요.';
    }

    /* 연애 (남=재성, 여=관성) */
    var spouseStar = gender === 'm' ? '재성' : '관성';
    var spouseName = gender === 'm' ? '재성(여성 인연)' : '관성(남성 인연)';
    var sp = group[spouseStar];
    var love;
    if (sp === 0) {
      love = spouseName + '이 원국에 비어 있어 인연이 조금 늦게 오는 편이에요. 기다리기보다 먼저 말을 거는 쪽이 훨씬 유리하고, 소개·모임처럼 사람이 모이는 자리에서 인연이 붙습니다.';
    } else if (sp <= 2) {
      love = spouseName + '이 ' + sp + '개로 깊고 안정적이에요. 한 사람에게 오래 집중하는 타입이라, 시작보다 유지에서 강합니다.';
    } else {
      love = spouseName + '이 ' + sp + '개로 많아 선택지가 많은 대신 기준이 흔들리기 쉬워요. "이 사람과 3년 뒤"를 먼저 그려 보면 판단이 빨라집니다.';
    }
    var dBranchElem = BRANCH_ELEM[P.day.branch];
    if (dBranchElem === P.dayMaster.elem) love += ' 배우자 자리(일지)가 나와 같은 기운이라, 친구처럼 편한 사람에게 끌립니다.';
    else if ((dBranchElem + 1) % 5 === P.dayMaster.elem) love += ' 배우자 자리(일지)가 나를 살리는 기운이라, 만나면 삶이 정돈되는 사람이에요.';
    else if ((P.dayMaster.elem + 1) % 5 === dBranchElem) love += ' 배우자 자리(일지)가 내가 챙겨야 하는 기운이라, 내가 먼저 다가갈 때 인연이 이어집니다.';

    /* 직업 */
    var work;
    if (group['관성'] === 0) {
      work = '관성(조직의 틀)이 없어 정해진 조직보다 내 사업·프리랜서·1인 콘텐츠 쪽이 잘 맞아요. 규칙보다 결과로 평가받는 자리에서 강합니다.';
    } else if (group['관성'] <= 2) {
      work = '관성이 ' + group['관성'] + '개로 조직·전문직에서 안정적으로 자리 잡는 팔이에요. 맡은 역할을 끝까지 해내는 신뢰가 최대 무기입니다.';
    } else {
      work = '관성이 ' + group['관성'] + '개로 책임과 직책이 따라붙는 팔이에요. 관리·총괄 자리에서 힘을 쓰지만, 혼자 다 떠안지 않게 나눠야 오래 갑니다.';
    }
    if (group['식상'] >= 3) work += ' 식상이 강해 말·글·영상으로 표현하는 일에서 성과가 빨리 납니다.';
    else if (group['인성'] >= 3) work += ' 인성이 강해 공부·자격·전문 지식이 곧 경쟁력이 됩니다.';

    /* 개운 */
    var minIdx = 0, maxIdx = 0;
    for (i = 1; i < 5; i++) {
      if (counts[i] < counts[minIdx]) minIdx = i;
      if (counts[i] > counts[maxIdx]) maxIdx = i;
    }
    var weak = ELEM_INFO[minIdx], strong = ELEM_INFO[maxIdx];
    var luck = [];
    luck.push('부족한 ' + weak.name + ' 기운 채우기 — ' + weak.colorName + ' 소품, ' + weak.dir + ' 자리, 숫자 ' + weak.num + '. ' + weak.act + '이 잘 맞아요.');
    luck.push('먹는 것으로는 ' + weak.food + '을 챙기면 좋습니다.');
    if (counts[maxIdx] >= 3) {
      luck.push(strong.name + ' 기운이 강한 편이라, ' + strong.act + '은 적당히로 줄이고 반대 기운(' + ELEM_INFO[(maxIdx + 2) % 5].name + ') 활동을 섞어 주세요.');
    } else {
      luck.push('기운이 고르게 퍼져 있어 큰 보정은 필요 없어요. 대신 ' + ELEM_INFO[(P.dayMaster.elem + 1) % 5].name + ' 기운(' + ELEM_INFO[(P.dayMaster.elem + 1) % 5].act + ')을 조금 더하면 흐름이 좋아집니다.');
    }

    /* 요약 */
    var dm = DAY_MASTER[dayStem];
    var summary = '일간은 ' + STEM[dayStem] + '(' + STEM_H[dayStem] + ')' + ELEM[P.dayMaster.elem] +
      ' · ' + P.dayMaster.yinyang + '의 기운, "' + dm.title + '"입니다. ' +
      '원국은 ' + strength + ' 쪽이고 ' + ELEM[maxIdx] + ' 기운이 ' + pcts[maxIdx] + '%로 가장 두텁습니다. ' +
      dm.text;

    var keywords = [dm.kw[0], dm.kw[1], dm.kw[2], strength, ELEM[maxIdx] + ' ' + pcts[maxIdx] + '%'];

    return {
      input: {
        name: (input.name || '').trim(),
        y: y, m: m, d: d, hour: hour, hourKnown: hour != null, gender: gender
      },
      sajuYear: P.sajuYear,
      zodiac: P.zodiac,
      pillars: { year: P.year, month: P.month, day: P.day, hour: P.hour },
      names: {
        year: ganzhiName(P.year.stem, P.year.branch),
        month: ganzhiName(P.month.stem, P.month.branch),
        day: ganzhiName(P.day.stem, P.day.branch),
        hour: P.hour ? ganzhiName(P.hour.stem, P.hour.branch) : ''
      },
      hanja: {
        year: ganjiHanja(P.year.stem, P.year.branch),
        month: ganjiHanja(P.month.stem, P.month.branch),
        day: ganjiHanja(P.day.stem, P.day.branch),
        hour: P.hour ? ganjiHanja(P.hour.stem, P.hour.branch) : ''
      },
      dayMaster: {
        stem: STEM[dayStem], hanja: STEM_H[dayStem],
        elem: ELEM[P.dayMaster.elem], yinyang: P.dayMaster.yinyang,
        title: dm.title, keywords: dm.kw, text: dm.text, care: dm.care
      },
      counts: counts,
      percents: pcts,
      elementNames: ELEM,
      elementInfo: ELEM_INFO,
      strongest: { idx: maxIdx, name: ELEM[maxIdx], pct: pcts[maxIdx] },
      weakest: { idx: minIdx, name: ELEM[minIdx], pct: pcts[minIdx] },
      strength: { label: strength, ratio: ratio },
      gods: godCount,
      groups: group,
      today: {
        date: (nd.getMonth() + 1) + '월 ' + nd.getDate() + '일',
        ganzhi: ganzhiName(tStem, tBranch),
        god: tGod,
        keyword: tInfo.kw,
        line: tInfo.line + ' ' + tRel.line
      },
      yearLuck: {
        year: syNow,
        ganzhi: ganzhiName(yStemNow, yBranchNow),
        god: yGod,
        keyword: yInfo.kw,
        line: yInfo.line + ' ' + yRel.line
      },
      points: { money: money, love: love, work: work },
      luck: luck,
      summary: summary,
      keywords: keywords,
      unknownHour: hour == null
    };
  }

  root.SajuCore = {
    STEM: STEM, STEM_H: STEM_H, BRANCH: BRANCH, BRANCH_H: BRANCH_H,
    ELEM: ELEM, ELEM_INFO: ELEM_INFO, GODS: GODS,
    buildPillars: buildPillars,
    buildSaju: buildSaju,
    tenGod: tenGod,
    dayCycleIndex: dayCycleIndex,
    findTerm: findTerm,
    jdToMs: jdToMs,
    toJD: toJD,
    hourBranchOf: hourBranchOf,
    hourLabel: hourLabel,
    ganzhiName: ganzhiName,
    DAY_MASTER: DAY_MASTER
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
