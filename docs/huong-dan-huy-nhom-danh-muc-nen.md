# Hướng dẫn bảo vệ đồ án – Huy (Nhóm danh mục nền)

Tài liệu này giúp trả lời các câu hỏi kiểu “**file này dùng để làm gì, luồng chạy ra sao, API nhận/trả gì, chỗ nào quan trọng**” cho 3 phân hệ:

- **Brand (Thương hiệu)**
- **Unit (Đơn vị tính / UOM + precision)**
- **Supplier (Nhà cung cấp + liên hệ)**
- Kèm **slug tự sinh** (product/brand/category)

---

## Tổng quan kiến trúc (để thầy hỏi “luồng đi như nào?”)

### Backend (Express + Mongoose)

Luồng chung 1 request CRUD:

1. **Route** (`backend/routes/*.js`) nhận HTTP request.
2. **Validator** (`backend/utils/validator.js`) kiểm tra query/body/param.
3. **asyncHandler** bọc async để tránh try/catch lặp (`backend/utils/asyncHandler.js`).
4. **Controller** (`backend/controllers/*.js`) xử lý nghiệp vụ, query DB.
5. **Schema/Model** (`backend/schemas/*.js`) định nghĩa dữ liệu + ràng buộc + pre-hook.
6. Trả JSON về frontend.

Điểm hay bị hỏi:
- **422 Validation failed**: do validator chặn request sai format.
- **409 Conflict**: do Mongo duplicate key (unique) khi tạo/cập nhật trùng `code`, `slug`, `name` (tuỳ schema).
- **DELETE “xóa mềm”**: ở controller không xóa document, mà set `status = "inactive"`.

### Frontend (Next.js + React Query)

Luồng chung khi mở màn hình list:

1. Page gọi `useQuery(...)`
2. `useQuery` gọi hàm API trong `frontend/src/api/*.ts`
3. API gọi axios tới backend (`/brands`, `/units`, `/suppliers`)
4. Response về, page render table + filter/search (hiện tại filter/search chủ yếu **lọc phía client**).

Luồng khi Create/Update/Delete:

1. Bấm nút → mở form (local state).
2. Submit form → `useMutation(...)` gọi API.
3. Thành công → `invalidateQueries(...)` để refetch list.

---

## Phần 1 – Brand (Thương hiệu)

### 1) Backend – files & tác dụng

#### `backend/routes/brands.js`
- **Tác dụng**: khai báo endpoint CRUD cho brand.
- **Endpoints**:
  - `GET /brands`: list (có validator `brandListRules`)
  - `GET /brands/:id`: lấy chi tiết
  - `POST /brands`: tạo
  - `PATCH /brands/:id`: cập nhật
  - `DELETE /brands/:id`: “xóa mềm” (archive)

Điểm quan trọng:
- Route gọi `validate` để trả lỗi 422 nếu sai rule.
- Tất cả handler là async và bọc `asyncHandler`.

#### `backend/controllers/brands.js`
- **Tác dụng**: xử lý logic list/get/create/update/archive.
- **Các hàm chính**:
  - `listBrands(filters)`: build query theo `filters.search` và `filters.status`, rồi `find + countDocuments`.
  - `createBrand(payload)`: `Brand.create(...)` và bắt lỗi trùng unique → trả 409.
  - `updateBrandById(id, payload)`: `findById`, `Object.assign`, `save`, bắt duplicate.
  - `archiveBrandById(id)`: set `status = "inactive"` rồi `save`.

Điểm thầy hay hỏi:
- **Search** chạy bằng `$regex` trên `name` hoặc `code`.
- **Pagination**: controller có tính `page/limit/skip`, trả kèm `pagination`.
- **Duplicate key**: Mongo lỗi code `11000`, controller chuyển thành HTTP 409.

#### `backend/schemas/brands.js`
- **Tác dụng**: định nghĩa dữ liệu Brand + auto slug.
- **Fields nổi bật**:
  - `name` (required)
  - `code` (required, unique, uppercase)
  - `slug` (unique) – **tự sinh**
  - `countryOfOrigin` (đúng yêu cầu “quốc gia xuất xứ”)
  - `status` (`active|inactive`)
