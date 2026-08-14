// public/app.js — màn chơi, kiểm chứng, bóc tách bài học, hành trình, màn kết

const QUYET_DINH = {
  LAM_THEO: 'LAM_THEO',
  KHONG_LAM: 'KHONG_LAM'
};

// Thông tin kỹ thuật trong tin nhắn: tên miền, số điện thoại, số tài khoản, mã OTP.
// Chỉ những cụm này mới được dùng font mono.
const MAU_KY_THUAT = new RegExp([
  '[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.[a-z]{2,}(?:\\/[^\\s]*)?', // tên miền, có thể kèm đường dẫn
  '(?:\\+84|0)\\d[\\d\\s.]{5,12}\\d',                                // số điện thoại
  '\\d{6,}'                                                          // số tài khoản, mã giao dịch, mã OTP
].join('|'), 'gi');

// Icon từng giai đoạn, đổi icon khi sang chương để tạo cảm giác sang giai đoạn mới
const ICON_GIAI_DOAN = {
  backpack: '<path d="M6 20V10a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/><path d="M9 16h6"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  armchair: '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 11a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M5 18v2M19 18v2"/>'
};

// Năm biểu cảm mascot. alt đi kèm để người dùng trình đọc màn hình cũng nghe
// được nét mặt, thứ mà người nhìn thấy ngay.
const MASCOT = {
  binhThuong: { tep: 'mascot-binh-thuong.png', alt: 'Người hướng dẫn, vẻ mặt bình thường' },
  canhGiac:   { tep: 'mascot-canh-giac.png',   alt: 'Người hướng dẫn, vẻ mặt cảnh giác' },
  khenNgoi:   { tep: 'mascot-khen-ngoi.png',   alt: 'Người hướng dẫn, vẻ mặt khen ngợi' },
  thatVong:   { tep: 'mascot-that-vong.png',   alt: 'Người hướng dẫn, vẻ mặt thất vọng' },
  baoDong:    { tep: 'mascot-bao-dong.png',    alt: 'Người hướng dẫn, vẻ mặt báo động' }
};

// Icon trạng thái từng chặng ở màn hành trình
const ICON_CHANG = {
  dung: '<path d="M20 6 9 17l-5-5"/>',
  sai: '<path d="M18 6 6 18M6 6l12 12"/>',
  dang_choi: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chua_mo: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
};

const el = (id) => document.getElementById(id);

const svgIcon = (noiDung, lop) =>
  `<svg class="${lop}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${noiDung}</svg>`;

const o = {
  manNhapTen: el('man-nhap-ten'),
  formNhapTen: el('form-nhap-ten'),
  oTenNguoiChoi: el('o-ten-nguoi-choi'),
  nhomNhanVat: el('nhom-nhan-vat'),
  nutBatDau: el('nut-bat-dau'),
  goiYNhapTen: el('goi-y-nhap-ten'),
  huyHieuNguoiChoi: el('huy-hieu-nguoi-choi'),
  avatarNguoiChoi: el('avatar-nguoi-choi'),
  tenNguoiChoi: el('ten-nguoi-choi'),

  manMenu: el('man-menu'),
  nutTiepTuc: el('nut-tiep-tuc'),
  nutChoiMoi: el('nut-choi-moi'),
  ghiChuTiepTuc: el('ghi-chu-tiep-tuc'),
  chonCoChu: el('chon-co-chu'),
  chonAmThanh: el('chon-am-thanh'),
  lopChoiMoi: el('lop-choi-moi'),
  nutHuyChoiMoi: el('nut-huy-choi-moi'),
  nutXacNhanChoiMoi: el('nut-xac-nhan-choi-moi'),

  manChoi: el('man-choi'),
  manQuyetDinh: el('man-quyet-dinh'),
  manBocTach: el('man-boc-tach'),
  manHanhTrinh: el('man-hanh-trinh'),
  manKet: el('man-ket'),

  tenGiaiDoan: el('ten-giai-doan'),
  iconGiaiDoan: el('icon-giai-doan'),
  thanhSucKhoe: el('thanh-suc-khoe'),
  soSucKhoe: el('so-suc-khoe'),
  thanhLyTri: el('thanh-ly-tri'),
  soLyTri: el('so-ly-tri'),
  tienTrinh: el('tien-trinh'),

  khungAnhBoiCanh: el('khung-anh-boi-canh'),
  anhBoiCanh: el('anh-boi-canh'),
  chuBoiCanh: el('chu-boi-canh'),

  theBangChung: el('the-bang-chung'),
  demBangChung: el('dem-bang-chung'),
  dsBangChung: el('ds-bang-chung'),
  goiYBangChung: el('goi-y-bang-chung'),

  mascot: el('mascot'),
  bongThoai: el('bong-thoai'),
  chuBongThoai: el('chu-bong-thoai'),

  cotGiua: el('cot-giua'),
  khungDienThoai: el('khung-dien-thoai'),

  thanhCuocGoi: el('thanh-cuoc-goi'),
  thanhGoiChu: el('thanh-goi-chu'),
  nutNgheLai: el('nut-nghe-lai'),

  lopCuocGoi: el('lop-cuoc-goi'),
  goiNhan: el('goi-nhan'),
  goiMat: el('goi-mat'),
  goiAnh: el('goi-anh'),
  goiChuTat: el('goi-chu-tat'),
  goiTen: el('goi-ten'),
  goiTrangThai: el('goi-trang-thai'),
  nutTuChoi: el('nut-tu-choi'),
  nutNghe: el('nut-nghe'),
  nutGoiLai: el('nut-goi-lai'),

  khungThu: el('khung-thu'),
  thuTenNguoiGui: el('thu-ten-nguoi-gui'),
  thuDiaChi: el('thu-dia-chi'),
  thuToi: el('thu-toi'),
  thuGio: el('thu-gio'),
  thuTieuDe: el('thu-tieu-de'),
  thuThan: el('thu-than'),
  thuDungLuong: el('thu-dung-luong'),
  thuThanh: el('thu-thanh'),
  thuPhanTram: el('thu-phan-tram'),
  thuMa: el('thu-ma'),
  thuNut: el('thu-nut'),
  thuNhac: el('thu-nhac'),
  thuChan: el('thu-chan'),

  vungTroLy: el('vung-tro-ly'),
  demLuotTroLy: el('dem-luot-tro-ly'),
  oNhapTroLy: el('o-nhap-tro-ly'),
  nhapTroLy: el('nhap-tro-ly'),
  nutGuiTroLy: el('nut-gui-tro-ly'),

  khungAvatar: el('khung-avatar'),
  anhAvatar: el('anh-avatar'),
  chuAvatar: el('chu-avatar'),
  iconNguoi: el('icon-nguoi'),
  tenLienHe: el('ten-lien-he'),
  trangThaiLienHe: el('trang-thai-lien-he'),

  vungTin: el('vung-tin'),
  demLuot: el('dem-luot'),
  oNhap: el('o-nhap'),
  nhapTin: el('nhap-tin'),
  nutGui: el('nut-gui'),

  oLyDo: el('o-ly-do'),
  nhapLyDo: el('nhap-ly-do'),
  nutHuyLyDo: el('nut-huy-ly-do'),
  nutGuiLyDo: el('nut-gui-ly-do'),

  nhomNut: el('nhom-nut'),
  nutKiemChung: el('nut-kiem-chung'),
  nutSanSang: el('nut-san-sang'),
  ghiChuKiemChung: el('ghi-chu-kiem-chung'),

  lopXacNhan: el('lop-xac-nhan'),
  nhacLuotNhan: el('nhac-luot-nhan'),
  nhacLuotKiemChung: el('nhac-luot-kiem-chung'),
  nutQuayLaiHoi: el('nut-quay-lai-hoi'),
  nutDuThongTin: el('nut-du-thong-tin'),

  tinThuGon: el('tin-thu-gon'),
  chuThichDaDanhDau: el('chu-thich-da-danh-dau'),
  khuQuyetDinh: el('khu-quyet-dinh'),
  nutLamTheo: el('nut-lam-theo'),
  nutKhongLam: el('nut-khong-lam'),

  lopKiemChung: el('lop-kiem-chung'),
  chuLuotKiemChung: el('chu-luot-kiem-chung'),
  dsKiemChung: el('ds-kiem-chung'),
  ketKiemChung: el('ket-kiem-chung'),
  nhanKenhKiemChung: el('nhan-kenh-kiem-chung'),
  chuKetKiemChung: el('chu-ket-kiem-chung'),
  chuLuuYKiemChung: el('chu-luu-y-kiem-chung'),
  nutDongKiemChung: el('nut-dong-kiem-chung'),
  nutQuayLaiChat: el('nut-quay-lai-chat'),

  bannerKetQua: el('banner-ket-qua'),
  bannerTieuDe: el('banner-tieu-de'),
  bannerChu: el('banner-chu'),
  tinGoc: el('tin-goc'),
  chuThichMau: el('chu-thich-mau'),
  khoiNhanRa: el('khoi-nhan-ra'),
  dsNhanRa: el('ds-nhan-ra'),
  khoiBoSot: el('khoi-bo-sot'),
  dsBoSot: el('ds-bo-sot'),
  khoiCumMoi: el('khoi-cum-moi'),
  dsCumMoi: el('ds-cum-moi'),
  chuCachXuLy: el('chu-cach-xu-ly'),
  chuBaiHoc: el('chu-bai-hoc'),
  thanBangDiem: el('than-bang-diem'),
  chanBangDiem: el('chan-bang-diem'),
  chuThichLyDo: el('chu-thich-ly-do'),
  mascotBaiHoc: el('mascot-bai-hoc'),
  chuMascotBaiHoc: el('chu-mascot-bai-hoc'),
  nutChoiTiep: el('nut-choi-tiep'),

  chuHanhTrinh: el('chu-hanh-trinh'),
  dsGiaiDoanHanhTrinh: el('ds-giai-doan-hanh-trinh'),
  nutTiepChang: el('nut-tiep-chang'),

  tieuDeKet: el('tieu-de-ket'),
  chuKet: el('chu-ket'),
  ketSoDung: el('ket-so-dung'),
  ketSucKhoe: el('ket-suc-khoe'),
  ketLyTri: el('ket-ly-tri'),
  dsGiaiDoanKet: el('ds-giai-doan-ket'),
  nutOnTap: el('nut-on-tap'),

  baoLoi: el('bao-loi'),
  chuBaoLoi: el('chu-bao-loi'),
  nutDongLoi: el('nut-dong-loi')
};

const trangThai = {
  caseHienTai: null,
  tongSoCase: 0,
  chang: [],          // 'chua_toi' | 'dang_choi' | 'dung' | 'sai'
  luotId: null,       // lượt chơi mà chang đang mô tả, đổi lượt là dựng lại
  thuTu: 0,
  luotChatConLai: 0,
  // Đếm riêng với luotChatConLai: một cái đo lượt nhắn NPC ở cột giữa,
  // cái kia đo lượt hỏi trợ lý ở cột phải. Không bao giờ gộp.
  luotTroLyConLai: 0,
  luotKiemChungConLai: 0,
  spanDaDanhDau: new Set(),
  kiemChungDaDung: new Set(),
  thuongKiemChung: 0, // sức khoẻ tinh thần được cộng nhờ kiểm chứng trong case này
  // Kênh email không có ai để nhắn lại, ô nhập cột giữa ẩn hẳn
  coONhapNPC: false,
  // Kênh cuộc gọi: chưa nghe máy thì chưa biết họ định nói gì, nên chưa có
  // nội dung để đọc và chưa nói lại được
  kenh: 'chat',
  daNgheMay: false,
  duLieuCase: null,
  dangCho: false,
  dangHoiTroLy: false,
  daChotQuyetDinh: false,
  hetCase: false,
  // Dữ liệu bóc tách của từng chặng, để màn kết xem lại được
  bocTachTheoChang: new Map(),
  changDangXem: null
};

