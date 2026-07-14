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
- [ ] Stock Card
- [ ] Movement
- [ ] FIFO
- [ ] Average Cost
- [ ] Lot
- [ ] Serial
- [ ] Barcode

## Sprint 9 — Accounting
- [ ] Journal
- [ ] Ledger
- [ ] Trial Balance
- [ ] P/L
- [ ] Balance Sheet
- [ ] Cash Flow
