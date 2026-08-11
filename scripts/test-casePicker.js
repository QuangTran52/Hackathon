// test-casePicker.js — chạy nhiều lượt rút để soi độ phủ của casePicker
//
// Chạy:  node scripts/test-casePicker.js
//
// Kiểm tra:
//   - Mọi biến thể trong database.json đều có cơ hội xuất hiện
//   - Mỗi lượt luôn đủ hạn ngạch tình huống an toàn (minSafe)
//   - Hạn ngạch tính theo LƯỢT chứ không theo giai đoạn, nên chủ đề có bản
//     safe vẫn phải rút trúng bản scam ở một số lượt
//   - Cùng một seed thì ra cùng một kết quả

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { pickRun } from '../server/casePicker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SO_LUOT = 200;
const MIN_SAFE = 2;

let soLoi = 0;

function tieuDe(chu) {
  console.log('\n' + '='.repeat(72));
  console.log(chu);
  console.log('='.repeat(72));
}

function kiemTra(nhan, dat, chiTiet) {
  if (!dat) soLoi += 1;
  console.log(`   ${dat ? 'OK  ' : 'SAI '} ${nhan}${chiTiet ? `: ${chiTiet}` : ''}`);
}

const database = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'database.json'), 'utf-8')
);

// ================= LIỆT KÊ MỌI BIẾN THỂ TRONG KHO =================

// Mỗi biến thể trong database đều phải rút được, nếu không thì công sức viết
// nội dung đổ sông đổ bể mà không ai biết.
const moiCase = [];
for (const stage of database.stages || []) {
  for (const topic of stage.topics || []) {
    for (const v of topic.variants || []) {
      moiCase.push({
        id: v.id,
        type: v.type,
        stageName: stage.name,
        topicName: topic.name,
      });
    }
  }
}

// Tắt cảnh báo của casePicker trong lúc chạy vòng lặp, nếu không 200 lượt sẽ
// ngập console. Cảnh báo vẫn được đếm lại bên dưới.
const canhBaoGoc = console.warn;
console.warn = () => {};

// ================= CHẠY 200 LƯỢT =================

const demSoLan = new Map(moiCase.map((c) => [c.id, 0]));
const demSafeMoiLuot = [];
const luotThieuSafe = [];
const canhBaoDaGap = new Map();

for (let i = 0; i < SO_LUOT; i += 1) {
  const { cases, warnings } = pickRun(database, { minSafe: MIN_SAFE });

  for (const c of cases) {
    if (!demSoLan.has(c.id)) {
      // Rút ra id không có trong database là lỗi cấu trúc, cần biết ngay
      demSoLan.set(c.id, 0);
      moiCase.push({ id: c.id, type: c.type, stageName: c.stageName, topicName: c.topicName });
    }
    demSoLan.set(c.id, demSoLan.get(c.id) + 1);
  }

  const soSafe = cases.filter((c) => c.type === 'safe').length;
  demSafeMoiLuot.push(soSafe);
  if (soSafe < MIN_SAFE) luotThieuSafe.push({ luot: i + 1, soSafe });

  for (const w of warnings) {
    canhBaoDaGap.set(w, (canhBaoDaGap.get(w) || 0) + 1);
  }
}

console.warn = canhBaoGoc;

// ================= BẢNG TẦN SUẤT =================

tieuDe(`TẦN SUẤT TỪNG TÌNH HUỐNG SAU ${SO_LUOT} LƯỢT`);

const rongId = Math.max(...moiCase.map((c) => c.id.length), 4);
const rongGiaiDoan = Math.max(...moiCase.map((c) => c.stageName.length), 9);

console.log(
  `${'case'.padEnd(rongId)}  ${'loại'.padEnd(5)}  ${'giai đoạn'.padEnd(rongGiaiDoan)}  ${'lần'.padStart(5)}  ${'%'.padStart(6)}`
);
console.log('-'.repeat(rongId + rongGiaiDoan + 26));

