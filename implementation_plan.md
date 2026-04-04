# Triển khai Chức năng Nhóm Danh Mục Nền (Huy)

Tài liệu này mô tả chi tiết phương án triển khai cho các chức năng thuộc nhóm của Huy theo cấu trúc `kien-truc-cac-tang.md` và bảng phân công `phan-cong-chuc-nang-nhom.md`.

## User Review Required

> [!IMPORTANT]
> - Các schema (`Brand`, `Unit`, `Supplier`, `Category`, `Product`) đã được định nghĩa và có đủ các trường yêu cầu, tuy nhiên logic `slugify` hiện đang bị trùng lặp ở nhiều file.
> - Cần tái cấu trúc hàm `slugify` ra một tiện ích dùng chung (`utils/slugify.js`).
> - Vui lòng xác nhận kế hoạch dưới đây trước khi tôi bắt đầu viết mã.

## Proposed Changes

### 1. Tầng Utilities
Tạo mới file để chứa các hàm tiện ích sử dụng chung.

#### [NEW] [slugify.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/utils/slugify.js)
- Tạo tiện ích `slugify` hỗ trợ chuyển chuỗi có dấu thành slug không dấu chuẩn, loại bỏ các ký tự đặc biệt, thay thế khoảng trắng bằng dấu gạch ngang (`-`).

#### [MODIFY] [validator.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/utils/validator.js)
- Viết thêm các Validation Rules cơ bản (`list`, `create`, `update`) cho `brands`, `units`, và `suppliers`.

---

### 2. Tầng Schemas (Models)
Sử dụng chung tiện ích `slugify` từ `utils/slugify.js` thay vì hàm cục bộ.

#### [MODIFY] [brands.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/schemas/brands.js)
#### [MODIFY] [categories.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/schemas/categories.js)
#### [MODIFY] [products.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/schemas/products.js)
- Xoá block hàm `slugify()` cũ đi và thêm `require('../utils/slugify')` để dùng trực tiếp.

---

### 3. Tầng Controllers
Cung cấp các API xử lý logic CRUD chuẩn bao gồm: `list`, `getById`, `create`, `update`, `archive/delete`.

#### [NEW] [brands.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/controllers/brands.js)
- Logic CRUD dành cho thương hiệu (brand) & quốc gia xuất xứ. Tích hợp quản lý trạng thái (`active/inactive`).

#### [NEW] [units.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/controllers/units.js)
- Logic CRUD quản lý đơn vị tính, có hỗ trợ trường `precision`.

#### [NEW] [suppliers.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/controllers/suppliers.js)
- Logic CRUD cho nhà cung cấp bao gồm các thông tin liên hệ như email, phone, taxCode.

---

### 4. Tầng Routes
Định nghĩa URL endpoints và mapping đến Controllers/Validators.

#### [NEW] [brands.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/routes/brands.js)
#### [NEW] [units.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/routes/units.js)
#### [NEW] [suppliers.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/routes/suppliers.js)
#### [MODIFY] [index.js](file:///c:/Users/admin/Documents/quanlykho/NNPTUD_QuanLyKho/routes/index.js)
- Đưa các route từ `brands`, `units` và `suppliers` vào tiền tố `/api/v1/`.

## Open Questions

- Không có. Nếu kế hoạch này ổn, tôi sẽ tiến hành tạo và chính sửa các tệp tin này, sau đó chạy thử để kiêm tra kết nối tới MongoDB.

## Verification Plan

### Automated Tests
- Đảm bảo ứng dụng chạy lên bằng lệnh `npm start` hoặc `node app.js` (không có module bị crash).
- Xác nhận logs kết nối thành công tới database "connected" in trên màn hình.

### Manual Verification
- Có thể dùng curl / HTTP request đến `/api/v1/brands`, `/api/v1/units`, `/api/v1/suppliers` hoặc gọi API theo CRUD logic của từng luồng từ công cụ bên thứ ba (Postman / REST Client) để verify xem đã trơn tru chưa.
