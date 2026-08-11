// gameState.js — trạng thái một lượt chơi
//
// Hai chỉ số: sucKhoe (sức khoẻ tinh thần) và lyTri. Bắt đầu ở 80/70 và luôn
// nằm trong khoảng 0-100. Không còn chỉ số lòng tin — AI tự đọc ngữ cảnh
// hội thoại để đổi giọng.
//
// Mọi thay đổi chỉ số đều đi qua applyDelta(). Đó là nơi duy nhất kẹp giá trị
// và kiểm tra điều kiện thua sớm, nên không được sửa chỉ số trực tiếp ở chỗ khác.

// ================= HẰNG SỐ =================

// Ba nút hành động. KIEM_CHUNG không phải quyết định, nó là hành động phụ
// diễn ra trong lúc chơi và không kết thúc case.
export const QUYET_DINH = {
  LAM_THEO: 'LAM_THEO',
  KHONG_LAM: 'KHONG_LAM',
  KIEM_CHUNG: 'KIEM_CHUNG'
};

// Ba mức AI chấm lý do người chơi đưa ra
export const MUC_LY_DO = {
  KHONG_DAT: 'khong_dat',
  TAM_DUOC: 'tam_duoc',
  THUYET_PHUC: 'thuyet_phuc'
};

// Loại thiệt hại khi người chơi làm theo kẻ gian
export const THIET_HAI = {
  MAT_TIEN: 'mat_tien',
  LO_THONG_TIN: 'lo_thong_tin'
};

// Kết cục một lượt chơi
export const KET_CUC = {
  THUA_SOM: 'thua_som',
  THANG: 'thang',
  CHUA_DAT: 'chua_dat'
};

export const CHE_DO = {
  CHINH: 'chinh',
  ON_TAP: 'on_tap'
};

// Bảng điểm. Số dương là cộng, số âm là trừ.
export const BANG_DIEM = {
  quyetDinhDung: { lyTri: 10 },
  lyDo: {
    [MUC_LY_DO.KHONG_DAT]: { lyTri: 0 },
    [MUC_LY_DO.TAM_DUOC]: { lyTri: 5 },
    [MUC_LY_DO.THUYET_PHUC]: { lyTri: 10 }
  },
  // Quyết định sai thì điểm lý do chỉ còn một nửa, làm tròn xuống.
  // Lý do hay vẫn được ghi nhận, nhưng không đủ để biến một nước sai thành có lời.
  heSoLyDoKhiSai: 0.5,
  danhDauDu: { lyTri: 5 },
  danhDauMotPhan: { lyTri: 2 },
  kiemChungLanDau: { sucKhoe: 5 },
  vuotCaseKho: { sucKhoe: 5 },
  biLuaMatTien: { sucKhoe: -20, lyTri: -15 },
  biLuaLoThongTin: { sucKhoe: -10, lyTri: -10 },
  tuChoiNhamCaseAnToan: { lyTri: -5 }
};

const CHI_SO_TOI_DA = 100;
const CHI_SO_TOI_THIEU = 0;

// Chỉ số khởi đầu. Cố tình đặt dưới trần: khởi đầu ở 100 thì mọi phần thưởng
// đều bị kẹp trần nên người chơi không thấy chỉ số nhúc nhích, cơ chế thưởng
// coi như vô hình cho tới lần mắc lỗi đầu tiên. Lý trí 70 cũng đặt hỗ trợ
// thích ứng (< 50) và mốc tự lực (>= 80) vào tầm với thật sự.
export const CHI_SO_KHOI_DAU = { sucKhoe: 80, lyTri: 70 };

// Thua sớm ngay khi sức khoẻ tinh thần chạm ngưỡng này
const NGUONG_THUA_SOM = 30;

// Dưới ngưỡng này thì bật hỗ trợ thích ứng, từ ngưỡng cao trở lên thì thôi.
// Lý trí thấp KHÔNG bao giờ làm tăng độ khó.
const NGUONG_BAT_HO_TRO = 50;
const NGUONG_TAT_HO_TRO = 80;

