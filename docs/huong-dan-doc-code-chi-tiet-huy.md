# Hướng dẫn đọc code chi tiết (cho Huy – mới học JS)

Mục tiêu: đọc được **từng dòng** trong các file bạn đã làm (brands/units/suppliers + slug), hiểu:

- **Dấu chấm `.` là gì** (vì sao lại “chấm chấm chấm”)
- **Object.entries / Object.fromEntries** là gì
- **Luồng chạy** backend và frontend
- **Câu hỏi thầy hay hỏi khi bảo vệ** + gợi ý trả lời

---

## 0) Kiến thức nền bắt buộc (để đọc được mọi file)

### 0.1. Dấu chấm `.` trong JavaScript nghĩa là gì?

Trong JS, `.` thường có 2 ý nghĩa hay gặp:

- **Truy cập thuộc tính** (property) của object:
  - `req.query` nghĩa là “lấy thuộc tính `query` của object `req`”
  - `brand.status` nghĩa là “lấy thuộc tính `status` của object `brand`”
- **Gọi hàm/method của object**:
  - `array.filter(...)` gọi method `filter` của mảng
  - `String(value).trim()` gọi `trim()` trên string

Vì vậy “một chuỗi dấu chấm” thực chất là **một chuỗi các lần gọi method nối tiếp nhau**.

### 0.2. Method chaining (chuỗi gọi hàm)

Ví dụ trong `slugify`:

```js
String(value || "")
  .normalize("NFD")
  .replace(...)
  .toLowerCase()
  .trim()
```

Giải thích:
- `String(...)` trả về **một string**
- trên string đó gọi `.normalize(...)` → lại trả về string
- lại gọi tiếp `.replace(...)` → lại trả về string
- cứ thế “xếp tầng” để biến đổi dữ liệu theo từng bước

### 0.3. Destructuring và arrow function

Bạn sẽ thấy:

```js
filter(([, value]) => value !== undefined)
```

- `([, value])` là destructuring 1 mảng 2 phần tử `[key, value]`, nhưng **bỏ qua key** bằng dấu `,`
- `=>` là arrow function (hàm ngắn)

### 0.4. Spread operator `...`

Trong frontend hay có:

```ts
setFormData({ ...formData, name: e.target.value })
```

Nghĩa là:
- copy toàn bộ field của `formData` cũ
- rồi **ghi đè** field `name` bằng giá trị mới

---

## 1) Giải thích chi tiết: `Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))`

Đây là 1 “mẫu” rất quan trọng trong `controllers/*.js`.

### 1.1. `Object.entries(payload)` là gì?

- Input: `{ a: 1, b: undefined, c: "x" }`
- Output: mảng các cặp key-value:

```js
[ ["a", 1], ["b", undefined], ["c", "x"] ]
```

### 1.2. `.filter(([, value]) => value !== undefined)` làm gì?

- `filter` giữ lại phần tử thỏa điều kiện.
- `([, value])` lấy phần tử thứ 2 (value) trong cặp `[key, value]`.
- `value !== undefined` nghĩa là bỏ những field có value `undefined`.

Kết quả:

```js
[ ["a", 1], ["c", "x"] ]
```

### 1.3. `Object.fromEntries(...)` là gì?

Nó làm ngược lại `Object.entries`:

- Input: `[ ["a", 1], ["c", "x"] ]`
- Output: `{ a: 1, c: "x" }`

### 1.4. Tại sao phải làm vậy?

Vì khi update/create, bạn thường build payload kiểu:

- field nào người dùng không nhập → `undefined`
- nếu bạn `Object.assign(model, payload)` trực tiếp, nhiều field có thể bị gán `undefined` (không mong muốn)

Nên pattern này giúp:
- **Chỉ gửi những field thật sự có giá trị**
- tránh ghi đè bậy bạ

---

## 2) Backend – Brands (từng file, từng đoạn quan trọng)

### 2.1. `backend/routes/brands.js`

Mẫu chung của 1 route:

```js
router.get("/", brandListRules, validate, asyncHandler(async (req, res) => {
  const result = await brandsController.listBrands(req.query);
  res.json(result);
}));
```

Giải thích từng phần:
- `router.get("/", ...)` tạo endpoint GET `/brands`
- `brandListRules` là mảng rule express-validator kiểm tra query (`page/limit/status/search`)
- `validate` nếu có lỗi rule → trả 422 và **không chạy controller**
- `asyncHandler(...)` bọc try/catch để lỗi async đi vào middleware error
- `(req, res)`:
  - `req.query`: object chứa query string
  - `res.json(...)`: trả response JSON

