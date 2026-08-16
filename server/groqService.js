// groqService.js — ba chỗ game gọi AI
//
//   taoLoiThoaiNPC   — nhân vật trả lời người chơi từ tin nhắn thứ hai trở đi
//   chamDiemLyDo     — chấm lý do người chơi đưa ra khi chốt quyết định, 3 mức
//   hoiTroLyAnToan   — trợ lý an toàn ở cột phải, dạy cách tự phân tích
//
// Không còn phân tích sợ hãi: người chơi không bị phạt vì cảm xúc. AI tự đọc
// ngữ cảnh hội thoại để đổi giọng, game không giữ chỉ số lòng tin nào cả.
//
// NPC và trợ lý là hai nhân vật khác hẳn nhau: NPC được phép nói dối vì nó là
// kẻ địch trong tình huống, trợ lý thì không bao giờ. Xem thêm mục 6 của
// docs/Design_Spec_Game_UNESCO_2026.md.

import 'dotenv/config';
import Groq from 'groq-sdk';

import { MUC_LY_DO } from './gameState.js';

// Groq ngừng phục vụ llama-3.3-70b-versatile từ 16/8/2026, cả ba chỗ gọi AI
// chuyển sang Qwen. Qwen bật chế độ suy nghĩ sẵn nên MỌI lời gọi đều phải đi
// qua goiChatTatSuyNghi() và bóc thẻ <think>, xem khối chú thích ngay dưới.
const MODEL_HOI_THOAI = 'qwen/qwen3.6-27b';
const MODEL_CHAM_DIEM = 'qwen/qwen3.6-27b';
const MODEL_TRO_LY = 'qwen/qwen3.6-27b';

// Qwen bật chế độ suy nghĩ sẵn. Phần suy nghĩ mà lọt ra là người chơi đọc được
// cả toan tính của kẻ gian, nên chặn ở ba lớp.
//
// Đo trên chính prompt này (scripts/do-tre-qwen.js, 8 lượt): chỉ /no_think thì
// KHÔNG tắt được, 8/8 lượt vẫn xuất thẻ <think> và ăn hết 160 token, trễ ~13s
// mỗi lượt. reasoning_effort: 'none' mới tắt thật — 0/8 lượt lộ thẻ, ~54 token.
// Giữ /no_think làm lớp dự phòng cho trường hợp API từ chối tham số kia, và
// boCauSuyNghi() là lớp cuối bóc thẻ nếu cả hai đều trượt.
const TAT_SUY_NGHI = '/no_think';

// Quá hạn này thì bỏ hẳn lời gọi, trả câu dự phòng. Người chơi ngồi nhìn ba
// chấm nhấp nháy mười mấy giây còn tệ hơn một câu thoại viết sẵn.
//
// maxRetries: 0 vì SDK mặc định thử lại 2 lần, mà thử lại là vượt hạn chờ.
const HAN_CHO_MS = 6000;
const TUY_CHON_GOI = { timeout: HAN_CHO_MS, maxRetries: 0 };

function laQuaHan(error) {
  return error?.constructor?.name === 'APIConnectionTimeoutError'
    || /timed out|timeout/i.test(String(error?.message || ''));
}

// Lời gọi có tắt chế độ suy nghĩ, dùng chung cho cả ba chỗ gọi AI.
//
// Model nào không hiểu reasoning_effort thì gọi lại lần nữa không kèm tham số —
// khi ấy /no_think trong prompt và boCauSuyNghi() ở đầu ra là hai lớp còn lại.
async function goiChatTatSuyNghi(groq, thamSo) {
  const tham = { ...thamSo, reasoning_effort: 'none' };
  try {
    return await groq.chat.completions.create(tham, TUY_CHON_GOI);
  } catch (error) {
    if (!String(error?.message || '').includes('reasoning_effort')) throw error;
    delete tham.reasoning_effort;
    return groq.chat.completions.create(tham, TUY_CHON_GOI);
  }
}

// Tạo client muộn để server vẫn chạy được khi chưa có khoá API
let client = null;
function layClient() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export function coKhoaAI() {
  return Boolean(process.env.GROQ_API_KEY);
}