// Số lượt kiểm chứng cơ bản mỗi case, và phần cộng thêm khi đang được hỗ trợ
const LUOT_KIEM_CHUNG_MAC_DINH = 1;
const LUOT_KIEM_CHUNG_HO_TRO_THEM = 1;

// Số lượt chat mặc định nếu tình huống không khai báo max_chat_turns.
// Khai báo 0 là cố ý — kênh email không có ai để nhắn lại — nên phải phân biệt
// với việc bỏ trống, dùng ?? chứ không dùng ||.
const LUOT_CHAT_MAC_DINH = 5;

// Lượt hỏi trợ lý an toàn, đếm tách hẳn với lượt nhắn NPC vì hai thứ đo hai
// việc khác nhau. Trợ lý luôn có ở mọi kênh, kể cả khi không có NPC nào để nhắn.
const LUOT_TRO_LY_MAC_DINH = 3;

// Tỷ lệ quyết định đúng tối thiểu để thắng
const TY_LE_THANG = 0.75;

// ================= HÀM PHỤ =================

function kep(giaTri) {
  return Math.max(CHI_SO_TOI_THIEU, Math.min(CHI_SO_TOI_DA, giaTri));
}

// Gom mọi dấu hiệu đỏ của tình huống, gồm cả dấu hiệu nằm trên ảnh đính kèm
function layDauHieuDo(tinhHuong) {
  const trongTin = (tinhHuong.spans || []).filter((s) => s.kind === 'red_flag');
  const trongAnh = (tinhHuong.attachments || [])
    .flatMap((a) => a.spans || [])
    .filter((s) => s.kind === 'red_flag');
  return [...trongTin, ...trongAnh];
}

// Danh sách id của mọi cụm mồi — dùng để báo cáo, không dùng để trừ điểm
function layCumMoi(tinhHuong) {
  const trongTin = (tinhHuong.spans || []).filter((s) => s.kind === 'decoy');
  const trongAnh = (tinhHuong.attachments || [])
    .flatMap((a) => a.spans || [])
    .filter((s) => s.kind === 'decoy');
  return [...trongTin, ...trongAnh];
}

// Nhớ những tình huống đã cảnh báo thiếu harm, để không kêu lại mỗi lần chơi
const daCanhBaoThieuHarm = new Set();

// Làm theo kẻ gian thì mất gì. Đọc trường harm trong dữ liệu tình huống.
// Thiếu harm thì tạm suy ra từ số tiền và cảnh báo để bên nội dung bổ sung.
function xacDinhThietHai(tinhHuong) {
  const khaiBao = tinhHuong.harm;
  if (khaiBao === THIET_HAI.MAT_TIEN || khaiBao === THIET_HAI.LO_THONG_TIN) {
    return khaiBao;
  }

  const suyRa = tinhHuong.npc && tinhHuong.npc.amount ? THIET_HAI.MAT_TIEN : THIET_HAI.LO_THONG_TIN;

  if (!daCanhBaoThieuHarm.has(tinhHuong.id)) {
    daCanhBaoThieuHarm.add(tinhHuong.id);
    const viSao = khaiBao === undefined ? 'thiếu trường "harm"' : `trường "harm" không hợp lệ: ${JSON.stringify(khaiBao)}`;
    console.warn(
      `[gameState] Tình huống "${tinhHuong.id}" ${viSao}. ` +
      `Tạm suy ra "${suyRa}" từ npc.amount. ` +
      `Đề nghị bên nội dung bổ sung "harm": "mat_tien" hoặc "lo_thong_tin" vào tình huống loại scam.`
    );
  }

  return suyRa;
}

// Chuẩn hoá mức chấm lý do: nhận chuỗi ('khong_dat'|'tam_duoc'|'thuyet_phuc')
// hoặc số 0 / 1 / 2 do AI trả về.
function chuanHoaMucLyDo(muc) {
  if (muc === 0 || muc === '0') return MUC_LY_DO.KHONG_DAT;
  if (muc === 1 || muc === '1') return MUC_LY_DO.TAM_DUOC;
  if (muc === 2 || muc === '2') return MUC_LY_DO.THUYET_PHUC;
  if (Object.values(MUC_LY_DO).includes(muc)) return muc;
  return MUC_LY_DO.KHONG_DAT;
}

