/* ═══════════════════════════════════════════════════════════════════
   supports.js — Thư viện liên kết phẳng & các phương án liên kết dầm
   Cần draw.js tải trước. Dùng cho bài 1.2 (nhận biết liên kết) và
   2.4 (lựa chọn liên kết để vật cân bằng tĩnh định).
   ═══════════════════════════════════════════════════════════════════ */

/* ── 1. CÁC LOẠI LIÊN KẾT PHẲNG ──────────────────────────────────────
   n: số thành phần phản lực; react: mô tả phản lực; icon: hàm vẽ     */
var SUP_TYPES = [
  { id: 'tua', name: 'Liên kết tựa (không ma sát)', n: 1, react: 'Một lực N theo phương pháp tuyến chung của hai mặt tiếp xúc, hướng vào vật khảo sát',
    /* mặt nghiêng y = 78 − 0.4(x − 20); tiếp điểm (70, 58); pháp tuyến n = (−0.371, −0.928) */
    icon: function (s) { s.ground(20, 78, 120, 38, 1); s.circle(63.7, 42.2, 17, { fill: '#ECEFF1' }); s.arrow(70, 58, 70 - 0.371 * 15, 58 - 0.928 * 15, { c: COL.G, w: 1.8, head: 6 }); s.text(80, 30, 'N', { c: COL.G, size: 11 }); } },
  { id: 'day', name: 'Liên kết dây mềm', n: 1, react: 'Một lực căng T dọc theo dây, hướng từ vật ra ngoài (dây chỉ chịu kéo)',
    icon: function (s) { s.rope(70, 60, 70, 12); s.rect(52, 60, 36, 20, { fill: '#ECEFF1', c: COL.K, w: 1.3 }); } },
  { id: 'thanh', name: 'Liên kết thanh lý tưởng', n: 1, react: 'Một lực S dọc theo đường nối hai khớp của thanh',
    icon: function (s) { s.line(20, 40, 90, 40, { c: COL.beam, w: 5 }); s.link(90, 40, 125, 75); } },
  { id: 'goi_dd', name: 'Gối di động (gối con lăn)', n: 1, react: 'Một lực N vuông góc với mặt lăn',
    icon: function (s) { s.line(25, 40, 115, 40, { c: COL.beam, w: 5 }); s.roller(70, 43, 0); } },
  { id: 'goi_cd', name: 'Gối cố định (khớp bản lề)', n: 2, react: 'Hai thành phần lực X, Y (phương chiều chưa biết)',
    icon: function (s) { s.line(25, 40, 115, 40, { c: COL.beam, w: 5 }); s.pin(70, 43, 0); } },
  { id: 'banle', name: 'Bản lề trụ (khớp nối hai vật)', n: 2, react: 'Hai thành phần lực X, Y vuông góc với trục bản lề',
    icon: function (s) { s.line(20, 60, 70, 40, { c: COL.beam, w: 5 }); s.line(70, 40, 120, 62, { c: COL.beam, w: 5 }); s.circle(70, 40, 4.5); } },
  { id: 'ngam', name: 'Ngàm phẳng', n: 3, react: 'Hai thành phần lực X, Y và một ngẫu lực M',
    icon: function (s) { s.fixed(35, 45, 0); s.line(35, 45, 120, 45, { c: COL.beam, w: 5 }); } },
  { id: 'ngam_truot', name: 'Ngàm trượt', n: 2, react: 'Một lực N vuông góc phương trượt và một ngẫu lực M',
    icon: function (s) { s.line(30, 38, 110, 38, { c: COL.beam, w: 5 }); s.slide(70, 41, 0); } }
];
function supIcon(t) { var s = new Svg(140, 92); t.icon(s); return s.out(); }

/* ── 2. PHƯƠNG ÁN LIÊN KẾT CHO THANH AB ─────────────────────────────
   cls: 0 tĩnh định · 1 siêu tĩnh · 2 không phù hợp (đồng quy) ·
        3 không phù hợp (song song) · 4 thiếu liên kết
   N: tổng số ẩn phản lực · one: có liên kết một phía (dây/tựa)        */
var CLS_TXT = ['Cân bằng tĩnh định', 'Cân bằng siêu tĩnh', 'Không phù hợp — hệ ẩn đồng quy (vật có thể quay)',
  'Không phù hợp — hệ ẩn song song (vật có thể tịnh tiến)', 'Thiếu liên kết (N &lt; 3)'];
