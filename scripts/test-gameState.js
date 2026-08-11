// test-gameState.js — chạy thử một lượt giả lập đi qua đủ mọi nhánh của gameState
//
// Chạy:  node scripts/test-gameState.js
//
// Kịch bản gồm năm lượt:
//   Lượt A — chơi hết case, chưa đạt 75%, vào màn ôn tập đúng những case đã sai rồi thắng
//   Lượt B — sức khoẻ tinh thần tụt xuống ngưỡng và thua sớm giữa chừng
//   Lượt C — hỗ trợ thích ứng khi lý trí xuống dưới 50
//   Lượt D — điểm lý do bị giảm nửa khi quyết định sai, và trường harm
//   Lượt F — thua sớm giữa chừng, ôn tập, rồi chơi nốt phần lượt còn dở
//   Lượt E — nhận thẳng kết quả casePicker.pickRun()

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import gameState, {
  GameState,
  QUYET_DINH,
  MUC_LY_DO,
  KET_CUC,
  CHE_DO
} from '../server/gameState.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ================= TIỆN ÍCH IN ẤN =================

let soLoi = 0;

function tieuDe(chu) {
  console.log('\n' + '='.repeat(72));
  console.log(chu);
  console.log('='.repeat(72));
}

function chiSo(gs, nhan) {
  console.log(`   [chỉ số] sức khoẻ ${String(gs.stats.sucKhoe).padStart(3)} | lý trí ${String(gs.stats.lyTri).padStart(3)}   ${nhan || ''}`);
}

function kiemTra(nhan, thucTe, mongDoi) {
  const dat = JSON.stringify(thucTe) === JSON.stringify(mongDoi);
  if (!dat) soLoi += 1;
  console.log(`   ${dat ? 'OK  ' : 'SAI '} ${nhan}: ${JSON.stringify(thucTe)}${dat ? '' : ` (mong đợi ${JSON.stringify(mongDoi)})`}`);
}

// Cộng dồn bảng điểm của một case. Giao diện so số này với tongThayDoi để biết
// có phải hiện dòng "chỉ số đang ở mức tối đa" hay không.
function tongYeuCau(diem) {
  const t = { sucKhoe: 0, lyTri: 0 };
  for (const phan of Object.values(diem)) {
    t.sucKhoe += phan.sucKhoe || 0;
    t.lyTri += phan.lyTri || 0;
  }
  return t;
}

// ================= DỮ LIỆU THỬ =================

// Hai tình huống thật lấy thẳng từ database.json để chạy đúng cấu trúc dữ liệu thật
const database = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'database.json'), 'utf-8')
);

function layTinhHuongThat(id) {
  for (const stage of database.stages || []) {
    for (const topic of stage.topics || []) {
      const found = (topic.variants || []).find((v) => v.id === id);
      if (found) return { ...found, stageId: stage.id, topicId: topic.id };
    }
  }
  throw new Error(`Không tìm thấy tình huống ${id} trong database.json`);
}

// Tình huống giả lập cho các nhánh mà database chưa có sẵn.
// boHarm: cố tình bỏ trường harm để thử nhánh suy ra kèm cảnh báo.
function taoTinhHuong({ id, type, difficulty, soDauHieuDo = 2, coTien = false, hoTro = true, harm = null, boHarm = false }) {
  const spans = [];
  for (let i = 1; i <= soDauHieuDo; i += 1) {
    spans.push({ id: `${id}_rf${i}`, kind: 'red_flag', text: `dấu hiệu ${i}`, why: 'giải thích ngắn' });
  }
  spans.push({ id: `${id}_dc1`, kind: 'decoy', text: 'cụm mồi', why: 'nhìn lạ nhưng bình thường' });

  const tinhHuong = {
    id,
    type,
    difficulty,
    channel: 'chat',
    title: `Tình huống thử ${id}`,
    context: { text: 'Bối cảnh giả lập.' },
    npc: {
      name: 'Người gửi thử',
      display_name: '+84 90 111 2233',
      status_line: 'Số chưa có trong danh bạ',
      account_no: '19038847251006',
      account_name: 'NGUYEN VAN A',
      amount: coTien ? '30.000.000đ' : null
    },
    opening_message: 'Tin nhắn mở đầu giả lập.',
    attachments: [],
    spans,
    max_chat_turns: difficulty === 'kho' ? 3 : 5,
    verification: [
      { id: `${id}_vf1`, label: 'Gọi tổng đài theo số tự tra', result: 'Kênh chính thức phủ nhận.', is_independent: true },
      { id: `${id}_vf2`, label: 'Kiểm tra tên miền', result: 'Tên miền mới đăng ký.', is_independent: true },
      { id: `${id}_vf3`, label: 'Nhắn lại hỏi chính người gửi', result: 'Người gửi khẳng định mình là thật.', is_independent: false }
    ],
    correct_action: 'Dừng lại và xác minh qua kênh độc lập.',
    lesson: 'Bài học giả lập.',
    support_hint: hoTro && soDauHieuDo > 0 ? `${id}_rf1` : null
  };

  // Tình huống lừa đảo phải khai báo harm, trừ khi đang cố thử nhánh thiếu trường
  if (type === 'scam' && !boHarm) {
    tinhHuong.harm = harm || (coTien ? 'mat_tien' : 'lo_thong_tin');
  }

  return tinhHuong;
}

function moiDauHieuDo(tinhHuong) {
  const trongTin = (tinhHuong.spans || []).filter((s) => s.kind === 'red_flag').map((s) => s.id);
  const trongAnh = (tinhHuong.attachments || [])
    .flatMap((a) => a.spans || [])
    .filter((s) => s.kind === 'red_flag')
    .map((s) => s.id);
  return [...trongTin, ...trongAnh];
}