// ================= GỌI API =================

async function goiApi(duongDan, tuyChon = {}) {
  let res;
  try {
    res = await fetch(duongDan, {
      method: tuyChon.body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: tuyChon.body ? JSON.stringify(tuyChon.body) : undefined
    });
  } catch {
    throw new Error('Không kết nối được tới máy chủ. Kiểm tra lại xem máy chủ đã chạy chưa rồi thử lại.');
  }

  let duLieu = {};
  try {
    duLieu = await res.json();
  } catch {
    duLieu = {};
  }

  if (!res.ok) {
    const loi = new Error(duLieu.error || 'Máy chủ đang gặp trục trặc, thử lại sau ít phút nhé.');
    loi.duLieu = duLieu;
    throw loi;
  }
  return duLieu;
}

function hienLoi(loi) {
  o.chuBaoLoi.textContent = typeof loi === 'string' ? loi : loi.message;
  o.baoLoi.hidden = false;
}

const anLoi = () => { o.baoLoi.hidden = true; };

// Cảnh báo của casePicker về nội dung còn thiếu — ví dụ cả lượt không đủ tình
// huống an toàn. Đây là việc của bên nội dung, không phải lỗi người chơi gây
// ra, nên in ra console chứ KHÔNG hiện lên màn hình: một khung báo lỗi đỏ ngay
// lúc vào game vừa phá không khí vừa nói về thứ người chơi không sửa được.
function canhBaoNoiDung(danhSach = []) {
  for (const w of danhSach) console.warn('[nội dung]', w);
}

// ================= ĐIỀU HƯỚNG MÀN =================

const MOI_MAN = ['manNhapTen', 'manMenu', 'manChoi', 'manQuyetDinh', 'manBocTach', 'manHanhTrinh', 'manKet'];

function hienMan(ten) {
  for (const m of MOI_MAN) o[m].hidden = m !== ten;
  window.scrollTo(0, 0);
}

// ================= KHO LƯU Ở MÁY NGƯỜI CHƠI =================

const KHOA_CAI_DAT = 'tinh-tao:cai-dat';
const KHOA_TIEN_DO = 'tinh-tao:tien-do';
const KHOA_NGUOI_CHOI = 'tinh-tao:nguoi-choi';

// Đổi số này khi hình dạng bản lưu đổi, bản cũ sẽ bị bỏ qua thay vì dựng hỏng
const PHIEN_BAN_LUU = 1;

// localStorage có thể ném lỗi: chế độ riêng tư, người dùng chặn lưu trữ, hoặc
// hết dung lượng. Game vẫn phải chơi được trong mọi trường hợp đó, chỉ là
// không nhớ gì — nên mọi lần đụng vào kho đều bọc lại.
function docKho(khoa) {
  try {
    const chu = localStorage.getItem(khoa);
    return chu ? JSON.parse(chu) : null;
  } catch {
    return null;
  }
}

function ghiKho(khoa, giaTri) {
  try {
    localStorage.setItem(khoa, JSON.stringify(giaTri));
    return true;
  } catch {
    return false;
  }
}

function xoaKho(khoa) {
  try {
    localStorage.removeItem(khoa);
  } catch {
    /* không lưu được thì cũng không xoá được, không có gì để làm thêm */
  }
}

// ================= CÀI ĐẶT: CỠ CHỮ VÀ ÂM THANH =================

const caiDat = { coChu: 'vua', amThanh: true, ...(docKho(KHOA_CAI_DAT) || {}) };

function veMotNhomChon(khung, thuoc, giaTri) {
  for (const nut of khung.querySelectorAll('.chon')) {
    nut.setAttribute('aria-pressed', nut.dataset[thuoc] === giaTri ? 'true' : 'false');
  }
}

// Cỡ chữ lớn nhân cả thang chữ lên 1.15 bằng đúng một biến CSS gốc — không
// thành phần nào phải biết chế độ này tồn tại. Design Spec mục 3.
function apDungCaiDat() {
  document.documentElement.dataset.coChu = caiDat.coChu;
  veMotNhomChon(o.chonCoChu, 'coChu', caiDat.coChu);
  veMotNhomChon(o.chonAmThanh, 'amThanh', caiDat.amThanh ? '1' : '0');
}

function datCaiDat(phan) {
  Object.assign(caiDat, phan);
  ghiKho(KHOA_CAI_DAT, caiDat);
  apDungCaiDat();
}

// ================= NGƯỜI CHƠI: TÊN VÀ NHÂN VẬT =================

// Bốn tệp ảnh rời nhau, mỗi vai trò một tệp. Ảnh tròn KHÔNG phải ảnh toàn thân
// cắt tròn: cắt tròn một ảnh đứng cả người thì chỉ còn thấy phần bụng.
const NHAN_VAT = {
  nam: {
    ten: 'Nam',
    toanThan: '/assets/avatar/nhan-vat-nam-toan-than.png',
    tron: '/assets/avatar/nhan-vat-nam-avatar-tron.png'
  },
  nu: {
    ten: 'Nữ',
    toanThan: '/assets/avatar/nhan-vat-nu-toan-than.png',
    tron: '/assets/avatar/nhan-vat-nu-avatar-tron.png'
  }
};

// Giới tính đã chọn chỉ dùng để hiển thị. Không gửi lên máy chủ, không vào
// prompt NPC, không đổi cách xưng hô — lời thoại của kẻ gian viết sẵn trong
// database và phải giống nhau với mọi người chơi.
function docNguoiChoi() {
  const ban = docKho(KHOA_NGUOI_CHOI);
  if (!ban?.ten || !NHAN_VAT[ban.gioiTinh]) return null;
  return ban;
}

let nguoiChoi = docNguoiChoi();

// Huy hiệu ở hàng trên. Chưa có người chơi thì ẩn hẳn chứ không để khung rỗng.
function veHuyHieuNguoiChoi() {
  const co = Boolean(nguoiChoi);
  o.huyHieuNguoiChoi.hidden = !co;
  if (!co) return;

  o.tenNguoiChoi.textContent = nguoiChoi.ten;
  o.avatarNguoiChoi.src = NHAN_VAT[nguoiChoi.gioiTinh].tron;
  o.avatarNguoiChoi.alt = `Nhân vật ${NHAN_VAT[nguoiChoi.gioiTinh].ten} của ${nguoiChoi.ten}`;
}

// Nút Bắt đầu chỉ mở khi đã có cả tên lẫn nhân vật. Câu gợi ý dưới nút nói rõ
// còn thiếu gì, thay vì để người chơi bấm vào nút chết mà không hiểu vì sao.
function capNhatNutBatDau() {
  const ten = o.oTenNguoiChoi.value.trim();
  const daChon = o.nhomNhanVat.querySelector('.nhan-vat__radio:checked');

  o.nutBatDau.disabled = !ten || !daChon;

  if (!ten && !daChon) o.goiYNhapTen.textContent = 'Nhập tên và chọn một nhân vật để bắt đầu';
  else if (!ten) o.goiYNhapTen.textContent = 'Còn thiếu tên của bạn';
  else if (!daChon) o.goiYNhapTen.textContent = 'Chọn một nhân vật để bắt đầu';
  else o.goiYNhapTen.textContent = '';
}

function moManNhapTen() {
  o.oTenNguoiChoi.value = '';
  for (const r of o.nhomNhanVat.querySelectorAll('.nhan-vat__radio')) r.checked = false;
  capNhatNutBatDau();
  hienMan('manNhapTen');
  o.oTenNguoiChoi.focus();
}

function luuNguoiChoi() {
  const ten = o.oTenNguoiChoi.value.trim();
  const gioiTinh = o.nhomNhanVat.querySelector('.nhan-vat__radio:checked')?.value;
  if (!ten || !NHAN_VAT[gioiTinh]) return;

  nguoiChoi = { ten, gioiTinh };
  ghiKho(KHOA_NGUOI_CHOI, nguoiChoi);
  veHuyHieuNguoiChoi();
  moManMenu();
}

// ================= LƯU TIẾN TRÌNH =================

// Bản lưu gồm hai nửa: nửa của máy chủ (chỉ số, danh sách case của lượt, kết
// quả từng case, chế độ đang chơi) và nửa chỉ giao diện biết (màu từng chặng,
// bài học đã bóc tách để màn kết xem lại được).
function docTienDoDaLuu() {
  const ban = docKho(KHOA_TIEN_DO);
  if (!ban || ban.phienBan !== PHIEN_BAN_LUU) return null;
  if (!ban.tienDo?.run?.caseIds?.length) return null;
  return ban;
}

const xoaTienDo = () => xoaKho(KHOA_TIEN_DO);

// Gọi sau mỗi quyết định và mỗi lần đổi lượt. Hỏi máy chủ ảnh chụp mới nhất
// thay vì tự dựng lại từ giao diện: gameState mới là chỗ biết đúng trạng thái.
async function luuTienDo() {
  try {
    const { tienDo } = await goiApi('/api/run/state');
    ghiKho(KHOA_TIEN_DO, {
      phienBan: PHIEN_BAN_LUU,
      luuLuc: Date.now(),
      tienDo,
      luotId: trangThai.luotId,
      chang: [...trangThai.chang],
      bocTach: [...trangThai.bocTachTheoChang.entries()]
    });
  } catch (loi) {
    // Lưu hỏng thì lượt vẫn chơi bình thường, chỉ là lần sau không có nút
    // Tiếp tục. Người chơi không sửa được gì nên không hiện báo lỗi đỏ.
    console.warn('[app] Không lưu được tiến trình:', loi.message);
  }
}

// ================= MÀN MENU =================

function moTaBanLuu(ban) {
  const t = ban.tienDo;
  const daChoi = Object.keys(t.ketQuaTheoCase || {}).length;
  const tong = t.tongSoCaseLuotChinh || (t.caseIdsLuotChinh || []).length;
  if (t.run.mode === 'on_tap') return 'Bạn đang dở màn ôn tập.';
  if (!tong) return 'Bạn đang có một lượt chơi dở.';
  return `Bạn đang dở một lượt, đã qua ${daChoi} trong ${tong} tình huống.`;
}

function datKieuNut(nut, laChinh) {
  nut.classList.toggle('nut--chinh', laChinh);
  nut.classList.toggle('nut--vien', !laChinh);
}

function moManMenu() {
  const ban = docTienDoDaLuu();
  const coLuotDo = Boolean(ban);

  o.nutTiepTuc.hidden = !coLuotDo;
  o.ghiChuTiepTuc.hidden = !coLuotDo;
  if (coLuotDo) o.ghiChuTiepTuc.textContent = moTaBanLuu(ban);

  // Đang dở thì Tiếp tục là nút chính — đó là việc người chơi đang bỏ giữa
  // chừng. Không có lượt dở thì Chơi mới là nút duy nhất, và nó là nút chính.
  datKieuNut(o.nutTiepTuc, coLuotDo);
  datKieuNut(o.nutChoiMoi, !coLuotDo);

  dongXacNhanChoiMoi();
  hienMan('manMenu');
}

const dongXacNhanChoiMoi = () => { o.lopChoiMoi.hidden = true; };

// Chơi mới xoá sạch tiến trình nên phải hỏi lại khi đang có lượt dở
function bamChoiMoi() {
  if (docTienDoDaLuu()) {
    o.lopChoiMoi.hidden = false;
    o.lopChoiMoi.focus();
    return;
  }
  choiMoi();
}

