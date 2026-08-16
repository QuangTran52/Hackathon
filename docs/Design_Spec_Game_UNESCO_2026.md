# Hệ thống thiết kế — Game giáo dục nhận diện lừa đảo

**Dự án:** UNESCO Youth Hackathon 2026
**Dùng cho:** Thư Lê (thiết kế) · Minh Phú (giao diện) · Ngọc Quang (tích hợp)
**Hướng phong cách:** Tương phản hai lớp
**Phiên bản:** 2.0 — đã bổ sung media, màn menu và màn hành trình

---

## 1. Nguyên tắc nền

Giao diện chia làm hai lớp có cảm giác khác nhau rõ rệt:

| | Lớp chat (thế giới thật) | Lớp vỏ (người hướng dẫn) |
|---|---|---|
| Bo góc | 4px | 16px thẻ, 12px nút |
| Nền | Trắng, có viền rõ như cửa sổ ứng dụng | Giấy #F1F3F2, phẳng liền mạch |
| Mật độ | Chữ 15px, dày, nhiều chi tiết vụn | Chữ 17px, thoáng, ít thông tin |

Chỉ khác nhau ba điểm trên. Dùng chung font, chung bảng màu, chung hệ khoảng cách. Thêm khác biệt thứ tư là bắt đầu chắp vá.

**Quy tắc về độ giàu:** lớp chat phải nhạt nhẽo vì nó giả làm app thật. Mọi độ giàu thị giác đầu tư vào lớp vỏ. Nếu thấy giao diện còn đơn giản, bổ sung bằng nội dung thật (mascot, ảnh minh hoạ, giấy tờ giả) chứ không bằng hiệu ứng.

**Cột giữa là lớp chat, hai cột hai bên là lớp vỏ.** Nội dung tình huống được đặt trong một khung mô phỏng đúng phương tiện mà nó đến — điện thoại, hộp thư, hoặc màn hình cuộc gọi. Đây là cách thể hiện nguyên tắc hai lớp trực quan nhất: người chơi hiểu ngay đâu là thế giới thật, đâu là công cụ hỗ trợ.

Vỏ ngoài khung thuộc lớp vỏ, được phép có màu và bo góc lớn. **Ruột bên trong bắt buộc là trắng và xám nhạt**, không dùng màu trang trí — nếu ruột có màu thì người chơi nhận ra ngay đây là game và mất hết cảm giác bị lừa.

---

## 2. Bảng màu

### Nền tảng

| Vai trò | Mã màu | Dùng ở đâu |
|---|---|---|
| Nền vỏ game | `#F1F3F2` | Nền toàn trang, bong bóng tin NPC |
| Bề mặt thẻ | `#FFFFFF` | Khung chat, thẻ nội dung |
| Viền | `#DCDFDD` | Mọi đường viền, độ dày 1px |
| Chữ chính | `#1A1F1D` | Nội dung chính |
| Chữ phụ | `#5B6360` | Nhãn, chú thích, mô tả |
| Chữ mờ | `#A8AEAB` | Trạng thái chưa mở, khoá |
| Mực nhấn | `#0B5C4E` | Nút chính, liên kết, nút Kiểm chứng |
| Mực nhấn nhạt | `#E4EFEB` | Bong bóng tin người chơi, nhãn giai đoạn |

### Chức năng

| Vai trò | Màu chính | Màu nền nhạt |
|---|---|---|
| Dấu hiệu đỏ được đánh dấu | `#FFD166` | dùng trực tiếp làm nền vệt bôi |
| Sai / bị lừa | `#B3261E` | `#FBEAE8` |
| Đúng / an toàn | `#1E7A4C` | `#E6F3EC` |
| Thanh sức khoẻ tinh thần | `#D9694A` | rãnh `#EFE4E0` |
| Thanh lý trí | `#3E6FB0` | rãnh `#E1E8F1` |
| Mascot | `#8B7BC7` | nền bong bóng thoại `#F4F2FA`, chữ `#4B4173` |

**Quy tắc bắt buộc:** màu mascot không được trùng bất kỳ màu chức năng nào. Nếu muốn đổi màu mascot, chỉ được chọn trong họ tím hoặc hồng, tránh mọi sắc vàng, đỏ, cam, lục, lam.

### Ghi chú ngữ nghĩa

Thanh tinh thần dùng màu ấm, thanh lý trí dùng màu lạnh — cảm xúc đối lập với lý tính. Đây là quy ước có nghĩa, không phải chọn ngẫu nhiên, nên đừng hoán đổi.

---

## 3. Kiểu chữ

Ba mặt chữ, phân theo vai trò chứ không phân theo lớp.