// ================= HÀM CHƠI MỘT CASE =================

function choiMotCase(gs, { decision, reasonLevel, danhDau = 'khong', kiemChung = 0, soLuotChat = 0 }) {
  const view = gs.openNextCase();
  if (!view) {
    console.log('   (hết case trong lượt)');
    return null;
  }

  const c = view.caseData;
  console.log(`\n-- Case ${view.thuTu}/${view.tongSoCase} [${view.mode}] ${c.id} (${c.type} / ${c.difficulty})`);
  console.log(`   hỗ trợ: ${view.hoTro.bat ? 'BẬT' : 'tắt'} | tô sẵn: ${JSON.stringify(view.hoTro.spanToSan)} | lượt kiểm chứng: ${view.luotKiemChungConLai}`);

  // Nhắn tin — không có hình phạt nào cho cảm xúc của người chơi
  for (let i = 0; i < soLuotChat; i += 1) {
    const kq = gs.registerChatTurn();
    console.log(`   chat lượt ${i + 1}: ${kq.chapNhan ? `còn ${kq.luotConLai} lượt` : kq.lyDo}`);
  }

  // Kiểm chứng — lần đầu mỗi case được cộng sức khoẻ tinh thần
  for (let i = 0; i < kiemChung; i += 1) {
    const luaChon = (c.verification || [])[i];
    const kq = gs.useVerification(luaChon ? luaChon.id : 'khong_ton_tai');
    if (kq.chapNhan) {
      console.log(`   kiểm chứng lần ${i + 1}: "${kq.luaChon.label}" → thưởng sức khoẻ ${kq.thuong.sucKhoe}`);
    } else {
      console.log(`   kiểm chứng lần ${i + 1}: bị từ chối — ${kq.lyDo}`);
    }
    chiSo(gs);
  }

  // Đánh dấu cụm
  const dauHieuDo = moiDauHieuDo(c);
  const cumMoi = (c.spans || []).filter((s) => s.kind === 'decoy').map((s) => s.id);
  let danhSach = [];
  if (danhDau === 'du') danhSach = dauHieuDo;
  else if (danhDau === 'mot_phan') danhSach = dauHieuDo.slice(0, 1);
  else if (danhDau === 'moi') danhSach = cumMoi.slice(0, 1); // bấm nhầm cụm mồi, không bị phạt

  const kq = gs.submitDecision({
    decision,
    reason: 'Lý do giả lập của người chơi.',
    reasonLevel,
    markedSpanIds: danhSach
  });

  console.log(`   quyết định: ${decision} → ${kq.quyetDinhDung ? 'ĐÚNG' : 'SAI'}${kq.thietHai ? ` (${kq.thietHai})` : ''}`);
  console.log(`   đánh dấu: ${kq.mucDanhDau} (trúng ${kq.dauHieuDoTrung.length}/${kq.dauHieuDoTrung.length + kq.dauHieuDoBoSot.length}, cụm mồi ${kq.cumMoiDaBam.length})`);
  console.log(`   điểm: quyết định ${JSON.stringify(kq.diem.quyetDinh)} | lý do ${JSON.stringify(kq.diem.lyDo)} | đánh dấu ${JSON.stringify(kq.diem.danhDau)} | case khó ${JSON.stringify(kq.diem.caseKho)} | thiệt hại ${JSON.stringify(kq.diem.thietHai)}`);
  console.log(`   tổng thay đổi: ${JSON.stringify(kq.tongThayDoi)}`);
  chiSo(gs);

  return kq;
}

// ================= LƯỢT A =================

tieuDe('LƯỢT A — chơi hết case, chưa đạt, vào ôn tập rồi thắng');

// Lượt A pin sẵn danh sách tình huống của riêng nó để mọi con số kiểm tra bên
// dưới cố định. Việc khớp với casePicker.pickRun() thử riêng ở lượt E.
const luotA = [
  layTinhHuongThat('case_luong_lua'),  // scam thật trong database, harm = lo_thong_tin
  layTinhHuongThat('case_luong_that'), // safe thật trong database
  taoTinhHuong({ id: 'fx_chuyen_khoan', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 3, coTien: true }),
  taoTinhHuong({ id: 'fx_deepfake', type: 'scam', difficulty: 'kho', soDauHieuDo: 2, coTien: true }),
  taoTinhHuong({ id: 'fx_hoc_bong', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false }),
  taoTinhHuong({ id: 'fx_giao_hang', type: 'scam', difficulty: 'de', soDauHieuDo: 4 }),
  taoTinhHuong({ id: 'fx_benh_vien', type: 'scam', difficulty: 'kho', soDauHieuDo: 2 }),
  taoTinhHuong({ id: 'fx_thue', type: 'safe', difficulty: 'trung_binh', soDauHieuDo: 0, hoTro: false })
];

gameState.setProfile('Người chơi thử', 1998, 'nu');
const tienDoA = gameState.startRun(luotA);
console.log(`\nBắt đầu lượt: ${tienDoA.tongSoCase} tình huống, chế độ ${tienDoA.mode}.`);
chiSo(gameState, '(khởi điểm)');
kiemTra('chỉ số khởi điểm', gameState.stats, { sucKhoe: 80, lyTri: 70 });