// pickRun() có thể trả về mảng tình huống hoặc một object bọc quanh mảng đó.
// Nhận cả hai dạng để gameState không phụ thuộc vào chi tiết của casePicker.
function docKetQuaPickRun(ketQua) {
  if (Array.isArray(ketQua)) return { cases: ketQua, meta: {} };
  if (ketQua && Array.isArray(ketQua.cases)) {
    const { cases, ...meta } = ketQua;
    return { cases, meta };
  }
  if (ketQua && Array.isArray(ketQua.run)) {
    const { run, ...meta } = ketQua;
    return { cases: run, meta };
  }
  throw new Error('startRun() cần kết quả của casePicker.pickRun(): một mảng tình huống hoặc object chứa mảng cases.');
}

// ================= LỚP TRẠNG THÁI =================

class GameState {
  constructor() {
    // Đếm ngoài reset() để mỗi lượt mở ra có một mã không bao giờ trùng lượt
    // trước. vong không làm được việc này: reset() đưa nó về 0, nên lượt chính
    // nào cũng là vong 1 và giao diện không phân biệt được hai lượt với nhau.
    this.soLuotDaMo = 0;
    this.reset();
  }

  reset() {
    this.userProfile = { name: '', birthYear: null, gender: '' };

    this.stats = { ...CHI_SO_KHOI_DAU };

    // Lượt chơi hiện tại. cases lấy nguyên từ casePicker.pickRun(),
    // số lượng case do pickRun quyết định chứ không cố định ở đây.
    this.run = {
      mode: CHE_DO.CHINH,
      cases: [],
      index: 0,
      meta: {},
      vong: 0
    };

    // Tổng số case của lượt chính — mẫu số khi tính tỷ lệ thắng.
    // Màn ôn tập không làm thay đổi mẫu số này.
    this.tongSoCaseLuotChinh = 0;

    // Kết quả mới nhất của từng case: caseId -> true/false
    this.ketQuaTheoCase = {};

    // Trạng thái case đang chơi
    this.caseHienTai = null;

    // Lịch sử đầy đủ, đủ để dựng màn ôn tập và màn tổng kết
    this.history = [];

    // Nhật ký mọi lần chỉ số thay đổi, phục vụ gỡ lỗi và màn tổng kết
    this.nhatKyChiSo = [];

    this.ketCuc = null;
    this.isGameOver = false;
  }

  setProfile(name, birthYear, gender) {
    this.userProfile = { name, birthYear, gender };
    return this.userProfile;
  }

  // ---------- Chỉ số ----------

  // Cửa duy nhất để đổi chỉ số. Kẹp 0-100, ghi nhật ký, kiểm tra thua sớm.
  // delta: { sucKhoe?, lyTri? } — giá trị âm là trừ, dương là cộng.
  applyDelta(delta = {}, ghiChu = '') {
    const truoc = { ...this.stats };

    // Đã kết thúc lượt thì chỉ số đóng băng
    if (this.isGameOver) {
      return { truoc, sau: { ...this.stats }, apDung: { sucKhoe: 0, lyTri: 0 }, ghiChu, boQua: true };
    }

    const sau = {
      sucKhoe: kep(truoc.sucKhoe + (delta.sucKhoe || 0)),
      lyTri: kep(truoc.lyTri + (delta.lyTri || 0))
    };
    this.stats = sau;

    // Phần thực sự có hiệu lực sau khi kẹp, có thể nhỏ hơn delta yêu cầu
    const apDung = {
      sucKhoe: sau.sucKhoe - truoc.sucKhoe,
      lyTri: sau.lyTri - truoc.lyTri
    };

    const ban = {
      caseId: this.caseHienTai ? this.caseHienTai.data.id : null,
      ghiChu,
      yeuCau: { sucKhoe: delta.sucKhoe || 0, lyTri: delta.lyTri || 0 },
      apDung,
      truoc,
      sau
    };
    this.nhatKyChiSo.push(ban);

    // Điều kiện thua sớm, kiểm tra ngay tại đây
    if (sau.sucKhoe <= NGUONG_THUA_SOM) {
      this.ketThucLuot(KET_CUC.THUA_SOM);
    }

    return { ...ban, boQua: false };
  }