| Vai trò | Font | Dùng cho |
|---|---|---|
| Tiêu đề | Bricolage Grotesque, weight 600 | Tên màn, kết quả, con số lớn |
| Nội dung | Be Vietnam Pro, weight 400 / 500 / 600 | Toàn bộ giao diện và hội thoại |
| Kỹ thuật | JetBrains Mono, weight 400 | Mã OTP, số tài khoản, mã giao dịch, tên miền |

Font kỹ thuật không phải trang trí: ngoài đời mã OTP và số tài khoản luôn hiển thị dạng đều nét. Dùng đúng chỗ này làm tình huống thật hơn, và giúp người chơi nhận ra ngay đâu là thông tin nhạy cảm.

**Kiểm tra dấu trước khi chốt.** Gõ thử chuỗi sau ở cả ba font, phóng to 200% soi kỹ dấu ngã, dấu hỏi và các nguyên âm ghép:

> Nguyễn Thị Tuyết Nhung — Hỗ trợ khẩn cấp · Vui lòng xác thực để giữ quyền lợi

Nếu font nào lệch dấu hoặc dấu chạm vào chữ, đổi font đó. Phương án dự phòng đã kiểm chứng tốt với tiếng Việt: Lexend, Nunito Sans, Inter.

### Thang cỡ chữ

| Vai trò | Cỡ | Giãn dòng | Weight |
|---|---|---|---|
| Tiêu đề màn | 28px | 1.3 | 600 |
| Tiêu đề phụ | 20px | 1.4 | 600 |
| Nội dung lớp vỏ | 17px | 1.7 | 400 |
| Nút bấm | 17px | 1.2 | 600 |
| Bong bóng chat | 15px | 1.55 | 400 |
| Nhãn, chú thích | 14px | 1.5 | 400 |

Không dùng cỡ nào dưới 14px. Người chơi mục tiêu có nhóm trên 60 tuổi.

**Chế độ cỡ chữ lớn:** cài đặt cho phép nhân toàn bộ thang chữ lên 1.15 lần. Bố cục phải chịu được mức này mà không vỡ.

---

## 4. Khoảng cách và kích thước

Hệ khoảng cách bội số của 4: **4 · 8 · 12 · 16 · 24 · 32 · 48**

| Thành phần | Kích thước |
|---|---|
| Hai nút ở màn hội thoại | cao 56px, trải ngang toàn chiều rộng |
| Hai nút ở màn quyết định | cao 64px, căn giữa, rộng tối đa 640px |
| Vùng chạm tối thiểu | 48 × 48px |
| Mascot trên màn chơi | rộng 180px, đáy cột trái, PNG nền trong suốt |
| Bong bóng thoại mascot | min-height 60px, tối đa 2 dòng, nằm trên đầu mascot |
| Khung điện thoại | rộng 280–340px, vỏ bo 22px, đệm vỏ 8px |
| Ruột điện thoại | bo 16px, nền trắng |
| Bong bóng chat | bo 4px |
| Thanh chỉ số | cao 6px, bo tròn hết |
| Thanh tiến trình | cao 5px mỗi đoạn, khe 4px |
| Khu vực chat | tối thiểu cao 380px |
| Ảnh bối cảnh | tỷ lệ 16:9, cao khoảng 110px |
| Đệm trong thẻ | 16px lớp chat, 24px lớp vỏ |

Ba cột căn đáy bằng nhau. Hai nút hành động nằm dưới cả ba cột, trải hết chiều ngang.

---

## 5. Chữ ký thị giác — vệt bút dạ quang

Đây là điểm nhấn duy nhất của toàn bộ thiết kế. Mọi thứ khác giữ im lặng để nó nổi bật.

Khi người chơi bôi chọn một đoạn văn bản đáng ngờ, đoạn đó được phủ nền `#FFD166`, đệm 1px trên dưới và 3px hai bên, bo góc 2px. Chữ giữ nguyên màu `#1A1F1D` — không đổi màu chữ, không in đậm, không viền.

**Lúc mới vào màn, tin nhắn hoàn toàn sạch.** Vệt vàng chỉ xuất hiện khi người chơi tự bôi. Nếu bôi sẵn thì game đang chỉ đáp án.

**Vệt bôi không biến mất** sau khi ra quyết định. Nó được mang sang màn bài học làm bằng chứng.

Ở màn bài học có hai trạng thái:
- Dấu hiệu người chơi **đã bôi đúng** → nền `#FFD166`
- Dấu hiệu người chơi **bỏ sót** → nền `#FBEAE8`, viền đứt `#B3261E`

Nếu có thời gian, thêm hiệu ứng vệt bôi lan từ trái sang phải trong 200ms như đang tô bằng bút thật. Đây là điểm duy nhất trong game được phép có hiệu ứng chuyển động trang trí.

---