// --- Case 1: thử các nhánh phụ rồi làm theo kẻ gian (sai, lộ thông tin) ---
{
  const view = gameState.openNextCase();
  console.log(`\n-- Case ${view.thuTu}/${view.tongSoCase} ${view.caseData.id} (${view.caseData.type} / ${view.caseData.difficulty})`);
  kiemTra('lý trí 70 chưa cần hỗ trợ', view.hoTro.bat, false);
  kiemTra('lý trí 70 cũng chưa tính là tự lực', view.hoTro.duNangLuc, false);
  kiemTra('lượt kiểm chứng cơ bản', view.luotKiemChungConLai, 1);

  // Hết lượt chat thì bị chặn, không bị trừ chỉ số
  for (let i = 0; i < view.caseData.max_chat_turns; i += 1) gameState.registerChatTurn();
  const qua = gameState.registerChatTurn();
  kiemTra('chat quá lượt bị chặn', qua.chapNhan, false);
  chiSo(gameState, '(chat quá lượt không mất gì)');

  // Khởi đầu 80 nên phần thưởng kiểm chứng vào thật, không bị trần nuốt mất
  const kc = gameState.useVerification(view.caseData.verification[0].id);
  kiemTra('kiểm chứng được chấp nhận', kc.chapNhan, true);
  kiemTra('thưởng kiểm chứng vào đủ ngay case đầu', kc.thuong, { sucKhoe: 5, lyTri: 0 });
  kiemTra('sức khoẻ tăng thật sau kiểm chứng', gameState.stats.sucKhoe, 85);

  // Hết lượt kiểm chứng
  const kc2 = gameState.useVerification(view.caseData.verification[1].id);
  kiemTra('hết lượt kiểm chứng', kc2.chapNhan, false);

  // Bật tắt cụm đánh dấu
  gameState.toggleSpan('sp_05');
  const conLai = gameState.toggleSpan('sp_05');
  kiemTra('bật rồi tắt cụm mồi', conLai, []);

  // Kiểm chứng không phải quyết định
  let nemLoi = false;
  try {
    gameState.submitDecision({ decision: QUYET_DINH.KIEM_CHUNG });
  } catch {
    nemLoi = true;
  }
  kiemTra('KIEM_CHUNG không nhận làm quyết định', nemLoi, true);

  const kq = gameState.submitDecision({
    decision: QUYET_DINH.LAM_THEO,
    reason: 'Thấy tin nhắn giống thật nên em làm luôn.',
    reasonLevel: MUC_LY_DO.KHONG_DAT,
    markedSpanIds: []
  });
  console.log(`   quyết định: LAM_THEO → SAI (${kq.thietHai})`);
  console.log(`   tổng thay đổi: ${JSON.stringify(kq.tongThayDoi)}`);
  chiSo(gameState);
  kiemTra('bị lừa lộ thông tin', [kq.thietHai, gameState.stats.sucKhoe, gameState.stats.lyTri], ['lo_thong_tin', 75, 60]);
  kiemTra('lịch sử ghi có dùng kiểm chứng', gameState.history[0].daKiemChung, true);
}

// --- Case 2: từ chối nhầm tình huống an toàn — chỉ trừ lý trí ---
{
  const truoc = gameState.stats.sucKhoe;
  const kq = choiMotCase(gameState, {
    decision: QUYET_DINH.KHONG_LAM,
    reasonLevel: MUC_LY_DO.TAM_DUOC,
    danhDau: 'moi'
  });
  kiemTra('từ chối nhầm không trừ sức khoẻ', gameState.stats.sucKhoe, truoc);
  // -5 vì từ chối nhầm, +2 vì lý do tạm được đã bị giảm nửa (5 -> 2) do quyết định sai
  kiemTra('điểm lý do bị giảm nửa khi sai', [kq.diemLyDoGoc, kq.diem.lyDo], [5, { lyTri: 2 }]);
  kiemTra('chỉ số sau case 2', gameState.stats.lyTri, 57);
  kiemTra('bấm nhầm cụm mồi không bị phạt', kq.diem.danhDau, { lyTri: 0 });
}

// --- Case 3: làm theo kẻ gian có số tiền — mất tiền ---
// Từ đây người chơi có kiểm chứng ở mỗi case sai. Khởi đầu 80 nên nếu chỉ ăn
// đòn mà không xác minh gì thì lượt A đã thua sớm trước khi đi hết case.
{
  const kq = choiMotCase(gameState, {
    decision: QUYET_DINH.LAM_THEO,
    reasonLevel: MUC_LY_DO.KHONG_DAT,
    kiemChung: 1,
    soLuotChat: 2
  });
  kiemTra('bị lừa mất tiền', [kq.thietHai, gameState.stats.sucKhoe, gameState.stats.lyTri], ['mat_tien', 60, 42]);
}

// --- Case 4: case khó nhưng vẫn làm theo — mất tiền, không có thưởng case khó ---
{
  const kq = choiMotCase(gameState, {
    decision: QUYET_DINH.LAM_THEO,
    reasonLevel: MUC_LY_DO.KHONG_DAT,
    kiemChung: 1
  });
  kiemTra('lý trí 42 đã bật hỗ trợ nên được thêm lượt kiểm chứng', kq.hoTroDaBat, true);
  kiemTra('sai thì không có thưởng case khó', kq.diem.caseKho, { sucKhoe: 0 });
  kiemTra('chỉ số sau case 4', [gameState.stats.sucKhoe, gameState.stats.lyTri], [45, 27]);
}

// --- Case 5: lại từ chối nhầm case an toàn ---
{
  choiMotCase(gameState, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.KHONG_DAT });
  kiemTra('chỉ số sau case 5', [gameState.stats.sucKhoe, gameState.stats.lyTri], [45, 22]);
}