var BX1 = 45, BX2 = 235, BY = 58, BXC = 140;
var CONFIGS = [
  { k: 'pin_roll', N: 3, cls: 0, txt: 'A: gối cố định · B: gối di động đứng', d: function (s) { s.pin(BX1, BY + 3, 0); s.roller(BX2, BY + 3, 0); } },
  { k: 'roll_pin', N: 3, cls: 0, txt: 'A: gối di động đứng · B: gối cố định', d: function (s) { s.roller(BX1, BY + 3, 0); s.pin(BX2, BY + 3, 0); } },
  { k: 'fix', N: 3, cls: 0, txt: 'A: ngàm · B: tự do', d: function (s) { s.fixed(BX1, BY, 0); } },
  { k: 'fixB', N: 3, cls: 0, txt: 'A: tự do · B: ngàm', d: function (s) { s.fixed(BX2, BY, 180); } },
  { k: 'pin_link45', N: 3, cls: 0, txt: 'A: gối cố định · B: thanh xiên 45°', d: function (s) { s.pin(BX1, BY + 3, 0); s.link(BX2, BY, BX2 + 28, BY + 28); } },
  { k: 'pin_roll30', N: 3, cls: 0, txt: 'A: gối cố định · B: gối di động nghiêng 30°', d: function (s) { s.pin(BX1, BY + 3, 0); s.roller(BX2 + 1.5, BY + 2.6, 30); } },
  { k: 'slideH_rollH', N: 3, cls: 0, txt: 'A: ngàm trượt ngang · B: gối di động phản lực nằm ngang', d: function (s) { s.slide(BX1, BY + 3, 0); s.roller(BX2 + 3, BY, 90); } },
  { k: 'slideV_roll', N: 3, cls: 0, txt: 'A: ngàm trượt đứng · B: gối di động đứng', d: function (s) { s.slide(BX1 - 3, BY, -90); s.roller(BX2, BY + 3, 0); } },
  { k: 'roll3_mix', N: 3, cls: 0, txt: 'A, C: gối di động đứng · B: gối di động ngang', d: function (s) { s.roller(BX1, BY + 3, 0); s.roller(BXC, BY + 3, 0); s.roller(BX2 + 3, BY, 90); } },
  { k: 'pin_rope', N: 3, cls: 0, one: true, txt: 'A: gối cố định · B: dây treo thẳng đứng', d: function (s) { s.pin(BX1, BY + 3, 0); s.rope(BX2, BY, BX2, BY - 44); } },
  { k: 'fix_roll', N: 4, cls: 1, txt: 'A: ngàm · B: gối di động', d: function (s) { s.fixed(BX1, BY, 0); s.roller(BX2, BY + 3, 0); } },
  { k: 'pin_pin', N: 4, cls: 1, txt: 'A, B: gối cố định', d: function (s) { s.pin(BX1, BY + 3, 0); s.pin(BX2, BY + 3, 0); } },
  { k: 'fix_pin', N: 5, cls: 1, txt: 'A: ngàm · B: gối cố định', d: function (s) { s.fixed(BX1, BY, 0); s.pin(BX2, BY + 3, 0); } },
  { k: 'fix_fix', N: 6, cls: 1, txt: 'A, B: ngàm', d: function (s) { s.fixed(BX1, BY, 0); s.fixed(BX2, BY, 180); } },
  { k: 'pin_rollH', N: 3, cls: 2, txt: 'A: gối cố định · B: gối di động phản lực dọc trục thanh', d: function (s) { s.pin(BX1, BY + 3, 0); s.roller(BX2 + 3, BY, 90); } },
  { k: 'pin_linkH', N: 3, cls: 2, txt: 'A: gối cố định · B: thanh nằm ngang dọc trục', d: function (s) { s.pin(BX1, BY + 3, 0); s.link(BX2, BY, BX2 + 38, BY); } },
  { k: 'roll3', N: 3, cls: 3, txt: 'A, C, B: gối di động đứng', d: function (s) { s.roller(BX1, BY + 3, 0); s.roller(BXC, BY + 3, 0); s.roller(BX2, BY + 3, 0); } },
  { k: 'slideH_roll', N: 3, cls: 3, txt: 'A: ngàm trượt ngang · B: gối di động đứng', d: function (s) { s.slide(BX1, BY + 3, 0); s.roller(BX2, BY + 3, 0); } },
  { k: 'roll_roll', N: 2, cls: 4, txt: 'A, B: gối di động đứng', d: function (s) { s.roller(BX1, BY + 3, 0); s.roller(BX2, BY + 3, 0); } },
  { k: 'slideH', N: 2, cls: 4, txt: 'A: ngàm trượt ngang · B: tự do', d: function (s) { s.slide(BX1, BY + 3, 0); } }
];
function cfgByKey(k) { for (var i = 0; i < CONFIGS.length; i++) if (CONFIGS[i].k === k) return CONFIGS[i]; }
/* Hình thanh AB với phương án liên kết; loads: vẽ thêm F và M minh hoạ */
function cfgFig(c, o) {
  o = o || {};
  var s = new Svg(290, 112);
  s.line(BX1, BY, BX2, BY, { c: COL.beam, w: 6 });
  c.d(s);
  if (o.loads) { s.force(BX1 + 70, BY - 4, 270 + 30, 38, 'F', { size: 11 }); s.couple(BX2 - 55, BY, 11, true, 'M', { lp: [BX2 - 55, BY - 20] }); }
  s.text(BX1 - 2, BY - 13, 'A', { size: 11 }).text(BX2 + 2, BY - 13, 'B', { size: 11 });
  if (c.k.indexOf('roll3') === 0) s.text(BXC, BY - 13, 'C', { size: 11 });
  return s.out();
}
