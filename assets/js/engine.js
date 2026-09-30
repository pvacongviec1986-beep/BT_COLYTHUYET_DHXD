/* ═══════════════════════════════════════════════════════════════════
   engine.js — CHCS1 Tĩnh Học · Hệ thống Bài tập Online
   Bộ công cụ dùng chung: PRNG theo STT, chấm điểm, trắc nghiệm,
   tiến độ, lịch mở chương, nộp bài. Vanilla JS, không thư viện ngoài.

   Mỗi trang bài tập chỉ cần:
     1. <div id="content"></div> trong <main>
     2. Hàm build(stt) sinh HTML bằng card(), makeQ(), makeMCQ()
     3. window.onload = function(){ runPage({...}, build); }
   ═══════════════════════════════════════════════════════════════════ */

/* ── BIẾN TOÀN CỤC ─────────────────────────────────────────────────── */
var ANS = {};            /* { id: true | false | null } — kết quả từng câu      */
var QREG = {};           /* { id: {ans, tol, angle} } — đáp án câu điền số     */
var _submitted = false;  /* Cờ đã nộp                                          */
var TOTAL_QUESTIONS = 0;
var PAGE = {};           /* Cấu hình trang: chapter, id, progKey, title, next  */
var SV_KEY = 'chcs_sv';  /* Khoá sessionStorage thông tin sinh viên            */
var _mcqNo = 0;

/* ── 1. LÀM TRÒN & TOÁN ────────────────────────────────────────────── */
function r1(v) { return Math.round(v * 10) / 10; }
function r2(v) { return Math.round(v * 100) / 100; }
function r3(v) { return Math.round(v * 1000) / 1000; }
var DEG = Math.PI / 180;
function cosd(a) { return Math.cos(a * DEG); }
function sind(a) { return Math.sin(a * DEG); }
function tand(a) { return Math.tan(a * DEG); }
/* Góc của véctơ (x,y) đo từ Ox ngược chiều kim đồng hồ, trong [0, 360) */
function angDeg(x, y) { var a = Math.atan2(y, x) / DEG; if (a < 0) a += 360; if (a >= 359.9995) a = 0; return a; }
function norm360(a) { a = a % 360; return a < 0 ? a + 360 : a; }

/* Hiển thị số: làm tròn d chữ số, bỏ số 0 thừa, dấu trừ chuẩn */
function fmt(v, d) {
  if (d == null) d = 2;
  var p = Math.pow(10, d), x = Math.round(v * p) / p;
  if (x === 0) x = 0; /* bỏ -0 */
  return String(x).replace('-', '−');
}
/* Số có dấu trong biểu thức: fmtS(3) = "+ 3", fmtS(-3) = "− 3" */
function fmtS(v, d) { return (v < 0 ? '− ' : '+ ') + fmt(Math.abs(v), d); }
/* Bọc số âm trong ngoặc khi thay vào công thức */
function fmtP(v, d) { return v < 0 ? '(' + fmt(v, d) + ')' : fmt(v, d); }

/* ── 2. SINH SỐ NGẪU NHIÊN THEO STT (LCG — cùng STT → cùng đề) ────── */
function seededRng(seed) {
  var s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  var f = function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  /* Bỏ 3 giá trị đầu: với seed nhỏ, giá trị đầu tiên luôn ≈ seed·7.8e-6 (< 0.1) → lệch */
  f(); f(); f();
  return f;
}
function rint(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
/* Số ngẫu nhiên trong [a,b] theo bước step (vd step 0.5) */
function rstep(rng, a, b, step) { var n = Math.round((b - a) / step); return r3(a + rint(rng, 0, n) * step); }
function shuffle(rng, arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ── 3. THÔNG TIN SINH VIÊN & THAM SỐ URL ─────────────────────────── */
function getSV() { try { return JSON.parse(sessionStorage.getItem(SV_KEY)); } catch (e) { return null; } }
function urlParam(k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1]) : null; }

