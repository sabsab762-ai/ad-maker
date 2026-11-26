/* =====================================================================
   Module 2 · 📸 인스타 캐러셀 사진 자판기  (Canvas 1080×1350)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  var THEMES = {
    dark:   { name: '모던 다크', bg: '#141418', bg2: '#1E1E26', fg: '#FFFFFF', sub: 'rgba(255,255,255,.66)', accent: '#B9A6FF', line: 'rgba(255,255,255,.16)' },
    cream:  { name: '크림',      bg: '#FBF4E9', bg2: '#F6ECDC', fg: '#2B2118', sub: 'rgba(43,33,24,.62)', accent: '#C2683A', line: 'rgba(43,33,24,.14)' },
    purple: { name: '퍼플',      bg: '#5A2EE8', bg2: '#4A1FD1', fg: '#FFFFFF', sub: 'rgba(255,255,255,.78)', accent: '#FFD36B', line: 'rgba(255,255,255,.24)' },
    carrot: { name: '당근',      bg: '#FFF3EA', bg2: '#FFE7D6', fg: '#2A1A12', sub: 'rgba(42,26,18,.60)', accent: '#FF6F0F', line: 'rgba(42,26,18,.12)' },
    mint:   { name: '민트',      bg: '#EDFAF4', bg2: '#DFF5EC', fg: '#0F271E', sub: 'rgba(15,39,30,.60)', accent: '#0E9E74', line: 'rgba(15,39,30,.12)' }
  };

  var BODY_TEMPLATES = [
    '여기서 갈리는 게 결과 차이를 만듭니다.',
    '처음엔 이 한 가지만 기억해도 충분해요.',
    '대부분 이 부분을 놓쳐서 다시 돌아옵니다.',
    '기준을 정해두면 고민할 시간이 줄어요.',
    '작게 시작하고, 잘 되는 것만 늘리면 됩니다.',
    '숫자로 확인할 수 있게 적어두는 게 핵심이에요.'
  ];
  var FALLBACK_POINTS = [
    '지금 확인해야 하는 이유',
    '처음 시작할 때 체크할 3가지',
    '실수 줄이는 가장 쉬운 방법',
    '바로 써먹는 실전 팁',
    '마지막으로 꼭 기억할 것'
  ];

  function font(weight, size) {
    return weight + ' ' + size + 'px Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(ctx, text, maxWidth) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    var out = [], line = '', i, test;
    for (i = 0; i < words.length; i++) {
      test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = words[i]; }
      else line = test;
    }
    if (line) out.push(line);
    if (!out.length) out.push('');
    return out;
  }
  function drawLines(ctx, linesArr, x, y, lineHeight, maxLines) {
    var n = Math.min(linesArr.length, maxLines || 99), i;
    for (i = 0; i < n; i++) {
      ctx.fillText(linesArr[i], x, y + i * lineHeight);
      if (i === n - 1 && linesArr.length > n) {
        var last = linesArr[i];
        while (last.length > 1 && ctx.measureText(last + '…').width > ctx.canvas.width - x * 2) last = last.slice(0, -1);
        ctx.fillText(last + '…', x, y + i * lineHeight);
      }
    }
    return y + n * lineHeight;
  }
  function tracked(ctx, text, x, y, gap) {
    var cur = x, i;
    for (i = 0; i < text.length; i++) {
      ctx.fillText(text.charAt(i), cur, y);
      cur += ctx.measureText(text.charAt(i)).width + gap;
    }
  }

  function slidePlan(topic, points, count, handle) {
    var pts = points.length ? points.slice(0, count - 2) : [];
    while (pts.length < count - 2) pts.push(FALLBACK_POINTS[pts.length % FALLBACK_POINTS.length]);
    var slides = [];
    slides.push({
      kind: 'cover',
      kicker: 'CAROUSEL',
      title: topic,
      sub: '끝까지 보면 체크리스트가 됩니다 · 저장해 두세요',
      handle: handle
    });
    for (var i = 0; i < pts.length; i++) {
      slides.push({
        kind: 'body',
        no: i + 1,
        title: pts[i],
        body: BODY_TEMPLATES[(i + Math.floor(Math.random() * BODY_TEMPLATES.length)) % BODY_TEMPLATES.length],
        handle: handle
      });
    }
    slides.push({
      kind: 'cta',
      title: '저장하고\n나중에 다시 보기',
      sub: '도움이 됐다면 저장 · 공유\n궁금한 점은 댓글로 남겨주세요',
      handle: handle
    });
    return slides.map(function (s, i) { s.index = i; s.total = count; return s; });
  }

  function paint(slide, t) {
    var c = document.createElement('canvas');
    c.width = 1080; c.height = 1350;
    var ctx = c.getContext('2d');
    var W = 1080, PAD = 96;

    var g = ctx.createLinearGradient(0, 0, W, 1350);
    g.addColorStop(0, t.bg); g.addColorStop(1, t.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1350);

    // accent glow
    var rg = ctx.createRadialGradient(880, 220, 40, 880, 220, 520);
    rg.addColorStop(0, t.accent + '55');
    rg.addColorStop(1, t.accent + '00');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, 900);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    if (slide.kind === 'cover') {
      ctx.fillStyle = t.accent;
      ctx.font = font(800, 26);
      tracked(ctx, slide.kicker, PAD, PAD + 8, 6);

      ctx.fillStyle = t.fg;
      var size = 92, linesArr, y;
      do {
        ctx.font = font(800, size);
        linesArr = wrap(ctx, slide.title, W - PAD * 2);
        if (linesArr.length <= 4) break;
        size -= 4;
      } while (size > 52);
      ctx.font = font(800, size);
      y = 380;
      drawLines(ctx, linesArr, PAD, y, size * 1.24, 5);

      var after = y + Math.min(linesArr.length, 5) * size * 1.24 + 34;
      ctx.fillStyle = t.accent; ctx.fillRect(PAD, after, 86, 6);

      ctx.fillStyle = t.sub;
      ctx.font = font(500, 36);
      drawLines(ctx, wrap(ctx, slide.sub, W - PAD * 2 - 40), PAD, after + 44, 54, 3);

      // bottom
      ctx.fillStyle = t.line; ctx.fillRect(PAD, 1176, W - PAD * 2, 2);
      ctx.fillStyle = t.sub; ctx.font = font(700, 30);
      ctx.fillText(slide.handle || '@my_brand', PAD, 1214);
      ctx.textAlign = 'right';
      ctx.fillText('1 / ' + slide.total, W - PAD, 1214);
      ctx.textAlign = 'left';
    } else if (slide.kind === 'body') {
      ctx.fillStyle = t.accent; ctx.font = font(800, 30);
      ctx.fillText(('0' + (slide.index + 1)).slice(-2) + ' / ' + ('0' + slide.total).slice(-2), PAD, PAD + 6);

      // watermark number
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = t.fg;
      ctx.font = font(800, 420);
      ctx.textAlign = 'right';
      ctx.fillText(('0' + slide.no).slice(-2), W + 40, 860);
      ctx.restore();
      ctx.textAlign = 'left';

      ctx.fillStyle = t.fg;
      var hs = 74, hl;
      do {
        ctx.font = font(800, hs);
        hl = wrap(ctx, slide.title, W - PAD * 2);
        if (hl.length <= 4) break;
        hs -= 3;
      } while (hs > 46);
      ctx.font = font(800, hs);
      var hy = 400;
      drawLines(ctx, hl, PAD, hy, hs * 1.26, 5);

      var by = hy + Math.min(hl.length, 5) * hs * 1.26 + 40;
      ctx.fillStyle = t.sub;
      ctx.font = font(500, 38);
      drawLines(ctx, wrap(ctx, slide.body, W - PAD * 2 - 30), PAD, by, 58, 5);

      ctx.fillStyle = t.accent;
      roundRect(ctx, PAD, by + 320, 12, 12, 6); ctx.fill();

      ctx.fillStyle = t.line; ctx.fillRect(PAD, 1176, W - PAD * 2, 2);
      ctx.fillStyle = t.sub; ctx.font = font(700, 30);
      ctx.fillText(slide.handle || '@my_brand', PAD, 1214);
      ctx.textAlign = 'right';
      ctx.fillText((slide.index + 1) + ' / ' + slide.total, W - PAD, 1214);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = t.accent; ctx.font = font(800, 26);
      tracked(ctx, 'SAVE & SHARE', PAD, PAD + 8, 6);

      ctx.fillStyle = t.fg;
      ctx.font = font(800, 96);
      var cl = wrap(ctx, slide.title.replace(/\n/g, ' '), W - PAD * 2);
      drawLines(ctx, cl, PAD, 470, 118, 3);

      ctx.fillStyle = t.sub; ctx.font = font(500, 38);
      drawLines(ctx, wrap(ctx, slide.sub.replace(/\n/g, ' '), W - PAD * 2 - 60), PAD, 470 + cl.length * 118 + 40, 58, 3);

      ctx.fillStyle = t.accent;
      roundRect(ctx, PAD, 1000, 300, 76, 38); ctx.fill();
      ctx.fillStyle = t.bg;
      ctx.font = font(800, 30);
      ctx.fillText('@' + String(slide.handle || 'my_brand').replace(/^@/, ''), PAD + 40, 1022);
    }
    return c;
  }

  /* caption */
  function captionFor(topic, points, handle) {
    var tags = ['#카드뉴스', '#인스타카드뉴스', '#콘텐츠제작', '#정보공유', '#저장각'];
    var body = '📌 ' + topic + '\n\n' +
      (points.length ? points.slice(0, 4).map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') + '\n\n' : '') +
      '도움이 됐다면 저장 · 공유해 주세요.\n궁금한 점은 댓글로 남겨 주세요 🙌\n\n' +
      tags.join(' ') + (handle ? '\n\n' + handle : '');
    return body;
  }

  App.register({
    id: 'insta', emoji: '📸', name: '인스타 캐러셀 사진 자판기', free: false, tag: '이미지',
    desc: '주제만 넣으면 3~7장 카드뉴스 슬라이드를 1080×1350 PNG로 뽑아줍니다.',
    help: '주제와 핵심 포인트를 넣고 장수를 고르면, 표지·본문·CTA 슬라이드가 자동으로 만들어집니다. 슬라이드마다 PNG로 저장해 인스타에 그대로 올리세요.',
    render: function (root) {
      var st = document.createElement('style');
      st.textContent = '.shots{margin-top:2px}.shot .cap button{padding:2px 8px;height:24px;border:1px solid var(--line);border-radius:7px;background:#fff;font-size:10.5px;font-weight:800;color:var(--violet-d)}' +
        '.theme-dots{display:flex;gap:5px;margin-top:6px}.theme-dots i{width:12px;height:12px;border-radius:50%;display:block}';
      document.head.appendChild(st);

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🎞 슬라이드 만들기</h3>' +
            '<div class="field"><label for="in-topic">주제 / 제목 *</label><input id="in-topic" type="text" placeholder="예: 월 3만원으로 시작하는 재테크"></div>' +
            '<div class="field"><label for="in-points">핵심 포인트 <span class="muted small">(한 줄에 하나 · 비워도 자동 생성)</span></label>' +
            '<textarea id="in-points" placeholder="적금 먼저, 투자는 나중&#10;월급의 30%부터&#10;자동이체로 습관 만들기"></textarea></div>' +
            '<div class="row2"><div class="field"><label for="in-count">슬라이드 장수</label><select id="in-count"><option>3</option><option>4</option><option selected>5</option><option>6</option><option>7</option></select></div>' +
            '<div class="field"><label for="in-theme">컬러 테마</label><select id="in-theme">' +
              Object.keys(THEMES).map(function (k) { return '<option value="' + k + '">' + esc(THEMES[k].name) + '</option>'; }).join('') +
            '</select><div class="theme-dots" id="in-dots"></div></div></div>' +
            '<div class="field"><label for="in-handle">계정 핸들</label><input id="in-handle" type="text" placeholder="@my_brand"></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="in-run">카드뉴스 생성</button></div>' +
            '<p class="hint">생성 후 각 슬라이드의 <b>PNG</b>를 눌러 저장하세요. 1080×1350 비율 그대로 저장됩니다.</p>' +
          '</section>' +
          '<section class="panel"><h3>✍️ 인스타 캡션</h3><div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">캡션 + 해시태그</span><button class="btn btn-sm btn-soft" type="button" id="in-capcopy">복사</button></div><div class="cb" id="in-cap">카드뉴스를 만들면 캡션도 함께 만들어집니다.</div></div></section>' +
          '</div>' +
          '<div class="stack"><section class="panel"><h3>🖼 미리보기 <span class="pill" id="in-total">0</span></h3>' +
            '<div class="shots" id="in-shots" style="margin-top:12px"><div class="empty" style="grid-column:1/-1"><b>아직 만든 카드뉴스가 없어요</b>왼쪽에서 주제를 넣고 생성을 눌러주세요.</div></div>' +
            '<div class="actions"><button class="btn btn-soft" type="button" id="in-all">전체 PNG 저장</button>' +
            '<button class="btn btn-ghost" type="button" id="in-again">같은 설정으로 다시 생성</button></div>' +
          '</section></div>' +
        '</div>';

      var el = {
        topic: H.$('#in-topic', root), points: H.$('#in-points', root), count: H.$('#in-count', root),
        theme: H.$('#in-theme', root), handle: H.$('#in-handle', root), shots: H.$('#in-shots', root),
        cap: H.$('#in-cap', root), dots: H.$('#in-dots', root)
      };
      var canvases = [];

      function paintDots() {
        var t = THEMES[el.theme.value];
        el.dots.innerHTML = '<i style="background:' + t.bg + ';border:1px solid #D8D8E2"></i>' +
          '<i style="background:' + t.accent + '"></i><i style="background:' + t.fg + ';border:1px solid #D8D8E2"></i>';
      }

      function generate() {
        var topic = el.topic.value.trim();
        if (!topic) { App.toast('주제를 먼저 입력해 주세요.'); el.topic.focus(); return; }
        var pts = el.points.value.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        var count = Number(el.count.value) || 5;
        var handle = (el.handle.value.trim() || '@my_brand');
        var t = THEMES[el.theme.value];
        var plan = slidePlan(topic, pts, count, handle);

        canvases = plan.map(function (s) { return paint(s, t); });
        el.shots.innerHTML = '';
        canvases.forEach(function (cv, i) {
          var url = cv.toDataURL('image/png');
          var d = document.createElement('div');
          d.className = 'shot';
          d.innerHTML = '<img src="' + url + '" alt="' + esc((i + 1) + '번째 슬라이드') + '">' +
            '<div class="cap"><span>' + (i + 1) + ' / ' + canvases.length + '</span><button type="button" data-png="' + i + '">PNG</button></div>';
          el.shots.appendChild(d);
        });
        H.$('#in-total', root).textContent = canvases.length;
        el.cap.textContent = captionFor(topic, pts.length ? pts : FALLBACK_POINTS.slice(0, 3), handle);
        App.toast(canvases.length + '장 카드뉴스를 만들었어요. PNG로 저장해 보세요!');
      }

      function saveOne(i) {
        var cv = canvases[i];
        if (!cv) return;
        var a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'carousel-' + (i + 1) + '-' + Date.now().toString(36) + '.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }

      el.theme.addEventListener('change', paintDots);
      H.$('#in-run', root).addEventListener('click', generate);
      H.$('#in-again', root).addEventListener('click', generate);
      el.shots.addEventListener('click', function (e) {
        var b = e.target.closest('[data-png]');
        if (!b) return;
        saveOne(Number(b.getAttribute('data-png')));
        App.toast('PNG를 저장했어요.');
      });
      H.$('#in-all', root).addEventListener('click', function () {
        if (!canvases.length) { App.toast('먼저 카드뉴스를 생성해 주세요.'); return; }
        var i = 0;
        (function next() {
          if (i >= canvases.length) { App.toast('전체 PNG 저장을 시작했어요. 브라우저가 여러 파일 저장을 물으면 허용해 주세요.'); return; }
          saveOne(i++);
          setTimeout(next, 420);
        })();
      });
      H.$('#in-capcopy', root).addEventListener('click', function () {
        App.copy(el.cap.textContent, this);
      });

      paintDots();
      el.cap.textContent = captionFor('예시: 월 3만원으로 시작하는 재테크', FALLBACK_POINTS.slice(0, 3), '@my_brand');
      el.cap.textContent = '카드뉴스를 만들면 캡션도 함께 만들어집니다.';
    }
  });
})();
