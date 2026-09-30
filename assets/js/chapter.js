/* ═══════════════════════════════════════════════════════════════════
   chapter.js — Trang mục lục chương (index_Cx.html)
   renderChapter('c2', [{code, href, key, icon, bg, fg, title, sub, feats:[[icon, text]]}])
   - Hiển thị SV, thẻ bài tập, tiến độ từng bài (localStorage key) và tổng
   ═══════════════════════════════════════════════════════════════════ */
function renderChapter(chId, lessons) {
  window.addEventListener('load', function () {
    var ci = window.COURSE_INFO || {}, el;
    if (ci.name && (el = document.getElementById('hdr-sub'))) el.textContent = ci.name + (ci.teacher ? ' · ' + ci.teacher : '') + ' · ' + (ci.dept || '');
    var sv = getSV();
    document.getElementById('sv-display').textContent = sv && sv.name ? sv.name + ' — MSSV: ' + sv.mssv + ' · STT: ' + sv.stt : 'Chưa đăng nhập — về Trang chủ để nhập thông tin (vẫn xem thử được đề STT 1)';
    document.getElementById('sv-badge').textContent = sv && sv.name ? '#' + sv.stt : '–';

    var st = chapterStatus(chId);
    if (st !== 'open') {
      var c = (window.CHAPTER_SCHEDULE || {})[chId] || {};
      var msg = st === 'locked' ? 'Chương này chưa được giảng viên mở.' : st === 'soon' ? 'Chương sẽ mở lúc: <b>' + String(c.open).replace('T', ' ') + '</b>' : 'Chương đã đóng lúc: <b>' + String(c.close).replace('T', ' ') + '</b>';
      document.querySelector('main').innerHTML = '<div class="chapter-lock"><i class="ti ti-lock lock-icon"></i><h2>Chương chưa mở</h2><p>' + msg + '</p><p style="margin-top:14px"><a href="../index.html">← Về trang chủ</a></p></div>';
      return;
    }

    var tD = 0, tT = 0, h = '';
    lessons.forEach(function (L) {
      var p = null;
      try { p = JSON.parse(localStorage.getItem(L.key) || 'null'); } catch (e) {}
      if (p && p.total) { tD += p.done; tT += p.total; }
      h += '<div class="dc"><div class="dc-hd"><div class="dc-icon" style="background:' + L.bg + '"><i class="ti ti-' + L.icon + '" style="color:' + L.fg + '"></i></div>'
        + '<div><h3>' + L.code + ' — ' + L.title + '</h3><p>' + L.sub + '</p></div></div><div class="dc-body">'
        + L.feats.map(function (f) { return '<div class="dc-feat"><i class="ti ti-' + f[0] + '"></i> ' + f[1] + '</div>'; }).join('')
        + '</div><div class="dc-foot"><span class="dc-status">' + (p && p.total ? 'Đúng ' + p.done + ' / ' + p.total : '– / –') + '</span>'
        + '<a class="go-btn" href="' + L.href + '">Vào bài <i class="ti ti-arrow-right"></i></a></div></div>';
    });
    document.getElementById('lesson-grid').innerHTML = h;
    if (tT) {
      document.getElementById('total-prog-text').textContent = tD + ' / ' + tT + ' (' + Math.round(tD / tT * 100) + '%)';
      document.getElementById('total-prog-fill').style.width = Math.round(tD / tT * 100) + '%';
    }
  });
}
