// ═══════════════════════════════════════════════════════
//  config.js — Cơ Học Cơ Sở 1 · Tĩnh Học
//  ► GV chỉ cần sửa file này → git commit → git push
//  ► KHÔNG cần sửa index.html hay các file bài tập
// ═══════════════════════════════════════════════════════

// ── Thông tin hiển thị ───────────────────────────────────
window.COURSE_INFO = {
  name:    'Cơ Học Cơ Sở 1 — Tĩnh Học',
  dept:    'Bộ môn Cơ học lý thuyết · ĐHXD Hà Nội',
  teacher: '',            // vd: 'TS. Nguyễn Văn A' — để trống thì không hiển thị
};

// ── Danh sách lớp (hiện trong ô "Chọn lớp" ở trang chủ) ──
window.CLASS_LIST = [
  { id: '69XD1', name: 'Lớp 69XD1' },
  { id: '69XD2', name: 'Lớp 69XD2' },
  { id: '69XD3', name: 'Lớp 69XD3' },
];

// ── Cloudflare Worker URL (nhận kết quả → Google Sheet) ─
//    Để trống = SV làm bài bình thường nhưng chưa nộp được.
window.WORKER_URL = "";

// ── % số câu phải LÀM (không cần đúng) để được nộp bài ─
window.MIN_ATTEMPT_PCT = 80;

// ── Lịch mở chương ──────────────────────────────────────
//    active:false → khoá; open/close: "2026-10-01T07:00:00" hoặc null
window.CHAPTER_SCHEDULE = {
  c1: { active: true,  open: null, close: null },   // Mở đầu · Khái niệm · Hệ tiên đề
  c2: { active: true,  open: null, close: null },   // Hệ lực phẳng · Cân bằng VR phẳng
  c3: { active: false, open: null, close: null },   // Hệ lực không gian
  c4: { active: false, open: null, close: null },   // Kết cấu tĩnh định
  c5: { active: false, open: null, close: null },   // Ma sát
  c6: { active: false, open: null, close: null },   // Trọng tâm vật rắn
};

// ═══════════════════════════════════════════════════════
//  CẤU TRÚC THƯ MỤC:
//
//  📁 WEB_CO_LY_THUYET/
//  ├── index.html            ← Trang chủ (đăng nhập SV + danh sách chương)
//  ├── config.js             ← File này
//  ├── assets/css/app.css    ← Giao diện dùng chung
//  ├── assets/js/engine.js   ← Sinh số theo STT, chấm điểm, nộp bài
//  ├── assets/js/draw.js     ← Vẽ hình SVG (lực, gối, tải trọng)
//  ├── chuong-01/index_C1.html, 1.1_...html, 1.2_...html
//  └── chuong-02/index_C2.html, 2.1_...html ... 2.4_...html
//
//  GV xem thử đề của 1 SV bất kỳ (không cần đăng nhập):
//    chuong-02/2.3_PHAN_LUC.html?stt=12
//  Tự kiểm tra đáp án toàn trang:  ...?stt=12&selftest=1
// ═══════════════════════════════════════════════════════