  // ---------- Hỗ trợ thích ứng ----------

  // Lý trí thấp thì được giúp thêm, không bao giờ bị làm khó thêm.
  trangThaiHoTro(tinhHuong = null) {
    const nguon = tinhHuong || (this.caseHienTai && this.caseHienTai.data);
    const bat = this.stats.lyTri < NGUONG_BAT_HO_TRO;

    let spanToSan = [];
    if (bat && nguon && nguon.support_hint) {
      spanToSan = Array.isArray(nguon.support_hint) ? [...nguon.support_hint] : [nguon.support_hint];
    }

    return {
      bat,
      // Trên ngưỡng này chắc chắn không hỗ trợ, ghi rõ để giao diện khỏi đoán
      duNangLuc: this.stats.lyTri >= NGUONG_TAT_HO_TRO,
      spanToSan,
      luotKiemChung: LUOT_KIEM_CHUNG_MAC_DINH + (bat ? LUOT_KIEM_CHUNG_HO_TRO_THEM : 0)
    };
  }

  // ---------- Vòng đời một lượt chơi ----------

  // ketQuaPickRun: kết quả của casePicker.pickRun()
  startRun(ketQuaPickRun, { mode = CHE_DO.CHINH, giuChiSo = false } = {}) {
    const { cases, meta } = docKetQuaPickRun(ketQuaPickRun);
    if (cases.length === 0) {
      throw new Error('pickRun() trả về danh sách rỗng, không có tình huống nào để chơi.');
    }

    if (!giuChiSo) {
      this.stats = { ...CHI_SO_KHOI_DAU };
      this.history = [];
      this.nhatKyChiSo = [];
      this.ketQuaTheoCase = {};
    }

    this.run = {
      mode,
      cases: [...cases],
      index: 0,
      meta,
      vong: (this.run.vong || 0) + 1,
      id: ++this.soLuotDaMo
    };

    if (mode === CHE_DO.CHINH) {
      this.tongSoCaseLuotChinh = cases.length;
    }

    this.caseHienTai = null;
    this.ketCuc = null;
    this.isGameOver = false;

    return this.tienDoLuot();
  }

  tienDoLuot() {
    return {
      mode: this.run.mode,
      luotId: this.run.id ?? null,
      vong: this.run.vong,
      index: this.run.index,
      tongSoCase: this.run.cases.length,
      tongSoCaseLuotChinh: this.tongSoCaseLuotChinh,
      conLai: Math.max(0, this.run.cases.length - this.run.index)
    };
  }

  // Bắt đầu case kế tiếp. Trả về null khi đã hết case trong lượt.
  openNextCase() {
    if (this.isGameOver) return null;
    if (this.run.index >= this.run.cases.length) return null;

    const data = this.run.cases[this.run.index];
    const hoTro = this.trangThaiHoTro(data);

    this.caseHienTai = {
      data,
      batDauLuc: Date.now(),
      luotChatDaDung: 0,
      luotChatToiDa: data.max_chat_turns ?? LUOT_CHAT_MAC_DINH,
      luotTroLyDaDung: 0,
      luotTroLyToiDa: data.assistant_turns ?? LUOT_TRO_LY_MAC_DINH,
      luotKiemChungConLai: hoTro.luotKiemChung,
      daKiemChung: false,
      kiemChungDaChon: [],
      spanDaDanhDau: [...hoTro.spanToSan],
      hoTro
    };

    return this.caseView();
  }

