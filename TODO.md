# TODO

## Sales Fulfillment
- [x] Sales Order
- [x] Reserve Stock
- [x] Delivery
- [x] Stock deduction via Stock Movement
- [x] Service Layer / Repository Layer / Validation
- [x] Migration, RLS, Permission และ Audit Log
- [x] Convert Quotation → Sales Order
- [x] Convert Sales Order → Invoice
- [ ] Partial delivery
- [ ] Delivery print/PDF
- [ ] Backorder flow

## Sprint 16 — AI
- [x] AI Assistant
- [x] Conversation foundation
- [x] ERP insight foundation
- [x] Suggestion queue foundation
- [x] Service Layer / Repository Layer / Validation
- [x] Migration, RLS, Permission และ Audit Log
- [ ] OpenAI provider integration via Supabase Edge Function
- [ ] Tool calling/action execution with permission checks
- [ ] AI-generated dashboard summary
- [ ] AI recommendation to task/action queue
- [ ] Conversation follow-up message UI

## Sprint 15 — Marketplace
- [x] Marketplace channel
- [x] Marketplace order import foundation
- [x] Product mapping foundation
- [x] Marketplace order timeline
- [x] Service Layer / Repository Layer / Validation
- [x] Migration, RLS, Permission และ Audit Log
- [ ] API connector ต่อ Shopee/Lazada/TikTok จริง
- [ ] Auto sync orders ผ่าน Edge Function
- [ ] Convert Marketplace Order → Sales Order / Delivery
- [ ] Marketplace fee reconciliation
- [x] Unmapped SKU management page

## Sprint 14 — POS
- [x] POS sale
- [x] POS receipt print foundation
- [x] POS payment foundation
- [x] Stock deduction via Stock Movement
- [x] Service Layer / Repository Layer / Validation
- [x] Migration, RLS, Permission และ Audit Log
- [x] POS session open/close UI
- [x] Cash drawer summary
- [x] Barcode scanner optimized input
- [x] Refund / Void POS flow

## Sprint 13 — Claim
- [x] Claim
- [x] Claim timeline foundation
- [x] Service Layer / Repository Layer / Validation
- [x] Migration, RLS, Permission และ Audit Log
- [x] Claim status workflow actions
- [x] Replacement / Refund / Credit Note flow
- [x] Warranty policy

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
- [x] P/L
- [x] Balance Sheet
- [x] Cash Flow
- [x] เชื่อม Invoice posting อัตโนมัติ
- [x] เชื่อม Receive Payment posting อัตโนมัติ
- [x] เพิ่ม Journal Entry manual form
- [ ] เพิ่มงบการเงินจาก account type

## Sprint 10 — Purchase
- [x] Supplier
- [x] PO
- [x] Receive
- [x] Payment
- [x] เชื่อม PO Receive เข้ากับ Stock Movement
- [x] เชื่อม Supplier Payment เข้ากับ Accounting

## Sprint 11 — CRM
- [x] Lead
- [x] Activity view
- [x] Pipeline foundation
- [x] Opportunity create/update
- [x] Lead convert to Customer
- [x] Activity create/complete

## Sprint 12 — Projects
- [x] Project
- [x] Task foundation
- [x] Cost foundation
- [x] Task create/update
- [x] Project billing
- [x] Project cost posting
