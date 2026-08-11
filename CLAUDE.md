# Game giáo dục nhận diện lừa đảo — UNESCO Youth Hackathon 2026

Web game dạy người Việt nhận ra tin nhắn, thư và cuộc gọi lừa đảo. Người chơi
đi qua một lượt gồm nhiều tình huống, mỗi tình huống phải đọc nội dung, đánh
dấu chỗ đáng ngờ, hỏi trợ lý, kiểm chứng, rồi chốt làm theo hay không làm.

Toàn bộ mã, chú thích và giao tiếp trong dự án viết bằng **tiếng Việt**.

## Tài liệu gốc

Hai file trong `docs/` là nguồn sự thật. Khi mã và tài liệu lệch nhau thì tài
liệu đúng, trừ khi người dùng nói ngược lại.

- `Design_Spec_Game_UNESCO_2026.md` — giao diện, bố cục, màu, luồng màn hình
- `HUONG_DAN_VIET_TINH_HUONG.md` — cách viết tình huống và mọi trường dữ liệu

## Chạy

```
npm start              # máy chủ tại http://localhost:3000
npm test               # 3 test offline + test trợ lý (test cuối gọi API thật)
npm run test:offline   # chỉ 3 test không tốn token
```

`.env` cần `GROQ_API_KEY`. Thiếu khoá thì game vẫn chạy, NPC dùng câu dự phòng
viết sẵn trong database.

## Cấu trúc

```
server/casePicker.js   rút tình huống cho một lượt, ép hạn ngạch case an toàn
server/gameState.js    máy trạng thái: chỉ số, điểm, kết cục, màn ôn tập
server/groqService.js  ba chỗ gọi AI: NPC, chấm lý do, trợ lý an toàn
server/server.js       API Express
public/app.js          toàn bộ giao diện, không dùng framework
data/database.json     mọi tình huống
```

## Quy tắc bất khả xâm phạm

Đây là những thứ đã có lý do rõ ràng đằng sau. Đừng sửa nếu chưa đọc lý do.

**1. Trợ lý an toàn không bao giờ được biết đáp án.**
`locTheoTamNhinNguoiChoi()` trong `groqService.js` dựng theo **danh sách trắng**,
chỉ lấy đúng những trường người chơi cũng đang nhìn thấy. Không lọc bằng cách
loại bỏ trường xấu — thêm trường mới vào database là rò rỉ ngay mà không ai
nhận ra. Đây là ràng buộc kỹ thuật, không phải lời dặn trong prompt, vì lời dặn
kiểu "đừng nói đáp án" sẽ rò khi người chơi hỏi vòng vo. Design Spec mục 6.

**2. Không bao giờ bắt người chơi chơi lại từ đầu.**
Mọi nhánh kết cục, kể cả thua sớm, đều phải vào được màn ôn tập gồm đúng những
tình huống đã sai. Màn ôn tập miễn nhiễm với luật thua sớm — người chơi vào đó
chính vì sức khoẻ đã dưới ngưỡng. Design Spec mục 10.

Ôn tập là trạm hồi phục giữa đường, không phải cửa ra. Thua sớm giữa chừng bỏ
lại một mớ tình huống chưa ai chơi; ôn xong phải chơi nốt mớ đó rồi mới tính
kết cục, và tính trên đủ cả lượt. Chốt kết cục ngay sau ôn tập là khoá người
chơi ở dưới ngưỡng thắng vĩnh viễn: thua ở case 3 của 7 thì đúng nhiều nhất
được 3/7, không đời nào với tới 75%. Rời ôn tập cũng phải được kéo sức khoẻ
lên trên ngưỡng thua, nếu không thì nước đổi chỉ số kế tiếp — kể cả một phần
thưởng cộng điểm — vẫn nằm dưới ngưỡng và họ thua lại tức khắc.
`casesLuotChinh` là chỗ duy nhất nhớ đủ một lượt gồm những gì, vì `run.cases`
bị ôn tập và chơi tiếp thay liên tục.

**3. Không bao giờ tô đậm "Làm theo" hơn "Không làm".**
Nút nổi bật nhất là nút hệ thống gợi ý bấm, và hệ thống không được gợi ý người
chơi làm theo kẻ lừa đảo. Hai nút trong overlay xác nhận cũng phải cân nhau về
sức nặng thị giác. Design Spec mục 8.

**4. NPC được nói dối, trợ lý thì không.**
NPC là kẻ địch trong tình huống. Trợ lý là người hướng dẫn đứng ngoài. Hai hội
thoại lưu ở hai mảng tách hẳn trong `server.js`, không bao giờ gộp.

**5. Kẻ gian không được mời kiểm chứng.**
Case `scam` không được cầm `npc.hotline` — đó là số thật của tổ chức bị mạo
danh. Chỉ case `safe` mới được, vì khi ấy nó là số của chính mình.

**6. Hỏi trợ lý không cộng điểm, chỉ kiểm chứng mới được thưởng.**
Thông điệp: biết là chưa đủ, phải làm. Design Spec mục 6.

**7. Mỗi chủ đề cần ít nhất một biến thể `safe`.**
Nếu mọi tình huống đều là lừa đảo, người chơi học được đúng một điều: cứ từ
chối hết là thắng. Hướng dẫn viết tình huống mục 2.

**8. Mọi con số, tên, đường liên kết phải nằm sẵn trong database.**
AI mà tự bịa thì nó đổi số giữa các lượt, người chơi hỏi lại một câu là lộ.

**9. Ruột khung tình huống chỉ dùng trắng và xám nhạt.**
Cột giữa giả làm app thật. Ruột có màu trang trí là người chơi nhận ra ngay đây
là game và mất hết cảm giác bị lừa. Mọi độ giàu thị giác dồn vào lớp vỏ.

**10. Không dùng tên, logo hay màu thật của tổ chức có thật.**
Đặt tên hư cấu nhưng giữ đúng cấu trúc thật.

## Thói quen làm việc

- Sau mỗi thay đổi lớn thì tự commit, thông điệp ngắn bằng tiếng Việt
- `git add` theo đường dẫn cụ thể, đừng `git add -A` — người dùng hay sửa docs
  song song và dễ bị gộp nhầm vào commit code
- Sửa `gameState.js` hay `casePicker.js` thì chạy `npm run test:offline`
- Sửa prompt thì chạy `node scripts/do-token-prompt.js` xem token có phình không
- Chỉ số chỉ được đổi qua `applyDelta()`, không sửa `stats` trực tiếp ở chỗ khác

## Trạng thái hiện tại

Còn thiếu so với Design Spec: màn menu, màn kiểm tra đầu vào, màn chuyển giai
đoạn, chế độ cỡ chữ lớn, âm thanh, lưu tiến trình localStorage. Dữ liệu mới có
7 chủ đề, spec muốn 9. Ảnh mascot và avatar NPC chưa có, mã đã sẵn chỗ nhận.
