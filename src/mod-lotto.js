/* =====================================================================
   Module 4 · 🎱 로또 자판기 (당첨 결과 화면 · 영상 + 번호 분석)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, A = App.ads;
  var DATA = (typeof LOTTO_DATA !== 'undefined' && LOTTO_DATA.length) ? LOTTO_DATA : [];

  var RANKS = [
    { k: '1', name: '1등', match: 6, etc: false },
    { k: '2', name: '2등', match: 5, etc: false },
    { k: '3', name: '3등', match: 5, etc: false },
    { k: '4', name: '4등', match: 4, etc: false },
    { k: '5', name: '5등', match: 3, etc: false },
    { k: 'X', name: '광', match: 0, etc: true }
  ];
  var CAPTION_EFFECTS = ['톡 튀어나오기', '아래서 올라오기', '스르륵', '흔들기', '효과 없음'];
  var CAPTION_STYLES = ['외곽선', '검은 상자', '형광펜', '네온', '그림자'];
  var CAPTION_COLORS = ['#FFE24B', '#FFFFFF', '#FF5C8A', '#3BE39B', '#5AB0FF', '#17171B'];
  var CAPTION_FONTS = ['임팩트', '고딕', '명조', '귀여운', '손글씨', '단정'];
  var FONT_MAP = {
    '임팩트': '900 %s "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    '고딕': '800 %s "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
    '명조': '800 %s "Nanum Myeongjo", "AppleMyungjo", serif',
    '귀여운': '800 %s "BM Jua", "Jua", "Apple SD Gothic Neo", sans-serif',
    '손글씨': '800 %s "Nanum Pen Script", "Segoe Script", cursive',
    '단정': '700 %s "Pretendard", "Apple SD Gothic Neo", sans-serif'
  };

  var st = {
    tab: 'studio',
    roundNo: DATA.length ? DATA[0].no : 1,
    manual: false,
    nums: [],
    bonus: 0,
    mode: 'result',
    rows: [
      { key: 'A', rank: '1' }, { key: 'B', rank: '5' },
      { key: 'C', rank: 'X' }, { key: 'D', rank: 'X' }, { key: 'E', rank: 'X' }
    ],
    caption: '1등 되고 싶은 분 덕담 남겨주세요',
    effect: '톡 튀어나오기',
    cstyle: '네온',
    ccolor: '#FFE24B',
    cfont: '고딕',
    csize: 92,
    scale: 100, ox: 0, oy: 0,
    dur: 15,
    playing: false,
    canvases: {}
  };

  /* ---------------- 데이터 ---------------- */
  function roundOf(no) {
    for (var i = 0; i < DATA.length; i++) if (DATA[i].no === Number(no)) return DATA[i];
    return DATA[0] || null;
  }
  function current() {
    var r = roundOf(st.roundNo);
    if (!r) return { no: 1, date: '', n: [1, 2, 3, 4, 5, 6], b: 7, p: [0, 0, 0, 0, 0], w: [0, 0, 0, 0, 0] };
    return r;
  }
  function balls() {
    var r = current();
    return st.manual ? { n: st.nums.slice(), b: st.bonus, p: r.p, date: r.date, no: st.roundNo } : r;
  }
  function ballClass(n) {
    if (n <= 10) return 'y';
    if (n <= 20) return 'b';
    if (n <= 30) return 'r';
    if (n <= 40) return 'g';
    return 'e';
  }
  function ballColor(n) {
    return { y: '#F2B616', b: '#3B7CF6', r: '#E5484D', g: '#6B7280', e: '#10A36B' }[ballClass(n)];
  }
  function seeded(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  function pickNon(arr, count, rnd) {
    var pool = arr.filter(function (n) { return true; });
    var out = [];
    while (pool.length && out.length < count) {
      var i = Math.floor(rnd() * pool.length);
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }
  function rowNumbers(r, key, rank) {
    var win = r.n, bonus = r.b, rnd = seeded(r.no * 97 + key.charCodeAt(0) * 31 + rank.charCodeAt(0) * 7);
    var others = [], i;
    for (i = 1; i <= 45; i++) if (win.indexOf(i) === -1 && i !== bonus) others.push(i);
    var picks = [];
    if (rank === 'X') {
      picks = pickNon(others, 6, rnd);
      /* 가끔 1~2개 맞는 꽝 */
      var hit = Math.floor(rnd() * 3);
      for (i = 0; i < hit; i++) picks[i] = win[Math.floor(rnd() * win.length)];
    } else if (rank === '2') {
      picks = win.slice(0, 5).concat([bonus]);
    } else {
      var need = rank === '1' ? 6 : rank === '3' ? 5 : rank === '4' ? 4 : 3;
      picks = pickNon(win.slice(), need, rnd).concat(pickNon(others, 6 - need, rnd));
    }
    picks = picks.filter(function (v, idx, self) { return self.indexOf(v) === idx; });
    while (picks.length < 6) picks = picks.concat(pickNon(others, 6 - picks.length, rnd));
    return picks.sort(function (a, b) { return a - b; }).slice(0, 6);
  }
  function rowOf(r, row) {
    return { key: row.key, rank: row.rank, nums: rowNumbers(r, row.key, row.rank) };
  }
  function rankInfo(k) {
    for (var i = 0; i < RANKS.length; i++) if (RANKS[i].k === k) return RANKS[i];
    return RANKS[5];
  }
  function prizeOf(r, rank) {
    if (rank === 'X') return 0;
    var idx = Number(rank) - 1;
    return (r.p && r.p[idx]) || 0;
  }
  function totalPrize(r) {
    return st.rows.reduce(function (a, row) { return a + prizeOf(r, row.rank); }, 0);
  }
  function matched(r, nums) {
    return nums.filter(function (n) { return r.n.indexOf(n) !== -1; }).length;
  }

  /* ---------------- 티켓 그리기 ---------------- */
  function drawFrame(ctx, W, Hh, t) {
    var r = balls();
    var C = A.canvas;
    var scale = st.scale / 100;
    var rows = st.rows.map(function (row) { return rowOf(r, row); });
    var total = rows.reduce(function (a, x) { return a + prizeOf(r, x.rank); }, 0);

    /* 배경 */
    var bg = ctx.createLinearGradient(0, 0, W, Hh);
    bg.addColorStop(0, '#EDF1FB'); bg.addColorStop(1, '#F9FAFE');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh);

    ctx.save();
    ctx.translate(W / 2, Hh / 2);
    ctx.scale(scale, scale);
    if (st.scale > 100) ctx.translate(0, -Hh * 0.04);
    ctx.translate(-W / 2 + st.ox, -Hh / 2 + st.oy);

    var appear = Math.min(1, t / 0.35);
    ctx.globalAlpha = appear;
    ctx.translate((1 - appear) * 40, 0);

    /* 상단 앱 헤더 */
    ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.font = '800 40px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#2B3A67';
    ctx.fillText('로또 6/45', 72, 120);
    ctx.textAlign = 'right';
    ctx.font = '700 34px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#8A90A6';
    ctx.fillText('제' + r.no + '회' + (r.date ? ' · ' + r.date : ''), W - 72, 126);
    ctx.textAlign = 'left';

    /* 당첨번호 카드 */
    var cardY = 200, cardH = 330;
    ctx.save();
    ctx.shadowColor = 'rgba(30,40,80,.10)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#FFFFFF';
    C.roundRect(ctx, 60, cardY, W - 120, cardH, 34); ctx.fill();
    ctx.restore();

    ctx.font = '800 34px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#6D6D7A';
    ctx.fillText('당첨번호', 100, cardY + 34);

    var bx = 100, by = cardY + 92, bs = 68, gap = 14;
    r.n.forEach(function (n) {
      ctx.beginPath(); ctx.arc(bx + bs / 2, by + bs / 2, bs / 2, 0, Math.PI * 2);
      ctx.fillStyle = ballColor(n); ctx.fill();
      ctx.fillStyle = n <= 10 ? '#3A2A00' : '#FFFFFF';
      ctx.font = '800 30px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(n), bx + bs / 2, by + bs / 2 - 16);
      ctx.textAlign = 'left';
      bx += bs + gap;
    });
    ctx.font = '800 34px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#9C9CA8';
    ctx.fillText('+', bx + 4, by + bs / 2 - 18);
    bx += 40;
    ctx.beginPath(); ctx.arc(bx + bs / 2, by + bs / 2, bs / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#C9C9D6'; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center';
    ctx.font = '800 30px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillText(String(r.b), bx + bs / 2, by + bs / 2 - 16);
    ctx.textAlign = 'left';

    ctx.font = '700 32px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#8A90A6';
    ctx.fillText('1등 ' + A.wonAuto(r.p[0] || 0) + ' · 2등 ' + A.wonAuto(r.p[1] || 0), 100, cardY + 190);

    var totalShow = total * Math.min(1, Math.max(0, (t - 0.3) / 0.5));
    ctx.font = '800 38px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#4B5A85';
    ctx.fillText('축하합니다', 100, cardY + 246);
    ctx.textAlign = 'right';
    var totalTxt = total ? '총 ' + A.won(Math.round(totalShow)) + '원' : '당첨 없음';
    var tsz = 56;
    do {
      ctx.font = '800 ' + tsz + 'px Pretendard, "Apple SD Gothic Neo", sans-serif';
      if (ctx.measureText(totalTxt).width <= W - 300) break;
      tsz -= 4;
    } while (tsz > 30);
    ctx.fillStyle = total ? '#FF6F0F' : '#B0B0BC';
    ctx.fillText(totalTxt, W - 100, cardY + 246);
    ctx.textAlign = 'left';

    /* 응모 줄 */
    var y = cardY + cardH + 44;
    var rowsAppear = Math.min(1, Math.max(0, (t - 0.25) / 0.45));
    ctx.save();
    ctx.globalAlpha = appear * rowsAppear;
    rows.forEach(function (row, i) {
      var rh = 176;
      var rr = { x: 60, y: y + i * (rh + 12), w: W - 120, h: rh };
      var win = row.rank !== 'X';
      ctx.fillStyle = win ? '#FFFFFF' : '#F4F5F9';
      ctx.save();
      if (win) { ctx.shadowColor = 'rgba(99,56,245,.18)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6; }
      C.roundRect(ctx, rr.x, rr.y, rr.w, rr.h, 26); ctx.fill();
      ctx.restore();
      if (win) {
        var pulse = 1 + Math.sin(t * Math.PI * 6) * 0.15;
        ctx.strokeStyle = 'rgba(99,56,245,' + (0.5 + 0.4 * pulse) + ')';
        ctx.lineWidth = 4;
        C.roundRect(ctx, rr.x + 2, rr.y + 2, rr.w - 4, rr.h - 4, 24); ctx.stroke();
      }
      ctx.font = '800 34px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillStyle = '#2B3A67';
      ctx.fillText(row.key, rr.x + 26, rr.y + 28);
      ctx.font = '800 26px Pretendard, "Apple SD Gothic Neo", sans-serif';
      ctx.fillStyle = win ? '#6338F5' : '#A0A4B4';
      ctx.fillText(rankInfo(row.rank).name, rr.x + 24, rr.y + 78);

      var sx = rr.x + 90, sy = rr.y + 50, ss = 52, sgap = 10;
      row.nums.forEach(function (n) {
        ctx.beginPath(); ctx.arc(sx + ss / 2, sy + ss / 2, ss / 2, 0, Math.PI * 2);
        ctx.fillStyle = ballColor(n); ctx.fill();
        ctx.fillStyle = n <= 10 ? '#3A2A00' : '#FFFFFF';
        ctx.font = '800 24px Pretendard, "Apple SD Gothic Neo", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(n), sx + ss / 2, sy + ss / 2 - 13);
        ctx.textAlign = 'left';
        sx += ss + sgap;
      });

      /* 우측 등수/금액 */
      ctx.textAlign = 'right';
      var ax = rr.x + rr.w - 26, avail = rr.w * 0.34;
      if (win) {
        var amtTxt = A.wonAuto(prizeOf(r, row.rank));
        var asz = 30;
        do {
          ctx.font = '800 ' + asz + 'px Pretendard, "Apple SD Gothic Neo", sans-serif';
          if (ctx.measureText(amtTxt).width <= avail) break;
          asz -= 2;
        } while (asz > 18);
        ctx.fillStyle = '#FF6F0F';
        ctx.fillText(amtTxt, ax, rr.y + 42);
        ctx.font = '700 22px Pretendard, "Apple SD Gothic Neo", sans-serif';
        ctx.fillStyle = '#8A90A6';
        ctx.fillText(matched(r, row.nums) + '개 일치', ax, rr.y + 84);
      } else {
        ctx.font = '700 26px Pretendard, "Apple SD Gothic Neo", sans-serif';
        ctx.fillStyle = '#B0B0BC';
        ctx.fillText(st.mode === 'analysis' ? matched(r, row.nums) + '개 일치' : '낙첨', ax, rr.y + 56);
      }
      ctx.textAlign = 'left';
    });
    ctx.restore();

    /* 하단 워터마크 */
    ctx.globalAlpha = appear;
    ctx.font = '700 26px Pretendard, "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#B6BAC8';
    ctx.fillText('lotto_daily · 재미로 보는 화면입니다', 60, Hh - 90);

    /* 자막 */
    if (st.caption && t > 0.55) {
      var ct = Math.min(1, (t - 0.55) / 0.18);
      var capY = Hh - 210;
      var csize = st.csize;
      var fam = (FONT_MAP[st.cfont] || FONT_MAP['고딕']).replace('%s', Math.round(csize) + 'px');
      ctx.font = fam;
      ctx.textAlign = 'center';
      var maxW = W - 140;
      var lines = C.wrap(ctx, st.caption, maxW);
      while (lines.length > 2 && csize > 52) {
        csize -= 6;
        fam = (FONT_MAP[st.cfont] || FONT_MAP['고딕']).replace('%s', Math.round(csize) + 'px');
        ctx.font = fam;
        lines = C.wrap(ctx, st.caption, maxW);
      }
      lines = lines.slice(0, 2);
      var lineH = csize * 1.2;
      var totalH = lines.length * lineH;
      var tx = W / 2, ty = capY - totalH / 2;

      var scl = 1, dx = 0, alpha = ct;
      if (st.effect === '톡 튀어나오기') { var e = 1 - Math.pow(1 - ct, 3); scl = 0.6 + 0.55 * e - (e > 0.9 ? (e - 0.9) * 0.4 : 0); alpha = Math.min(1, ct * 2); }
      else if (st.effect === '아래서 올라오기') { var e2 = 1 - Math.pow(1 - ct, 3); ty += (1 - e2) * 90; alpha = Math.min(1, ct * 1.6); }
      else if (st.effect === '스르륵') { alpha = ct; }
      else if (st.effect === '흔들기') { dx = Math.sin(ct * Math.PI * 8) * 12 * (1 - ct); scl = 1.04; }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(tx, ty + lineH / 2);
      ctx.scale(scl, scl);
      ctx.translate(-tx, -(ty + lineH / 2));

      lines.forEach(function (line, i) {
        var ly = ty + i * lineH;
        var lw = ctx.measureText(line).width;
        if (st.cstyle === '검은 상자') {
          ctx.fillStyle = 'rgba(0,0,0,.82)';
          C.roundRect(ctx, tx - lw / 2 - 20, ly - 8, lw + 40, lineH + 4, 12); ctx.fill();
        } else if (st.cstyle === '형광펜') {
          ctx.fillStyle = A.canvas.hexA(st.ccolor, .55);
          ctx.fillRect(tx - lw / 2 - 10, ly + lineH * 0.42, lw + 20, lineH * 0.5);
        }
        if (st.cstyle === '외곽선') {
          ctx.lineWidth = 12; ctx.strokeStyle = '#111'; ctx.lineJoin = 'round';
          ctx.strokeText(line, tx + dx, ly);
        } else if (st.cstyle === '네온') {
          ctx.shadowColor = st.ccolor; ctx.shadowBlur = 28;
        } else if (st.cstyle === '그림자') {
          ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
        }
        ctx.fillStyle = st.cstyle === '형광펜' || st.cstyle === '검은 상자' ? '#FFFFFF' : st.ccolor;
        ctx.fillText(line, tx + dx, ly);
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
      });
      ctx.restore();
      ctx.textAlign = 'left';
    }

    ctx.restore();
  }

  function makeCanvas() {
    var cv = document.createElement('canvas');
    cv.width = 1080; cv.height = 1920;
    st.canvases.main = cv;
    return cv;
  }
  function paintStatic() {
    var cv = st.canvases.main || makeCanvas();
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    drawFrame(ctx, cv.width, cv.height, 1);
    return cv;
  }

  /* ---------------- 영상 ---------------- */
  function record() {
    var cv = st.canvases.main || makeCanvas();
    if (!window.MediaRecorder || !cv.captureStream) {
      App.toast('이 브라우저는 영상 녹화를 지원하지 않아요. PNG로 저장하거나 장면 PNG를 쓰세요.');
      return;
    }
    var mime = '';
    ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].forEach(function (m) {
      if (!mime && window.MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) mime = m;
    });
    if (!mime) { App.toast('지원되는 영상 형식이 없어요. PNG로 저장해 주세요.'); return; }

    var stream = cv.captureStream(30);
    var rec;
    try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6000000 }); }
    catch (e) { try { rec = new MediaRecorder(stream); } catch (e2) { App.toast('녹화를 시작하지 못했어요.'); return; } }
    var chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      var blob = new Blob(chunks, { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'lotto-' + balls().no + '-result.' + (mime.indexOf('mp4') !== -1 ? 'mp4' : 'webm');
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      App.toast('영상을 저장했어요. (길이 ' + st.dur + '초)');
    };
    st.playing = true;
    var ctx = cv.getContext('2d');
    var started = performance.now();
    var durMs = st.dur * 1000;
    rec.start(200);
    function frame() {
      var t = Math.min(1, (performance.now() - started) / durMs);
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawFrame(ctx, cv.width, cv.height, t);
      updateProgress(t);
      if (t < 1) requestAnimationFrame(frame);
      else {
        setTimeout(function () { try { rec.stop(); } catch (e) {} st.playing = false; paintStatic(); renderPreview(studioRoot); }, 300);
      }
    }
    requestAnimationFrame(frame);
    App.toast('녹화 중… ' + st.dur + '초 뒤에 저장됩니다.');
  }

  function play() {
    if (st.playing) { App.toast('이미 재생 중이에요.'); return; }
    var cv = st.canvases.main || makeCanvas();
    var ctx = cv.getContext('2d');
    var started = performance.now();
    var durMs = st.dur * 1000;
    st.playing = true;
    function frame() {
      var t = Math.min(1, (performance.now() - started) / durMs);
      ctx.clearRect(0, 0, cv.width, cv.height);
      drawFrame(ctx, cv.width, cv.height, t);
      updateProgress(t);
      if (t < 1) requestAnimationFrame(frame);
      else { st.playing = false; paintStatic(); renderPreview(studioRoot); }
    }
    requestAnimationFrame(frame);
  }
  function updateProgress(t) {
    var bar = studioRoot ? H.$('#lo-bar', studioRoot) : document.getElementById('lo-bar');
    if (bar) bar.style.width = Math.round(t * 100) + '%';
  }

  /* ---------------- 화면 ---------------- */
  App.register({
    id: 'lotto', emoji: '🎱', name: '로또 자판기', free: true, tag: '무료 · 콘텐츠',
    desc: '회차·당첨 줄을 고르면 당첨 결과 화면을 그리고 영상(WebM)으로 뽑습니다.',
    help: '회차를 고르면 실제 당첨번호가 들어오고, A~E 다섯 줄 중 어느 줄이 몇 등에 당첨될지 정할 수 있습니다. 화면은 1080×1920 세로 영상용으로 그려지고, 자막 효과·스타일·글꼴을 고른 뒤 15초 WebM 영상이나 PNG로 저장합니다. 번호 분석 탭은 조건에 맞는 5게임 번호 뽑기입니다.',
    render: function (root) {
      root.innerHTML =
        '<div class="panel" style="padding:0;overflow:hidden;margin-bottom:14px">' +
          '<div class="seg" style="border-radius:0;padding:5px 6px;background:#F7F7FB" id="lo-tabs">' +
            '<button type="button" class="' + (st.tab === 'studio' ? 'on' : '') + '" data-tab="studio">🎬 당첨 결과 화면</button>' +
            '<button type="button" class="' + (st.tab === 'pick' ? 'on' : '') + '" data-tab="pick">🔢 번호 분석</button>' +
          '</div>' +
        '</div>' +
        '<div id="lo-body"></div>';
      H.$('#lo-tabs', root).addEventListener('click', function (e) {
        var b = e.target.closest('[data-tab]'); if (!b) return;
        st.tab = b.getAttribute('data-tab');
        H.$$('#lo-tabs button', root).forEach(function (x) { x.classList.toggle('on', x === b); });
        paint(root);
      });
      paint(root);
    }
  });

  function paint(root) {
    var body = H.$('#lo-body', root);
    if (!body) return;
    if (st.tab === 'pick') renderPick(body);
    else renderStudio(body);
  }

  /* ---------------- 스튜디오 ---------------- */
  function renderStudio(body) {
    studioRoot = body;
    var r = current();
    var opts = DATA.map(function (x) {
      return '<option value="' + x.no + '"' + (x.no === Number(st.roundNo) ? ' selected' : '') + '>제' + x.no + '회 · ' + x.date + (x === DATA[0] ? ' (최근)' : '') + '</option>';
    }).join('');

    body.innerHTML =
      '<div class="cols">' +
        '<div class="stack">' +
          '<section class="stepcard"><div class="sh"><span class="sno">1</span>' +
            '<div><b>회차와 당첨 줄을 골라 주세요</b><span class="ss">고르면 다음 화면에서 실제 당첨번호로 미리보기를 보며 고칠 수 있어요.</span></div></div>' +
            '<div class="field"><label for="lo-round">회차 고르기</label><select id="lo-round">' + opts + '</select>' +
              '<p class="tip">최근 104회차(2년치) 데이터가 들어 있어요. 출처: 동행복권 공개 회차 결과.</p></div>' +
            '<div class="field"><label>당첨번호</label><div class="tkt" style="padding:11px 12px"><div class="win" style="margin-top:0">' +
              r.n.map(function (n) { return '<span class="ball2 ' + ballClass(n) + '">' + n + '</span>'; }).join('') +
              '<span style="color:#9C9CA8;font-weight:800">+</span><span class="ball2" style="background:#C9C9D6">' + r.b + '</span>' +
              '<span style="margin-left:auto;font-size:10.5px;color:var(--muted);font-weight:800">1등 ' + A.wonAuto(r.p[0]) + '</span>' +
            '</div></div>' +
            '<div class="actions" style="margin-top:8px"><button class="btn btn-sm btn-line" type="button" id="lo-manual">번호 직접 입력</button></div></div>' +
            '<div class="field" id="lo-manualbox" hidden><label for="lo-nums">당첨번호 6개 + 보너스</label>' +
              '<input id="lo-nums" type="text" placeholder="예: 1,5,18,23,27,28 / 보너스 8"><button class="btn btn-soft btn-block" type="button" id="lo-apply" style="margin-top:8px">적용</button></div>' +
            '<div class="field"><label>어떤 영상을 만들까요?</label><div class="seg" id="lo-mode">' +
              '<button type="button" class="' + (st.mode === 'result' ? 'on' : '') + '" data-mode="result">당첨 결과 화면</button>' +
              '<button type="button" class="' + (st.mode === 'analysis' ? 'on' : '') + '" data-mode="analysis">번호 분석</button>' +
            '</div></div>' +
          '</section>' +

          '<section class="stepcard"><div class="sh"><span class="sno">2</span>' +
            '<div><b>몇 번째 줄에서 당첨되게 나올까요?</b><span class="ss">줄마다 등수를 정하면 오른쪽에 금액이 표시됩니다.</span></div></div>' +
            '<div id="lo-rows" style="margin-top:12px"></div>' +
            '<div class="totalwin" id="lo-total"></div>' +
          '</section>' +

          '<section class="stepcard"><div class="sh"><span class="sno">3</span>' +
            '<div><b>화면 자막</b><span class="ss">영상 내내 고정돼요. 한두 줄이면 충분해요.</span></div></div>' +
            '<div class="field"><label for="lo-cap">자막</label><textarea id="lo-cap" style="min-height:64px">' + esc(st.caption) + '</textarea></div>' +
            '<div class="field"><label for="lo-dur">영상 길이</label><select id="lo-dur">' +
              [10, 15, 20, 30].map(function (d) { return '<option value="' + d + '"' + (st.dur === d ? ' selected' : '') + '>' + d + '초</option>'; }).join('') +
            '</select></div>' +
            '<div class="field"><label>효과</label><div class="chiprow" id="lo-eff" style="margin-top:0">' +
              CAPTION_EFFECTS.map(function (e) { return '<button class="chip' + (st.effect === e ? ' on' : '') + '" type="button" data-eff="' + e + '">' + e + '</button>'; }).join('') +
            '</div></div>' +
            '<div class="field"><label>스타일</label><div class="chiprow" id="lo-sty" style="margin-top:0">' +
              CAPTION_STYLES.map(function (e) { return '<button class="chip' + (st.cstyle === e ? ' on' : '') + '" type="button" data-sty="' + e + '">' + e + '</button>'; }).join('') +
            '</div></div>' +
            '<div class="field"><label>색깔</label><div class="swatches" id="lo-col">' +
              CAPTION_COLORS.map(function (c) { return '<button class="sw' + (st.ccolor === c ? ' on' : '') + '" type="button" data-col="' + c + '" style="background:' + c + '"></button>'; }).join('') +
            '</div></div>' +
            '<div class="field"><label>글꼴</label><div class="chiprow" id="lo-font" style="margin-top:0">' +
              CAPTION_FONTS.map(function (f) { return '<button class="chip' + (st.cfont === f ? ' on' : '') + '" type="button" data-font="' + f + '">' + f + '</button>'; }).join('') +
            '</div></div>' +
            '<div class="field"><label>크기</label><div class="setrow"><span class="lbl">자막</span><input type="range" id="lo-csize" min="56" max="130" step="4" value="' + st.csize + '"><span class="vl">' + st.csize + '</span></div></div>' +
          '</section>' +
        '</div>' +

        '<div class="stack">' +
          '<section class="panel"><h3>📱 화면 미리보기</h3>' +
            '<p class="psub">미리보기에서 끌어 옮기기 없이 슬라이더로 크기·위치를 맞춰요.</p>' +
            '<div id="lo-preview" style="display:flex;justify-content:center;margin-top:12px"></div>' +
            '<div class="meter" style="margin-top:10px"><i id="lo-bar" style="width:100%"></i></div>' +
            '<div class="setrow"><span class="lbl">크기</span><input type="range" id="lo-scale" min="80" max="120" step="2" value="' + st.scale + '"><span class="vl">' + st.scale + '%</span></div>' +
            '<div class="setrow"><span class="lbl">좌우</span><input type="range" id="lo-ox" min="-100" max="100" step="5" value="' + st.ox + '"><span class="vl">' + st.ox + '</span></div>' +
            '<div class="setrow"><span class="lbl">위아래</span><input type="range" id="lo-oy" min="-160" max="160" step="10" value="' + st.oy + '"><span class="vl">' + st.oy + '</span></div>' +
            '<div class="actions"><button class="btn btn-line" type="button" id="lo-play">▶ 미리보기 재생</button>' +
            '<button class="btn btn-primary" type="button" id="lo-video">영상 만들기</button></div>' +
            '<div class="actions"><button class="btn btn-ghost btn-sm" type="button" id="lo-png">화면 PNG 저장</button>' +
            '<button class="btn btn-ghost btn-sm" type="button" id="lo-subtitle">자막 시트 복사</button></div>' +
            '<p class="hint">영상은 WebM으로 저장돼요. 아이폰 사진첩에 넣으려면 파일 앱에서 열거나 PC에서 MP4로 변환해 주세요.</p>' +
          '</section>' +
        '</div>' +
      '</div>';

    renderRows(body);
    paintStatic();
    renderPreview(body);
    bindStudio(body);
  }

  var studioRoot = null;
  function renderPreview(root) {
    var host = H.$('#lo-preview', root || studioRoot || document);
    if (!host) return;
    var cv = st.canvases.main || makeCanvas();
    cv.style.cssText = 'width:100%;max-width:330px;height:auto;border-radius:14px;border:1px solid var(--line);background:#fff;display:block';
    if (host.firstChild !== cv) {
      host.innerHTML = '';
      host.appendChild(cv);
    }
  }

  function renderRows(body) {
    var box = H.$('#lo-rows', body);
    if (!box) return;
    var r = balls();
    box.innerHTML = st.rows.map(function (row, i) {
      var cells = RANKS.map(function (rk) {
        return '<button type="button" class="rb' + (row.rank === rk.k ? ' on' : '') + (rk.etc ? ' etc' : '') + '" data-row="' + i + '" data-rank="' + rk.k + '">' + rk.name + '</button>';
      }).join('');
      var amt = prizeOf(r, row.rank);
      return '<div class="rankrow' + (row.rank !== 'X' ? ' win' : '') + '"><span class="rl">' + row.key + '</span>' + cells +
        '<span class="ramt' + (amt ? '' : ' none') + '">' + (amt ? A.wonAuto(amt) : '낙첨') + '</span></div>';
    }).join('') + '<p class="hint">2등은 5개+보너스, 3등은 5개, 4등은 4개, 5등은 3개 일치로 표시됩니다.</p>';
    var total = totalPrize(r);
    var t = H.$('#lo-total', body);
    if (t) t.textContent = total ? '총 ' + A.won(total) + '원 당첨' : '아직 당첨 줄이 없어요';
  }

  function bindStudio(body) {
    H.$('#lo-round', body).addEventListener('change', function () {
      st.roundNo = Number(this.value);
      st.manual = false;
      var r = current();
      H.$('.tkt .win', body).innerHTML = r.n.map(function (n) { return '<span class="ball2 ' + ballClass(n) + '">' + n + '</span>'; }).join('') +
        '<span style="color:#9C9CA8;font-weight:800">+</span><span class="ball2" style="background:#C9C9D6">' + r.b + '</span>' +
        '<span style="margin-left:auto;font-size:10.5px;color:var(--muted);font-weight:800">1등 ' + A.wonAuto(r.p[0]) + '</span>';
      renderRows(body); paintStatic(); renderPreview(body);
    });
    H.$('#lo-manual', body).addEventListener('click', function () {
      var b = H.$('#lo-manualbox', body);
      b.hidden = !b.hidden;
    });
    H.$('#lo-apply', body).addEventListener('click', function () {
      var raw = H.$('#lo-nums', body).value;
      var nums = raw.split(/[^0-9]+/).filter(Boolean).map(Number).filter(function (n) { return n >= 1 && n <= 45; });
      if (nums.length < 7) { App.toast('번호 6개와 보너스 1개(총 7개)를 넣어 주세요.'); return; }
      st.manual = true;
      st.nums = nums.slice(0, 6).sort(function (a, b) { return a - b; });
      st.bonus = nums[6];
      renderRows(body); paintStatic(); renderPreview(body);
      App.toast('당첨번호를 적용했어요.');
    });
    H.$('#lo-mode', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]'); if (!b) return;
      st.mode = b.getAttribute('data-mode');
      H.$$('#lo-mode button', body).forEach(function (x) { x.classList.toggle('on', x === b); });
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-rows', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-rank]'); if (!b) return;
      var i = Number(b.getAttribute('data-row'));
      if (!st.rows[i]) return;
      st.rows[i].rank = b.getAttribute('data-rank');
      renderRows(body); paintStatic(); renderPreview(body);
    });
    H.$('#lo-cap', body).addEventListener('input', function () {
      st.caption = this.value;
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-dur', body).addEventListener('change', function () { st.dur = Number(this.value); });
    H.$('#lo-eff', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-eff]'); if (!b) return;
      st.effect = b.getAttribute('data-eff');
      H.$$('#lo-eff .chip', body).forEach(function (x) { x.classList.toggle('on', x === b); });
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-sty', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-sty]'); if (!b) return;
      st.cstyle = b.getAttribute('data-sty');
      H.$$('#lo-sty .chip', body).forEach(function (x) { x.classList.toggle('on', x === b); });
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-col', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-col]'); if (!b) return;
      st.ccolor = b.getAttribute('data-col');
      H.$$('#lo-col .sw', body).forEach(function (x) { x.classList.toggle('on', x === b); });
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-font', body).addEventListener('click', function (e) {
      var b = e.target.closest('[data-font]'); if (!b) return;
      st.cfont = b.getAttribute('data-font');
      H.$$('#lo-font .chip', body).forEach(function (x) { x.classList.toggle('on', x === b); });
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-csize', body).addEventListener('input', function () {
      st.csize = Number(this.value);
      this.parentNode.querySelector('.vl').textContent = st.csize;
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-scale', body).addEventListener('input', function () {
      st.scale = Number(this.value);
      this.parentNode.querySelector('.vl').textContent = st.scale + '%';
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-ox', body).addEventListener('input', function () {
      st.ox = Number(this.value);
      this.parentNode.querySelector('.vl').textContent = st.ox;
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-oy', body).addEventListener('input', function () {
      st.oy = Number(this.value);
      this.parentNode.querySelector('.vl').textContent = st.oy;
      paintStatic(); renderPreview(body);
    });
    H.$('#lo-play', body).addEventListener('click', play);
    H.$('#lo-video', body).addEventListener('click', record);
    H.$('#lo-png', body).addEventListener('click', function () {
      A.canvas.download(paintStatic(), 'lotto-' + balls().no + '-result.png');
      App.toast('화면 PNG를 저장했어요.');
    });
    H.$('#lo-subtitle', body).addEventListener('click', function () {
      var r = balls();
      var total = totalPrize(r);
      var lines = [
        '제' + r.no + '회 로또 6/45 당첨 결과',
        '당첨번호: ' + r.n.join(', ') + ' + ' + r.b,
        '1등 1인당: ' + A.won(r.p[0]) + '원',
        '',
        st.rows.map(function (row) {
          var nums = rowNumbers(r, row.key, row.rank);
          return row.key + '줄: ' + nums.join(', ') + ' — ' + rankInfo(row.rank).name + (row.rank !== 'X' ? ' (' + A.won(prizeOf(r, row.rank)) + '원)' : '');
        }).join('\n'),
        '',
        '총 당첨금: ' + A.won(total) + '원',
        '자막: ' + st.caption,
        (st.effect !== '효과 없음' ? '효과: ' + st.effect + ' / 스타일: ' + st.cstyle + ' / ' + st.cfont : ''),
        '',
        '※ 재미로 만든 화면입니다. 실제 당첨 여부는 동행복권에서 확인하세요.'
      ];
      App.copy(lines.join('\n'), this);
    });
  }

  /* ---------------- 번호 분석 (기존) ---------------- */
  function parseNums(text) {
    var raw = String(text || '').split(/[^0-9]+/).filter(Boolean), out = [], seen = {};
    raw.forEach(function (r) {
      var n = parseInt(r, 10);
      if (n >= 1 && n <= 45 && !seen[n]) { seen[n] = 1; out.push(n); }
    });
    return out;
  }
  function drawOnce(fixed, excluded, useOdd, useHigh) {
    var taken = {}, pool = [], i;
    fixed.concat(excluded).forEach(function (v) { taken[v] = 1; });
    for (i = 1; i <= 45; i++) if (!taken[i]) pool.push(i);
    for (var attempt = 0; attempt < 600; attempt++) {
      var bag = H.shuffle(pool), pick = fixed.slice();
      for (i = 0; i < bag.length && pick.length < 6; i++) pick.push(bag[i]);
      if (pick.length < 6) return null;
      pick.sort(function (a, b) { return a - b; });
      var odd = pick.filter(function (v) { return v % 2 === 1; }).length;
      var low = pick.filter(function (v) { return v <= 22; }).length;
      if (useOdd && (odd < 2 || odd > 4)) continue;
      if (useHigh && (low < 2 || low > 4)) continue;
      return pick;
    }
    return null;
  }

  function renderPick(body) {
    body.innerHTML =
      '<div class="cols">' +
        '<div class="stack">' +
          '<section class="panel"><h3>🔢 번호 뽑기</h3>' +
            '<div class="row2"><div class="field"><label for="lo-fixed">고정수 <span class="muted small">(최대 5)</span></label><input id="lo-fixed" type="text" placeholder="예: 7, 21"></div>' +
            '<div class="field"><label for="lo-ex">제외수</label><input id="lo-ex" type="text" placeholder="예: 13, 44"></div></div>' +
            '<div class="field"><label>밸런스 필터</label><div class="chiprow" style="margin-top:0">' +
              '<button class="chip on" type="button" id="lo-odd">홀짝 균형 (2~4)</button>' +
              '<button class="chip on" type="button" id="lo-high">고저 균형 (2~4)</button>' +
            '</div></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="lo-run">5게임 뽑기</button></div>' +
            '<p class="hint">재미용 번호입니다. 당첨을 보장하지 않아요.</p>' +
          '</section>' +
          '<section class="panel"><h3>📜 최근 이력 <span class="pill" id="lo-hcount">0</span></h3>' +
            '<div class="actions" style="margin-top:10px"><button class="btn btn-ghost btn-sm" type="button" id="lo-clear">이력 전체 삭제</button></div>' +
            '<div id="lo-hist" style="margin-top:10px"></div>' +
          '</section>' +
        '</div>' +
        '<div class="stack"><section class="panel"><h3>🎉 이번 추첨 <span class="pill" id="lo-round">—</span></h3>' +
          '<div id="lo-games" style="margin-top:12px"><div class="empty"><b>아직 뽑은 번호가 없어요</b>왼쪽에서 조건을 정하고 5게임 뽑기를 눌러 주세요.</div></div>' +
          '<div class="actions"><button class="btn btn-soft" type="button" id="lo-copy">번호 복사</button>' +
          '<button class="btn btn-line" type="button" id="lo-save">이력에 저장</button></div>' +
        '</section></div>' +
      '</div>';

    var el = {
      fixed: H.$('#lo-fixed', body), ex: H.$('#lo-ex', body), odd: H.$('#lo-odd', body), high: H.$('#lo-high', body),
      games: H.$('#lo-games', body), hist: H.$('#lo-hist', body)
    };
    var ps = { round: 0, games: [], saved: false };

    function toggle(btn) { btn.classList.toggle('on'); }
    el.odd.addEventListener('click', function () { toggle(el.odd); });
    el.high.addEventListener('click', function () { toggle(el.high); });

    function ballsHtml(nums) {
      return nums.map(function (n) { return '<span class="ball2 ' + ballClass(n) + '" style="width:36px;height:36px;font-size:13px">' + n + '</span>'; }).join('');
    }
    function renderHist() {
      var hist = S.get('lotto.history', []);
      H.$('#lo-hcount', body).textContent = hist.length;
      if (!hist.length) { el.hist.innerHTML = '<p class="psub">저장된 이력이 없습니다.</p>'; return; }
      el.hist.innerHTML = hist.slice(0, 10).map(function (h) {
        return '<div class="tkt" style="margin-top:8px;padding:11px 12px"><div class="th"><b>' + esc(h.at) + '</b>' +
          '<button class="btn btn-sm btn-danger" type="button" data-hdel="' + esc(h.id) + '">삭제</button></div>' +
          h.games.map(function (g) { return '<div class="win" style="margin-top:6px">' + ballsHtml(g) + '</div>'; }).join('') + '</div>';
      }).join('');
    }
    function run() {
      var fixed = parseNums(el.fixed.value), excluded = parseNums(el.ex.value);
      if (fixed.length > 5) { App.toast('고정수는 5개까지 가능해요.'); return; }
      var conflict = fixed.filter(function (n) { return excluded.indexOf(n) !== -1; });
      if (conflict.length) { App.toast('고정수와 제외수가 겹칩니다: ' + conflict.join(', ')); return; }
      if (6 - fixed.length > 45 - fixed.length - excluded.length) { App.toast('제외수가 너무 많아 6개를 채울 수 없어요.'); return; }
      var useOdd = el.odd.classList.contains('on'), useHigh = el.high.classList.contains('on');
      var games = [], seen = {};
      for (var i = 0; i < 5; i++) {
        var g = null;
        for (var guard = 0; guard < 40; guard++) {
          g = drawOnce(fixed, excluded, useOdd, useHigh);
          if (!g) break;
          if (!seen[g.join('-')]) break;
        }
        if (!g) { App.toast('조건이 너무 빡빡해서 5게임을 채우지 못했어요.'); return; }
        seen[g.join('-')] = 1; games.push(g);
      }
      ps.games = games; ps.saved = false; ps.round++;
      H.$('#lo-round', body).textContent = ps.round + '회';
      el.games.innerHTML = games.map(function (g, idx) {
        return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line-2)">' +
          '<span style="width:20px;font-size:11px;font-weight:800;color:var(--muted)">' + (idx + 1) + '</span>' +
          '<span class="win" style="margin-top:0">' + ballsHtml(g) + '</span></div>';
      }).join('');
      App.toast('5게임을 뽑았어요!');
    }

    H.$('#lo-run', body).addEventListener('click', run);
    H.$('#lo-copy', body).addEventListener('click', function () {
      if (!ps.games.length) { App.toast('먼저 번호를 뽑아 주세요.'); return; }
      App.copy(ps.games.map(function (g, i) {
        return '[' + (i + 1) + '게임] ' + g.map(function (n) { return (n < 10 ? '0' : '') + n; }).join('  ');
      }).join('\n'), this);
    });
    H.$('#lo-save', body).addEventListener('click', function () {
      if (!ps.games.length) { App.toast('먼저 번호를 뽑아 주세요.'); return; }
      if (ps.saved) { App.toast('이미 저장한 회차예요.'); return; }
      var hist = S.get('lotto.history', []);
      hist.unshift({ id: H.uid('l'), at: H.nowStamp(), games: ps.games });
      S.set('lotto.history', hist.slice(0, 30));
      ps.saved = true; renderHist(); App.toast('이력에 저장했어요.');
    });
    el.hist.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hdel]'); if (!b) return;
      S.set('lotto.history', S.get('lotto.history', []).filter(function (h) { return h.id !== b.getAttribute('data-hdel'); }));
      renderHist(); App.toast('이력을 삭제했어요.');
    });
    H.$('#lo-clear', body).addEventListener('click', function () {
      if (!window.confirm('저장된 이력을 모두 지울까요?')) return;
      S.set('lotto.history', []); renderHist(); App.toast('이력을 비웠어요.');
    });
    renderHist();
  }
})();
