/* ═══════════════════════════════════════════════════════════════════
   draw.js — Vẽ hình SVG cho bài tập Tĩnh học
   Toạ độ pixel của SVG (trục y hướng xuống). Góc truyền vào các hàm
   luôn theo quy ước cơ học: đo từ Ox, NGƯỢC chiều kim đồng hồ (độ).

   var s = new Svg(420, 260);
   s.arrow(x1,y1,x2,y2,{c:COL.F}).text(x,y,'F_1',{c:COL.F});
   html = s.out();
   ═══════════════════════════════════════════════════════════════════ */

var COL = { F: '#C62828', R: '#1565C0', K: '#263238', G: '#2E7D32', M: '#6A1B9A', Q: '#E65100', dim: '#78909C', grid: '#D5DEE6', beam: '#37474F' };

function Svg(w, h) { this.w = w; this.h = h; this.p = []; }

/* Nhãn có chỉ số dưới: 'X_A' → X<sub>A</sub>, "R'_x" → R'<sub>x</sub> */
function svgLabel(s) {
  return String(s).replace(/_\{([^}]*)\}|_(\w+)/g, function (m, a, b) {
    return '<tspan font-size="72%" dy="3">' + (a || b) + '</tspan><tspan dy="-3"></tspan>';
  });
}
function _pt(cx, cy, r, a) { return [cx + r * Math.cos(a * DEG), cy - r * Math.sin(a * DEG)]; }

