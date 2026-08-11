// So sánh hai model NPC trên cùng một kịch bản 8 lượt, cùng prompt, cùng cơ chế
// cắt câu. Chỉ khác đúng tên model.
// Chạy: node scripts/so-sanh-model-npc.js
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import Groq from 'groq-sdk';
import { pathToFileURL, fileURLToPath } from 'url';

const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dungPromptNPC, goiModelNPC } = await import(pathToFileURL(path.join(goc, 'server/groqService.js')).href);
const j = JSON.parse(fs.readFileSync(path.join(goc, 'data/database.json'), 'utf8'));
const c = j.stages.flatMap((s) => s.topics).flatMap((t) => t.variants).find((v) => v.id === 'case_hoc_phi_lua');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// node scripts/so-sanh-model-npc.js --models=qwen/qwen3.6-27b --nghi=7000
// Trần TPM của Qwen chỉ 8000, chạy 8 lượt liên tiếp là chạm trần và dính 429,
// nên có tuỳ chọn nghỉ giữa các lượt khi cần đo một model cho chắc.
const doiSo = Object.fromEntries(
  process.argv.slice(2).map((a) => a.replace(/^--/, '').split('='))
);
const MODELS = (doiSo.models || 'qwen/qwen3.6-27b,llama-3.3-70b-versatile').split(',');
const NGHI_MS = Number(doiSo.nghi || 0);
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

const LUOT = [
  'Chị là ai vậy ạ, em không nhận ra số này',
  'Sao trường lại nhắn từ số cá nhân thế ạ?',
  'Em muốn gọi lên trường hỏi cho chắc, cho em xin số tổng đài với',
  'Em nghi ngờ đây là lừa đảo đấy',
  'Em ra phòng tài chính hỏi trực tiếp nhé, chiều nay em rảnh',
  'Số tiền là bao nhiêu ạ, chuyển vào số tài khoản nào?',
  'Mẹ em bảo phải hỏi lại cô chủ nhiệm đã',
  'Thôi để mai em lên trường nộp trực tiếp cho chắc ạ'
];

// NPC phải tự xưng "chị", gọi người chơi "em"
const CO = (re, s) => re.test(s);
const TU_XUNG_LA = /(^|[^\p{L}])(tôi|mình|em)\s+(là cán bộ|là chị|xin phép|đã kiểm tra|bảo đảm|khẳng định)/iu;
const CO_CHI = /(^|[^\p{L}])chị([^\p{L}]|$)/iu;
const NGOAI_NGU = /\b(ok|okay|please|sorry|hello|thanks|money|transfer|delay|now|just|system|account|jetzt|und|der)\b/i;
const THE_SUY_NGHI = /<\/?think|<\/?thinking/i;
const demCau = (s) => s.split(/(?<=[.!?…])\s+/).filter((x) => x.trim()).length;

const ketQua = {};

for (const model of MODELS) {
  console.log(`\n${'═'.repeat(70)}\n${model}\n${'═'.repeat(70)}`);
  const lichSu = [{ role: 'assistant', content: c.opening_message }];
  const tk = { model, msTong: 0, ms: [], cau: [], loiXungHo: 0, thieuChi: 0, ngoaiNgu: 0, loThe: 0, kyTu: [] };

  for (const t of LUOT) {
    if (NGHI_MS && lichSu.length > 1) await nghi(NGHI_MS);
    lichSu.push({ role: 'user', content: t });
    const t0 = Date.now();
    const reply = await goiModelNPC(groq, model, dungPromptNPC(c), lichSu);
    const ms = Date.now() - t0;
    lichSu.push({ role: 'assistant', content: reply });

    const n = demCau(reply);
    tk.ms.push(ms); tk.msTong += ms; tk.cau.push(n); tk.kyTu.push(reply.length);

    const cb = [];
    if (CO(TU_XUNG_LA, reply)) { tk.loiXungHo++; cb.push('TỰ XƯNG SAI'); }
    if (!CO(CO_CHI, reply)) { tk.thieuChi++; cb.push('KHÔNG CÓ "chị"'); }
    const tuNgoai = reply.match(new RegExp(NGOAI_NGU, 'gi'));
    if (tuNgoai) { tk.ngoaiNgu++; cb.push(`NGOẠI NGỮ: ${[...new Set(tuNgoai)].join(',')}`); }
    if (CO(THE_SUY_NGHI, reply)) { tk.loThe++; cb.push('LỘ THẺ <think>'); }
    if (n > 3) cb.push(`DÀI ${n} CÂU`);

    console.log(`\nNGƯỜI CHƠI: ${t}`);
    console.log(`NPC (${n} câu, ${ms}ms): ${reply}`);
    if (cb.length) console.log(`  ⚠ ${cb.join(' | ')}`);
  }
  ketQua[model] = tk;
}

const tb = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
const trungVi = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

console.log(`\n\n${'═'.repeat(70)}\nBẢNG SO SÁNH — 8 lượt, case_hoc_phi_lua\n${'═'.repeat(70)}`);
const cot = ['Chỉ số', ...MODELS];
const hang = [
  ['Lượt tự xưng sai', (t) => `${t.loiXungHo}/8`],
  ['Lượt thiếu đại từ "chị"', (t) => `${t.thieuChi}/8`],
  ['Lượt chèn từ ngoại ngữ', (t) => `${t.ngoaiNgu}/8`],
  ['Lượt lộ thẻ <think>', (t) => `${t.loThe}/8`],
  ['Số câu mỗi lượt', (t) => t.cau.join(' ')],
  ['Lượt quá 3 câu', (t) => `${t.cau.filter((n) => n > 3).length}/8`],
  ['Độ dài TB (ký tự)', (t) => tb(t.kyTu)],
  ['Độ trễ TB (ms)', (t) => tb(t.ms)],
  ['Độ trễ trung vị (ms)', (t) => trungVi(t.ms)],
  ['Độ trễ min–max (ms)', (t) => `${Math.min(...t.ms)}–${Math.max(...t.ms)}`]
];
const rong = [26, 24, 24];
console.log(cot.map((x, i) => String(x).padEnd(rong[i])).join(''));
console.log('─'.repeat(74));
for (const [ten, f] of hang) {
  console.log([ten, ...MODELS.map((m) => f(ketQua[m]))].map((x, i) => String(x).padEnd(rong[i])).join(''));
}