async function choiMoi() {
  dongXacNhanChoiMoi();
  xoaTienDo();
  trangThai.bocTachTheoChang = new Map();
  trangThai.luotId = null;
  trangThai.chang = [];
  await batDauLuot();
}

async function tiepTucLuot() {
  const ban = docTienDoDaLuu();
  if (!ban) {
    moManMenu();
    return;
  }

  o.nutTiepTuc.disabled = true;
  try {
    anLoi();
    noiMascot('Đang mở lại lượt chơi dở');
    await goiApi('/api/run/restore', { body: { tienDo: ban.tienDo } });

    trangThai.luotId = ban.luotId ?? null;
    trangThai.chang = Array.isArray(ban.chang) ? [...ban.chang] : [];
    trangThai.bocTachTheoChang = new Map(ban.bocTach || []);
    veTienTrinh();

    await napCaseHienTai();
  } catch (loi) {
    // Bản lưu không dựng lại được thì giữ lại nó cũng vô ích, và để lại nút
    // Tiếp tục hỏng là mời người chơi bấm vào chỗ không dẫn đi đâu
    xoaTienDo();
    hienLoi(loi);
    moManMenu();
  } finally {
    o.nutTiepTuc.disabled = false;
  }
}

// Chế độ demo: ?demo=case_a,case_b,case_c chạy đúng danh sách đó theo đúng thứ
// tự và bỏ qua casePicker, để mỗi lần quay video ra cùng một lượt. Giao diện
// không đổi gì cả — khác biệt duy nhất là nội dung lượt được chỉ định sẵn.
function danhSachDemo() {
  const chu = new URLSearchParams(window.location.search).get('demo');
  if (!chu) return null;
  const ds = chu.split(',').map((s) => s.trim()).filter(Boolean);
  return ds.length > 0 ? ds : null;
}

// ================= VẼ CHUNG =================

function veChiSo(stats) {
  if (!stats) return;
  o.thanhSucKhoe.style.width = `${stats.sucKhoe}%`;
  o.soSucKhoe.textContent = stats.sucKhoe;
  o.thanhLyTri.style.width = `${stats.lyTri}%`;
  o.soLyTri.textContent = stats.lyTri;
}

// Chia đúng theo số tình huống thật của lượt chơi
function veTienTrinh() {
  o.tienTrinh.innerHTML = '';

  for (const trang of trangThai.chang) {
    const doan = document.createElement('span');
    doan.className = `chang chang--${trang.replace('_', '-')}`;
    o.tienTrinh.appendChild(doan);
  }
}

function noiMascot(chu) {
  const co = Boolean(chu && chu.trim());
  o.chuBongThoai.textContent = co ? chu : '';
  o.bongThoai.dataset.rong = co ? '0' : '1';
}

// Đổi biểu cảm mascot. Ảnh trang trí (alt rỗng) thì giữ nguyên alt rỗng: ở màn
// bóc tách đã có băng kết quả nói rõ đúng sai, đọc thêm nét mặt là thừa.
function datMascot(anh, bieuCam) {
  const m = MASCOT[bieuCam] || MASCOT.binhThuong;
  anh.src = `/assets/mascot/${m.tep}`;
  if (anh.alt) anh.alt = m.alt;
}

// Mascot ở màn chơi chỉ có hai bộ mặt: đang đọc tình huống, và cảnh giác khi
// người chơi đã đánh dấu được chỗ đáng ngờ. Cố tình không phân biệt dấu hiệu
// đỏ với cụm mồi — nét mặt mà đổi theo thì người chơi biết ngay mình bấm đúng
// hay sai, màn bóc tách hết việc để làm.
function capNhatMascotChoi() {
  datMascot(o.mascot, trangThai.spanDaDanhDau.size > 0 ? 'canhGiac' : 'binhThuong');
}

// Tin nhắn dùng font nội dung, riêng tên miền và các dãy số nhạy cảm bọc lại
// bằng font kỹ thuật để người chơi nhận ra ngay đâu là thông tin cần soi
function veNoiDungTin(khung, noiDung) {
  MAU_KY_THUAT.lastIndex = 0;
  let viTri = 0;
  let khop;

  while ((khop = MAU_KY_THUAT.exec(noiDung)) !== null) {
    if (khop.index > viTri) {
      khung.appendChild(document.createTextNode(noiDung.slice(viTri, khop.index)));
    }
    const cum = document.createElement('span');
    cum.className = 'ky-thuat';
    cum.textContent = khop[0];
    khung.appendChild(cum);
    viTri = khop.index + khop[0].length;
  }

  if (viTri < noiDung.length) {
    khung.appendChild(document.createTextNode(noiDung.slice(viTri)));
  }
}

// Dò vị trí các cụm theo trường text, khớp chính xác chuỗi trong tin nhắn.
//
// Tình huống email trải nội dung ra nhiều vùng rời nhau (địa chỉ người gửi,
// tiêu đề, thân thư, mã yêu cầu), nên một cụm không khớp ở vùng này là bình
// thường. Vì vậy chỗ cảnh báo tách ra: mỗi vùng ghi lại cụm mình khớp được
// vào daKhop, dựng xong hết mới kêu về những cụm không khớp ở đâu cả.
function timViTriCum(noiDung, spans, { canhBao = true, daKhop = null } = {}) {
  const moc = [];
  for (const s of spans || []) {
    if (!s.text) continue;
    const tu = noiDung.indexOf(s.text);
    if (tu === -1) {
      if (canhBao) {
        console.warn(`[app] Cụm "${s.id}" không khớp chuỗi nào trong tin nhắn, kiểm tra lại trường text.`);
      }
      continue;
    }
    if (daKhop) daKhop.add(s.id);
    moc.push({ span: s, tu, den: tu + s.text.length });
  }

  moc.sort((a, b) => a.tu - b.tu);

  // Bỏ cụm chồng lên cụm trước, giữ cụm xuất hiện sớm hơn
  const chon = [];
  let het = 0;
  for (const m of moc) {
    if (m.tu >= het) {
      chon.push(m);
      het = m.den;
    }
  }
  return chon;
}

// Dựng nội dung tin nhắn, chèn phần tử riêng cho từng cụm
function veTinCoCum(khung, noiDung, spans, taoPhanTu, tuyChon = {}) {
  const chon = timViTriCum(noiDung, spans, tuyChon);
  let viTri = 0;

  for (const m of chon) {
    if (m.tu > viTri) veNoiDungTin(khung, noiDung.slice(viTri, m.tu));
    const phanTu = taoPhanTu(m.span);
    veNoiDungTin(phanTu, m.span.text);
    khung.appendChild(phanTu);
    viTri = m.den;
  }

  if (viTri < noiDung.length) veNoiDungTin(khung, noiDung.slice(viTri));
}

function themTin(vaiTro, noiDung) {
  const tin = document.createElement('p');
  tin.className = `tin tin--${vaiTro === 'user' ? 'nguoi-choi' : 'npc'}`;
  veNoiDungTin(tin, noiDung);
  o.vungTin.appendChild(tin);
  o.vungTin.scrollTop = o.vungTin.scrollHeight;
  return tin;
}

// Dùng span thay cho button vì Chromium không cho button chảy inline theo
// dòng chữ, vệt bôi sẽ bị đẩy xuống dòng riêng
function taoCumBamDuoc(span) {
  const nut = document.createElement('span');
  nut.className = 'cum';
  nut.dataset.spanId = span.id;
  nut.setAttribute('role', 'button');
  nut.setAttribute('tabindex', '0');
  nut.setAttribute('aria-pressed', 'false');
  return nut;
}

// Dựng một vùng đánh dấu được. Dùng cho cả bong bóng chat lẫn từng phần của
// khung thư — mọi chỗ có cụm đều đi qua đây nên hành vi đánh dấu giống hệt nhau.
function veVungBamDuoc(khung, noiDung, spans, tuyChon = {}) {
  veTinCoCum(khung, noiDung || '', spans, taoCumBamDuoc, tuyChon);
  return khung;
}

// Tin nhắn mở đầu: các cụm là nút bấm được, lúc chưa bấm trông y như chữ thường
function themTinMoDau(noiDung, spans, tuyChon = {}) {
  const tin = document.createElement('p');
  tin.className = 'tin tin--npc';
  veVungBamDuoc(tin, noiDung, spans, tuyChon);
  o.vungTin.appendChild(tin);
  return tin;
}

// Ảnh đính kèm trong bong bóng chat. Vùng bấm được nằm đè lên ảnh: cụm có
// trường `vung` thì chỉ đúng ô đó bấm được (toạ độ phần trăm so với ảnh, nên
// ảnh co giãn thế nào ô vẫn bám đúng chỗ), cụm không có `vung` thì cả tấm ảnh
// là một vùng. Bấm ra ngoài mọi vùng thì không có gì xảy ra.
function taoVungAnh(span) {
  const nut = document.createElement('span');
  nut.className = span.vung ? 'cum cum-anh' : 'cum cum-anh cum-anh--ca-tam';
  nut.dataset.spanId = span.id;
  nut.setAttribute('role', 'button');
  nut.setAttribute('tabindex', '0');
  nut.setAttribute('aria-pressed', 'false');
  // Nhãn cố tình không nói cụm này là dấu hiệu đỏ hay cụm mồi
  nut.setAttribute('aria-label', span.label || 'Vùng trong ảnh đính kèm');
  if (span.vung) {
    const v = span.vung;
    nut.style.left = `${v.trai}%`;
    nut.style.top = `${v.tren}%`;
    nut.style.width = `${v.rong}%`;
    nut.style.height = `${v.cao}%`;
  }
  return nut;
}

// Một bong bóng cho một ảnh: ảnh bo góc, tên tệp nằm dưới như tệp đính kèm thật
function themAnhDinhKem(dinhKem) {
  const tin = document.createElement('div');
  tin.className = 'tin tin--npc tin--anh';

  const khungAnh = document.createElement('div');
  khungAnh.className = 'anh-dinh-kem';

  const anh = document.createElement('img');
  anh.className = 'anh-dinh-kem__anh';
  anh.src = dinhKem.src;
  anh.alt = dinhKem.alt || dinhKem.filename || 'Ảnh đính kèm';
  anh.loading = 'lazy';
  anh.onerror = () => khungAnh.classList.add('anh-dinh-kem--loi');
  khungAnh.appendChild(anh);

  for (const s of dinhKem.spans || []) khungAnh.appendChild(taoVungAnh(s));
  tin.appendChild(khungAnh);

  if (dinhKem.filename) {
    const ten = document.createElement('p');
    ten.className = 'anh-dinh-kem__ten';
    ten.textContent = dinhKem.filename;
    tin.appendChild(ten);
  }

  o.vungTin.appendChild(tin);
  return tin;
}

// Ảnh đi ngay sau tin mở đầu, đúng thứ tự khai trong database
function themMoiAnhDinhKem(attachments) {
  for (const a of attachments || []) {
    if (a.type === 'image' && a.src) themAnhDinhKem(a);
  }
}

function veCumDaDanhDau() {
  // Quét cả cột giữa chứ không riêng vùng tin, vì khung thư có cụm nằm ở
  // địa chỉ người gửi và tiêu đề, ngoài thân thư
  for (const nut of o.cotGiua.querySelectorAll('.cum')) {
    const bat = trangThai.spanDaDanhDau.has(nut.dataset.spanId);
    nut.classList.toggle('cum--danh-dau', bat);
    nut.setAttribute('aria-pressed', bat ? 'true' : 'false');
  }
}

