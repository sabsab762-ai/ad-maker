/* =====================================================================
   tarot-core · 🃏 타로카드 22장(메이저 아르카나) 데이터 + 리딩 (DOM 의존 없음)

   - 카드 셔플은 뽑을 때마다 새로 섞습니다(Math.random).
   - 정방향/역방향은 카드를 뒤집을 때 38% 확률로 정해집니다.
   - 재미·콘텐츠용 리딩입니다.
   ===================================================================== */
(function (root) {
  'use strict';

  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

  var TOPICS = [
    { v: 'love', label: '연애·재회', icon: '💕', tags: '#타로 #연애운 #재회운 #타로리딩 #연애상담' },
    { v: 'money', label: '재물·돈', icon: '💰', tags: '#타로 #재물운 #금전운 #타로리딩 #돈운' },
    { v: 'work', label: '이직·진로', icon: '💼', tags: '#타로 #이직운 #진로운 #타로리딩 #커리어' },
    { v: 'human', label: '대인·관계', icon: '🤝', tags: '#타로 #인간관계 #관계운 #타로리딩 #속마음' },
    { v: 'today', label: '오늘의 한 장', icon: '🌙', tags: '#타로 #오늘의타로 #데일리타로 #타로리딩' }
  ];

  var SPREADS = [
    { v: '1', label: '1장 원카드', count: 1, desc: '지금 가장 필요한 한 가지' },
    { v: '3', label: '3장 과거·현재·미래', count: 3, desc: '흐름을 읽는 기본 스프레드' }
  ];

  /* weight: 카드의 기본 기운(+2 아주 좋음 ~ -1 주의). 역방향이면 부호가 뒤집힙니다. */
  var MAJORS = [
    {
      n: 0, name: '바보', en: 'The Fool', emoji: '🌱', weight: 1,
      kw: ['새로운 시작', '자유', '모험'],
      up: {
        line: '아무것도 정해지지 않은 상태가 오히려 무기입니다. 완벽한 준비보다 한 걸음이 길을 엽니다.',
        advice: '작게라도 오늘 한 번 시작하세요. 준비는 걷다 보면 채워집니다.'
      },
      rev: {
        line: '시작이 두려워 머뭇거리는 중입니다. 준비만 늘리면 출발선에 서 있는 시간만 길어집니다.',
        advice: '조건이 다 갖춰지길 기다리지 말고, 되돌릴 수 있는 작은 시도부터 하세요.'
      },
      topics: {
        love: { up: '설렘은 계산 없이 시작될 때 가장 오래갑니다.', rev: '즉흥적인 연락이 오해를 부를 수 있어요.' },
        money: { up: '작은 베팅은 재미, 큰 베팅은 금물입니다.', rev: '준비 없는 지출로 돈이 새기 쉬워요.' },
        work: { up: '새 프로젝트·새 역할에 잘 맞는 카드입니다.', rev: '계획 없는 착수는 재작업으로 돌아옵니다.' },
        human: { up: '처음 보는 사람이 오늘의 귀인이 될 수 있어요.', rev: '가벼운 말이 관계의 신뢰를 깎습니다.' }
      }
    },
    {
      n: 1, name: '마법사', en: 'The Magician', emoji: '🎩', weight: 1,
      kw: ['실행력', '설득', '재능'],
      up: {
        line: '필요한 도구는 이미 손에 있습니다. 말과 행동을 일치시키면 그대로 현실이 됩니다.',
        advice: '오늘 할 일을 소리 내어 한 문장으로 선언해 보세요.'
      },
      rev: {
        line: '재주는 있는데 방향이 흩어져 있습니다. 여러 개를 동시에 벌이면 하나도 남지 않습니다.',
        advice: '가장 중요한 하나만 남기고 나머지는 목록에 적어 두세요.'
      },
      topics: {
        love: { up: '표현력이 빛나는 날, 말 한마디가 마음을 엽니다.', rev: '말재주가 앞서면 진심이 가려집니다.' },
        money: { up: '아이디어를 돈으로 바꾸기 좋은 타이밍입니다.', rev: '솔깃한 제안일수록 조건을 확인하세요.' },
        work: { up: '설득·발표·협상에 강한 날입니다.', rev: '능력 과시가 역효과를 냅니다.' },
        human: { up: '먼저 다가가면 관계가 빠르게 열립니다.', rev: '약속을 가볍게 잡으면 신뢰를 잃어요.' }
      }
    },
    {
      n: 2, name: '여사제', en: 'The High Priestess', emoji: '🔮', weight: 0,
      kw: ['직감', '관찰', '비밀'],
      up: {
        line: '아직 말하지 않는 것이 답입니다. 직감이 이미 알고 있으니 조용히 확인하세요.',
        advice: '결정을 미루고 하루만 관찰하세요. 정보가 더 모입니다.'
      },
      rev: {
        line: '혼자 상상만 키우고 있습니다. 확인하지 않은 추측이 판단을 흐립니다.',
        advice: '궁금한 건 직접 물어보세요. 상상보다 사실이 편합니다.'
      },
      topics: {
        love: { up: '상대의 말보다 분위기를 읽어 보세요. 답이 거기 있습니다.', rev: '속마음을 감추기만 하면 오해가 쌓입니다.' },
        money: { up: '섣부른 지출보다 확인이 이득인 날입니다.', rev: '숨은 조건·수수료를 놓치기 쉬워요.' },
        work: { up: '자료 조사·분석이 성과로 이어집니다.', rev: '정보를 혼자 쥐고 있으면 일이 막힙니다.' },
        human: { up: '말 없는 배려가 관계를 깊게 합니다.', rev: '오해를 풀 타이밍을 놓치고 있어요.' }
      }
    },
    {
      n: 3, name: '여황제', en: 'The Empress', emoji: '🌷', weight: 2,
      kw: ['풍요', '돌봄', '결실'],
      up: {
        line: '풍요와 돌봄의 기운입니다. 키우던 일이 결실을 맺고 사람도 마음도 채워집니다.',
        advice: '오늘은 나를 먼저 돌보세요. 그 여유가 관계와 일에 그대로 갑니다.'
      },
      rev: {
        line: '돌보느라 정작 내가 비어 있습니다. 과한 배려는 상대도 부담스럽게 합니다.',
        advice: '부탁을 하나 거절해 보세요. 그게 오늘의 자기 돌봄입니다.'
      },
      topics: {
        love: { up: '애정이 넘치는 날, 다정한 말이 잘 통합니다.', rev: '과한 집착은 사랑이 아니라 부담입니다.' },
        money: { up: '수입이 늘거나 씀씀이가 풍요로워집니다.', rev: '감정 소비가 지출로 이어집니다.' },
        work: { up: '창작·기획·육성 업무에 좋습니다.', rev: '일을 다 떠안으면 성과가 흐려집니다.' },
        human: { up: '누군가를 챙기는 자리가 복이 됩니다.', rev: '잘해주는 만큼 기대하면 서운해집니다.' }
      }
    },
    {
      n: 4, name: '황제', en: 'The Emperor', emoji: '🏛️', weight: 1,
      kw: ['질서', '책임', '기준'],
      up: {
        line: '질서와 책임의 카드입니다. 규칙을 세우면 일이 단단해집니다.',
        advice: '오늘 지킬 규칙 하나를 정하고 끝까지 지켜 보세요.'
      },
      rev: {
        line: '통제하려는 마음이 강해져 있습니다. 유연함이 빠지면 사람이 떠납니다.',
        advice: '내 방식이 아니어도 괜찮은 부분을 하나 허용하세요.'
      },
      topics: {
        love: { up: '관계를 공식화하거나 약속을 정하기 좋습니다.', rev: '고집이 대화를 막고 있어요.' },
        money: { up: '예산·계약·관리에 유리합니다.', rev: '융통성 없는 지출 계획이 발목을 잡아요.' },
        work: { up: '책임 있는 역할, 보고·결재가 잘 풀립니다.', rev: '지시만 하면 팀이 움직이지 않습니다.' },
        human: { up: '선을 지키는 사람이 신뢰를 얻습니다.', rev: '강압적인 태도는 반발만 부릅니다.' }
      }
    },
    {
      n: 5, name: '교황', en: 'The Hierophant', emoji: '📜', weight: 0,
      kw: ['조언', '전통', '배움'],
      up: {
        line: '배움과 전통의 카드입니다. 조언을 구하거나 이미 검증된 방법을 따르세요.',
        advice: '혼자 결론 내지 말고 경험자 한 사람에게 물어보세요.'
      },
      rev: {
        line: '틀에 갇혀 있습니다. 남들이 정한 정답이 내 답은 아닐 수 있어요.',
        advice: '규칙을 따르되, 왜 그런지는 한 번 따져 보세요.'
      },
      topics: {
        love: { up: '소개팅이나 공식적인 만남에 좋습니다.', rev: '주변 눈치가 관계를 흔듭니다.' },
        money: { up: '안정적인 저축·적립식이 유리합니다.', rev: '검증되지 않은 정보에 흔들리지 마세요.' },
        work: { up: '자격·교육·멘토링이 도움이 됩니다.', rev: '관행대로만 하면 대안을 놓칩니다.' },
        human: { up: '윗사람·선배의 조언이 힘이 됩니다.', rev: '가르치려는 태도가 관계를 멀게 해요.' }
      }
    },
    {
      n: 6, name: '연인', en: 'The Lovers', emoji: '💞', weight: 2,
      kw: ['선택', '관계', '끌림'],
      up: {
        line: '선택의 카드이자 관계의 카드입니다. 마음이 가는 쪽을 고르세요.',
        advice: '오늘 결정해야 할 것 하나를, 머리보다 마음 기준으로 골라 보세요.'
      },
      rev: {
        line: '엇갈리고 있습니다. 서로 다른 것을 원하는데 말하지 않고 있어요.',
        advice: '원하는 것을 한 문장으로 정확히 말해 보세요.'
      },
      topics: {
        love: { up: '관계가 깊어지는 시기, 고백이나 화해에 좋습니다.', rev: '유혹이나 흔들림, 삼각관계를 조심하세요.' },
        money: { up: '공동 지출·계약에서 이득이 있습니다.', rev: '감정적인 지출 결정을 피하세요.' },
        work: { up: '협업·파트너십이 잘 맞습니다.', rev: '역할이 겹치면 마찰이 생깁니다.' },
        human: { up: '한 사람과의 관계가 크게 좋아집니다.', rev: '우유부단하면 양쪽 다 잃습니다.' }
      }
    },
    {
      n: 7, name: '전차', en: 'The Chariot', emoji: '🏇', weight: 1,
      kw: ['전진', '의지', '돌파'],
      up: {
        line: '전진의 카드입니다. 목표를 정하고 밀고 나가면 뚫립니다.',
        advice: '오늘 미뤄둔 연락·제안을 하나 보내세요. 속도가 답입니다.'
      },
      rev: {
        line: '방향 없이 달리고 있습니다. 속도보다 어디로 가는지가 먼저입니다.',
        advice: '목표를 한 줄로 적어 보세요. 못 쓰면 아직 시작하지 마세요.'
      },
      topics: {
        love: { up: '적극적인 표현이 통합니다.', rev: '밀어붙이면 상대가 물러납니다.' },
        money: { up: '활동량이 수입으로 이어집니다.', rev: '무리한 확장은 손실을 키워요.' },
        work: { up: '돌파구가 열립니다. 추진력이 무기입니다.', rev: '경쟁에만 집중하면 협력을 놓칩니다.' },
        human: { up: '리드하는 자리에서 인정받습니다.', rev: '앞서가려다 혼자 남을 수 있어요.' }
      }
    },
    {
      n: 8, name: '힘', en: 'Strength', emoji: '🦁', weight: 1,
      kw: ['인내', '용기', '포용'],
      up: {
        line: '부드러운 힘의 카드입니다. 화내지 않고 버티는 쪽이 결국 이깁니다.',
        advice: '오늘 화가 나는 순간에 한 번만 숨을 고르세요. 그게 가장 강한 대응입니다.'
      },
      rev: {
        line: '자신감이 흔들리고 있습니다. 무리하게 버티면 안에서 부서집니다.',
        advice: '약한 모습을 인정하세요. 도움을 요청하는 것이 회복의 시작입니다.'
      },
      topics: {
        love: { up: '인내가 관계를 지킵니다.', rev: '참기만 하면 결국 터집니다.' },
        money: { up: '꾸준함이 이득을 만듭니다.', rev: '버티기만 해서는 손실이 줄지 않아요.' },
        work: { up: '어려운 일을 끝까지 해내는 힘이 있습니다.', rev: '과로가 실수를 부릅니다.' },
        human: { up: '포용력이 사람을 모읍니다.', rev: '감정을 눌러두면 관계가 식습니다.' }
      }
    },
    {
      n: 9, name: '은둔자', en: 'The Hermit', emoji: '🕯️', weight: 0,
      kw: ['성찰', '거리두기', '정리'],
      up: {
        line: '혼자만의 시간이 답입니다. 잠깐 물러나 정리하면 길이 보입니다.',
        advice: '오늘 약속 하나를 비우고 혼자 정리하는 시간을 만드세요.'
      },
      rev: {
        line: '너무 오래 숨어 있습니다. 고립은 회복이 아니라 회피일 수 있어요.',
        advice: '한 사람에게만 연락해 보세요. 문을 완전히 닫지는 마세요.'
      },
      topics: {
        love: { up: '관계를 점검하는 시간이 필요합니다.', rev: '혼자 결론 내면 오해가 커집니다.' },
        money: { up: '지출을 점검하고 줄이기 좋습니다.', rev: '정보 없이 혼자 판단하면 손해예요.' },
        work: { up: '집중 작업·연구에 최적입니다.', rev: '혼자 다 하려다 일정이 밀립니다.' },
        human: { up: '조용한 사람의 조언이 정확합니다.', rev: '연락을 피하면 관계가 끊깁니다.' }
      }
    },
    {
      n: 10, name: '운명의 수레바퀴', en: 'Wheel of Fortune', emoji: '🎡', weight: 1,
      kw: ['전환', '타이밍', '반복'],
      up: {
        line: '흐름이 바뀌는 카드입니다. 막혀 있던 것이 예상 밖의 방향으로 풀립니다.',
        advice: '오늘 오는 기회는 크기보다 타이밍으로 판단하세요.'
      },
      rev: {
        line: '흐름을 거스르고 있습니다. 같은 방식으로 밀어도 결과가 안 나옵니다.',
        advice: '한 번 멈추고 무엇이 반복되는지 보세요. 바꿀 건 하나면 됩니다.'
      },
      topics: {
        love: { up: '인연이 예상치 못하게 이어집니다.', rev: '같은 갈등이 반복되고 있어요.' },
        money: { up: '예상 밖의 수입이나 기회가 옵니다.', rev: '한 번의 손실을 만회하려다 키웁니다.' },
        work: { up: '전환점이 옵니다. 흐름을 타세요.', rev: '때를 놓치면 같은 자리입니다.' },
        human: { up: '오래된 인연이 다시 연결됩니다.', rev: '반복되는 관계 패턴을 의심하세요.' }
      }
    },
    {
      n: 11, name: '정의', en: 'Justice', emoji: '⚖️', weight: 1,
      kw: ['균형', '판단', '책임'],
      up: {
        line: '균형과 판단의 카드입니다. 감정보다 사실로 판단하면 답이 나옵니다.',
        advice: '오늘 결정 하나는 조건을 종이에 적고 비교해 보세요.'
      },
      rev: {
        line: '한쪽으로 기울어 있습니다. 편애나 억울함이 판단을 흐립니다.',
        advice: '내가 유리한 쪽으로 해석하고 있지 않은지 점검하세요.'
      },
      topics: {
        love: { up: '대등한 관계, 조건을 맞추기 좋습니다.', rev: '한쪽만 맞추는 관계는 오래가기 어렵습니다.' },
        money: { up: '계약·정산·세금 처리에 유리합니다.', rev: '부당한 조건을 그냥 넘기지 마세요.' },
        work: { up: '평가·심사·공정한 판단이 잘 됩니다.', rev: '불공정에 대한 불만이 쌓여 있어요.' },
        human: { up: '선을 명확히 하면 관계가 편해집니다.', rev: '서운함을 말하지 않으면 계속 반복됩니다.' }
      }
    },
    {
      n: 12, name: '매달린 사람', en: 'The Hanged Man', emoji: '🙃', weight: 0,
      kw: ['멈춤', '관점 전환', '내려놓기'],
      up: {
        line: '멈춰서 보는 카드입니다. 지금은 움직이는 것보다 관점을 바꾸는 게 답입니다.',
        advice: '오늘 하루 일부러 아무것도 결정하지 마세요. 대신 왜 막혔는지 적어 보세요.'
      },
      rev: {
        line: '의미 없는 희생을 하고 있습니다. 버티는 것과 붙잡히는 것은 다릅니다.',
        advice: '놓아도 되는 것을 하나 정하고 내려놓으세요.'
      },
      topics: {
        love: { up: '잠시 거리를 두면 관계가 보입니다.', rev: '희생만 하는 관계는 오래 못 갑니다.' },
        money: { up: '지출을 멈추고 상황을 보는 게 이득입니다.', rev: '미루기만 하면 손실이 고정됩니다.' },
        work: { up: '관점을 바꾸면 막힌 일이 풀립니다.', rev: '결정을 미루는 사이 기회가 지나갑니다.' },
        human: { up: '한 발 물러서면 관계가 회복됩니다.', rev: '맞춰주기만 하면 무시당합니다.' }
      }
    },
    {
      n: 13, name: '죽음', en: 'Death', emoji: '🦋', weight: 0,
      kw: ['마무리', '재생', '전환'],
      up: {
        line: '끝과 재생의 카드입니다. 낡은 것을 정리해야 새 것이 들어옵니다.',
        advice: '오늘 안 쓰는 물건 하나, 안 맞는 습관 하나를 정리하세요.'
      },
      rev: {
        line: '끝내야 할 것을 붙잡고 있습니다. 변화를 미루면 같은 자리를 맴돕니다.',
        advice: '떠나보내야 할 것을 이름 붙여 보세요. 이름을 붙이면 놓을 수 있습니다.'
      },
      topics: {
        love: { up: '관계의 국면이 바뀝니다. 정리 후 새로 시작합니다.', rev: '끝난 관계에 미련이 남아 있습니다.' },
        money: { up: '고정 지출을 정리하면 숨통이 틉니다.', rev: '손실을 인정하지 못해 더 잃습니다.' },
        work: { up: '역할이 바뀌거나 새 국면이 시작됩니다.', rev: '바뀌지 않으려는 힘이 더 큰 상태입니다.' },
        human: { up: '멀어진 관계를 정리하면 마음이 가벼워집니다.', rev: '집착이 관계를 병들게 합니다.' }
      }
    },
    {
      n: 14, name: '절제', en: 'Temperance', emoji: '🍶', weight: 1,
      kw: ['균형', '조율', '회복'],
      up: {
        line: '균형과 조율의 카드입니다. 섞고 맞추면 답이 나옵니다.',
        advice: '오늘은 극단 대신 중간을 고르세요. 양도 질도 조금씩이 답입니다.'
      },
      rev: {
        line: '과하거나 모자랍니다. 균형이 깨져 몸과 마음이 먼저 신호를 보냅니다.',
        advice: '하나만 줄여 보세요. 술, 야식, 새벽 폰 중 하나요.'
      },
      topics: {
        love: { up: '천천히 맞춰가는 관계가 잘 됩니다.', rev: '속도가 안 맞아 한쪽이 지칩니다.' },
        money: { up: '분산과 조율이 이득을 지킵니다.', rev: '과한 지출과 과한 절약 둘 다 문제입니다.' },
        work: { up: '협업 조율, 일정 배분에 좋습니다.', rev: '일과 휴식의 균형이 무너졌습니다.' },
        human: { up: '중재자 역할이 잘 맞습니다.', rev: '맞추기만 하면 속이 상합니다.' }
      }
    },
    {
      n: 15, name: '악마', en: 'The Devil', emoji: '😈', weight: -1,
      kw: ['유혹', '집착', '습관'],
      up: {
        line: '끌리지만 위험한 카드입니다. 편한 유혹이 오래 갈 답은 아닙니다.',
        advice: '오늘 하고 싶은 것 하나에 “왜”를 물어보세요. 답이 안 나오면 하지 마세요.'
      },
      rev: {
        line: '묶여 있던 것에서 풀려납니다. 끊으려던 습관·관계를 정리할 타이밍입니다.',
        advice: '오늘 한 번 거절해 보세요. 그게 해방의 시작입니다.'
      },
      topics: {
        love: { up: '강한 끌림이 있지만 집착으로 변하기 쉬워요.', rev: '의존적인 관계에서 벗어날 수 있습니다.' },
        money: { up: '쉬운 돈 제안을 조심하세요.', rev: '빚·구독·습관 지출을 끊기 좋습니다.' },
        work: { up: '성과 압박이 과해지는 날입니다.', rev: '과로·야근 패턴을 끊으세요.' },
        human: { up: '“이 정도는 괜찮다”는 유혹을 조심하세요.', rev: '이용하던 관계가 정리됩니다.' }
      }
    },
    {
      n: 16, name: '탑', en: 'The Tower', emoji: '⚡', weight: -1,
      kw: ['충격', '붕괴', '재건'],
      up: {
        line: '갑작스러운 변화의 카드입니다. 무너지는 것은 원래 무너져야 할 것이었습니다.',
        advice: '오늘 흔들려도 다시 세우면 됩니다. 감정보다 사실을 기록하세요.'
      },
      rev: {
        line: '큰 충격은 피했지만 균열은 남아 있습니다. 덮어두면 다음에 더 크게 옵니다.',
        advice: '불편한 부분을 작을 때 말하세요.'
      },
      topics: {
        love: { up: '쌓인 문제가 드러납니다. 솔직함이 유일한 길입니다.', rev: '갈등을 미루면 더 크게 터집니다.' },
        money: { up: '예상 밖 지출에 대비하세요.', rev: '위험을 알면서도 그대로 두고 있어요.' },
        work: { up: '조직·계획의 변화가 옵니다.', rev: '균열을 덮으면 재작업이 됩니다.' },
        human: { up: '관계의 진실이 드러납니다.', rev: '괜찮은 척하면 더 멀어집니다.' }
      }
    },
    {
      n: 17, name: '별', en: 'The Star', emoji: '⭐', weight: 2,
      kw: ['희망', '회복', '방향'],
      up: {
        line: '희망과 회복의 카드입니다. 조용히 노력한 것이 빛을 봅니다.',
        advice: '오늘 작은 소망 하나를 구체적으로 적어 보세요. 방향이 생깁니다.'
      },
      rev: {
        line: '기대가 흐려져 있습니다. 남의 기준을 내 꿈으로 착각하고 있지 않은지 보세요.',
        advice: '내가 원하는 것을 남이 뭐라 하든 한 번 적어 보세요.'
      },
      topics: {
        love: { up: '진심이 통하고 관계가 회복됩니다.', rev: '이상만 좇으면 현실이 흔들립니다.' },
        money: { up: '길게 보면 좋은 흐름입니다.', rev: '막연한 기대는 계획이 아닙니다.' },
        work: { up: '방향이 맞습니다. 계속 가세요.', rev: '비전만 있고 실행이 없습니다.' },
        human: { up: '따뜻한 관계가 힘이 됩니다.', rev: '기대를 낮추면 서운함이 줄어요.' }
      }
    },
    {
      n: 18, name: '달', en: 'The Moon', emoji: '🌙', weight: 0,
      kw: ['불확실', '직감', '안개'],
      up: {
        line: '불확실함의 카드입니다. 지금 보이는 게 전부가 아닙니다.',
        advice: '오늘은 확인되지 않은 것에 결정하지 마세요. 하루만 더 지켜보세요.'
      },
      rev: {
        line: '안개가 걷히고 있습니다. 헷갈리던 것이 서서히 분명해집니다.',
        advice: '그동안 느낀 직감을 적어 두세요. 곧 맞아떨어집니다.'
      },
      topics: {
        love: { up: '속마음이 잘 안 보입니다. 추측보다 확인이 필요해요.', rev: '오해가 풀릴 실마리가 보입니다.' },
        money: { up: '불명확한 조건을 조심하세요.', rev: '숨은 비용을 이제 발견합니다.' },
        work: { up: '정보가 부족합니다. 확인 후 진행하세요.', rev: '흐리던 일이 정리됩니다.' },
        human: { up: '말하지 않은 감정이 문제입니다.', rev: '오해를 풀 타이밍입니다.' }
      }
    },
    {
      n: 19, name: '태양', en: 'The Sun', emoji: '☀️', weight: 2,
      kw: ['성공', '기쁨', '드러남'],
      up: {
        line: '가장 밝은 카드입니다. 숨기지 말고 드러내면 그대로 풀립니다.',
        advice: '오늘 잘한 것을 스스로에게 인정해 주세요. 자신감이 성과를 부릅니다.'
      },
      rev: {
        line: '빛이 조금 가려져 있습니다. 과한 자신감이나 체력 저하를 조심하세요.',
        advice: '속도를 조금 줄이고 몸을 먼저 챙기세요.'
      },
      topics: {
        love: { up: '관계가 밝아지고 공개해도 좋은 시기입니다.', rev: '자만하면 상대 마음을 놓칩니다.' },
        money: { up: '성과·보너스·좋은 소식이 있습니다.', rev: '과신한 투자는 금물입니다.' },
        work: { up: '인정받고 성과가 드러납니다.', rev: '성과 자랑이 독이 될 수 있어요.' },
        human: { up: '밝은 에너지가 사람을 끕니다.', rev: '과한 텐션은 부담이 됩니다.' }
      }
    },
    {
      n: 20, name: '심판', en: 'Judgement', emoji: '📯', weight: 1,
      kw: ['부활', '재도전', '결산'],
      up: {
        line: '되살아나는 카드입니다. 지난 일이 마무리되고 새 국면이 열립니다.',
        advice: '오늘 미뤄둔 답장·연락 하나를 정리하세요. 끝내야 시작됩니다.'
      },
      rev: {
        line: '과거를 계속 되돌아보고 있습니다. 후회는 판단을 흐립니다.',
        advice: '같은 생각이 반복되면 그건 결론이 아니라 두려움입니다. 적고 넘기세요.'
      },
      topics: {
        love: { up: '재회·화해의 가능성이 있습니다.', rev: '과거 문제를 다시 꺼내면 반복됩니다.' },
        money: { up: '묶인 돈이 풀리거나 정산됩니다.', rev: '지난 지출을 계속 곱씹지 마세요.' },
        work: { up: '재도전·재평가에 좋습니다.', rev: '지난 실패를 이유로 멈춰 있습니다.' },
        human: { up: '오래된 인연과 다시 이어집니다.', rev: '과거 감정으로 현재를 판단하지 마세요.' }
      }
    },
    {
      n: 21, name: '세계', en: 'The World', emoji: '🌍', weight: 2,
      kw: ['완성', '결실', '다음 단계'],
      up: {
        line: '완성의 카드입니다. 하나의 주기가 끝나고 다음 단계로 넘어갑니다.',
        advice: '오늘 끝낼 수 있는 일 하나를 완전히 끝내세요. 마무리가 다음을 부릅니다.'
      },
      rev: {
        line: '거의 다 왔는데 마지막이 남았습니다. 마무리가 없으면 성과도 없습니다.',
        advice: '마지막 10%를 오늘 처리하세요. 그게 전부를 바꿉니다.'
      },
      topics: {
        love: { up: '관계가 결실을 맺습니다. 장기적인 약속에 좋습니다.', rev: '마지막 고비를 넘기면 완성됩니다.' },
        money: { up: '큰 목표 달성, 정산이 잘 됩니다.', rev: '마무리 비용을 계산에 넣으세요.' },
        work: { up: '프로젝트 완성, 이직·졸업에 좋습니다.', rev: '마감 직전 방심을 조심하세요.' },
        human: { up: '관계가 안정되고 오래갑니다.', rev: '마지막 인사가 관계의 인상을 바꿉니다.' }
      }
    }
  ];

  var VERDICT = {
    great: {
      label: '아주 좋은 흐름',
      line: '카드들이 앞을 봐주고 있습니다. 미루던 결정을 지금 해도 좋습니다.'
    },
    good: {
      label: '좋은 흐름',
      line: '전체적으로 순조롭습니다. 한 가지만 정리하면 더 편해집니다.'
    },
    mixed: {
      label: '엇갈린 흐름',
      line: '좋은 카드와 주의 카드가 섞여 있습니다. 서두르지 말고 확인부터 하세요.'
    },
    caution: {
      label: '정비가 필요한 흐름',
      line: '지금은 밀어붙이기보다 멈추고 정리할 때입니다. 억지로 결정하면 손실이 커집니다.'
    }
  };

  var TOPIC_CLOSE = {
    love: '연애·재회에서는 “상대를 바꾸려는 마음”을 내려놓는 순간이 답이 됩니다.',
    money: '재물에서는 새는 곳을 막는 것이 버는 것보다 빠릅니다.',
    work: '이직·진로에서는 조건표를 만들어 비교하면 답이 보입니다.',
    human: '대인·관계에서는 한 사람에게만 집중하면 나머지가 정리됩니다.',
    today: '오늘 하루는 거창한 결심보다 하나를 끝내는 것으로 충분합니다.'
  };

  /* ---------------- 뽑기 ---------------- */
  function shuffled() {
    var a = MAJORS.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function shuffleAll() {
    return shuffled().map(function (c) { return { card: c, reversed: Math.random() < 0.38 }; });
  }
  function draw(count) {
    var deck = shuffled().slice(0, Math.max(1, Math.min(3, count || 1)));
    return deck.map(function (c) {
      return { card: c, reversed: Math.random() < 0.38 };
    });
  }
  function romanOf(n) { return ROMAN[n] || String(n); }
  function topicOf(v) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].v === v) return TOPICS[i];
    return TOPICS[4];
  }
  function spreadOf(v) {
    for (var i = 0; i < SPREADS.length; i++) if (SPREADS[i].v === String(v)) return SPREADS[i];
    return SPREADS[0];
  }
  function positionLabel(spread, idx) {
    if (spread.count === 1) return '오늘의 카드';
    return ['과거', '현재', '미래'][idx] || ('카드 ' + (idx + 1));
  }
  function topicLine(card, topic, reversed) {
    if (topic === 'today') return reversed ? card.rev.line : card.up.line;
    var t = card.topics[topic];
    if (!t) return reversed ? card.rev.line : card.up.line;
    return reversed ? t.rev : t.up;
  }

  /* ---------------- 리딩 ---------------- */
  function buildReading(input) {
    var topic =  topicOf(input.topic).v;
    var spread = spreadOf(input.spread);
    var picked = input.cards && input.cards.length ? input.cards : draw(spread.count);

    var cards = [], sum = 0, upright = 0, i;
    for (i = 0; i < picked.length; i++) {
      var c = picked[i].card, rev = !!picked[i].reversed;
      var side = rev ? c.rev : c.up;
      var w = rev ? -c.weight : c.weight;
      sum += w;
      if (!rev) upright++;
      cards.push({
        pos: positionLabel(spread, i),
        n: c.n, roman: romanOf(c.n), name: c.name, en: c.en, emoji: c.emoji, weight: c.weight,
        kw: c.kw, reversed: rev,
        line: side.line,
        advice: side.advice,
        topicLine: topicLine(c, topic, rev)
      });
    }

    var verdict;
    if (cards.length === 1) {
      var only = cards[0];
      if (!only.reversed && only.weight >= 2) verdict = VERDICT.great;
      else if (!only.reversed) verdict = VERDICT.good;
      else if (only.weight >= 0) verdict = VERDICT.mixed;
      else verdict = VERDICT.caution;
    } else {
      var ratio = sum / (cards.length * 2);
      if (ratio >= 0.6) verdict = VERDICT.great;
      else if (ratio >= 0.15) verdict = VERDICT.good;
      else if (ratio > -0.45) verdict = VERDICT.mixed;
      else verdict = VERDICT.caution;
    }

    var flow;
    if (cards.length === 1) {
      flow = cards[0].reversed
        ? '역방향으로 나왔습니다. 같은 방향으로 더 밀기보다 한 번 돌아보라는 신호예요.'
        : '정방향으로 나왔습니다. 지금 향하는 방향이 맞으니 그대로 밀고 나가세요.';
    } else if (upright === cards.length) {
      flow = '세 장 모두 정방향입니다. 과거의 경험이 지금의 선택으로 이어지고, 그대로 미래가 열립니다.';
    } else if (upright === 0) {
      flow = '세 장 모두 역방향입니다. 흐름이 막혀 있으니 정비 없이 밀면 같은 자리를 반복합니다.';
    } else {
      flow = '정방향 ' + upright + '장, 역방향 ' + (cards.length - upright) + '장입니다. 흐름이 엇갈리니 순서를 정하는 게 먼저입니다.';
    }

    var conclusion = verdict.line + ' ' + (TOPIC_CLOSE[topic] || '');

    var focus = cards[0];
    if (cards.length === 3) {
      for (i = 0; i < cards.length; i++) if (cards[i].pos === '현재') focus = cards[i];
    }

    var headline = (input.question || '').trim() ||
      (topic === 'today' ? '오늘의 한 장' : topicOf(topic).label + ' 리딩');

    var summary = cards.length === 1
      ? '[' + cards[0].name + (cards[0].reversed ? ' 역방향' : ' 정방향') + '] ' + cards[0].topicLine
      : '[' + cards.map(function (x) { return x.pos + ' ' + x.name + (x.reversed ? '역' : '정'); }).join(' · ') + '] ' + verdict.label;

    var plain = ['🃏 ' + headline + ' · ' + spread.label, ''];
    for (i = 0; i < cards.length; i++) {
      plain.push('[' + cards[i].pos + '] ' + cards[i].roman + '. ' + cards[i].name + ' (' + (cards[i].reversed ? '역방향' : '정방향') + ')');
      plain.push('  키워드: ' + cards[i].kw.join(' · '));
      plain.push('  ' + cards[i].line);
      plain.push('  → ' + cards[i].advice);
      plain.push('');
    }
    plain.push('종합: ' + verdict.label);
    plain.push(conclusion);
    plain.push(flow);
    plain.push('');
    plain.push('재미로 보는 타로입니다.');

    return {
      input: {
        topic: topic, topicLabel: topicOf(topic).label,
        spread: spread.v, spreadLabel: spread.label,
        question: (input.question || '').trim()
      },
      headline: headline,
      cards: cards,
      verdict: verdict,
      flow: flow,
      conclusion: conclusion,
      focus: focus,
      summary: summary,
      plain: plain.join('\n')
    };
  }

  /* ---------------- SNS 문구 ---------------- */
  function promo(r, brand, link) {
    var t = topicOf(r.input.topic);
    var nm = '';
    var linkLine = link || '프로필 링크';
    var brandLine = brand || '타로 자판기';
    var cardLines = r.cards.map(function (c) {
      return c.pos + ' · ' + c.roman + '. ' + c.name + (c.reversed ? ' (역)' : ' (정)') + ' — ' + c.topicLine;
    }).join('\n');

    var sns = [
      '🃏 ' + r.headline,
      '',
      cardLines,
      '',
      '👉 ' + r.verdict.label + '. ' + r.conclusion.split('. ').slice(0, 1).join('. ') + '.',
      '',
      (link ? '전체 리딩 → ' + linkLine : '전체 리딩은 프로필 링크에서'),
      '',
      t.tags + ' #' + brandLine.replace(/\s+/g, '')
    ].join('\n');

    var reels = [
      '[0~3초 · 훅]',
      '화면: 카드 뒷면이 천천히 뒤집히는 장면',
      '내레이션: “' + r.input.topicLabel + ' 때문에 물어보셨죠. 카드가 이렇게 나왔습니다.”',
      '',
      '[3~9초 · 카드 공개]',
      '화면: ' + r.cards.map(function (c) { return c.pos + ' ' + c.emoji + ' ' + c.name; }).join(' → '),
      '내레이션: “' + r.cards.map(function (c) { return c.pos + '엔 ' + c.name + ', ' + (c.reversed ? '역방향' : '정방향'); }).join('. ') + '.”',
      '',
      '[9~16초 · 핵심 리딩]',
      '화면: 자막 “' + (r.focus ? r.focus.kw.join(' · ') : '') + '”',
      '내레이션: “' + (r.focus ? r.focus.topicLine : '') + '”',
      '',
      '[16~23초 · 결론]',
      '화면: “' + r.verdict.label + '” 큰 자막',
      '내레이션: “' + r.verdict.line + '”',
      '',
      '[23~30초 · CTA]',
      '화면: 버튼 “내 카드 뽑아보기” + ' + linkLine,
      '내레이션: “질문 하나만 떠올리고 카드 세 장 뽑아보세요. 아래 링크에서 무료로.”',
      '',
      '[고정 자막] ' + brandLine + ' · 재미로 보는 타로'
    ].join('\n');

    var cta = [
      '🃏 ' + r.input.topicLabel + ' 타로 리딩',
      '',
      '질문: ' + (r.input.question || r.input.topicLabel + ' — 지금 제일 궁금한 것'),
      r.cards.map(function (c) {
        return '· ' + c.pos + ': ' + c.name + (c.reversed ? ' (역방향)' : ' (정방향)') + ' — ' + c.kw.join(', ');
      }).join('\n'),
      '',
      '결론: ' + r.verdict.label,
      '',
      '더 깊은 리딩이 필요하면 아래로 문의 주세요.',
      '👉 ' + linkLine,
      (brandLine ? '· ' + brandLine : ''),
      '',
      (link ? '※ 광고 · 제휴 링크를 포함하며, 링크를 통한 신청 시 소정의 수수료를 받을 수 있습니다.' : '재미로 보는 타로입니다.')
    ].filter(function (x) { return x != null; }).join('\n');

    return [
      { key: 'sns', label: '📸 SNS 공유 문구', text: sns },
      { key: 'reels', label: '🎬 릴스·쇼츠 대본', text: reels },
      { key: 'cta', label: '🔗 제휴 CTA 문구', text: cta }
    ];
  }

  root.TarotCore = {
    MAJORS: MAJORS,
    TOPICS: TOPICS,
    SPREADS: SPREADS,
    VERDICT: VERDICT,
    draw: draw,
    shuffleAll: shuffleAll,
    buildReading: buildReading,
    promo: promo,
    romanOf: romanOf,
    topicOf: topicOf,
    spreadOf: spreadOf
  };
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