  // Dữ liệu case kèm trạng thái, đủ để giao diện dựng màn chơi
  caseView() {
    if (!this.caseHienTai) return null;
    const c = this.caseHienTai;
    return {
      caseData: c.data,
      thuTu: this.run.index + 1,
      tongSoCase: this.run.cases.length,
      // Mã lượt chơi. Giao diện cần nó để biết thanh chặng đang thuộc lượt nào
      // mà dựng lại: số chặng bằng nhau không có nghĩa là cùng một lượt.
      luotId: this.run.id ?? null,
      vong: this.run.vong,
      mode: this.run.mode,
      stats: { ...this.stats },
      hoTro: c.hoTro,
      spanDaDanhDau: [...c.spanDaDanhDau],
      luotChatConLai: Math.max(0, c.luotChatToiDa - c.luotChatDaDung),
      luotTroLyConLai: Math.max(0, c.luotTroLyToiDa - c.luotTroLyDaDung),
      luotKiemChungConLai: c.luotKiemChungConLai,
      daKiemChung: c.daKiemChung
    };
  }

  // ---------- Hành động trong case ----------

  // Ghi một lượt chat. Không có bất kỳ hình phạt nào cho cảm xúc của người chơi.
  registerChatTurn() {
    if (!this.caseHienTai) throw new Error('Chưa mở case nào.');
    const c = this.caseHienTai;

    if (c.luotChatDaDung >= c.luotChatToiDa) {
      return { chapNhan: false, luotConLai: 0, lyDo: 'Đã hết lượt nhắn tin cho tình huống này.' };
    }

    c.luotChatDaDung += 1;
    return { chapNhan: true, luotConLai: c.luotChatToiDa - c.luotChatDaDung };
  }

  // Ghi một lượt hỏi trợ lý an toàn. Hỏi trợ lý KHÔNG cộng điểm — chỉ kiểm
  // chứng mới được thưởng. Thông điệp là biết thôi chưa đủ, phải đi xác minh.
  registerAssistantTurn() {
    if (!this.caseHienTai) throw new Error('Chưa mở case nào.');
    const c = this.caseHienTai;

    if (c.luotTroLyDaDung >= c.luotTroLyToiDa) {
      return { chapNhan: false, luotConLai: 0, lyDo: 'Đã hết lượt hỏi trợ lý cho tình huống này.' };
    }

    c.luotTroLyDaDung += 1;
    return { chapNhan: true, luotConLai: c.luotTroLyToiDa - c.luotTroLyDaDung };
  }

  // Đánh dấu hoặc bỏ đánh dấu một cụm. Bấm nhầm cụm mồi không bị phạt.
  toggleSpan(spanId) {
    if (!this.caseHienTai) throw new Error('Chưa mở case nào.');
    const danhSach = this.caseHienTai.spanDaDanhDau;
    const vitri = danhSach.indexOf(spanId);
    if (vitri >= 0) danhSach.splice(vitri, 1);
    else danhSach.push(spanId);
    return [...danhSach];
  }

  setMarkedSpans(danhSach = []) {
    if (!this.caseHienTai) throw new Error('Chưa mở case nào.');
    this.caseHienTai.spanDaDanhDau = [...new Set(danhSach)];
    return [...this.caseHienTai.spanDaDanhDau];
  }

  // Dùng kiểm chứng. Lần đầu trong mỗi case được cộng sức khoẻ tinh thần —
  // kiểm chứng là hành vi đúng nên không bao giờ bị trừ.
  useVerification(optionId) {
    if (!this.caseHienTai) throw new Error('Chưa mở case nào.');
    const c = this.caseHienTai;

    if (c.luotKiemChungConLai <= 0) {
      return { chapNhan: false, lyDo: 'Đã hết lượt kiểm chứng cho tình huống này.', stats: { ...this.stats } };
    }

    const luaChon = (c.data.verification || []).find((v) => v.id === optionId);
    if (!luaChon) {
      return { chapNhan: false, lyDo: 'Không tìm thấy lựa chọn kiểm chứng.', stats: { ...this.stats } };
    }

    c.luotKiemChungConLai -= 1;
    c.kiemChungDaChon.push(luaChon.id);

    let thuong = { sucKhoe: 0, lyTri: 0 };
    if (!c.daKiemChung) {
      c.daKiemChung = true;
      const ket = this.applyDelta(BANG_DIEM.kiemChungLanDau, 'Dùng kiểm chứng lần đầu trong tình huống');
      thuong = ket.apDung;
    }

    return {
      chapNhan: true,
      luaChon,
      thuong,
      luotKiemChungConLai: c.luotKiemChungConLai,
      stats: { ...this.stats },
      isGameOver: this.isGameOver
    };
  }