/* ── 4. CÂU HỎI ĐIỀN SỐ ───────────────────────────────────────────── */
/*  makeQ(id, label, đápÁn, dungSai, đơnVị, {angle:true})               */
/*  - Dung sai hiệu dụng = max(tol, 1.5% |đáp án|)                      */
/*  - angle:true → so sánh góc theo modulo 360°                         */
/*  - Chấp nhận dấu phẩy thập phân (2,5) và dấu trừ unicode             */
function makeQ(id, label, ans, tol, unit, opt) {
  opt = opt || {};
  QREG[id] = { ans: ans, tol: tol, angle: !!opt.angle };
  ANS[id] = null;
  return '<div class="ans-row">'
    + '<span class="ans-label">' + label + '</span>'
    + '<input class="ans-inp" id="' + id + '" type="text" inputmode="decimal" autocomplete="off" placeholder="?" oninput="chkFill(\'' + id + '\')">'
    + '<span class="ans-unit">' + (unit || '') + '</span>'
    + '<span class="chip" id="ck-' + id + '"></span>'
    + '</div>';
}
function parseNum(s) {
  s = String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[−–]/g, '-');
  if (s === '' || s === '-' || s === '.') return NaN;
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
}
function chkFill(id) {
  var inp = document.getElementById(id), chip = document.getElementById('ck-' + id), q = QREG[id];
  if (!inp || !chip || !q) return;
  var v = parseNum(inp.value);
  if (isNaN(v)) {
    inp.classList.remove('ok', 'no'); chip.className = 'chip'; chip.textContent = '';
    ANS[id] = null; updateProg(); return;
  }
  var ok;
  if (q.angle) {
    var d = Math.abs(norm360(v - q.ans + 180) - 180);
    ok = d <= q.tol;
  } else {
    ok = Math.abs(v - q.ans) <= Math.max(q.tol, Math.abs(q.ans) * 0.015);
  }
  inp.classList.toggle('ok', ok); inp.classList.toggle('no', !ok);
  chip.className = 'chip ' + (ok ? 'ok' : 'no'); chip.textContent = ok ? '✓' : '✗';
  ANS[id] = ok; updateProg();
}

/* ── 5. TRẮC NGHIỆM ───────────────────────────────────────────────── */
/*  makeMCQ(id, câuHỏi, [phương án...], chỉSốĐúng, giảiThích, rng, cls) */
/*  - rng != null → xáo thứ tự phương án theo STT                       */
/*  - cls = 'g2' → hiển thị 2 cột (dùng cho phương án có hình)          */
function makeMCQ(id, q, opts, correct, exp, rng, cls) {
  var order = opts.map(function (_, i) { return i; });
  if (rng) order = shuffle(rng, order);
  QREG['mcq-' + id] = { correct: order.indexOf(correct), exp: exp || '' };
  ANS['mcq-' + id] = null;
  _mcqNo++;
  var h = '<div class="mcq-item" id="mq-' + id + '"><div class="mcq-q"><span class="mcq-num">Câu ' + _mcqNo + '</span>' + q + '</div>'
    + '<div class="mcq-opts ' + (cls || '') + '">';
  order.forEach(function (oi, k) {
    h += '<div class="mcq-opt" id="mco-' + id + '-' + k + '" onclick="pickMCQ(\'' + id + '\',' + k + ')">'
      + '<span class="mkey">' + String.fromCharCode(65 + k) + '</span><span>' + opts[oi] + '</span></div>';
  });
  return h + '</div><div class="mcq-exp" id="exp-' + id + '"></div></div>';
}
function pickMCQ(id, k) {
  var q = QREG['mcq-' + id];
  if (!q || ANS['mcq-' + id] != null) return;
  var ok = (k === q.correct);
  document.querySelectorAll('[id^="mco-' + id + '-"]').forEach(function (el) { el.style.pointerEvents = 'none'; });
  document.getElementById('mco-' + id + '-' + k).className = 'mcq-opt ' + (ok ? 'ok' : 'no');
  if (!ok) document.getElementById('mco-' + id + '-' + q.correct).className = 'mcq-opt reveal';
  var exp = document.getElementById('exp-' + id);
  if (exp && q.exp) { exp.className = 'mcq-exp show ' + (ok ? 'ok-e' : 'no-e'); exp.innerHTML = (ok ? '✓ ' : '✗ ') + q.exp; }
  ANS['mcq-' + id] = ok;
  updateProg();
}

