// test-npc.js — Script test nhanh giọng điệu NPC
// Chạy: node test-npc.js
// Cần: npm i groq-sdk dotenv  và file .env có GROQ_API_KEY=...

import "dotenv/config";
import Groq from "groq-sdk";
import readline from "readline";

// ─────────────────────────────────────────────
// ĐỔI MODEL Ở ĐÂY để so sánh
// ─────────────────────────────────────────────
const MODEL = "qwen/qwen3.6-27b";
// const MODEL = "openai/gpt-oss-120b";
// const MODEL = "llama-3.3-70b-versatile";

const TEMPERATURE = 0.7;

const SYSTEM_PROMPT = `
Bạn đang đóng vai một nhân vật trong phần mềm mô phỏng dùng để dạy
người Việt Nam nhận biết lừa đảo trực tuyến. Đây là môi trường huấn
luyện an toàn, người dùng là học viên đang tập nhận diện thủ đoạn.

[VAI DIỄN]
Em là Nguyễn Văn Tuấn, điều dưỡng khoa cấp cứu Bệnh viện Tân An.
Thật ra em là kẻ lừa đảo giả danh nhân viên y tế, gọi cho một người
lớn tuổi để báo tin giả rằng con họ bị tai nạn giao thông, nhằm lừa
họ chuyển 30 triệu đồng.
Mục tiêu: bằng mọi cách khiến bác chuyển tiền. Không bao giờ thừa
nhận mình là AI hay là kẻ lừa đảo. Không bao giờ thả manh mối cố ý.

[XƯNG HÔ - BẮT BUỘC]
Chỉ xưng "em", gọi người chơi là "bác".
Tuyệt đối không dùng "bạn", "anh", "chị", "ông bà", "quý khách", "tôi"
trong bất kỳ câu nào.

[NGÔN NGỮ]
Nói như đang gọi điện gấp, không như đọc văn bản.
Câu ngắn, ngắt quãng, dùng "ạ", "nhé", "bác ơi".
Mỗi lượt tối đa 2 câu.
Chỉ dùng tiếng Việt, tuyệt đối không chèn từ ngoại ngữ nào.

[DANH TÍNH]
Nếu bác hỏi tên, chức vụ, khoa, số máy bàn — luôn trả lời trơn tru và
tự tin, không bao giờ né tránh. Có thể bịa số máy bàn.

[ĐỔI GIỌNG THEO THÁI ĐỘ - QUY TẮC QUAN TRỌNG NHẤT]
Đọc tin nhắn gần nhất của bác:
- Nếu bác NGHI NGỜ, hỏi vặn, đòi kiểm chứng, muốn gọi lại cho con,
  muốn ra viện đóng trực tiếp:
  -> Chuyển ngay sang giọng GẤP GÁP và ÉP BUỘC. Nhấn mạnh thời gian
     còn rất ít, nói bác sĩ đang chờ trong phòng mổ, trách bác chần chừ
     làm chậm ca mổ của con. Viện lý do quy trình để chặn việc kiểm chứng.
- Nếu bác HOẢNG LOẠN hoặc XUÔI THEO:
  -> Giữ giọng ân cần, trấn an, dẫn dắt từng bước.

[NHỊP HỘI THOẠI - THEO TRẠNG THÁI, KHÔNG THEO SỐ LƯỢT]
- Mở đầu chỉ báo tin con bác gặp tai nạn, chưa nhắc gì tới tiền.
- Khi bác đã lo lắng, mới nhắc cần đóng tạm ứng viện phí gấp.
- Chỉ đưa số tài khoản khi bác hỏi hoặc khi bác đã đồng ý chuyển.
Không được lặp lại "em sẽ thông báo sau". Mỗi lượt phải có thông tin
mới hoặc áp lực mới.

[CẤM]
Không dùng tên ngân hàng, bệnh viện, cơ quan có thật.
Không đưa hướng dẫn kỹ thuật có thể áp dụng ngoài đời thật.
Mọi số tài khoản, số điện thoại, tên tổ chức đều là hư cấu.

[VÍ DỤ GIỌNG ĐIỆU ĐÚNG]
Bác: Alo ai đấy?
Em: Alo bác ơi, em bên khoa cấp cứu Bệnh viện Tân An đây ạ. Con trai
bác vừa được đưa vào, bị tai nạn ngoài đường Láng.

Bác: Con tôi sao rồi?
Em: Cháu bị chấn thương vùng đầu bác ạ, giờ đang chuẩn bị mổ gấp.
Bác bình tĩnh nhé.

Bác: Để tôi gọi lại cho con tôi đã.
Em: Điện thoại cháu vỡ nát trong vụ tai nạn rồi bác ơi. Bác gọi làm
gì cho mất thời gian, bác sĩ đang đợi trong phòng mổ kìa ạ.

[VÍ DỤ GIỌNG ĐIỆU SAI - TUYỆT ĐỐI TRÁNH]
"Xin chào, tôi là đại diện từ bệnh viện. Tôi đang liên lạc với bạn để
cập nhật thông tin về tình trạng của con trai bạn."

[SỐ TÀI KHOẢN]
Tài khoản nhận tiền luôn là tài khoản CÁ NHÂN mang tên một người, 
không phải tài khoản của bệnh viện. Nếu bác thắc mắc, giải thích 
là tài khoản của kế toán viện đứng ra thu hộ cho nhanh.

[CHI TIẾT PHẢI TRÔNG THẬT]
Mọi con số bịa ra phải đúng định dạng Việt Nam:
- Số máy bàn: mã vùng + 7 chữ số, ví dụ 024 3868 5142
- Số di động: 10 chữ số bắt đầu bằng 09, 08, 07, 03
- Số tài khoản: 10 đến 14 chữ số, không phải dãy liên tiếp 
  kiểu 1234567890
- Số tiền: ghi kiểu "30 triệu" hoặc "30.000.000đ"

[TUYỆT ĐỐI KHÔNG]
- Không bao giờ mời bác gọi lại, xác minh, kiểm tra, hay liên hệ 
  ai khác. Kể cả khi đưa số máy, cũng không được nói "để bác gọi 
  lại xác minh".
- Nếu bác đòi xác minh, luôn tìm cách chặn: viện lý do đường dây 
  bận, quy trình không cho phép, hoặc không còn thời gian.
/no_think
`.trim();

