/* =====================================================================
   Module 8 · 🔍 사이트 분석하기 (상세페이지 읽고 분석 · 보관함)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, A = App.ads;

  var state = { view: 'list', q: '', product: null, shots: [], busy: false };

  function shotsHtml() {
    if (!state.shots.length) return '';
    return '<div class="creatives" style="margin-top:10px;grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">' +
      state.shots.map(function (s, i) {
        return '<div class="creative"><img src="' + s + '" alt="캡처 ' + (i + 1) + '">' +
          '<div class="cf"><span>' + (i + 1) + '장</span><button class="btn btn-sm btn-danger" type="button" data-shotdel="' + i + '">빼기</button></div></div>';
      }).join('') + '</div>';
  }

  function listView(root) {
    var list = A.products.list();
    var q = state.q.trim().toLowerCase();
    var shown = list.filter(function (p) {
      if (!q) return true;
      return (p.title + ' ' + p.domain + ' ' + p.category + ' ' + (p.keywords || []).join(' ')).toLowerCase().indexOf(q) !== -1;
    });

    root.innerHTML =
      '<div class="panel">' +
        '<div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap">' +
          '<div style="min-width:0"><h3>📚 사이트 분석 보관함 <span class="pill">' + list.length + '</span></h3>' +
          '<p class="psub">나만 볼 수 있는 상품 정보예요. 한 번 분석해 두면 당근·인스타·컨닝페이퍼·카페 자판기가 그대로 가져다 씁니다.</p></div>' +
          '<button class="btn btn-primary" type="button" id="an-new" style="margin-left:auto">＋ 새 사이트 분석</button>' +
        '</div>' +
        '<div class="row2" style="margin-top:14px;grid-template-columns:1fr auto;align-items:end">' +
          '<div class="field" style="margin-top:0"><input id="an-q" type="text" placeholder="🔍 이름으로 찾기 (상품명 · 도메인 · 키워드)" value="' + esc(state.q) + '"></div>' +
          '<button class="btn btn-line" type="button" id="an-search">검색</button>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        (listedHtml(shown)) +
      '</div>';

    H.$('#an-q', root).addEventListener('input', function () { state.q = this.value; });
    H.$('#an-q', root).addEventListener('keydown', function (e) { if (e.key === 'Enter') listView(root); });
    H.$('#an-search', root).addEventListener('click', function () { listView(root); });
    H.$('#an-new', root).addEventListener('click', function () { state.view = 'new'; newView(root); });
    var listBox = H.$('#an-list', root);
    if (listBox) listBox.addEventListener('click', function (e) {
      var it = e.target.closest('[data-pid]');
      if (!it) return;
      var p = A.products.get(it.getAttribute('data-pid'));
      if (p) { state.product = p; state.view = 'detail'; detailView(root); }
    });
  }

  function listedHtml(shown) {
    if (!shown.length) {
      return '<div class="empty"><b>아직 분석한 상품이 없어요</b>' +
        '오른쪽 위 <b>새 사이트 분석</b>을 눌러 상세페이지 주소를 넣어 보세요. 사이트가 막혀 있으면 본문 붙여넣기나 캡처 이미지로도 됩니다.</div>';
    }
    return '<div class="prodgrid" id="an-list">' + shown.map(function (p) {
      return '<button class="proditem" type="button" data-pid="' + esc(p.id) + '">' +
        '<span class="pi">' + esc(p.emoji || '🧩') + '</span>' +
        '<span class="pd">' + esc((p.savedAt || p.createdAt || '').slice(0, 10)) + (p.category ? ' · ' + esc(p.category) : '') + '</span>' +
        '<b>' + esc(p.title) + '</b>' +
        '<p>' + (p.domain ? esc(p.domain) + ' — ' : '') + esc(A.cut((p.benefits || [])[0] || (p.text || ''), 74)) + '</p>' +
        '</button>';
    }).join('') + '</div>';
  }

  function newView(root) {
    root.innerHTML =
      '<div class="notice" style="margin-bottom:14px">🔗 <div><strong>상세페이지 주소를 넣으면 자동으로 읽고 분석합니다.</strong><br>' +
      '브라우저에서 남의 사이트를 바로 읽을 수는 없어서, 공개 리더를 <b>3경로</b>로 차례로 시도합니다. 모두 막히면 <b>본문 붙여넣기</b>·<b>캡처 이미지</b>로 이어서 분석할 수 있어요.</div></div>' +
      '<div class="cols">' +
        '<div class="stack">' +
          '<section class="panel"><h3>1 · 상세페이지 주소</h3>' +
            '<div class="field"><label for="an-url">상세페이지 링크</label>' +
            '<input id="an-url" type="text" inputmode="url" placeholder="https://... 상품 상세페이지 주소를 넣어 주세요"></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="an-run">사이트 읽고 분석하기</button></div>' +
            '<p class="hint">스마트스토어·쿠팡처럼 로그인/차단이 강한 사이트는 읽기가 거절될 수 있어요. 그때는 아래 2번을 써 주세요.</p>' +
            '<div class="chiprow" id="an-samplebar" style="margin-top:12px">' +
              '<button class="chip" type="button" data-sample="tyre">예시로 먼저 해보기</button>' +
            '</div>' +
          '</section>' +
          '<section class="panel"><h3>2 · 사이트가 막혔을 때</h3>' +
            '<div class="field"><label for="an-text">페이지 본문 붙여넣기</label>' +
            '<textarea id="an-text" style="min-height:170px" placeholder="상세페이지에서 제목·혜택·가격·신청 방법·주의사항을 그대로 복사해 붙여넣으세요."></textarea></div>' +
            '<div class="field"><label>캡처 이미지 등록 <span class="muted small">(여러 장 가능)</span></label>' +
            '<div class="actions" style="margin-top:0"><label class="btn btn-line" for="an-shot" style="cursor:pointer">📷 캡처 올리기</label>' +
            '<input id="an-shot" type="file" accept="image/*" multiple hidden></div>' +
            '<p class="tip">캡처는 컨닝페이퍼·소재 이미지의 원본으로 쓰입니다. 글자는 위 본문 칸에 붙여넣어 주세요.</p>' +
            '<div id="an-shots">' + shotsHtml() + '</div></div>' +
            '<div class="actions"><button class="btn btn-soft btn-block" type="button" id="an-runtext">붙여넣은 본문으로 분석하기</button></div>' +
          '</section>' +
        '</div>' +
        '<div class="stack">' +
          '<section class="panel"><h3>3 · 분석 진행</h3><div id="an-progress" style="margin-top:12px">' +
            '<div class="empty"><b>아직 분석을 시작하지 않았어요</b>주소를 넣고 버튼을 누르면 진행 상황이 여기에 표시됩니다.</div>' +
          '</div><div id="an-err"></div></section>' +
          '<section class="panel"><h3>📋 분석에서 뽑는 것</h3>' +
            '<div class="kv"><b>신청 조건</b><span>무엇을·누가·얼마에·어떻게 신청하는지 + 출처 문장</span></div>' +
            '<div class="kv"><b>고객 3명</b><span>이 상품을 살 만한 사람을 구체적으로</span></div>' +
            '<div class="kv"><b>소구점 5개</b><span>광고에서 어떤 장점을 앞세울지</span></div>' +
            '<div class="kv"><b>주의 조건</b><span>쓰면 안 되는 표현, 빠뜨리면 안 되는 고지</span></div>' +
            '<p class="hint">뽑은 결과는 보관함에 저장되고, 다른 자판기가 <b>“전에 등록한 상품 불러오기”</b>로 가져갑니다.</p>' +
          '</section>' +
        '</div>' +
      '</div>';

    var el = {
      url: H.$('#an-url', root), text: H.$('#an-text', root), file: H.$('#an-shot', root),
      prog: H.$('#an-progress', root), err: H.$('#an-err', root)
    };

    H.$('#an-shot', root).addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []);
      files.slice(0, 8).forEach(function (f) {
        A.fileToDataUrl(f).then(function (d) {
          state.shots.push(d);
          H.$('#an-shots', root).innerHTML = shotsHtml();
        }, function (e) { App.toast(e.message); });
      });
      this.value = '';
    });
    H.$('#an-shots', root).addEventListener('click', function (e) {
      var b = e.target.closest('[data-shotdel]');
      if (!b) return;
      state.shots.splice(Number(b.getAttribute('data-shotdel')), 1);
      H.$('#an-shots', root).innerHTML = shotsHtml();
    });

    H.$('#an-samplebar', root).addEventListener('click', function (e) {
      var sm = e.target.closest('[data-sample]');
      if (!sm) return;
      el.text.value = SAMPLE_TEXT;
      el.url.value = 'https://example-mall.com/tire-rental';
      App.toast('예시 본문을 넣었어요. “붙여넣은 본문으로 분석하기”를 눌러보세요.');
    });

    function rowsFor(reading) {
      return reading ? [
        { label: '주소 확인' }, { label: '페이지 읽기' }, { label: '본문 정리' },
        { label: '신청 조건 추출' }, { label: '고객·소구점 만들기' }, { label: '보관함 저장' }
      ] : [
        { label: '본문 정리' }, { label: '신청 조건 추출' }, { label: '고객·소구점 만들기' }, { label: '보관함 저장' }
      ];
    }
    function mountProgress(rows) {
      el.prog.innerHTML = A.progressHtml('분석 중', rows);
      var box = H.$('.aiwork', el.prog);
      return {
        set: function (i, st, msg) {
          var r = H.$('[data-prow="' + i + '"]', box);
          if (!r) return;
          r.className = 'airow' + (st ? ' ' + st : '');
          if (msg) H.$('.pmsg', r).textContent = msg;
        },
        head: function (t) { H.$('.aih b', box).textContent = t; },
        done: function (t, warn) {
          var h = H.$('.aih', box);
          H.$('.spin', h).style.animation = 'none';
          H.$('.spin', h).style.borderColor = warn ? '#E0B04F' : '#15A05C';
          H.$('.spin', h).style.background = warn ? '#E0B04F' : '#15A05C';
          H.$('.spin', h).style.border = '0';
          h.style.color = warn ? '#B4551A' : '#158449';
          if (t) H.$('.aih b', box).textContent = t;
        }
      };
    }

    function finish(p) {
      var saved = A.products.save(p);
      state.product = saved;
      setTimeout(function () {
        state.view = 'detail';
        detailView(root);
        App.toast('분석을 마쳤어요. “' + A.cut(saved.title, 18) + '” 보관함에 저장했습니다.');
      }, 480);
    }

    function runText(text, rawTitle, url, via) {
      if (!text || text.replace(/\s/g, '').length < 80) { App.toast('본문이 너무 짧아요. 80자 이상 붙여넣어 주세요.'); el.text.focus(); return; }
      state.busy = true;
      var ui = mountProgress(rowsFor(false));
      ui.set(0, 'on', text.replace(/\s/g, '').length + '자');
      ui.set(1, 'run');
      var p = A.analyze({ text: text, url: url, via: via, rawTitle: rawTitle, id: state.reshootId || null });
      p.shots = state.shots.slice(0, 4);
      ui.set(1, 'on', '필드 6개');
      ui.set(2, 'run');
      setTimeout(function () {
        ui.set(2, 'on', '고객 3 · 소구점 ' + p.points.length);
        ui.set(3, 'run');
        setTimeout(function () {
          ui.set(3, 'on', '저장 완료');
          ui.done('분석 완료 · 보관함에 담았어요');
          state.busy = false;
          finish(p);
        }, 220);
      }, 260);
    }

    H.$('#an-runtext', root).addEventListener('click', function () {
      runText(el.text.value, '', A.normalizeUrl(el.url.value), state.shots.length ? '캡처 + 붙여넣기' : '본문 붙여넣기');
    });

    H.$('#an-run', root).addEventListener('click', function () {
      var url = A.normalizeUrl(el.url.value);
      if (!url) { App.toast('주소 형식이 아니에요. https://... 를 넣어 주세요.'); el.url.focus(); return; }
      if (state.busy) { App.toast('지금 분석 중이에요.'); return; }
      state.busy = true;
      var ui = mountProgress(rowsFor(true));
      ui.set(0, 'on', A.domainOf(url));
      ui.set(1, 'run', '여러 경로 시도');
      var tryLog = [];
      A.readPage(url, function (st) {
        if (st.phase === 'try') { ui.set(1, 'run', st.label + ' 시도'); }
        if (st.phase === 'ok') { ui.set(1, 'run', st.label + ' · ' + st.chars + '자'); }
        if (st.phase === 'fail') {
          tryLog.push(st.label + ' 실패: ' + st.msg);
          ui.set(1, 'run', st.label + ' 실패 → 다음 경로');
        }
      }).then(function (res) {
        ui.set(1, 'on', res.via + ' · ' + res.text.replace(/\s/g, '').length + '자');
        ui.set(2, 'run');
        var p = A.analyze({ text: res.text, url: url, via: res.via, rawTitle: res.title });
        p.shots = state.shots.slice(0, 4);
        p.rawTitle = res.title || '';
        ui.set(2, 'on', p.chars + '자 정리');
        ui.set(3, 'run');
        setTimeout(function () {
          ui.set(3, 'on', '필드 6 · 출처 문장 ' + p.fields.filter(function (f) { return f.source; }).length + '개');
          ui.set(4, 'run');
          setTimeout(function () {
            ui.set(4, 'on', '고객 3 · 소구점 ' + p.points.length);
            ui.set(5, 'run');
            setTimeout(function () {
              ui.set(5, 'on', '저장 완료');
              ui.done('분석 완료 · ' + res.via + '로 읽었어요');
              state.busy = false;
              finish(p);
            }, 220);
          }, 220);
        }, 200);
      }).catch(function (err) {
        state.busy = false;
        ui.set(1, 'bad', '모든 경로 실패');
        ui.set(2, 'bad', '중단');
        ui.done('읽지 못했어요', true);
        el.err.innerHTML = '<div class="notice" style="margin-top:12px;background:#FFF6F6;border-color:#FFD9D9;color:#8A2F2F">' +
          '<div><strong>이 페이지는 읽기가 막혔어요.</strong><br>' + esc(err.message) +
          (err.tries ? '<br><span class="small">' + err.tries.map(function (t) { return esc(t.label + ': ' + t.msg); }).join(' · ') + '</span>' : '') +
          '<br><br>① 아래 <b>본문 붙여넣기</b>에 페이지 글자를 그대로 붙여넣거나 ② <b>캡처 이미지</b>를 올린 뒤 다시 분석해 주세요. 두 방법 모두 같은 분석이 나옵니다.' +
          '</div></div>';
      });
    });
  }

  function detailView(root) {
    var p = state.product;
    if (!p) { state.view = 'list'; listView(root); return; }
    var cond = p.fields || [];

    root.innerHTML =
      '<div class="panel">' +
        '<div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">' +
          '<span class="mico" style="width:44px;height:44px;flex:none;display:grid;place-items:center;font-size:22px;background:var(--violet-soft);border-radius:12px">' + esc(p.emoji || '🧩') + '</span>' +
          '<div style="min-width:0;flex:1">' +
            '<h3 style="font-size:16px">' + esc(p.title) + '</h3>' +
            '<p class="psub">' + (p.domain ? esc(p.domain) + ' · ' : '') + esc(p.category) + ' · ' + esc((p.savedAt || p.createdAt || '').slice(0, 10)) + ' 수정' + (p.via ? ' · ' + esc(p.via) : '') + '</p>' +
            '<div class="chiprow" style="margin-top:9px">' +
              (p.price ? '<span class="tag ok">' + esc(p.price) + '</span>' : '') +
              (p.discount ? '<span class="tag">' + esc(p.discount) + '</span>' : '') +
              (p.keywords || []).slice(0, 5).map(function (k) { return '<span class="tag">#' + esc(k) + '</span>'; }).join('') +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
            '<button class="btn btn-sm btn-line" type="button" id="an-back">목록으로</button>' +
            '<button class="btn btn-sm btn-line" type="button" id="an-edit">내용 수정</button>' +
            '<button class="btn btn-sm btn-danger" type="button" id="an-del">삭제</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="panel"><h3>📌 상품의 신청 조건</h3>' +
        '<p class="psub">페이지와 가이드에서 읽은 내용이에요. 확정한 조건을 확인해 주세요. 직접 고치면 “직접 수정”으로 표시돼요.</p>' +
        '<div id="an-fields" style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:12px">' +
          cond.map(fieldHtml).join('') +
        '</div>' +
      '</div>' +

      '<div class="panel"><h3>👥 광고를 보여 줄 고객 3가지</h3>' +
        '<p class="psub">페르소나: 상품에 관심을 가질 만한 고객을 구체적으로 그린 모습이에요. ✨ 실사용 고객 조사 결과와는 다를 수 있어요.</p>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:11px;margin-top:12px">' +
          (p.personas || []).map(function (x, i) {
            return '<div class="pcard"><span class="pn">고객 ' + (i + 1) + '</span><b>' + esc(x.name) + '</b><p>' + esc(x.desc) + '</p></div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="panel"><h3>🎯 광고에서 강조할 점 5가지</h3>' +
        '<p class="psub">소구점: 고객의 마음을 움직이기 위해 어떤 장점을 앞세울지 정한 방향이에요. 실제 조건을 확인한 뒤 사용하세요.</p>' +
        '<div style="display:flex;flex-direction:column;gap:9px;margin-top:12px">' +
          (p.points || []).map(function (x, i) {
            return '<div class="ptcard"><div style="display:flex;align-items:center;gap:8px"><span class="num">' + (i + 1) + '</span>' +
              '<b style="margin:0;flex:1">' + esc(x.title) + '</b></div>' +
              '<p>' + esc(x.desc) + '</p>' +
              (x.persona ? '<div class="tags"><span class="tag">' + esc(x.persona) + '</span></div>' : '') + '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="panel"><h3>🚀 이 상품으로 바로 만들기</h3>' +
        '<p class="psub">상품 정보를 그대로 넘겨서 소재를 만듭니다.</p>' +
        '<div class="chiprow" id="an-send" style="margin-top:10px">' +
          '<button class="chip" type="button" data-send="danggeun">🥕 당근 광고</button>' +
          '<button class="chip" type="button" data-send="insta">📸 인스타 캐러셀</button>' +
          '<button class="chip" type="button" data-send="cheat">🥷 컨닝페이퍼</button>' +
          '<button class="chip" type="button" data-send="cafe">☕ 카페 글</button>' +
        '</div>' +
      '</div>' +

      (p.shots && p.shots.length ? '<div class="panel"><h3>🖼 등록한 캡처 <span class="pill">' + p.shots.length + '</span></h3>' +
        '<div class="creatives" style="margin-top:12px">' + p.shots.map(function (s, i) {
          return '<div class="creative"><img src="' + s + '" alt="캡처 ' + (i + 1) + '"><div class="cf"><span>' + (i + 1) + '장</span></div></div>';
        }).join('') + '</div></div>' : '') +

      '<div class="panel"><h3>📄 읽어 온 원문 <span class="pill">' + ((p.text || '').replace(/\s/g, '').length) + '자</span></h3>' +
        '<div class="cardout" style="margin-top:10px"><div class="cb scroll mono" style="font-size:11.5px;line-height:1.75">' + esc(A.cut(p.text || '', 4000)) + '</div></div>' +
        (p.url ? '<div class="actions"><a class="btn btn-ghost" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">원본 페이지 열기 ↗</a></div>' : '') +
      '</div>';

    H.$('#an-back', root).addEventListener('click', function () { state.view = 'list'; listView(root); });
    H.$('#an-del', root).addEventListener('click', function () {
      if (!window.confirm('“' + p.title + '” 분석을 보관함에서 지울까요?')) return;
      A.products.remove(p.id);
      state.view = 'list'; listView(root);
      App.toast('보관함에서 지웠어요.');
    });
    H.$('#an-edit', root).addEventListener('click', function () { editView(root); });
    H.$('#an-send', root).addEventListener('click', function (e) {
      var b = e.target.closest('[data-send]');
      if (!b) return;
      S.set('pick', p.id);
      App.toast('“' + A.cut(p.title, 18) + '”을 넘겼어요.');
      App.go(b.getAttribute('data-send'));
    });
  }

  function fieldHtml(f) {
    return '<div class="fieldcard">' +
      '<div class="fh"><b>' + esc(f.label) + '</b>' +
      (f.badge === '페이지에서 추출' ? '<span class="badge-green">페이지에서 추출</span>' : '<span class="badge-amber">확인 필요</span>') + '</div>' +
      '<div class="fv">' + esc(f.value || '확인 필요') + '</div>' +
      (f.source ? '<div class="fs"><b>출처 문장</b> — ' + esc(A.cut(f.source, 160)) + '</div>' : '') +
      '</div>';
  }

  function editView(root) {
    var p = state.product;
    var fields = p.fields || [];
    root.innerHTML =
      '<div class="panel"><h3>✏️ 내용 수정</h3>' +
        '<p class="psub">페이지에서 잘못 읽은 값만 고치면 됩니다. 고친 칸은 “직접 수정”으로 표시돼요.</p>' +
        '<div class="field"><label for="ed-title">상품 이름</label><input id="ed-title" type="text" value="' + esc(p.title) + '"></div>' +
        '<div class="row2"><div class="field"><label for="ed-price">가격</label><input id="ed-price" type="text" value="' + esc(p.price || '') + '" placeholder="예: 월 3,000원부터"></div>' +
        '<div class="field"><label for="ed-benefit">대표 혜택 (한 줄)</label><input id="ed-benefit" type="text" value="' + esc((p.benefits || [])[0] || '') + '"></div></div>' +
        fields.map(function (f, i) {
          return '<div class="field"><label>' + esc(f.label) + '</label><textarea data-fedit="' + i + '" style="min-height:70px">' + esc(f.value === '확인 필요' ? '' : f.value) + '</textarea></div>';
        }).join('') +
        '<div class="actions"><button class="btn btn-primary" type="button" id="ed-save">저장</button>' +
        '<button class="btn btn-ghost" type="button" id="ed-cancel">취소</button></div>' +
      '</div>';
    H.$('#ed-cancel', root).addEventListener('click', function () { detailView(root); });
    H.$('#ed-save', root).addEventListener('click', function () {
      p.title = H.$('#ed-title', root).value.trim() || p.title;
      p.price = H.$('#ed-price', root).value.trim();
      var b0 = H.$('#ed-benefit', root).value.trim();
      if (b0) p.benefits = [b0].concat((p.benefits || []).slice(1));
      Array.prototype.forEach.call(root.querySelectorAll('[data-fedit]'), function (t) {
        var i = Number(t.getAttribute('data-fedit'));
        var v = t.value.trim();
        if (fields[i] && v && v !== fields[i].value) {
          fields[i].value = v;
          fields[i].badge = '직접 수정';
        }
      });
      A.products.save(p);
      state.product = A.products.get(p.id) || p;
      detailView(root);
      App.toast('수정 내용을 저장했어요.');
    });
  }

  var SAMPLE_TEXT = [
    '넥센타이어 최고급형 4본 렌탈 — 월 3,000원부터',
    '타이어 4본 교체, 제휴카드 적용 시 월 3,000원(월 렌탈료 21,000원에서 우리카드Ⅱ 청구할인 18,000원 적용).',
    '최고급형·시그니처 4본 렌탈 시 장착 후 신세계 상품권 3만 원 증정. 장착 등록비 5만 원 면제, 장착 후 신세계 상품권 3만 원 증정.',
    '렌탈 기간 동안 타이어 보관과 위치 교환, 펑크 수리까지 무료로 지원합니다.',
    '6개월마다 정기 점검을 제공하며 위치 교환과 월 얼라이먼트도 각 1회 무료입니다.',
    '렌탈 불가 차종은 1톤, 봉고, 포터, 트럭류, 밴, 콜로라도 및 21인치 이상 타이어 장착 차량으로 안내합니다.',
    '일부 차량은 상담 후 이용이 어려울 수 있습니다. 월 3,000원은 우리카드Ⅱ 제휴카드 적용 기준이며 카드 조건에 따라 달라집니다.',
    '신청 대상은 렌탈 가능한 승용차 보유 고객이며, 법인 차량은 별도 상담이 필요합니다.',
    '이름과 연락처를 남겨 상담을 신청하면, 렌탈 진행 여부를 상담 후 정합니다.',
    '상담 신청은 홈페이지 신청서 또는 전화로 가능하며, 평일 오전 10시부터 오후 6시까지 상담합니다.',
    '자세한 조건은 상담 시 안내드리며, 프로모션은 2026년 11월 29일까지 선착순 50명 모집입니다.',
    '주차가 어려운 매장은 방문 전에 전화로 확인해 주세요.'
  ].join('\n');

  App.register({
    id: 'analyze', emoji: '🔍', name: '사이트 분석하기', free: true, tag: '무료 · 분석',
    desc: '상세페이지 주소를 넣으면 신청 조건·고객·소구점을 뽑아 보관함에 저장합니다.',
    help: '상세페이지 주소를 넣으면 공개 리더 3경로로 읽고, 신청 조건 6칸(출처 문장 포함)·고객 3명·소구점 5개를 만들어 보관함에 저장합니다. 사이트가 막히면 본문 붙여넣기나 캡처 이미지로 이어서 분석합니다. 저장한 상품은 당근·인스타·컨닝페이퍼·카페 자판기가 그대로 불러다 씁니다.',
    render: function (root) {
      state = { view: 'list', q: '', product: null, shots: [], busy: false };
      root.innerHTML = '<div id="an-root"></div>';
      var box = H.$('#an-root', root);
      if (state.view === 'list') listView(box);
    }
  });
})();
