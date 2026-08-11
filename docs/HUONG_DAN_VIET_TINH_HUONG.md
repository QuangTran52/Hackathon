# Hướng dẫn viết tình huống

Tài liệu này dành cho bên nội dung và bên kịch bản. Mỗi tình huống viết theo mẫu ở cuối file, sau đó sẽ được chuyển vào `database.json`.

---

## 1. Cấu trúc tổng thể

```
Giai đoạn  →  Chủ đề  →  Biến thể
```

- **Giai đoạn**: 3 giai đoạn cuộc đời (học sinh sinh viên, người đi làm, người lớn tuổi)
- **Chủ đề**: một loại thủ đoạn, ví dụ "cập nhật thông tin lương"
- **Biến thể**: các phiên bản khác nhau của cùng chủ đề

Khi chơi, **mỗi chủ đề rút ngẫu nhiên 1 biến thể**. Nghĩa là người chơi lần hai sẽ gặp nội dung khác, nhưng vẫn đi qua đúng những chủ đề đó.

---

## 2. Hai quy tắc bắt buộc

### Quy tắc 1 — Mỗi chủ đề cần ít nhất 1 biến thể loại "an toàn"

Nếu mọi tình huống đều là lừa đảo, người chơi sẽ học được đúng một điều: **cứ từ chối hết là thắng**. Ra đời thật họ sẽ không dám đóng học phí online, không dám nghe điện thoại ngân hàng.

Cách viết nhanh nhất là làm **bản song sinh**: lấy chính tình huống lừa đảo đã viết, giữ nguyên bối cảnh và cảm xúc, chỉ đổi các chi tiết thành hợp lệ.

| Bản lừa đảo | Bản an toàn song sinh |
|---|---|
| Tên miền lạ | Tên miền chính thức của tổ chức |
| Hạn chót gấp gáp | Hạn rộng rãi, nói rõ không cần vội |
| Đe doạ hậu quả | Không đe doạ gì |
| Hỏi mật khẩu, mã xác thực | Không hỏi thông tin nhạy cảm |
| Chặn việc kiểm chứng | Chủ động mời kiểm chứng |
| Tài khoản cá nhân | Tài khoản đứng tên tổ chức |

Cặp song sinh mạnh hơn hẳn về mặt dạy học: người chơi buộc phải học cách **phân biệt** thay vì học cách **nghi ngờ**.

### Quy tắc 2 — Các biến thể trong cùng chủ đề không chênh quá một bậc độ khó

Vì chúng được rút ngẫu nhiên. Nếu biến thể A dễ mà B khó thì hai người chơi có trải nghiệm chênh nhau, và lúc demo có thể rút trúng bản nhạt nhất.

Không bắt buộc bằng nhau tuyệt đối, vì có chủ đề không thoả được. Ví dụ chủ đề "người thân gặp chuyện gấp": bản lừa đảo là deepfake nên phải ở mức Khó, nhưng bản an toàn ở mức Khó thì người chơi gần như chắc chắn từ chối nhầm — mà bị phạt vì cẩn thận là trải nghiệm rất ức chế. Trường hợp này để scam ở Khó và safe ở Trung bình là hợp lý.

---

## 3. Độ khó thể hiện qua đâu

Đừng chỉ ghi nhãn, phải thể hiện bằng nội dung cụ thể:

| | Dễ | Trung bình | Khó |
|---|---|---|---|
| Số dấu hiệu đỏ | 4–5, lộ liễu | 3, vừa phải | 2, tinh vi |
| Số cụm mồi | 0 | 1 | 2–3 |
| Giọng kẻ gian | Vụng, sai chính tả, xưng hô lệch | Chuyên nghiệp, đúng quy trình | Chuyên nghiệp và biết trước thông tin cá nhân |
| Kết quả kiểm chứng | Phủ nhận thẳng, rõ ràng | Rõ nhưng cần đọc kỹ | Mơ hồ, phải suy luận |
| Số lượt chat | 5 | 5 | 3 — ép quyết định nhanh |

Phân bổ theo giai đoạn: học sinh sinh viên chủ yếu **Dễ**, người đi làm **Trung bình đến Khó**, người lớn tuổi **Khó**.

