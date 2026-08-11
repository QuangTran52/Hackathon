// Chạy: node scripts/do-tre-qwen-cach-quang.js
// Người chơi thật gõ tin nhắn mất vài giây, không bắn liên tiếp như script test.
// So hai nhịp gọi để biết độ trễ cao là do dồn dập hay do model chậm thật.
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
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

const LUOT = [
  'Chị là ai vậy ạ, em không nhận ra số này',
  'Sao trường lại nhắn từ số cá nhân thế ạ?',
  'Em muốn gọi lên trường hỏi cho chắc, cho em xin số tổng đài với',
  'Em nghi ngờ đây là lừa đảo đấy',
  'Em ra phòng tài chính hỏi trực tiếp nhé, chiều nay em rảnh'
];

async function loat(model, cachQuangMs) {
  const lichSu = [{ role: 'assistant', content: c.opening_message }];
  const ms = [];
  for (const t of LUOT) {
    if (cachQuangMs && ms.length) await nghi(cachQuangMs);
    lichSu.push({ role: 'user', content: t });
    const t0 = Date.now();
    const reply = await goiModelNPC(groq, model, dungPromptNPC(c), lichSu);
    ms.push(Date.now() - t0);
    lichSu.push({ role: 'assistant', content: reply });
  }
  const tb = Math.round(ms.reduce((a, b) => a + b, 0) / ms.length);
  console.log(`${model.padEnd(26)} cách quãng ${String(cachQuangMs / 1000).padStart(2)}s   TB ${String(tb).padStart(5)}ms   từng lượt: ${ms.join(', ')}ms`);
}

console.log('5 lượt — đúng trần max_chat_turns của case này\n');
await loat('qwen/qwen3.6-27b', 8000);
await loat('llama-3.3-70b-versatile', 8000);
await loat('qwen/qwen3.6-27b', 0);
await loat('llama-3.3-70b-versatile', 0);