// --- Case 6: làm theo, lộ thông tin, lý trí xuống sát đáy ---
{
  choiMotCase(gameState, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT, kiemChung: 1 });
  kiemTra('chỉ số sau case 6', [gameState.stats.sucKhoe, gameState.stats.lyTri], [40, 12]);
  kiemTra('lý trí 12 vẫn đang bật hỗ trợ', gameState.trangThaiHoTro().bat, true);
  kiemTra('sức khoẻ 40 chưa chạm ngưỡng thua sớm 30', gameState.isGameOver, false);
}

// --- Case 7: case khó, đang được hỗ trợ, làm đúng, có kiểm chứng và đánh dấu đủ ---
{
  const kq = choiMotCase(gameState, {
    decision: QUYET_DINH.KHONG_LAM,
    reasonLevel: MUC_LY_DO.THUYET_PHUC,
    danhDau: 'du',
    kiemChung: 2,
    soLuotChat: 1
  });
  kiemTra('case này chơi trong trạng thái được hỗ trợ', kq.hoTroDaBat, true);
  kiemTra('hỗ trợ cho đủ 2 lượt kiểm chứng', kq.kiemChungDaChon.length, 2);
  kiemTra('vượt case khó và đúng', kq.diem.caseKho, { sucKhoe: 5 });
  kiemTra('quyết định đúng cộng 10 lý trí', kq.diem.quyetDinh, { lyTri: 10 });
  kiemTra('lý do thuyết phục cộng 10', kq.diem.lyDo, { lyTri: 10 });
  kiemTra('đánh dấu đủ cộng 5', kq.diem.danhDau, { lyTri: 5 });
  // 40 + 5 (kiểm chứng lần đầu) + 5 (vượt case khó) = 50 sức khoẻ; 12 + 25 = 37 lý trí
  kiemTra('chỉ số sau case 7', [gameState.stats.sucKhoe, gameState.stats.lyTri], [50, 37]);
  kiemTra('làm đúng thì phần thưởng vào đủ, không bị trần nuốt', tongYeuCau(kq.diem), kq.tongThayDoi);
}

// --- Case 8: tình huống an toàn, làm theo là đúng ---
{
  const kq = choiMotCase(gameState, {
    decision: QUYET_DINH.LAM_THEO,
    reasonLevel: MUC_LY_DO.TAM_DUOC,
    danhDau: 'mot_phan'
  });
  kiemTra('case an toàn không có dấu hiệu đỏ để chấm', kq.mucDanhDau, 'khong_ap_dung');
  kiemTra('chỉ số sau case 8', [gameState.stats.sucKhoe, gameState.stats.lyTri], [50, 52]);
  kiemTra('hết case trong lượt', kq.hetCase, true);
  kiemTra('kết cục chưa đạt', kq.ketCuc.loai, KET_CUC.CHUA_DAT);
  kiemTra('chưa đạt thì chưa kết thúc game', gameState.isGameOver, false);
}

// ================= MÀN ÔN TẬP =================

tieuDe('MÀN ÔN TẬP — chỉ chơi lại đúng những case đã sai');

const caseSai = gameState.danhSachCaseSai().map((c) => c.id);
console.log(`Case đã sai: ${JSON.stringify(caseSai)}`);
kiemTra('số case sai', caseSai.length, 6);

const statsTruocOnTap = { ...gameState.stats };
const tienDoOnTap = gameState.startReviewRun();
kiemTra('chế độ ôn tập', tienDoOnTap.mode, CHE_DO.ON_TAP);
kiemTra('ôn tập đúng số case đã sai', tienDoOnTap.tongSoCase, 6);
kiemTra('ôn tập giữ nguyên chỉ số', gameState.stats, statsTruocOnTap);
kiemTra('mẫu số tính thắng vẫn là lượt chính', gameState.tongSoCaseLuotChinh, 8);

// Sửa được 5 case, vẫn sai 1 case an toàn
choiMotCase(gameState, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.THUYET_PHUC, danhDau: 'du', kiemChung: 1 });
choiMotCase(gameState, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.TAM_DUOC });
choiMotCase(gameState, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.KHONG_DAT, danhDau: 'mot_phan' });
choiMotCase(gameState, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.TAM_DUOC, danhDau: 'du' });
choiMotCase(gameState, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.KHONG_DAT }); // vẫn từ chối nhầm case an toàn
const cuoiOnTap = choiMotCase(gameState, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.THUYET_PHUC, danhDau: 'du' });

kiemTra('kết cục sau ôn tập', cuoiOnTap.ketCuc.loai, KET_CUC.THANG);
kiemTra('số case đúng trên tổng lượt chính', [gameState.soCaseDung(), gameState.tongSoCaseLuotChinh], [7, 8]);
kiemTra('chỉ số bị kẹp ở trần 100', gameState.stats.lyTri <= 100, true);

const tongKet = gameState.getSummary();
console.log('\nTổng kết lượt A:');
console.log(`   kết cục: ${tongKet.ketCuc.loai} | đúng ${tongKet.soCaseDung}/${tongKet.tongSoCase} (${Math.round(tongKet.tyLe * 100)}%)`);
console.log(`   chỉ số cuối: sức khoẻ ${tongKet.stats.sucKhoe}, lý trí ${tongKet.stats.lyTri}`);
console.log(`   số lần dùng kiểm chứng: ${tongKet.soLanKiemChung}`);
console.log(`   còn sai: ${JSON.stringify(tongKet.caseSai)}`);
console.log(`   số bản ghi lịch sử: ${tongKet.history.length} | số lần đổi chỉ số: ${tongKet.nhatKyChiSo.length}`);
kiemTra('lịch sử đủ 14 bản ghi (8 + 6 ôn tập)', tongKet.history.length, 14);

