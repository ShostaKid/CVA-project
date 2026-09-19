# Bộ đo sa bàn

Chụp "vân tay" của sa bàn đang chạy rồi so với mẫu `mau.json`. Dùng để biết **ngay** một lần sửa
có làm hỏng gì không, thay vì đoán bằng mắt. Cảnh dựng hoàn toàn xác định (không có `Math.random`),
nên cùng một mã nguồn luôn ra cùng một vân tay.

## Chạy

1. Bật máy chủ cục bộ (cần vì mở thẳng bằng `file://` thì trình duyệt chặn `fetch` và chặn đọc vào iframe):

   ```
   powershell -ExecutionPolicy Bypass -File tools\serve.ps1
   ```

2. Mở <http://localhost:8000/tools/kiemtra.html>. Trang tự chạy và báo:
   - **✓ Giống hệt mẫu**: không có gì đổi.
   - **✗ Có N chỗ khác mẫu**: liệt kê từng chỗ. Ví dụ `mesh đầu tiên lệch là #1 trên 371` nghĩa là
     mesh thứ 2 theo thứ tự dựng đã đổi. `DULIEU.mau đổi nội dung` nghĩa là bảng màu bị sửa.

Trên GitHub Pages thì mở `https://shostakid.github.io/CVA-project/tools/kiemtra.html`.

## Đo những gì

| Nhóm | Nội dung |
|---|---|
| `dulieu` | băm từng khoá của `DULIEU`, **sau khi** app đã nắn dữ liệu xong |
| `canh` | số mesh, số tam giác, băm cả cảnh 3D |
| `hang` | băm **riêng từng mesh** theo thứ tự dựng, để chỉ ra mesh nào đổi đầu tiên |
| `dom` | số `id`, số mốc thời gian, số nhãn nổi, nội dung nhãn, tiêu đề |
| `css` | số luật CSS và style tính toán của 10 phần tử mẫu |

## Khi nào đổi mẫu

Bộ đo báo "khác" **không có nghĩa là hỏng**: sửa màu, thêm toà nhà, đổi vị trí tượng đều làm vân tay
đổi, và đó là chủ ý. Cách xử lý:

- Lệch **không chủ ý** (vừa chẻ file, dọn code, đổi tên biến): đó là lỗi, sửa cho tới khi "giống hệt".
- Lệch **có chủ ý**: xem danh sách chỗ khác có đúng những gì mình vừa sửa không, nếu đúng thì bấm
  **Lưu mẫu mới (.json)**, chép tệp tải về đè lên `tools/mau.json`, commit cùng lần sửa.

## Giới hạn cần biết

- **Mẫu chụp trên Chromium** (Chrome, Edge). Phần style tính toán (`boxShadow`...) do mỗi trình duyệt
  chuẩn hoá chuỗi một kiểu, nên Firefox/Safari có thể báo lệch ở mục `css` dù không có gì hỏng.
- **Không thay được mắt nhìn.** Bộ đo bắt được "dữ liệu và hình khối có đổi không", không bắt được
  "trông có đẹp không": một mái đổi màu vẫn báo lệch, nhưng màu ấy hợp mắt hay chưa thì phải xem.
- **Không đo vị trí nhãn nổi và hành vi tương tác** (kéo camera, bấm toà nhà, chạy dòng thời gian).
  Những thứ đó vẫn phải thử tay.
- Trang phải mở với `?debug` thì app mới lộ `window.SABAN_DEBUG` (chỉ thêm 4 dòng ở cuối `js/app.js`,
  không ảnh hưởng gì khi mở bình thường).

## Các tệp

| Tệp | Vai trò |
|---|---|
| `kiemtra.html` | trang chạy: nạp sa bàn vào iframe ngoài màn hình, đo, so, hiển thị |
| `kiemtra.js` | hàm chụp vân tay (`layVanTay`) và so sánh (`soVoi`) |
| `mau.json` | mẫu chuẩn (≈6 KB), chụp từ bản `index.html` **trước khi tách file** |
| `serve.ps1` | máy chủ web cục bộ, không cần cài gì thêm |