## 6. Trợ lý an toàn — ràng buộc bắt buộc

Trợ lý là nhân vật thứ hai trong game, hoàn toàn tách biệt với NPC.

| | NPC trong tình huống | Trợ lý an toàn |
|---|---|---|
| Vai trò | Nhân vật trong tình huống | Người hướng dẫn đứng ngoài |
| Có được nói dối không | **Có** — đây là kẻ địch | **Không bao giờ** |
| Vị trí | Cột giữa | Cột phải |

### Ràng buộc kỹ thuật quan trọng nhất

Khi gọi AI cho trợ lý, **chỉ gửi những gì người chơi cũng nhìn thấy**:

| Gửi | Không gửi |
|---|---|
| Nội dung tình huống | `type` (lừa đảo hay an toàn) |
| Câu hỏi của người chơi | `spans` và `kind` |
| | `correct_action`, `lesson`, `verification` |

Trợ lý không thể tiết lộ thứ nó không biết. Đây là **ràng buộc kỹ thuật**, không phải lời dặn trong prompt — vì lời dặn kiểu "đừng nói đáp án" sẽ rò rỉ khi người chơi hỏi vòng vo, ví dụ "nếu là bạn thì bạn có bấm vào link này không".

### Cách trả lời

Trợ lý **hỏi ngược lại thay vì kết luận**. Đây gọi là dạy bằng câu hỏi, hiệu quả giáo dục cao hơn hẳn việc đưa đáp án.

> *Người chơi:* Cái email này có phải lừa đảo không?
>
> *Trợ lý:* Mình không kết luận thay bạn được. Nhưng bạn thử để ý xem địa chỉ người gửi có đúng tên miền của công ty đó không, và họ có đang tạo áp lực thời gian nào không.

### Quan hệ với chức năng Kiểm chứng

Hai cơ chế này dạy hai kỹ năng khác nhau và không thay thế nhau:

| | Trợ lý | Kiểm chứng |
|---|---|---|
| Dạy gì | Cách phân tích | Thói quen xác minh |
| Trả về | Câu hỏi dẫn dắt | Dữ kiện mới |
| Có thật ngoài đời | Không | Có |
| Thưởng điểm | **Không** | +5 Sức khoẻ |

**Trợ lý phải chủ động đẩy người chơi về phía Kiểm chứng.** Khi được hỏi kết luận, ngoài việc hỏi ngược lại, trợ lý gợi ý dùng chức năng Kiểm chứng. Nó là người chỉ đường tới hành động đúng, không phải người thay thế hành động đó.

Chỉ Kiểm chứng mới được thưởng điểm. Thông điệp rõ ràng: biết là chưa đủ, phải làm.

---

## 7. Bố cục màn chơi — ba cột

Màn chơi chia làm ba cột. Cấu trúc này giữ nguyên ở mọi kênh, chỉ cột giữa đổi hình dạng.

| Cột | Tỷ lệ | Nội dung |
|---|---|---|
| Trái | ~22% | Sổ tay: ô bối cảnh, ô bằng chứng đã đánh dấu |
| Giữa | ~48% | Nội dung tình huống, đổi theo `channel` |
| Phải | ~30% | Khung chat trợ lý an toàn |

Phía trên ba cột là hàng chip giai đoạn và hai thanh chỉ số, rồi tới thanh tiến trình. Phía dưới là hai nút hành động trải hết chiều ngang.

### Cột trái — Sổ tay

Ô **Bối cảnh** ở trên: ảnh minh hoạ nếu có, và một hai câu mô tả người chơi đang ở đâu.

Ô **Bằng chứng đã đánh dấu** bên dưới: liệt kê các cụm người chơi đã bấm, mỗi cụm một dòng nền vàng nhạt viền trái vàng. Khi chưa có cụm nào thì hiện dòng gợi ý.

Ô này làm việc đánh dấu có cảm giác *thu thập bằng chứng* thay vì chỉ bôi vàng cho vui. Nó cũng là thứ người chơi mang sang màn quyết định.

### Cột giữa — Nội dung tình huống

Hình dạng đổi theo trường `channel` của tình huống:

| `channel` | Khung hiển thị |
|---|---|
| `chat` | Khung điện thoại, có ô nhập tin nếu `max_chat_turns` lớn hơn 0 |
| `email` | Khung hộp thư, không có ô nhập tin |
| `call` · `video_call` | Màn phủ cuộc gọi, nền tối |

### Cột phải — Trợ lý an toàn

Khung chat riêng, **luôn có ở mọi kênh**. Đây là điểm then chốt: với tình huống email hay thông báo hệ thống, không có ai để đối thoại, nhưng người chơi vẫn có trợ lý để hỏi nên vòng lặp không bị gãy.

