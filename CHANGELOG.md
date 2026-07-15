# Changelog

## v0.14.0 — Sprint 14
- เพิ่ม POS module
- เพิ่ม POS sale list/create/detail และ receipt print
- เพิ่มการรับชำระเงิน POS แบบ paid sale
- เพิ่มการตัดสต๊อกอัตโนมัติผ่าน `post_stock_movement`
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ POS
- เพิ่ม SQL Migration `supabase/phase-2.3.sql`
- เพิ่มตาราง `pos_sessions`, `pos_sales`, `pos_sale_items`, `pos_payments`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ POS
- เพิ่ม database function `create_pos_sale`

## v0.13.0 — Sprint 13
- เพิ่ม Claims module
- เพิ่ม Claim list/create/detail
- เพิ่ม Claim timeline foundation
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ Claims
- เพิ่ม SQL Migration `supabase/phase-2.2.sql`
- เพิ่มตาราง `claims`, `claim_events`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ Claim
- เพิ่ม database function `create_claim`

## v0.12.0 — Sprint 12
- เพิ่ม Projects module
- เพิ่ม Project list/create/detail
- เพิ่ม Project Task และ Project Cost foundation
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ Projects
- เพิ่ม SQL Migration `supabase/phase-2.1.sql`
- เพิ่มตาราง `projects`, `project_tasks`, `project_costs`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ Project
- เพิ่ม database function `create_project`

## v0.11.0 — Sprint 11
- เพิ่ม CRM module
- เพิ่ม Lead create และ CRM dashboard
- เพิ่ม Activities view
- เพิ่ม Opportunity pipeline foundation
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ CRM
- เพิ่ม SQL Migration `supabase/phase-2.0.sql`
- เพิ่มตาราง `crm_leads`, `crm_opportunities`, `crm_activities`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ CRM Lead
- เพิ่ม database function `create_crm_lead`

## v0.10.1 — Sprint 10 Receive
- เพิ่ม Purchase Receive จากหน้า PO
- เพิ่มการรับสินค้าเข้าคลังและสร้าง Stock Movement อัตโนมัติ
- เพิ่มตาราง `purchase_receipts` และ `purchase_receipt_items`
- เพิ่ม SQL Migration `supabase/phase-1.9.sql`
- เพิ่ม database function `receive_purchase_order`
- อัปเดตสถานะ PO เป็น partially received / received ตามจำนวนรับจริง

## v0.10.0 — Sprint 10
- เพิ่ม Purchase module
- เพิ่ม Purchase Order list/create/detail
- เพิ่ม Purchase Order PDF/print view
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ Purchase Order
- เพิ่ม SQL Migration `supabase/phase-1.8.sql`
- เพิ่มตาราง `purchase_orders`, `purchase_order_items`, `purchase_order_events`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ Purchase Order
- เพิ่ม database function `create_purchase_order`

## v0.9.0 — Sprint 9
- เพิ่ม Accounting foundation สำหรับระบบบัญชีคู่
- เพิ่ม Chart of Accounts เริ่มต้นต่อบริษัท
- เพิ่ม Journal Entries และ Journal Entry Lines
- เพิ่ม Ledger และ Trial Balance pages
- เพิ่ม Service Layer และ Repository Layer สำหรับ Accounting
- เพิ่ม SQL Migration `supabase/phase-1.7.sql`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ Journal Entry
- เพิ่ม database function `post_journal_entry` สำหรับบันทึกบัญชีแบบ balanced

## v0.8.0 — Sprint 8
- เพิ่ม Inventory dashboard ที่อ่านยอดจาก stock balance จริง
- เพิ่ม Stock Movement สำหรับรับเข้า ตัดออก และปรับปรุงยอดสต๊อก
- เพิ่ม Stock Card สำหรับดูประวัติการเคลื่อนไหวสินค้า
- เพิ่ม stock balances, movements, movement items และ stock layers
- เพิ่ม Average Cost foundation และ FIFO layer foundation
- เพิ่ม Lot, Serial และ Barcode fields ใน stock movement items
- เพิ่ม product fields สำหรับ barcode, costing method, lot tracking และ serial tracking
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ Inventory
- เพิ่ม SQL Migration `supabase/phase-1.6.sql`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ stock movement

## v0.7.0 — Sprint 7
- เพิ่มโมดูล Invoice สำหรับสร้าง ดูรายการ และดูรายละเอียดใบแจ้งหนี้
- เพิ่ม Receive Payment สำหรับบันทึกรับชำระเงินและอัปเดตสถานะใบแจ้งหนี้
- เพิ่ม Document Engine foundation สำหรับ format เงิน, print/PDF และ email draft
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ Sales Invoice
- เพิ่ม SQL Migration `supabase/phase-1.5.sql`
- เพิ่มตาราง `sales_invoices`, `sales_invoice_items`, `sales_invoice_payments`, `sales_invoice_events`
- เพิ่ม `audit_logs` สำหรับบันทึก action สำคัญ
- เพิ่ม RLS และ permission policies สำหรับ Invoice/Payment/Audit Log
- เพิ่ม database functions `create_sales_invoice` และ `receive_invoice_payment` เพื่อทำงานแบบ atomic
- ปรับ Sales dashboard ให้แสดงข้อมูล Invoice และเข้าถึง Invoice/Payment ได้
- อัปเดต system badge เป็น Sprint 7

## v0.6.0 — Phase 1.5
- Authentication
- Dashboard
- Sidebar
- Master Data
- Customer
- Vendor
- Product
- Category
- Unit
- Warehouse
- Quotation
- Sales Order
- Test Login
- Deploy Vercel

## v0.5.0 — Phase 1.4
- เพิ่ม Dashboard ภาพรวมการขาย
- เพิ่มฟิลด์พนักงานขาย โครงการ เงื่อนไขชำระ และสกุลเงินในใบเสนอราคา
- เพิ่ม Auto-save draft ลงใน browser localStorage
- เพิ่มยอดรวมต่อบรรทัดและสรุปยอดละเอียด
- เพิ่ม Timeline ของใบเสนอราคา
- บันทึก Event เมื่อสร้างเอกสารและเปลี่ยนสถานะ
- เพิ่มหน้าเอกสารสำหรับพิมพ์หรือบันทึกเป็น PDF ผ่าน browser
- เพิ่ม SQL Migration `supabase/phase-1.4.sql`