  // ---------- Chốt quyết định ----------

  // decision: QUYET_DINH.LAM_THEO hoặc QUYET_DINH.KHONG_LAM
  // reasonLevel: mức AI chấm lý do (MUC_LY_DO hoặc 0/1/2)
  submitDecision({ decision, reason = '', reasonLevel = MUC_LY_DO.KHONG_DAT, markedSpanIds = null } = {}) {
    if (!this.caseHienTai) throw new Error('Chưa mở case nào.');
    if (this.isGameOver) throw new Error('Lượt chơi đã kết thúc.');
    if (decision === QUYET_DINH.KIEM_CHUNG) {
      throw new Error('Kiểm chứng không phải quyết định, dùng useVerification().');
    }
    if (decision !== QUYET_DINH.LAM_THEO && decision !== QUYET_DINH.KHONG_LAM) {
      throw new Error(`Quyết định không hợp lệ: ${decision}`);
    }

    const c = this.caseHienTai;
    const tinhHuong = c.data;

    if (markedSpanIds) this.setMarkedSpans(markedSpanIds);
    const daDanhDau = [...c.spanDaDanhDau];

    // 1. Đúng hay sai
    // case scam: KHONG_LAM đúng — case safe: LAM_THEO đúng
    const laScam = tinhHuong.type === 'scam';
    const quyetDinhDung = laScam
      ? decision === QUYET_DINH.KHONG_LAM
      : decision === QUYET_DINH.LAM_THEO;

    // 2. Đánh dấu dấu hiệu đỏ
    const dauHieuDo = layDauHieuDo(tinhHuong);
    const idDauHieuDo = dauHieuDo.map((s) => s.id);
    const idCumMoi = layCumMoi(tinhHuong).map((s) => s.id);
    const trungDauHieuDo = idDauHieuDo.filter((id) => daDanhDau.includes(id));
    const boSot = idDauHieuDo.filter((id) => !daDanhDau.includes(id));
    const cumMoiDaBam = idCumMoi.filter((id) => daDanhDau.includes(id));

    // 3. Tính từng hạng mục điểm
    const mucLyDo = chuanHoaMucLyDo(reasonLevel);
    const diemLyDoGoc = BANG_DIEM.lyDo[mucLyDo].lyTri;
    const diemLyDo = quyetDinhDung
      ? diemLyDoGoc
      : Math.floor(diemLyDoGoc * BANG_DIEM.heSoLyDoKhiSai);

    const hangMuc = {
      quyetDinh: quyetDinhDung ? { ...BANG_DIEM.quyetDinhDung } : { lyTri: 0 },
      lyDo: { lyTri: diemLyDo },
      danhDau: { lyTri: 0 },
      caseKho: { sucKhoe: 0 },
      thietHai: { sucKhoe: 0, lyTri: 0 }
    };

    let mucDanhDau = 'khong_co';
    if (idDauHieuDo.length > 0) {
      if (trungDauHieuDo.length === idDauHieuDo.length) {
        mucDanhDau = 'du';
        hangMuc.danhDau = { ...BANG_DIEM.danhDauDu };
      } else if (trungDauHieuDo.length > 0) {
        mucDanhDau = 'mot_phan';
        hangMuc.danhDau = { ...BANG_DIEM.danhDauMotPhan };
      }
    } else {
      // Tình huống an toàn chỉ có cụm mồi, không có gì để chấm ở hạng mục này
      mucDanhDau = 'khong_ap_dung';
    }

    // Vượt tình huống khó và trả lời đúng thì hồi sức khoẻ tinh thần
    if (quyetDinhDung && tinhHuong.difficulty === 'kho') {
      hangMuc.caseKho = { ...BANG_DIEM.vuotCaseKho };
    }

    // 4. Hình phạt khi sai
    let thietHai = null;
    if (!quyetDinhDung) {
      if (laScam) {
        // Làm theo kẻ gian
        thietHai = xacDinhThietHai(tinhHuong);
        hangMuc.thietHai = thietHai === THIET_HAI.MAT_TIEN
          ? { ...BANG_DIEM.biLuaMatTien }
          : { ...BANG_DIEM.biLuaLoThongTin };
      } else {
        // Từ chối nhầm tình huống an toàn: chỉ trừ lý trí, không đụng sức khoẻ
        hangMuc.thietHai = { ...BANG_DIEM.tuChoiNhamCaseAnToan };
      }
    }

    // 5. Gộp lại rồi đổi chỉ số đúng một lần cho cả case
    const tong = { sucKhoe: 0, lyTri: 0 };
    for (const phan of Object.values(hangMuc)) {
      tong.sucKhoe += phan.sucKhoe || 0;
      tong.lyTri += phan.lyTri || 0;
    }
    const statsTruoc = { ...this.stats };
    const ketApDung = this.applyDelta(tong, `Chốt quyết định: ${tinhHuong.id}`);

    // 6. Ghi lịch sử
    const ban = {
      caseId: tinhHuong.id,
      caseTitle: tinhHuong.title,
      type: tinhHuong.type,
      difficulty: tinhHuong.difficulty,
      channel: tinhHuong.channel,
      stageId: tinhHuong.stageId || tinhHuong.stage_id || null,
      topicId: tinhHuong.topicId || tinhHuong.topic_id || null,
      mode: this.run.mode,
      vong: this.run.vong,

      decision,
      reason,
      reasonLevel: mucLyDo,
      // Điểm lý do trước khi bị giảm nửa, để màn bóc tách giải thích được cho người chơi
      diemLyDoGoc,
      quyetDinhDung,
      thietHai,

      spanDaDanhDau: daDanhDau,
      dauHieuDoTrung: trungDauHieuDo,
      dauHieuDoBoSot: boSot,
      cumMoiDaBam: cumMoiDaBam,
      mucDanhDau,

      daKiemChung: c.daKiemChung,
      kiemChungDaChon: [...c.kiemChungDaChon],
      soLuotChatDaDung: c.luotChatDaDung,
      hoTroDaBat: c.hoTro.bat,

      diem: hangMuc,
      tongThayDoi: ketApDung.apDung,
      statsTruoc,
      statsSau: { ...this.stats },

      // Giữ lại phần bài học để màn bóc tách và màn tổng kết dùng luôn
      correctAction: tinhHuong.correct_action || null,
      lesson: tinhHuong.lesson || null
    };
    this.history.push(ban);
    this.ketQuaTheoCase[tinhHuong.id] = quyetDinhDung;

    // 7. Sang case sau
    this.run.index += 1;
    this.caseHienTai = null;

    const hetCase = this.run.index >= this.run.cases.length;
    if (!this.isGameOver && hetCase) {
      this.danhGiaKetCuc();
    }

    return {
      ...ban,
      stats: { ...this.stats },
      isGameOver: this.isGameOver,
      ketCuc: this.ketCuc,
      hetCase,
      tienDo: this.tienDoLuot()
    };
  }

