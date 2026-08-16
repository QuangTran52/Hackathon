// Chạy: node scripts/test-han-cho.js
// Kiểm tra hạn chờ 6 giây của cả ba chỗ gọi AI, không tốn một token nào.
//
// Cách làm: dựng một máy chủ nhận kết nối rồi im lặng mãi mãi — không trả lời,
// cũng không ngắt. Đây đúng là kiểu hỏng khó chịu nhất ngoài đời: API không
// báo lỗi, chỉ treo, và nếu không có hạn chờ thì người chơi ngồi nhìn ba chấm
// nhấp nháy tới lúc bỏ cuộc.
//
// GROQ_BASE_URL phải đặt TRƯỚC khi nạp groqService: client dựng muộn nên nó
// đọc biến này lúc gọi lần đầu, còn dotenv thì không ghi đè biến đã có sẵn.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const oCam = [];
const mayChuIm = http.createServer(() => {
  // Cố tình không trả lời: nhận request rồi để đó
});
mayChuIm.on('connection', (s) => oCam.push(s));
await new Promise((xong) => mayChuIm.listen(0, '127.0.0.1', xong));

process.env.GROQ_BASE_URL = `http://127.0.0.1:${mayChuIm.address().port}`;
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'khoa-gia-de-dung-client';

const { taoLoiThoaiNPC, hoiTroLyAnToan, chamDiemLyDo } =
  await import(pathToFileURL(path.join(goc, 'server/groqService.js')).href);
const j = JSON.parse(fs.readFileSync(path.join(goc, 'data/database.json'), 'utf8'));
const c = j.stages.flatMap((s) => s.topics).flatMap((t) => t.variants).find((v) => v.id === 'case_hack_ban_xin_tin_chi');

// Hạn chờ là 6000ms. Nới thêm 2 giây cho lúc máy chậm, nhưng không nới nữa:
// SDK mặc định thử lại 2 lần, nên quên maxRetries: 0 là vượt ngưỡng này ngay.
const TRAN_MS = 8000;

const CA_TEST = [
  ['taoLoiThoaiNPC', () => taoLoiThoaiNPC(c, [{ role: 'user', content: 'Ai đấy ạ?' }])],
  ['hoiTroLyAnToan', () => hoiTroLyAnToan(c, 'Đây có phải lừa đảo không?', [], [])],
  ['chamDiemLyDo', () => chamDiemLyDo(c, 'Số lạ đòi chuyển tiền gấp nên tôi nghi.')]
];

let hong = 0;
for (const [ten, chay] of CA_TEST) {
  const t0 = Date.now();
  let kq;
  try {
    kq = await chay();
  } catch (loi) {
    hong++;
    console.log(`\n${ten}: ✗ NÉM LỖI RA NGOÀI — ${loi.message}`);
    continue;
  }
  const ms = Date.now() - t0;

  const cb = [];
  if (kq.nguon !== 'du_phong') cb.push(`nguon="${kq.nguon}", đáng lẽ phải là "du_phong"`);
  if (ms > TRAN_MS) cb.push(`chờ ${ms}ms, quá trần ${TRAN_MS}ms`);
  // Mất điểm vì lỗi kỹ thuật là thứ bài test này canh chừng
  if (ten === 'chamDiemLyDo' && kq.muc !== 'tam_duoc') cb.push(`muc="${kq.muc}", đáng lẽ phải là "tam_duoc"`);

  console.log(`\n${ten} (${ms}ms, nguon=${kq.nguon}${kq.muc ? `, muc=${kq.muc}` : ''})`);
  console.log(`  ${kq.reply || kq.feedback}`);
  if (cb.length) { hong++; console.log(`  ⚠ ${cb.join(' | ')}`); }
}

for (const s of oCam) s.destroy();
mayChuIm.close();

console.log(hong === 0
  ? `\n✓ ${CA_TEST.length}/${CA_TEST.length} chỗ gọi AI đều bỏ cuộc đúng hạn và trả câu dự phòng`
  : `\n✗ ${hong}/${CA_TEST.length} chỗ gọi AI bị gắn cờ`);
process.exit(hong === 0 ? 0 : 1);
