# Phan cong chuc nang cho nhom 5 nguoi (can bang lai)

Tieu chi:
- Moi nguoi toi thieu 3 chuc nang.
- Chuc nang trong cung mot nguoi phai lien quan nhau.
- Can bang khoi luong va do kho de trien khai song song.
- Tong la `21` chuc nang, nen cach chia hop ly nhat la `4-4-4-4-5`.

## Son - Nhom san pham
1. Quan ly san pham (CRUD, trang thai `draft/active/inactive/discontinued`).
2. Tim kiem san pham full-text theo `name/sku/barcode`.
3. Quan ly bien the san pham (`ProductVariant`) theo thuoc tinh.
4. Quan ly danh muc phan cap (category cha-con).

## Huy - Nhom danh muc nen
1. Sinh `slug` tu dong cho san pham, brand, category.
2. Quan ly thuong hieu (brand) + quoc gia xuat xu.
3. Quan ly don vi tinh (`Unit`) + do chinh xac so le (`precision`).
4. Quan ly nha cung cap (`Supplier`) + thong tin lien he.

## Quy - Nhom mua hang va lo hang
1. Quan ly phieu nhap (`PurchaseOrder`) theo vong doi duyet/nhan.
2. Quan ly chi tiet phieu nhap (`PurchaseOrderItem`) + nhan mot phan (`receivedQuantity`).
3. Quan ly trang thai lo hang (`BatchLot`) theo `available/blocked/expired`.
4. Quan ly lo hang (`BatchLot`) theo `lotCode`, NSX/HSD, trang thai lo.

## Dung - Nhom kho van hanh
1. Quan ly kho (`Warehouse`) + gan quan ly kho (`manager`).
2. Theo doi ton kho theo tung san pham-tung kho (`Inventory`).
3. Tu dong tinh ton kha dung (`availableQuantity = onHand - reserved`).
4. Quan ly chuyen kho (`TransferOrder`) giua kho di/kho den + theo doi shipped/received.

## Phúc sơn  - Nhom giam sat va quan tri
1. Canh bao ton thap theo `reorderPoint` / `minStockLevel`.
2. De xuat bo sung hang theo `maxStockLevel`.
3. Nhat ky bien dong ton (`InventoryTransaction`) + audit log thao tac nguoi dung (`AuditLog`).
4. Quan ly tai khoan nguoi dung (`User`) + trang thai `active/inactive/locked`.
5. Phan quyen he thong theo vai tro (`Role`, `Permission`) voi nhom user/admin.

## Phan bo tong quan
- Son: 4 chuc nang
- Phuc Son: 4 chuc nang
- Quy: 4 chuc nang
- Dung: 4 chuc nang
- Huy: 5 chuc nang