// ================= LƯỢT B — THUA SỚM =================

tieuDe('LƯỢT B — thua sớm khi sức khoẻ tinh thần chạm ngưỡng 30');

// Khởi đầu 80 (cộng 5 nhờ kiểm chứng ở case đầu) nên chỉ cần ba lần bị lừa
// mất tiền là chạm ngưỡng 30, thay vì bốn lần như hồi khởi đầu ở 100.
const gsB = new GameState();
const luotB = [
  taoTinhHuong({ id: 'b1_an_toan', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false }),
  taoTinhHuong({ id: 'b2_mat_tien', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2, coTien: true }),
  taoTinhHuong({ id: 'b3_mat_tien', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2, coTien: true }),
  taoTinhHuong({ id: 'b4_mat_tien', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2, coTien: true })
];
gsB.startRun(luotB);
chiSo(gsB, '(khởi điểm)');

// Case đầu làm đúng: phần thưởng phải nhìn thấy được ngay, đây chính là chỗ
// mà khởi đầu 100 làm hỏng — mọi thứ bị kẹp trần và chỉ số đứng im.
{
  const kq = choiMotCase(gsB, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.THUYET_PHUC, kiemChung: 1 });
  kiemTra('phần thưởng case đầu làm chỉ số tăng thật', gsB.stats, { sucKhoe: 85, lyTri: 90 });
  kiemTra('không còn phải báo "chỉ số đang ở mức tối đa"', tongYeuCau(kq.diem), kq.tongThayDoi);
}

choiMotCase(gsB, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });
kiemTra('sau lần bị lừa thứ nhất', [gsB.stats.sucKhoe, gsB.stats.lyTri], [65, 75]);

choiMotCase(gsB, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });
kiemTra('sau lần bị lừa thứ hai, vẫn chưa thua', [gsB.stats.sucKhoe, gsB.stats.lyTri], [45, 60]);
kiemTra('lý trí 60 chưa bật hỗ trợ', gsB.trangThaiHoTro().bat, false);
kiemTra('chưa thua sau hai lần mất tiền', gsB.isGameOver, false);

const cuoiB = choiMotCase(gsB, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });
kiemTra('lần mất tiền thứ ba là thua sớm', cuoiB.ketCuc.loai, KET_CUC.THUA_SOM);
kiemTra('game kết thúc', gsB.isGameOver, true);
kiemTra('chỉ số lúc thua', [gsB.stats.sucKhoe, gsB.stats.lyTri], [25, 45]);

// Sau khi thua, chỉ số đóng băng và không mở được case mới
const dongBang = gsB.applyDelta({ sucKhoe: -50, lyTri: 50 }, 'thử đổi sau khi thua');
kiemTra('applyDelta bị bỏ qua sau khi thua', dongBang.boQua, true);
kiemTra('chỉ số không đổi sau khi thua', [gsB.stats.sucKhoe, gsB.stats.lyTri], [25, 45]);
kiemTra('không mở được case mới', gsB.openNextCase(), null);

// ---- Thua sớm vẫn phải vào được ôn tập (Design Spec mục 10, màn 9) ----
//
// Đây là nhánh dễ hỏng nhất của cả máy trạng thái: sức khoẻ lúc này là 25, tức
// vẫn dưới ngưỡng thua 30. Nếu ôn tập còn kiểm tra ngưỡng đó thì người chơi
// thua lại ngay ở case đầu tiên và không bao giờ học lại được gì.

const statsLucThua = { ...gsB.stats };
const caseSaiB = gsB.danhSachCaseSai().map((c) => c.id);
kiemTra('ba case bị lừa đều vào danh sách ôn tập', caseSaiB, ['b2_mat_tien', 'b3_mat_tien', 'b4_mat_tien']);

const tienDoOnTapB = gsB.startReviewRun();
kiemTra('thua sớm VÀO ĐƯỢC ôn tập', tienDoOnTapB.mode, CHE_DO.ON_TAP);
kiemTra('ôn tập đúng số case đã sai', tienDoOnTapB.tongSoCase, 3);
kiemTra('ôn tập giữ nguyên chỉ số lúc thua', gsB.stats, statsLucThua);
kiemTra('vào ôn tập thì gỡ cờ kết thúc', gsB.isGameOver, false);
kiemTra('mẫu số tính thắng vẫn là lượt chính', gsB.tongSoCaseLuotChinh, 4);

// Sức khoẻ vẫn 25, dưới ngưỡng 30. Chơi đúng một case rồi soi lại: nếu luật
// thua sớm còn hiệu lực trong ôn tập thì đúng ở đây là chỗ nó bật lên.
//
// Có dùng kiểm chứng để sức khoẻ nhích lên 30 — chạm đúng ngưỡng, tức là rơi
// vào phép so sánh <= của luật thua. Ngưỡng là chỗ dễ sai nhất nên phải chạm.
choiMotCase(gsB, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.THUYET_PHUC, danhDau: 'du', kiemChung: 1 });
kiemTra('sức khoẻ mới chạm đúng ngưỡng thua', gsB.stats.sucKhoe, 30);
kiemTra('nhưng KHÔNG thua lại giữa màn ôn tập', gsB.isGameOver, false);
kiemTra('và cũng không sinh ra kết cục mới', gsB.ketCuc, null);

