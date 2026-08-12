// casePicker.js — Rút tình huống cho một lượt chơi
//
// Quy tắc:
//   - Mỗi chủ đề rút ngẫu nhiên 1 biến thể
//   - Cả LƯỢT CHƠI bắt buộc có ít nhất minSafe tình huống loại "safe"
//   - Chạy được kể cả khi chủ đề chỉ có 1 biến thể
//   - Truyền seed để ra kết quả cố định (dùng khi demo)
//
// Vì sao hạn ngạch tính theo lượt chứ không theo giai đoạn: mỗi giai đoạn hiện
// chỉ có đúng một chủ đề chứa biến thể safe. Ép "mỗi giai đoạn ít nhất 1 safe"
// làm chủ đề đó luôn ra bản safe, nên các bản scam cùng chủ đề không bao giờ
// được rút. Ép ở cấp lượt thì mọi chủ đề vẫn được rút tự do trước, chỉ đổi
// đúng số bản còn thiếu.

// ─────────────────────────────────────────────
// Bộ sinh số ngẫu nhiên có seed
// ─────────────────────────────────────────────
function makeRng(seed) {
  if (seed === undefined || seed === null) {
    return Math.random;
  }
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickOne(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle(arr, rng) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─────────────────────────────────────────────
// Rút tự do: mỗi chủ đề 1 biến thể, chưa ép gì cả
// ─────────────────────────────────────────────
function drawStage(stage, rng, warnings) {
  const topics = (stage.topics || []).filter(t => t.variants && t.variants.length > 0);

  if (topics.length === 0) {
    warnings.push(`Giai đoạn "${stage.name}" chưa có chủ đề nào có biến thể`);
    return [];
  }

  return topics.map(topic => ({
    stage,
    topic,
    variant: pickOne(topic.variants, rng),
  }));
}

// ─────────────────────────────────────────────
// Ép hạn ngạch an toàn ở cấp lượt chơi
//
// Chỉ đổi đúng số bản còn thiếu, ưu tiên rải ở các giai đoạn khác nhau để
// người chơi không gặp cả cụm an toàn dồn vào một giai đoạn.
// Sửa tại chỗ danh sách truyền vào, trả về số tình huống an toàn cuối cùng.
// ─────────────────────────────────────────────
function enforceSafeQuota(picked, rng, minSafe) {
  let safeCount = picked.filter(p => p.variant.type === "safe").length;
  if (safeCount >= minSafe) return safeCount;

  // Chủ đề đang rút trúng scam nhưng có sẵn biến thể safe để đổi sang
  const swappable = shuffle(
    picked.filter(
      p => p.variant.type !== "safe" && p.topic.variants.some(v => v.type === "safe")
    ),
    rng
  );

  // Số safe sẵn có của từng giai đoạn, để giai đoạn nào chưa có thì đổi trước
  const safePerStage = new Map();
  for (const p of picked) {
    const truoc = safePerStage.get(p.stage.id) || 0;
    safePerStage.set(p.stage.id, p.variant.type === "safe" ? truoc + 1 : truoc);
  }

  const theoGiaiDoan = new Map();
  for (const cand of swappable) {
    if (!theoGiaiDoan.has(cand.stage.id)) theoGiaiDoan.set(cand.stage.id, []);
    theoGiaiDoan.get(cand.stage.id).push(cand);
  }

  // sort ổn định nên thứ tự ngẫu nhiên trong cùng một mức vẫn giữ nguyên
  const hangDoi = [...theoGiaiDoan.keys()]
    .sort((a, b) => (safePerStage.get(a) || 0) - (safePerStage.get(b) || 0))
    .map(id => theoGiaiDoan.get(id));

  // Lấy xoay vòng: mỗi vòng chỉ đổi tối đa 1 chủ đề trong mỗi giai đoạn
  for (let vong = 0; safeCount < minSafe; vong++) {
    let doiDuoc = false;
    for (const hang of hangDoi) {
      if (safeCount >= minSafe) break;
      if (vong >= hang.length) continue;
      const cand = hang[vong];
      cand.variant = pickOne(cand.topic.variants.filter(v => v.type === "safe"), rng);
      safeCount++;
      doiDuoc = true;
    }
    if (!doiDuoc) break; // đã dùng hết chủ đề đổi được
  }

  return safeCount;
}

// ─────────────────────────────────────────────
// API chính
// ─────────────────────────────────────────────
/**
 * Rút danh sách tình huống cho một lượt chơi.
 *
 * @param {object} db            Nội dung database.json
 * @param {object} [options]
 * @param {string} [options.seed]     Truyền vào để kết quả cố định (dùng khi demo)
 * @param {number} [options.minSafe]  Số tình huống an toàn tối thiểu cả lượt, mặc định 2
 * @returns {{ cases: Array, warnings: string[], seed: string|null }}
 */
export function pickRun(db, options = {}) {
  const { seed = null, minSafe = 2 } = options;
  const rng = makeRng(seed);
  const warnings = [];

  const stages = [...(db.stages || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  // Rút tự do toàn bộ chủ đề trước, ép hạn ngạch sau
  const picked = [];
  for (const stage of stages) {
    picked.push(...drawStage(stage, rng, warnings));
  }

  const safeTotal = enforceSafeQuota(picked, rng, minSafe);

  if (safeTotal < minSafe) {
    warnings.push(
      `Cả lượt chơi chỉ có ${safeTotal}/${minSafe} tình huống an toàn. ` +
      `Cần bổ sung biến thể loại "safe" vào các chủ đề.`
    );
  }

  const cases = picked.map(p => ({
    stageId: p.stage.id,
    stageName: p.stage.name,
    stageIcon: p.stage.icon,
    topicId: p.topic.id,
    topicName: p.topic.name,
    ...p.variant,
  }));

  if (cases.length > 0 && safeTotal / cases.length < 0.25) {
    warnings.push(
      `Tỷ lệ tình huống an toàn chỉ ${safeTotal}/${cases.length}. ` +
      `Nên đạt tối thiểu 1/4 để tránh dạy người chơi từ chối mọi thứ.`
    );
  }

  if (warnings.length) {
    warnings.forEach(w => console.warn("[casePicker]", w));
  }

  return { cases, warnings, seed };
}

/**
 * Rút lượt chơi cố định cho buổi demo.
 * Luôn ra đúng cùng một bộ tình huống đã được duyệt.
 */
export function pickDemoRun(db) {
  return pickRun(db, { seed: "demo-unesco-2026", minSafe: 2 });
}

// ─────────────────────────────────────────────
// Tra tình huống theo id
// ─────────────────────────────────────────────
// Biến thể trong database chỉ mang id của chính nó, còn tên giai đoạn và tên
// chủ đề nằm ở hai cấp trên. Bảng tra này gắn lại đúng những trường mà pickRun
// gắn, để một tình huống lấy theo id không khác gì tình huống được rút bình
// thường — thiếu chúng thì chip giai đoạn và màn hành trình mất chỗ dựa.
function chiMucBienThe(db) {
  const bang = new Map();
  for (const stage of db.stages || []) {
    for (const topic of stage.topics || []) {
      for (const variant of topic.variants || []) {
        if (!variant.id || bang.has(variant.id)) continue;
        bang.set(variant.id, {
          stageId: stage.id,
          stageName: stage.name,
          stageIcon: stage.icon,
          topicId: topic.id,
          topicName: topic.name,
          ...variant,
        });
      }
    }
  }
  return bang;
}

/**
 * Lấy đúng danh sách tình huống theo id, giữ nguyên thứ tự được yêu cầu.
 *
 * Dùng cho hai việc: chế độ demo (danh sách cố định qua tham số URL, để quay
 * video ra đúng cùng một lượt mỗi lần) và khôi phục tiến trình đã lưu ở máy
 * người chơi. Cả hai đều cần đúng thứ tự đó chứ không phải một lượt rút mới,
 * nên ở đây KHÔNG ép hạn ngạch safe — người gọi đã biết mình muốn gì.
 *
 * @returns {{ cases: Array, warnings: string[], seed: null, thieu: string[] }}
 */
export function pickCaseIds(db, ids = []) {
  const bang = chiMucBienThe(db);
  const cases = [];
  const thieu = [];
  const warnings = [];

  for (const id of ids) {
    const tinhHuong = bang.get(id);
    if (!tinhHuong) {
      thieu.push(id);
      continue;
    }
    cases.push(tinhHuong);
  }

  if (thieu.length) {
    warnings.push(
      `Không tìm thấy tình huống: ${thieu.join(", ")}. ` +
      `Kiểm tra lại id trong database.json.`
    );
    warnings.forEach(w => console.warn("[casePicker]", w));
  }

  return { cases, warnings, seed: null, thieu };
}

/**
 * Thống kê nội dung hiện có. Dùng để kiểm tra tiến độ bên kịch bản.
 */
export function inspect(db) {
  const report = [];
  for (const stage of db.stages || []) {
    const topics = stage.topics || [];
    const rows = topics.map(t => {
      const vs = t.variants || [];
      return {
        topic: t.name,
        total: vs.length,
        scam: vs.filter(v => v.type === "scam").length,
        safe: vs.filter(v => v.type === "safe").length,
        difficulties: [...new Set(vs.map(v => v.difficulty))],
      };
    });
    report.push({
      stage: stage.name,
      topicCount: topics.length,
      topics: rows,
      missingSafe: rows.filter(r => r.safe === 0).map(r => r.topic),
      mixedDifficulty: rows.filter(r => r.difficulties.length > 1).map(r => r.topic),
    });
  }
  return report;
}