Riêng tình huống **an toàn ở mức Khó thì nên tránh** — người chơi gần như chắc chắn sẽ từ chối nhầm, và bị phạt vì cẩn thận là trải nghiệm rất ức chế.

---

## 4. Giải thích từng trường

### Thông tin chung

| Trường | Nghĩa |
|---|---|
| `type` | `scam` (lừa đảo) hoặc `safe` (an toàn) |
| `difficulty` | `de`, `trung_binh`, `kho` |
| `channel` | `chat` (nhắn tin), `call` (gọi thoại), `video_call` (gọi video, dùng cho deepfake) |
| `title` | Tên tình huống, hiển thị ở màn hành trình sau khi đã chơi |
| `context.text` | 1–2 câu mô tả người chơi đang ở đâu, đang chờ gì |

### Danh tính nhân vật (`npc`)

**Đây là phần quan trọng nhất và hay bị bỏ qua.**

Mọi con số, tên, đường liên kết phải **ghi sẵn ở đây**, không để AI tự bịa. Lý do: AI bịa ra số kiểu `1234567890` hoặc số máy bàn `245` — nhìn là biết giả, và nó còn **đổi số giữa các lượt chat**, người chơi hỏi lại là lộ ngay.

Định dạng phải đúng chuẩn Việt Nam:

| Trường | Ví dụ đúng | Ví dụ sai |
|---|---|---|
| `phone` | `091 244 5780` | `245` |
| `hotline` | `024 3868 5142` | `3948` |
| `account_no` | `19038847251006` | `1234567890` |
| `account_name` | `NGUYEN THI HANG` | (bỏ trống) |
| `amount` | `30.000.000đ` | `30tr` |

`display_name` là tên hiển thị ở đầu khung chat, `status_line` là dòng nhỏ bên dưới. Với tình huống lừa đảo, `status_line` thường chính là một dấu hiệu đỏ, ví dụ "Số chưa có trong danh bạ".

**Không dùng tên ngân hàng, bệnh viện, cơ quan có thật.** Đặt tên hư cấu nhưng giữ đúng cấu trúc thật.

### Tin nhắn mở đầu (`opening_message`)

Tin nhắn đầu tiên của nhân vật, **cố định, không do AI sinh**. Vì các dấu hiệu đỏ nằm trong đây và người chơi phải bấm chọn được chúng.

Từ tin nhắn thứ hai trở đi mới do AI sinh theo `system_prompt_extra`.

### Cụm đánh dấu (`spans`)

Đây là các cụm từ người chơi bấm vào để đánh dấu. Có hai loại:

- **`red_flag`** — dấu hiệu đỏ thật. Bấm đúng thì được cộng điểm.
- **`decoy`** — cụm mồi. Nhìn đáng ngờ nhưng thật ra bình thường. Bấm nhầm **không bị trừ điểm**, chỉ là không được cộng.

**Quan trọng:** `text` phải là **đoạn trích chính xác từng ký tự** trong `opening_message`, vì hệ thống dò theo chuỗi để làm nó bấm được.

**Tình huống an toàn cũng bắt buộc phải có cụm mồi.** Nếu chỉ tình huống lừa đảo mới có chỗ bấm được, người chơi sẽ nhận ra ngay: "có chỗ bấm tức là case này lừa đảo". Toàn bộ thử thách sụp đổ.

`why` là lời giải thích hiện ở màn bài học, viết ngắn gọn một câu.

### Chỉ dẫn cho AI (`system_prompt_extra`)

Phần này ghép vào prompt chung để AI đóng vai. Cần nêu rõ:

- Nhân vật là ai, mục tiêu là gì
- Cách xưng hô (bắt buộc, ví dụ xưng "chị" gọi "em")
- Phản ứng khi người chơi nghi ngờ

Với tình huống **lừa đảo**: khi bị nghi ngờ thì chuyển sang gấp gáp, ép buộc, và **chặn việc kiểm chứng**.

Với tình huống **an toàn**: khi bị nghi ngờ thì **ủng hộ việc kiểm chứng**, mời người chơi gọi lại hoặc hỏi trực tiếp. Đây chính là điểm khác biệt lớn nhất giữa hai loại, và là bài học cốt lõi.

### Câu dự phòng (`fallback_replies`)