Cấu tạo: tiêu đề có avatar mascot nhỏ, tên "Trợ lý an toàn" và dòng đếm lượt hỏi còn lại; vùng hội thoại; ô nhập ghi "Hỏi trợ lý".

Tin trợ lý dùng nền `#F4F2FA` chữ `#4B4173`. Tin người chơi dùng nền `#E4EFEB`.

### Phân biệt hai ô nhập

Với tình huống có cả NPC lẫn trợ lý, màn hình có hai ô nhập. Phải phân biệt rõ bằng chữ:

- Ô cột giữa ghi **"Nhắn cho [tên NPC]"**
- Ô cột phải ghi **"Hỏi trợ lý"**

Hai bộ đếm lượt tách riêng và hiển thị ở hai chỗ khác nhau, vì chúng đo hai thứ khác nhau.

### Trên điện thoại

Ba cột xếp dọc theo thứ tự: bối cảnh, nội dung tình huống, trợ lý. Sổ tay bằng chứng thu gọn thành một nút mở ra.

---

## 8. Thành phần giao diện

### Luồng ba bước khi quyết định

Việc quyết định tách khỏi việc hội thoại, đi qua ba bước riêng. Ngoài đời không ai vừa nhắn tin vừa chuyển khoản — người ta dừng cuộc trò chuyện, suy nghĩ, rồi mới hành động. Tách bước là mô phỏng đúng nhịp đó, và tạo ra một khoảnh khắc dừng lại có ý thức.

**Bước 1 — Màn hội thoại.** Chỉ có hai nút, xếp ngang dưới ba cột:

| Nút | Kiểu | Tỷ lệ chiều ngang |
|---|---|---|
| Kiểm chứng | nút chính, nền `#0B5C4E`, chữ trắng | khoảng 40% |
| Tôi đã sẵn sàng quyết định | nút viền, nền trắng | khoảng 60% |

Kiểm chứng **không được chiếm hết chiều ngang**. Nếu nó là nút duy nhất nổi bật, người chơi sẽ bấm theo quán tính và việc chọn kiểm chứng mất hết ý nghĩa. Nó phải là lựa chọn có ý thức, không phải đường đi mặc định.

Kiểm chứng ở lại màn này và dùng được bất cứ lúc nào, vì nó là **hành động**, không phải quyết định. Người chơi cần xác minh xong rồi quay lại hỏi tiếp — đó là hành vi đúng ngoài đời.

**Bước 2 — Overlay xác nhận.** Hiện khi bấm "Tôi đã sẵn sàng quyết định".

Nội dung: câu hỏi "Bạn đã đủ thông tin để quyết định chưa?", một dòng cảnh báo rằng sau bước này không quay lại hội thoại được, và hai dòng nhắc nhỏ hiện **số lượt nhắn còn lại** cùng **số lượt kiểm chứng chưa dùng**.

Hai nút: "Quay lại hỏi thêm" và "Tôi đã đủ thông tin".

**Hai nút phải cân nhau về sức nặng thị giác.** Đây là điểm then chốt của cả cơ chế. Nếu một nút tô đậm còn nút kia mờ nhạt, overlay này thành hộp thoại thủ tục mà ai cũng bấm qua theo phản xạ — và như vậy nó dạy đúng thói quen mà game đang cố xoá bỏ. Hai lối ra phải thật sự khác nhau và thật sự cân bằng.

**Bước 3 — Màn quyết định.** Hai nút lớn ở giữa màn hình: **Làm theo** và **Không làm**. Không quay lại hội thoại được nữa.

Màn này hiện lại **tin nhắn gốc thu gọn** và **các cụm người chơi đã đánh dấu**, để họ quyết định dựa trên bằng chứng vừa thu thập chứ không phải trí nhớ.

Mọi nút đều có icon dẫn ở trước để nhóm người lớn tuổi phân biệt nhanh.

**Quy tắc bắt buộc:** trong mọi màn, không bao giờ tô đậm "Làm theo" hơn "Không làm". Nút nổi bật nhất là nút hệ thống gợi ý người dùng bấm, và hệ thống không bao giờ được gợi ý người chơi làm theo kẻ lừa đảo.

### Thanh chỉ số

Hai chỉ số nằm ở góc phải thanh trên, mỗi cái gồm icon, rãnh nền, thanh màu và con số. Icon trái tim cho tinh thần, icon bóng đèn cho lý trí. Con số phải đọc được rõ vì đây là chỉ số quyết định thắng thua.

### Hỗ trợ thích ứng

Một ngưỡng duy nhất trên chỉ số lý trí: **dưới 50 thì bật, từ 50 trở lên thì tắt.** Bật hỗ trợ nghĩa là một cụm dấu hiệu đỏ được tô sẵn ngay khi mở tình huống, và người chơi được cộng thêm một lượt kiểm chứng. Lý trí thấp không bao giờ làm tăng độ khó — hỗ trợ chỉ cộng thêm, không bao giờ lấy bớt.