// Chơi nốt hai case còn lại: sửa hết thì phải qua được lượt
choiMotCase(gsB, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.THUYET_PHUC, danhDau: 'du' });
const cuoiOnTapB = choiMotCase(gsB, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.THUYET_PHUC, danhDau: 'du' });
kiemTra('sửa hết case sai thì qua được lượt', cuoiOnTapB.ketCuc.loai, KET_CUC.THANG);
kiemTra('bốn case đều tính là đúng', [gsB.soCaseDung(), gsB.tongSoCaseLuotChinh], [4, 4]);

// Sức khoẻ chỉ hồi qua kiểm chứng và vượt case khó, không hồi nhờ trả lời đúng.
// Ba case ôn tập đều là trung_binh nên toàn bộ mức tăng đến từ lượt kiểm chứng ở trên.
kiemTra('sức khoẻ hồi đúng phần thưởng kiểm chứng', gsB.stats.sucKhoe, statsLucThua.sucKhoe + 5);

// Hết case sai thì không còn gì để ôn, đây mới là lý do chính đáng để chặn
let loiOnTapLai = '';
try {
  gsB.startReviewRun();
} catch (e) {
  loiOnTapLai = e.message;
}
kiemTra('không còn case sai thì chặn vào ôn tập', /Không có tình huống nào sai/.test(loiOnTapLai), true);

// ================= LƯỢT C — HỖ TRỢ THÍCH ỨNG =================

tieuDe('LƯỢT C — hỗ trợ thích ứng khi lý trí dưới 50');

const gsC = new GameState();
gsC.startRun([
  taoTinhHuong({ id: 'c1_yeu', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2, coTien: false }),
  taoTinhHuong({ id: 'c2_yeu', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 3, coTien: false })
]);

// Kéo lý trí xuống 45 bằng applyDelta để vào thẳng nhánh hỗ trợ.
// Khởi đầu 70 nên chỉ cần -25 là tới, tức là trong lúc chơi thật chỉ cần hai
// nước sai (một lần mất tiền -15 và một lần từ chối nhầm -5) là đã gần chạm.
gsC.applyDelta({ lyTri: -25 }, 'giả lập người chơi đang đuối');
chiSo(gsC, '(đã kéo lý trí xuống 45)');
kiemTra('lý trí 45 bật hỗ trợ', gsC.trangThaiHoTro().bat, true);
kiemTra('lý trí 45 chưa đủ tự lực', gsC.trangThaiHoTro().duNangLuc, false);

const viewC = gsC.openNextCase();
console.log(`   tô sẵn: ${JSON.stringify(viewC.hoTro.spanToSan)} | lượt kiểm chứng: ${viewC.luotKiemChungConLai}`);
kiemTra('tô sẵn theo support_hint', viewC.hoTro.spanToSan, ['c1_yeu_rf1']);
kiemTra('được cộng thêm 1 lượt kiểm chứng', viewC.luotKiemChungConLai, 2);
kiemTra('cụm tô sẵn đã nằm trong danh sách đánh dấu', viewC.spanDaDanhDau, ['c1_yeu_rf1']);
kiemTra('lý trí thấp không làm tăng độ khó', viewC.caseData.difficulty, 'trung_binh');

// Đánh dấu nốt dấu hiệu còn lại rồi chốt đúng
gsC.toggleSpan('c1_yeu_rf2');
const kqC = gsC.submitDecision({
  decision: QUYET_DINH.KHONG_LAM,
  reason: 'Tên miền lạ và ép thời gian.',
  reasonLevel: MUC_LY_DO.THUYET_PHUC
});
console.log(`   tổng thay đổi: ${JSON.stringify(kqC.tongThayDoi)}`);
chiSo(gsC);
kiemTra('đánh dấu đủ nhờ hỗ trợ', kqC.mucDanhDau, 'du');
kiemTra('lý trí sau khi làm đúng', gsC.stats.lyTri, 70);

const viewC2 = gsC.openNextCase();
kiemTra('lý trí 70 thì tắt hỗ trợ', viewC2.hoTro.bat, false);
kiemTra('lý trí 70 chưa tính là tự lực', viewC2.hoTro.duNangLuc, false);
gsC.applyDelta({ lyTri: 15 }, 'lên 85');
kiemTra('lý trí 85 là tự lực hoàn toàn', gsC.trangThaiHoTro().duNangLuc, true);

// ================= LƯỢT D — ĐIỂM LÝ DO KHI SAI VÀ TRƯỜNG HARM =================

tieuDe('LƯỢT D — điểm lý do khi quyết định sai, và trường harm');

const gsD = new GameState();
gsD.startRun([
  taoTinhHuong({ id: 'd1_an_toan', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false }),
  taoTinhHuong({ id: 'd2_an_toan', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false }),
  // Cố tình bỏ harm để thử nhánh suy ra kèm cảnh báo
  taoTinhHuong({ id: 'd3_thieu_harm', type: 'scam', difficulty: 'trung_binh', coTien: false, boHarm: true }),
  // Có số tiền trong tin nhắn nhưng thủ đoạn là lấy tài khoản — đúng chỗ suy đoán cũ hay sai
  taoTinhHuong({ id: 'd4_co_tien', type: 'scam', difficulty: 'trung_binh', coTien: true, harm: 'lo_thong_tin' }),
  taoTinhHuong({ id: 'd5_an_toan', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false })
]);