/* ── 6. KHỐI GIAO DIỆN ────────────────────────────────────────────── */
var BADGE = { A: '#E65100', B: '#6A1B9A', C: '#AD1457', T: '#1565C0' };
/*  card({id, grp:'A'|'B'|'C'|'T', badge, icon, title, prob, fig, fml, fmlTitle, hint, qs}) */
function card(o) {
  var h = '<div class="card" id="card-' + o.id + '"><div class="card-hd"><i class="ti ti-' + (o.icon || 'pencil') + '"></i>'
    + '<div><h2>' + o.title + '</h2></div>'
    + '<span class="cbadge" style="background:' + (BADGE[o.grp] || BADGE.T) + '">' + (o.badge || o.id.toUpperCase()) + '</span></div>'
    + '<div class="card-body">';
  if (o.prob) h += '<div class="earth-box">' + o.prob + '</div>';
  if (o.fig) h += '<div class="fig">' + o.fig + '</div>';
  if (o.fml || o.hint) {
    h += '<div class="fml-box">';
    if (o.fml) h += '<div class="ftitle"><i class="ti ti-bulb"></i> ' + (o.fmlTitle || 'Công thức') + '</div>' + o.fml;
    if (o.hint) h += '<div class="hint"><b>Thay số:</b><br>' + o.hint + '</div>';
    h += '</div>';
  }
  return h + '<div class="qs">' + (o.qs || '') + '</div></div></div>';
}
function secLabel(icon, text) { return '<div class="sec-lbl"><i class="ti ti-' + icon + '" style="font-size:12px"></i> ' + text + '</div>'; }
function frow(s) { return '<div class="frow">' + s + '</div>'; }
function scrollNext() {
  var el = document.querySelector('.ans-inp:not(.ok)');
  var m = null;
  document.querySelectorAll('.mcq-item').forEach(function (it) {
    if (!m && ANS['mcq-' + it.id.slice(3)] == null) m = it;
  });
  var target = el ? el.closest('.ans-row') : null;
  if (m && (!target || m.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)) target = m;
  if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (el && target.contains(el)) el.focus(); }
  else toast('🎉 Bạn đã làm hết các câu!');
}
function toast(msg, dur) {
  var el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(function () { el.classList.remove('show'); }, dur || 3000);
}

/* ── 7. TIẾN ĐỘ & NÚT NỘP ─────────────────────────────────────────── */
function countAns() {
  var a = 0, d = 0, t = TOTAL_QUESTIONS || Object.keys(ANS).length;
  Object.keys(ANS).forEach(function (k) { if (ANS[k] !== null && ANS[k] !== undefined) { a++; if (ANS[k] === true) d++; } });
  return { attempted: a, done: d, total: t };
}
function minPct() { return (typeof window.MIN_ATTEMPT_PCT !== 'undefined') ? window.MIN_ATTEMPT_PCT : 80; }
function updateProg() {
  var c = countAns(), total = c.total;
  var aPct = total ? Math.round(c.attempted / total * 100) : 0, dPct = total ? Math.round(c.done / total * 100) : 0;
  var el;
  if ((el = document.getElementById('prog-fill'))) el.style.width = aPct + '%';
  if ((el = document.getElementById('prog-text'))) el.textContent = 'Đã làm: ' + c.attempted + '/' + total + ' (' + aPct + '%) · Đúng: ' + c.done + ' (' + dPct + '%)';
  if ((el = document.getElementById('nav-prog'))) el.textContent = c.attempted + '/' + total;
  if ((el = document.getElementById('hdr-prog'))) el.textContent = c.done + ' / ' + total;
  if (PAGE.progKey && !PAGE.preview) {
    try { localStorage.setItem(PAGE.progKey, JSON.stringify({ done: c.done, total: total, attempted: c.attempted })); } catch (e) {}
  }
  if (!_submitted && (el = document.getElementById('btn-nop'))) {
    var ready = aPct >= minPct() && c.attempted > 0;
    el.style.background = ready ? 'rgba(46,125,50,.8)' : 'rgba(150,150,150,.35)';
    el.innerHTML = (ready ? '✅' : '🔒') + ' Nộp bài <span style="font-size:10px;opacity:.8">(' + aPct + '%/' + minPct() + '%)</span>';
  }
}