- **Hook quan trọng**:
  - `pre("validate")`: nếu chưa có `slug` và có `name` → `slug = slugify(name)`

#### `backend/utils/slugify.js`
- **Tác dụng**: chuyển chuỗi tiếng Việt thành slug “đẹp”:
  - normalize bỏ dấu
  - lower-case
  - bỏ ký tự đặc biệt
  - space → dấu `-`
  - gộp nhiều dấu `-`

### 2) Frontend – files & tác dụng

#### `frontend/src/api/brands.ts`
- **Tác dụng**: wrapper axios cho CRUD brand.
- **Các hàm**:
  - `getBrands(params?)` gọi `GET /brands`
  - `createBrand`, `updateBrand`, `deleteBrand`

Điểm hay hỏi:
- `getBrands` có `params?` nhưng page hiện tại gọi `getBrands()` không truyền params → backend pagination/search **chưa được tận dụng** ở UI.

#### `frontend/src/app/(dashboard)/brands/page.tsx`
- **Tác dụng**: UI quản lý brand.
- **Luồng chính**:
  - `useQuery(['brands'], () => getBrands())` fetch danh sách.
  - Search box lọc `brands` **ở frontend** bằng `Array.filter` theo `name/code`.
  - Create/Update dùng `useMutation`, xong `invalidateQueries(['brands'])`.
  - Delete dùng confirm, gọi `deleteBrand(id)`; backend thực chất archive → `status` chuyển inactive.

Điểm thầy hay hỏi (UI):
- Vì sao UI search nhanh? → do lọc mảng tại client, nhưng dữ liệu lớn sẽ không tối ưu.
- Vì sao xóa mà vẫn còn? → do backend không xóa document, chỉ đổi status.

---

## Phần 2 – Unit (Đơn vị tính / UOM + precision)

### 1) Backend

#### `backend/routes/units.js`
- **Tác dụng**: CRUD units tương tự brands.
- Endpoints: `GET /units`, `GET /units/:id`, `POST /units`, `PATCH /units/:id`, `DELETE /units/:id`

#### `backend/controllers/units.js`
- **Tác dụng**: list/get/create/update/archive.
- **Search**: `$regex` theo `name`/`code`, filter theo `status`, có pagination.
- **Archive**: set `status = "inactive"`.

#### `backend/schemas/units.js`
- **Fields quan trọng**:
  - `name` (required, unique)
  - `code` (required, unique, uppercase)
  - `symbol` (tuỳ chọn)
  - `precision` (**min 0, max 6**) – phục vụ số lẻ (kg 3 chữ số, lít 2 chữ số…)
  - `status` (`active|inactive`)

Điểm thầy hay hỏi:
- precision để làm gì? → chuẩn hoá làm tròn/hiển thị/nhập số lượng theo đơn vị.

### 2) Frontend

#### `frontend/src/api/units.ts`
- CRUD gọi backend `/units`.

#### `frontend/src/app/(dashboard)/units/page.tsx`
- `useQuery(['units'], () => getUnits())`
- Search lọc client theo `name/code`.
- `useMutation` create/update/delete, rồi `invalidateQueries(['units'])`.

Lưu ý thực tế:
- Form UI có `description` nhưng schema backend `Unit` hiện **không có field `description`** → nếu submit có `description`, Mongoose default strict sẽ bỏ qua (hoặc nếu strict khác thì có thể lỗi). Khi bảo vệ, nên nói rõ: “UI đang gửi description để mở rộng, backend hiện chưa lưu field đó”.

---

## Phần 3 – Supplier (Nhà cung cấp + liên hệ)

### 1) Backend

#### `backend/routes/suppliers.js`
- CRUD supplier như 2 module trên.

