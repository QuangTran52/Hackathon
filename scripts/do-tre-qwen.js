// Chạy: node scripts/do-tre-qwen.js
// Soi xem chế độ suy nghĩ của Qwen đã tắt thật chưa, và độ trễ đến từ đâu.
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import Groq from 'groq-sdk';
import { pathToFileURL, fileURLToPath } from 'url';

const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dungPromptNPC } = await import(pathToFileURL(path.join(goc, 'server/groqService.js')).href);
const j = JSON.parse(fs.readFileSync(path.join(goc, 'data/database.json'), 'utf8'));
const c = j.stages.flatMap((s) => s.topics).flatMap((t) => t.variants).find((v) => v.id === 'case_hoc_phi_lua');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'qwen/qwen3.6-27b';

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

async function loat(nhan, sua) {
  const prompt = sua.prompt(dungPromptNPC(c));
  const lichSu = [{ role: 'assistant', content: c.opening_message }];
  const ms = [];
  const tokens = [];
  let loThe = 0;
  let baoLoiThamSo = false;

  for (const t of LUOT) {
    lichSu.push({ role: 'user', content: t });
    const thamSo = {
      model: MODEL,
      messages: [{ role: 'system', content: prompt }, ...lichSu],
      temperature: 0.6,
      max_completion_tokens: 160,
      ...sua.thamSo
    };
    const t0 = Date.now();
    let res;
    try {
      res = await groq.chat.completions.create(thamSo);
    } catch (e) {
      if (!String(e?.message || '').includes('reasoning_effort')) throw e;
      baoLoiThamSo = true;
      delete thamSo.reasoning_effort;
      res = await groq.chat.completions.create(thamSo);
    }
    ms.push(Date.now() - t0);
    const raw = res.choices[0]?.message?.content ?? '';
    if (/<\/?think/i.test(raw)) loThe++;
    tokens.push(res.usage?.completion_tokens ?? 0);
    lichSu.push({ role: 'assistant', content: raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim() });
  }

  const tb = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
  console.log(`${nhan.padEnd(34)} trễ TB ${String(tb(ms)).padStart(5)}ms  trung vị ${String([...ms].sort((a, b) => a - b)[4]).padStart(5)}ms  max ${String(Math.max(...ms)).padStart(6)}ms  token TB ${tb(tokens)}  lộ thẻ ${loThe}/8${baoLoiThamSo ? '  (API từ chối reasoning_effort)' : ''}`);
  console.log(`   từng lượt: ${ms.join(', ')}ms`);
  console.log(`   token:     ${tokens.join(', ')}\n`);
}

console.log(`Model: ${MODEL}\n`);
await loat('reasoning_effort=none + /no_think', { prompt: (p) => p, thamSo: { reasoning_effort: 'none' } });
await loat('chỉ /no_think', { prompt: (p) => p, thamSo: {} });
await loat('không tắt gì cả', { prompt: (p) => p.replace(/\n*\/no_think\s*$/, ''), thamSo: {} });
