// server.js — API cho game nhận diện lừa đảo
//
// Luồng một lượt chơi:
//   POST /api/run/start          bắt đầu lượt, casePicker rút danh sách tình huống
//   GET  /api/run/current-case   lấy tình huống đang chơi (tự mở tình huống kế tiếp)
//   POST /api/case/chat          nhắn tin với nhân vật
//   POST /api/case/assistant     hỏi trợ lý an toàn ở cột phải
//   POST /api/case/spans         gửi các cụm đã đánh dấu
//   POST /api/case/verify        dùng một lượt kiểm chứng
//   POST /api/case/decision      chốt quyết định kèm lý do, trả về dữ liệu màn bóc tách
//   GET  /api/run/outline        bản đồ hành trình, trạng thái từng chặng
//   GET  /api/run/summary        trạng thái kết thúc và dữ liệu màn ôn tập
//   POST /api/run/review         vào màn ôn tập, chơi lại đúng những tình huống đã sai

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import gameState, { QUYET_DINH, KET_CUC } from './gameState.js';
import { pickRun, pickDemoRun } from './casePicker.js';
import { taoLoiThoaiNPC, chamDiemLyDo, hoiTroLyAnToan, coKhoaAI } from './groqService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const database = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'database.json'), 'utf-8')
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ================= TRẠNG THÁI PHỤ =================

// gameState không giữ nội dung hội thoại, chỉ đếm lượt. Lịch sử chat sống ở đây
// và bị xoá mỗi khi sang tình huống mới.
//
// Hai cuộc hội thoại tách hẳn nhau: NPC ở cột giữa, trợ lý an toàn ở cột phải.
// Không được gộp chung một mảng — trợ lý mà đọc được lời thoại của mình nhét
// vào ngữ cảnh NPC thì cả hai vai đều hỏng.
let phienChat = { caseId: null, messages: [] };
let phienTroLy = { caseId: null, messages: [] };

function dongBoPhienChat(caseId) {
  if (phienChat.caseId !== caseId) {
    phienChat = { caseId, messages: [] };
  }
  return phienChat;
}

function dongBoPhienTroLy(caseId) {
  if (phienTroLy.caseId !== caseId) {
    phienTroLy = { caseId, messages: [] };
  }
  return phienTroLy;
}

function xoaMoiPhien() {
  phienChat = { caseId: null, messages: [] };
  phienTroLy = { caseId: null, messages: [] };
}