Ngưỡng này được **đánh giá lại từ đầu mỗi khi mở một tình huống mới**, không phải cờ dính từ tình huống trước. Người chơi lên lại 50 là tắt ngay ở tình huống kế tiếp, xuống dưới 50 là bật lại ngay — việc bật tắt qua lại nhiều lần trong một lượt chơi là bình thường, không phải lỗi.

### Thanh tiến trình 9 chặng

Chín đoạn ngang bằng nhau ngay dưới thanh trên. Màu theo trạng thái: `#1E7A4C` đúng, `#B3261E` sai, `#0B5C4E` đang chơi, `#DCDFDD` chưa tới.

Đây là thứ biến màn hình từ biểu mẫu thành game. Không được bỏ.

### Nhãn giai đoạn

Chip bo tròn ở góc trái thanh trên, nền `#E4EFEB`, chữ `#0B5C4E`, có icon riêng cho từng giai đoạn. Đổi icon và đổi chữ khi sang giai đoạn mới để tạo cảm giác sang chương.

### Khung điện thoại

Chiếm cột phải của màn chơi. Cấu tạo hai lớp: vỏ ngoài màu xám hoặc màu của lớp vỏ, bo 22px, đệm 8px; ruột trong nền trắng, bo 16px.

Bên trong ruột từ trên xuống: tiêu đề liên hệ, vùng tin nhắn, dòng đếm lượt nhắn còn lại, ô nhập tin.

Dòng đếm lượt ghi kiểu "Còn 3 lượt nhắn", cỡ nhỏ, màu chữ mờ, căn giữa. Áp lực số lượt là một phần cơ chế nên người chơi phải thấy được.

**Tuyệt đối không tô màu trang trí cho ruột điện thoại.** Chỉ dùng trắng, xám nhạt `#F1F3F2` cho tin NPC, và `#E4EFEB` cho tin người chơi.

### Tiêu đề liên hệ

Hàng trên cùng bên trong khung điện thoại, dùng khi `channel` là `chat`, giống hệt app nhắn tin thật: avatar tròn, tên hoặc số điện thoại, dòng trạng thái nhỏ bên dưới.

Dòng trạng thái vừa tăng độ thật vừa **là dấu hiệu đỏ đánh dấu được**, ví dụ "số chưa có trong danh bạ". Đây là chi tiết vừa làm đẹp vừa dạy học.

### Khung hộp thư

Dùng khi `channel` là `email`. Đọc dữ liệu từ khối `email` của tình huống.

Từ trên xuống:

- **Hàng người gửi**: tên hiển thị in đậm, bên dưới là địa chỉ email đầy đủ dùng font kỹ thuật cỡ nhỏ
- **Hàng người nhận và thời gian**
- **Tiêu đề thư**, cỡ lớn hơn thân thư
- **Thân thư**: nội dung, có các cụm đánh dấu được
- **Thành phần phụ** nếu có: thanh tiến trình dung lượng, mã yêu cầu hỗ trợ dạng font kỹ thuật
- **Nút giả** theo `cta_label`: trông như nút thật nhưng không bấm được. Bấm vào thì hiện nhắc nhở nhẹ rằng đây là mô phỏng
- **Chân thư**: cỡ nhỏ, màu mờ

**Địa chỉ email người gửi phải đánh dấu được** như mọi cụm khác. Với tình huống email, đây thường là dấu hiệu đỏ đắt nhất — người chơi phải học thói quen đọc tên miền chứ không chỉ đọc tên hiển thị.

Khung hộp thư không có ô nhập tin.

### Mascot và bong bóng thoại

Cột trái xếp từ trên xuống: **ô bối cảnh** ở trên cùng, **mascot** ở đáy cột. Thứ tự này khớp với thứ tự đọc tự nhiên — hiểu bối cảnh trước, nghe mascot dặn sau, rồi mới vào chat.

Mascot là ảnh PNG nền trong suốt hoặc SVG, rộng 180px, đặt trực tiếp lên nền, **không có khung tròn hay nền bao quanh**. Như vậy hình dáng được tự do, không bị đường tròn cắt cụt. Nhỏ hơn cỡ này thì nét mặt không đọc được và năm biểu cảm nhìn giống hệt nhau — đó là lý do bỏ cỡ 104px cũ.

Bong bóng thoại **không đứng cạnh mascot được nữa**: cột trái chỉ rộng khoảng 275px, trừ mascot đi thì phần còn lại quá hẹp để đọc. Bong bóng xuống dòng, nằm **trên đầu mascot nhưng lệch hẳn sang phải**, mũi nhọn chỉ xuống phía đầu. Vẫn giữ nguyên ba điều cũ: chếch sang phải, không đè lên thân, không nằm chính giữa trên đầu.