  // ---------- Kết cục ----------

  // Đếm số case đã trả lời đúng, tính trên lần làm gần nhất của mỗi case
  soCaseDung() {
    return Object.values(this.ketQuaTheoCase).filter(Boolean).length;
  }

  tyLeDung() {
    const mau = this.tongSoCaseLuotChinh || this.run.cases.length;
    if (!mau) return 0;
    return this.soCaseDung() / mau;
  }

  // Gọi khi hết case trong lượt. Đạt ngưỡng thì thắng, chưa đạt thì vào ôn tập.
  danhGiaKetCuc() {
    const dat = this.tyLeDung() >= TY_LE_THANG;
    this.ketThucLuot(dat ? KET_CUC.THANG : KET_CUC.CHUA_DAT);
    return this.ketCuc;
  }

  ketThucLuot(loai) {
    if (this.ketCuc) return this.ketCuc;

    this.ketCuc = {
      loai,
      // Thua sớm thì dừng hẳn, chưa đạt thì còn màn ôn tập nên chưa phải hết game
      isGameOver: loai !== KET_CUC.CHUA_DAT,
      soCaseDung: this.soCaseDung(),
      tongSoCase: this.tongSoCaseLuotChinh || this.run.cases.length,
      tyLe: this.tyLeDung(),
      stats: { ...this.stats },
      caseSai: this.danhSachCaseSai().map((c) => c.id)
    };
    this.isGameOver = this.ketCuc.isGameOver;
    return this.ketCuc;
  }