// Bọc route async để lỗi rơi vào middleware xử lý lỗi thay vì treo request
function async_(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function chuaBatDau(res) {
  return res.status(409).json({ error: 'Chưa bắt đầu lượt chơi nào. Gọi POST /api/run/start trước.' });
}

// Ba route thao tác trong case dùng chung bộ kiểm tra này. Thứ tự quan trọng:
// hết lượt chơi cũng làm caseHienTai rỗng, báo nhầm thành "chưa bắt đầu" thì khó lần ra.
function caseDangMo(res) {
  if (gameState.run.cases.length === 0) {
    chuaBatDau(res);
    return false;
  }
  if (gameState.isGameOver) {
    res.status(409).json({ error: 'Lượt chơi đã kết thúc.', ketCuc: gameState.ketCuc });
    return false;
  }
  if (!gameState.caseHienTai) {
    res.status(409).json({
      error: 'Chưa mở tình huống nào. Gọi GET /api/run/current-case trước.',
      ketCuc: gameState.ketCuc
    });
    return false;
  }
  return true;
}

// Dữ liệu màn bóc tách bài học sau khi chốt quyết định
function duLieuBocTach(caseData, banGhi) {
  const moiSpan = [
    ...(caseData.spans || []),
    ...(caseData.attachments || []).flatMap((a) => a.spans || [])
  ];

  return {
    lesson: caseData.lesson,
    correctAction: caseData.correct_action,
    spans: moiSpan.map((s) => ({
      id: s.id,
      kind: s.kind,
      text: s.text || s.label || null,
      why: s.why,
      daDanhDau: banGhi.spanDaDanhDau.includes(s.id),
      // Dấu hiệu đỏ bị bỏ sót sẽ được tô kiểu khác ở màn bài học
      boSot: s.kind === 'red_flag' && !banGhi.spanDaDanhDau.includes(s.id)
    })),
    verification: (caseData.verification || []).map((v) => ({
      ...v,
      daDung: banGhi.kiemChungDaChon.includes(v.id)
    }))
  };
}

// ================= ROUTE =================

// 1. Bắt đầu lượt chơi mới
app.post('/api/run/start', (req, res) => {
  const { name = '', birthYear = null, gender = '', seed = null, demo = false } = req.body || {};

  const ketQuaPick = demo ? pickDemoRun(database) : pickRun(database, { seed });
  if (ketQuaPick.cases.length === 0) {
    return res.status(500).json({
      error: 'Chưa có tình huống nào trong database.json để chơi.',
      warnings: ketQuaPick.warnings
    });
  }

  gameState.reset();
  gameState.setProfile(name, birthYear, gender);
  const tienDo = gameState.startRun(ketQuaPick);
  xoaMoiPhien();

  res.json({
    tienDo,
    stats: gameState.stats,
    userProfile: gameState.userProfile,
    // Cảnh báo của casePicker về nội dung còn thiếu, hiện cho bên nội dung khi chạy nội bộ
    warnings: ketQuaPick.warnings,
    coKhoaAI: coKhoaAI()
  });
});

// 2. Lấy tình huống hiện tại, tự mở tình huống kế tiếp nếu chưa mở
app.get('/api/run/current-case', (req, res) => {
  if (gameState.run.cases.length === 0) return chuaBatDau(res);

  if (gameState.isGameOver) {
    return res.json({ ketThuc: true, ketCuc: gameState.ketCuc, stats: gameState.stats });
  }

  const view = gameState.caseView() || gameState.openNextCase();
  if (!view) {
    // Hết tình huống trong lượt: kết cục đã được tính lúc chốt quyết định cuối
    return res.json({ ketThuc: true, ketCuc: gameState.ketCuc, stats: gameState.stats });
  }

  const phien = dongBoPhienChat(view.caseData.id);
  const phienTL = dongBoPhienTroLy(view.caseData.id);

  res.json({
    ketThuc: false,
    ...view,
    // Tin nhắn mở đầu cố định, không do AI sinh
    openingMessage: view.caseData.opening_message,
    lichSuChat: phien.messages,
    lichSuTroLy: phienTL.messages
  });
});

// 3. Gửi tin nhắn tới nhân vật
app.post('/api/case/chat', async_(async (req, res) => {
  if (!caseDangMo(res)) return;

  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Tin nhắn trống.' });
  }

  const caseData = gameState.caseHienTai.data;
  const luot = gameState.registerChatTurn();
  if (!luot.chapNhan) {
    return res.status(400).json({ error: luot.lyDo, luotConLai: 0 });
  }

  const phien = dongBoPhienChat(caseData.id);
  phien.messages.push({ role: 'user', content: message.trim() });

  const { reply, nguon } = await taoLoiThoaiNPC(caseData, phien.messages);
  phien.messages.push({ role: 'assistant', content: reply });

  res.json({
    reply,
    nguon,
    luotConLai: luot.luotConLai,
    // Nhắn tin không đụng tới chỉ số, trả về để giao diện khỏi phải đoán
    stats: gameState.stats
  });
}));