let stageHienTai = null;
for (const c of moiCase) {
  if (stageHienTai !== null && c.stageName !== stageHienTai) console.log('');
  stageHienTai = c.stageName;

  const soLan = demSoLan.get(c.id);
  const tyLe = ((soLan / SO_LUOT) * 100).toFixed(1);
  const canhBao = soLan === 0 ? '  <-- KHÔNG BAO GIỜ XUẤT HIỆN' : '';
  console.log(
    `${c.id.padEnd(rongId)}  ${c.type.padEnd(5)}  ${c.stageName.padEnd(rongGiaiDoan)}  ${String(soLan).padStart(5)}  ${tyLe.padStart(5)}%${canhBao}`
  );
}

// ================= KIỂM TRA =================

tieuDe('KIỂM TRA');

const khongXuatHien = moiCase.filter((c) => demSoLan.get(c.id) === 0).map((c) => c.id);
kiemTra(
  'mọi tình huống trong database đều có lúc được rút',
  khongXuatHien.length === 0,
  khongXuatHien.length ? `thiếu ${JSON.stringify(khongXuatHien)}` : `${moiCase.length} tình huống`
);

kiemTra(
  `mọi lượt đều đủ ${MIN_SAFE} tình huống an toàn`,
  luotThieuSafe.length === 0,
  luotThieuSafe.length ? `${luotThieuSafe.length} lượt thiếu, ví dụ ${JSON.stringify(luotThieuSafe[0])}` : null
);

// Hạn ngạch cấp lượt thì không được ép cứng theo giai đoạn nữa: các chủ đề
// vừa có safe vừa có scam phải rút trúng scam ở một số lượt.
const topicHonHop = [];
for (const stage of database.stages || []) {
  for (const topic of stage.topics || []) {
    const vs = topic.variants || [];
    if (vs.some((v) => v.type === 'safe') && vs.some((v) => v.type === 'scam')) {
      topicHonHop.push({ topic, stageName: stage.name });
    }
  }
}

for (const { topic, stageName } of topicHonHop) {
  const scamIds = topic.variants.filter((v) => v.type === 'scam').map((v) => v.id);
  const tongScam = scamIds.reduce((t, id) => t + (demSoLan.get(id) || 0), 0);
  kiemTra(
    `chủ đề "${topic.name}" (${stageName}) không bị khoá cứng vào bản an toàn`,
    tongScam > 0,
    `bản scam ra ${tongScam}/${SO_LUOT} lượt`
  );
}

// Số safe trung bình nên nhỉnh hơn minSafe chứ không dính chặt vào minSafe,
// nếu bằng đúng minSafe ở mọi lượt là dấu hiệu đang ép quá tay.
const tongSafe = demSafeMoiLuot.reduce((a, b) => a + b, 0);
const trungBinhSafe = tongSafe / SO_LUOT;
const soLuotVuotNguong = demSafeMoiLuot.filter((n) => n > MIN_SAFE).length;
console.log(`   [số liệu] safe trung bình mỗi lượt: ${trungBinhSafe.toFixed(2)}`);
kiemTra(
  'có lượt rút tự nhiên được nhiều safe hơn hạn ngạch',
  soLuotVuotNguong > 0,
  `${soLuotVuotNguong}/${SO_LUOT} lượt`
);

// Cùng seed thì phải ra cùng kết quả, nếu không thì bản demo không tin được
console.warn = () => {};
const seedA = pickRun(database, { seed: 'kiem-tra-seed' }).cases.map((c) => c.id);
const seedB = pickRun(database, { seed: 'kiem-tra-seed' }).cases.map((c) => c.id);
console.warn = canhBaoGoc;
kiemTra('cùng seed ra cùng kết quả', JSON.stringify(seedA) === JSON.stringify(seedB), seedA.join(', '));

if (canhBaoDaGap.size) {
  console.log('\n   Cảnh báo casePicker đã phát trong lúc chạy:');
  for (const [w, n] of canhBaoDaGap) console.log(`   - (${n} lượt) ${w}`);
}

// ================= KẾT =================

tieuDe(soLoi === 0 ? 'TẤT CẢ KIỂM TRA ĐỀU ĐẠT' : `CÓ ${soLoi} KIỂM TRA KHÔNG ĐẠT`);
if (soLoi > 0) process.exitCode = 1;
