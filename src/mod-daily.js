/* =====================================================================
   Module 12 · 🌅 일일 운세 자판기
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, DC = window.DailyCore;

  function bandColor(b) { return b === 'hi' ? '#6338F5' : (b === 'mid' ? '#9C82FF' : '#D9A24A'); }

  function meterRow(c) {
    return '<div class="dl-cat">' +
      '<div class="dl-cat-h"><span class="dl-cat-n">' + c.icon + ' ' + esc(c.label) + '</span>' +
      '<span class="dl-cat-s" style="color:' + bandColor(c.band) + '">' + c.score + '<small>점</small></span></div>' +
      '<div class="meter"><i style="width:' + c.score + '%;background:' + bandColor(c.band) + '"></i></div>' +
      '<p class="dl-line">' + esc(c.line) + '</p>' +
      '<p class="dl-act"><b>오늘 할 일</b> ' + esc(c.action) + '</p>' +
      '</div>';
  }

  function cardHtml(dr, brand, link) {
    return '<div class="dl-card" id="dl-card">' +
      '<div class="dl-card-in">' +
      '<div class="dl-card-top"><span>오늘의 운세</span><span>' + esc(dr.today.label) + '</span></div>' +
      '<div class="dl-card-main"><b>' + dr.total + '</b><small>점</small>' +
      '<div><span class="kw">' + esc(dr.keyword) + '</span><em>' + esc(dr.totalLabel) + '</em></div></div>' +
      '<div class="dl-card-grid">' +
      dr.cats.map(function (c) {
        return '<div><span>' + c.icon + ' ' + esc(c.label.replace('운', '')) + '</span><b>' + c.score + '</b></div>';
      }).join('') +
      '</div>' +
      '<div class="dl-card-row"><span>🍀 행운</span><b><i class="dot" style="background:' + dr.lucky.color.hex + '"></i>' +
      esc(dr.lucky.color.name) + ' · ' + esc(dr.lucky.numbers) + ' · ' + esc(dr.lucky.dir) + '</b></div>' +
      '<div class="dl-card-row"><span>⚠️ 피할 시간</span><b>' + esc(dr.lucky.avoid.label) + '</b></div>' +
      '<div class="dl-card-cta">' + (link ? esc(shortLink(link)) : '프로필 링크에서 오늘 운세 보기') + '</div>' +
      '<div class="dl-card-foot">재미로 보는 운세 · ' + esc(brand || '일일 운세 자판기') + '</div>' +
      '</div></div>';
  }
  function shortLink(u) {
    var s = String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    return s.length > 32 ? s.slice(0, 31) + '…' : s;
  }

  function readingHtml(dr, brand, link) {
    var t = dr.today, lk = dr.lucky;
    var html = '<div class="out">';

    html += '<div class="cardout"><div class="ch"><span class="t">🌅 ' + esc(t.label) + ' 총운</span>' +
      '<span class="m">' + esc(dr.input.who) + '</span></div>' +
      '<div class="cb" style="white-space:normal">' +
      '<div class="score"><span class="num">' + dr.total + '<small>/100</small></span>' +
      '<span class="grade"><b style="color:var(--violet-d);font-size:13.5px">' + esc(dr.totalLabel) + ' · ' + esc(dr.keyword) + '</b><br>' +
      esc(dr.totalLine) + '</span></div>' +
      '<div class="chiprow" style="margin-top:12px">' +
      dr.cats.map(function (c) {
        return '<span class="tag">' + c.icon + ' ' + esc(c.label) + ' ' + c.score + '</span>';
      }).join('') +
      '</div>' +
      (dr.god ? '<p class="hint" style="margin-top:10px">오늘 일진 <b>' + esc(t.ganzhi) + '일</b> · 일간 <b>“' + esc(dr.god.dayStem) + '”</b>' +
        '과는 <b>' + esc(dr.god.name) + '</b> 관계 — ' + esc(dr.god.line) + '</p>' : '') +
      '</div></div>';

    html += '<div class="cardout"><div class="ch"><span class="t">📊 4대 운세</span><span class="m">' +
      esc(dr.input.tone === 'blunt' ? '직설 팩폭' : (dr.input.tone === 'hook' ? '후킹형' : '따뜻한 조언')) + '</span></div>' +
      '<div class="cb dl-cats">' + dr.cats.map(meterRow).join('') + '</div></div>';

    if (dr.focus) {
      html += '<div class="cardout"><div class="ch"><span class="t">🎯 오늘의 관심사 · ' + esc(dr.focus.label) + '</span></div>' +
        '<div class="cb" style="white-space:normal"><p class="dl-focus">' + esc(dr.focus.line) + '</p></div></div>';
    }

    html += '<div class="cardout"><div class="ch"><span class="t">🍀 오늘의 행운</span><span class="m">' + esc(t.label) + '</span></div>' +
      '<div class="cb" style="white-space:normal"><div class="dl-lucky">' +
      '<div class="dl-lk"><span>행운 컬러</span><b><i class="dot" style="background:' + lk.color.hex + '"></i>' + esc(lk.color.name) + '</b></div>' +
      '<div class="dl-lk"><span>행운 숫자</span><b>' + esc(lk.numbers) + '</b></div>' +
      '<div class="dl-lk"><span>행운 방위</span><b>' + esc(lk.dir) + '</b></div>' +
      '<div class="dl-lk"><span>행운 아이템</span><b>' + esc(lk.item) + '</b></div>' +
      '<div class="dl-lk warn"><span>피할 시간</span><b>' + esc(lk.avoid.label) + '</b><em>' + esc(lk.avoid.why) + '</em></div>' +
      '</div></div></div>';

    html += '<div class="cardout"><div class="ch"><span class="t">🪪 한 줄 요약 카드</span><span class="m">SNS 공유용</span></div>' +
      '<div class="cb" style="white-space:normal;background:#FAFAFC">' + cardHtml(dr, brand, link) +
      '<div class="actions"><button class="btn btn-soft" type="button" id="dl-copy-sum">요약 복사</button>' +
      '<button class="btn btn-line" type="button" id="dl-copy-all">전체 풀이 복사</button></div></div></div>';

    html += '</div>';
    return html;
  }

  function postsHtml(posts) {
    return '<section class="panel" style="margin-top:14px"><h3>📣 홍보 문구 <span class="pill">복사해서 바로 올리기</span></h3>' +
      '<p class="psub">오늘 결과로 만든 스레드·릴스 대본·블로그·인스타 문구입니다. 제휴 링크를 넣으면 CTA에 그대로 들어갑니다.</p>' +
      posts.map(function (p, i) {
        return '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">' + esc(p.label) + '</span>' +
          '<span class="m">' + p.text.length + '자</span></div>' +
          '<div class="cb scroll">' + esc(p.text) + '</div>' +
          '<div style="padding:0 13px 12px"><button class="btn btn-sm btn-soft" type="button" data-post="' + i + '">복사</button></div></div>';
      }).join('') + '</section>';
  }

  App.register({
    id: 'daily', emoji: '🌅', name: '일일 운세 자판기', free: true, tag: '무료 · 매일',
    desc: '생년월일(또는 띠·별자리)로 오늘의 총운·4대 운세·행운 + 홍보 문구까지.',
    help: '생년월일이나 띠·별자리를 넣고 관심사와 톤을 고르면 오늘의 총운 점수, 재물·연애·직장·건강 4대 운세, 행운 컬러·숫자·방위·피할 시간대를 만들어 줍니다. 생년월일이 있으면 사주 엔진으로 오늘 일진(六十甲子)과의 십신 관계까지 반영하고, 같은 날 같은 사람에게는 항상 같은 결과가 나옵니다. 결과는 스레드·릴스·블로그·인스타 문구로 바로 복사할 수 있어요. 재미·콘텐츠용입니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent =
        '.dl-cats{display:flex;flex-direction:column;gap:14px}' +
        '.dl-cat-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px}' +
        '.dl-cat-n{font-size:12.5px;font-weight:800;color:#3A3A44}' +
        '.dl-cat-s{font-size:15px;font-weight:800;letter-spacing:-.03em}' +
        '.dl-cat-s small{font-size:10.5px;font-weight:700;color:var(--muted);margin-left:1px}' +
        '.dl-line{margin-top:7px;font-size:12.5px;line-height:1.7;color:#3A3A44;word-break:keep-all}' +
        '.dl-act{margin-top:4px;font-size:11.5px;color:#6D6D7A}' +
        '.dl-act b{color:var(--violet-d);font-weight:800;margin-right:4px}' +
        '.dl-focus{font-size:13px;line-height:1.75;color:#3A3A44;word-break:keep-all}' +
        '.dl-lucky{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
        '.dl-lk{border:1px solid var(--line);border-radius:11px;padding:9px 11px;background:#FCFCFE;min-width:0}' +
        '.dl-lk span{display:block;font-size:10.5px;font-weight:800;color:var(--muted)}' +
        '.dl-lk b{display:flex;align-items:center;gap:5px;margin-top:3px;font-size:13px;letter-spacing:-.02em}' +
        '.dl-lk em{display:block;margin-top:2px;font-size:10.5px;color:var(--muted);font-style:normal}' +
        '.dl-lk.warn{grid-column:1 / -1;background:#FFF9F0;border-color:#F4E4CB}' +
        '.dot{width:10px;height:10px;border-radius:50%;display:inline-block;border:1px solid rgba(0,0,0,.08);flex:none}' +
        '.dl-card{max-width:330px;margin:0 auto;border-radius:18px;padding:8px;background:linear-gradient(150deg,#EFE7FF,#FFF4E8 60%,#fff);border:1px solid #EAE1FF}' +
        '.dl-card-in{border-radius:13px;background:#fff;border:1px solid #F1ECFF;padding:15px 15px 13px}' +
        '.dl-card-top{display:flex;justify-content:space-between;font-size:10.5px;font-weight:800;color:#6338F5}' +
        '.dl-card-main{display:flex;align-items:baseline;gap:8px;margin-top:10px;flex-wrap:wrap}' +
        '.dl-card-main b{font-size:34px;font-weight:800;letter-spacing:-.05em;line-height:1;color:#17171B}' +
        '.dl-card-main small{font-size:11px;color:#9C9CA8;font-weight:800;margin-left:-4px}' +
        '.dl-card-main .kw{display:block;font-size:13px;font-weight:800;color:#4C24D6}' +
        '.dl-card-main em{display:block;font-style:normal;font-size:10.5px;color:#8A8A96;font-weight:700}' +
        '.dl-card-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:12px}' +
        '.dl-card-grid div{background:#FAF8FF;border:1px solid #F0EBFF;border-radius:9px;padding:7px 2px;text-align:center}' +
        '.dl-card-grid span{display:block;font-size:9px;color:#9C9CA8;font-weight:800}' +
        '.dl-card-grid b{display:block;margin-top:1px;font-size:14px;letter-spacing:-.02em}' +
        '.dl-card-row{display:flex;gap:8px;margin-top:7px;font-size:10.5px;color:#6D6D7A;font-weight:700;align-items:center}' +
        '.dl-card-row span{flex:none;width:62px}' +
        '.dl-card-row b{color:#2A2A33;display:flex;align-items:center;gap:4px;min-width:0;font-size:10.5px}' +
        '.dl-card-cta{margin-top:11px;padding:9px;border-radius:9px;background:#6338F5;color:#fff;text-align:center;font-size:11px;font-weight:800;word-break:break-all}' +
        '.dl-card-foot{margin-top:7px;text-align:center;font-size:9.5px;color:#9C9CA8}' +
        '@media (max-width:720px){.dl-lucky{grid-template-columns:1fr 1fr}.dl-card-main b{font-size:30px}}';
      document.head.appendChild(st);

      var toneChips = DC.TONES.map(function (t, i) {
        return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-tone="' + t.v + '" aria-pressed="' + (i === 0) + '">' + esc(t.label) + '</button>';
      }).join('');
      var interestChips = DC.INTERESTS.map(function (t, i) {
        return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-interest="' + t.v + '" aria-pressed="' + (i === 0) + '">' + esc(t.label) + '</button>';
      }).join('');
      var zodiacOpts = DC.ZODIAC.map(function (z) { return '<option value="' + z + '">' + z + '띠</option>'; }).join('');
      var signOpts = DC.SIGNS.map(function (s) { return '<option value="' + s.name + '">' + s.icon + ' ' + s.name + '</option>'; }).join('');

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🌅 내 정보 <span class="pill">오늘 기준</span></h3>' +
            '<div class="field"><label for="dl-name">이름 / 닉네임 <span class="muted small">(선택)</span></label>' +
              '<input id="dl-name" type="text" placeholder="예: 김카마" maxlength="20"></div>' +
            '<div class="field"><label>생일 입력 방식</label><div class="chiprow" style="margin-top:0" id="dl-modes">' +
              '<button class="chip on" type="button" data-mode="birth" aria-pressed="true">생년월일</button>' +
              '<button class="chip" type="button" data-mode="sign" aria-pressed="false">띠 · 별자리만</button></div></div>' +
            '<div id="dl-birth">' +
              '<div class="field"><label for="dl-date">생년월일 <span class="muted small">(양력)</span></label>' +
                '<input id="dl-date" type="date" min="1900-01-01" max="2100-12-31"></div>' +
            '</div>' +
            '<div id="dl-sign" hidden><div class="row2">' +
              '<div class="field"><label for="dl-zodiac">띠</label><select id="dl-zodiac">' + zodiacOpts + '</select></div>' +
              '<div class="field"><label for="dl-signname">별자리</label><select id="dl-signname">' + signOpts + '</select></div>' +
            '</div></div>' +
            '<div class="field"><label>성별 <span class="muted small">(선택)</span></label><div class="chiprow" style="margin-top:0" id="dl-gender">' +
              '<button class="chip on" type="button" data-gender="n" aria-pressed="true">선택 안 함</button>' +
              '<button class="chip" type="button" data-gender="m" aria-pressed="false">남성</button>' +
              '<button class="chip" type="button" data-gender="f" aria-pressed="false">여성</button></div></div>' +
            '<div class="field"><label>오늘의 관심사</label><div class="chiprow" style="margin-top:0" id="dl-interest">' + interestChips + '</div>' +
              '<p class="tip">고른 분야는 점수가 올라가고 결과에 집중 코멘트가 붙습니다.</p></div>' +
            '<div class="field"><label>결과 톤</label><div class="chiprow" style="margin-top:0" id="dl-tone">' + toneChips + '</div>' +
              '<p class="tip">따뜻한 조언 / 직설 팩폭 / 스레드·릴스 후킹형 중에서 고르세요. 문구가 달라집니다.</p></div>' +
            '<div class="field"><label for="dl-brand">채널 · 상담소 이름 <span class="muted small">(선택)</span></label>' +
              '<input id="dl-brand" type="text" placeholder="예: 김카마 운세" maxlength="30"></div>' +
            '<div class="field"><label for="dl-link">제휴 · 상담 링크 <span class="muted small">(선택)</span></label>' +
              '<input id="dl-link" type="url" placeholder="https://... (없으면 비워 두세요)">' +
              '<p class="tip">카드와 홍보 문구 CTA에 그대로 들어갑니다. 링크가 있으면 광고 표기가 자동으로 붙습니다.</p></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="dl-run">🌅 오늘의 운세 보기</button></div>' +
            '<div class="actions" style="margin-top:8px"><button class="btn btn-ghost btn-sm" type="button" id="dl-reset">입력 초기화</button>' +
              '<button class="btn btn-ghost btn-sm" type="button" id="dl-demo">예시로 채우기</button></div>' +
            '<p class="hint">같은 날 같은 사람에게는 항상 같은 결과가 나옵니다(생일 + 오늘 날짜 시드). 날이 바뀌면 결과도 바뀝니다. 재미·콘텐츠용이에요.</p>' +
          '</section></div>' +
          '<div class="stack"><div id="dl-out"><section class="panel"><h3>🌅 오늘의 운세</h3>' +
            '<div class="empty"><b>아직 오늘 운세를 보지 않았어요</b>왼쪽에 생년월일(또는 띠·별자리)을 넣고 <b>오늘의 운세 보기</b>를 눌러주세요.</div>' +
          '</section></div></div>' +
        '</div>';

      var el = {
        name: H.$('#dl-name', root), date: H.$('#dl-date', root),
        zodiac: H.$('#dl-zodiac', root), signname: H.$('#dl-signname', root),
        brand: H.$('#dl-brand', root), link: H.$('#dl-link', root),
        birth: H.$('#dl-birth', root), sign: H.$('#dl-sign', root),
        out: H.$('#dl-out', root)
      };
      var state = { mode: 'birth', gender: 'n', interest: 'all', tone: 'warm', result: null, posts: [] };

      function chipGroup(sel, attr, key) {
        H.$$('[' + attr + ']', root).forEach(function (b) {
          b.addEventListener('click', function () {
            state[key] = b.getAttribute(attr);
            H.$$('[' + attr + ']', root).forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
            b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
            if (key === 'mode') {
              el.birth.hidden = state.mode !== 'birth';
              el.sign.hidden = state.mode !== 'sign';
            }
          });
        });
      }
      chipGroup('#dl-modes', 'data-mode', 'mode');
      chipGroup('#dl-gender', 'data-gender', 'gender');
      chipGroup('#dl-interest', 'data-interest', 'interest');
      chipGroup('#dl-tone', 'data-tone', 'tone');

      var saved = S.get('daily.last', null);
      if (saved) {
        if (saved.name) el.name.value = saved.name;
        if (saved.date) el.date.value = saved.date;
        if (saved.brand) el.brand.value = saved.brand;
        if (saved.link) el.link.value = saved.link;
        if (saved.mode) state.mode = saved.mode;
        if (saved.gender) state.gender = saved.gender;
        if (saved.interest) state.interest = saved.interest;
        if (saved.tone) state.tone = saved.tone;
        if (saved.zodiac) el.zodiac.value = saved.zodiac;
        if (saved.signname) el.signname.value = saved.signname;
        [['#dl-modes', 'data-mode', 'mode'], ['#dl-gender', 'data-gender', 'gender'],
          ['#dl-interest', 'data-interest', 'interest'], ['#dl-tone', 'data-tone', 'tone']].forEach(function (g) {
          var cur = state[g[2]];
          H.$$('[' + g[1] + ']', root).forEach(function (x) {
            var on = x.getAttribute(g[1]) === cur;
            x.classList.toggle('on', on);
            x.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        });
        el.birth.hidden = state.mode !== 'birth';
        el.sign.hidden = state.mode !== 'sign';
      }

      H.$('#dl-demo', root).addEventListener('click', function () {
        el.date.value = '1989-02-09';
        el.name.value = el.name.value || '김카마';
        App.toast('예시 정보를 채웠어요. 오늘의 운세 보기를 눌러보세요.');
      });

      H.$('#dl-reset', root).addEventListener('click', function () {
        el.name.value = ''; el.date.value = ''; el.brand.value = ''; el.link.value = '';
        state.result = null; state.posts = [];
        S.del('daily.last');
        el.out.innerHTML = '<section class="panel"><h3>🌅 오늘의 운세</h3><div class="empty"><b>비웠어요</b>생일을 다시 넣고 오늘의 운세 보기를 눌러주세요.</div></section>';
      });

      function paint(dr) {
        state.result = dr;
        var brand = el.brand.value.trim();
        var link = String(el.link.value || '').trim();
        state.posts = DC.promo(dr, brand, link);
        el.out.innerHTML = '<section class="panel"><h3>🌅 오늘의 운세 결과 <span class="pill">' + esc(dr.today.label) + '</span></h3>' +
          '<p class="psub">' + esc(dr.summary) + '</p>' +
          '<div style="margin-top:12px">' + readingHtml(dr, brand, link) + '</div></section>' +
          postsHtml(state.posts);

        H.$('#dl-copy-sum', el.out).addEventListener('click', function () { App.copy(dr.summary, this, '한 줄 요약을 복사했어요.'); });
        H.$('#dl-copy-all', el.out).addEventListener('click', function () { App.copy(dr.plain, this, '오늘 운세 전체를 복사했어요.'); });
        H.$$('[data-post]', el.out).forEach(function (b) {
          b.addEventListener('click', function () {
            var i = +b.getAttribute('data-post');
            App.copy(state.posts[i].text, b, '홍보 문구를 복사했어요. 그대로 붙여넣으세요!');
          });
        });
        window.scrollTo({ top: 0, behavior: 'auto' });
      }

      function run() {
        var input = {
          name: el.name.value, gender: state.gender, interest: state.interest, tone: state.tone
        };
        if (state.mode === 'birth') {
          var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(el.date.value);
          if (!m) { App.toast('생년월일을 먼저 선택해 주세요.'); el.date.focus(); return; }
          input.y = +m[1]; input.m = +m[2]; input.d = +m[3];
        } else {
          input.zodiac = el.zodiac.value;
          input.sign = el.signname.value;
        }
        var dr = DC.buildDaily(input, new Date());
        S.set('daily.last', {
          name: el.name.value, date: el.date.value, brand: el.brand.value, link: el.link.value,
          mode: state.mode, gender: state.gender, interest: state.interest, tone: state.tone,
          zodiac: el.zodiac.value, signname: el.signname.value
        });
        paint(dr);
        App.toast('오늘의 운세를 뽑았어요! 총운 ' + dr.total + '점');
      }

      H.$('#dl-run', root).addEventListener('click', run);
    }
  });
})();