  // ---------- Màn ôn tập ----------

  // Đúng những tình huống đã làm sai, giữ nguyên thứ tự gặp ban đầu
  danhSachCaseSai() {
    const daCo = new Set();
    const ketQua = [];
    for (const ban of this.history) {
      if (this.ketQuaTheoCase[ban.caseId] === false && !daCo.has(ban.caseId)) {
        daCo.add(ban.caseId);
        const tinhHuong = this.timTinhHuong(ban.caseId);
        if (tinhHuong) ketQua.push(tinhHuong);
      }
    }
    return ketQua;
  }

  timTinhHuong(caseId) {
    return this.run.cases.find((c) => c.id === caseId)
      || this.run.casesGoc?.find?.((c) => c.id === caseId)
      || null;
  }

  // Vào màn ôn tập: chơi lại đúng những case đã sai, không chơi lại từ đầu.
  // Chỉ số và lịch sử được giữ nguyên.
  startReviewRun() {
    if (this.ketCuc && this.ketCuc.loai === KET_CUC.THUA_SOM) {
      throw new Error('Đã thua sớm, không vào màn ôn tập từ trạng thái này.');
    }

    const caseSai = this.danhSachCaseSai();
    if (caseSai.length === 0) {
      throw new Error('Không có tình huống nào sai để ôn tập.');
    }

    // Giữ lại danh sách gốc để còn tra cứu tình huống ở các vòng sau
    const goc = this.run.casesGoc || this.run.cases;
    const tienDo = this.startRun(caseSai, { mode: CHE_DO.ON_TAP, giuChiSo: true });
    this.run.casesGoc = goc;
    return tienDo;
  }

  // ---------- Tổng kết ----------

  getSummary() {
    const tong = this.tongSoCaseLuotChinh || this.run.cases.length;
    const dung = this.soCaseDung();

    return {
      userProfile: { ...this.userProfile },
      stats: { ...this.stats },
      ketCuc: this.ketCuc,
      soCaseDung: dung,
      tongSoCase: tong,
      tyLe: this.tyLeDung(),
      nguongThang: TY_LE_THANG,
      caseSai: this.danhSachCaseSai().map((c) => ({ id: c.id, title: c.title })),
      // Số lần dùng kiểm chứng, dùng để khen ở màn tổng kết
      soLanKiemChung: this.history.filter((h) => h.daKiemChung).length,
      history: this.history.map((h) => ({ ...h })),
      nhatKyChiSo: this.nhatKyChiSo.map((n) => ({ ...n }))
    };
  }

  // Ảnh chụp gọn để trả về cho giao diện sau mỗi thao tác
  snapshot() {
    return {
      stats: { ...this.stats },
      tienDo: this.tienDoLuot(),
      hoTro: this.trangThaiHoTro(),
      ketCuc: this.ketCuc,
      isGameOver: this.isGameOver,
      caseHienTai: this.caseHienTai ? this.caseHienTai.data.id : null
    };
  }
}

export default new GameState();
export { GameState };
