# Kien truc cac tang trong du an

## 1. Tang khoi dong server

- `package.json`: khai bao lenh `npm start`, thuc chat chay `nodemon ./bin/www`.
- `bin/www`: tao HTTP server tu `app` va `listen` o port `3000`.
- Tang nay khong tra JSON cho client. No chi khoi dong server de cac request di vao `app`.

## 2. Tang app cau hinh chung

- `app.js`: gan middleware chung nhu `logger`, `express.json()`, `cookieParser()`, static file, roi mount cac router `/api/v1/...`.
- `app.js`: ket noi MongoDB.
- `app.js`: co handler `404` va error handler cuoi.
- Tang nay tra ve Express app cho `bin/www`, con voi client thi no dieu huong request sang dung route. Neu khong match route thi tra loi nhu `404`.

## 3. Tang route

- Vi du: `routes/auth.js`, `routes/users.js`, `routes/products.js`.
- Day la tang nhan truc tiep `req`, doc `params/query/body`, goi middleware, controller hoac model.
- Day cung la tang ket thuc request bang `res.send(...)` hoac `res.status(...).send(...)`.
- Noi ngan gon: route la noi "tra ket qua HTTP" cho frontend/Postman.

Ket qua tra ve thuong la:

- JSON object, vi du user/cart/message moi tao.
- JSON array, vi du danh sach `products/users`.
- JSON loi, vi du `{ message: "ID NOT FOUND" }`.
- Doi khi la string, vi du `"da update"`.

## 4. Tang middleware / utils

### Auth middleware

- File: `utils/authHandler.js`
- Nhiem vu: lay token tu header hoac cookie, verify JWT, tim user, gan `req.user`.
- Neu hop le: khong tra du lieu ngay, ma goi `next()`.
- Neu loi: tra luon response loi nhu `{ message: "ban chua dang nhap" }`.

### Role middleware

- File: `utils/authHandler.js`
- Nhiem vu: kiem tra quyen theo `req.user.role.name`.
- Neu dung quyen: `next()`.
- Neu sai: tra `403`.

### Validator middleware

- File: `utils/validator.js`
- Nhiem vu: kiem tra `body` dau vao.
- Neu pass: `next()`.
- Neu fail: tra mang loi kieu `[{ email: "..." }, { password: "..." }]`.

### Upload middleware

- File: `utils/uploadHandler.js`
- Nhiem vu: xu ly file voi `multer`.
- No khong tu tra response. No gan `req.file` hoac `req.files` de route dung tiep.

### Mail helper

- File: `utils/mailHandler.js`
- Nhiem vu: gui email reset password.
- Tra ve `Promise`; route thuong `await` no, chu khong gui truc tiep ve client.

## 5. Tang controller

- Vi du: `controllers/users.js`.
- Nhiem vu: gom logic thao tac du lieu user nhu `CreateAnUser`, `GetAnUserByUsername`, `GetAnUserById`.
- Controller khong lam `res.send`.
- No tra ve du lieu cho route:
- mot document user,
- hoac `null/false`,
- hoac nem loi de route bat.
- Vi du `login` trong `routes/auth.js` goi controller lay user, roi chinh route moi quyet dinh tra token hay tra loi.

## 6. Tang model/schema

- Vi du: `schemas/users.js`, `schemas/products.js`, `schemas/carts.js`.
- Nhiem vu:
- dinh nghia cau truc du lieu MongoDB,
- rule nhu `required`, `unique`, `default`, `min`,
- hook truoc khi luu.
- Vi du dac biet: `schemas/users.js` hash password truoc khi `save/update`.
- Khi `require(...)`, file schema tra ve Mongoose model.
- Khi goi `find`, `findOne`, `save`, `findByIdAndUpdate` thi model tra ve:
- mot document,
- mang document,
- hoac `null`.

## 7. Tang database

- MongoDB duoc noi o `app.js`.
- Day la noi luu that du lieu `users`, `products`, `carts`, `messages`...
- DB khong tra truc tiep HTTP response. No tra ket qua truy van ve cho `model/controller/route`.

## Luong du lieu tu tren xuong

- Client request
- di vao `app.js`
- sang route
- route goi middleware
- route hoac controller goi model
- model lam viec voi MongoDB
- ket qua quay nguoc lai ve route
- route dung `res.send(...)` tra ve client

## Vi du thuc te: `/api/v1/auth/me`

- Route o `routes/auth.js`
- Middleware `utils/authHandler.js` xac thuc token
- Middleware tim user qua controller `controllers/users.js`
- Controller query model user
- Neu OK: middleware gan `req.user`
- Route tra `req.user` ve client bang JSON

## Vi du thuc te: `/api/v1/products` POST

- Route o `routes/products.js`
- Route tu tao `productModel` va `inventoryModel`
- Dung transaction voi `mongoose session`
- `save` product, roi `save` inventory
- Cuoi cung route tra `newInventory` da populate product ve client
