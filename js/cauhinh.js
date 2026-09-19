/* Cấu hình hiển thị: bảng màu, phong cách toà nhà, bề rộng đường.
   Viết tay, chỉnh thoải mái. Nạp SAU dulieu.js + tainguyen.js, TRƯỚC app.js. */
DULIEU.mau = {
  /* Bảng màu theo lối bản đồ OSM. Đường phải TƯƠNG PHẢN rõ với nền:
     bản trước thất bại vì đường và nền cùng tông be, chênh lệch chỉ 4/765. */
  nen:        0xD6D0BE,   // đất xung quanh — sẫm hẳn để mọi thứ nổi lên
  nuoc:       0xAAD3DF,   // Hồ Tây
  duong:      0xF3F0E8,   // mặt đường
  vienDuong:  0xA9A294,   // gờ viền đường, sẫm rõ
  nhaQuanh:   0xCFC6BD,   // nhà dân xung quanh
  mainhaQuanh:0xC2B5A9,   // mái nhà dân
  nhaCVA:     0xD9A863,   // khối nhà trường (dựng chi tiết ở bước sau)
  vienTruong: 0x4A5A3A,   // tường bao trường — xanh rêu sẫm
  napTuong:   0x6E8154,   // mặt trên tường bao
  sanBong:    0x7DC49A,   // mặt sân thể thao
  vienSan:    0xFFFFFF,   // vạch kẻ sân
  canhDe:     0xB9B2A0,   // cạnh đế sa bàn
  maiNgoi:    0xA8664A,   // (khong dung nua)
  maiQuanh:   0x9C9086,   // mái nhà ngoài trường — xám trầm cho trường nổi lên
  hatMai:     0x85796F,   // diềm hắt mái nhà ngoài
  cuaSo:      0x5A6470,   // ô cửa sổ
  thanCay:    0x7A6248,   // thân cây
  tanCay:     0x4E9433,   // tán cổ thụ
  tanCau:     0x63AB40,   // tàu cau
  buiCay:     0x7CBE4E,   // bụi thấp
  truCong:    0xEDE6D6,   // trụ cổng — sáng, nổi trên nền tường sẫm
  chopCong:   0xA8664A,   // chóp trụ cổng
  bienCong:   0x8B1E1E,   // biển tên trường
  beMong:     0xB9AE97,   // bệ móng nhà trường
  daiPhao:    0xF5EFE0,   // đai phào ngăn tầng, vôi trắng
  hatMaiCVA:  0x9A5C3E,   // diềm hắt mái, gỗ sẫm
  goHien:     0x3E6B4A,   // cột và thanh chống hành lang, gỗ sơn xanh
  oCuaSau:    0x241F19,   // lòng hốc cửa, sẫm để hiện chiều sâu
  xaGo:       0x2E251C,   // đầu xà gỗ dưới diềm mái
  boMai:      0x8E2412,   // bờ nóc và bờ chảy, sẫm hơn mặt ngói
  beTuong:    0xC9B98E,   // bệ xây chân tường bao
  truTuong:   0xE0BE72,   // trụ tường bao, vôi vàng như tường nhà
  muTuong:    0xB3300F,   // mũ trụ, ngói đỏ
  songSat:    0x2E5F46,   // song sắt, xanh như cửa chớp
  sanHien:    0xD9CDB4    // sàn và mái hiên

/* Bảng màu theo lối kiến trúc Trường Bưởi: tường vôi vàng, cửa chớp
   xanh lá, mái ngói đỏ. Đây là nét nhận ra trường ngay từ xa. */
};
DULIEU.phongCach = {
  'thuoc-dia': { tuong:0xE3B961, cua:0x2F6B4F, vien:0xF5EFE0 },
  'biet-thu':  { tuong:0xEBD3A0, cua:0x2F6B4F, vien:0xFAF3E2 },
  'hien-dai':  { tuong:0xD8D2C6, cua:0x5A6470, vien:0xF2EEE4 }
};

DULIEU.rongVien = { secondary:3.5, secondary_link:3, tertiary:3, residential:2.4,
                    pedestrian:1.6, service:1.4, footway:1, steps:1, path:1 };

