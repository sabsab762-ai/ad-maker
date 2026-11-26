/* =====================================================================
   Module 11 · 🧠 바이럴 심리테스트·성향테스트 생성 자판기
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, QC = window.QuizCore;

  var PRESETS = [
    { id: 'love', label: '💕 연애 스타일' },
    { id: 'money', label: '💰 부자 될 확률' },
    { id: 'work', label: '🧑‍💼 숨겨진 직장인 유형' },
    { id: 'sports', label: '🏟️ 스포츠 승부 성향' },
    { id: 'custom', label: '✨ 직접 입력' }
  ];
  var CTAS = [
    { id: 'youtube', label: '유튜브 @BJ김카마', url: 'https://www.youtube.com/@BJ김카마', cta: '유튜브에서 김카마 보기' },
    { id: 'tune', label: '김카마튠', url: 'https://kimkamatune.github.io/', cta: '김카마튠에서 듣기' },
    { id: 'soop', label: 'SOOP 방송', url: '', cta: 'SOOP에서 김카마 방송 보기' },
    { id: 'custom', label: '직접 입력', url: '', cta: '내 채널 놀러가기' }
  ];

  function safeName(s) {
    return String(s || 'quiz').replace(/[^0-9A-Za-z가-힣_-]+/g, '_').slice(0, 40) || 'quiz';
  }

  App.register({
    id: 'quiz', emoji: '🧠', name: '심리테스트 자판기', free: true, tag: '공유 · 유입',
    desc: '주제만 넣으면 문항·유형·결과 화면까지 — 공유되는 테스트 페이지 1개 완성.',
    help: '주제와 문항 수를 고르면 4가지 유형으로 갈리는 테스트를 만들고, 대시보드에서 바로 눌러볼 수 있는 미리보기와 독립 실행 HTML 파일을 만들어 줍니다. 결과 화면 하단에는 내 채널(유튜브·김카마튠·SOOP) 유입 버튼이 붙고, 당근·스레드·인스타용 홍보글도 함께 나옵니다.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent =
        '.qz-frame{width:100%;height:780px;border:0;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px var(--line)}' +
        '.qz-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}' +
        '.qz-bar .rt{font-size:12px;color:var(--muted);font-weight:700;margin-left:auto}' +
        '.qz-src{font-size:11.5px;color:var(--muted);margin-top:8px}' +
        '.qz-cnt{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}' +
        '.qz-note{margin-top:10px;font-size:11.5px;color:var(--muted);line-height:1.65}' +
        '.qz-full .qz-frame{height:calc(100vh - 220px);min-height:640px}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack">' +
            '<section class="panel"><h3>🧠 테스트 만들기</h3>' +
              '<div class="field"><label>테스트 주제</label><div class="chiprow" id="qz-themes" style="margin-top:0">' +
                PRESETS.map(function (p, i) {
                  return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-theme="' + p.id + '">' + p.label + '</button>';
                }).join('') + '</div>' +
                '<div id="qz-topic-wrap" hidden><input id="qz-topic" type="text" placeholder="예: 새벽 라면 취향 / 단톡방 성격" maxlength="24" style="margin-top:8px"></div>' +
                '<p class="tip">프리셋 4종은 문항·유형이 완성되어 있고, 직접 입력은 내 주제에 맞춰 문항이 자동으로 바뀝니다.</p>' +
              '</div>' +
              '<div class="field"><label>문항 수</label><div class="chiprow" id="qz-counts" style="margin-top:0">' +
                '<button class="chip" type="button" data-count="5">5문항 (빠르게)</button>' +
                '<button class="chip on" type="button" data-count="7">7문항 (정확하게)</button></div></div>' +
              '<div class="field"><label>결과 화면 하단 버튼</label><div class="chiprow" id="qz-ctas" style="margin-top:0">' +
                CTAS.map(function (c, i) {
                  return '<button class="chip' + (i === 0 ? ' on' : '') + '" type="button" data-cta="' + c.id + '">' + c.label + '</button>';
                }).join('') + '</div>' +
                '<div class="row2" style="margin-top:10px">' +
                  '<div><label for="qz-cta-label" style="font-size:12px;font-weight:800;color:#45454F;display:block;margin-bottom:6px">버튼 문구</label>' +
                    '<input id="qz-cta-label" type="text" value="유튜브에서 김카마 보기" maxlength="30"></div>' +
                  '<div><label for="qz-cta-url" style="font-size:12px;font-weight:800;color:#45454F;display:block;margin-bottom:6px">버튼 링크</label>' +
                    '<input id="qz-cta-url" type="url" value="https://www.youtube.com/@BJ김카마" placeholder="https://..."></div>' +
                '</div>' +
                '<p class="tip" id="qz-cta-tip">링크가 비어 있으면 결과 화면에서 버튼이 숨겨집니다. SOOP는 방송국 주소를 직접 붙여넣어 주세요.</p>' +
              '</div>' +
              '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="qz-run">🧠 테스트 만들기</button></div>' +
              '<p class="hint">만든 HTML 1개를 GitHub Pages·블로그·카페에 올리면 바로 공유됩니다. 결과 공유 텍스트 복사 버튼과 채널 CTA가 기본으로 들어갑니다.</p>' +
            '</section>' +
            '<section class="panel"><h3>📣 유입 홍보글 <span class="pill" id="qz-postcount">0</span></h3>' +
              '<p class="psub">테스트를 만들면 당근·스레드·인스타용 글이 함께 나옵니다. 예시 결과 기준이라 문구는 자유롭게 고쳐 쓰세요.</p>' +
              '<div id="qz-posts"><div class="empty" style="padding:26px 14px"><b>아직 만든 테스트가 없어요</b>위에서 테스트 만들기를 눌러주세요.</div></div>' +
            '</section>' +
          '</div>' +
          '<div class="stack">' +
            '<section class="panel" id="qz-preview-panel"><h3>👀 인터랙티브 미리보기 <span class="pill" id="qz-meta">—</span></h3>' +
              '<div style="margin-top:10px">' +
                '<div class="qz-bar"><button class="btn btn-sm btn-ghost" type="button" id="qz-reload">↻ 다시 시작</button>' +
                  '<button class="btn btn-sm btn-ghost" type="button" id="qz-big">크게 보기</button>' +
                  '<span class="rt" id="qz-sub">옵션을 고르고 테스트 만들기를 누르세요</span></div>' +
                '<div id="qz-frame-wrap"><div class="empty" style="padding:60px 18px"><b>미리보기가 여기에 나옵니다</b>문항을 눌러 결과 화면까지 바로 확인할 수 있어요.</div></div>' +
                '<div class="actions" id="qz-file-actions" hidden>' +
                  '<button class="btn btn-primary" type="button" id="qz-download">📥 HTML 파일 다운로드</button>' +
                  '<button class="btn btn-line" type="button" id="qz-copy-html">HTML 복사</button>' +
                  '<button class="btn btn-line" type="button" id="qz-copy-share">공유 문구 복사</button>' +
                '</div>' +
                '<p class="qz-note" id="qz-file-note" hidden></p>' +
              '</div>' +
            '</section>' +
          '</div>' +
        '</div>';

      var el = {
        themes: H.$('#qz-themes', root), topicWrap: H.$('#qz-topic-wrap', root), topic: H.$('#qz-topic', root),
        counts: H.$('#qz-counts', root), ctas: H.$('#qz-ctas', root),
        ctaLabel: H.$('#qz-cta-label', root), ctaUrl: H.$('#qz-cta-url', root),
        frameWrap: H.$('#qz-frame-wrap', root), posts: H.$('#qz-posts', root),
        fileActions: H.$('#qz-file-actions', root), fileNote: H.$('#qz-file-note', root),
        meta: H.$('#qz-meta', root), sub: H.$('#qz-sub', root), postCount: H.$('#qz-postcount', root)
      };
      var state = { theme: 'love', count: 7, quiz: null, html: '', posts: [], ctaId: 'youtube' };

      var saved = S.get('quiz.last', null);
      if (saved) {
        if (saved.theme) state.theme = saved.theme;
        if (saved.count) state.count = saved.count;
        if (saved.topic) el.topic.value = saved.topic;
        if (saved.ctaId) state.ctaId = saved.ctaId;
        if (saved.ctaLabel) el.ctaLabel.value = saved.ctaLabel;
        if (saved.ctaUrl != null) el.ctaUrl.value = saved.ctaUrl;
      }

      function syncChips() {
        H.$$('[data-theme]', el.themes).forEach(function (b) {
          var on = b.getAttribute('data-theme') === state.theme;
          b.classList.toggle('on', on);
        });
        el.topicWrap.hidden = state.theme !== 'custom';
        H.$$('[data-count]', el.counts).forEach(function (b) {
          b.classList.toggle('on', +b.getAttribute('data-count') === state.count);
        });
        H.$$('[data-cta]', el.ctas).forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-cta') === state.ctaId);
        });
      }
      syncChips();

      H.$$('[data-theme]', el.themes).forEach(function (b) {
        b.addEventListener('click', function () {
          state.theme = b.getAttribute('data-theme');
          syncChips();
          if (state.theme === 'custom') setTimeout(function () { el.topic.focus(); }, 50);
        });
      });
      H.$$('[data-count]', el.counts).forEach(function (b) {
        b.addEventListener('click', function () { state.count = +b.getAttribute('data-count'); syncChips(); });
      });
      H.$$('[data-cta]', el.ctas).forEach(function (b) {
        b.addEventListener('click', function () {
          state.ctaId = b.getAttribute('data-cta');
          var preset = null;
          for (var i = 0; i < CTAS.length; i++) if (CTAS[i].id === state.ctaId) preset = CTAS[i];
          if (preset) {
            el.ctaLabel.value = preset.cta;
            el.ctaUrl.value = preset.url;
          }
          syncChips();
          if (state.ctaId === 'soop') App.toast('SOOP 방송국 주소를 붙여넣어 주세요.');
        });
      });

      function renderPosts() {
        if (!state.posts.length) return;
        el.posts.innerHTML = state.posts.map(function (p, i) {
          return '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">' + esc(p.label) + '</span>' +
            '<span class="m">' + p.text.length + '자</span></div>' +
            '<div class="cb scroll">' + esc(p.text) + '</div>' +
            '<div style="padding:0 13px 12px"><button class="btn btn-sm btn-soft" type="button" data-post="' + i + '">복사</button></div></div>';
        }).join('');
        el.postCount.textContent = state.posts.length;
        H.$$('[data-post]', el.posts).forEach(function (b) {
          b.addEventListener('click', function () {
            var i = +b.getAttribute('data-post');
            App.copy(state.posts[i].text, b, '홍보글을 복사했어요.');
          });
        });
      }

      function run() {
        var topic = el.topic.value.trim();
        if (state.theme === 'custom' && !topic) {
          App.toast('직접 입력을 고르면 테스트 주제를 적어주세요.');
          el.topic.focus();
          return;
        }
        var url = QC.normalizeUrl(el.ctaUrl.value);
        if (el.ctaUrl.value.trim() && !url) {
          App.toast('버튼 링크는 https:// 로 시작하는 주소로 넣어주세요.');
          el.ctaUrl.focus();
          return;
        }
        var quiz = QC.buildQuiz({
          theme: state.theme, count: state.count, topic: topic,
          ctaLabel: el.ctaLabel.value, ctaUrl: url
        });
        state.quiz = quiz;
        state.html = QC.buildHTML(quiz);
        var sample = QC.computeResult(quiz, new Array(quiz.count).fill(0));
        state.posts = QC.promoPosts(quiz, sample, url);
        state.sample = sample;

        el.frameWrap.innerHTML = '<iframe class="qz-frame" id="qz-frame" title="테스트 미리보기" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"></iframe>';
        var frame = H.$('#qz-frame', el.frameWrap);
        frame.srcdoc = state.html;

        el.meta.textContent = quiz.title + ' · ' + quiz.count + '문항';
        el.sub.textContent = '결과 화면까지 눌러보세요';
        el.fileActions.hidden = false;
        el.fileNote.hidden = false;
        el.fileNote.innerHTML = '결과 화면 하단 버튼: <b>' + esc(quiz.cta.url ? quiz.cta.label + ' → ' + quiz.cta.url : '없음 (링크를 넣으면 붙습니다)') + '</b><br>' +
          '파일 용량 ' + Math.round(state.html.length / 1024 * 10) / 10 + 'KB · 외부 라이브러리 없이 단독 실행됩니다.';
        renderPosts();

        S.set('quiz.last', {
          theme: state.theme, count: state.count, topic: topic,
          ctaId: state.ctaId, ctaLabel: el.ctaLabel.value, ctaUrl: el.ctaUrl.value
        });
        App.toast('테스트를 만들었어요! 미리보기에서 눌러보세요.');
      }

      H.$('#qz-run', root).addEventListener('click', run);

      H.$('#qz-reload', root).addEventListener('click', function () {
        if (!state.html) { App.toast('먼저 테스트를 만들어 주세요.'); return; }
        var frame = H.$('#qz-frame', el.frameWrap);
        if (frame) frame.srcdoc = state.html;
      });

      H.$('#qz-big', root).addEventListener('click', function () {
        var panel = H.$('#qz-preview-panel', root);
        panel.classList.toggle('qz-full');
        this.textContent = panel.classList.contains('qz-full') ? '원래 크기' : '크게 보기';
      });

      H.$('#qz-download', root).addEventListener('click', function () {
        if (!state.html) { App.toast('먼저 테스트를 만들어 주세요.'); return; }
        var nm = 'quiz_' + safeName(state.quiz.title) + '_' + state.quiz.count + '문항.html';
        App.download(nm, state.html, 'text/html;charset=utf-8');
        App.toast('HTML 파일을 내려받았어요. 그대로 올리면 됩니다!');
      });

      H.$('#qz-copy-html', root).addEventListener('click', function () {
        if (!state.html) { App.toast('먼저 테스트를 만들어 주세요.'); return; }
        App.copy(state.html, this, 'HTML 전체를 복사했어요. 파일로 저장해 올리세요.');
      });

      H.$('#qz-copy-share', root).addEventListener('click', function () {
        if (!state.quiz) { App.toast('먼저 테스트를 만들어 주세요.'); return; }
        var txt = QC.shareText(state.quiz, state.sample, state.quiz.cta.url);
        App.copy(txt, this, '공유 문구를 복사했어요.');
      });
    }
  });
})();