// Ô bằng chứng ở cột trái: liệt kê đúng những cụm người chơi đã bấm, theo
// thứ tự xuất hiện trong tình huống chứ không theo thứ tự bấm
function veBangChung() {
  const moiSpan = [
    ...(trangThai.caseHienTai?.spans || []),
    ...(trangThai.caseHienTai?.attachments || []).flatMap((a) => a.spans || [])
  ];
  const daChon = moiSpan.filter((s) => trangThai.spanDaDanhDau.has(s.id));

  o.dsBangChung.innerHTML = '';
  for (const s of daChon) {
    const muc = document.createElement('li');
    muc.textContent = s.text || s.label || 'Cụm trong ảnh đính kèm';
    o.dsBangChung.appendChild(muc);
  }

  o.demBangChung.textContent = daChon.length;
  o.dsBangChung.hidden = daChon.length === 0;
  o.goiYBangChung.hidden = daChon.length > 0;
}

// Bấm lại để bỏ chọn. Cả dấu hiệu đỏ và cụm mồi hành xử giống hệt nhau.
function batTatCum(spanId) {
  if (trangThai.daChotQuyetDinh) return;
  if (trangThai.spanDaDanhDau.has(spanId)) trangThai.spanDaDanhDau.delete(spanId);
  else trangThai.spanDaDanhDau.add(spanId);
  veCumDaDanhDau();
  veBangChung();
  capNhatMascotChoi();
}

// Bộ đếm lượt nhắn NPC, nằm trong khung điện thoại
function veDemLuot() {
  const c = trangThai.caseHienTai;
  // Ô nhập hẹp nên chỉ lấy phần tên trước dấu gạch, tránh bị cắt cụt
  const tenNPC = tenNgan(c?.npc?.display_name) || 'người gửi';

  // Kênh không có ai để nhắn lại thì ẩn hẳn ô nhập, không để ô xám giữ chỗ.
  // Cuộc gọi chưa nghe máy cũng vậy: chưa có ai ở đầu dây để nói.
  if (!coTheNhanTin()) {
    o.oNhap.hidden = true;
    o.demLuot.hidden = true;
    return;
  }

  // Đang gọi thì là nói, không phải nhắn. Gọi đúng tên việc người chơi đang làm.
  const laGoi = KENH_GOI.has(trangThai.kenh);
  const dongTu = laGoi ? 'nói' : 'nhắn';

  const n = trangThai.luotChatConLai;
  o.oNhap.hidden = false;
  o.demLuot.hidden = false;
  o.demLuot.textContent = n > 0
    ? `Còn ${n} lượt ${dongTu}`
    : `Đã hết lượt ${dongTu}, hãy chốt quyết định`;

  o.nhapTin.disabled = n <= 0 || trangThai.daChotQuyetDinh;
  o.nutGui.disabled = o.nhapTin.disabled;

  // Nhãn ghi rõ đang nói với ai, để không lẫn với ô "Hỏi trợ lý" ở cột phải
  const nhan = laGoi ? `Nói với ${tenNPC}` : `Nhắn cho ${tenNPC}`;
  o.nhapTin.placeholder = n > 0 ? nhan : `Đã hết lượt ${dongTu}`;
  o.nhapTin.setAttribute('aria-label', nhan);
}

// Bộ đếm lượt hỏi trợ lý, nằm ở tiêu đề cột phải — chỗ khác hẳn bộ đếm trên
function veDemLuotTroLy() {
  const n = trangThai.luotTroLyConLai;
  o.demLuotTroLy.textContent = n > 0 ? `Còn ${n} lượt hỏi` : 'Đã hết lượt hỏi';
  o.nhapTroLy.disabled = n <= 0 || trangThai.daChotQuyetDinh || trangThai.dangHoiTroLy;
  o.nutGuiTroLy.disabled = o.nhapTroLy.disabled;
  o.nhapTroLy.placeholder = n > 0 ? 'Hỏi trợ lý' : 'Đã hết lượt hỏi trợ lý';
}

function veNutKiemChung() {
  const con = trangThai.luotKiemChungConLai;
  o.nutKiemChung.disabled = con <= 0 || trangThai.dangCho || trangThai.daChotQuyetDinh;
  // "Gọi lại bằng số đã lưu" trên màn phủ cuộc gọi chính là nút kiểm chứng,
  // nên nó phải hết lượt cùng lúc chứ không được là đường vòng
  o.nutGoiLai.disabled = o.nutKiemChung.disabled;
  o.ghiChuKiemChung.hidden = con > 0;
  if (con <= 0) {
    o.ghiChuKiemChung.textContent = 'Đã dùng hết lượt kiểm chứng cho tình huống này, bạn vẫn cần chọn làm theo hoặc không làm';
  }
}

// Ô ảnh bối cảnh ẩn hẳn khi tình huống không có ảnh, hoặc ảnh không tải được
function napAnhBoiCanh(duongDan) {
  if (!duongDan) {
    o.khungAnhBoiCanh.hidden = true;
    o.anhBoiCanh.removeAttribute('src');
    return;
  }
  o.anhBoiCanh.onload = () => { o.khungAnhBoiCanh.hidden = false; };
  o.anhBoiCanh.onerror = () => { o.khungAnhBoiCanh.hidden = true; };
  o.khungAnhBoiCanh.hidden = true;
  o.anhBoiCanh.src = duongDan;
}

