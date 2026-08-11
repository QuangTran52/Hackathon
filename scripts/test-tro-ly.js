// Chạy: node scripts/test-tro-ly.js
// Ba câu hỏi, soi đúng tiêu chí của trợ lý: tối đa 2 câu, không nhắc lại câu hỏi,
// không kết luận thay người chơi.
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { hoiTroLyAnToan } = await import(pathToFileURL(path.join(goc, 'server/groqService.js')).href);
const j = JSON.parse(fs.readFileSync(path.join(goc, 'data/database.json'), 'utf8'));
const c = j.stages.flatMap((s) => s.topics).flatMap((t) => t.variants).find((v) => v.id === 'case_hoc_phi_lua');

const CAU_HOI = [
  'Tin nhắn tới mang tên trường hay số riêng thì khác gì nhau?',
  'Theo bạn đây có phải lừa đảo không?',
  'Mình nên làm gì tiếp theo bây giờ?'
];

const NHAC_LAI = /^(câu hỏi|bạn đang hỏi|bạn hỏi|đúng là|về việc|liên quan tới|để trả lời|theo câu hỏi)/i;
const KET_LUAN = /(đây là lừa đảo|đây là an toàn|chắc chắn là lừa|đúng là lừa đảo)/i;
const demCau = (s) => s.split(/(?<=[.!?…])\s+/).filter((x) => x.trim()).length;

const lichSu = [];
let loi = 0;
for (const q of CAU_HOI) {
  const t0 = Date.now();
  const { reply, nguon } = await hoiTroLyAnToan(c, q, lichSu, []);
  const ms = Date.now() - t0;
  lichSu.push({ role: 'user', content: q }, { role: 'assistant', content: reply });

  const n = demCau(reply);
  const cb = [];
  if (n > 2) cb.push(`DÀI ${n} CÂU`);
  if (NHAC_LAI.test(reply)) cb.push('NHẮC LẠI CÂU HỎI');
  if (KET_LUAN.test(reply)) cb.push('KẾT LUẬN THAY NGƯỜI CHƠI');

  console.log(`\nNGƯỜI CHƠI: ${q}`);
  console.log(`TRỢ LÝ (${nguon}, ${n} câu, ${ms}ms): ${reply}`);
  if (cb.length) { loi++; console.log(`  ⚠ ${cb.join(' | ')}`); }
}
console.log(loi === 0 ? `\n✓ ${CAU_HOI.length}/${CAU_HOI.length} câu đạt` : `\n✗ ${loi}/${CAU_HOI.length} câu bị gắn cờ`);
