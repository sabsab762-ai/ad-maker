/* =====================================================================
   Module 2 · 📸 인스타 캐러셀 사진 자판기 (블로그 글 → 카드뉴스)
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, S = App.store, esc = App.esc, A = App.ads;

  var RATIOS = {
    '1:1': { w: 1080, h: 1080, name: '1:1' },
    '4:5': { w: 1080, h: 1350, name: '4:5' },
    '3:4': { w: 1080, h: 1440, name: '3:4' },
    '9:16': { w: 1080, h: 1920, name: '9:16' },
    'orig': { w: 1080, h: 1350, name: '원본' }
  };
  var STYLES = [
    { k: 'card', name: '카드뉴스', bg: '#FBF7F2', card: '#FFFFFF', fg: '#191920', sub: '#6D6D7A', accent: '#FF6F0F', deco: 'card' },
    { k: 'basic', name: '기본', bg: '#141418', card: '#141418', fg: '#FFFFFF', sub: 'rgba(255,255,255,.68)', accent: '#B9A6FF', deco: 'none' },
    { k: 'clean', name: '깔끔', bg: '#FFFFFF', card: '#FFFFFF', fg: '#17171B', sub: '#6D6D7A', accent: '#17171B', deco: 'line' },
    { k: 'hand', name: '손글씨', bg: '#FFF8E7', card: '#FFF8E7', fg: '#4A3218', sub: '#8A7355', accent: '#E0574F', deco: 'hand' },
    { k: 'yellow', name: '노랑 강조', bg: '#FFFFFF', card: '#FFFFFF', fg: '#17171B', sub: '#5A5A66', accent: '#FFE24B', deco: 'marker' }
  ];
  var FONTS = [
    { k: 'pretendard', name: '프리텐다드', css: 'Pretendard, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif' },
    { k: 'black', name: '검은고딕', css: '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif' },
    { k: 'dohyeon', name: '도현', css: '"BM Dohyeon", "Black Han Sans", "Malgun Gothic", sans-serif' },
    { k: 'jua', name: '주아', css: '"BM Jua", "Jua", "Apple SD Gothic Neo", sans-serif' },
    { k: 'hand', name: '개구(손글씨)', css: '"Nanum Pen Script", "Segoe Script", "Snell Roundhand", cursive' },
    { k: 'nanum', name: '나눔(손글씨)', css: '"Nanum Brush Script", "Nanum Pen Script", cursive' }
  ];
  var ACCENTS = ['#FF6F0F', '#17171B', '#FFD43B', '#FF4D6D', '#7C5CFF', '#2F6BFF', '#12A17A', '#FF8FC7', '#8C8C99', '#E0574F'];

  var st = {
    blogTitle: '', blogBody: '', kind: 'info', situation: '',
    ratio: '4:5', photos: [], mode: 'both', count: 8,
    styleKey: 'card', accent: '#FF6F0F', fontKey: 'pretendard', scale: 100,
    titleColor: '', bodyColor: '', borderColor: '', borderWidth: 0, shadow: false,
    slides: [], canvases: [], cur: 0, product: null, handle: '@my_brand'
  };

  function fontCss(k) {
    var f = FONTS.filter(function (x) { return x.k === k; })[0];
    return (f || FONTS[0]).css;
  }
  function style() {
    return STYLES.filter(function (x) { return x.k === st.styleKey; })[0] || STYLES[0];
  }

  /* --------------- 문장 → 슬라이드 --------------- */
  function planSlides() {
    var title = st.blogTitle.trim() || (st.product ? st.product.title : '카드뉴스');
    var body = st.blogBody.trim();
    var sentences = [];
    body.split(/\n+/).forEach(function (l) {
      var v = A.trimPunct(l);
      if (!v) return;
      if (v.length <= 70) { sentences.push(v); return; }
      var parts = v.split(/([.!?。])\s*/);
      for (var pi = 0; pi < parts.length; pi++) {
        var piece = A.trimPunct(parts[pi]);
        if (piece.length >= 6) sentences.push(piece);
      }
    });
    if (!sentences.length && st.product) sentences = (st.product.benefits || []).slice();
    if (!sentences.length) sentences = ['상세페이지 내용이나 블로그 글을 넣으면 문장을 나눠 카드로 만듭니다.'];

    var n = Math.max(3, Math.min(10, st.count));
    var bodies = n - 2;
    var per = Math.max(1, Math.ceil(sentences.length / bodies));
    var priceToken = st.product && st.product.price ? st.product.price : '';
    var slides = [];

    var coverHead = title;
    if (priceToken && coverHead.indexOf(priceToken) === -1 && coverHead.length < 34) coverHead = coverHead + '\n' + priceToken;
    slides.push({
      kind: 'cover',
      eyebrow: st.kind === 'case' ? 'REAL CASE' : 'CARD NEWS',
      head: coverHead,
      sub: st.situation ? A.cut(st.situation, 60) : (st.product && st.product.benefits[0] ? A.cut(st.product.benefits[0], 54) : '끝까지 보면 정리가 됩니다')
    });

    for (var i = 0; i < bodies; i++) {
      var chunk = sentences.slice(i * per, (i + 1) * per);
      var head = chunk[0] || (st.product && st.product.points ? (st.product.points[i % st.product.points.length] || {}).title : '') || '핵심 정리';
      var rest = chunk.slice(1).join(' ');
      if (!rest && st.product && st.product.points) {
        var pt = st.product.points[i % st.product.points.length];
        rest = pt ? pt.desc : '';
      }
      slides.push({
        kind: 'body', no: i + 1,
        head: A.cut(head, 52),
        text: A.cut(rest || (chunk[0] && chunk[0] !== head ? chunk[0] : ''), 130)
      });
    }

    slides.push({
      kind: 'cta',
      head: st.kind === 'case' ? '같은 고민이었다면\n한 번 확인해 보세요' : '저장해 두고\n필요할 때 다시 보기',
      sub: (priceToken ? priceToken + '\n' : '') + (st.product && st.product.url ? A.domainOf(st.product.url) + ' 에서 확인' : '자세한 조건은 프로필 링크에서')
    });
    slides.forEach(function (s, i) { s.index = i; s.total = slides.length; });
    return slides;
  }

  /* --------------- 그리기 --------------- */
  function ratioSize() {
    if (st.ratio === 'orig') {
      var im = st.photos[0];
      if (im && im.width && im.height) {
        var w = 1080, h = Math.round(1080 * im.height / im.width);
        if (h > 1920) { h = 1920; }
        if (h < 1080) h = 1080;
        return { w: w, h: h };
      }
      return { w: 1080, h: 1350 };
    }
    return RATIOS[st.ratio] || RATIOS['4:5'];
  }

  function paintSlide(slide, opt) {
    opt = opt || {};
    var size = ratioSize();
    var W = size.w, Hh = size.h;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = Hh;
    var ctx = cv.getContext('2d');
    var C = A.canvas, sy = style();
    var padX = Math.round(W * 0.082);
    var fam = fontCss(st.fontKey);
    var scale = st.scale / 100;
    var accent = st.accent || sy.accent;
    var titleCol = st.titleColor || sy.fg;
    var bodyCol = st.bodyColor || sy.fg;
    var photo = opt.photo || null;
    var usePhoto = photo && (slide.kind !== 'cta');

    /* 배경 */
    if (sy.deco === 'card') {
      ctx.fillStyle = sy.bg; ctx.fillRect(0, 0, W, Hh);
      var cg = ctx.createLinearGradient(0, 0, W, Hh);
      cg.addColorStop(0, A.canvas.hexA(accent, 0.10)); cg.addColorStop(1, A.canvas.hexA(sy.bg, 0));
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, Hh);
    } else if (sy.deco === 'hand') {
      ctx.fillStyle = sy.bg; ctx.fillRect(0, 0, W, Hh);
      ctx.strokeStyle = A.canvas.hexA('#C9B48F', 0.35);
      ctx.lineWidth = 2;
      for (var gy = 120; gy < Hh; gy += 64) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    } else {
      ctx.fillStyle = sy.bg; ctx.fillRect(0, 0, W, Hh);
    }

    /* 사진 영역 */
    var textTop = padX + 90, textBottom = Hh - 180;
    if (usePhoto) {
      var ph;
      if (slide.kind === 'cover') {
        ph = { x: 0, y: 0, w: W, h: Math.round(Hh * 0.58) };
      } else {
        ph = { x: padX, y: padX, w: W - padX * 2, h: Math.round(Hh * 0.36) };
        if (sy.deco === 'card') {
          ctx.save(); ctx.shadowColor = 'rgba(20,20,40,.12)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 8;
          ctx.fillStyle = '#fff'; C.roundRect(ctx, ph.x, ph.y, ph.w, ph.h, 30); ctx.fill(); ctx.restore();
        }
      }
      ctx.save();
      if (slide.kind === 'cover') {
        C.cover(ctx, photo, ph.x, ph.y, ph.w, ph.h);
        var og = ctx.createLinearGradient(0, ph.h * 0.35, 0, ph.h);
        og.addColorStop(0, 'rgba(0,0,0,0)'); og.addColorStop(1, 'rgba(0,0,0,.45)');
        ctx.fillStyle = og; ctx.fillRect(0, ph.h * 0.35, W, ph.h * 0.65);
      } else {
        C.roundRect(ctx, ph.x, ph.y, ph.w, ph.h, 30);
        ctx.clip();
        C.cover(ctx, photo, ph.x, ph.y, ph.w, ph.h);
      }
      ctx.restore();
      if (slide.kind === 'cover') textTop = ph.h + 54;
      else textTop = ph.y + ph.h + 58;
    }

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    /* 상단 표시 */
    if (slide.kind === 'cover') {
      var eyebrowOnPhoto = usePhoto;
      ctx.font = '800 ' + Math.round(30 * scale) + 'px ' + fam;
      ctx.fillStyle = eyebrowOnPhoto ? 'rgba(255,255,255,.92)' : accent;
      ctx.fillText(slide.eyebrow || 'CARD NEWS', padX, padX);
    } else {
      ctx.font = '800 ' + Math.round(30 * scale) + 'px ' + fam;
      ctx.fillStyle = sy.deco === 'marker' ? '#6D6D7A' : accent;
      ctx.fillText(('0' + (slide.index + 1)).slice(-2) + ' / ' + ('0' + slide.total).slice(-2), padX, padX);
      if (sy.deco === 'line') {
        ctx.strokeStyle = A.canvas.hexA(sy.fg, .18); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(padX, padX + 52); ctx.lineTo(W - padX, padX + 52); ctx.stroke();
      }
    }

    /* 제목 */
    function drawHead(text, top, maxSize, minSize, color, maxLines) {
      var size = Math.round(maxSize * scale);
      var lines;
      do {
        ctx.font = '800 ' + size + 'px ' + fam;
        lines = C.wrap(ctx, text, W - padX * 2);
        if (lines.length <= (maxLines || 5)) break;
        size -= 4;
      } while (size > Math.round(minSize * scale));
      ctx.font = '800 ' + size + 'px ' + fam;
      if (st.shadow) { ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; }
      ctx.fillStyle = color;
      var lh = Math.round(size * 1.22);
      var yy = top;
      for (var i = 0; i < Math.min(lines.length, maxLines || 5); i++) {
        var line = lines[i];
        /* 노랑 강조 스타일이면 첫 줄 배경에 형광펜 */
        if (sy.deco === 'marker' && i === 0) {
          var lw = ctx.measureText(line).width;
          ctx.save();
          ctx.fillStyle = accent;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(padX - 8, yy + lh * 0.12, lw + 16, lh * 0.76);
          ctx.restore();
          ctx.fillStyle = color;
        }
        if (sy.deco === 'card' && i === 0 && slide.kind !== 'cover') {
          /* 카드뉴스: 제목 위 짧은 악센트 바 */
        }
        C.drawRichLine(ctx, line, padX, yy, accent, 4);
        yy += lh;
      }
      return { y: yy, size: size, lines: Math.min(lines.length, maxLines || 5) };
    }

    var afterHead;
    if (slide.kind === 'cover') {
      var blockTop = Math.max(textTop, Math.round(Hh * (usePhoto ? 0.64 : 0.30)));
      var maxHead = usePhoto ? 86 : 104;
      var r1 = drawHead(slide.head, blockTop, maxHead, 52, titleCol, 4);
      if (sy.deco === 'line') {
        ctx.strokeStyle = A.canvas.hexA(sy.fg, .8); ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(padX, blockTop - 30); ctx.lineTo(padX + 88, blockTop - 30); ctx.stroke();
      }
      afterHead = r1.y + 26;
      if (slide.sub) {
        ctx.font = '600 ' + Math.round(38 * scale) + 'px ' + fam;
        ctx.fillStyle = usePhoto ? 'rgba(255,255,255,.85)' : sy.sub;
        var sl = C.wrap(ctx, slide.sub, W - padX * 2);
        afterHead = C.drawLines(ctx, sl, padX, afterHead, Math.round(52 * scale), 3);
      }
    } else if (slide.kind === 'cta') {
      var ctop = Math.round(Hh * 0.34);
      var r2 = drawHead(slide.head, ctop, 96, 52, titleCol, 4);
      afterHead = r2.y + 34;
      ctx.font = '600 ' + Math.round(38 * scale) + 'px ' + fam;
      ctx.fillStyle = sy.sub;
      var cl = C.wrap(ctx, slide.sub || '', W - padX * 2);
      afterHead = C.drawLines(ctx, cl, padX, afterHead, Math.round(56 * scale), 3);
      /* 프로필 칩 */
      ctx.font = '800 ' + Math.round(32 * scale) + 'px ' + fam;
      var handle = String(st.handle || '@my_brand');
      var hw = ctx.measureText(handle).width + 64;
      ctx.fillStyle = accent;
      C.roundRect(ctx, padX, Hh - 190, hw, 74, 37); ctx.fill();
      ctx.fillStyle = (st.styleKey === 'yellow' || st.styleKey === 'clean') ? '#17171B' : '#FFF';
      ctx.fillText(handle, padX + 32, Hh - 170);
    } else {
      var r3 = drawHead(slide.head, textTop, 82, 44, titleCol, 4);
      afterHead = r3.y + 24;
      if (slide.text) {
        ctx.font = '500 ' + Math.round(36 * scale) + 'px ' + fam;
        ctx.fillStyle = bodyCol === sy.fg ? sy.sub : bodyCol;
        var bl = C.wrap(ctx, slide.text, W - padX * 2);
        afterHead = C.drawLines(ctx, bl, padX, afterHead, Math.round(54 * scale), 6);
      }
      /* 본문 카드 배경(카드뉴스) */
      if (sy.deco === 'card' && !usePhoto) {
        var box = { x: padX - 8, y: textTop - 34, w: W - padX * 2 + 16, h: Math.min(Hh - 240, afterHead - textTop + 70) };
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.shadowColor = 'rgba(20,20,40,.10)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
        ctx.fillStyle = '#FFFFFF';
        C.roundRect(ctx, box.x, box.y, box.w, box.h, 34); ctx.fill();
        ctx.restore();
      }
    }

    /* 테두리 */
    if (st.borderWidth > 0) {
      ctx.strokeStyle = st.borderColor || '#17171B';
      ctx.lineWidth = st.borderWidth;
      ctx.strokeRect(st.borderWidth / 2, st.borderWidth / 2, W - st.borderWidth, Hh - st.borderWidth);
    }

    /* 푸터 */
    ctx.font = '700 ' + Math.round(26 * scale) + 'px ' + fam;
    ctx.fillStyle = (usePhoto && slide.kind === 'cover') ? 'rgba(255,255,255,.7)' : A.canvas.hexA(sy.fg === '#FFFFFF' ? '#FFFFFF' : '#17171B', .38);
    ctx.textAlign = 'left';
    ctx.fillText(String(st.handle || ''), padX, Hh - 62);
    ctx.textAlign = 'right';
    ctx.fillText(String(slide.index + 1) + ' / ' + String(slide.total), W - padX, Hh - 62);
    ctx.textAlign = 'left';

    return cv;
  }

  /* --------------- 미리보기 / 저장 --------------- */
  function build() {
    st.slides = planSlides();
    st.cur = 0;
    redraw();
  }
  function redraw() {
    var total = st.slides.length;
    st.canvases = st.slides.map(function (s, i) {
      var photo = st.photos.length && st.mode !== 'text' ? st.photos[i % st.photos.length] : null;
      return paintSlide(s, { photo: photo });
    });
    renderPreview();
  }

  var els = {};

  function renderPreview() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#in-preview', right);
    if (!box) return;
    if (!st.canvases.length) {
      box.innerHTML = '<div class="empty"><b>아직 만든 카드뉴스가 없어요</b>왼쪽에 글을 넣고 <b>캐러셀 만들기</b>를 눌러 주세요.</div>';
      return;
    }
    var cur = st.cur;
    box.innerHTML =
      '<div style="display:flex;justify-content:center"><img src="' + st.canvases[cur].toDataURL('image/png') + '" alt="' + (cur + 1) + '번 슬라이드" ' +
        'style="max-width:100%;max-height:520px;border-radius:12px;border:1px solid var(--line);background:#fff"></div>' +
      '<div class="actions" style="justify-content:center">' +
        '<button class="btn btn-line btn-sm" type="button" data-nav="-1">← 이전</button>' +
        '<span class="tag">' + (cur + 1) + ' / ' + st.canvases.length + '</span>' +
        '<button class="btn btn-line btn-sm" type="button" data-nav="1">다음 →</button>' +
        '<button class="btn btn-soft btn-sm" type="button" data-savecur="1">이 장 저장</button>' +
      '</div>' +
      '<p class="hint" style="text-align:center">' + st.canvases[cur].width + ' × ' + st.canvases[cur].height + ' PNG · 슬라이드 ' + st.canvases.length + '장</p>';
  }

  function renderStrip() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#in-strip', right);
    if (!box) return;
    if (!st.canvases.length) { box.innerHTML = ''; return; }
    box.innerHTML = st.canvases.map(function (cv, i) {
      return '<div class="shot" data-shot="' + i + '" style="cursor:pointer' + (i === st.cur ? ';outline:2px solid var(--violet)' : '') + '">' +
        '<img src="' + cv.toDataURL('image/png') + '" alt="' + (i + 1) + '번">' +
        '<div class="cap"><span>' + (i + 1) + '</span></div></div>';
    }).join('');
  }

  function renderStrip() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#in-strip', right);
    if (!box) return;
    if (!st.canvases.length) { box.innerHTML = ''; return; }
    box.innerHTML = st.canvases.map(function (cv, i) {
      return '<div class="shot" data-shot="' + i + '" style="cursor:pointer' + (i === st.cur ? ';outline:2px solid var(--violet)' : '') + '">' +
        '<img src="' + cv.toDataURL('image/png') + '" alt="' + (i + 1) + '번">' +
        '<div class="cap"><span>' + (i + 1) + '</span></div></div>';
    }).join('');
  }

  function renderCaption() {
    var right = els.right;
    if (!right) return;
    var box = H.$('#in-cap', right);
    if (!box || !st.slides.length) return;
    var tags = ['#카드뉴스', '#인스타카드뉴스', '#' + (st.product ? String(st.product.category).replace(/[·\s]/g, '') : '정보공유'), '#저장각'];
    var lines = ['📌 ' + A.trimPunct(st.blogTitle || (st.product ? st.product.title : '카드뉴스'))];
    var points = (st.product && st.product.points || []).slice(0, 3);
    if (points.length) {
      lines.push('');
      points.forEach(function (x, i) { lines.push((i + 1) + '. ' + x.title); });
    }
    lines.push('', '도움이 됐다면 저장 · 공유해 주세요.', '궁금한 점은 댓글로 남겨 주세요 🙌', '', tags.join(' '));
    if (st.handle) lines.push('', st.handle);
    box.textContent = lines.join('\n');
  }

  /* --------------- 화면 --------------- */
  App.register({
    id: 'insta', emoji: '📸', name: '인스타 캐러셀 사진 자판기', free: false, tag: '이미지',
    desc: '블로그 글·상세페이지를 넣으면 사진 카드뉴스로. 비율·글꼴·강조색까지 조절.',
    help: '블로그 글을 넣거나 상품 보관함에서 불러오면 표지·본문·CTA 슬라이드를 자동으로 나눠 1080px PNG로 만들어 줍니다. 사진 비율(1:1·4:5·3:4·9:16), 글자 모양(카드뉴스·기본·깔끔·손글씨·노랑 강조), 강조색·글꼴·크기·테두리·그림자를 조절하고 장마다 저장할 수 있습니다.',
    render: function (root) {
      st.slides = []; st.canvases = []; st.photos = []; st.cur = 0;
      var saved = A.products.list();
      var pickId = S.get('pick', null);
      if (pickId) {
        S.del('pick');
        var p = A.products.get(pickId);
        if (p) {
          st.product = p;
          st.blogTitle = p.title;
          st.blogBody = (p.benefits || []).concat((p.points || []).map(function (x) { return x.desc; })).join('\n');
          st.situation = (p.personas[0] || {}).desc || '';
        }
      }

      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack" id="in-left"></div>' +
          '<div class="stack" id="in-right"></div>' +
        '</div>';
      els.left = H.$('#in-left', root);
      els.right = H.$('#in-right', root);

      els.left.innerHTML =
        '<section class="stepcard"><div class="sh"><span class="sno">1</span>' +
          '<div><b>블로그 글</b><span class="ss">글을 넣으면 문장을 나눠 슬라이드로 만듭니다. 상품 보관함에서 불러와도 돼요.</span></div></div>' +
          '<div class="field"><label for="in-load">전에 분석한 상품 불러오기</label><select id="in-load">' + A.products.options('', '상품 불러오기') + '</select></div>' +
          '<div class="field"><label for="in-btitle">글 제목</label><input id="in-btitle" type="text" placeholder="예: 정비소에서 타이어 견적 받고 놀란 이유" value="' + esc(st.blogTitle) + '"></div>' +
          '<div class="field"><label for="in-bbody">글 내용</label><textarea id="in-bbody" style="min-height:150px" placeholder="블로그 글을 그대로 붙여넣으세요. 문단마다 카드가 됩니다.">' + esc(st.blogBody) + '</textarea></div>' +
          '<div class="field"><label>글 성격</label><div class="seg" id="in-kind">' +
            '<button type="button" class="' + (st.kind === 'info' ? 'on' : '') + '" data-kind="info">정보 정리</button>' +
            '<button type="button" class="' + (st.kind === 'case' ? 'on' : '') + '" data-kind="case">고객 사례</button>' +
          '</div><p class="tip">고객 사례는 경험담 톤으로 표지·마지막 장 문구가 바뀝니다.</p></div>' +
          '<div class="field"><label for="in-sit">고객 상황 <span class="muted small">(비우면 자동)</span></label><textarea id="in-sit" style="min-height:64px" placeholder="예: 월급 250만 원, 카드빚 4천만 원인 30대 직장인">' + esc(st.situation) + '</textarea></div>' +
        '</section>' +

        '<section class="stepcard"><div class="sh"><span class="sno">2</span>' +
          '<div><b>사진</b><span class="ss">여러 장 올리면 슬라이드마다 번갈아 깔립니다. 최대 10장.</span></div></div>' +
          '<div class="field"><label>사진 비율</label><div class="chiprow" id="in-ratio" style="margin-top:0">' +
            Object.keys(RATIOS).map(function (k) {
              return '<button class="chip' + (st.ratio === k ? ' on' : '') + '" type="button" data-ratio="' + k + '">' + RATIOS[k].name + '</button>';
            }).join('') +
          '</div></div>' +
          '<div class="field"><label>사진 올리기</label>' +
            '<div class="actions" style="margin-top:0"><label class="btn btn-line" for="in-photos" style="cursor:pointer">🖼 사진 올리기</label>' +
            '<input id="in-photos" type="file" accept="image/*" multiple hidden>' +
            (st.photos.length ? '<button class="btn btn-ghost" type="button" id="in-photoclr">비우기</button>' : '') + '</div>' +
            '<p class="tip">JPG · PNG · WEBP. 없으면 글자만으로도 만들 수 있어요.</p>' +
            (st.photos.length ? '<div class="hint">' + st.photos.length + '장 올림</div>' : '') +
          '</div>' +
          '<div class="field"><label>만들기 방식</label><div class="seg" id="in-mode">' +
            '<button type="button" class="' + (st.mode === 'both' ? 'on' : '') + '" data-mode="both">사진 + 문구</button>' +
            '<button type="button" class="' + (st.mode === 'text' ? 'on' : '') + '" data-mode="text">문구만</button>' +
          '</div></div>' +
          '<div class="field"><label for="in-count">글 장 수 <span class="muted small">(표지·마지막 장 포함)</span></label>' +
            '<select id="in-count">' + [5, 6, 7, 8, 9, 10].map(function (n) { return '<option value="' + n + '"' + (st.count === n ? ' selected' : '') + '>' + n + '장</option>'; }).join('') + '</select></div>' +
          '<div class="field"><label for="in-handle">계정 핸들</label><input id="in-handle" type="text" placeholder="@my_brand" value="' + esc(st.handle) + '"></div>' +
          '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="in-run">' +
            (st.mode === 'text' ? '카드뉴스 만들기' : '캐러셀 ' + st.count + '장 만들기') + '</button></div>' +
        '</section>' +

        '<section class="stepcard" id="in-stylehost"></section>';

      els.right.innerHTML =
        '<section class="panel"><h3>🖼 미리보기</h3><div id="in-preview" style="margin-top:12px">' +
          '<div class="empty"><b>아직 만든 카드뉴스가 없어요</b>왼쪽에 글을 넣고 캐러셀 만들기를 눌러 주세요.</div></div>' +
          '<div class="shots" id="in-strip" style="margin-top:12px"></div>' +
          '<div class="actions"><button class="btn btn-primary" type="button" id="in-all">이미지 전체 다운로드</button>' +
          '<button class="btn btn-ghost" type="button" id="in-again">같은 설정으로 다시</button></div>' +
        '</section>' +
        '<section class="panel"><h3>✍️ 인스타 캡션</h3>' +
          '<div class="cardout" style="margin-top:10px"><div class="ch"><span class="t">캡션 + 해시태그</span>' +
          '<button class="btn btn-sm btn-soft" type="button" id="in-capcopy">복사</button></div>' +
          '<div class="cb" id="in-cap">카드뉴스를 만들면 캡션도 함께 만들어집니다.</div></div>' +
        '</section>';

      renderStylePanel();
      bindAll(root);

      if (st.product) { build(); App.toast('“' + A.cut(st.product.title, 16) + '”을 불러왔어요. 글을 확인하고 만들어 보세요.'); }
      else { renderCaption(); }
    }
  });

  function renderStylePanel() {
    var host = H.$('#in-stylehost', els.left);
    if (!host) return;
    host.innerHTML = '<div class="sh"><span class="sno">5</span>' +
      '<div><b>글자 모양</b><span class="ss">카드 느낌·강조색·글꼴·크기를 조절하면 미리보기에 바로 반영됩니다.</span></div></div>' +
      '<div class="field"><label>스타일</label><div class="chiprow" id="in-styles" style="margin-top:0">' +
        STYLES.map(function (s) { return '<button class="chip' + (st.styleKey === s.k ? ' on' : '') + '" type="button" data-style="' + s.k + '">' + s.name + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="field"><label>강조색 <span class="muted small">(*별표*로 감싼 글자에 칠해져요)</span></label>' +
        '<div class="swatches" id="in-accent">' + ACCENTS.map(function (c) { return '<button class="sw' + (st.accent === c ? ' on' : '') + '" type="button" data-accent="' + c + '" style="background:' + c + '" aria-label="강조색 ' + c + '"></button>'; }).join('') + '</div></div>' +
      '<div class="field"><label>글꼴</label><div class="chiprow" id="in-fonts" style="margin-top:0">' +
        FONTS.map(function (f) { return '<button class="chip' + (st.fontKey === f.k ? ' on' : '') + '" type="button" data-font="' + f.k + '">' + f.name + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="field"><label>크기</label>' +
        '<div class="setrow"><span class="lbl">글자 크기</span><input type="range" id="in-scale" min="80" max="130" step="2" value="' + st.scale + '"><span class="vl">' + st.scale + '%</span></div>' +
      '</div>' +
      '<div class="field"><label>글자색 (제목 · 본문)</label><div class="swatches" id="in-tcolor">' +
        ['', '#17171B', '#FFFFFF', '#FF4D6D', '#2F6BFF', '#FF6F0F'].map(function (c) {
          return '<button class="sw' + (st.titleColor === c ? ' on' : '') + '" type="button" data-tcolor="' + c + '" style="background:' + (c || 'linear-gradient(135deg,#fff,#ddd)') + '"></button>';
        }).join('') +
        '</div><div class="swatches" id="in-bcolor" style="margin-top:6px">' +
        ['', '#45454F', '#FFFFFF', '#6D6D7A', '#8A2F2F', '#1B4D3E'].map(function (c) {
          return '<button class="sw' + (st.bodyColor === c ? ' on' : '') + '" type="button" data-bcolor="' + c + '" style="background:' + (c || 'linear-gradient(135deg,#fff,#ddd)') + '"></button>';
        }).join('') +
        '</div></div>' +
      '<div class="field"><label>테두리</label>' +
        '<div class="swatches" id="in-border">' +
        ['#17171B', '#FFFFFF', '#FF6F0F', '#7C5CFF'].map(function (c) {
          return '<button class="sw' + (st.borderColor === c ? ' on' : '') + '" type="button" data-border="' + c + '" style="background:' + c + '"></button>';
        }).join('') + '</div>' +
        '<div class="setrow"><span class="lbl">두께</span><input type="range" id="in-bw" min="0" max="16" step="2" value="' + st.borderWidth + '"><span class="vl">' + st.borderWidth + 'px</span></div>' +
      '</div>' +
      '<div class="field"><label>그림자</label><div class="seg" id="in-shadow">' +
        '<button type="button" class="' + (st.shadow ? 'on' : '') + '" data-shadow="1">켜기</button>' +
        '<button type="button" class="' + (!st.shadow ? 'on' : '') + '" data-shadow="0">끄기</button>' +
      '</div></div>';
  }

  function bindAll(root) {
    var left = els.left;
    H.$('#in-btitle', left).addEventListener('input', function () { st.blogTitle = this.value; });
    H.$('#in-bbody', left).addEventListener('input', function () { st.blogBody = this.value; });
    H.$('#in-sit', left).addEventListener('input', function () { st.situation = this.value; });
    H.$('#in-handle', left).addEventListener('input', function () { st.handle = this.value; });
    H.$('#in-load', left).addEventListener('change', function () {
      var p = A.products.get(this.value);
      if (!p) return;
      st.product = p;
      st.blogTitle = p.title;
      st.blogBody = (p.benefits || []).concat((p.points || []).map(function (x) { return x.desc; })).join('\n');
      st.situation = (p.personas[0] || {}).desc || '';
      H.$('#in-btitle', left).value = st.blogTitle;
      H.$('#in-bbody', left).value = st.blogBody;
      H.$('#in-sit', left).value = st.situation;
      App.toast('상품 정보를 불러왔어요.');
    });
    H.$('#in-kind', left).addEventListener('click', function (e) {
      var b = e.target.closest('[data-kind]'); if (!b) return;
      st.kind = b.getAttribute('data-kind');
      H.$$('#in-kind button', left).forEach(function (x) { x.classList.toggle('on', x === b); });
    });
    H.$('#in-mode', left).addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]'); if (!b) return;
      st.mode = b.getAttribute('data-mode');
      H.$$('#in-mode button', left).forEach(function (x) { x.classList.toggle('on', x === b); });
      H.$('#in-run', left).textContent = st.mode === 'text' ? '카드뉴스 만들기' : '캐러셀 ' + st.count + '장 만들기';
    });
    H.$('#in-ratio', left).addEventListener('click', function (e) {
      var b = e.target.closest('[data-ratio]'); if (!b) return;
      st.ratio = b.getAttribute('data-ratio');
      H.$$('#in-ratio .chip', left).forEach(function (x) { x.classList.toggle('on', x === b); });
      if (st.slides.length) redraw();
    });
    H.$('#in-count', left).addEventListener('change', function () {
      st.count = Number(this.value);
      if (st.mode !== 'text') H.$('#in-run', left).textContent = '캐러셀 ' + st.count + '장 만들기';
    });
    H.$('#in-photos', left).addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []).slice(0, 10);
      if (!files.length) return;
      var done = 0;
      files.forEach(function (f) {
        A.loadImage(f).then(function (img) {
          st.photos.push(img);
          done++;
          if (done === files.length) {
            App.toast('사진 ' + files.length + '장을 올렸어요.');
            if (st.slides.length) redraw();
            var b = H.$('#in-photoclr', left);
            if (!b) {
              var wrap = H.$('#in-photos', left).parentNode;
              var btn = document.createElement('button');
              btn.id = 'in-photoclr'; btn.type = 'button'; btn.className = 'btn btn-ghost'; btn.textContent = '비우기';
              btn.addEventListener('click', function () { st.photos = []; if (st.slides.length) redraw(); btn.parentNode.removeChild(btn); });
              wrap.appendChild(btn);
            }
          }
        }, function (e) { App.toast(e.message); });
      });
      this.value = '';
    });
    var clr = H.$('#in-photoclr', left);
    if (clr) clr.addEventListener('click', function () {
      st.photos = [];
      if (st.slides.length) redraw();
      this.parentNode.removeChild(this);
    });

    H.$('#in-run', left).addEventListener('click', function () {
      if (!st.blogBody.trim() && !st.blogTitle.trim() && !st.product) {
        App.toast('글 제목이나 내용을 먼저 넣어 주세요.');
        return;
      }
      build();
      renderStrip(); renderCaption();
      App.toast(st.canvases.length + '장 카드뉴스를 만들었어요.');
      var box = H.$('#in-preview', els.right);
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    var right = els.right;
    H.$('#in-preview', right).addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav && st.canvases.length) {
        st.cur = (st.cur + Number(nav.getAttribute('data-nav')) + st.canvases.length) % st.canvases.length;
        renderPreview(); renderStrip();
        return;
      }
      if (e.target.closest('[data-savecur]') && st.canvases.length) {
        A.canvas.download(st.canvases[st.cur], 'carousel-' + (st.cur + 1) + '.png');
        App.toast('이 장을 저장했어요.');
      }
    });
    H.$('#in-strip', right).addEventListener('click', function (e) {
      var s = e.target.closest('[data-shot]');
      if (!s) return;
      st.cur = Number(s.getAttribute('data-shot'));
      renderPreview(); renderStrip();
    });
    H.$('#in-all', right).addEventListener('click', function () {
      if (!st.canvases.length) { App.toast('먼저 카드뉴스를 만들어 주세요.'); return; }
      var i = 0;
      (function next() {
        if (i >= st.canvases.length) { App.toast('저장을 시작했어요. 여러 파일 저장을 허용해 주세요.'); return; }
        A.canvas.download(st.canvases[i++], 'carousel-' + i + '.png');
        setTimeout(next, 420);
      })();
    });
    H.$('#in-again', right).addEventListener('click', function () {
      if (!st.slides.length) { App.toast('먼저 카드뉴스를 만들어 주세요.'); return; }
      redraw(); renderStrip();
      App.toast('같은 설정으로 다시 그렸어요.');
    });
    H.$('#in-capcopy', right).addEventListener('click', function () {
      App.copy(H.$('#in-cap', right).textContent, this);
    });

    /* 스타일 패널 */
    var host = H.$('#in-stylehost', left);
    host.addEventListener('click', function (e) {
      var s = e.target.closest('[data-style]');
      if (s) {
        st.styleKey = s.getAttribute('data-style');
        H.$$('#in-styles .chip', host).forEach(function (x) { x.classList.toggle('on', x === s); });
        if (st.slides.length) redraw();
        return;
      }
      var a = e.target.closest('[data-accent]');
      if (a) {
        st.accent = a.getAttribute('data-accent');
        H.$$('#in-accent .sw', host).forEach(function (x) { x.classList.toggle('on', x === a); });
        if (st.slides.length) redraw();
        return;
      }
      var f = e.target.closest('[data-font]');
      if (f) {
        st.fontKey = f.getAttribute('data-font');
        H.$$('#in-fonts .chip', host).forEach(function (x) { x.classList.toggle('on', x === f); });
        if (st.slides.length) redraw();
        return;
      }
      var tc = e.target.closest('[data-tcolor]');
      if (tc) {
        st.titleColor = tc.getAttribute('data-tcolor');
        H.$$('#in-tcolor .sw', host).forEach(function (x) { x.classList.toggle('on', x === tc); });
        if (st.slides.length) redraw();
        return;
      }
      var bc = e.target.closest('[data-bcolor]');
      if (bc) {
        st.bodyColor = bc.getAttribute('data-bcolor');
        H.$$('#in-bcolor .sw', host).forEach(function (x) { x.classList.toggle('on', x === bc); });
        if (st.slides.length) redraw();
        return;
      }
      var bd = e.target.closest('[data-border]');
      if (bd) {
        st.borderColor = bd.getAttribute('data-border');
        H.$$('#in-border .sw', host).forEach(function (x) { x.classList.toggle('on', x === bd); });
        if (st.slides.length) redraw();
        return;
      }
      var sh = e.target.closest('[data-shadow]');
      if (sh) {
        st.shadow = sh.getAttribute('data-shadow') === '1';
        H.$$('#in-shadow button', host).forEach(function (x) { x.classList.toggle('on', x === sh); });
      }
    });
    H.$('#in-scale', host).addEventListener('input', function () {
      st.scale = Number(this.value);
      this.parentNode.querySelector('.vl').textContent = st.scale + '%';
      if (st.slides.length) redraw();
    });
    H.$('#in-bw', host).addEventListener('input', function () {
      st.borderWidth = Number(this.value);
      this.parentNode.querySelector('.vl').textContent = st.borderWidth + 'px';
      if (st.slides.length) redraw();
    });
  }
})();