Riêng mascot ở màn bóc tách bài học rộng cả trang nên vẫn giữ cỡ 240px và bong bóng đứng bên phải như cũ.

Ba ràng buộc kỹ thuật để bố cục không nhảy:

- Vùng bong bóng có `min-height` cố định (khoảng 60px), nên câu ngắn hay dài đều chiếm cùng chiều cao
- Giới hạn 2 dòng bằng `-webkit-line-clamp`, và lời mascot viết dưới 20 chữ
- Khi không có lời thoại thì dùng `visibility: hidden`, **không dùng** `display: none` — ẩn hẳn sẽ khiến mascot tụt xuống

**Màu mascot không được trùng bất kỳ màu chức năng nào**, đặc biệt là xanh lá (`#1E7A4C` là màu của kết quả đúng và tình huống an toàn). Chỉ chọn trong họ tím hoặc hồng.

Năm biểu cảm phải vẽ trên **cùng một khung ảnh, cùng vị trí nhân vật**, chỉ đổi mặt và tay. Lệch khung thì lúc đổi biểu cảm nhân vật sẽ nhảy.

---

## 9. Media — ảnh và video

Ba loại media, ba vị trí khác nhau. Không gộp chung một ô.

### Ảnh bối cảnh

Đặt ở cột trái, phía trên phần chữ "Bối cảnh". Tĩnh, minh hoạ hoàn cảnh người chơi đang ở đâu. Không bôi chọn được.

Ưu tiên thấp nhất. Không có nó game vẫn chạy — nếu thiếu thời gian thì thay bằng một icon lớn.

### Ảnh bằng chứng

Đặt **bên trong bong bóng chat**, kèm tên tệp bên dưới như tệp đính kèm thật. Ví dụ: thẻ nhân viên giả, mã QR chuyển khoản, ảnh biên lai, ảnh chụp giấy tờ.

Bắt buộc nằm trong khung chat vì ngoài đời chúng đến qua tin nhắn. Đặt ở ô riêng là mất cảm giác thật.

**Ảnh phải bôi chọn được** như văn bản. Con dấu sai, ảnh chân dung mờ, sai chính tả trên giấy tờ đều là dấu hiệu đỏ.

Tự dựng bằng Figma hoặc Canva, khoảng 15 phút mỗi ảnh.

### Video cuộc gọi

Phủ toàn màn hình, cắt ngang mọi thứ khác. Dùng cho tình huống deepfake giọng người thân.

Nền tối — đây là **ngoại lệ duy nhất** với quy tắc light theme, vì cuộc gọi thật chiếm lấy màn hình và tạo áp lực.

Gồm: tên người gọi, khuôn mặt mờ, dòng "kết nối kém, hình ảnh chập chờn" (bôi chọn được, chính là dấu hiệu đỏ), nút từ chối đỏ và nút nghe xanh, và tách riêng phía dưới là nút **"Gọi lại bằng số đã lưu"** — đây là đáp án đúng, phiên bản của nút Kiểm chứng trong bối cảnh cuộc gọi.

**Không làm video thật.** Chỉ cần ảnh tĩnh khuôn mặt, hiệu ứng nhiễu nhẹ, đoạn ghi âm giọng nói và giao diện cuộc gọi. Rẻ hơn nhiều, hiệu quả tương đương, và đúng thực tế hơn vì deepfake ngoài đời cũng hay đứng hình.

---

## 10. Danh sách màn hình

| # | Màn hình | Ưu tiên | Ghi chú |
|---|---|---|---|
| 1 | Menu chính | Trung bình | Tiếp tục, chơi mới, cỡ chữ, âm thanh |
| 2 | Kiểm tra đầu vào | Thấp | 5 câu trắc nghiệm |
| 3 | Hành trình | Cao | Dòng thời gian 3 giai đoạn, 9 chặng |
| **4** | **Gameplay chính** | **Cao nhất** | Dùng lại 9 lần |
| **5** | **Bóc tách bài học** | **Cao** | Nơi dạy học thật sự |
| 6 | Kiểm chứng | Trung bình | Overlay, 3 kênh xác minh |
| 7 | Cuộc gọi video | Trung bình | Overlay nền tối, chỉ dùng ở chặng 7 |
| 8 | Chuyển giai đoạn | Thấp | Màn ngắt ngắn |
| 9 | Thua sớm | Thấp | Mascot buồn, nút vào ôn tập |
| 10 | Màn kết | Cao | Dùng lại component màn Hành trình, mở hết 9 chặng |

### Màn menu