Dùng khi gọi AI bị lỗi hoặc hết hạn mức. Viết 3 câu chung chung nhưng đúng vai, để hệ thống chọn ngẫu nhiên.

Đây là thứ cứu cả buổi demo nếu mạng chập chờn, đừng bỏ qua.

### Kiểm chứng (`verification`)

3 lựa chọn xác minh. Mỗi lựa chọn cần:

- `label` — người chơi nhìn thấy gì
- `result` — kết quả nhận được
- `is_independent` — kênh này có độc lập với kẻ gian không

**Luôn để 1 lựa chọn có `is_independent: false`**, thường là "nhắn lại hỏi chính người gửi". Đây là bài học ngầm rất giá trị: hỏi lại chính kênh đang nghi ngờ thì không phải kiểm chứng.

### Bài học

- `correct_action` — ngoài đời nên làm gì, viết cụ thể và làm được ngay
- `lesson` — giải thích thủ đoạn, 2–3 câu
- `support_hint` — id của một `span` sẽ được tô sẵn khi người chơi có Lý trí dưới 50

---

## 5. Mẫu điền

Sao chép phần dưới cho mỗi tình huống mới.

```
GIAI ĐOẠN:
CHỦ ĐỀ:
BIẾN THỂ SỐ:

Loại:              scam / safe
Độ khó:            de / trung_binh / kho
Kênh:              chat / call / video_call
Tên tình huống:

BỐI CẢNH (1-2 câu người chơi đang ở đâu, đang chờ gì):


DANH TÍNH NHÂN VẬT
  Tên:
  Vai trò:
  Tổ chức (hư cấu):
  Tên hiển thị đầu khung chat:
  Dòng trạng thái:
  Số điện thoại:
  Số máy bàn:
  Số tài khoản:
  Tên chủ tài khoản:
  Số tiền:
  Đường liên kết:

TIN NHẮN MỞ ĐẦU (cố định, chứa các cụm đánh dấu):


CỤM ĐÁNH DẤU
  Dấu hiệu đỏ 1:  "trích chính xác từ tin nhắn"
    Vì sao:
  Dấu hiệu đỏ 2:  "..."
    Vì sao:
  Cụm mồi 1:      "..."
    Vì sao thật ra bình thường:

ẢNH ĐÍNH KÈM (nếu có)
  Mô tả ảnh cần vẽ:
  Tên tệp hiển thị:
  Dấu hiệu đỏ trên ảnh:

SỐ LƯỢT CHAT TỐI ĐA:  5 (hoặc 3 nếu độ khó cao)

CHỈ DẪN CHO AI
  Nhân vật là ai, mục tiêu:
  Cách xưng hô:
  Khi người chơi nghi ngờ thì phản ứng thế nào:

CÂU DỰ PHÒNG (3 câu, dùng khi AI lỗi)
  1.
  2.
  3.

KIỂM CHỨNG
  Lựa chọn 1 (độc lập):
    Kết quả:
  Lựa chọn 2 (độc lập):
    Kết quả:
  Lựa chọn 3 (KHÔNG độc lập - hỏi lại chính người gửi):
    Kết quả:

CÁCH XỬ LÝ ĐÚNG:


BÀI HỌC (2-3 câu):


GỢI Ý HỖ TRỢ (chọn 1 dấu hiệu đỏ để tô sẵn cho người chơi yếu):
```

---

## 6. Danh sách kiểm tra trước khi bàn giao

- [ ] Mỗi chủ đề có ít nhất 1 biến thể loại `safe`
- [ ] Các biến thể trong cùng chủ đề không chênh quá một bậc độ khó
- [ ] Mọi `text` trong `spans` trích chính xác từ `opening_message`
- [ ] Tình huống `safe` có ít nhất 1 cụm mồi
- [ ] Số điện thoại, số tài khoản đúng định dạng Việt Nam, không phải dãy đếm
- [ ] Không có tên ngân hàng, bệnh viện, cơ quan có thật
- [ ] Mỗi tình huống có đủ 3 câu dự phòng
- [ ] Mỗi tình huống có 3 lựa chọn kiểm chứng, trong đó 1 lựa chọn không độc lập
- [ ] Tình huống `safe` có chỉ dẫn AI ủng hộ việc kiểm chứng