Các route khác:
- `GET "/:id"`: có `mongoIdParamRule("id")` để bắt id sai
- `POST "/"`: dùng `brandCreateRules`
- `PATCH "/:id"`: dùng `brandUpdateRules`
- `DELETE "/:id"`: không xóa DB thật, gọi archive

### 2.2. `backend/controllers/brands.js`

#### `cleanUndefined(payload)`

```js
Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
```

Đã giải thích ở mục 1. Đây là bước “làm sạch payload”.

#### `listBrands(filters = {})`

Các dòng quan trọng:
- `page/limit/skip`: phân trang
- `const query = {};` tạo query mongo
- `if (filters.search)`:
  - `query.$or = [...]` nghĩa là “tìm theo name hoặc code”
  - `$regex` tìm gần đúng, `$options: "i"` là không phân biệt hoa thường
- `Brand.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)`:
  - `sort` -1 là mới nhất trước
  - `skip/limit` phân trang
- `Brand.countDocuments(query)` để biết tổng
- return object có `success/message/data/pagination`

#### `createBrand(payload)`

`Brand.create(...)` sẽ:
- chạy validation schema
- nếu `code` hoặc `slug` bị trùng unique → Mongo lỗi `11000`
- controller bắt `error.code === 11000` → throw HTTP 409

#### `archiveBrandById(id)`

```js
brand.status = "inactive";
await brand.save();
```

Nghĩa là “xóa mềm”.

### 2.3. `backend/schemas/brands.js`

Các dòng quan trọng:
- `unique: true` tạo unique index (trùng → 11000)
- `uppercase: true` tự chuyển `code` thành chữ hoa
- `brandSchema.pre("validate", ...)`:
  - chạy trước validate/save
  - nếu chưa có slug và có name → set slug

---

## 3) Backend – Units

### 3.1. `backend/routes/units.js`

Giống brands, chỉ thay controller và rules.

### 3.2. `backend/controllers/units.js`

Giống brands (list/search/status/pagination + duplicate 11000 + archive).

### 3.3. `backend/schemas/units.js`

Điểm quan trọng:
- `precision: { min: 0, max: 6 }`
  - giúp giới hạn số chữ số thập phân (ví dụ kg 3 chữ số)
- `name` và `code` đều `unique` → tránh trùng đơn vị

---

## 4) Backend – Suppliers

### 4.1. `backend/routes/suppliers.js`

Giống brands/units.

### 4.2. `backend/controllers/suppliers.js`

Giống brands/units (list/search/status/pagination + duplicate + archive).

### 4.3. `backend/schemas/suppliers.js`

Điểm quan trọng:
- `email: { lowercase: true }` để chuẩn hoá email
- `code` uppercase + unique
- field contact: `contactName/phone/email/taxCode`

---

## 5) Backend – `backend/utils/slugify.js` (giải thích từng dòng)

```js
function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
```

Giải thích:
- `String(value || "")`:
  - nếu `value` rỗng/null/undefined → dùng `""`
  - ép về string để đảm bảo các method string dùng được
- `.normalize("NFD")`:
  - tách chữ có dấu thành “chữ + dấu” (VD `á` → `a` + dấu)
- `.replace(/[\u0300-\u036f]/g, "")`:
  - xóa toàn bộ ký tự “dấu” Unicode → bỏ dấu tiếng Việt
- `.toLowerCase()`:
  - chuyển về chữ thường
- `.trim()`:
  - xóa khoảng trắng đầu/cuối
- `.replace(/[^a-z0-9\s-]/g, "")`:
  - xóa ký tự đặc biệt (giữ chữ, số, space, dấu `-`)
- `.replace(/\s+/g, "-")`:
  - 1 hoặc nhiều khoảng trắng → `-`
- `.replace(/-+/g, "-")`:
  - nhiều dấu `-` liên tiếp → gộp thành 1 dấu `-`

---

## 6) Frontend – API wrappers (brands/units/suppliers)

Các file:
- `frontend/src/api/brands.ts`
- `frontend/src/api/units.ts`
- `frontend/src/api/suppliers.ts`

Mẫu chung:

```ts
const response = await axios.get('/brands', { params });
return response.data;
```

Giải thích:
- `axios.get(url, { params })`:
  - axios tự biến `params` thành query string `?a=1&b=2`
- `response.data`:
  - là JSON backend trả về