Svg.prototype = {
  add: function (s) { this.p.push(s); return this; },
  out: function () {
    return '<svg viewBox="0 0 ' + this.w + ' ' + this.h + '" style="max-width:' + this.w + 'px" xmlns="http://www.w3.org/2000/svg" font-family="Plus Jakarta Sans,Segoe UI,sans-serif">'
      + this.p.join('') + '</svg>';
  },
  line: function (x1, y1, x2, y2, o) {
    o = o || {};
    return this.add('<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" stroke="' + (o.c || COL.K)
      + '" stroke-width="' + (o.w || 1.5) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + ' stroke-linecap="round"/>');
  },
  poly: function (pts, o) {
    o = o || {};
    return this.add('<polygon points="' + pts.map(function (p) { return r1(p[0]) + ',' + r1(p[1]); }).join(' ') + '" fill="' + (o.fill || 'none')
      + '" stroke="' + (o.c || 'none') + '" stroke-width="' + (o.w || 1.2) + '" stroke-linejoin="round"/>');
  },
  path: function (d, o) {
    o = o || {};
    return this.add('<path d="' + d + '" fill="' + (o.fill || 'none') + '" stroke="' + (o.c || COL.K) + '" stroke-width="' + (o.w || 1.5)
      + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + ' stroke-linecap="round"/>');
  },
  circle: function (cx, cy, r, o) {
    o = o || {};
    return this.add('<circle cx="' + r1(cx) + '" cy="' + r1(cy) + '" r="' + r + '" fill="' + (o.fill || '#fff') + '" stroke="' + (o.c || COL.K) + '" stroke-width="' + (o.w || 1.3) + '"/>');
  },
  rect: function (x, y, w, h, o) {
    o = o || {};
    return this.add('<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" fill="' + (o.fill || 'none') + '" stroke="' + (o.c || 'none') + '" stroke-width="' + (o.w || 1) + '"' + (o.rx ? ' rx="' + o.rx + '"' : '') + '/>');
  },
  /* o: {c, size, anchor:'start'|'middle'|'end', weight, italic} */
  text: function (x, y, s, o) {
    o = o || {};
    return this.add('<text x="' + r1(x) + '" y="' + r1(y) + '" fill="' + (o.c || COL.K) + '" font-size="' + (o.size || 13) + '" text-anchor="' + (o.anchor || 'middle')
      + '" font-weight="' + (o.weight || 700) + '"' + (o.italic ? ' font-style="italic"' : '') + ' dominant-baseline="middle">' + svgLabel(s) + '</text>');
  },
  /* Mũi tên từ (x1,y1) → (x2,y2), đầu mũi tên tại (x2,y2) */
  arrow: function (x1, y1, x2, y2, o) {
    o = o || {};
    var c = o.c || COL.K, w = o.w || 2, L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 1) return this;
    var ux = (x2 - x1) / L, uy = (y2 - y1) / L, hl = o.head || Math.max(8, w * 4.2), hw = hl * 0.42;
    var bx = x2 - ux * hl, by = y2 - uy * hl;
    this.line(x1, y1, bx + ux * 1, by + uy * 1, { c: c, w: w, dash: o.dash });
    return this.poly([[x2, y2], [bx - uy * hw, by + ux * hw], [bx + uy * hw, by - ux * hw]], { fill: c });
  },
  /* Mũi tên theo góc (độ, quy ước cơ học) có độ dài len, bắt đầu tại (x,y) */
  arrowAng: function (x, y, ang, len, o) {
    return this.arrow(x, y, x + len * cosd(ang), y - len * sind(ang), o);
  },
  /* Cung tròn từ góc a1 → a2 (ngược chiều kim đồng hồ nếu a2 > a1) */
  arc: function (cx, cy, r, a1, a2, o) {
    o = o || {};
    if (a2 < a1) { var t = a1; a1 = a2; a2 = t; }
    var p1 = _pt(cx, cy, r, a1), p2 = _pt(cx, cy, r, a2), large = (a2 - a1) > 180 ? 1 : 0;
    return this.path('M' + r1(p1[0]) + ',' + r1(p1[1]) + ' A' + r + ',' + r + ' 0 ' + large + ' 0 ' + r1(p2[0]) + ',' + r1(p2[1]), { c: o.c || COL.dim, w: o.w || 1.2, dash: o.dash });
  },
  /* Ký hiệu góc giữa hai phương a1, a2 kèm nhãn */
  angle: function (cx, cy, r, a1, a2, label, o) {
    o = o || {};
    this.arc(cx, cy, r, a1, a2, { c: o.c || COL.dim });
    var am = (a1 + a2) / 2, p = _pt(cx, cy, r + (o.gap || 13), am);
    return this.text(p[0], p[1], label, { c: o.c || '#455A64', size: o.size || 11, weight: 600 });
  },
  /* Ngẫu lực: cung ~270° có mũi tên. ccw=true: ngược chiều kim đồng hồ */
  couple: function (cx, cy, r, ccw, label, o) {
    o = o || {};
    var c = o.c || COL.M, a0 = o.start == null ? -45 : o.start, a1 = a0 + 270;
    this.arc(cx, cy, r, a0, a1, { c: c, w: 2 });
    var aEnd = ccw ? a1 : a0, p = _pt(cx, cy, r, aEnd);
    var tx = ccw ? -Math.sin(aEnd * DEG) : Math.sin(aEnd * DEG), ty = ccw ? -Math.cos(aEnd * DEG) : Math.cos(aEnd * DEG);
    this.arrow(p[0] - tx * 6, p[1] - ty * 6, p[0] + tx * 3, p[1] + ty * 3, { c: c, w: 2, head: 9 });
    if (label) { var lp = o.lp || [cx, cy - r - 11]; this.text(lp[0], lp[1], label, { c: c, size: 12 }); }
    return this;
  },
  /* Hệ trục toạ độ tại (ox,oy) */
  axes: function (ox, oy, lx, ly, o) {
    o = o || {};
    var nx = o.nx || 'x', ny = o.ny || 'y', c = o.c || '#607D8B';
    if (o.neg) { this.line(ox - o.neg, oy, ox, oy, { c: c, w: 1.2 }); this.line(ox, oy + o.neg, ox, oy, { c: c, w: 1.2 }); }
    this.arrow(ox, oy, ox + lx, oy, { c: c, w: 1.2, head: 8 }).arrow(ox, oy, ox, oy - ly, { c: c, w: 1.2, head: 8 });
    this.text(ox + lx + 4, oy + 10, nx, { c: c, size: 12, anchor: 'start', italic: true });
    return this.text(ox + 10, oy - ly - 2, ny, { c: c, size: 12, anchor: 'start', italic: true });
  },
  /* Đường gạch mặt đất: đoạn (x1,y1)-(x2,y2), gạch chéo về phía side (+1/-1) */
  ground: function (x1, y1, x2, y2, side) {
    side = side || 1;
    this.line(x1, y1, x2, y2, { c: COL.K, w: 1.6 });
    var L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, nx = -uy * side, ny = ux * side;
    for (var t = 4; t < L; t += 6) {
      var px = x1 + ux * t, py = y1 + uy * t;
      this.line(px, py, px + nx * 6 - ux * 5, py + ny * 6 - uy * 5, { c: '#78909C', w: 1 });
    }
    return this;
  },
  /* Nhóm có phép quay: rot theo quy ước cơ học (độ) */
  grp: function (x, y, rot, fn) {
    this.add('<g transform="translate(' + r1(x) + ',' + r1(y) + ') rotate(' + r1(-(rot || 0)) + ')">');
    fn(this);
    return this.add('</g>');
  },

  /* ── LIÊN KẾT ──────────────────────────────────────────────────────
     rot = 0: gối nằm phía dưới điểm, phản lực hướng lên.
     rot = 90: gối nằm bên phải; rot = -90: bên trái; rot = 180: phía trên. */
  pin: function (x, y, rot) {
    return this.grp(x, y, rot, function (s) {
      s.poly([[0, 0], [-10, 17], [10, 17]], { fill: '#ECEFF1', c: COL.K, w: 1.4 });
      s.ground(-16, 17, 16, 17, 1);
      s.circle(0, 0, 3.2);
    });
  },
  roller: function (x, y, rot) {
    return this.grp(x, y, rot, function (s) {
      s.poly([[0, 0], [-10, 13], [10, 13]], { fill: '#ECEFF1', c: COL.K, w: 1.4 });
      s.circle(-5.5, 16.5, 3.3).circle(5.5, 16.5, 3.3);
      s.ground(-16, 20, 16, 20, 1);
      s.circle(0, 0, 3.2);
    });
  },
  /* Ngàm: rot = 0 → tường bên trái điểm (dầm chạy sang phải) */
  fixed: function (x, y, rot) {
    return this.grp(x, y, rot, function (s) {
      s.rect(-7, -20, 7, 40, { fill: '#ECEFF1' });
      s.ground(0, 20, 0, -20, -1);
    });
  },
  /* Ngàm trượt (2 thanh song song): rot = 0 → trượt theo phương ngang, nằm dưới điểm */
  slide: function (x, y, rot) {
    return this.grp(x, y, rot, function (s) {
      s.line(-12, 0, 12, 0, { w: 3 });
      s.line(-7, 0, -7, 16, { w: 1.6 }).line(7, 0, 7, 16, { w: 1.6 });
      s.circle(-7, 16, 2.6).circle(7, 16, 2.6).circle(-7, 0, 2.6).circle(7, 0, 2.6);
      s.ground(-16, 19, 16, 19, 1);
    });
  },
  /* Thanh lý tưởng (x1,y1: đầu nối vật; x2,y2: đầu nối gối) */
  link: function (x1, y1, x2, y2) {
    this.line(x1, y1, x2, y2, { w: 2.2, c: '#546E7A' });
    this.circle(x1, y1, 3.2).circle(x2, y2, 3.2);
    var a = angDeg(x2 - x1, -(y2 - y1));
    return this.grp(x2, y2, a - 90, function (s) { s.ground(-12, -3.5, 12, -3.5, -1); });
  },
  /* Dây mềm (x1,y1: điểm buộc vào vật; x2,y2: điểm neo) */
  rope: function (x1, y1, x2, y2) {
    this.line(x1, y1, x2, y2, { w: 1.4, c: '#8D6E63' });
    this.circle(x1, y1, 2.2, { fill: '#8D6E63', c: '#8D6E63' });
    var a = angDeg(x2 - x1, -(y2 - y1));
    return this.grp(x2, y2, a - 90, function (s) { s.ground(-12, 0, 12, 0, -1); });
  },

  /* ── TẢI TRỌNG ─────────────────────────────────────────────────── */
  /* Lực tập trung tác dụng VÀO điểm (x,y) theo góc ang, nhãn ở đuôi */
  force: function (x, y, ang, len, label, o) {
    o = o || {};
    var tx = x - len * cosd(ang), ty = y + len * sind(ang), c = o.c || COL.F;
    this.arrow(tx, ty, x, y, { c: c, w: o.w || 2.2, dash: o.dash });
    if (label) {
      var lx = tx - 12 * cosd(ang), ly = ty + 12 * sind(ang);
      if (o.lp) { lx = o.lp[0]; ly = o.lp[1]; }
      this.text(lx, ly, label, { c: c, size: o.size || 12 });
    }
    return this;
  },
  /* Tải phân bố hình thang trên dầm ngang từ x1→x2 tại cao độ y; cường độ vẽ h1→h2 px */
  distLoad: function (x1, x2, y, h1, h2, label, o) {
    o = o || {};
    var c = o.c || COL.Q, n = Math.max(3, Math.round((x2 - x1) / 16));
    this.poly([[x1, y], [x1, y - h1], [x2, y - h2], [x2, y]], { fill: 'rgba(230,81,0,.07)' });
    this.line(x1, y - h1, x2, y - h2, { c: c, w: 1.5 });
    for (var i = 0; i <= n; i++) {
      var xi = x1 + (x2 - x1) * i / n, hi = h1 + (h2 - h1) * i / n;
      if (hi > 5) this.arrow(xi, y - hi, xi, y - 1, { c: c, w: 1.2, head: 6 });
    }
    if (label) this.text(o.lx != null ? o.lx : (x1 + x2) / 2, y - Math.max(h1, h2) - 10, label, { c: c, size: 12 });
    return this;
  },
  /* Kích thước dọc trục ngang từ xs[0]..xs[n] tại cao độ y, nhãn labels[i] giữa các mốc */
  dims: function (xs, y, labels) {
    this.line(xs[0], y, xs[xs.length - 1], y, { c: COL.dim, w: 1 });
    for (var i = 0; i < xs.length; i++) this.line(xs[i], y - 5, xs[i], y + 5, { c: COL.dim, w: 1 });
    for (var j = 0; j < labels.length; j++) if (labels[j] !== '') this.text((xs[j] + xs[j + 1]) / 2, y - 8, labels[j], { c: '#546E7A', size: 11, weight: 600 });
    return this;
  },
  /* Kích thước dọc trục đứng */
  dimsV: function (ys, x, labels) {
    this.line(x, ys[0], x, ys[ys.length - 1], { c: COL.dim, w: 1 });
    for (var i = 0; i < ys.length; i++) this.line(x - 5, ys[i], x + 5, ys[i], { c: COL.dim, w: 1 });
    for (var j = 0; j < labels.length; j++) if (labels[j] !== '') this.text(x - 8, (ys[j] + ys[j + 1]) / 2, labels[j], { c: '#546E7A', size: 11, weight: 600, anchor: 'end' });
    return this;
  },
  /* Lưới ô vuông nx × ny, góc trên-trái (x0,y0), cạnh ô s px */
  grid: function (x0, y0, nx, ny, s) {
    for (var i = 0; i <= nx; i++) this.line(x0 + i * s, y0, x0 + i * s, y0 + ny * s, { c: COL.grid, w: 1 });
    for (var j = 0; j <= ny; j++) this.line(x0, y0 + j * s, x0 + nx * s, y0 + j * s, { c: COL.grid, w: 1 });
    return this;
  }
};