// 4. Hỏi trợ lý an toàn
//
// Trợ lý chỉ nhận đúng những gì người chơi cũng nhìn thấy — việc lọc nằm trong
// locTheoTamNhinNguoiChoi(), xem chú thích ở groqService.js. Đây là ràng buộc
// kỹ thuật chứ không phải lời dặn trong prompt, nên hỏi vòng vo kiểu "nếu là
// bạn thì bạn có bấm không" cũng không moi ra được đáp án.
//
// Hỏi trợ lý KHÔNG cộng điểm: không gọi applyDelta ở đây, và cũng không có
// đường nào để cộng. Chỉ kiểm chứng mới được thưởng.
app.post('/api/case/assistant', async_(async (req, res) => {
  if (!caseDangMo(res)) return;

  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Câu hỏi trống.' });
  }

  const caseData = gameState.caseHienTai.data;
  const luot = gameState.registerAssistantTurn();
  if (!luot.chapNhan) {
    return res.status(400).json({ error: luot.lyDo, luotConLai: 0 });
  }

  const phienTL = dongBoPhienTroLy(caseData.id);
  const phienNPC = dongBoPhienChat(caseData.id);

  const { reply, nguon } = await hoiTroLyAnToan(
    caseData,
    message.trim(),
    phienTL.messages,
    phienNPC.messages
  );

  phienTL.messages.push({ role: 'user', content: message.trim() });
  phienTL.messages.push({ role: 'assistant', content: reply });

  res.json({
    reply,
    nguon,
    luotConLai: luot.luotConLai,
    // Trả về để giao diện thấy rõ chỉ số không đổi, hỏi trợ lý là miễn phí
    stats: gameState.stats
  });
}));

// 5. Gửi các cụm đã đánh dấu
app.post('/api/case/spans', (req, res) => {
  if (!caseDangMo(res)) return;

  const { spanIds, spanId } = req.body || {};
  let daDanhDau;

  if (Array.isArray(spanIds)) {
    daDanhDau = gameState.setMarkedSpans(spanIds);
  } else if (spanId) {
    daDanhDau = gameState.toggleSpan(spanId);
  } else {
    return res.status(400).json({ error: 'Cần "spanIds" (mảng) hoặc "spanId" (một cụm để bật tắt).' });
  }

  // Bấm nhầm cụm mồi không bị phạt, nên ở đây không có thay đổi chỉ số nào
  res.json({ spanDaDanhDau: daDanhDau, stats: gameState.stats });
});

// 6. Dùng một lượt kiểm chứng
app.post('/api/case/verify', (req, res) => {
  if (!caseDangMo(res)) return;

  const { optionId } = req.body || {};
  if (!optionId) return res.status(400).json({ error: 'Thiếu "optionId".' });

  const ketQua = gameState.useVerification(optionId);
  if (!ketQua.chapNhan) {
    return res.status(400).json({ error: ketQua.lyDo, stats: gameState.stats });
  }

  res.json({
    luaChon: ketQua.luaChon,
    thuong: ketQua.thuong,
    luotKiemChungConLai: ketQua.luotKiemChungConLai,
    stats: gameState.stats
  });
});

// 7. Chốt quyết định kèm lý do
app.post('/api/case/decision', async_(async (req, res) => {
  if (!caseDangMo(res)) return;

  const { decision, reason = '', spanIds = null } = req.body || {};
  if (decision !== QUYET_DINH.LAM_THEO && decision !== QUYET_DINH.KHONG_LAM) {
    return res.status(400).json({
      error: `"decision" phải là "${QUYET_DINH.LAM_THEO}" hoặc "${QUYET_DINH.KHONG_LAM}". Kiểm chứng dùng POST /api/case/verify.`
    });
  }

  const caseData = gameState.caseHienTai.data;

  // AI chấm lý do thành 3 mức, gameState quy ra điểm và tự giảm nửa nếu quyết định sai
  const chamDiem = await chamDiemLyDo(caseData, reason);

  const ketQua = gameState.submitDecision({
    decision,
    reason,
    reasonLevel: chamDiem.muc,
    markedSpanIds: spanIds
  });

  xoaMoiPhien();

  res.json({
    quyetDinhDung: ketQua.quyetDinhDung,
    thietHai: ketQua.thietHai,
    diem: ketQua.diem,
    tongThayDoi: ketQua.tongThayDoi,
    stats: gameState.stats,
    lyDo: { muc: chamDiem.muc, feedback: chamDiem.feedback, nguon: chamDiem.nguon, diemGoc: ketQua.diemLyDoGoc },
    bocTach: duLieuBocTach(caseData, ketQua),
    tienDo: ketQua.tienDo,
    hetCase: ketQua.hetCase,
    // Vừa ôn xong mà lượt chính còn tình huống chưa chơi thì gameState đã mở
    // thẳng phần còn lại, giao diện chỉ cần nói cho người chơi biết
    chuyenSangChoiTiep: ketQua.chuyenSangChoiTiep,
    hoiPhucSauOnTap: ketQua.hoiPhucSauOnTap,
    isGameOver: gameState.isGameOver,
    ketCuc: ketQua.ketCuc
  });
}));