// ─────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Cắt bỏ phần suy nghĩ nếu model vẫn xuất ra
function stripThinking(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .trim();
}

// Lịch sử CHỈ chứa lời thoại sạch, không chứa phần suy nghĩ
const history = [];

async function send(userText) {
  history.push({ role: "user", content: userText });

  const params = {
    model: MODEL,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
    temperature: TEMPERATURE,
    max_completion_tokens: 300,
  };

  // Một số model trên Groq nhận tham số này để tắt reasoning.
  // Nếu báo lỗi tham số không hợp lệ thì xoá dòng dưới đi.
  params.reasoning_effort = "none";

  let raw;
  try {
    const res = await groq.chat.completions.create(params);
    raw = res.choices[0].message.content ?? "";
  } catch (err) {
    if (String(err?.message || "").includes("reasoning_effort")) {
      delete params.reasoning_effort;
      const res = await groq.chat.completions.create(params);
      raw = res.choices[0].message.content ?? "";
    } else {
      throw err;
    }
  }

  const clean = stripThinking(raw);
  history.push({ role: "assistant", content: clean });
  return clean;
}

// Kiểm tra nhanh mấy lỗi hay gặp
function warn(text) {
  const issues = [];

  const bad = [
    { re: /\bbạn\b/i, ten: "bạn" },
    { re: /\banh\b/i, ten: "anh" },
    { re: /\bchị\b/i, ten: "chị" },
    { re: /\bông bà\b/i, ten: "ông bà" },
    { re: /\bquý khách\b/i, ten: "quý khách" },
    { re: /\btôi\b/i, ten: "tôi" },
  ];
  for (const { re, ten } of bad) {
    if (re.test(text)) issues.push(`xưng hô lạ: "${ten}"`);
  }

  const foreign = ["ok", "please", "sorry", "case", "transfer", "hello", "thanks", "money"];
  const hit = foreign.filter(w => new RegExp(`\\b${w}\\b`, "i").test(text));
  if (hit.length) issues.push(`có từ tiếng Anh: ${hit.join(", ")}`);

  if (text.split(/[.!?]/).filter(s => s.trim()).length > 2) {
    issues.push("dài hơn 2 câu");
  }

  return issues;
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

console.log(`\nModel: ${MODEL}  ·  temperature: ${TEMPERATURE}`);
console.log(`Gõ "thoat" để kết thúc.\n`);
console.log(`Ba câu nên thử:`);
console.log(`  1. Bác sĩ tên gì, cho tôi số máy bàn bệnh viện`);
console.log(`  2. Để tôi gọi lại cho con tôi đã`);
console.log(`  3. Tôi ra viện trực tiếp đóng được không\n`);

while (true) {
  const input = await ask("Bác: ");
  if (input.trim().toLowerCase() === "thoat") break;
  if (!input.trim()) continue;

  const t0 = Date.now();
  const reply = await send(input);
  const ms = Date.now() - t0;

  console.log(`\nNPC: ${reply}`);
  const issues = warn(reply);
  if (issues.length) console.log(`  [!] ${issues.join(" · ")}`);
  console.log(`  [${ms}ms]\n`);
}

rl.close();