/* ── 8. LỊCH MỞ/ĐÓNG CHƯƠNG (config.js) ───────────────────────────── */
function chapterStatus(chId) {
  var sch = window.CHAPTER_SCHEDULE || {}, cfg = sch[chId];
  if (!cfg) return 'open';
  if (!cfg.active) return 'locked';
  var now = new Date();
  if (cfg.open && new Date(cfg.open) > now) return 'soon';
  if (cfg.close && new Date(cfg.close) < now) return 'closed';
  return 'open';
}

/* ── 9. KHUNG TRANG BÀI TẬP ───────────────────────────────────────── */
/*  runPage({chapter:'c1', id:'C1-11-TienDe', progKey:'chcs_prog_c1_11',
             code:'1.1', title:'...', back:'index_C1.html', next:'1.2_...html'}, build)
    - Chưa đăng nhập: xem thử với ?stt=N (không nộp được)
    - ?selftest=1 : tự điền đáp án đúng để kiểm tra đề (dành cho GV)   */
function runPage(cfg, build) {
  PAGE = cfg;
  var sv = getSV(), stt = 1, el;
  var pStt = parseInt(urlParam('stt'), 10);
  PAGE.preview = !(sv && sv.name);
  if (!PAGE.preview) stt = parseInt(sv.stt, 10) || 1;
  else if (pStt > 0) stt = pStt;
  PAGE.stt = stt;

  if ((el = document.getElementById('sv-display')))
    el.textContent = PAGE.preview ? 'Chưa đăng nhập — đang xem thử đề STT ' + stt : sv.name + ' — MSSV: ' + sv.mssv + ' · STT: ' + sv.stt;
  if ((el = document.getElementById('sv-chip'))) el.textContent = '#' + stt;
  if ((el = document.getElementById('sv-badge'))) el.textContent = PAGE.preview ? 'Xem thử' : 'SV #' + stt;
  if (PAGE.preview && (el = document.getElementById('preview-bar'))) el.classList.remove('hidden');

  var st = chapterStatus(cfg.chapter);
  if (st !== 'open' && urlParam('selftest') !== '1') {
    var c = (window.CHAPTER_SCHEDULE || {})[cfg.chapter] || {};
    var msg = st === 'locked' ? 'Chương này chưa được giảng viên mở.'
      : st === 'soon' ? 'Chương sẽ mở lúc: <b>' + String(c.open).replace('T', ' ') + '</b>'
      : 'Chương đã đóng lúc: <b>' + String(c.close).replace('T', ' ') + '</b>';
    document.querySelector('main').innerHTML = '<div class="chapter-lock"><i class="ti ti-lock lock-icon"></i><h2>Chương chưa mở</h2><p>' + msg
      + '</p><p style="margin-top:14px"><a href="../index.html">← Về trang chủ</a></p></div>';
    var nav = document.querySelector('.sticky-nav'); if (nav) nav.style.display = 'none';
    return;
  }

  document.getElementById('content').innerHTML = build(stt);
  TOTAL_QUESTIONS = Object.keys(ANS).length;
  checkSubmittedOnLoad();
  updateProg();
  if (urlParam('selftest') === '1') selfTest();
}

