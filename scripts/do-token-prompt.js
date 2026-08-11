// Chạy: node scripts/do-token-prompt.js
// Đo token thật của từng khối trong prompt, bằng chính tokenizer của model.
//
// Cách đo: gửi riêng từng khối làm system prompt rồi lấy prompt_tokens, trừ đi
// phần khung cố định của chat template. Gọi kiểu này chỉ tốn đúng số token của
// khối đang đo, không tốn cả prompt — quan trọng vì trần TPM chỉ có 8000.
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import Groq from 'groq-sdk';
import { pathToFileURL, fileURLToPath } from 'url';

const goc = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dungPromptNPC, dungPromptTroLy } = await import(pathToFileURL(path.join(goc, 'server/groqService.js')).href);
const j = JSON.parse(fs.readFileSync(path.join(goc, 'data/database.json'), 'utf8'));
const c = j.stages.flatMap((s) => s.topics).flatMap((t) => t.variants).find((v) => v.id === 'case_hoc_phi_lua');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'qwen/qwen3.6-27b';

async function demToken(chu) {
  const r = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: chu }, { role: 'user', content: 'x' }],
    max_completion_tokens: 1,
    reasoning_effort: 'none'
  });
  return r.usage.prompt_tokens;
}

const khung = await demToken('');

// Cắt prompt thành khối theo dòng tiêu đề [ ... ]
function tachKhoi(prompt) {
  const dong = prompt.split('\n');
  const khoi = [];
  let ten = 'Câu mở đầu';
  let than = [];
  for (const d of dong) {
    if (/^\[.+\]/.test(d)) {
      if (than.join('\n').trim()) khoi.push([ten, than.join('\n')]);
      ten = d.replace(/^\[([^\]]+)\].*$/, '$1').trim();
      than = [d];
    } else {
      than.push(d);
    }
  }
  if (than.join('\n').trim()) khoi.push([ten, than.join('\n')]);
  return khoi;
}

async function bang(nhan, prompt) {
  const tong = await demToken(prompt) - khung;
  const khoi = tachKhoi(prompt);
  const dong = [];
  for (const [ten, than] of khoi) {
    dong.push([ten, await demToken(than) - khung]);
  }
  dong.sort((a, b) => b[1] - a[1]);

  console.log(`\n${nhan} — tổng ${tong} token (khung chat template thêm ${khung})\n`);
  console.log('Khối'.padEnd(46) + 'Token'.padStart(7) + '   %');
  console.log('─'.repeat(60));
  for (const [ten, n] of dong) {
    console.log(ten.slice(0, 44).padEnd(46) + String(n).padStart(7) + `   ${Math.round((n / tong) * 100)}%`);
  }
  console.log('─'.repeat(60));
  console.log('TỔNG'.padEnd(46) + String(tong).padStart(7));
  return tong;
}

await bang('PROMPT NPC (case_hoc_phi_lua)', dungPromptNPC(c));
if (dungPromptTroLy) await bang('PROMPT TRỢ LÝ (case_hoc_phi_lua)', dungPromptTroLy(c, []));