Điểm hay bị hỏi:
- **Vì sao return `response.data` chứ không return `response`?**  
  Vì UI chỉ cần payload JSON, không cần header/status…

---

## 7) Frontend – Pages (brands/units/suppliers)

Ba file:
- `frontend/src/app/(dashboard)/brands/page.tsx`
- `frontend/src/app/(dashboard)/units/page.tsx`
- `frontend/src/app/(dashboard)/suppliers/page.tsx`

### 7.1. `useQuery` là gì?

Ví dụ:

```ts
useQuery({ queryKey: ['brands'], queryFn: () => getBrands() })
```

- `queryKey`: “tên cache”
- `queryFn`: hàm fetch
- React Query tự quản lý loading/caching/refetch

### 7.2. Search trong UI đang chạy ở đâu?

Ví dụ brands:

```ts
const filteredBrands = brands.filter(b =>
  b.name.toLowerCase().includes(search.toLowerCase()) ||
  b.code.toLowerCase().includes(search.toLowerCase())
);
```

Giải thích từng phần:
- `brands.filter(...)`: lọc mảng
- `toLowerCase()` để search không phân biệt hoa thường
- `includes(...)`: kiểm tra có chứa chuỗi con

### 7.3. `useMutation` + `invalidateQueries` để làm gì?

Sau khi create/update/delete xong:
- gọi `invalidateQueries({ queryKey: ['brands'] })`
- React Query biết cache “brands” đã cũ → tự refetch → UI cập nhật

### 7.4. Vì sao form dùng `setFormData({ ...formData, field: value })`?

Vì React state phải tạo object mới:
- `...formData` copy toàn bộ field cũ
- cập nhật đúng 1 field đang edit

---

## 8) Bộ câu hỏi thầy hay hỏi khi bảo vệ (kèm cách trả lời)

### 8.1. “File route này làm gì?”

Trả lời mẫu:
- “`backend/routes/brands.js` khai báo endpoint CRUD `/brands`. Mỗi route gồm: validator → validate → asyncHandler → gọi controller → trả JSON.”

### 8.2. “Validator chạy ở đâu? Sai thì sao?”

Trả lời mẫu:
- “Validator nằm trong `backend/utils/validator.js`, route gắn rule trước `validate`. Nếu sai, `validate` trả HTTP **422** kèm mảng `errors`, controller không chạy.”

### 8.3. “Tại sao tạo brand trùng code lại báo lỗi 409?”

Trả lời mẫu:
- “Schema set `unique: true`, Mongo ném lỗi `11000`. Controller bắt lỗi đó và chuyển thành HTTP **409 Conflict** với message theo field trùng.”

### 8.4. “Slug tạo ở đâu? Khi nào chạy?”

Trả lời mẫu:
- “Trong schema (`brands.js`, `categories.js`, `products.js`) có hook `pre('validate')`. Hook chạy trước validate/save; nếu thiếu slug và có name thì slugify(name).”

### 8.5. “Xóa supplier/unit/brand có xóa khỏi DB không?”

Trả lời mẫu:
- “Không xóa khỏi DB. `DELETE` gọi hàm archive, set `status = inactive` (xóa mềm) để giữ lịch sử.”

### 8.6. “Search đang chạy backend hay frontend?”

Trả lời mẫu đúng theo code hiện tại:
- “Backend có hỗ trợ `search` bằng `$regex` trong controller, nhưng UI hiện đang filter mảng ở client để search nhanh trên dữ liệu đã tải.”

---

## 9) Danh sách file bạn cần học thuộc (đúng yêu cầu thầy hay hỏi)

### Backend
- `backend/routes/brands.js`, `backend/controllers/brands.js`, `backend/schemas/brands.js`
- `backend/routes/units.js`, `backend/controllers/units.js`, `backend/schemas/units.js`
- `backend/routes/suppliers.js`, `backend/controllers/suppliers.js`, `backend/schemas/suppliers.js`
- `backend/utils/slugify.js`
- `backend/utils/asyncHandler.js` (mẫu bọc try/catch cho async)
- `backend/utils/validator.js` (rules của 3 module)

### Frontend
- `frontend/src/api/brands.ts`, `frontend/src/app/(dashboard)/brands/page.tsx`
- `frontend/src/api/units.ts`, `frontend/src/app/(dashboard)/units/page.tsx`
- `frontend/src/api/suppliers.ts`, `frontend/src/app/(dashboard)/suppliers/page.tsx`