// Tên hiển thị là số điện thoại thì không viết tắt được, dùng icon người
function laSoDienThoai(chu) {
  return /^[+(]?\d[\d\s.()-]{4,}$/.test((chu || '').trim());
}

const TU_XUNG_HO = new Set(['chị', 'anh', 'cô', 'chú', 'bác', 'ông', 'bà', 'em', 'thầy']);

// Bỏ phần đứng sau dấu gạch, ví dụ "Phòng tài chính - ĐH Đông Phương"
function tenNgan(tenHienThi) {
  return (tenHienThi || '').split(/\s[-–]\s/)[0].trim();
}

function chuVietTat(tenHienThi) {
  const phanTen = tenNgan(tenHienThi);
  const tu = phanTen.split(/\s+/).filter((t) => t && !TU_XUNG_HO.has(t.toLowerCase()));
  if (tu.length === 0) return '';
  return tu.slice(-2).map((t) => t[0]).join('').toUpperCase();
}

function veAvatar(npc = {}) {
  const tenHienThi = npc.display_name || '';
  const viet = laSoDienThoai(tenHienThi) ? '' : chuVietTat(tenHienThi);

  o.chuAvatar.textContent = viet;
  o.chuAvatar.hidden = !viet;
  o.iconNguoi.hidden = Boolean(viet);

  o.khungAvatar.classList.remove('co-anh');
  if (!npc.avatar) {
    o.anhAvatar.removeAttribute('src');
    return;
  }
  o.anhAvatar.onload = () => o.khungAvatar.classList.add('co-anh');
  o.anhAvatar.onerror = () => o.khungAvatar.classList.remove('co-anh');
  o.anhAvatar.src = npc.avatar;
}

// Hai kênh này dùng chung màn phủ cuộc gọi và chung khung điện thoại nền tối
const KENH_GOI = new Set(['call', 'video_call']);

// ---- Cột giữa: khung điện thoại ----

// hoanNoiDung: kênh cuộc gọi lúc chưa nghe máy. Chưa nhấc máy thì ngoài đời
// cũng chưa biết người ta định nói gì, nên không đổ sẵn nội dung ra sau lưng
// màn phủ — nếu đổ sẵn thì người chơi cúp máy xong vẫn đọc được hết, và việc
// nghe hay không nghe mất sạch ý nghĩa.
function veKhungDienThoai(duLieu, { hoanNoiDung = false } = {}) {
  const c = duLieu.caseData;
  const spans = c.spans || [];
  const daKhop = new Set();
  const tuyChon = { canhBao: false, daKhop };

  const tenHienThi = c.npc?.display_name || '—';
  o.tenLienHe.textContent = tenHienThi;
  // Tên dài như "Phòng tài chính - ĐH Đông Phương" phải đọc được hết, hạ cỡ
  // chữ để nó vừa hai dòng thay vì bị cắt mất phần đuôi
  o.tenLienHe.classList.toggle('lien-he__ten--dai', tenHienThi.length > 24);

  // Dòng trạng thái đánh dấu được: Design Spec mục 8 xếp nó vào loại dấu hiệu
  // đỏ, ví dụ "số chưa có trong danh bạ" hay "kết nối kém, hình ảnh chập chờn".
  // Không có cụm nào khớp thì nó chỉ là chữ thường, y như trước.
  o.trangThaiLienHe.innerHTML = '';
  veVungBamDuoc(o.trangThaiLienHe, c.npc?.status_line, spans, tuyChon);

  veAvatar(c.npc || {});

  o.vungTin.innerHTML = '';
  if (hoanNoiDung) {
    const cho = document.createElement('p');
    cho.className = 'tin tin--cho';
    cho.textContent = 'Chưa nghe máy nên bạn chưa biết người gọi định nói gì.';
    o.vungTin.appendChild(cho);
  } else {
    if (duLieu.openingMessage) themTinMoDau(duLieu.openingMessage, spans, tuyChon);
    themMoiAnhDinhKem(c.attachments);
    for (const tin of duLieu.lichSuChat || []) themTin(tin.role, tin.content);

    // Dựng xong hết mới biết cụm nào không khớp vùng nào, lúc đó mới đáng kêu
    for (const s of spans) {
      if (s.text && !daKhop.has(s.id)) {
        console.warn(`[app] Cụm "${s.id}" không khớp chuỗi nào trong tin nhắn, kiểm tra lại trường text.`);
      }
    }
  }

  o.khungDienThoai.hidden = false;
  o.khungThu.hidden = true;
}

// ---- Cột giữa: khung hộp thư ----

// Thư trải nội dung ra nhiều vùng rời nhau. Vùng nào cũng đánh dấu được, kể
// cả địa chỉ người gửi — với tình huống email đó thường là dấu hiệu đắt nhất.
function veKhungThu(duLieu) {
  const c = duLieu.caseData;
  const e = c.email || {};
  const spans = c.spans || [];
  const daKhop = new Set();
  const tuyChon = { canhBao: false, daKhop };

  o.thuTenNguoiGui.textContent = e.from_name || '';

  o.thuDiaChi.innerHTML = '';
  veVungBamDuoc(o.thuDiaChi, e.from_address, spans, tuyChon);

  o.thuToi.textContent = e.to_address ? `Tới: ${e.to_address}` : '';
  o.thuGio.textContent = e.time || '';

  o.thuTieuDe.innerHTML = '';
  veVungBamDuoc(o.thuTieuDe, e.subject, spans, tuyChon);

  o.thuThan.innerHTML = '';
  veVungBamDuoc(o.thuThan, duLieu.openingMessage || c.opening_message, spans, tuyChon);

  // Thanh dung lượng giả, đổi sang màu cảnh báo khi trên 90
  const phanTram = Number(e.progress_percent) || 0;
  o.thuDungLuong.hidden = !e.has_progress_bar;
  if (e.has_progress_bar) {
    o.thuThanh.style.width = `${Math.max(0, Math.min(100, phanTram))}%`;
    o.thuThanh.classList.toggle('thu__thanh--gap', phanTram > 90);
    o.thuPhanTram.textContent = `${phanTram}% dung lượng`;
  }

  o.thuMa.innerHTML = '';
  o.thuMa.hidden = !e.ticket_id;
  if (e.ticket_id) {
    o.thuMa.appendChild(document.createTextNode('Mã yêu cầu hỗ trợ: '));
    veVungBamDuoc(o.thuMa, e.ticket_id, spans, tuyChon);
  }

  o.thuNut.textContent = e.cta_label || '';
  o.thuNut.hidden = !e.cta_label;
  o.thuNhac.hidden = true;

  o.thuChan.textContent = e.footer || '';
  o.thuChan.hidden = !e.footer;

  // Giờ mới biết cụm nào không khớp vùng nào, lúc đó mới đáng kêu
  for (const s of spans) {
    if (s.text && !daKhop.has(s.id)) {
      console.warn(`[app] Cụm "${s.id}" không khớp chuỗi nào trong thư, kiểm tra lại trường text.`);
    }
  }

  o.khungThu.hidden = false;
  o.khungDienThoai.hidden = true;
}

function veCotGiua(duLieu) {
  const c = duLieu.caseData;
  const kenh = c.channel || 'chat';
  const laGoi = KENH_GOI.has(kenh);

  trangThai.kenh = kenh;
  trangThai.daNgheMay = false;

  if (kenh === 'email') veKhungThu(duLieu);
  else veKhungDienThoai(duLieu, { hoanNoiDung: laGoi });

  // Khung điện thoại đổi sang da tối khi đang trong cuộc gọi. Dùng lại khung
  // này thay vì dựng khung thứ ba, để bộ đếm lượt và ô nhập chỉ có đúng một bản.
  o.khungDienThoai.dataset.kenh = kenh;

  // Khung thư không bao giờ có ô nhập. Kênh khác thì chỉ có khi còn lượt nhắn.
  trangThai.coONhapNPC = kenh !== 'email' && (c.max_chat_turns ?? 0) > 0;

  if (laGoi) moLopCuocGoi(duLieu);
  else dongLopCuocGoi();
  veThanhCuocGoi();
}

// ---- Màn phủ cuộc gọi (Design Spec mục 9) ----

// Có ai ở đầu dây bên kia để nói chuyện không. Kênh cuộc gọi mà chưa nghe máy
// thì chưa có, dù tình huống vẫn còn nguyên lượt nhắn.
function coTheNhanTin() {
  if (!trangThai.coONhapNPC) return false;
  if (KENH_GOI.has(trangThai.kenh) && !trangThai.daNgheMay) return false;
  return true;
}

function moLopCuocGoi(duLieu) {
  const npc = duLieu.caseData.npc || {};
  const spans = duLieu.caseData.spans || [];
  const laVideo = trangThai.kenh === 'video_call';

  o.goiNhan.textContent = laVideo ? 'Cuộc gọi video đến' : 'Cuộc gọi đến';
  o.goiTen.textContent = npc.display_name || 'Số không xác định';

  o.goiTrangThai.innerHTML = '';
  veVungBamDuoc(o.goiTrangThai, npc.status_line, spans, { canhBao: false });

  // Khuôn mặt mờ. Chưa có ảnh thì rơi về chữ viết tắt chứ không để ô trống.
  o.goiChuTat.textContent = laSoDienThoai(npc.display_name) ? '' : chuVietTat(npc.display_name);
  o.goiMat.classList.remove('co-anh');
  o.goiMat.dataset.video = laVideo ? '1' : '0';
  if (npc.avatar) {
    o.goiAnh.onload = () => o.goiMat.classList.add('co-anh');
    o.goiAnh.onerror = () => o.goiMat.classList.remove('co-anh');
    o.goiAnh.src = npc.avatar;
  } else {
    o.goiAnh.removeAttribute('src');
  }

  o.lopCuocGoi.hidden = false;
  // Focus vào khung chứ không vào nút nào: kể cả "Gọi lại bằng số đã lưu" cũng
  // không được gợi ý sẵn, vì chọn kiểm chứng phải là việc có ý thức
  o.lopCuocGoi.focus();
}

const dongLopCuocGoi = () => { o.lopCuocGoi.hidden = true; };

// Thanh trạng thái nằm trong khung điện thoại, chỉ hiện ở kênh cuộc gọi
function veThanhCuocGoi() {
  if (!KENH_GOI.has(trangThai.kenh)) {
    o.thanhCuocGoi.hidden = true;
    return;
  }
  o.thanhCuocGoi.hidden = false;
  o.thanhGoiChu.textContent = trangThai.daNgheMay
    ? 'Đang trong cuộc gọi'
    : 'Bạn đã cúp máy, họ vẫn đang gọi lại';
  o.nutNgheLai.hidden = trangThai.daNgheMay;
}

function ngheMay() {
  if (trangThai.daNgheMay) return;
  trangThai.daNgheMay = true;
  dongLopCuocGoi();

  // Giờ mới đổ nội dung ra, kèm lịch sử nói chuyện nếu đã có
  if (trangThai.duLieuCase) veKhungDienThoai(trangThai.duLieuCase, { hoanNoiDung: false });

  veThanhCuocGoi();
  veCumDaDanhDau();
  veBangChung();
  veDemLuot();
  noiMascot('Nghe kỹ xem họ đang muốn gì.');
}

// Cúp máy không phải quyết định cuối, chỉ là dừng nghe. Người chơi vẫn còn
// trợ lý, còn kiểm chứng, và vẫn phải chốt làm theo hay không làm.
function tuChoiMay() {
  dongLopCuocGoi();
  veThanhCuocGoi();
  veDemLuot();
  noiMascot('Chưa nghe thì chưa rõ gì.');
}

// ---- Cột phải: trợ lý an toàn ----

function themTinTroLy(vaiTro, noiDung) {
  const tin = document.createElement('p');
  tin.className = `tin-tro-ly tin-tro-ly--${vaiTro === 'user' ? 'nguoi-choi' : 'tro-ly'}`;
  veNoiDungTin(tin, noiDung);
  o.vungTroLy.appendChild(tin);
  o.vungTroLy.scrollTop = o.vungTroLy.scrollHeight;
  return tin;
}

// Lời chào mở đầu, viết theo đúng kênh người chơi đang nhìn thấy. Câu "mình
// không biết đây có phải lừa đảo hay không" là câu trả lời khi người chơi hỏi
// thẳng kết luận — đặt nó làm lời chào là trả lời một câu chưa ai hỏi, và lặp
// y hệt ở mọi tình huống thì đọc như máy. Chào xong chỉ đẩy người chơi nhìn
// vào hai thứ: ai đang liên hệ, và họ muốn mình làm gì.
const CHAO_TRO_LY = {
  chat: 'Mình ở đây nếu bạn cần. Bạn thử để ý xem ai đang nhắn cho bạn và họ đang muốn bạn làm gì.',
  email: 'Mình ở đây nếu bạn cần. Bạn thử để ý xem ai gửi thư này và họ đang muốn bạn làm gì.',
  call: 'Mình ở đây nếu bạn cần. Bạn thử để ý xem ai đang gọi và họ đang muốn bạn làm gì ngay lúc này.'
};

function loiChaoTroLy(kenh) {
  if (kenh === 'call' || kenh === 'video_call') return CHAO_TRO_LY.call;
  return CHAO_TRO_LY[kenh] || CHAO_TRO_LY.chat;
}

function veTroLy(duLieu) {
  trangThai.luotTroLyConLai = duLieu.luotTroLyConLai ?? 0;

  o.vungTroLy.innerHTML = '';
  const lichSu = duLieu.lichSuTroLy || [];
  if (lichSu.length === 0) {
    themTinTroLy('assistant', loiChaoTroLy(duLieu.caseData?.channel));
  } else {
    for (const tin of lichSu) themTinTroLy(tin.role, tin.content);
  }

  veDemLuotTroLy();
}

function veCase(duLieu) {
  const c = duLieu.caseData;
  trangThai.caseHienTai = c;
  // Giữ nguyên bản để dựng lại cột giữa lúc người chơi nhấc máy
  trangThai.duLieuCase = duLieu;
  trangThai.thuTu = duLieu.thuTu;
  trangThai.tongSoCase = duLieu.tongSoCase;
  trangThai.luotChatConLai = duLieu.luotChatConLai;
  trangThai.luotKiemChungConLai = duLieu.luotKiemChungConLai;
  trangThai.daChotQuyetDinh = false;
  trangThai.dangHoiTroLy = false;
  trangThai.kiemChungDaDung = new Set();
  trangThai.thuongKiemChung = 0;
  // Người chơi yếu được tô sẵn một dấu hiệu theo support_hint
  trangThai.spanDaDanhDau = new Set(duLieu.spanDaDanhDau || []);

  o.tenGiaiDoan.textContent = c.stageName || 'Tình huống';
  const icon = ICON_GIAI_DOAN[c.stageIcon];
  if (icon) o.iconGiaiDoan.querySelector('svg').innerHTML = icon;

  // Sang lượt mới thì dựng lại thanh chặng từ đầu. So mỗi độ dài là không đủ:
  // lượt sau có đúng bằng số tình huống thì màu đúng/sai của lượt trước ở lại,
  // và người chơi thấy chặng chưa tới đã xanh như đã làm đúng.
  if (trangThai.luotId !== duLieu.luotId || trangThai.chang.length !== duLieu.tongSoCase) {
    // Bóc tách lưu theo số thứ tự chặng, mà mỗi lượt lại đánh số lại từ 1. Giữ
    // lại của lượt trước là bấm chặng 1 ở màn kết ra bài học của tình huống
    // khác hẳn. Đổi lượt thì bỏ hết, kể cả khi chỉ là chơi tiếp sau ôn tập.
    if (trangThai.luotId !== duLieu.luotId) trangThai.bocTachTheoChang = new Map();
    trangThai.luotId = duLieu.luotId;
    trangThai.chang = Array.from({ length: duLieu.tongSoCase }, () => 'chua_toi');
  }
  trangThai.chang = trangThai.chang.map((t, i) => {
    if (i === duLieu.thuTu - 1) return 'dang_choi';
    return t === 'dang_choi' ? 'chua_toi' : t;
  });
  veTienTrinh();

  o.chuBoiCanh.textContent = c.context?.text || '';
  napAnhBoiCanh(c.context?.image);

  veCotGiua(duLieu);
  veCumDaDanhDau();
  veBangChung();
  veTroLy(duLieu);

  veChiSo(duLieu.stats);
  veDemLuot();
  veNutKiemChung();

  // Vào tình huống mới thì mặt mascot phải trở lại bình thường, kể cả khi
  // tình huống trước vừa kết ở mặt thất vọng
  capNhatMascotChoi();

  // Bong bóng chỉ cao 2 dòng và cột trái hẹp, nên lời mascot phải thật ngắn
  noiMascot(duLieu.hoTro?.bat
    ? 'Mình tô sẵn một dấu hiệu rồi đó.'
    : 'Bấm vào chỗ đáng ngờ nhé.');

  dongXacNhan();
  o.oLyDo.hidden = true;
  o.nhomNut.hidden = false;
  batNutHanhDong(true);
}

function batNutHanhDong(bat) {
  o.nutSanSang.disabled = !bat;
  o.nutLamTheo.disabled = !bat;
  o.nutKhongLam.disabled = !bat;
  veNutKiemChung();
  veDemLuotTroLy();
}

// ================= LUỒNG CHƠI =================

async function batDauLuot() {
  try {
    anLoi();
    noiMascot('Đang chuẩn bị tình huống');
    const batDau = await goiApi('/api/run/start', {
      body: { name: 'Người chơi', birthYear: null, gender: '', demoCaseIds: danhSachDemo() }
    });
    veChiSo(batDau.stats);
    canhBaoNoiDung(batDau.warnings);
    trangThai.bocTachTheoChang = new Map();
    trangThai.luotId = batDau.tienDo.luotId;
    trangThai.chang = Array.from({ length: batDau.tienDo.tongSoCase }, () => 'chua_toi');
    veTienTrinh();
    await napCaseHienTai();
    await luuTienDo();
  } catch (loi) {
    hienLoi(loi);
    noiMascot('Chưa vào được lượt. Thử lại từ menu nhé.');
    moManMenu();
  }
}

async function napCaseHienTai() {
  try {
    anLoi();
    const duLieu = await goiApi('/api/run/current-case');

    if (duLieu.ketThuc) {
      await veManKet();
      return;
    }
    veCase(duLieu);
    hienMan('manChoi');
  } catch (loi) {
    hienLoi(loi);
  }
}

// Chỉ báo đang soạn tin phải hiện ngay từ mili giây đầu, không chờ máy chủ:
// hàm này dựng ô chỉ báo và trả về hàm gỡ nó đi.
//
// Quá ngưỡng dưới thì nói thêm một câu — ba chấm nhấp nháy im lìm quá lâu trông
// y như treo máy, người chơi sẽ bấm lại hoặc tải lại trang.
const NGUONG_SOAN_LAU_MS = 3000;

function moChiBaoDangSoan(vung, lop, nhan) {
  const chiBao = document.createElement('div');
  chiBao.className = `${lop} tin--dang-soan`;
  chiBao.setAttribute('aria-label', nhan);
  chiBao.innerHTML = '<i></i><i></i><i></i>';
  vung.appendChild(chiBao);
  vung.scrollTop = vung.scrollHeight;

  const hen = setTimeout(() => {
    const chu = document.createElement('span');
    chu.className = 'tin--dang-soan__chu';
    chu.textContent = 'đang soạn tin, hơi lâu một chút';
    chiBao.appendChild(chu);
    chiBao.setAttribute('aria-label', `${nhan}, hơi lâu một chút`);
    vung.scrollTop = vung.scrollHeight;
  }, NGUONG_SOAN_LAU_MS);

  return () => {
    clearTimeout(hen);
    chiBao.remove();
  };
}

async function guiTinNhan(su) {
  su.preventDefault();
  const chu = o.nhapTin.value.trim();
  if (!chu || trangThai.dangCho || trangThai.daChotQuyetDinh) return;

  trangThai.dangCho = true;
  o.nhapTin.value = '';
  o.nhapTin.disabled = true;
  o.nutGui.disabled = true;
  themTin('user', chu);

  const dongChiBao = moChiBaoDangSoan(o.vungTin, 'tin tin--npc', 'Đang soạn tin');

  try {
    anLoi();
    const traLoi = await goiApi('/api/case/chat', { body: { message: chu } });
    dongChiBao();
    themTin('assistant', traLoi.reply);
    trangThai.luotChatConLai = traLoi.luotConLai;
    veChiSo(traLoi.stats);
  } catch (loi) {
    dongChiBao();
    hienLoi(loi);
  } finally {
    trangThai.dangCho = false;
    veDemLuot();
  }
}

// ================= HỎI TRỢ LÝ AN TOÀN =================

// Hỏi trợ lý không cộng điểm và không đụng tới chỉ số. Nó dạy cách phân tích,
// còn Kiểm chứng dạy thói quen đi xác minh — chỉ việc thứ hai mới được thưởng.
async function guiCauHoiTroLy(su) {
  su.preventDefault();
  const chu = o.nhapTroLy.value.trim();
  if (!chu || trangThai.dangHoiTroLy || trangThai.daChotQuyetDinh) return;
  if (trangThai.luotTroLyConLai <= 0) return;

  trangThai.dangHoiTroLy = true;
  o.nhapTroLy.value = '';
  veDemLuotTroLy();
  themTinTroLy('user', chu);

  const dongChiBao = moChiBaoDangSoan(
    o.vungTroLy,
    'tin-tro-ly tin-tro-ly--tro-ly',
    'Trợ lý đang soạn câu trả lời'
  );

  try {
    anLoi();
    const traLoi = await goiApi('/api/case/assistant', { body: { message: chu } });
    dongChiBao();
    themTinTroLy('assistant', traLoi.reply);
    trangThai.luotTroLyConLai = traLoi.luotConLai;
  } catch (loi) {
    dongChiBao();
    hienLoi(loi);
  } finally {
    trangThai.dangHoiTroLy = false;
    veDemLuotTroLy();
  }
}

// ================= KIỂM CHỨNG =================

function moKiemChung() {
  const ds = trangThai.caseHienTai?.verification || [];
  o.dsKiemChung.innerHTML = '';

  for (const luaChon of ds) {
    const nut = document.createElement('button');
    nut.type = 'button';
    nut.className = 'lua-chon';
    nut.textContent = luaChon.label;
    nut.disabled = trangThai.kiemChungDaDung.has(luaChon.id);
    nut.addEventListener('click', () => dungKiemChung(luaChon));
    o.dsKiemChung.appendChild(nut);
  }

  o.chuLuotKiemChung.textContent = `Còn ${trangThai.luotKiemChungConLai} lượt kiểm chứng cho tình huống này`;
  o.dsKiemChung.hidden = false;
  o.ketKiemChung.hidden = true;
  o.nutQuayLaiChat.hidden = true;
  o.lopKiemChung.hidden = false;
  o.nutDongKiemChung.focus();
}

const dongKiemChung = () => { o.lopKiemChung.hidden = true; };

async function dungKiemChung(luaChon) {
  if (trangThai.dangCho) return;
  trangThai.dangCho = true;

  try {
    anLoi();
    const ketQua = await goiApi('/api/case/verify', { body: { optionId: luaChon.id } });

    trangThai.kiemChungDaDung.add(luaChon.id);
    trangThai.luotKiemChungConLai = ketQua.luotKiemChungConLai;
    trangThai.thuongKiemChung += ketQua.thuong?.sucKhoe || 0;
    veChiSo(ketQua.stats);

    o.nhanKenhKiemChung.textContent = ketQua.luaChon.label;
    o.chuKetKiemChung.textContent = ketQua.luaChon.result;

    // Hỏi lại chính người gửi thì không phải kiểm chứng, nói rõ ngay tại đây
    const luuY = ketQua.luaChon.is_independent === false
      ? (ketQua.luaChon.note || 'Hỏi lại chính kênh đang nghi ngờ không phải là kiểm chứng')
      : '';
    o.chuLuuYKiemChung.textContent = luuY;
    o.chuLuuYKiemChung.hidden = !luuY;

    o.dsKiemChung.hidden = true;
    o.ketKiemChung.hidden = false;
    o.nutQuayLaiChat.hidden = false;
    o.chuLuotKiemChung.textContent = `Còn ${trangThai.luotKiemChungConLai} lượt kiểm chứng cho tình huống này`;
    o.nutQuayLaiChat.focus();

    noiMascot('Xong rồi. Giờ tới lượt bạn quyết định.');
  } catch (loi) {
    hienLoi(loi);
    dongKiemChung();
  } finally {
    trangThai.dangCho = false;
    veNutKiemChung();
  }
}

// ================= BƯỚC 2 — OVERLAY XÁC NHẬN =================

function moXacNhan() {
  const nhan = trangThai.luotChatConLai;
  const kc = trangThai.luotKiemChungConLai;

  // Kênh không có ai để nhắn thì nhắc về lượt hỏi trợ lý, chứ nói "đã dùng hết
  // lượt nhắn" ở một tình huống email là nhắc về thứ chưa từng tồn tại
  if (coTheNhanTin()) {
    const dongTu = KENH_GOI.has(trangThai.kenh) ? 'nói' : 'nhắn';
    o.nhacLuotNhan.textContent = nhan > 0
      ? `Bạn còn ${nhan} lượt ${dongTu} chưa dùng`
      : `Bạn đã dùng hết lượt ${dongTu}`;
  } else {
    const tl = trangThai.luotTroLyConLai;
    o.nhacLuotNhan.textContent = tl > 0
      ? `Bạn còn ${tl} lượt hỏi trợ lý chưa dùng`
      : 'Bạn đã dùng hết lượt hỏi trợ lý';
  }

  o.nhacLuotKiemChung.textContent = kc > 0
    ? `Bạn còn ${kc} lượt kiểm chứng chưa dùng`
    : 'Bạn đã dùng hết lượt kiểm chứng';

  o.lopXacNhan.hidden = false;
  // Không focus sẵn nút nào để không ngầm gợi ý lối ra nào
  o.lopXacNhan.focus();
}

const dongXacNhan = () => { o.lopXacNhan.hidden = true; };

// ================= BƯỚC 3 — MÀN QUYẾT ĐỊNH =================

// Văn bản gốc dùng lại ở màn quyết định và màn bóc tách.
//
// Với kênh email, nội dung người chơi đọc nằm rải ở nhiều vùng, mà hai màn
// này chỉ dựng một khối văn bản liền. Ghép lại theo đúng thứ tự trên màn hình
// để mọi cụm — kể cả địa chỉ người gửi và mã yêu cầu — vẫn tô lại được.
function vanBanGocCuaCase(c, tinMoDau) {
  const than = tinMoDau || c?.opening_message || '';
  const e = c?.email;
  if (e) {
    return [e.from_address, e.subject, than, e.ticket_id]
      .filter(Boolean)
      .join('\n\n');
  }

  // Dòng trạng thái dưới tên người gửi cũng đánh dấu được — "số chưa có trong
  // danh bạ", "kết nối kém, hình ảnh chập chờn". Vệt bôi phải được mang sang
  // màn quyết định và màn bài học làm bằng chứng, nên nó đi kèm luôn ở đây.
  return [c?.npc?.status_line, than].filter(Boolean).join('\n\n');
}

function moManQuyetDinh() {
  dongXacNhan();

  const c = trangThai.caseHienTai;
  const daDanhDau = trangThai.spanDaDanhDau;

  // Dựng lại tin nhắn kèm đúng những cụm người chơi đã đánh dấu, để quyết định
  // dựa trên bằng chứng chứ không phải trí nhớ
  o.tinThuGon.innerHTML = '';
  veTinCoCum(o.tinThuGon, vanBanGocCuaCase(c), c.spans, (span) => {
    const cum = document.createElement('span');
    cum.className = 'cum-goc';
    if (daDanhDau.has(span.id)) cum.classList.add('cum-goc--trung');
    return cum;
  });

  const soCum = [...daDanhDau].length;
  o.chuThichDaDanhDau.textContent = soCum > 0
    ? `Bạn đã đánh dấu ${soCum} cụm, nền vàng ở trên.`
    : 'Bạn chưa đánh dấu cụm nào trong tin nhắn này.';

  o.oLyDo.hidden = true;
  o.nhapLyDo.value = '';
  o.nutLamTheo.disabled = false;
  o.nutKhongLam.disabled = false;

  hienMan('manQuyetDinh');
}

// ================= GỬI QUYẾT ĐỊNH =================

async function guiQuyetDinh(quyetDinh, lyDo) {
  if (trangThai.dangCho || trangThai.daChotQuyetDinh) return;

  trangThai.dangCho = true;
  o.nutLamTheo.disabled = true;
  o.nutKhongLam.disabled = true;
  o.nutGuiLyDo.disabled = true;
  noiMascot('Để mình xem lại tình huống này');

  try {
    anLoi();

    // Gửi danh sách cụm đã đánh dấu trước, rồi mới chốt quyết định
    await goiApi('/api/case/spans', { body: { spanIds: [...trangThai.spanDaDanhDau] } });

    const ketQua = await goiApi('/api/case/decision', {
      body: { decision: quyetDinh, reason: lyDo || '' }
    });
    // Giữ lại quyết định và lý do đã gửi để màn bóc tách nói đúng ngữ cảnh
    ketQua.quyetDinhCuaBan = quyetDinh;
    ketQua.lyDoCuaBan = lyDo || '';
    veBocTach(ketQua);
    // Lưu sau khi bóc tách chứ không trước: bản lưu phải chứa cả bài học vừa
    // dựng, để màn kết ở phiên sau vẫn xem lại được từng chặng
    await luuTienDo();
  } catch (loi) {
    hienLoi(loi);
    // Vẫn ở màn quyết định, cho bấm lại chứ không đẩy về hội thoại
    o.nutLamTheo.disabled = false;
    o.nutKhongLam.disabled = false;
    noiMascot('Chưa gửi được. Bạn thử lại nhé.');
  } finally {
    trangThai.dangCho = false;
    o.nutGuiLyDo.disabled = false;
  }
}

// ================= MÀN BÓC TÁCH BÀI HỌC =================

const dauSo = (n) => (n > 0 ? `+${n}` : `${n}`);

function lopDiem(n) {
  if (n > 0) return 'diem--cong';
  if (n < 0) return 'diem--tru';
  return 'diem--khong';
}

function hangDiem(nhan, phan) {
  const phanTuSo = [];
  if (phan.sucKhoe) phanTuSo.push(`<span class="${lopDiem(phan.sucKhoe)}">Tinh thần ${dauSo(phan.sucKhoe)}</span>`);
  if (phan.lyTri) phanTuSo.push(`<span class="${lopDiem(phan.lyTri)}">Lý trí ${dauSo(phan.lyTri)}</span>`);
  const chuSo = phanTuSo.length ? phanTuSo.join(' · ') : '<span class="diem--khong">0</span>';

  const hang = document.createElement('tr');
  hang.innerHTML = `<td>${nhan}</td><td>${chuSo}</td>`;
  return hang;
}

function themDauHieu(khung, span) {
  const muc = document.createElement('li');
  const ten = document.createElement('p');
  ten.className = 'dau-hieu__ten';
  ten.textContent = span.text || span.label || 'Dấu hiệu trong ảnh đính kèm';
  const why = document.createElement('p');
  why.className = 'dau-hieu__why';
  why.textContent = span.why || '';
  muc.append(ten, why);
  khung.appendChild(muc);
}

function veBangDiem(ketQua) {
  o.thanBangDiem.innerHTML = '';
  o.chanBangDiem.innerHTML = '';
  const d = ketQua.diem || {};

  o.thanBangDiem.appendChild(hangDiem('Quyết định', d.quyetDinh || {}));
  o.thanBangDiem.appendChild(hangDiem('Lý do bạn nêu', d.lyDo || {}));
  o.thanBangDiem.appendChild(hangDiem('Đánh dấu dấu hiệu đỏ', d.danhDau || {}));
  if (d.caseKho?.sucKhoe) o.thanBangDiem.appendChild(hangDiem('Vượt tình huống khó', d.caseKho));
  if (d.thietHai?.sucKhoe || d.thietHai?.lyTri) {
    o.thanBangDiem.appendChild(hangDiem(
      ketQua.thietHai === 'mat_tien' ? 'Bị lừa mất tiền'
        : ketQua.thietHai === 'lo_thong_tin' ? 'Bị lừa lộ thông tin'
          : 'Từ chối nhầm tình huống an toàn',
      d.thietHai
    ));
  }
  if (trangThai.thuongKiemChung) {
    o.thanBangDiem.appendChild(hangDiem(
      'Dùng kiểm chứng, đã cộng ngay lúc bạn xác minh',
      { sucKhoe: trangThai.thuongKiemChung }
    ));
  }

  const tong = ketQua.tongThayDoi || { sucKhoe: 0, lyTri: 0 };
  o.chanBangDiem.appendChild(hangDiem('Tổng thay đổi khi chốt quyết định', tong));

  const ghiChu = [];

  // Quyết định sai thì điểm lý do chỉ còn một nửa, nói rõ con số
  const diemGoc = ketQua.lyDo?.diemGoc || 0;
  const diemThat = d.lyDo?.lyTri || 0;
  if (!ketQua.quyetDinhDung && diemGoc > 0) {
    ghiChu.push(`Lý do của bạn đáng ${diemGoc} điểm, nhưng quyết định sai nên chỉ còn ${diemThat}.`);
  }

  // Chỉ số bị kẹp trong khoảng 0-100 nên phần cộng có thể không vào hết
  const yeuCau = { sucKhoe: 0, lyTri: 0 };
  for (const phan of Object.values(d)) {
    yeuCau.sucKhoe += phan.sucKhoe || 0;
    yeuCau.lyTri += phan.lyTri || 0;
  }
  if (yeuCau.sucKhoe !== tong.sucKhoe || yeuCau.lyTri !== tong.lyTri) {
    ghiChu.push('Chỉ số của bạn đang ở mức tối đa nên phần cộng thêm không làm tăng con số.');
  }

  o.chuThichLyDo.textContent = ghiChu.join(' ');
  o.chuThichLyDo.hidden = ghiChu.length === 0;
}

function veBocTach(ketQua, { xemLai = false } = {}) {
  const bt = ketQua.bocTach || {};
  // Bản xem lại đã có sẵn văn bản đã ghép, bản mới thì ghép từ case đang chơi
  const tinGoc = ketQua.vanBanGoc || vanBanGocCuaCase(trangThai.caseHienTai, ketQua.openingMessage);

  if (!xemLai) {
    trangThai.daChotQuyetDinh = true;
    trangThai.chang[trangThai.thuTu - 1] = ketQua.quyetDinhDung ? 'dung' : 'sai';
    veTienTrinh();
    veChiSo(ketQua.stats);
    veDemLuot();
    veDemLuotTroLy();
    o.oLyDo.hidden = true;
    o.nhapLyDo.value = '';

    // Giữ lại để màn kết xem lại được
    trangThai.bocTachTheoChang.set(trangThai.thuTu, {
      ...ketQua,
      vanBanGoc: tinGoc,
      caseTitle: trangThai.caseHienTai?.title || ''
    });
  }

  // Banner
  o.bannerKetQua.className = `banner banner--${ketQua.quyetDinhDung ? 'dung' : 'sai'}`;
  o.bannerTieuDe.textContent = ketQua.quyetDinhDung ? 'Bạn xử lý đúng' : 'Lần này chưa đúng';
  const moTaThietHai = {
    mat_tien: 'Nếu đây là ngoài đời, làm theo yêu cầu này dẫn tới mất tiền.',
    lo_thong_tin: 'Nếu đây là ngoài đời, làm theo yêu cầu này làm lộ thông tin cá nhân.'
  };

  // Chọn Làm theo thì không có ô nhập lý do, nhận xét của bộ chấm điểm về việc
  // thiếu lý do sẽ đọc như đang trách người chơi
  const khongCanLyDo = ketQua.quyetDinhCuaBan === QUYET_DINH.LAM_THEO
    && !(ketQua.lyDoCuaBan || '').trim();

  o.bannerChu.textContent = khongCanLyDo
    ? 'Bạn không cần nêu lý do khi làm theo, nên mục này không tính điểm.'
    : (ketQua.lyDo?.feedback || moTaThietHai[ketQua.thietHai] || '');

  // Tin nhắn gốc với hai trạng thái đánh dấu. Không cảnh báo cụm không khớp:
  // cụm nằm trong ảnh được máy chủ gán text bằng nhãn, mà nhãn thì không có
  // trong lời nhắn nên lần nào cũng kêu oan. Chỗ soát trường text thật sự là
  // lúc dựng màn chơi.
  o.tinGoc.innerHTML = '';
  veTinCoCum(o.tinGoc, tinGoc, bt.spans, (span) => {
    const cum = document.createElement('span');
    cum.className = 'cum-goc';
    if (span.daDanhDau) cum.classList.add('cum-goc--trung');
    else if (span.boSot) cum.classList.add('cum-goc--bo-sot');
    return cum;
  }, { canhBao: false });

  const spans = bt.spans || [];
  const nhanRa = spans.filter((s) => s.kind === 'red_flag' && s.daDanhDau);
  const boSot = spans.filter((s) => s.kind === 'red_flag' && !s.daDanhDau);
  const moiDaBam = spans.filter((s) => s.kind === 'decoy' && s.daDanhDau);

  const chuThich = [];
  if (nhanRa.length || moiDaBam.length) chuThich.push('nền vàng là cụm bạn đã đánh dấu');
  if (boSot.length) chuThich.push('nền đỏ viền đứt là dấu hiệu đỏ bạn bỏ sót');
  o.chuThichMau.textContent = chuThich.length ? `Trong đó ${chuThich.join(', ')}.` : '';

  o.dsNhanRa.innerHTML = '';
  nhanRa.forEach((s) => themDauHieu(o.dsNhanRa, s));
  o.khoiNhanRa.hidden = nhanRa.length === 0;

  o.dsBoSot.innerHTML = '';
  boSot.forEach((s) => themDauHieu(o.dsBoSot, s));
  o.khoiBoSot.hidden = boSot.length === 0;

  o.dsCumMoi.innerHTML = '';
  moiDaBam.forEach((s) => themDauHieu(o.dsCumMoi, s));
  o.khoiCumMoi.hidden = moiDaBam.length === 0;

  o.chuCachXuLy.textContent = bt.correctAction || '';
  o.chuBaiHoc.textContent = bt.lesson || '';

  veBangDiem(ketQua);

  // Nét mặt mascot khớp với việc vừa xảy ra. Thua sớm và bị lừa mất tiền là
  // hai chuyện nặng nhất trong game nên đè lên mọi trạng thái khác.
  if (ketQua.isGameOver || ketQua.thietHai === 'mat_tien') {
    datMascot(o.mascotBaiHoc, 'baoDong');
  } else {
    datMascot(o.mascotBaiHoc, ketQua.quyetDinhDung ? 'khenNgoi' : 'thatVong');
  }

  // Lời mascot khớp với việc vừa xảy ra, không mắng người chơi
  if (ketQua.quyetDinhDung) {
    o.chuMascotBaiHoc.textContent = 'Tốt lắm. Giữ đúng cách làm này ở tình huống sau nhé.';
  } else if (boSot.length > 0) {
    o.chuMascotBaiHoc.textContent = 'Không sao, phần bỏ sót ở trên là chỗ cần để ý lần tới.';
  } else {
    o.chuMascotBaiHoc.textContent = 'Tình huống này thật ra hợp lệ. Cẩn thận là tốt, chỉ cần thêm một bước kiểm chứng là bạn yên tâm làm việc.';
  }

  // Vừa hết màn ôn tập mà lượt chính còn tình huống chưa chơi: máy chủ đã mở
  // thẳng phần còn lại, nói rõ để người chơi không tưởng là sắp xem kết quả
  if (!xemLai && ketQua.chuyenSangChoiTiep) {
    o.chuMascotBaiHoc.textContent = ketQua.hoiPhucSauOnTap > 0
      ? `Ôn xong rồi, tinh thần bạn hồi lại ${ketQua.hoiPhucSauOnTap} điểm. Giờ mình chơi tiếp phần còn dở của lượt này nhé.`
      : 'Ôn xong rồi. Giờ mình chơi tiếp phần còn dở của lượt này nhé.';
  }

  o.nutChoiTiep.textContent = xemLai
    ? 'Quay lại màn kết'
    : (ketQua.hetCase || ketQua.isGameOver ? 'Xem kết quả lượt chơi' : 'Chơi tiếp');
  trangThai.changDangXem = xemLai ? 'ket' : null;
  trangThai.hetCase = Boolean(ketQua.hetCase || ketQua.isGameOver);

  hienMan('manBocTach');
}

// ================= MÀN HÀNH TRÌNH =================

function veTheGiaiDoan(giaiDoan, { moHet, choBam }) {
  const the = document.createElement('section');
  the.className = 'the-giai-doan';
  if (giaiDoan.chang.some((ch) => ch.trangThai === 'dang_choi')) {
    the.classList.add('the-giai-doan--dang-choi');
  }

  const dau = document.createElement('p');
  dau.className = 'the-giai-doan__dau';
  dau.innerHTML = svgIcon(ICON_GIAI_DOAN[giaiDoan.icon] || ICON_GIAI_DOAN.briefcase, 'icon');
  dau.appendChild(document.createTextNode(giaiDoan.name));
  the.appendChild(dau);

  if (giaiDoan.chang.length === 0) {
    const trong = document.createElement('p');
    trong.className = 'the-giai-doan__trong';
    // Lượt đã kết thúc thì không còn gì để mở nữa, nói đúng việc đã xảy ra
    trong.textContent = moHet ? 'không có trong lượt này' : 'chưa mở';
    the.appendChild(trong);
    return the;
  }

  for (const ch of giaiDoan.chang) {
    const trangThaiChang = ch.trangThai;
    const hang = document.createElement(choBam ? 'button' : 'div');
    if (choBam) hang.type = 'button';
    hang.className = `chang-hang chang-hang--${trangThaiChang.replace('_', '-')}`;
    hang.innerHTML = svgIcon(ICON_CHANG[trangThaiChang], 'chang-hang__icon');

    const so = document.createElement('span');
    so.className = 'chang-hang__so';
    so.textContent = ch.thuTu;

    const ten = document.createElement('span');
    ten.className = 'chang-hang__ten';
    // Tên chặng chỉ hiện sau khi đã mở
    ten.textContent = ch.title || 'chưa mở';

    hang.append(so, ten);

    const coBocTach = trangThai.bocTachTheoChang.has(ch.thuTu);
    if (choBam && coBocTach) {
      hang.dataset.bam = '1';
      hang.addEventListener('click', () => {
        const luu = trangThai.bocTachTheoChang.get(ch.thuTu);
        veBocTach(luu, { xemLai: true });
      });
    } else if (choBam) {
      hang.disabled = true;
    }

    the.appendChild(hang);
  }

  return the;
}

async function veHanhTrinh(khung, { choBam = false } = {}) {
  const outline = await goiApi('/api/run/outline');
  khung.innerHTML = '';
  for (const giaiDoan of outline.stages) {
    khung.appendChild(veTheGiaiDoan(giaiDoan, { moHet: outline.moHet, choBam }));
  }
  return outline;
}

async function moManHanhTrinh() {
  try {
    anLoi();
    const outline = await veHanhTrinh(o.dsGiaiDoanHanhTrinh);
    const n = outline.changDangChoi;
    o.chuHanhTrinh.textContent = outline.mode === 'on_tap'
      ? 'Màn ôn tập, bạn chỉ chơi lại những tình huống đã sai'
      : 'Tên chặng chỉ hiện sau khi bạn đã chơi qua';
    o.nutTiepChang.textContent = n ? `Tiếp tục chặng ${n}` : 'Xem kết quả lượt chơi';
    hienMan('manHanhTrinh');
  } catch (loi) {
    hienLoi(loi);
  }
}

// ================= MÀN KẾT =================

const NHAN_KET_CUC = {
  thang: 'Bạn đã qua lượt chơi này',
  chua_dat: 'Chưa đạt, còn màn ôn tập',
  thua_som: 'Tinh thần đã xuống quá thấp'
};

async function veManKet() {
  try {
    anLoi();
    const tk = await goiApi('/api/run/summary');
    const loai = tk.ketCuc?.loai;

    const conDangDo = (tk.soCaseChuaChoi || 0) > 0;

    o.tieuDeKet.textContent = NHAN_KET_CUC[loai] || 'Hết tình huống trong lượt';
    if (loai === 'thua_som') {
      // Thua sớm là chỗ dễ tưởng đã hết game nhất. Nói thẳng rằng lượt còn dở
      // và ôn tập là đường đi tiếp, không phải màn chia tay.
      o.chuKet.textContent = conDangDo
        ? `Sức khoẻ tinh thần đã xuống tới ngưỡng dừng. Ôn lại những chỗ đã sai xong, bạn chơi tiếp ${tk.soCaseChuaChoi} tình huống còn lại của lượt này.`
        : 'Sức khoẻ tinh thần đã xuống tới ngưỡng dừng. Màn ôn tập sẽ giúp bạn xem lại những chỗ đã sai.';
    } else {
      o.chuKet.textContent = `Cần đúng ${Math.round((tk.nguongThang || 0.75) * 100)}% số tình huống để qua lượt.`;
    }

    o.ketSoDung.textContent = `${tk.soCaseDung}/${tk.tongSoCase}`;
    o.ketSucKhoe.textContent = tk.stats.sucKhoe;
    o.ketLyTri.textContent = tk.stats.lyTri;

    veChiSo(tk.stats);
    await veHanhTrinh(o.dsGiaiDoanKet, { choBam: true });

    o.nutOnTap.hidden = !tk.coTheOnTap;
    o.nutOnTap.textContent = conDangDo ? 'Ôn tập rồi chơi tiếp' : 'Vào màn ôn tập';
    hienMan('manKet');
  } catch (loi) {
    hienLoi(loi);
  }
}

async function vaoManOnTap() {
  if (trangThai.dangCho) return;
  trangThai.dangCho = true;
  o.nutOnTap.disabled = true;

  try {
    anLoi();
    await goiApi('/api/run/review', { body: { batDau: true } });
    trangThai.bocTachTheoChang = new Map();
    trangThai.luotId = null;
    trangThai.chang = [];
    await napCaseHienTai();
    await luuTienDo();
  } catch (loi) {
    hienLoi(loi);
  } finally {
    trangThai.dangCho = false;
    o.nutOnTap.disabled = false;
  }
}

// ================= SỰ KIỆN =================

// ---- Màn menu ----

o.nutChoiMoi.addEventListener('click', bamChoiMoi);
o.nutTiepTuc.addEventListener('click', tiepTucLuot);
o.nutHuyChoiMoi.addEventListener('click', dongXacNhanChoiMoi);
o.nutXacNhanChoiMoi.addEventListener('click', choiMoi);

o.chonCoChu.addEventListener('click', (su) => {
  const nut = su.target.closest('.chon');
  if (nut) datCaiDat({ coChu: nut.dataset.coChu });
});

// Chưa có âm thanh thật, nút này mới chỉ nhớ lựa chọn
o.chonAmThanh.addEventListener('click', (su) => {
  const nut = su.target.closest('.chon');
  if (nut) datCaiDat({ amThanh: nut.dataset.amThanh === '1' });
});

o.oNhap.addEventListener('submit', guiTinNhan);
o.oNhapTroLy.addEventListener('submit', guiCauHoiTroLy);

// Nghe ở cả cột giữa nên đánh dấu chạy giống nhau ở mọi kênh: bong bóng chat,
// địa chỉ người gửi, tiêu đề thư, thân thư, mã yêu cầu
o.cotGiua.addEventListener('click', (su) => {
  const cum = su.target.closest('.cum');
  if (cum) batTatCum(cum.dataset.spanId);
});

// Bàn phím: Enter hoặc dấu cách cũng đánh dấu được
o.cotGiua.addEventListener('keydown', (su) => {
  if (su.key !== 'Enter' && su.key !== ' ') return;
  const cum = su.target.closest('.cum');
  if (!cum) return;
  su.preventDefault();
  batTatCum(cum.dataset.spanId);
});

// Nút trong thư là hàng giả, bấm vào chỉ nhắc nhẹ chứ không dẫn đi đâu
o.thuNut.addEventListener('click', () => {
  o.thuNhac.hidden = false;
});

// Ô bằng chứng: màn rộng thì mở sẵn và khoá lại, màn hẹp thì thu gọn thành
// một nút mở ra như Design Spec mục 7 yêu cầu
const manRong = window.matchMedia('(min-width: 721px)');

function chinhOBangChung() {
  const rong = manRong.matches;
  o.theBangChung.open = rong;
  o.theBangChung.dataset.khoaMo = rong ? '1' : '0';
}

o.theBangChung.addEventListener('click', (su) => {
  // Màn rộng thì không cho đóng, ô này phải luôn nhìn thấy được
  if (manRong.matches && su.target.closest('summary')) su.preventDefault();
});

manRong.addEventListener('change', chinhOBangChung);
chinhOBangChung();

// Bước 1 sang bước 2
o.nutSanSang.addEventListener('click', moXacNhan);

// Bước 2: hai lối ra, quay lại hỏi thêm hoặc sang màn quyết định
o.nutQuayLaiHoi.addEventListener('click', dongXacNhan);
o.nutDuThongTin.addEventListener('click', moManQuyetDinh);

// Màn phủ cuộc gọi
o.nutNghe.addEventListener('click', ngheMay);
o.nutTuChoi.addEventListener('click', tuChoiMay);
o.nutNgheLai.addEventListener('click', () => {
  if (trangThai.duLieuCase) moLopCuocGoi(trangThai.duLieuCase);
});
// Cùng một lượt kiểm chứng với nút ở dưới màn chơi, chỉ khác cách gọi tên cho
// hợp bối cảnh cuộc gọi. Design Spec mục 9.
o.nutGoiLai.addEventListener('click', moKiemChung);

// Escape gắn ở tài liệu để đóng được overlay dù con trỏ đang ở đâu
document.addEventListener('keydown', (su) => {
  if (su.key !== 'Escape') return;
  if (!o.lopChoiMoi.hidden) dongXacNhanChoiMoi();
  else if (!o.lopXacNhan.hidden) dongXacNhan();
  else if (!o.lopKiemChung.hidden) dongKiemChung();
  // Thoát khỏi màn cuộc gọi nghĩa là không nhấc máy, đúng như cúp máy
  else if (!o.lopCuocGoi.hidden) tuChoiMay();
});

// Bước 3
o.nutLamTheo.addEventListener('click', () => {
  o.oLyDo.hidden = true;
  guiQuyetDinh(QUYET_DINH.LAM_THEO, '');
});

// Không làm thì hỏi lý do trước khi gửi
o.nutKhongLam.addEventListener('click', () => {
  o.oLyDo.hidden = false;
  o.nhapLyDo.focus();
});

o.nutHuyLyDo.addEventListener('click', () => {
  o.oLyDo.hidden = true;
  o.nhapLyDo.value = '';
});

o.nutGuiLyDo.addEventListener('click', () => {
  guiQuyetDinh(QUYET_DINH.KHONG_LAM, o.nhapLyDo.value.trim());
});

o.nutKiemChung.addEventListener('click', moKiemChung);
o.nutDongKiemChung.addEventListener('click', dongKiemChung);
o.nutQuayLaiChat.addEventListener('click', dongKiemChung);

o.nutChoiTiep.addEventListener('click', () => {
  if (trangThai.changDangXem === 'ket') {
    veManKet();
    return;
  }
  if (trangThai.hetCase) veManKet();
  else moManHanhTrinh();
});

o.nutTiepChang.addEventListener('click', napCaseHienTai);
o.nutOnTap.addEventListener('click', vaoManOnTap);
o.nutDongLoi.addEventListener('click', anLoi);

// Ô tên và nhóm nhân vật cùng mở khoá một nút, nên nghe chung một hàm
o.oTenNguoiChoi.addEventListener('input', capNhatNutBatDau);
o.nhomNhanVat.addEventListener('change', capNhatNutBatDau);

o.formNhapTen.addEventListener('submit', (su) => {
  su.preventDefault();
  luuNguoiChoi();
});

noiMascot('');
apDungCaiDat();
veHuyHieuNguoiChoi();

// Màn nhập tên diễn ra đúng một lần. Đã có tên và nhân vật trong máy thì vào
// thẳng menu như trước, không hỏi lại.
if (nguoiChoi) moManMenu();
else moManNhapTen();
