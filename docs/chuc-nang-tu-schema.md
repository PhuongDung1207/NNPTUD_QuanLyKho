# Danh sach chuc nang goi y tu schemas

Da cap nhat theo yeu cau:
- Bo cac chuc nang ban hang.
- Bo sung phan quyen user/admin.

1. Quan ly san pham (CRUD, trang thai `draft/active/inactive/discontinued`).
2. Tim kiem san pham full-text theo `name/sku/barcode`.
3. Sinh `slug` tu dong cho san pham, brand, category.
4. Quan ly bien the san pham (`ProductVariant`) theo thuoc tinh.
5. Quan ly danh muc phan cap (category cha-con).
6. Quan ly thuong hieu (brand) + quoc gia xuat xu.
7. Quan ly don vi tinh (`Unit`) + do chinh xac so le (`precision`).
8. Quan ly nha cung cap (`Supplier`) + thong tin lien he.
9. Quan ly kho (`Warehouse`) + gan quan ly kho (`manager`).
10. Theo doi ton kho theo tung san pham-tung kho (`Inventory`).
11. Tu dong tinh ton kha dung (`availableQuantity = onHand - reserved`).
12. Canh bao ton thap theo `reorderPoint` / `minStockLevel`.
13. De xuat bo sung hang theo `maxStockLevel`.
14. Quan ly phieu nhap (`PurchaseOrder`) theo vong doi duyet/nhan.
15. Quan ly chi tiet phieu nhap (`PurchaseOrderItem`) + nhan mot phan (`receivedQuantity`).
16. Quan ly trang thai lo hang (`BatchLot`) theo `available/blocked/expired` de chan xuat kho lo khong hop le.
17. Quan ly chuyen kho (`TransferOrder`) giua kho di/kho den + theo doi shipped/received.
18. Quan ly lo hang (`BatchLot`) theo `lotCode`, NSX/HSD, trang thai lo.
19. Nhat ky bien dong ton (`InventoryTransaction`) + audit log thao tac nguoi dung (`AuditLog`).
20. Quan ly tai khoan nguoi dung (`User`) + trang thai `active/inactive/locked`.
21. Phan quyen he thong theo vai tro (`Role`, `Permission`) voi nhom user/admin.
