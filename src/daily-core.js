/* =====================================================================
   daily-core · 🌅 일일 운세 계산 (DOM 의존 없음)

   - 생년월일이 있으면 사주(saju-core)의 일간·오늘 일진(六十甲子) 십신을 반영합니다.
   - 띠·별자리만 있어도 같은 날 같은 사람에게는 같은 결과가 나오도록
     (생일 + 오늘 날짜) 시드로 점수를 만듭니다. 새로고침해도 결과가 흔들리지 않습니다.
   - 재미·콘텐츠용입니다.
   ===================================================================== */
(function (root) {
  'use strict';

  var ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];

  /* 양력 별자리 경계 (그 달의 시작일 이상이면 해당 별자리) */
  var SIGNS = [
    { m: 1, d: 20, name: '물병자리', elem: '공기', icon: '♒' },
    { m: 2, d: 19, name: '물고기자리', elem: '물', icon: '♓' },
    { m: 3, d: 21, name: '양자리', elem: '불', icon: '♈' },
    { m: 4, d: 20, name: '황소자리', elem: '흙', icon: '♉' },
    { m: 5, d: 21, name: '쌍둥이자리', elem: '공기', icon: '♊' },
    { m: 6, d: 22, name: '게자리', elem: '물', icon: '♋' },
    { m: 7, d: 23, name: '사자자리', elem: '불', icon: '♌' },
    { m: 8, d: 23, name: '처녀자리', elem: '흙', icon: '♍' },
    { m: 9, d: 23, name: '천칭자리', elem: '공기', icon: '♎' },
    { m: 10, d: 23, name: '전갈자리', elem: '물', icon: '♏' },
    { m: 11, d: 22, name: '사수자리', elem: '불', icon: '♐' },
    { m: 12, d: 22, name: '염소자리', elem: '흙', icon: '♑' }
  ];

  var INTERESTS = [
    { v: 'all', label: '전체', cat: null },
    { v: 'money', label: '재물·사업', cat: 'money' },
    { v: 'love', label: '연애·대인', cat: 'love' },
    { v: 'work', label: '직장·시험', cat: 'work' },
    { v: 'health', label: '건강', cat: 'health' }
  ];

  var TONES = [
    { v: 'warm', label: '따뜻한 조언' },
    { v: 'blunt', label: '직설 팩폭' },
    { v: 'hook', label: '스레드·릴스 후킹형' }
  ];

  var CATS = [
    { key: 'money', label: '재물운', icon: '💰' },
    { key: 'love', label: '연애운', icon: '💕' },
    { key: 'work', label: '직장운', icon: '💼' },
    { key: 'health', label: '건강운', icon: '🌿' }
  ];

  /* ---------------- 문구 사전 ---------------- */
  /* band: hi(78+) / mid(60~77) / lo(~59) */
  var TXT = {
    money: {
      hi: {
        warm: [
          '들어오는 길이 열려 있어요. 미뤄둔 정산·청구를 오늘 처리하면 생각보다 수월하게 풀립니다.',
          '돈의 흐름이 앞을 봐주는 날이에요. 작게 시작한 일이 다음 달 수입으로 이어질 수 있습니다.'
        ],
        blunt: [
          '돈이 붙는 날입니다. 다만 “지금 아니면 못 산다”는 말에 넘어가면 번 만큼 그대로 나갑니다.',
          '오늘 재물운은 진짜입니다. 대신 계산대에서 3초만 더 생각하세요. 그 3초가 오늘의 수익률을 바꿉니다.'
        ],
        hook: [
          '오늘 지갑이 웃는 사람, 딱 한 부류입니다.',
          '오늘 돈 들어오는 사람과 새는 사람, 차이는 딱 하나였습니다.'
        ]
      },
      mid: {
        warm: [
          '크게 벌기보다 새는 곳을 막는 날이에요. 구독·자동결제 한 줄만 정리해도 체감이 다릅니다.',
          '오늘은 채우기보다 지키는 쪽이 잘 맞아요. 이미 가진 것을 다시 쓰는 아이디어가 돈이 됩니다.'
        ],
        blunt: [
          '“이 정도는 괜찮겠지”가 오늘의 함정입니다. 장바구니에 있는 것, 3일 뒤에도 필요할까요?',
          '수입은 그대로인데 지출만 늘어나는 패턴이 보입니다. 오늘은 결제 버튼을 미루는 게 이득입니다.'
        ],
        hook: [
          '오늘 돈 새는 사람 특징 3가지 — 하나만 걸려도 위험합니다.',
          '월급은 그대로인데 통장이 비는 이유, 오늘 딱 정리해 드립니다.'
        ]
      },
      lo: {
        warm: [
          '오늘은 큰 결정을 미뤄도 괜찮아요. 대신 이미 나간 돈을 확인해 두면 마음이 가벼워집니다.',
          '돈보다 마음이 먼저 지친 날이에요. 지출을 줄이는 것보다 불안을 줄이는 쪽이 오늘은 더 이득입니다.'
        ],
        blunt: [
          '충동지출 경보. 오늘 산 물건, 내일도 필요할까요? 아니라면 손대지 마세요.',
          '오늘은 돈 얘기로 승부하지 마세요. 지는 싸움입니다. 확인만 하고 넘어가면 됩니다.'
        ],
        hook: [
          '오늘 카드 긁으면 후회하는 이유, 1분이면 이해됩니다.',
          '재물운 바닥인 날, 이 3가지만 피하면 막을 수 있습니다.'
        ]
      }
    },
    love: {
      hi: {
        warm: [
          '마음이 잘 통하는 날이에요. 먼저 안부를 건네면 관계가 한 칸 앞으로 갑니다.',
          '표현이 통하는 날입니다. 고마웠던 일 한 가지만 말해 보세요. 그게 오늘의 최고 투자예요.'
        ],
        blunt: [
          '오늘은 고백해도 됩니다. 대신 상대 반응까지 읽고 나서요. 밀당은 오늘만큼은 손해입니다.',
          '관계운 좋습니다. 다만 “이 정도면 알아주겠지”는 착각이에요. 말로 하세요.'
        ],
        hook: [
          '오늘 연락이 돌아오는 사람, 이유가 따로 있습니다.',
          '재회운 터지는 날, 먼저 연락할 타이밍은 딱 이때입니다.'
        ]
      },
      mid: {
        warm: [
          '관계는 무난해요. 오해가 있다면 오늘 가볍게 풀어 두면 다음이 편해집니다.',
          '큰 사건보다 작은 배려가 쌓이는 날이에요. 한 사람에게만 집중해 보세요.'
        ],
        blunt: [
          '상대 마음을 추측만 하고 끝내면 오늘도 그대로입니다. 궁금하면 물어보세요.',
          '“요즘 왜 이래”는 오늘 금지입니다. 대신 “나 이게 서운했어”로 바꾸세요.'
        ],
        hook: [
          '오늘 카톡 답장이 늦는 사람, 이걸 확인하세요.',
          '관계에서 자꾸 손해 보는 사람들의 공통점 하나.'
        ]
      },
      lo: {
        warm: [
          '서운함이 올라오기 쉬운 날이에요. 오늘은 결론을 내지 말고 하루만 두고 보세요.',
          '혼자 있는 시간이 약이 되는 날입니다. 억지로 맞추지 않아도 괜찮아요.'
        ],
        blunt: [
          '오늘 감정으로 보낸 메시지는 내일 후회합니다. 보내기 전에 한 번만 읽어 보세요.',
          '싸우려고 만나지 마세요. 오늘은 말이 칼이 됩니다.'
        ],
        hook: [
          '오늘 이 메시지 보내면 관계가 끝납니다.',
          '연애운 바닥인 날, 이 한 마디만 참으세요.'
        ]
      }
    },
    work: {
      hi: {
        warm: [
          '일이 풀리는 날이에요. 미뤄둔 연락·제안을 오늘 꺼내면 반응이 좋습니다.',
          '집중이 잘 되는 날입니다. 가장 중요한 하나를 오전에 끝내 두세요.'
        ],
        blunt: [
          '오늘은 실력이 보입니다. 대신 말이 앞서면 그 공을 남이 가져갑니다. 기록해 두세요.',
          '기회가 오는 날입니다. “나중에 하죠” 하면 그 나중은 안 옵니다.'
        ],
        hook: [
          '오늘 회사에서 인정받는 사람, 이걸 먼저 합니다.',
          '이직·면접운 최고인 날, 타이밍은 오전입니다.'
        ]
      },
      mid: {
        warm: [
          '속도보다 정확도가 중요한 날이에요. 하나를 제대로 끝내면 나머지가 따라옵니다.',
          '동료와 한 번 맞춰 보세요. 혼자 붙잡고 있던 게 쉽게 풀릴 수 있습니다.'
        ],
        blunt: [
          '일이 안 풀리는 게 아니라 순서가 틀렸습니다. 급한 것부터 하지 말고 중요한 것부터 하세요.',
          '오늘 회의에서 말 안 하면 그 일은 당신 일이 됩니다. 지금 정리해 두세요.'
        ],
        hook: [
          '오늘 야근하는 사람, 대부분 이걸 놓쳤습니다.',
          '일 잘하는 척하는 사람과 진짜 잘하는 사람의 차이.'
        ]
      },
      lo: {
        warm: [
          '오늘은 무리하지 마세요. 해야 할 일을 “내일”로 옮겨 적는 것만으로도 절반은 해결됩니다.',
          '막히면 물어보세요. 오늘은 혼자 해결하려는 고집이 손해입니다.'
        ],
        blunt: [
          '오늘 중요한 결정은 금물입니다. 컨디션이 판단을 흐립니다. 메일은 초안까지만.',
          '일이 꼬이는 날입니다. 새 일을 벌리지 말고 불 끄는 데만 집중하세요.'
        ],
        hook: [
          '오늘 이 업무를 시작하면 3일 갑니다. 미루세요.',
          '직장운 최악인 날, 살아남는 방법 3가지.'
        ]
      }
    },
    health: {
      hi: {
        warm: [
          '몸이 가벼운 날이에요. 오래 미뤄둔 산책이나 스트레칭을 시작하기 좋습니다.',
          '잘 자고 잘 먹는 게 그대로 성과가 되는 날입니다. 물 한 잔부터 시작해 보세요.'
        ],
        blunt: [
          '컨디션 좋습니다. 그 기세로 밀린 잠까지 갚으세요. 주말 몰아 자기로는 안 됩니다.',
          '오늘 몸이 말을 듣습니다. 운동 미루는 핑계는 오늘만큼은 통하지 않아요.'
        ],
        hook: [
          '오늘 몸이 좋은 사람, 이 루틴을 지키고 있습니다.',
          '체력이 곧 돈인 이유, 오늘 딱 보여드립니다.'
        ]
      },
      mid: {
        warm: [
          '피로가 쌓이는 날이에요. 30분 일찍 자는 것만으로 내일이 달라집니다.',
          '어깨·목이 뭉치기 쉬워요. 한 시간에 한 번 일어나 스트레칭해 주세요.'
        ],
        blunt: [
          '카페인으로 버티는 중이라면 오늘은 그게 한계입니다. 잠이 답입니다.',
          '물 안 마시고 두통약부터 찾는 습관, 오늘부터 바꾸세요.'
        ],
        hook: [
          '오늘 피곤한 이유, 수면이 아니라 이겁니다.',
          '하루 10분으로 컨디션 바꾸는 법.'
        ]
      },
      lo: {
        warm: [
          '무리하면 바로 티가 나는 날이에요. 약속 하나쯤 미뤄도 괜찮습니다.',
          '몸이 보내는 신호를 무시하지 마세요. 오늘은 쉬는 게 일입니다.'
        ],
        blunt: [
          '오늘 무리하면 다음 주까지 갑니다. 운동은 가볍게, 술은 패스하세요.',
          '면역력이 떨어지는 날입니다. 사람 많은 곳, 기름진 음식, 늦은 잠 셋 다 피하세요.'
        ],
        hook: [
          '오늘 몸이 보내는 경고, 무시하면 3일 앓습니다.',
          '컨디션 최악인 날 해서는 안 되는 3가지.'
        ]
      }
    }
  };

  var ACTIONS = {
    money: {
      hi: ['미뤄둔 정산·청구서 하나 처리하기', '영수증과 구독 결제 목록 확인하기'],
      mid: ['자동결제 1건 정리하기', '오늘 쓸 돈의 상한을 미리 정해두기'],
      lo: ['카드 대신 현금·체크카드로 결제하기', '큰 지출 결정은 3일 뒤로 미루기']
    },
    love: {
      hi: ['먼저 안부 메시지 보내기', '고마웠던 일 한 가지 말로 표현하기'],
      mid: ['오해 하나 풀어보기', '만나서 10분이라도 얼굴 보고 이야기하기'],
      lo: ['감정적인 메시지는 보내지 않기', '혼자만의 시간 30분 갖기']
    },
    work: {
      hi: ['가장 중요한 일을 오전에 끝내기', '미뤄둔 제안 하나 보내기'],
      mid: ['할 일 목록 순서를 다시 정하기', '혼자 붙잡지 말고 동료에게 한 번 물어보기'],
      lo: ['새 일 벌이지 않기', '메일은 초안까지만 저장해 두기']
    },
    health: {
      hi: ['20분 산책하기', '물 1.5L 마시기'],
      mid: ['한 시간마다 일어나 스트레칭하기', '30분 일찍 자기'],
      lo: ['무리한 약속 하나는 취소하기', '따뜻한 물과 수면을 먼저 챙기기']
    }
  };

  var FOCUS = {
    all: {
      warm: '오늘은 한 가지를 크게 바꾸기보다 하루의 리듬을 정돈하는 쪽이 잘 맞아요.',
      blunt: '오늘 결론은 하나입니다. 제일 중요한 것 하나만 제대로 하세요.',
      hook: '오늘 하루를 바꾸는 건 거창한 결심이 아니라 딱 하나의 선택입니다.'
    },
    money: {
      warm: '돈에 관한 결정은 오늘 안에 작게라도 진전을 만들어 보세요. 미루면 다음 주에 더 커집니다.',
      blunt: '오늘 재물 쪽은 확인하지 않으면 그대로 손해입니다. 통장·구독·미납, 5분만 보세요.',
      hook: '오늘 이 5분만 쓰면 이번 달 지출이 달라집니다.'
    },
    love: {
      warm: '오늘은 관계에 쓰는 시간이 아깝지 않은 날이에요. 한 사람에게 집중해 보세요.',
      blunt: '오늘 연애는 타이밍입니다. 재고 있다가 놓치면 다음 기회는 한참 뒤입니다.',
      hook: '오늘 연락 한 통이 관계의 방향을 바꿉니다.'
    },
    work: {
      warm: '일에서는 속도보다 방향이 중요한 날이에요. 무엇을 먼저 할지만 정해 두세요.',
      blunt: '오늘 일은 “바쁘게”가 아니라 “하나를 끝내기”입니다. 나머지는 내일의 당신이 합니다.',
      hook: '오늘 이 하나만 끝내면 이번 주가 편해집니다.'
    },
    health: {
      warm: '오늘은 몸을 먼저 챙기는 게 가장 효율적인 선택이에요. 잠과 물, 두 가지만요.',
      blunt: '오늘 몸을 갈아 넣으면 다음 주에 청구서가 옵니다. 지금 쉬세요.',
      hook: '오늘 컨디션이 다음 주 성과를 결정합니다.'
    }
  };

  var COLORS = [
    { name: '버건디', hex: '#7B1E2B' }, { name: '네이비', hex: '#1F2A44' },
    { name: '아이보리', hex: '#EFE6D2' }, { name: '세이지 그린', hex: '#7A8B6A' },
    { name: '코랄', hex: '#F07A6A' }, { name: '라벤더', hex: '#B9A7DD' },
    { name: '골드', hex: '#C9A227' }, { name: '차콜', hex: '#3A3A44' },
    { name: '스카이 블루', hex: '#8EC5E8' }, { name: '테라코타', hex: '#C56B4A' },
    { name: '민트', hex: '#9FD8C4' }, { name: '딥 퍼플', hex: '#55308C' }
  ];
  var DIRS = ['동쪽', '서쪽', '남쪽', '북쪽', '남동쪽', '남서쪽', '북동쪽', '북서쪽'];
  var AVOIDS = [
    { label: '오전 7~9시', why: '서두르면 실수가 나기 쉬워요' },
    { label: '오전 11시~오후 1시', why: '말이 앞서기 쉬운 시간이에요' },
    { label: '오후 1~3시', why: '집중이 흐트러지기 쉬워요' },
    { label: '오후 4~6시', why: '감정이 올라오기 쉬운 시간이에요' },
    { label: '저녁 7~9시', why: '지출 결정에 약한 시간이에요' },
    { label: '밤 10시 이후', why: '연락과 결제는 다음 날로 미루세요' }
  ];
  var ITEMS = [
    '따뜻한 차 한 잔', '손글씨 메모', '새 펜', '동네 산책', '정리된 책상', '이어폰',
    '작은 화분', '지갑 정리', '가벼운 운동화', '좋아하는 향', '아이스 아메리카노',
    '삶은 달걀', '짧은 통화 한 통', '창가 자리', '손수건', '보조배터리'
  ];
  var KEYWORDS = ['정리의 날', '확장의 날', '버티는 날', '관계의 날', '결정의 날', '회복의 날', '시작의 날', '집중의 날'];

  var GOD = {
    '비견': '나와 같은 기운이 겹치는 날 — 내 페이스대로 밀면 되지만 고집은 독이 됩니다.',
    '겁재': '경쟁과 지출이 같이 오는 날 — 돈 나갈 구멍을 미리 막아두세요.',
    '식신': '내보이는 기운이 좋은 날 — 말·콘텐츠·요리가 잘 풀립니다.',
    '상관': '표현이 강해지는 날 — 창의력은 오르지만 말실수도 함께 옵니다.',
    '편재': '활동해서 버는 기운 — 발로 뛰는 쪽에 돈이 붙습니다.',
    '정재': '착실하게 쌓이는 기운 — 저축·정산·관리에 유리합니다.',
    '편관': '압박과 성장이 같이 오는 날 — 버티면 다음 단계로 갑니다.',
    '정관': '질서와 책임의 기운 — 공식적인 일, 서류, 약속에 강합니다.',
    '편인': '생각이 깊어지는 날 — 아이디어는 좋지만 실행이 밀릴 수 있어요.',
    '정인': '배움과 보호의 기운 — 공부·휴식·조언 구하기에 좋습니다.'
  };
  var MODS = {
    '비견': { money: -2, love: 0, work: 0, health: -3 },
    '겁재': { money: -7, love: 1, work: -2, health: -2 },
    '식신': { money: 3, love: 4, work: 1, health: 2 },
    '상관': { money: 2, love: -3, work: -4, health: 0 },
    '편재': { money: 7, love: 2, work: 1, health: -1 },
    '정재': { money: 6, love: 2, work: 2, health: 0 },
    '편관': { money: -2, love: -2, work: 4, health: -2 },
    '정관': { money: 2, love: 3, work: 6, health: 0 },
    '편인': { money: -1, love: -1, work: 1, health: 4 },
    '정인': { money: 0, love: 2, work: 3, health: 5 }
  };

  /* ---------------- 작은 도구 ---------------- */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function xmur3(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function pickRng(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  function signOf(m, d) {
    var cur = SIGNS[SIGNS.length - 1];
    for (var i = 0; i < SIGNS.length; i++) {
      if (m > SIGNS[i].m || (m === SIGNS[i].m && d >= SIGNS[i].d)) cur = SIGNS[i];
    }
    return cur;
  }
  function zodiacOf(y) {
    var idx = ((y - 4) % 12 + 12) % 12;
    return { name: ZODIAC[idx], idx: idx };
  }
  function dayLabel(d) {
    return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + DOW[d.getDay()] + ')';
  }
  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  function bandOf(score) { return score >= 78 ? 'hi' : (score >= 60 ? 'mid' : 'lo'); }
  function gradeOf(score) {
    if (score >= 85) return '아주 좋음';
    if (score >= 72) return '좋음';
    if (score >= 58) return '보통';
    if (score >= 45) return '주의';
    return '조심';
  }
  function totalLabelOf(t) {
    if (t >= 90) return '최상운';
    if (t >= 80) return '좋은 흐름';
    if (t >= 70) return '무난한 흐름';
    if (t >= 60) return '천천히 가는 날';
    return '정비가 필요한 날';
  }
  function totalLineOf(t, tone) {
    var warm = t >= 80 ? '오늘은 흐름이 당신 편입니다. 미뤄둔 일 하나를 꺼내 보세요.'
      : (t >= 70 ? '크게 오르내리지 않는 하루예요. 하던 일을 이어가면 됩니다.'
        : '오늘은 새로 벌이기보다 지키는 쪽이 이득인 날이에요. 무리하지 않아도 괜찮습니다.');
    var blunt = t >= 80 ? '오늘 안 하면 다음 기회는 한참 뒤입니다. 지금 하세요.'
      : (t >= 70 ? '오늘은 평범합니다. 평범한 날에 뭘 하느냐가 3개월 뒤를 바꿉니다.'
        : '오늘은 이기려 하지 마세요. 버티면 이기는 날입니다.');
    var hook = t >= 80 ? '오늘 하루, 이 사람들은 결과가 다릅니다.'
      : (t >= 70 ? '오늘 운세 평범하다고 넘기면 다음 주에 후회합니다.'
        : '오늘 이걸 모르고 시작하면 하루를 통째로 날립니다.');
    return tone === 'blunt' ? blunt : (tone === 'hook' ? hook : warm);
  }

  /* ---------------- 계산 ---------------- */
  function buildDaily(input, now) {
    var today = now || new Date();
    var tone = input.tone === 'blunt' || input.tone === 'hook' ? input.tone : 'warm';
    var interest = input.interest || 'all';
    var interestCat = null, i;
    for (i = 0; i < INTERESTS.length; i++) if (INTERESTS[i].v === interest) interestCat = INTERESTS[i].cat;

    var hasBirth = !!(input.y && input.m && input.d);
    var y = hasBirth ? +input.y : null, mo = hasBirth ? +input.m : null, da = hasBirth ? +input.d : null;
    var zodiac = hasBirth ? zodiacOf(y).name : (input.zodiac && ZODIAC.indexOf(input.zodiac) >= 0 ? input.zodiac : '용');
    var sign = hasBirth ? signOf(mo, da) : pickSign(input.sign);

    var seedBase = hasBirth ? (y + '-' + mo + '-' + da) : ('z:' + zodiac + ':' + sign.name);
    var seed = xmur3(seedBase + '|' + dateKey(today) + '|' + (input.gender || 'n'));
    var rng = mulberry32(seed);

    /* 오늘 일진 · 사주 관계 */
    var SC = root.SajuCore;
    var todayGanji = '', god = null;
    if (SC && SC.dayCycleIndex) {
      var cyc = SC.dayCycleIndex(today.getFullYear(), today.getMonth() + 1, today.getDate());
      var tStem = cyc % 10, tBranch = cyc % 12;
      todayGanji = SC.STEM[tStem] + SC.BRANCH[tBranch];
      if (hasBirth) {
        var dcyc = SC.dayCycleIndex(y, mo, da);
        var dStem = dcyc % 10;
        var godName = SC.tenGod(dStem, tStem);
        god = {
          name: godName,
          line: GOD[godName] || '',
          dayStem: SC.STEM[dStem],
          todayStem: SC.STEM[tStem]
        };
      }
    }

    var total = 58 + Math.floor(rng() * 39);           /* 58 ~ 96 */
    var keys = ['money', 'love', 'work', 'health'];
    var scores = {}, mods = god ? (MODS[god.name] || {}) : {};
    for (i = 0; i < keys.length; i++) {
      var k = keys[i];
      var s = total + Math.floor(rng() * 31) - 15;      /* total ±15 */
      if (mods[k]) s += mods[k];
      if (interestCat === k) s += 8;
      scores[k] = clamp(Math.round(s), 32, 98);
    }
    /* 총운은 네 항목의 평균 쪽으로 살짝 보정해 앞뒤가 맞게 */
    var avg = Math.round((scores.money + scores.love + scores.work + scores.health) / 4);
    total = clamp(Math.round(total * 0.6 + avg * 0.4), 40, 97);

    var keyword = pickRng(rng, KEYWORDS);
    var cats = [];
    for (i = 0; i < CATS.length; i++) {
      var c = CATS[i];
      var band = bandOf(scores[c.key]);
      var arr = TXT[c.key][band][tone];
      cats.push({
        key: c.key, label: c.label, icon: c.icon,
        score: scores[c.key], band: band, grade: gradeOf(scores[c.key]),
        line: pickRng(rng, arr),
        action: pickRng(rng, ACTIONS[c.key][band])
      });
    }

    var color = pickRng(rng, COLORS);
    var n1 = 1 + Math.floor(rng() * 9), n2 = 1 + Math.floor(rng() * 9);
    if (n2 === n1) n2 = n2 % 9 + 1;
    var lucky = {
      color: color,
      numbers: n1 + ' · ' + n2,
      dir: pickRng(rng, DIRS),
      avoid: pickRng(rng, AVOIDS),
      item: pickRng(rng, ITEMS)
    };

    var focus = null;
    if (interest !== 'all') {
      var fk = interest;
      focus = {
        key: fk,
        label: (function () { for (var j = 0; j < INTERESTS.length; j++) if (INTERESTS[j].v === fk) return INTERESTS[j].label; return '전체'; })(),
        line: FOCUS[fk] ? FOCUS[fk][tone] : ''
      };
    }

    var name = (input.name || '').trim();
    var nm = name ? name + '님' : '';
    var who = hasBirth
      ? (y + '.' + pad2(mo) + '.' + pad2(da) + ' · ' + zodiac + '띠 · ' + sign.name)
      : (zodiac + '띠 · ' + sign.name);

    var mainCat = null;
    if (interestCat) {
      for (i = 0; i < cats.length; i++) if (cats[i].key === interestCat) mainCat = cats[i];
    }

    var summary = (nm ? '오늘 ' + nm + '의 총운은 ' : '오늘의 총운은 ') + total + '점(' + totalLabelOf(total) + '). ' + keyword +
      ' — ' + (mainCat ? mainCat.label + ' ' + mainCat.score + '점. ' : '') + lucky.color.name + ' · ' + lucky.numbers + ' · ' + lucky.dir + '이 오늘의 행운.';

    var plain = [
      '🌅 ' + dayLabel(today) + ' ' + (nm ? nm + '의 ' : '') + '오늘 운세',
      '총운 ' + total + '점 · ' + totalLabelOf(total) + ' · ' + keyword,
      '(' + who + (todayGanji ? ' · 오늘 일진 ' + todayGanji + '일' : '') + ')',
      '',
      '💰 재물 ' + scores.money + '점 — ' + cats[0].line,
      '   → ' + cats[0].action,
      '💕 연애 ' + scores.love + '점 — ' + cats[1].line,
      '   → ' + cats[1].action,
      '💼 직장 ' + scores.work + '점 — ' + cats[2].line,
      '   → ' + cats[2].action,
      '🌿 건강 ' + scores.health + '점 — ' + cats[3].line,
      '   → ' + cats[3].action,
      '',
      '🍀 행운 컬러 ' + lucky.color.name + ' · 숫자 ' + lucky.numbers + ' · 방위 ' + lucky.dir,
      '⚠️ 피할 시간 ' + lucky.avoid.label + ' (' + lucky.avoid.why + ')',
      '🎁 행운 아이템 ' + lucky.item,
      (god ? '🧭 오늘 일진 ' + todayGanji + '일 · 일간 “' + god.dayStem + '”과 ' + god.name + ' 관계' : ''),
      '',
      totalLineOf(total, tone),
      '',
      '재미로 보는 오늘의 운세입니다.'
    ].join('\n').replace(/\n{3,}/g, '\n\n').trim();

    return {
      input: {
        name: name, gender: input.gender || 'n', mode: hasBirth ? 'birth' : 'sign',
        y: y, m: mo, d: da, zodiac: zodiac, sign: sign.name, signIcon: sign.icon, signElem: sign.elem,
        interest: interest, tone: tone, who: who
      },
      today: {
        y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate(),
        label: dayLabel(today), key: dateKey(today), ganzhi: todayGanji
      },
      total: total, totalLabel: totalLabelOf(total), totalLine: totalLineOf(total, tone),
      keyword: keyword, summary: summary,
      scores: scores, cats: cats, lucky: lucky, focus: focus, god: god, plain: plain
    };
  }

  function pickSign(name) {
    for (var i = 0; i < SIGNS.length; i++) if (SIGNS[i].name === name) return SIGNS[i];
    return SIGNS[0];
  }

  /* ---------------- SNS 문구 ---------------- */
  function promo(dr, brand, link) {
    var t = dr.today, i = dr.input;
    var brandLine = brand || '오늘의 운세';
    var linkLine = link || '프로필 링크';
    var tag = '#오늘의운세 #운세 #일일운세 #신년운세 #띠별운세 #별자리운세 #재물운 #연애운';
    var sc = dr.scores, lk = dr.lucky;
    var main = null, k;
    for (k = 0; k < dr.cats.length; k++) if (i.interest !== 'all' && dr.cats[k].key === i.interest) main = dr.cats[k];
    if (!main) {
      main = dr.cats[0];
      for (k = 1; k < dr.cats.length; k++) if (dr.cats[k].score > main.score) main = dr.cats[k];
    }

    var nm = i.name ? i.name + '님 ' : '';
    var thread = [
      '🌅 ' + t.label + ' ' + nm + '오늘의 운세',
      '',
      '총운 ' + dr.total + '점 · ' + dr.totalLabel,
      '키워드: ' + dr.keyword,
      '',
      '💰 재물 ' + sc.money + '점',
      '💕 연애 ' + sc.love + '점',
      '💼 직장 ' + sc.work + '점',
      '🌿 건강 ' + sc.health + '점',
      '',
      '가장 센 쪽은 ' + main.icon + ' ' + main.label + ' ' + main.score + '점.',
      main.line,
      '',
      '🍀 행운: ' + lk.color.name + ' · ' + lk.numbers + ' · ' + lk.dir,
      '⚠️ 피할 시간: ' + lk.avoid.label,
      '👉 ' + linkLine
    ].join('\n');

    var reels = [
      '[0~3초 · 훅]',
      '화면: 오늘 날짜 자막 + 총운 점수 카운트업',
      '내레이션: “' + nm + '오늘 ' + dr.total + '점입니다. 이거 모르고 나가면 하루가 다릅니다.”',
      '',
      '[3~8초 · 문제 제기]',
      '화면: 4대 운세 막대 4개가 순서대로 차오름',
      '내레이션: “재물 ' + sc.money + ', 연애 ' + sc.love + ', 직장 ' + sc.work + ', 건강 ' + sc.health + '. 제일 센 건 ' + main.label + '이에요.”',
      '',
      '[8~15초 · 핵심 한 줄]',
      '화면: 키워드 “' + dr.keyword + '” 크게',
      '내레이션: “' + main.line + '”',
      '',
      '[15~22초 · 행운 정보]',
      '화면: 컬러 칩 ' + lk.color.name + ' / 숫자 ' + lk.numbers + ' / 방위 ' + lk.dir + ' / 피할 시간 ' + lk.avoid.label,
      '내레이션: “색은 ' + lk.color.name + ', 숫자는 ' + lk.numbers + '. ' + lk.avoid.label + '에는 큰 결정 미루세요.”',
      '',
      '[22~28초 · CTA]',
      '화면: 버튼 “오늘의 운세 무료로 보기” + ' + linkLine,
      '내레이션: “생년월일만 넣으면 3초. 아래 링크에서 오늘 운세 확인하세요.”',
      '',
      '[자막·고정 문구] ' + brandLine + ' · 재미로 보는 운세'
    ].join('\n');

    var blog = [
      '[' + t.label + '] ' + nm + '오늘의 운세 총정리 — ' + dr.keyword,
      '',
      '오늘의 총운은 ' + dr.total + '점(' + dr.totalLabel + ')입니다. ' + dr.totalLine,
      '',
      '1) 재물운 ' + sc.money + '점',
      dr.cats[0].line + ' 오늘 할 일: ' + dr.cats[0].action,
      '',
      '2) 연애운 ' + sc.love + '점',
      dr.cats[1].line + ' 오늘 할 일: ' + dr.cats[1].action,
      '',
      '3) 직장운 ' + sc.work + '점',
      dr.cats[2].line + ' 오늘 할 일: ' + dr.cats[2].action,
      '',
      '4) 건강운 ' + sc.health + '점',
      dr.cats[3].line + ' 오늘 할 일: ' + dr.cats[3].action,
      '',
      '오늘의 행운 — 컬러 ' + lk.color.name + ', 숫자 ' + lk.numbers + ', 방위 ' + lk.dir + ', 아이템 ' + lk.item,
      '피해야 할 시간 — ' + lk.avoid.label + ' (' + lk.avoid.why + ')',
      '',
      (dr.god ? '※ 오늘 일진은 ' + dr.today.ganzhi + '일로, 일간 ' + dr.god.dayStem + '과 ' + dr.god.name + ' 관계입니다. ' + dr.god.line : ''),
      '',
      '내 운세 바로 보기: ' + linkLine,
      '',
      '재미로 보는 운세입니다. 중요한 결정은 본인의 판단으로 하세요.',
      (link ? '※ 이 글은 제휴 링크를 포함하며, 링크를 통한 신청 시 소정의 수수료를 받을 수 있습니다.' : '')
    ].join('\n').replace(/\n{3,}/g, '\n\n').trim();

    var sns = [
      '🌅 ' + t.label + ' 오늘의 운세',
      nm + '총운 ' + dr.total + '점 · ' + dr.keyword,
      '재물 ' + sc.money + ' / 연애 ' + sc.love + ' / 직장 ' + sc.work + ' / 건강 ' + sc.health,
      '🍀 ' + lk.color.name + ' · ' + lk.numbers + ' · ' + lk.dir,
      '',
      '👉 ' + linkLine,
      '',
      tag
    ].join('\n');

    return [
      { key: 'thread', label: '🧵 스레드', text: thread },
      { key: 'reels', label: '🎬 릴스·쇼츠 대본', text: reels },
      { key: 'blog', label: '📝 블로그·카페', text: blog },
      { key: 'sns', label: '📸 인스타·당근 캡션', text: sns }
    ];
  }

  root.DailyCore = {
    buildDaily: buildDaily,
    promo: promo,
    signOf: signOf,
    zodiacOf: zodiacOf,
    ZODIAC: ZODIAC,
    SIGNS: SIGNS,
    INTERESTS: INTERESTS,
    TONES: TONES,
    CATS: CATS,
    dayLabel: dayLabel,
    totalLabelOf: totalLabelOf
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