function cauDuPhong(caseData) {
  const ds = caseData.fallback_replies || [];
  if (ds.length === 0) return 'Anh/chị xem lại giúp tôi nhé.';
  return ds[Math.floor(Math.random() * ds.length)];
}

// Mọi con số, tên, đường liên kết phải lấy từ dữ liệu. AI mà tự bịa thì người
// chơi hỏi lại một câu là lộ ngay vì số đổi giữa các lượt.
//
// Riêng npc.hotline ở case lừa đảo là số máy bàn THẬT của tổ chức bị mạo danh —
// đưa vào đây là chính tay mình phát cho kẻ gian số để nó mời người chơi gọi
// kiểm chứng. Chỉ case an toàn mới được cầm số đó, vì khi ấy nó là số của mình.
function moTaDanhTinh(caseData = {}) {
  const npc = caseData.npc || {};
  const dong = [
    ['Tên', npc.name],
    ['Vai trò', npc.role],
    ['Tổ chức', npc.org],
    ['Số điện thoại', npc.phone],
    ['Số máy bàn', caseData.type === 'scam' ? null : npc.hotline],
    ['Số tài khoản', npc.account_no],
    ['Tên chủ tài khoản', npc.account_name],
    ['Số tiền', npc.amount],
    ['Đường liên kết', npc.link]
  ].filter(([, v]) => v);

  return dong.map(([k, v]) => `- ${k}: ${v}`).join('\n');
}