#### `backend/controllers/suppliers.js`
- **Tác dụng**: list/get/create/update/archive supplier.
- Search: `$regex` theo `name/code`, filter `status`, pagination.
- Duplicate key 11000 → 409.
- Archive: set `status = "inactive"`.

#### `backend/schemas/suppliers.js`
- **Fields quan trọng**:
  - `name`, `code` (unique uppercase)
  - `contactName`, `phone`, `email`, `taxCode`
  - `status`

Điểm thầy hay hỏi:
- Vì sao email lowercase? → schema set `lowercase: true` để chuẩn hoá.
- Vì sao `code` uppercase? → tránh trùng do khác hoa/thường.

### 2) Frontend

#### `frontend/src/api/suppliers.ts`
- CRUD gọi `/suppliers`.

#### `frontend/src/app/(dashboard)/suppliers/page.tsx`
- `useQuery(['suppliers'], () => getSuppliers())`
- Search lọc client theo `name/code/contactName`.
- Create/Update/Delete dùng mutations + invalidate.
- UI hiển thị phone/email/taxCode (MST) theo đúng yêu cầu đề bài.

---

## Phần 4 – Slug tự sinh (đề mục #1 của Huy)

### Backend đang làm ở đâu?

- `backend/utils/slugify.js`: hàm chuyển chuỗi → slug.
- **Brand**: `backend/schemas/brands.js` có `pre("validate")` tạo slug nếu chưa có.
- **Category**: `backend/schemas/categories.js` có `pre("validate")` tạo slug nếu chưa có.
- **Product**: `backend/schemas/products.js` có `pre("validate")` tạo slug khi `name` đổi hoặc slug chưa có.

### Thầy có thể hỏi “tại sao product slug required nhưng brand/category slug không required?”

- `Product.slug` đang `required: true`, nên lúc tạo Product, hook đảm bảo luôn có slug.
- Brand/Category slug không required, nhưng hook vẫn sinh slug khi thiếu → thực tế vẫn có, nhưng schema “mềm” hơn.

### Thầy có thể hỏi “slug có thể bị trùng không?”

- `slug` là `unique: true` (brand/category/product). Nếu 2 tên tạo ra cùng slug → Mongo duplicate key → 409.
- Cách xử lý nâng cao (nếu thầy hỏi hướng cải tiến): thêm hậu tố `-1`, `-2` khi trùng, hoặc dùng slug theo `code`.

---

## Checklist câu hỏi hay gặp (trả lời nhanh)

- **Q: Bấm xóa sao không mất hẳn?**  
  **A**: `DELETE` trên controller đang archive: set `status = inactive`, không `deleteOne()`.

- **Q: Search nằm ở đâu?**  
  **A**: Backend có hỗ trợ `search` qua query + `$regex`, nhưng UI hiện tại search chủ yếu filter client.

- **Q: Khi tạo bị báo “code already exists” từ đâu ra?**  
  **A**: Mongo unique index → lỗi `11000` → controller bắt và convert ra HTTP 409 với message theo field trùng.

- **Q: Slug được tạo khi nào?**  
  **A**: Trong Mongoose hook `pre("validate")` của schema (brand/category/product) trước khi save.

---

## Danh sách file cần thuộc (FE + BE)

### Backend
- `backend/routes/brands.js`, `backend/controllers/brands.js`, `backend/schemas/brands.js`
- `backend/routes/units.js`, `backend/controllers/units.js`, `backend/schemas/units.js`
- `backend/routes/suppliers.js`, `backend/controllers/suppliers.js`, `backend/schemas/suppliers.js`
- `backend/utils/validator.js` (brand/unit/supplier rules)
- `backend/utils/slugify.js`
- `backend/schemas/products.js`, `backend/schemas/categories.js` (phần slug liên quan)

### Frontend
- `frontend/src/api/brands.ts`, `frontend/src/app/(dashboard)/brands/page.tsx`
- `frontend/src/api/units.ts`, `frontend/src/app/(dashboard)/units/page.tsx`
- `frontend/src/api/suppliers.ts`, `frontend/src/app/(dashboard)/suppliers/page.tsx`