// Từ chối nhầm case an toàn kèm lý do thuyết phục: -5 và +10 giảm nửa thành +5 → hoà vốn
{
  const kq = choiMotCase(gsD, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.THUYET_PHUC });
  kiemTra('lý do thuyết phục nhưng sai chỉ còn +5', [kq.diemLyDoGoc, kq.diem.lyDo], [10, { lyTri: 5 }]);
  kiemTra('từ chối nhầm kèm lý do tốt hoà vốn, không được thưởng', kq.tongThayDoi, { sucKhoe: 0, lyTri: 0 });
  kiemTra('chỉ số giữ nguyên', gsD.stats, { sucKhoe: 80, lyTri: 70 });
}

// Lý do tạm được khi sai: 5 * 0.5 = 2.5, làm tròn xuống còn 2
{
  const kq = choiMotCase(gsD, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.TAM_DUOC });
  kiemTra('lý do tạm được khi sai làm tròn xuống còn +2', kq.diem.lyDo, { lyTri: 2 });
  kiemTra('vẫn lỗ 3 lý trí', [kq.tongThayDoi, gsD.stats.lyTri], [{ sucKhoe: 0, lyTri: -3 }, 67]);
}

// Thiếu harm: suy ra lo_thong_tin và in cảnh báo cho bên nội dung
{
  const kq = choiMotCase(gsD, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.THUYET_PHUC });
  kiemTra('thiếu harm thì suy ra lo_thong_tin', kq.thietHai, 'lo_thong_tin');
  kiemTra('bị lừa mà lý do hay cũng chỉ được +5', kq.diem.lyDo, { lyTri: 5 });
  kiemTra('chỉ số sau case thiếu harm', [gsD.stats.sucKhoe, gsD.stats.lyTri], [70, 62]);
}

// Có harm khai báo thì dùng harm, không nhìn npc.amount nữa
{
  const kq = choiMotCase(gsD, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });
  kiemTra('harm khai báo thắng suy đoán từ npc.amount', kq.thietHai, 'lo_thong_tin');
  kiemTra('chỉ số sau case có harm', [gsD.stats.sucKhoe, gsD.stats.lyTri], [60, 52]);
}

// Quyết định đúng thì điểm lý do vẫn nguyên giá
{
  const kq = choiMotCase(gsD, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.THUYET_PHUC });
  kiemTra('đúng thì lý do vẫn được đủ 10', [kq.quyetDinhDung, kq.diem.lyDo], [true, { lyTri: 10 }]);
  kiemTra('cả 20 điểm thưởng vào thật, không bị trần cắt', [tongYeuCau(kq.diem), gsD.stats.lyTri], [kq.tongThayDoi, 72]);
}

// ================= LƯỢT F — THUA SỚM GIỮA CHỪNG RỒI CHƠI NỐT LƯỢT =================

tieuDe('LƯỢT F — thua sớm ở case 3/7, ôn tập 2 case sai, chơi tiếp case 4 đến 7');

// Nhánh này từng là ngõ cụt: thua sớm giữa chừng thì bốn case cuối không ai
// chơi nữa, ôn tập xong là chốt kết cục luôn trên mẫu số 7. Đúng nhiều nhất
// được 3/7 = 43%, không đời nào với tới 75%, nên người chơi vĩnh viễn không
// qua nổi lượt. Ôn tập là trạm hồi phục giữa đường, không phải cửa ra.

const gsF = new GameState();
const luotF = [
  taoTinhHuong({ id: 'f1_an_toan', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false }),
  taoTinhHuong({ id: 'f2_mat_tien', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2, coTien: true }),
  taoTinhHuong({ id: 'f3_mat_tien', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2, coTien: true }),
  taoTinhHuong({ id: 'f4_lo_tin', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2 }),
  taoTinhHuong({ id: 'f5_an_toan', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false }),
  taoTinhHuong({ id: 'f6_mat_tien', type: 'scam', difficulty: 'trung_binh', soDauHieuDo: 2, coTien: true }),
  taoTinhHuong({ id: 'f7_an_toan', type: 'safe', difficulty: 'de', soDauHieuDo: 0, hoTro: false })
];
gsF.startRun(luotF);

// Kéo sức khoẻ xuống 60 để hai cú mất tiền là chạm ngưỡng ngay ở case 3,
// đúng cảnh người chơi đang mệt sẵn thì dính liên tiếp hai vố.
gsF.applyDelta({ sucKhoe: -20 }, 'giả lập người chơi đã mệt sẵn');
chiSo(gsF, '(đã kéo sức khoẻ xuống 60)');

choiMotCase(gsF, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });        // case 1 đúng
choiMotCase(gsF, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });        // case 2 sai
const cuoiF3 = choiMotCase(gsF, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT }); // case 3 sai

kiemTra('thua sớm đúng ở case 3', cuoiF3.ketCuc.loai, KET_CUC.THUA_SOM);
kiemTra('chỉ số lúc thua', [gsF.stats.sucKhoe, gsF.stats.lyTri], [20, 50]);
kiemTra('mới đúng 1 trên mẫu số 7', [gsF.soCaseDung(), gsF.tongSoCaseLuotChinh], [1, 7]);
kiemTra('còn 4 case chưa ai chơi', gsF.danhSachCaseChuaChoi().map((c) => c.id), ['f4_lo_tin', 'f5_an_toan', 'f6_mat_tien', 'f7_an_toan']);
kiemTra('tổng kết cũng báo còn 4 case chưa chơi', gsF.getSummary().soCaseChuaChoi, 4);

// ---- Ôn tập đúng hai case đã sai ----
const tienDoOnTapF = gsF.startReviewRun();
kiemTra('vào được ôn tập', tienDoOnTapF.mode, CHE_DO.ON_TAP);
kiemTra('ôn tập đúng 2 case sai', tienDoOnTapF.tongSoCase, 2);