Bốn thành phần: **Tiếp tục** (nút chính, chỉ hiện khi có lượt chơi dở), **Chơi mới** (hỏi xác nhận vì sẽ xoá tiến trình), **Cỡ chữ vừa / lớn**, **Bật tắt âm thanh**.

Lưu tiến trình bằng localStorage, không cần backend.

Nút chỉnh cỡ chữ là điểm cộng rõ ràng về tính bao trùm khi chấm — không được bỏ.

### Màn thua sớm và màn ôn tập

**Thua sớm không phải là kết thúc.** Khi Sức khoẻ tinh thần xuống 30 hoặc thấp hơn, người chơi vào màn thua sớm, và từ đó **phải vào được màn ôn tập** gồm đúng những tình huống đã sai.

Đây là quy tắc bất khả xâm phạm: **không bao giờ bắt chơi lại từ đầu**, ở bất kỳ nhánh kết cục nào. Người bỏ giữa chừng là người chưa học được gì, và bắt chơi lại toàn bộ chính là thứ khiến người ta bỏ.

Áp dụng cho cả hai nhánh:

| Kết cục | Điều kiện | Lối ra |
|---|---|---|
| Thua sớm | Sức khoẻ ≤ 30 | Màn ôn tập, gồm các tình huống đã sai |
| Chưa đạt | Hết lượt nhưng đúng dưới 75% | Màn ôn tập, gồm các tình huống đã sai |
| Thắng | Đúng từ 75% trở lên | Màn kết |

Vào màn ôn tập thì chỉ số giữ nguyên, không đặt lại. Chỉ chơi lại những tình huống đã sai, dưới biến thể khác nếu chủ đề có sẵn.

### Màn hành trình

Ba thẻ giai đoạn xếp ngang, mỗi thẻ ba chặng. Trạng thái mỗi chặng: đúng (dấu tích xanh), sai (dấu x đỏ), đang chơi (mũi tên, viền thẻ đậm), chưa mở (ổ khoá xám).

**Tên chặng chỉ hiện sau khi mở**, chưa chơi thì ghi "chưa mở" — giữ yếu tố bất ngờ.

Nút chính ở dưới cùng: "Tiếp tục chặng N".

Component này dùng lại nguyên cho màn kết, chỉ mở hết 9 chặng và cho bấm vào xem lại từng tình huống.

Nếu có thời gian, thêm hoạt ảnh khi mở chặng mới: ổ khoá chuyển thành mũi tên, thẻ giai đoạn sáng lên.

---

## 11. Quy tắc nội dung hiển thị

- Viết câu thường, không viết hoa đầu mỗi từ, không viết hoa toàn bộ
- Nút bấm bắt đầu bằng động từ: "Kiểm chứng", "Làm theo", "Chơi tiếp"
- Thông báo sai không mắng người chơi, chỉ nêu việc đã xảy ra và cách xử lý đúng
- Không dùng dấu chấm than trong thông báo hệ thống
- **Không dùng logo, tên hoặc màu thật của bất kỳ ngân hàng, ứng dụng nhắn tin hay cơ quan nhà nước nào.** Đặt tên hư cấu nhưng giữ đúng cấu trúc thật

---

## 12. Yêu cầu bàn giao tài sản thiết kế

### Mascot

Năm biểu cảm, cùng một tư thế, chỉ đổi mặt và tay. Đã bàn giao, nằm trong
`public/assets/mascot/`, mỗi biểu cảm gắn với đúng một lúc trong game:

| Tệp | Hiện khi |
|---|---|
| `mascot-binh-thuong.png` | mặc định, lúc đang đọc tình huống |
| `mascot-canh-giac.png` | người chơi đã đánh dấu chỗ đáng ngờ |
| `mascot-khen-ngoi.png` | quyết định đúng, ở màn bóc tách |
| `mascot-that-vong.png` | quyết định sai, ở màn bóc tách |
| `mascot-bao-dong.png` | thua sớm, hoặc bị lừa mất tiền |

Mặt cảnh giác bật lên khi người chơi đánh dấu **bất kỳ** cụm nào, không phân
biệt dấu hiệu đỏ với cụm mồi. Phân biệt là mách đáp án ngay lúc đang chơi.

Avatar tròn ở tiêu đề khung trợ lý dùng lại `mascot-binh-thuong.png`, cắt tròn
bằng `border-radius`, không có tệp riêng.

**Yêu cầu kỹ thuật:**
- Xuất SVG nếu vẽ vector, hoặc PNG nền trong suốt ở 180px, 360px, 720px
- Tách mắt và miệng thành lớp riêng để lập trình animate được
- Thiết kế và kiểm tra ở 90px trước, phóng to sau
- Silhouette phải nhận ra được khi tô đen hoàn toàn
- Trung tính, đừng quá trẻ con — người chơi trải dài tới trên 60 tuổi