/* ── 10. TỰ KIỂM TRA ĐỀ (GV dùng ?selftest=1) ─────────────────────── */
function selfTest() {
  var bad = [];
  Object.keys(QREG).forEach(function (id) {
    var q = QREG[id];
    if (id.indexOf('mcq-') === 0) { pickMCQ(id.slice(4), q.correct); return; }
    if (typeof q.ans !== 'number' || !isFinite(q.ans)) bad.push(id + '=' + q.ans);
    var inp = document.getElementById(id);
    if (inp) { inp.value = String(q.ans); chkFill(id); }
    if (ANS[id] !== true) bad.push(id + ' không tự khớp');
  });
  var c = countAns();
  var rep = document.createElement('pre');
  rep.id = 'selftest';
  rep.textContent = 'SELFTEST stt=' + PAGE.stt + ' total=' + c.total + ' done=' + c.done + ' bad=' + JSON.stringify(bad)
    + '\nDATA=' + JSON.stringify(window.__DATA || null);
  document.body.appendChild(rep);
}

/* ── 11. NỘP BÀI (Cloudflare Worker → Google Sheet) ───────────────── */
function lsSubmitKey(sv) { return 'chcs_submitted_' + PAGE.id + '_' + (sv && sv.mssv || ''); }
function checkSubmittedOnLoad() {
  var sv = getSV();
  if (!sv || !sv.mssv) return;
  try {
    if (localStorage.getItem(lsSubmitKey(sv))) {
      _submitted = true;
      var btn = document.getElementById('btn-nop');
      if (btn) { btn.disabled = true; btn.innerHTML = '✓ Đã nộp'; btn.style.background = 'rgba(46,125,50,.5)'; }
    }
  } catch (e) {}
}
function submitResult() {
  var sv = getSV();
  if (!sv || !sv.name) { alert('⚠️ Bạn đang xem thử. Về Trang chủ nhập thông tin sinh viên để làm và nộp bài!'); return; }
  if (_submitted) return;
  try { if (localStorage.getItem(lsSubmitKey(sv))) { alert('ℹ️ Bạn đã nộp bài ' + PAGE.code + ' rồi!'); return; } } catch (e) {}
  var c = countAns();
  var aPct = c.total ? Math.round(c.attempted / c.total * 100) : 0, score = c.total ? Math.round(c.done / c.total * 100) : 0;
  if (c.attempted === 0) { alert('⚠️ Chưa làm câu nào!'); return; }
  if (aPct < minPct()) { alert('⚠️ Cần làm tối thiểu ' + minPct() + '% số câu mới được nộp!\nHiện tại: ' + aPct + '%'); return; }
  var url = window.WORKER_URL || '';
  if (!url) { alert('⚠️ Giảng viên chưa cấu hình máy chủ nhận bài (WORKER_URL trong config.js).\nKết quả hiện tại: ' + score + '% (' + c.done + '/' + c.total + ')'); return; }
  if (!confirm('Nộp bài ' + PAGE.code + '?\nĐúng ' + c.done + '/' + c.total + ' câu (' + score + '%). Mỗi bài chỉ nộp 1 lần.')) return;
  var btn = document.getElementById('btn-nop');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Đang nộp...'; }
  fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: sv.name, mssv: sv.mssv, stt: Number(sv.stt) || 0, classId: sv.classId,
      chapterId: PAGE.id, score: score, correct: c.done, total: c.total, duration: 0 })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d.ok) {
      _submitted = true;
      try { localStorage.setItem(lsSubmitKey(sv), Date.now()); } catch (e) {}
      if (btn) { btn.innerHTML = '✓ Đã nộp (' + score + '%)'; btn.style.background = 'rgba(46,125,50,.5)'; }
      alert('✅ Nộp thành công!\nĐúng: ' + score + '% (' + c.done + '/' + c.total + ' câu)');
    } else { if (btn) btn.disabled = false; updateProg(); alert('❌ Lỗi từ server: ' + (d.error || 'Không rõ')); }
  }).catch(function (err) {
    if (btn) btn.disabled = false; updateProg();
    alert('❌ Không kết nối được máy chủ. Kiểm tra mạng và thử lại.\n(' + err.message + ')');
  });
}