choiMotCase(gsF, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.KHONG_DAT, danhDau: 'mot_phan', kiemChung: 1 });
kiemTra('sức khoẻ 25 vẫn dưới ngưỡng mà không thua lại', [gsF.stats.sucKhoe, gsF.isGameOver], [25, false]);

const cuoiOnTapF = choiMotCase(gsF, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.KHONG_DAT, danhDau: 'mot_phan' });

// ---- Đây là chỗ nhánh này từng chết ----
kiemTra('hết ôn tập KHÔNG phải hết lượt', cuoiOnTapF.hetCase, false);
kiemTra('máy chủ tự mở phần lượt còn dở', cuoiOnTapF.chuyenSangChoiTiep, true);
kiemTra('chưa chốt kết cục vội', [cuoiOnTapF.ketCuc, gsF.isGameOver], [null, false]);
kiemTra('quay về chế độ chính', gsF.run.mode, CHE_DO.CHINH);
kiemTra('chơi tiếp đúng 4 case chưa chơi', cuoiOnTapF.tienDo.tongSoCase, 4);
kiemTra('mẫu số tính thắng vẫn là cả lượt', gsF.tongSoCaseLuotChinh, 7);

// Ra khỏi ôn tập với 25 sức khoẻ thì nước đổi chỉ số kế tiếp — kể cả một phần
// thưởng — vẫn nằm dưới ngưỡng 30 và người chơi thua lại tức khắc. Rời trạm
// hồi phục phải là hồi phục thật.
kiemTra('hồi sức khi rời màn ôn tập', [cuoiOnTapF.hoiPhucSauOnTap, gsF.stats.sucKhoe], [35, 60]);
kiemTra('lý trí không bị đụng tới', gsF.stats.lyTri, 74);

// ---- Chơi nốt case 4 đến 7 ----
choiMotCase(gsF, { decision: QUYET_DINH.KHONG_LAM, reasonLevel: MUC_LY_DO.KHONG_DAT, danhDau: 'mot_phan', kiemChung: 1 }); // case 4 đúng
choiMotCase(gsF, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });                                     // case 5 đúng

const cuoiF6 = choiMotCase(gsF, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });                      // case 6 sai
kiemTra('luật thua sớm có hiệu lực trở lại ở lượt chính', [gsF.stats.sucKhoe, cuoiF6.isGameOver], [45, false]);

const cuoiF = choiMotCase(gsF, { decision: QUYET_DINH.LAM_THEO, reasonLevel: MUC_LY_DO.KHONG_DAT });                       // case 7 đúng

kiemTra('chơi hết 7 case mới chốt kết cục', cuoiF.hetCase, true);
kiemTra('kết cục tính trên đủ 7 case', [cuoiF.ketCuc.soCaseDung, cuoiF.ketCuc.tongSoCase], [6, 7]);
kiemTra('6/7 vượt ngưỡng 75% nên qua lượt', cuoiF.ketCuc.loai, KET_CUC.THANG);
kiemTra('chỉ còn đúng case vừa sai chưa gỡ', gsF.danhSachCaseSai().map((c) => c.id), ['f6_mat_tien']);
kiemTra('không còn case nào chưa chơi', gsF.danhSachCaseChuaChoi().length, 0);
kiemTra('lịch sử đủ 9 bản ghi (3 + 2 ôn tập + 4 chơi tiếp)', gsF.history.length, 9);

// ================= LƯỢT E — KHỚP VỚI casePicker.pickRun() =================

tieuDe('LƯỢT E — nhận thẳng kết quả casePicker.pickRun()');

const { pickRun } = await import('../server/casePicker.js');
const ketQuaPick = pickRun(database, { seed: 'demo-unesco-2026' });
console.log(`pickRun trả về ${ketQuaPick.cases.length} tình huống, ${ketQuaPick.warnings.length} cảnh báo.`);

const gsE = new GameState();
const tienDoE = gsE.startRun(ketQuaPick);
kiemTra('số case lấy từ pickRun, không hard-code', tienDoE.tongSoCase, ketQuaPick.cases.length);
kiemTra('giữ lại phần meta của pickRun', gsE.run.meta.seed, 'demo-unesco-2026');

const viewE = gsE.openNextCase();
console.log(`   case đầu: ${viewE.caseData.id} (${viewE.caseData.type}) — giai đoạn ${viewE.caseData.stageName}`);
kiemTra('case mang theo thông tin giai đoạn từ pickRun', typeof viewE.caseData.stageId, 'string');
const kqE = gsE.submitDecision({
  decision: viewE.caseData.type === 'scam' ? QUYET_DINH.KHONG_LAM : QUYET_DINH.LAM_THEO,
  reason: 'Xác minh qua kênh độc lập trước đã.',
  reasonLevel: MUC_LY_DO.THUYET_PHUC,
  markedSpanIds: moiDauHieuDo(viewE.caseData)
});
kiemTra('chơi đúng case lấy từ pickRun', kqE.quyetDinhDung, true);
kiemTra('lịch sử ghi lại giai đoạn của case', kqE.stageId, viewE.caseData.stageId);
chiSo(gsE);

// ================= KẾT =================

tieuDe(soLoi === 0 ? 'TẤT CẢ KIỂM TRA ĐỀU ĐẠT' : `CÓ ${soLoi} KIỂM TRA KHÔNG ĐẠT`);
if (soLoi > 0) process.exitCode = 1;