### Avatar NPC

Bốn avatar, dạng tròn 96px, phong cách thống nhất với mascot nhưng trung tính hơn:

1. Cán bộ cơ quan nhà nước
2. Nhân viên ngân hàng
3. Người lạ ẩn danh
4. Người thân trong gia đình

### Ảnh bằng chứng

Sáu ảnh giấy tờ giả cho sáu tình huống lừa đảo. Dựng bằng Figma hoặc Canva, không cần vẽ tay.

### Không cần vẽ

Icon dùng bộ có sẵn (Lucide hoặc Tabler). Khung chat, nút bấm, thẻ, thanh chỉ số, thanh tiến trình do dựng bằng mã.

---

## 13. Biến CSS cho lập trình

```css
:root {
  /* Nền tảng */
  --surface-page:    #F1F3F2;
  --surface-card:    #FFFFFF;
  --border:          #DCDFDD;
  --text-primary:    #1A1F1D;
  --text-secondary:  #5B6360;
  --text-muted:      #A8AEAB;
  --accent:          #0B5C4E;
  --accent-soft:     #E4EFEB;

  /* Chức năng */
  --flag:            #FFD166;
  --danger:          #B3261E;
  --danger-soft:     #FBEAE8;
  --safe:            #1E7A4C;
  --safe-soft:       #E6F3EC;
  --bar-mind:        #D9694A;
  --bar-mind-track:  #EFE4E0;
  --bar-logic:       #3E6FB0;
  --bar-logic-track: #E1E8F1;
  --mascot:          #8B7BC7;
  --mascot-soft:     #F4F2FA;
  --mascot-text:     #4B4173;

  /* Chữ */
  --font-display: "Bricolage Grotesque", sans-serif;
  --font-body:    "Be Vietnam Pro", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;

  /* Bo góc */
  --radius-chat:  4px;
  --radius-btn:   12px;
  --radius-card:  16px;

  /* Khoảng cách */
  --sp-1: 4px;  --sp-2: 8px;  --sp-3: 12px;
  --sp-4: 16px; --sp-6: 24px; --sp-8: 32px; --sp-12: 48px;
}
```

---

## 14. Danh sách kiểm tra trước khi chốt thiết kế

- [ ] Ba font đều hiển thị đúng dấu tiếng Việt ở 200%
- [ ] Không có chữ nào nhỏ hơn 14px
- [ ] Bố cục không vỡ ở chế độ cỡ chữ lớn
- [ ] Mascot đọc được ở 90px và nhận ra được khi tô đen
- [ ] Màu mascot không trùng màu chức năng nào, đặc biệt không dùng xanh lá
- [ ] Nút Kiểm chứng là nút chính ở màn hội thoại, không phải nút Làm theo
- [ ] Hai nút trong overlay xác nhận cân nhau về sức nặng thị giác
- [ ] Overlay xác nhận có hiện số lượt nhắn và lượt kiểm chứng còn lại
- [ ] Màn quyết định hiện lại tin nhắn gốc và cụm đã đánh dấu
- [ ] Bong bóng chat bo 4px, thẻ lớp vỏ bo 16px
- [ ] Ruột khung tình huống chỉ dùng trắng và xám nhạt, không có màu trang trí
- [ ] Cột trợ lý có mặt ở mọi kênh, kể cả email và cuộc gọi
- [ ] Hai ô nhập ghi rõ "Nhắn cho ai" và "Hỏi trợ lý", hai bộ đếm tách riêng
- [ ] Địa chỉ email người gửi đánh dấu được
- [ ] Ô bằng chứng cập nhật ngay khi người chơi đánh dấu
- [ ] Bong bóng thoại nằm trên đầu mascot, lệch sang phải, không đè lên thân
- [ ] Ô bối cảnh nằm trên, mascot nằm dưới đáy cột trái
- [ ] Mascot là PNG nền trong suốt, không có khung tròn bao quanh
- [ ] Bong bóng có min-height cố định, bố cục không nhảy khi đổi câu
- [ ] Màn hội thoại có đúng hai nút: Kiểm chứng và Tôi đã sẵn sàng quyết định
- [ ] Màn quyết định có đúng hai nút: Làm theo và Không làm
- [ ] Thua sớm vẫn vào được màn ôn tập, không bắt chơi lại từ đầu
- [ ] Tin nhắn lúc mới vào màn chưa có vệt bôi nào
- [ ] Ảnh bằng chứng nằm trong bong bóng chat, không ở ô riêng
- [ ] Không có logo hay màu thật của tổ chức có thật
- [ ] Vệt bút dạ quang là điểm nổi bật duy nhất trên màn hình