// 8. Bản đồ hành trình: các giai đoạn và trạng thái từng chặng.
// Tên chặng chưa mở không gửi xuống, giữ yếu tố bất ngờ kể cả khi người chơi
// mở công cụ lập trình xem dữ liệu.
app.get('/api/run/outline', (req, res) => {
  if (gameState.run.cases.length === 0) return chuaBatDau(res);

  const moHet = Boolean(gameState.ketCuc);
  const chang = gameState.run.cases.map((c, i) => {
    const ketQua = gameState.ketQuaTheoCase[c.id];
    let trangThai;
    // Xét đang chơi trước: ở màn ôn tập, chặng đang chơi lại vẫn còn kết quả
    // sai của lượt chính, để sau thì nó bị gắn nhầm là đã sai
    if (i === gameState.run.index && !gameState.isGameOver) trangThai = 'dang_choi';
    else if (ketQua === true) trangThai = 'dung';
    else if (ketQua === false) trangThai = 'sai';
    else trangThai = 'chua_mo';

    const daMo = moHet || trangThai !== 'chua_mo';
    return {
      thuTu: i + 1,
      caseId: daMo ? c.id : null,
      stageId: c.stageId || null,
      trangThai,
      title: daMo ? c.title : null
    };
  });

  // Luôn trả đủ các giai đoạn trong database để màn hành trình có ba thẻ,
  // kể cả giai đoạn chưa có tình huống nào
  const stages = [...(database.stages || [])]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      chang: chang.filter((ch) => ch.stageId === s.id)
    }));

  res.json({
    stages,
    tongSoCase: gameState.run.cases.length,
    changDangChoi: chang.find((ch) => ch.trangThai === 'dang_choi')?.thuTu || null,
    mode: gameState.run.mode,
    moHet
  });
});

// 9. Trạng thái kết thúc và dữ liệu màn ôn tập
app.get('/api/run/summary', (req, res) => {
  if (gameState.history.length === 0 && gameState.run.cases.length === 0) return chuaBatDau(res);

  const tongKet = gameState.getSummary();
  const caseSai = gameState.danhSachCaseSai();

  res.json({
    ...tongKet,
    // Cả chưa đạt lẫn thua sớm đều vào được ôn tập, miễn là có case để học lại.
    // Thua sớm mà không mở đường này thì người chơi chỉ còn cách chơi lại từ đầu.
    coTheOnTap: Boolean(
      gameState.ketCuc
      && (gameState.ketCuc.loai === KET_CUC.CHUA_DAT || gameState.ketCuc.loai === KET_CUC.THUA_SOM)
      && caseSai.length > 0
    ),
    onTap: caseSai.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      difficulty: c.difficulty,
      stageId: c.stageId || null,
      lesson: c.lesson,
      correctAction: c.correct_action
    }))
  });
});

// 10. Vào màn ôn tập — chơi lại đúng những tình huống đã sai, giữ nguyên chỉ số
app.post('/api/run/review', (req, res) => {
  if (gameState.run.cases.length === 0) return chuaBatDau(res);

  try {
    const tienDo = gameState.startReviewRun();
    xoaMoiPhien();
    res.json({ tienDo, stats: gameState.stats });
  } catch (error) {
    res.status(409).json({ error: error.message, ketCuc: gameState.ketCuc });
  }
});

// ================= XỬ LÝ LỖI =================

app.use((error, req, res, next) => {
  console.error('[server] Lỗi:', error);
  res.status(500).json({ error: error.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Web game đang chạy tại http://localhost:${PORT}`);
  if (!coKhoaAI()) {
    console.warn('[server] Chưa có GROQ_API_KEY — nhân vật sẽ dùng câu dự phòng trong database.');
  }
});