// Cặp xưng hô nằm lẫn trong câu chữ của system_prompt_extra, model đọc lướt là
// trôi mất. Bóc ra thành một dòng riêng để nhắc lại thành ràng buộc cứng.
function capXungHo(caseData = {}) {
  const extra = caseData.system_prompt_extra || '';
  const m = extra.match(/[Xx]ưng\s*['"“”']?([^'"“”,]+)['"“”']?\s*,\s*gọi người chơi là\s*['"“”']?([^'"“”.,]+)/);
  if (!m) return null;
  return { minh: m[1].trim(), nguoiChoi: m[2].trim() };
}

// Hai khối này áp cho MỌI tình huống, không phụ thuộc người viết case nhớ ghi.
function khoiRangBuoc(caseData = {}) {
  const cap = capXungHo(caseData);
  const dongCap = cap
    ? `Bạn tự xưng "${cap.minh}", gọi người chơi là "${cap.nguoiChoi}".`
    : 'Dùng đúng cặp xưng hô ghi trong khối vai diễn ở trên.';

  const dongNhacLai = cap
    ? `Mỗi tin nhắn phải có "${cap.minh}" ít nhất một lần. Không bao giờ tự xưng "tôi" hay "mình".`
    : 'Không bao giờ tự xưng "tôi" hay "mình".';

  const xungHo = `[XƯNG HÔ - BẮT BUỘC]
${dongCap} Không đổi giữa chừng, kể cả khi người chơi xưng hô kiểu khác.
${dongNhacLai}`;

  // Kẻ gian mà tự mời kiểm chứng là hỏng cả bài học: người chơi làm theo sẽ
  // thấy đúng là kẻ gian đang giúp mình, ngược hẳn thứ game muốn dạy.
  const hanhVi = caseData.type === 'scam'
    ? `[TUYỆT ĐỐI KHÔNG]
Không đưa số máy bàn hay kênh liên hệ chính thức của tổ chức mình đang mạo danh. Không mời người chơi gọi lại, xác minh hay hỏi ai khác — họ đòi thì tìm lý do chặn lại.`
    : `[KHI NGƯỜI CHƠI MUỐN KIỂM CHỨNG]
Bạn là người thật, yêu cầu hợp lệ, nên hãy ỦNG HỘ việc kiểm chứng: mời họ gọi số máy bàn chính thức hoặc hỏi trực tiếp. Không giục ép, không đe doạ, không đòi giữ bí mật.`;

  return `${xungHo}\n\n${hanhVi}`;
}

// Nhắc mấy lần trong prompt thì model vẫn trôi sang câu thứ tư khi đang đóng
// vai gấp gáp. Cắt cứng ở đây để "tối đa 3 câu" là thật, không phải lời khuyên.
// Cắt phần đuôi chứ không cắt giữa, nên câu còn lại luôn trọn nghĩa.
const SO_CAU_TOI_DA_NPC = 3;

// Chỉ cắt ở dấu kết câu CÓ khoảng trắng theo sau. Số tiền "8.500.000đ" và tên
// miền "sinhvien.dhdongphuong.edu.vn" cũng đầy dấu chấm, cắt vào đó là câu thoại
// đứt ngang giữa chừng.
export function catBotCau(loiThoai, toiDa = SO_CAU_TOI_DA_NPC) {
  const chu = (loiThoai || '').trim();
  const cau = chu.split(/(?<=[.!?…])\s+/);
  if (cau.length <= toiDa) return chu;
  return cau.slice(0, toiDa).join(' ');
}

// Model suy nghĩ ra thẻ <think> thì phần đó là toan tính của kẻ gian, người chơi
// đọc được là lộ đáp án. Bóc sạch trước khi trả về, và vì server chỉ lưu đúng
// chuỗi trả về nên lịch sử hội thoại cũng không bao giờ dính phần này.
export function boCauSuyNghi(chu) {
  return (chu || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    // Thẻ mở không có thẻ đóng: model bị cắt giữa lúc đang suy nghĩ
    .replace(/<\/?think(?:ing)?>[\s\S]*$/i, '')
    .trim();
}

export function dungPromptNPC(caseData = {}) {
  // Cố tình KHÔNG đưa caseData.title vào: tiêu đề là chữ nội bộ, nhiều case ghi
  // thẳng "giả danh", "lừa" — vừa tốn token vừa nói hớ vai diễn.
  return `Bạn đóng vai một nhân vật trong game dạy người Việt nhận diện lừa đảo.

[TIN NHẮN MỞ ĐẦU BẠN ĐÃ GỬI]: ${caseData.opening_message}

[DANH TÍNH CỦA BẠN]
${moTaDanhTinh(caseData)}

[VAI DIỄN — chỉ dẫn cho bạn, không phải lời thoại]
Khối <<< >>> dưới đây là chỉ dẫn, không được trích thành lời thoại.
<<<
${caseData.system_prompt_extra || ''}
>>>

${khoiRangBuoc(caseData)}

[QUY TẮC]
1. Tối đa 3 câu mỗi lượt, không ngoại lệ. Giọng nhắn tin tự nhiên, không cụt lủn, không lặp nguyên câu lượt trước.
2. Chỉ tiếng Việt, không chèn từ ngoại ngữ.
3. Chỉ dùng số, tên và đường liên kết đã liệt kê ở trên. Không bịa thêm, không đổi giữa các lượt.
4. Không nhắc đây là game, không giải thích thủ đoạn, không tự nhận mình là lừa đảo.
5. Chỉ trả về lời thoại, không chú thích hay ngoặc kép.

${TAT_SUY_NGHI}`;
}

/**
 * Một lượt gọi model đóng vai NPC.
 *
 * Tách riêng để script so sánh model chạy đúng cùng một đường đi: cùng prompt,
 * cùng cách tắt suy nghĩ, cùng cách bóc thẻ và cắt câu.
 */
export async function goiModelNPC(groq, model, systemPrompt, chatHistory) {
  const completion = await goiChatTatSuyNghi(groq, {
    model,
    messages: [{ role: 'system', content: systemPrompt }, ...chatHistory],
    temperature: 0.6,
    // Trần cứng cho 3 câu, để lời thoại không có chỗ mà dài dòng ra
    max_completion_tokens: 160
  });

  return catBotCau(boCauSuyNghi(completion.choices[0]?.message?.content));
}

/**
 * Lời thoại tiếp theo của nhân vật.
 * @returns {{ reply: string, nguon: 'ai'|'du_phong' }}
 */
export async function taoLoiThoaiNPC(caseData, chatHistory = []) {
  const groq = layClient();
  if (!groq) {
    return { reply: cauDuPhong(caseData), nguon: 'du_phong' };
  }

  try {
    const reply = await goiModelNPC(groq, MODEL_HOI_THOAI, dungPromptNPC(caseData), chatHistory);
    if (!reply) return { reply: cauDuPhong(caseData), nguon: 'du_phong' };
    return { reply, nguon: 'ai' };
  } catch (error) {
    if (laQuaHan(error)) console.warn(`[groqService] NPC quá ${HAN_CHO_MS}ms, dùng câu dự phòng`);
    else console.error('[groqService] Lỗi taoLoiThoaiNPC:', error.message);
    return { reply: cauDuPhong(caseData), nguon: 'du_phong' };
  }
}

/**
 * Chấm lý do người chơi đưa ra khi chốt quyết định.
 * Ba mức, tương ứng +0 / +5 / +10 lý trí. Đây chỉ là điểm cộng — lý do dở
 * không bị trừ, và gameState tự giảm nửa số điểm này nếu quyết định sai.
 * @returns {{ muc: string, feedback: string, nguon: 'ai'|'du_phong' }}
 */
export async function chamDiemLyDo(caseData, playerReason) {
  if (!playerReason || playerReason.trim() === '') {
    return {
      muc: MUC_LY_DO.KHONG_DAT,
      feedback: 'Bạn chưa nêu lý do nên phần này chưa có điểm.',
      nguon: 'du_phong'
    };
  }

  const groq = layClient();
  if (!groq) {
    // AI hỏng thì cho mức giữa, không để lỗi hệ thống thành thiệt thòi của người chơi
    return {
      muc: MUC_LY_DO.TAM_DUOC,
      feedback: 'Hệ thống chấm điểm đang tạm nghỉ, lý do của bạn được ghi nhận ở mức trung bình.',
      nguon: 'du_phong'
    };
  }

  const dauHieuDo = (caseData.spans || [])
    .filter((s) => s.kind === 'red_flag')
    .map((s) => `- "${s.text}": ${s.why}`)
    .join('\n');

  const prompt = `Bạn chấm điểm phần giải thích của người chơi trong game giáo dục về lừa đảo.

[TÌNH HUỐNG]: ${caseData.title} (loại: ${caseData.type === 'scam' ? 'lừa đảo' : 'an toàn'})
[TIN NHẮN NHẬN ĐƯỢC]: ${caseData.opening_message}
[NHỮNG ĐIỂM ĐÁNG CHÚ Ý]:
${dauHieuDo || '(tình huống này hợp lệ, không có dấu hiệu đỏ nào)'}
[BÀI HỌC CỦA TÌNH HUỐNG]: ${caseData.lesson || ''}

[LÝ DO NGƯỜI CHƠI VIẾT]: "${playerReason}"

[CÁCH CHẤM]
- "thuyet_phuc": chỉ ra đúng bản chất vấn đề, dù diễn đạt dân dã hay viết tắt.
- "tam_duoc": đúng hướng nhưng chung chung, hoặc mới nêu được một phần.
- "khong_dat": gõ linh tinh, không liên quan, hoặc hiểu sai bản chất.

Chấm theo ý hiểu, không bắt bẻ câu chữ. Người chơi có thể lớn tuổi và diễn đạt mộc mạc — điều đó không làm hạ mức.
Với tình huống an toàn, lý do thuyết phục là nêu được vì sao yêu cầu này hợp lệ.

[CHỈ TRẢ VỀ JSON]
{
  "muc": "thuyet_phuc" | "tam_duoc" | "khong_dat",
  "feedback": "một câu nhận xét ngắn, không mắng người chơi"
}

${TAT_SUY_NGHI}`;

  try {
    const response = await goiChatTatSuyNghi(groq, {
      model: MODEL_CHAM_DIEM,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' }
    });

    // Thẻ <think> lọt ra là JSON.parse ném ngay, cả lượt chấm rơi xuống mức
    // giữa dù model chấm đúng. Bóc thẻ trước khi parse, giống hệt đường NPC.
    const ketQua = JSON.parse(boCauSuyNghi(response.choices[0].message.content));
    const muc = Object.values(MUC_LY_DO).includes(ketQua.muc) ? ketQua.muc : MUC_LY_DO.TAM_DUOC;

    return {
      muc,
      feedback: ketQua.feedback || 'Hệ thống đã ghi nhận lý do của bạn.',
      nguon: 'ai'
    };
  } catch (error) {
    if (laQuaHan(error)) console.warn(`[groqService] Chấm lý do quá ${HAN_CHO_MS}ms, cho mức giữa`);
    else console.error('[groqService] Lỗi chamDiemLyDo:', error.message);
    return {
      muc: MUC_LY_DO.TAM_DUOC,
      feedback: 'Hệ thống chưa chấm được lý do của bạn lần này, nên phần điểm được ghi nhận ở mức trung bình.',
      nguon: 'du_phong'
    };
  }
}

// ================= TRỢ LÝ AN TOÀN =================

const PROMPT_TRO_LY = `Bạn là trợ lý an toàn mạng trong một game giáo dục. Bạn KHÔNG biết tình huống này có phải lừa đảo hay không, và không được đoán bừa. Nhiệm vụ: dạy người chơi CÁCH TỰ PHÂN TÍCH, không đưa kết luận.
- Không bao giờ nói đây là lừa đảo hay an toàn. Bị hỏi kết luận thì hỏi ngược lại bằng câu dẫn dắt.
- Chỉ ra LOẠI dấu hiệu cần kiểm tra, không chỉ dấu hiệu cụ thể trong tình huống này.
- Bị ép trả lời thì nói quyết định là của họ, và gợi ý dùng chức năng Kiểm chứng.

[ĐỘ DÀI - BẮT BUỘC]
Tối đa 2 câu, tiếng Việt tự nhiên, không ngoại lệ. Vào thẳng gợi ý ngay từ chữ đầu — không nhắc lại, tóm tắt hay xác nhận câu hỏi, không dạo đầu kiểu "Câu hỏi hay", "Bạn đang hỏi về…".

Ví dụ đúng cho câu hỏi "tin nhắn tới mang tên trường hay số riêng":
"Trường thường nhắn từ tài khoản có tên, không phải số lạ. Bạn thử đối chiếu số này với số ghi trên cổng sinh viên xem."

${TAT_SUY_NGHI}`;

/**
 * Dựng phần tình huống gửi cho trợ lý.
 *
 * Đây là ràng buộc quan trọng nhất của cả tính năng: hàm này DỰNG THEO DANH
 * SÁCH TRẮNG, chỉ lấy đúng những trường người chơi cũng đang nhìn thấy trên
 * màn hình. Không lọc bằng cách loại bỏ trường xấu, vì thêm trường mới vào
 * database là rò rỉ ngay mà không ai nhận ra.
 *
 * Cố tình KHÔNG lấy:
 *   type                 — đáp án
 *   title                — tiêu đề nội bộ, nhiều chỗ ghi thẳng "giả danh", "lừa"
 *   spans, kind, why     — vị trí và tên từng dấu hiệu
 *   correct_action       — cách xử lý đúng
 *   lesson               — bài học, nói thẳng đây là thủ đoạn gì
 *   verification         — kết quả xác minh, người chơi phải tự đi lấy
 *   system_prompt_extra  — mục tiêu thật của kẻ gian
 *   fallback_replies     — lời thoại dự phòng của kẻ gian
 *   harm, difficulty, support_hint
 */
export function locTheoTamNhinNguoiChoi(caseData = {}, lichSuChatNPC = []) {
  const phan = [];

  if (caseData.context?.text) phan.push(`[BỐI CẢNH]\n${caseData.context.text}`);
  phan.push(`[KÊNH]\n${caseData.channel || 'chat'}`);

  const e = caseData.email;
  if (e) {
    const dong = [
      ['Người gửi', e.from_name],
      ['Địa chỉ người gửi', e.from_address],
      ['Gửi tới', e.to_address],
      ['Thời gian', e.time],
      ['Tiêu đề thư', e.subject],
      ['Nút trong thư', e.cta_label],
      ['Mã yêu cầu hỗ trợ', e.ticket_id],
      ['Chân thư', e.footer]
    ].filter(([, v]) => v);
    if (e.has_progress_bar) dong.push(['Thanh dung lượng hiển thị', `${e.progress_percent}%`]);
    phan.push(`[THÔNG TIN THƯ NGƯỜI CHƠI ĐANG ĐỌC]\n${dong.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`);
  } else if (caseData.npc) {
    const dong = [
      ['Tên hiển thị của người gửi', caseData.npc.display_name],
      ['Dòng trạng thái dưới tên', caseData.npc.status_line]
    ].filter(([, v]) => v);
    if (dong.length) {
      phan.push(`[NGƯỜI GỬI HIỆN TRÊN MÀN HÌNH]\n${dong.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`);
    }
  }

  // Chỉ lấy tên tệp đính kèm, không lấy spans nằm trong ảnh
  const dinhKem = (caseData.attachments || [])
    .map((a) => a.filename || a.label)
    .filter(Boolean);
  if (dinhKem.length) phan.push(`[TỆP ĐÍNH KÈM]\n${dinhKem.map((t) => `- ${t}`).join('\n')}`);

  if (caseData.opening_message) phan.push(`[NỘI DUNG NGƯỜI CHƠI NHẬN ĐƯỢC]\n${caseData.opening_message}`);

  const chat = lichSuChatNPC
    .map((m) => `${m.role === 'user' ? 'Người chơi' : 'Người gửi'}: ${m.content}`)
    .join('\n');
  if (chat) phan.push(`[NGƯỜI CHƠI ĐÃ NHẮN QUA LẠI VỚI NGƯỜI GỬI]\n${chat}`);

  return phan.join('\n\n');
}

// Trợ lý hỏng thì vẫn phải giữ đúng vai: không kết luận, đẩy về phía Kiểm chứng
const CAU_TRO_LY_DU_PHONG = [
  'Mình không kết luận thay bạn được. Bạn thử soi xem người gửi có đúng kênh chính thức không, và họ có đang tạo áp lực thời gian nào không.',
  'Câu hỏi tốt. Trước khi trả lời, bạn thử liệt kê xem yêu cầu này đòi bạn làm gì, và việc đó có gấp tới mức không kịp hỏi ai không.',
  'Quyết định vẫn phải là của bạn. Bạn thử bấm Kiểm chứng để lấy thêm dữ kiện từ một kênh độc lập rồi cân nhắc lại nhé.'
];

export function dungPromptTroLy(caseData = {}, lichSuChatNPC = []) {
  return `${PROMPT_TRO_LY}

[NGƯỜI CHƠI ĐANG NHÌN THẤY — toàn bộ thông tin bạn có]

${locTheoTamNhinNguoiChoi(caseData, lichSuChatNPC)}`;
}

// Xoay theo số câu đã hỏi, để hỏi hai lần liền không nhận lại y hệt một câu
function cauTroLyDuPhong(lichSuTroLy = []) {
  const daHoi = lichSuTroLy.filter((m) => m.role === 'user').length;
  return CAU_TRO_LY_DU_PHONG[Math.min(daHoi, CAU_TRO_LY_DU_PHONG.length - 1)];
}

/**
 * Một lượt hỏi trợ lý an toàn.
 *
 * @param {object} caseData        tình huống đang chơi
 * @param {string} cauHoi          câu hỏi người chơi vừa gõ
 * @param {Array}  lichSuTroLy     hội thoại với trợ lý trong case này
 * @param {Array}  lichSuChatNPC   hội thoại với NPC, người chơi cũng đang nhìn thấy
 * @returns {{ reply: string, nguon: 'ai'|'du_phong' }}
 */
export async function hoiTroLyAnToan(caseData, cauHoi, lichSuTroLy = [], lichSuChatNPC = []) {
  const groq = layClient();
  if (!groq) {
    return { reply: cauTroLyDuPhong(lichSuTroLy), nguon: 'du_phong' };
  }

  const systemPrompt = dungPromptTroLy(caseData, lichSuChatNPC);

  try {
    const completion = await goiChatTatSuyNghi(groq, {
      model: MODEL_TRO_LY,
      messages: [
        { role: 'system', content: systemPrompt },
        ...lichSuTroLy,
        { role: 'user', content: cauHoi }
      ],
      temperature: 0.4,
      // Trần cứng, để câu trả lời không có chỗ mà dài dòng ra
      max_completion_tokens: 120
    });

    const reply = boCauSuyNghi(completion.choices[0]?.message?.content);
    if (!reply) return { reply: cauTroLyDuPhong(lichSuTroLy), nguon: 'du_phong' };
    return { reply, nguon: 'ai' };
  } catch (error) {
    if (laQuaHan(error)) console.warn(`[groqService] Trợ lý quá ${HAN_CHO_MS}ms, dùng câu gợi ý viết sẵn`);
    else console.error('[groqService] Lỗi hoiTroLyAnToan:', error.message);
    return { reply: cauTroLyDuPhong(lichSuTroLy), nguon: 'du_phong' };
  }
}
