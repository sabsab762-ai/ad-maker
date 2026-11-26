/* =====================================================================
   quiz-core · 바이럴 심리테스트 데이터 + 채점 + 독립 실행 HTML 생성
   DOM 의존 없음 (문자열만 만든다)
   ===================================================================== */
(function (root) {
  'use strict';

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var Q = [
    { q: '마음에 드는 사람이 생겼다. 가장 먼저 하는 행동은?', o: [
      ['바로 연락한다. 타이밍이 곧 운명', 1, 1],
      ['연락은 하되 만날 날짜와 동선부터 계산', 1, -1],
      ['티 안 내고 상대 반응을 오래 지켜본다', -1, 1],
      ['주변에 상대 정보부터 캐본다', -1, -1]
    ] },
    { q: '연락 텀은 어느 쪽?', o: [
      ['보고 싶으면 바로. 하루에도 몇 번', 1, 1],
      ['용건 위주로 짧고 정확하게', 1, -1],
      ['받은 만큼만. 길게 보는 편', -1, 1],
      ['연락보다 만나서 확인하는 편', -1, -1]
    ] },
    { q: '첫 데이트 코스는?', o: [
      ['노을·야경 좋은 곳에서 오래 걷기', 1, 1],
      ['맛집 리스트 동선 짜서 알차게', 1, -1],
      ['상대가 좋아하는 곳으로 맞춘다', -1, 1],
      ['가까운 데서 가성비·동선 좋게', -1, -1]
    ] },
    { q: '싸웠을 때 나는?', o: [
      ['그날 바로 붙어서 푼다', 1, 1],
      ['사실관계 정리해서 원인부터 해결', 1, -1],
      ['시간을 두고 마음을 정리한다', -1, 1],
      ['연락을 끊고 상대가 먼저 오길 기다린다', -1, -1]
    ] },
    { q: '고백 타이밍은?', o: [
      ['확신이 들면 그날 한다', 1, 1],
      ['성공 확률 70% 넘으면 간다', 1, -1],
      ['상대가 먼저 말해주면 좋겠다', -1, 1],
      ['일·거리·미래 조건이 맞으면 결정', -1, -1]
    ] },
    { q: '연애에서 가장 서운한 건?', o: [
      ['마음 표현이 없을 때', 1, 1],
      ['약속과 계획을 안 지킬 때', 1, -1],
      ['내 마음을 알아주지 않을 때', -1, 1],
      ['내 시간·돈을 함부로 쓸 때', -1, -1]
    ] },
    { q: '장기 연애·결혼을 생각할 때?', o: [
      ['사랑이면 다 된다', 1, 1],
      ['현실 조건도 같이 본다', 1, -1],
      ['마음이 자랄 때까지 기다린다', -1, 1],
      ['충분히 검증되면 결정한다', -1, -1]
    ] }
  ];

  var MONEY_Q = [
    { q: '월급날 가장 먼저 하는 일은?', o: [
      ['적립·투자 자동이체부터 확인', 1, 1],
      ['눈여겨본 종목·부업에 바로 넣는다', 1, -1],
      ['고정지출 정리하고 예산표를 짠다', -1, 1],
      ['일단 쓰고 남으면 저축', -1, -1]
    ] },
    { q: '큰 돈이 생기면?', o: [
      ['분할해서 공격적으로 굴린다', 1, 1],
      ['지금 뜨는 곳에 한 번에 건다', 1, -1],
      ['안전한 예·적금부터 채운다', -1, 1],
      ['갖고 싶던 것·여행에 쓴다', -1, -1]
    ] },
    { q: '투자 정보는 어떻게 얻나?', o: [
      ['데이터·차트를 직접 본다', 1, 1],
      ['일단 들어가고 나중에 공부한다', 1, -1],
      ['확실한 곳만, 뉴스로 확인', -1, 1],
      ['친구·커뮤니티 말 듣고 가볍게', -1, -1]
    ] },
    { q: '부업을 한다면?', o: [
      ['수익 구조와 회수 기간부터 계산', 1, 1],
      ['일단 시작하고 반응 보며 고친다', 1, -1],
      ['본업 지장 없는 선에서 소액으로', -1, 1],
      ['재밌으면 한다', -1, -1]
    ] },
    { q: '큰 지출을 앞두고?', o: [
      ['기대 효과를 숫자로 따져본다', 1, 1],
      ['일단 지르고 후회는 그때', 1, -1],
      ['예산표와 비교해 본다', -1, 1],
      ['그날 기분이 좋으면 산다', -1, -1]
    ] },
    { q: '돈을 버는 이유는?', o: [
      ['더 크게 굴리기 위해', 1, 1],
      ['인생 한 번 크게 해보려고', 1, -1],
      ['노후와 가족의 안정', -1, 1],
      ['지금의 즐거움', -1, -1]
    ] },
    { q: '손실이 났을 때?', o: [
      ['원인 분석하고 다시 들어간다', 1, 1],
      ['더 크게 걸어 만회한다', 1, -1],
      ['손절하고 안전자산으로 옮긴다', -1, 1],
      ['잊고 다른 데 쓴다', -1, -1]
    ] }
  ];

  var WORK_Q = [
    { q: '회의에서 나는?', o: [
      ['안건을 정리하고 방향을 제시한다', 1, 1],
      ['바로 실행 계획을 잡는다', 1, -1],
      ['자료와 근거를 조용히 준비한다', -1, 1],
      ['정해진 일의 담당을 맡는다', -1, -1]
    ] },
    { q: '새 프로젝트를 받으면?', o: [
      ['목표와 구조부터 설계한다', 1, 1],
      ['일단 시제품부터 만든다', 1, -1],
      ['기존 사례와 리스크를 조사한다', -1, 1],
      ['팀원 역할부터 정리한다', -1, -1]
    ] },
    { q: '상사가 틀린 것 같을 때?', o: [
      ['회의에서 근거로 반박한다', 1, 1],
      ['결과로 보여준다', 1, -1],
      ['따로 조용히 말씀드린다', -1, 1],
      ['일단 따르고 기록해 둔다', -1, -1]
    ] },
    { q: '나의 강점은?', o: [
      ['기획서와 논리', 1, 1],
      ['추진력과 마감', 1, -1],
      ['분석과 디테일', -1, 1],
      ['협업과 분위기', -1, -1]
    ] },
    { q: '야근이 생기면?', o: [
      ['우선순위를 다시 정리한다', 1, 1],
      ['일단 끝까지 달린다', 1, -1],
      ['조용히 다 해 놓는다', -1, 1],
      ['팀원 챙기고 분담한다', -1, -1]
    ] },
    { q: '이직을 고민한다면 기준은?', o: [
      ['비전과 성장 가능성', 1, 1],
      ['당장 성과를 낼 수 있는 곳', 1, -1],
      ['안정성과 워라밸', -1, 1],
      ['사람과 팀 분위기', -1, -1]
    ] },
    { q: '성과가 났을 때?', o: [
      ['전략이 맞았다고 본다', 1, 1],
      ['내가 뛰어서 됐다고 본다', 1, -1],
      ['팀이 함께 만든 것', -1, 1],
      ['조용히 다음을 준비한다', -1, -1]
    ] }
  ];

  var SPORTS_Q = [
    { q: '경기 전 가장 먼저 보는 건?', o: [
      ['최근 지표와 라인업 표', 1, 1],
      ['배당 흐름과 시장 반응', 1, -1],
      ['팀 분위기와 뉴스', -1, 1],
      ['그냥 끌리는 팀', -1, -1]
    ] },
    { q: '예상과 반대로 흘러가면?', o: [
      ['지표를 다시 계산한다', 1, 1],
      ['확신이 있으면 더 간다', 1, -1],
      ['일단 지켜본다', -1, 1],
      ['느낌이 바뀌면 바로 바꾼다', -1, -1]
    ] },
    { q: '판단을 굳히는 기준은?', o: [
      ['확률 우위가 보일 때', 1, 1],
      ['배당이 짜도 확신이 있으면', 1, -1],
      ['안전한 쪽에 조금', -1, 1],
      ['끌림', -1, -1]
    ] },
    { q: '경기 하나에 쓰는 분석 시간은?', o: [
      ['1시간 이상 꼼꼼히', 1, 1],
      ['결론은 10분', 1, -1],
      ['핵심 3개만', -1, 1],
      ['거의 안 한다', -1, -1]
    ] },
    { q: '결과가 좋았을 때?', o: [
      ['방법이 맞았는지 복기한다', 1, 1],
      ['다음엔 더 크게 간다', 1, -1],
      ['그대로 유지한다', -1, 1],
      ['운이 좋았다고 생각한다', -1, -1]
    ] },
    { q: '경기를 보는 이유는?', o: [
      ['데이터 검증의 재미', 1, 1],
      ['짜릿함', 1, -1],
      ['여유로운 관전', -1, 1],
      ['사람들과의 이야기', -1, -1]
    ] },
    { q: '기록은 남기나?', o: [
      ['표로 다 남긴다', 1, 1],
      ['머리에만', 1, -1],
      ['가끔 메모한다', -1, 1],
      ['안 한다', -1, -1]
    ] }
  ];

  var CUSTOM_Q = [
    { q: '{topic}, 처음 마주했을 때 나는?', o: [
      ['먼저 나서서 해본다', 1, 1],
      ['감으로 일단 시작한다', 1, -1],
      ['정보부터 모으고 계획을 세운다', -1, 1],
      ['남들이 하는 걸 지켜본다', -1, -1]
    ] },
    { q: '{topic}에서 가장 중요한 건?', o: [
      ['추진 속도', 1, 1],
      ['재미와 타이밍', 1, -1],
      ['준비와 순서', -1, 1],
      ['안정과 균형', -1, -1]
    ] },
    { q: '{topic} 관련 결정을 내릴 때?', o: [
      ['내가 정하고 밀어붙인다', 1, 1],
      ['즉석에서 정한다', 1, -1],
      ['비교표를 만들어 본다', -1, 1],
      ['미루고 지켜본다', -1, -1]
    ] },
    { q: '{topic}에서 실수했을 때?', o: [
      ['바로 수습하고 다시 간다', 1, 1],
      ['웃고 넘긴다', 1, -1],
      ['원인을 정리해 둔다', -1, 1],
      ['조용히 고치고 넘어간다', -1, -1]
    ] },
    { q: '{topic}을 함께하는 사람에게 바라는 건?', o: [
      ['리드해 주는 사람', 1, 1],
      ['즐거운 사람', 1, -1],
      ['꼼꼼한 사람', -1, 1],
      ['편한 사람', -1, -1]
    ] },
    { q: '{topic}에 쓸 시간·돈은?', o: [
      ['아끼지 않는다', 1, 1],
      ['그때그때', 1, -1],
      ['계획한 만큼만', -1, 1],
      ['최소로', -1, -1]
    ] },
    { q: '{topic}의 결과물은?', o: [
      ['빨리 내놓는다', 1, 1],
      ['일단 재밌게', 1, -1],
      ['완성도를 높인다', -1, 1],
      ['조용히 오래 다듬는다', -1, -1]
    ] }
  ];

  var THEMES = {
    love: {
      id: 'love', label: '연애 스타일', emoji: '💕',
      subtitle: '7문항으로 보는 내 연애 방식',
      pctLabel: '설렘 지수',
      axisLabel: ['직진', '밀당', '감성', '현실'],
      types: {
        '++': { name: '운명 직진 로맨티스트', emoji: '💘', tag: '첫눈에 꽂히면 끝까지',
          desc: '마음이 움직이면 계산보다 몸이 먼저 나가요. 좋아하는 티를 숨기지 못해서 상대도 금방 알아챕니다. 사랑을 하나의 사건처럼 크게 겪는 타입이에요.',
          traits: ['고백이 빠르다', '기념일·이벤트를 챙긴다', '실연의 깊이도 깊다'],
          caution: '상대 속도가 느리면 혼자 앞서 달리다 지쳐요. 중간에 한 번은 "지금 어디쯤이야?"를 물어보세요.',
          match: '밀당 감성 탐험가' },
        '+-': { name: '효율 직진 실속러', emoji: '💍', tag: '좋으면 바로, 아니면 바로 정리',
          desc: '감정은 분명한데 확인하는 방식이 현실적이에요. 만나면서 생활 리듬과 조건을 같이 보고, 맞지 않으면 미련 없이 정리합니다.',
          traits: ['연락 텀이 짧다', '약속을 잘 지킨다', '애매한 관계를 못 견딘다'],
          caution: '정리하는 속도가 빨라 상대는 갑작스럽게 느껴요. 결론 전에 이유를 한 번 설명해 주면 오해가 줄어요.',
          match: '계산 빠른 신중러' },
        '-+': { name: '밀당 감성 탐험가', emoji: '🌙', tag: '마음은 깊은데 표현은 미로',
          desc: '좋아할수록 티를 안 내고 오래 관찰해요. 상대가 먼저 다가오면 마음이 확 열리지만, 그 전까지는 혼자 상상이 깊어집니다.',
          traits: ['눈치가 빠르다', '표현은 아끼는 편', '한 번 열리면 깊다'],
          caution: '기다리기만 하면 상대는 관심 없다고 판단해요. 작은 신호라도 하나는 보내세요.',
          match: '운명 직진 로맨티스트' },
        '--': { name: '계산 빠른 신중러', emoji: '🧊', tag: '상처 안 받으려고 먼저 재는 타입',
          desc: '마음보다 가능성을 먼저 봐요. 상대의 생활 패턴, 주변 관계, 미래 계획을 조용히 확인하고 확신이 들 때 움직입니다.',
          traits: ['관찰력이 좋다', '쉽게 흔들리지 않는다', '한 번 정하면 오래 간다'],
          caution: '확신을 기다리다 타이밍을 놓치기 쉬워요. 80%만 맞아도 한 걸음 내디뎌 보세요.',
          match: '효율 직진 실속러' }
      },
      questions: Q
    },
    money: {
      id: 'money', label: '부자 될 확률', emoji: '💰',
      subtitle: '내 돈 쓰는 습관으로 보는 부자 지수',
      pctLabel: '부자 될 확률',
      axisLabel: ['공격', '안정', '계획', '즉흥'],
      types: {
        '++': { name: '타이밍 헌터', emoji: '🎯', tag: '쌀 때 사서 오래 버틴다',
          desc: '기다릴 줄 알고, 올 때 확실히 움직여요. 남들이 겁낼 때 숫자를 보고 결정하는 타입이라 한 번 크게 먹입니다.',
          traits: ['데이터를 믿는다', '분할 매수·분할 매도', '기록을 남긴다'],
          caution: '분석이 길어져 기회를 놓칠 때가 있어요. "결정 기한"을 정해 두면 좋습니다.',
          match: '차곡차곡 설계자' },
        '+-': { name: '한 방 승부사', emoji: '🚀', tag: '인생은 한 번, 크게 걸어본다',
          desc: '확신이 서면 크게 겁니다. 실패해도 회복이 빠르고, 성공했을 때 판을 바꾸는 힘이 있어요.',
          traits: ['배짱이 좋다', '기회 포착이 빠르다', '복기가 빠르다'],
          caution: '한 번의 판단이 오래 남는 손실이 될 수 있어요. "잃어도 되는 금액" 상한을 정해 두세요.',
          match: '타이밍 헌터' },
        '-+': { name: '차곡차곡 설계자', emoji: '🏦', tag: '10년 뒤를 오늘 계산한다',
          desc: '속도보다 방향이에요. 자동이체, 예산표, 장기 계획처럼 굴러가는 구조를 만들어 돈이 알아서 쌓이게 합니다.',
          traits: ['예산표가 있다', '자동화에 강하다', '큰 지출은 미리 계획'],
          caution: '안전한 것만 고르면 물가·기회비용에 밀려요. 작은 비중이라도 성장 자산을 섞어 보세요.',
          match: '타이밍 헌터' },
        '--': { name: '행복 소비가', emoji: '🍰', tag: '지금 즐거우면 그게 남는 장사',
          desc: '돈은 쓰라고 있는 것이라고 믿어요. 경험과 사람에게 쓰는 데 아끼지 않고, 그 에너지로 다시 버는 타입입니다.',
          traits: ['경험에 투자한다', '사람에게 잘 쓴다', '스트레스를 빨리 푼다'],
          caution: '새는 돈이 쌓이면 버는 속도를 따라잡아요. "먼저 떼고 쓰는" 계좌 하나만 두세요.',
          match: '차곡차곡 설계자' }
      },
      questions: MONEY_Q
    },
    work: {
      id: 'work', label: '숨겨진 직장인 유형', emoji: '🧑‍💼',
      subtitle: '회의실에서 드러나는 내 진짜 역할',
      pctLabel: '조직 생존력',
      axisLabel: ['앞장', '뒤에서', '기획', '실행'],
      types: {
        '++': { name: '회의실의 브레인', emoji: '🧠', tag: '문제를 정의하고 판을 짠다',
          desc: '회의가 길어지면 정리해 주는 사람이 바로 나예요. 목표와 구조를 세우고 사람을 배치하는 데 재능이 있습니다.',
          traits: ['논리가 깔끔하다', '발표에 강하다', '본질을 먼저 본다'],
          caution: '설계에 몰두하다 실행이 늦어질 수 있어요. "오늘 낼 것" 하나를 정해 두세요.',
          match: '현장의 해결사' },
        '+-': { name: '현장의 해결사', emoji: '🔧', tag: '일단 뛰고 보는 추진력',
          desc: '회의보다 현장이 편한 사람이에요. 막힌 일을 뚫고 마감을 지켜 내는 힘으로 팀을 굴러가게 합니다.',
          traits: ['실행이 빠르다', '위기 대응이 강하다', '말보다 결과'],
          caution: '빠르게 가다 방향이 틀리면 크게 돌아와야 해요. 시작 전 10분만 구조를 확인하세요.',
          match: '회의실의 브레인' },
        '-+': { name: '조용한 설계자', emoji: '📐', tag: '말없이 구조를 짜둔다',
          desc: '앞에 나서기보다 뒤에서 판을 짜는 타입이에요. 자료와 근거를 쌓아 두었다가 결정적인 순간에 꺼냅니다.',
          traits: ['분석이 깊다', '디테일에 강하다', '기록을 남긴다'],
          caution: '공을 인정받지 못할 때가 있어요. 결과를 한 줄로 공유하는 습관이 필요합니다.',
          match: '든든한 지원군' },
        '--': { name: '든든한 지원군', emoji: '🛡️', tag: '없으면 굴러가지 않는 사람',
          desc: '결정된 일을 끝까지 해내고 사람들을 챙겨요. 무대에 안 보여도 팀이 나 없으면 불편해지는 타입입니다.',
          traits: ['책임감이 강하다', '협업이 편하다', '분위기를 살린다'],
          caution: '남의 일까지 떠안아 지치기 쉬워요. "내 몫"의 경계를 정해 두세요.',
          match: '조용한 설계자' }
      },
      questions: WORK_Q
    },
    sports: {
      id: 'sports', label: '스포츠 승부 성향', emoji: '🏟️',
      subtitle: '경기를 볼 때 드러나는 승부사 기질',
      pctLabel: '승부사 기질',
      axisLabel: ['데이터', '촉', '안정', '모험'],
      types: {
        '++': { name: '데이터 장인', emoji: '📊', tag: '숫자가 말할 때만 움직인다',
          desc: '라인업, 최근 지표, 상대 전적을 표로 정리해야 직성이 풀려요. 근거가 약하면 과감히 패스하는 것도 이 타입의 실력입니다.',
          traits: ['표를 만든다', '패스를 잘한다', '복기를 남긴다'],
          caution: '지표에 없는 변수(부상·분위기)를 놓칠 수 있어요. 숫자 밖의 뉴스도 한 번 보세요.',
          match: '촉 좋은 관리자' },
        '+-': { name: '숫자로 승부하는 모험가', emoji: '🎲', tag: '근거는 있지만 크게 건다',
          desc: '분석은 하지만 결정은 과감해요. 확률이 조금이라도 유리하면 크게 가는 배짱이 있습니다.',
          traits: ['승부처를 안다', '계산이 빠르다', '크게 이기는 맛을 안다'],
          caution: '한 번의 큰 판이 전체를 흔들 수 있어요. "이번 주 상한"을 정해 두세요.',
          match: '직감의 승부사' },
        '-+': { name: '촉 좋은 관리자', emoji: '🧿', tag: '느낌 오는 날만 소액으로',
          desc: '직감이 좋은데 위험은 싫어요. 확신이 드는 순간에만 조금씩 움직여서 크게 잃지 않습니다.',
          traits: ['타이밍이 좋다', '무리하지 않는다', '관찰이 길다'],
          caution: '확신을 기다리다 재미를 놓칠 수 있어요. 작게라도 참여해 감을 유지해 보세요.',
          match: '데이터 장인' },
        '--': { name: '직감의 승부사', emoji: '🔥', tag: '이건 된다 싶으면 간다',
          desc: '경기를 몸으로 느끼는 타입이에요. 분위기와 흐름을 읽는 감각이 좋고, 재미 자체를 가장 크게 즐깁니다.',
          traits: ['분위기를 잘 읽는다', '재미가 원동력', '경기 자체를 즐긴다'],
          caution: '감정이 판단을 밀어낼 때가 있어요. 결과는 결과대로, 기록은 기록대로 남겨 보세요.',
          match: '숫자로 승부하는 모험가' }
      },
      questions: SPORTS_Q,
      note: '재미로 보는 성향 테스트입니다. 베팅을 권유하거나 수익을 보장하지 않습니다.'
    },
    custom: {
      id: 'custom', label: '직접 입력 테스트', emoji: '✨',
      subtitle: '내 주제로 만드는 성향 테스트',
      pctLabel: '몰입 지수',
      axisLabel: ['주도', '관망', '계획', '즉흥'],
      types: {
        '++': { name: '무대의 주인공', emoji: '🎤', tag: '{topic}은(는) 내가 이끈다',
          desc: '{topic} 앞에서 남의 눈치를 보지 않아요. 일단 판을 열고 사람들을 끌고 가는 힘이 있습니다.',
          traits: ['먼저 시작한다', '설득이 빠르다', '책임을 진다'],
          caution: '혼자 너무 앞서면 주변이 지칩니다. 중간에 한 번씩 같이 갈 사람을 확인하세요.',
          match: '든든한 설계자' },
        '+-': { name: '즉흥 아이디어 뱅크', emoji: '💡', tag: '일단 재밌으면 해본다',
          desc: '{topic}에 아이디어가 먼저 떠오르는 타입이에요. 시작이 빠르고 변형도 빨라서 재미있는 결과가 나옵니다.',
          traits: ['아이디어가 많다', '시작이 빠르다', '분위기를 즐긴다'],
          caution: '벌여 놓은 일이 많아 마무리가 약해요. 지금 하는 하나만 끝내보세요.',
          match: '무대의 주인공' },
        '-+': { name: '든든한 설계자', emoji: '🧭', tag: '정보를 모아 완성도로 승부',
          desc: '{topic}을 시작하기 전에 정보와 순서를 먼저 정리해요. 실패가 적고 결과물이 깔끔합니다.',
          traits: ['준비가 철저하다', '실수가 적다', '신뢰가 간다'],
          caution: '준비가 길어지면 시작을 놓쳐요. 초안을 먼저 만들어 보세요.',
          match: '무대의 주인공' },
        '--': { name: '조용한 관찰자', emoji: '🔍', tag: '최소한으로, 오래 간다',
          desc: '{topic}을 멀리서 먼저 관찰하는 타입이에요. 필요한 것만 골라 오래 끌고 가는 힘이 있습니다.',
          traits: ['눈치가 빠르다', '낭비가 없다', '오래 간다'],
          caution: '지켜보기만 하면 기회를 놓쳐요. 한 번은 작게 시작해 보세요.',
          match: '즉흥 아이디어 뱅크' }
      },
      questions: CUSTOM_Q
    }
  };

  function fillTopic(text, topic) {
    return String(text || '').split('{topic}').join(topic || '이 주제');
  }

  /* 5문항은 가운데를 덜어내고 고르게 뽑는다 */
  function pickQuestions(list, count) {
    if (count >= list.length) return list.slice();
    var idx = count === 5 ? [0, 1, 2, 4, 6] : [0, 2, 4, 6];
    return idx.map(function (i) { return list[i]; }).filter(Boolean);
  }

  function buildQuiz(opts) {
    opts = opts || {};
    var theme = THEMES[opts.theme] || THEMES.love;
    var topic = (opts.topic || '').trim();
    var count = Number(opts.count) === 5 ? 5 : 7;
    var title = theme.id === 'custom'
      ? (topic ? '"' + topic + '" 성향 테스트' : '나만의 성향 테스트')
      : theme.label + ' 테스트';
    var questions = pickQuestions(theme.questions, count).map(function (item) {
      return {
        q: fillTopic(item.q, topic),
        o: item.o.map(function (o) {
          return { t: fillTopic(o[0], topic), a: [o[1], o[2]] };
        })
      };
    });
    var types = {};
    Object.keys(theme.types).forEach(function (k) {
      var t = theme.types[k];
      types[k] = {
        name: fillTopic(t.name, topic), emoji: t.emoji, tag: fillTopic(t.tag, topic),
        desc: fillTopic(t.desc, topic), traits: t.traits.map(function (x) { return fillTopic(x, topic); }),
        caution: fillTopic(t.caution, topic), match: fillTopic(t.match, topic)
      };
    });
    return {
      theme: theme.id,
      emoji: theme.emoji,
      title: title,
      subtitle: fillTopic(theme.subtitle, topic),
      pctLabel: theme.pctLabel,
      axisLabel: theme.axisLabel,
      note: theme.note || '',
      topic: topic,
      count: questions.length,
      questions: questions,
      types: types,
      cta: {
        label: (opts.ctaLabel || '').trim() || '내 채널 놀러가기',
        url: normalizeUrl(opts.ctaUrl || '')
      }
    };
  }

  function normalizeUrl(u) {
    var s = String(u || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(s)) return 'https://' + s;
    return '';
  }

  function computeResult(quiz, answers) {
    var s0 = 0, s1 = 0, i, n = quiz.questions.length;
    for (i = 0; i < n; i++) {
      var a = answers[i];
      if (a == null || !quiz.questions[i].o[a]) continue;
      s0 += quiz.questions[i].o[a].a[0];
      s1 += quiz.questions[i].o[a].a[1];
    }
    var key = (s0 >= 0 ? '+' : '-') + (s1 >= 0 ? '+' : '-');
    var maxAbs = Math.max(1, n);
    var pct = 52 + Math.round(((s0 + s1) + 2 * maxAbs) / (4 * maxAbs) * 45);
    return {
      key: key,
      type: quiz.types[key] || quiz.types['++'],
      pct: Math.max(41, Math.min(97, pct)),
      s0: s0, s1: s1
    };
  }

  function shareText(quiz, result, url) {
    var link = normalizeUrl(url || '');
    var lines = [
      quiz.emoji + ' ' + quiz.title,
      '내 결과: ' + result.type.emoji + ' ' + result.type.name + ' — ' + quiz.pctLabel + ' ' + result.pct + '%',
      '"' + result.type.tag + '"',
      link ? '너는 뭐 나올까? ' + link : '너는 뭐 나올까? 프로필 링크에서 확인!'
    ];
    return lines.join('\n');
  }

  function promoPosts(quiz, result, url) {
    var link = normalizeUrl(url || '');
    var linkLine = link ? link : '프로필 링크';
    var title = quiz.title;
    var t = result ? result.type : null;
    var sample = t ? t.emoji + ' ' + t.name + ' 나왔어요' : '유형이 딱 나와요';
    var countLine = quiz.count + '문항, 1분이면 끝';

    var danggeun = [
      '동네분들 ' + title + ' 한번 해보세요 😊',
      '',
      countLine + '이라 잠깐 심심풀이로 딱이에요.',
      '저는 ' + sample + ' ㅋㅋ',
      '',
      '댓글에 결과 남겨주시면 저도 궁금해요!',
      '👉 ' + linkLine
    ].join('\n');

    var thread = [
      title + ', ' + countLine + '.',
      '',
      '1) ' + quiz.questions[0].q,
      '2) 마지막에 유형이 딱 나옵니다',
      '3) ' + sample,
      '',
      '친구 태그해서 결과 비교해 보세요 👇',
      linkLine
    ].join('\n');

    var tags = ['#' + title.replace(/\s+/g, ''), '#심리테스트', '#성향테스트', '#유형테스트', '#재미로보는테스트',
      '#연애테스트', '#부자테스트', '#직장인테스트', '#스포츠', '#김카마'];
    var insta = [
      quiz.emoji + ' ' + title,
      '',
      sample + '.',
      '생각보다 정확해서 소름 돋았어요 😳',
      '',
      countLine + ', 결과 복사 버튼도 있어요.',
      '궁금하면 프로필 링크!',
      '',
      tags.join(' ')
    ].join('\n');

    return [
      { key: 'danggeun', label: '🥕 당근(동네)', text: danggeun },
      { key: 'thread', label: '🧵 스레드', text: thread },
      { key: 'insta', label: '📸 인스타 캡션', text: insta }
    ];
  }

  /* ---------------- 독립 실행 HTML ---------------- */

  function buildHTML(quiz) {
    var data = JSON.stringify(quiz).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    var ctaHtml = quiz.cta.url
      ? '<a class="cta" id="cta" href="' + esc(quiz.cta.url) + '" target="_blank" rel="noopener noreferrer">' + esc(quiz.cta.label) + ' →</a>'
      : '<div class="cta cta-off" id="cta" hidden></div>';

    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<title>' + esc(quiz.title) + '</title>\n' +
      '<meta name="description" content="' + esc(quiz.subtitle) + ' — ' + quiz.count + '문항, 1분이면 끝">\n' +
      '<meta property="og:title" content="' + esc(quiz.title) + '">\n' +
      '<meta property="og:description" content="' + esc(quiz.subtitle) + '">\n' +
      '<meta name="theme-color" content="#6338F5">\n' +
      '<style>\n' + CSS + '</style>\n</head>\n<body>\n' +
      '<div class="wrap">\n<main id="app"></main>\n' +
      '<footer class="foot">재미로 보는 테스트입니다. 결과는 정답이 아니에요.' +
      (quiz.note ? ' ' + esc(quiz.note) : '') + '</footer>\n</div>\n' +
      '<script>\nvar QZ = ' + data + ';\n' + RUNTIME + '\n<\/script>\n</body>\n</html>\n';
  }

  var CSS = [
    '*,*::before,*::after{box-sizing:border-box}',
    'html{-webkit-text-size-adjust:100%}',
    'body{margin:0;min-height:100vh;background:linear-gradient(160deg,#F3EEFF 0%,#FDF7F0 55%,#F1F2F5 100%);color:#17171B;',
    'font-family:-apple-system,BlinkMacSystemFont,"Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;line-height:1.55;-webkit-font-smoothing:antialiased}',
    'button{font-family:inherit;cursor:pointer}',
    '.wrap{max-width:560px;margin:0 auto;padding:20px 16px 40px}',
    '#app{background:#fff;border-radius:24px;box-shadow:0 12px 34px rgba(60,40,120,.10);padding:26px 22px 22px;min-height:420px}',
    '.kicker{font-size:12px;font-weight:800;color:#6338F5;letter-spacing:.04em}',
    '.hero-emoji{font-size:52px;line-height:1;margin-top:6px}',
    'h1{font-size:24px;font-weight:800;letter-spacing:-.04em;line-height:1.3;margin:10px 0 0;word-break:keep-all}',
    '.sub{margin-top:10px;font-size:13.5px;color:#6D6D7A;word-break:keep-all}',
    '.meta{margin-top:16px;display:flex;gap:7px;flex-wrap:wrap}',
    '.meta span{padding:5px 11px;border-radius:999px;background:#F1ECFF;color:#4C24D6;font-size:11.5px;font-weight:800}',
    '.start{display:block;width:100%;margin-top:24px;height:52px;border:0;border-radius:14px;background:#6338F5;color:#fff;font-size:16px;font-weight:800;box-shadow:0 6px 16px rgba(99,56,245,.28)}',
    '.start:active{transform:scale(.99)}',
    '.hint{margin-top:12px;text-align:center;font-size:11.5px;color:#9C9CA8}',
    '.pbar{height:6px;border-radius:999px;background:#EFEFF5;overflow:hidden}',
    '.pbar i{display:block;height:100%;background:#6338F5;border-radius:999px;transition:width .25s ease}',
    '.pnum{margin-top:10px;display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;color:#9C9CA8}',
    '.q{margin-top:18px;font-size:19px;font-weight:800;letter-spacing:-.03em;line-height:1.4;word-break:keep-all;min-height:54px}',
    '.opts{margin-top:16px;display:flex;flex-direction:column;gap:9px}',
    '.opt{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:14px 14px;border:1.5px solid #EBEBF2;border-radius:14px;background:#FCFCFE;font-size:14px;font-weight:600;color:#2A2A33;line-height:1.5;word-break:keep-all;transition:.15s}',
    '.opt:hover{border-color:#DED3FF;background:#FBFAFF}',
    '.opt:active{transform:scale(.995)}',
    '.opt b{flex:none;width:22px;height:22px;border-radius:50%;background:#F1ECFF;color:#4C24D6;font-size:11.5px;display:grid;place-items:center;margin-top:1px}',
    '.back{margin-top:14px;border:0;background:none;color:#9C9CA8;font-size:12.5px;font-weight:700;padding:6px 2px}',
    '.res-top{text-align:center;margin-top:4px}',
    '.res-emoji{font-size:56px;line-height:1}',
    '.res-name{margin-top:8px;font-size:23px;font-weight:800;letter-spacing:-.04em}',
    '.res-tag{margin-top:6px;font-size:13.5px;color:#6D6D7A}',
    '.score{margin:18px auto 0;width:132px;height:132px;border-radius:50%;display:grid;place-items:center;',
    'background:conic-gradient(#6338F5 var(--p),#EFEFF5 0);position:relative}',
    '.score::after{content:"";position:absolute;inset:10px;background:#fff;border-radius:50%}',
    '.score .in{position:relative;z-index:1;text-align:center}',
    '.score b{display:block;font-size:30px;font-weight:800;letter-spacing:-.05em;color:#4C24D6;line-height:1}',
    '.score span{display:block;margin-top:4px;font-size:11px;font-weight:800;color:#9C9CA8}',
    '.sec{margin-top:18px;padding:15px 16px;border-radius:14px;background:#FAFAFC;border:1px solid #F1F1F6}',
    '.sec h2{margin:0 0 7px;font-size:12.5px;font-weight:800;color:#6338F5;letter-spacing:.01em}',
    '.sec p{margin:0;font-size:13px;line-height:1.75;color:#3A3A44;word-break:keep-all}',
    '.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}',
    '.chips span{padding:5px 10px;border-radius:999px;background:#fff;border:1px solid #E8E8EF;font-size:11.5px;font-weight:800;color:#5A5A66}',
    '.btn-row{margin-top:16px;display:flex;flex-direction:column;gap:8px}',
    '.btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;height:48px;border:0;border-radius:13px;font-size:14.5px;font-weight:800}',
    '.share{background:#F1ECFF;color:#4C24D6}',
    '.again{background:#fff;border:1.5px solid #E8E8EF;color:#5A5A66}',
    '.cta{display:flex;align-items:center;justify-content:center;width:100%;height:50px;margin-top:10px;border-radius:13px;background:#17171B;color:#fff;font-size:14.5px;font-weight:800;text-decoration:none}',
    '.cta-off{display:none}',
    '.foot{margin-top:16px;text-align:center;font-size:11px;line-height:1.7;color:#9C9CA8;padding:0 8px}',
    '.toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,8px);background:rgba(23,23,27,.94);color:#fff;',
    'padding:10px 16px;border-radius:999px;font-size:12.5px;font-weight:700;opacity:0;pointer-events:none;transition:.2s;z-index:9}',
    '.toast.on{opacity:1;transform:translate(-50%,0)}',
    '@media (prefers-reduced-motion:reduce){*{transition:none!important}}'
  ].join('\n');

  var RUNTIME = [
    '(function(){',
    'var app=document.getElementById("app"),answers=[],idx=0,result=null;',
    'function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}',
    'function toast(msg){var t=document.getElementById("tost");if(!t){t=el("div","toast");t.id="tost";document.body.appendChild(t);}',
    't.textContent=msg;t.classList.add("on");clearTimeout(t._tm);t._tm=setTimeout(function(){t.classList.remove("on");},2000);}',
    'function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}',
    'function share(){',
    'var u=location.href.indexOf("http")===0?location.href:"";',
    'var txt=QZ.emoji+" "+QZ.title+"\\n내 결과: "+result.type.emoji+" "+result.type.name+" — "+QZ.pctLabel+" "+result.pct+"%\\n\\""+result.type.tag+"\\"\\n"+(u?"너는 뭐 나올까? "+u:"너는 뭐 나올까?");',
    'function done(ok){toast(ok?"결과를 복사했어요! 붙여넣기 하세요":"복사가 막혔어요. 길게 눌러 복사해 주세요");}',
    'if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(function(){done(true);},function(){fallback(txt,done);});}else{fallback(txt,done);}',
    '}',
    'function fallback(txt,cb){var ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.top="-999px";document.body.appendChild(ta);ta.select();var ok=false;try{ok=document.execCommand("copy");}catch(e){}document.body.removeChild(ta);cb(ok);}',
    'function intro(){',
    'app.innerHTML="";',
    'var k=el("div","kicker","심리테스트 · 성향테스트");',
    'var e=el("div","hero-emoji",QZ.emoji);',
    'var h=el("h1",null,esc(QZ.title));',
    'var s=el("div","sub",esc(QZ.subtitle));',
    'var m=el("div","meta","<span>"+QZ.count+"문항</span><span>약 1분</span><span>결과 공유 가능</span>");',
    'var b=el("button","start","테스트 시작하기");',
    'b.onclick=function(){answers=[];idx=0;question();};',
    'var hint=el("div","hint","정답은 없어요. 끌리는 쪽을 눌러주세요.");',
    'app.appendChild(k);app.appendChild(e);app.appendChild(h);app.appendChild(s);app.appendChild(m);app.appendChild(b);app.appendChild(hint);',
    '}',
    'function question(){',
    'app.innerHTML="";',
    'var q=QZ.questions[idx];',
    'var top=el("div");',
    'top.innerHTML="<div class=\\"pbar\\"><i style=\\"width:"+Math.round(idx/QZ.count*100)+"%\\"></i></div>"+',
    '"<div class=\\"pnum\\"><span>Q"+(idx+1)+"</span><span>"+(idx+1)+" / "+QZ.count+"</span></div>";',
    'var qt=el("div","q",esc(q.q));',
    'var opts=el("div","opts");',
    'q.o.forEach(function(o,i){',
    'var b=el("button","opt","<b>"+"ABCD".charAt(i)+"</b><span>"+esc(o.t)+"</span>");',
    'b.onclick=function(){answers[idx]=i;if(idx<QZ.count-1){idx++;question();}else{showResult();}};',
    'opts.appendChild(b);',
    '});',
    'app.appendChild(top);app.appendChild(qt);app.appendChild(opts);',
    'if(idx>0){var bk=el("button","back","← 이전 질문");bk.onclick=function(){idx--;question();};app.appendChild(bk);}',
    'window.scrollTo(0,0);',
    '}',
    'function showResult(){',
    'var s0=0,s1=0;for(var i=0;i<QZ.count;i++){var a=answers[i];if(a==null)continue;s0+=QZ.questions[i].o[a].a[0];s1+=QZ.questions[i].o[a].a[1];}',
    'var key=(s0>=0?"+":"-")+(s1>=0?"+":"-");',
    'var pct=52+Math.round(((s0+s1)+2*QZ.count)/(4*QZ.count)*45);pct=Math.max(41,Math.min(97,pct));',
    'var t=QZ.types[key]||QZ.types["++"];result={key:key,type:t,pct:pct};',
    'app.innerHTML="";',
    'var top=el("div","res-top");',
    'top.innerHTML="<div class=\\"res-emoji\\">"+t.emoji+"</div><div class=\\"res-name\\">"+esc(t.name)+"</div><div class=\\"res-tag\\">\\""+esc(t.tag)+"\\"</div>";',
    'var sc=el("div","score","<div class=\\"in\\"><b>"+pct+"%</b><span>"+esc(QZ.pctLabel)+"</span></div>");',
    'sc.style.setProperty("--p",pct+"%");',
    'var d=el("div","sec","<h2>이런 사람이에요</h2><p>"+esc(t.desc)+"</p>");',
    'var tr=el("div","sec","<h2>포인트</h2><div class=\\"chips\\">"+t.traits.map(function(x){return "<span>"+esc(x)+"</span>";}).join("")+"</div>");',
    'var ca=el("div","sec","<h2>조심할 점</h2><p>"+esc(t.caution)+"</p>");',
    'var mt=el("div","sec","<h2>잘 맞는 유형</h2><p>"+esc(t.match)+"</p>");',
    'var row=el("div","btn-row");',
    'var sh=el("button","btn share","결과 공유 텍스트 복사");sh.onclick=share;',
    'var ag=el("button","btn again","다시 하기");ag.onclick=function(){answers=[];idx=0;question();};',
    'row.appendChild(sh);row.appendChild(ag);',
    'app.appendChild(top);app.appendChild(sc);app.appendChild(d);app.appendChild(tr);app.appendChild(ca);appendIf(mt);app.appendChild(row);',
    'if(QZ.cta&&QZ.cta.url){var c=el("a","cta",esc(QZ.cta.label)+" →");c.href=QZ.cta.url;c.target="_blank";c.rel="noopener noreferrer";app.appendChild(c);}',
    'function appendIf(x){if(x)app.appendChild(x);}',
    'window.scrollTo(0,0);',
    '}',
    'intro();',
    '})();'
  ].join('\n');

  root.QuizCore = {
    THEMES: THEMES,
    buildQuiz: buildQuiz,
    computeResult: computeResult,
    shareText: shareText,
    promoPosts: promoPosts,
    buildHTML: buildHTML,
    normalizeUrl: normalizeUrl,
    esc: esc
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
