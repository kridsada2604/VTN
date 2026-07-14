# TODO

## Sprint 7 — Invoice / Receive Payment / PDF / Email / Document Engine
- [x] เพิ่ม Invoice list/create/detail
- [x] เพิ่ม Receive Payment
- [x] เพิ่ม print/PDF ผ่าน browser print
- [x] เพิ่ม email draft ผ่าน mailto link
- [x] เพิ่ม Document Engine foundation
- [x] เพิ่ม Service Layer สำหรับ Invoice
- [x] เพิ่ม Repository Layer สำหรับ Invoice
- [x] เพิ่ม Validation สำหรับ Invoice และ Receive Payment
- [x] เพิ่ม Migration, RLS, Audit Log และ Permission
- [ ] เชื่อม Sales Order → Invoice หลังจาก Sales Order schema พร้อมใน repo
- [ ] เพิ่ม email provider จริง เช่น Resend หรือ Supabase Edge Function
- [ ] เพิ่ม PDF renderer server-side สำหรับเอกสารแนบอีเมล
- [ ] เพิ่ม error boundary/toast สำหรับ server action errors
- [ ] Refactor module เก่าให้ย้าย query จาก page/actions ไป Service/Repository ทั้งหมด

## Sprint 8 — Inventory
- [x] Stock Card
- [x] Movement
- [x] FIFO layer foundation
- [x] Average Cost foundation
- [x] Lot field foundation
- [x] Serial field foundation
- [x] Barcode field foundation
- [ ] เชื่อม Reserve Stock จาก Sales Order
- [ ] เชื่อม Delivery เพื่อตัดสต๊อกจากเอกสารขาย
- [ ] เพิ่ม Transfer ระหว่างคลังแบบ 2 ฝั่ง
- [ ] เพิ่มหน้าจอปรับปรุง Barcode ใน Product master ผ่าน Service/Repository
- [ ] เพิ่ม FIFO issue consumption แบบเต็มรูปแบบ

## Sprint 9 — Accounting
- [x] Journal
- [x] Ledger
- [x] Trial Balance
- [ ] P/L
- [ ] Balance Sheet
- [ ] Cash Flow
- [ ] เชื่อม Invoice posting อัตโนมัติ
- [ ] เชื่อม Receive Payment posting อัตโนมัติ
- [ ] เพิ่ม Journal Entry manual form
- [ ] เพิ่มงบการเงินจาก account type

## Sprint 10 — Purchase
- [x] Supplier
- [x] PO
- [ ] Receive
- [ ] Payment
- [ ] เชื่อม PO Receive เข้ากับ Stock Movement
- [ ] เชื่อม Supplier Payment เข้ากับ Accounting
