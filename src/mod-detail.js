/* =====================================================================
   Module 9 · 🛍️ 상세페이지 자판기
   ===================================================================== */
(function () {
  'use strict';
  var H = App.helpers, esc = App.esc;

  function readData(root) {
    var strengths = H.lines(H.$('#dt-strength', root).value);
    var reviews = H.lines(H.$('#dt-review', root).value).map(function (l) {
      var m = l.split(/\s*[:|]\s*/);
      if (m.length >= 2) return { who: m[0], text: m.slice(1).join(' ') };
      return { who: '구매자', text: l };
    });
    return {
      brand: H.$('#dt-brand', root).value.trim() || 'BRAND',
      name: H.$('#dt-name', root).value.trim(),
      target: H.$('#dt-target', root).value.trim(),
      price: H.$('#dt-price', root).value.trim(),
      listPrice: H.$('#dt-list', root).value.trim(),
      strengths: strengths.length ? strengths : ['핵심 강점을 입력하면 여기에 표시됩니다.'],
      reviews: reviews,
      cta: H.$('#dt-cta', root).value.trim() || '지금 구매하기',
      notice: H.$('#dt-notice', root).value.trim()
    };
  }

  function previewHtml(d) {
    var price = d.price ? H.won(d.price) + '원' : '가격 미입력';
    var list = d.listPrice ? '<s>' + esc(H.won(d.listPrice)) + '원</s>' : '';
    var off = '';
    var p1 = Number(String(d.listPrice).replace(/[^0-9]/g, ''));
    var p2 = Number(String(d.price).replace(/[^0-9]/g, ''));
    if (p1 && p2 && p1 > p2) off = '<em>' + Math.round((1 - p2 / p1) * 100) + '% 할인</em>';

    return '<div class="dp"><div class="hero">' +
      '<div class="brand">' + esc(d.brand) + '</div>' +
      '<h1>' + esc(d.name || '상품명을 입력하세요') + '</h1>' +
      (d.target ? '<div class="sub">' + esc(d.target) + '를 위한 선택</div>' : '') +
      '<div class="price"><b>' + esc(price) + '</b>' + list + off + '</div>' +
      '</div>' +
      '<section><h2>이런 점이 좋아요</h2><ul>' +
        d.strengths.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
      '</ul></section>' +
      (d.reviews.length ? '<section><h2>실제 후기</h2>' + d.reviews.map(function (r) {
        return '<div class="rv"><b>' + esc(r.who) + '</b>' + esc(r.text) + '</div>';
      }).join('') + '</section>' : '') +
      '<section><h2>구매 안내</h2><ul>' +
        '<li>배송: 결제 후 2~3일 이내 발송</li>' +
        '<li>교환·환불: 수령 후 7일 이내 가능</li>' +
        (d.notice ? '<li>' + esc(d.notice) + '</li>' : '') +
      '</ul></section>' +
      '<div class="cta"><div>' + esc(d.cta) + '</div></div>' +
      '<div class="foot">※ 본 상품의 조건·가격은 판매처 사정에 따라 달라질 수 있습니다.<br>© ' + esc(d.brand) + '</div>' +
      '</div>';
  }

  function fullHtml(d) {
    var price = d.price ? H.won(d.price) + '원' : '가격 문의';
    var inner = previewHtml(d);
    var css = [
      '*{box-sizing:border-box}',
      'body{margin:0;background:#EDEDF2;font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Pretendard","Malgun Gothic",sans-serif;color:#1B1B21;line-height:1.5;-webkit-font-smoothing:antialiased}',
      '.wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh}',
      '.hero{padding:30px 22px 24px;background:linear-gradient(160deg,#F3EEFF,#FFF6EC)}',
      '.hero .brand{font-size:12px;font-weight:800;color:#4C24D6;letter-spacing:.02em}',
      '.hero h1{margin:10px 0 0;font-size:26px;font-weight:800;letter-spacing:-.04em;line-height:1.3;word-break:keep-all}',
      '.hero .sub{margin-top:8px;font-size:13px;color:#6D6D7A}',
      '.price{margin-top:18px;display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}',
      '.price b{font-size:28px;font-weight:800;letter-spacing:-.04em}',
      '.price s{font-size:13px;color:#A6A6B2}',
      '.price em{font-style:normal;font-size:12.5px;font-weight:800;color:#E25B2E}',
      'section{padding:22px;border-top:7px solid #F6F6F9}',
      'h2{margin:0;font-size:15px;font-weight:800;letter-spacing:-.03em}',
      'ul{margin:12px 0 0;padding:0;list-style:none}',
      'li{position:relative;padding-left:26px;font-size:13.5px;line-height:1.75;color:#3A3A44;margin-top:8px;word-break:keep-all}',
      'li:before{content:"✓";position:absolute;left:0;top:1px;width:17px;height:17px;border-radius:50%;background:#F1ECFF;color:#4C24D6;font-size:10px;font-weight:800;display:grid;place-items:center}',
      '.rv{background:#FAFAFC;border-radius:12px;padding:13px;font-size:12.5px;line-height:1.7;color:#3A3A44;margin-top:10px}',
      '.rv b{display:block;font-size:11px;color:#4C24D6;margin-bottom:4px}',
      '.cta{position:sticky;bottom:0;padding:12px 16px 16px;background:#fff;border-top:1px solid #F0F0F5}',
      '.cta div{display:block;height:48px;border-radius:12px;background:#6338F5;color:#fff;font-size:14.5px;font-weight:800;text-align:center;line-height:48px}',
      '.foot{padding:16px 22px 30px;font-size:11px;line-height:1.7;color:#9A9AA6}'
    ].join('\n');
    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(d.name || '상세페이지') + '</title>\n' +
      '<meta name="description" content="' + esc((d.name || '') + ' ' + (d.target || '')) + '">\n' +
      '<style>' + css + '</style>\n</head>\n<body>\n<div class="wrap">' + inner + '</div>\n</body>\n</html>\n';
  }

  App.register({
    id: 'detail', emoji: '🛍️', name: '상세페이지 자판기', free: false, tag: '판매 페이지',
    desc: '상품 정보만 넣으면 모바일 세로형 상세페이지 완성 — HTML로 저장.',
    help: '상품명·가격·강점·후기를 넣으면 모바일 세로형 상세페이지가 실시간으로 만들어집니다. 완성된 HTML을 내려받아 그대로 올리면 판매 페이지가 됩니다.',
    render: function (root) {
      root.innerHTML =
        '<div class="cols">' +
          '<div class="stack"><section class="panel"><h3>🛍️ 상품 정보</h3>' +
            '<div class="row2"><div class="field"><label for="dt-brand">브랜드</label><input id="dt-brand" type="text" placeholder="예: 댕댕랩"></div>' +
            '<div class="field"><label for="dt-name">상품명 *</label><input id="dt-name" type="text" placeholder="예: 반려견 자동급식기"></div></div>' +
            '<div class="row2"><div class="field"><label for="dt-list">정가</label><input id="dt-list" type="text" placeholder="69000"></div>' +
            '<div class="field"><label for="dt-price">판매가</label><input id="dt-price" type="text" placeholder="49000"></div></div>' +
            '<div class="field"><label for="dt-target">타겟</label><input id="dt-target" type="text" placeholder="예: 맞벌이 견주"></div>' +
            '<div class="field"><label for="dt-strength">핵심 강점 3가지 <span class="muted small">(한 줄에 하나)</span></label>' +
            '<textarea id="dt-strength" placeholder="예약 급식으로 하루 4번 자동 배식&#10;앱으로 양·시간 조절&#10;분해 세척 가능한 STS304"></textarea></div>' +
            '<div class="field"><label for="dt-review">후기 <span class="muted small">(닉네임: 내용)</span></label>' +
            '<textarea id="dt-review" placeholder="댕댕이집사: 출근할 때 걱정이 없어졌어요.&#10;초보견주: 세척이 쉬워서 좋습니다."></textarea></div>' +
            '<div class="row2"><div class="field"><label for="dt-cta">구매 버튼 문구</label><input id="dt-cta" type="text" placeholder="지금 구매하기"></div>' +
            '<div class="field"><label for="dt-notice">추가 안내</label><input id="dt-notice" type="text" placeholder="예: 무료 배송"></div></div>' +
            '<div class="actions"><button class="btn btn-primary btn-block" type="button" id="dt-build">미리보기 갱신</button>' +
            '<button class="btn btn-soft btn-block" type="button" id="dt-down">HTML 파일 다운로드</button></div>' +
            '<p class="hint">입력하는 대로 오른쪽 미리보기가 바뀝니다. 다운로드한 HTML은 그대로 배포할 수 있습니다.</p>' +
          '</section></div>' +
          '<div class="stack"><section class="panel"><h3>📱 모바일 미리보기</h3>' +
            '<div class="phone" style="margin-top:12px"><div class="notch"><i></i></div><div class="screen" id="dt-screen"></div></div>' +
          '</section></div>' +
        '</div>';

      var fields = ['dt-brand', 'dt-name', 'dt-target', 'dt-price', 'dt-list', 'dt-strength', 'dt-review', 'dt-cta', 'dt-notice'];
      var screen = H.$('#dt-screen', root);

      function refresh() {
        var d = readData(root);
        screen.innerHTML = previewHtml(d);
      }

      fields.forEach(function (id) {
        H.$('#' + id, root).addEventListener('input', refresh);
      });
      H.$('#dt-build', root).addEventListener('click', function () {
        refresh();
        App.toast('미리보기를 갱신했어요.');
      });
      H.$('#dt-down', root).addEventListener('click', function () {
        var d = readData(root);
        if (!d.name) { App.toast('상품명을 먼저 입력해 주세요.'); H.$('#dt-name', root).focus(); return; }
        var safe = d.name.replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 30);
        App.download('detail-' + (safe || 'page') + '.html', fullHtml(d), 'text/html;charset=utf-8');
        App.toast('상세페이지 HTML을 내려받았어요.');
      });

      H.$('#dt-name', root).value = '반려견 자동급식기';
      H.$('#dt-brand', root).value = '댕댕랩';
      H.$('#dt-target', root).value = '맞벌이 견주';
      H.$('#dt-list', root).value = '69000';
      H.$('#dt-price', root).value = '49000';
      H.$('#dt-strength', root).value = '예약 급식으로 하루 4번 자동 배식\n앱으로 양·시간 조절\n분해 세척 가능한 STS304';
      H.$('#dt-review', root).value = '댕댕이집사: 출근할 때 걱정이 없어졌어요.\n초보견주: 세척이 쉬워서 좋습니다.';
      refresh();
    }
  });
})();
