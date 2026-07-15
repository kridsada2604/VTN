# Changelog

## v0.16.8 — CRM Workflow
- Add CRM opportunity create and stage update workflow.
- Add CRM activity create and complete workflow.
- Add lead to customer conversion with audit log and generated customer code.
- Add SQL Migration `supabase/phase-3.1.sql` with CRM update RLS and workflow database functions.
- Update CRM dashboard and Activities page to use Service/Repository actions only.

## v0.16.7 — Purchase Payment
- Add purchase order payment tracking with paid and balance amounts.
- Add supplier payment posting to Accounting through Service/Repository and database functions.
- Add purchase order accounting posting for received purchase orders.
- Add Purchase Order detail payment panel, payment history, accounting status, and timeline.
- Add SQL Migration `supabase/phase-3.0.sql` with RLS, audit log, payment table, and input VAT account.

## v0.16.6 — Manual Journal Entry
- เพิ่ม Manual Journal Entry form
- เพิ่ม validation ตรวจ Debit/Credit ให้สมดุล
- เพิ่ม Service/Repository สำหรับสร้าง Journal Entry ผ่าน `post_journal_entry`
- เพิ่มหน้า `/accounting/journal/new`
- อัปเดตหน้า Journal ให้สร้างรายการ manual ได้

## v0.16.5 — Accounting Reports
- เพิ่ม Profit / Loss report
- เพิ่ม Balance Sheet report
- เพิ่ม Cash Flow foundation
- เพิ่ม accounting report calculations จาก posted journal ledger
- อัปเดต Accounting hub ให้เข้า financial reports ได้
- ไม่ต้องเพิ่ม migration เพราะใช้ Journal/Account schema เดิม

## v0.16.4 — Sales Accounting Posting
- เพิ่ม posting Invoice เข้า Accounting
- เพิ่ม posting Receive Payment เข้า Accounting
- เพิ่ม journal link สำหรับ Invoice และ Payment เพื่อกันการ post ซ้ำ
- เพิ่มปุ่ม Post Invoice และ Post Payment ในหน้า Invoice
- เพิ่ม SQL Migration `supabase/phase-2.9.sql`
- เพิ่ม database functions `post_sales_invoice_to_accounting` และ `post_invoice_payment_to_accounting`

## v0.16.3 — Quotation to Sales Order
- เพิ่มการสร้าง Sales Order จาก Quotation ที่ Accepted แล้ว
- เพิ่มการกันสร้าง Sales Order ซ้ำจาก Quotation เดิม
- เพิ่ม source link `quotation_id` ใน Sales Order
- เพิ่ม SQL Migration `supabase/phase-2.8.sql`
- เพิ่ม database function `create_sales_order_from_quotation`

## v0.16.2 — Sales Order to Invoice
- เพิ่มการสร้าง Invoice จาก Sales Order ที่ส่งของแล้ว
- เพิ่มการกันออก Invoice ซ้ำจาก Sales Order เดิม
- เพิ่ม source link `sales_order_id` และ `sales_order_item_id` ใน Invoice
- เพิ่ม SQL Migration `supabase/phase-2.7.sql`
- เพิ่ม database function `create_invoice_from_sales_order`

## v0.16.1 — Sales Fulfillment
- เพิ่ม Sales Order foundation
- เพิ่ม Sales Order list/create/detail
- เพิ่ม Reserve Stock จาก Sales Order
- เพิ่ม Delivery จาก Sales Order และตัดสต๊อกผ่าน `post_stock_movement`
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ Sales Order
- เพิ่ม SQL Migration `supabase/phase-2.6.sql`
- เพิ่มตาราง `sales_orders`, `sales_order_items`, `sales_deliveries`, `sales_delivery_items`, `sales_order_events`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ Sales fulfillment
- เพิ่ม database functions `create_sales_order`, `reserve_sales_order_stock` และ `deliver_sales_order`

## v0.16.0 — Sprint 16
- เพิ่ม AI Assistant module
- เพิ่ม AI conversation list/create/detail
- เพิ่ม ERP insight foundation จาก Finance, Inventory, Marketplace และ Claims
- เพิ่ม suggestion queue foundation
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ AI Assistant
- เพิ่ม SQL Migration `supabase/phase-2.5.sql`
- เพิ่มตาราง `ai_conversations`, `ai_messages`, `ai_suggestions`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ AI Assistant
- เพิ่ม database functions `create_ai_conversation` และ `add_ai_message`

## v0.15.0 — Sprint 15
- เพิ่ม Marketplace module
- เพิ่ม Marketplace channel list/create
- เพิ่ม Marketplace order import list/create/detail
- เพิ่ม product mapping foundation สำหรับ SKU Marketplace
- เพิ่ม Service Layer, Repository Layer และ Validation สำหรับ Marketplace
- เพิ่ม SQL Migration `supabase/phase-2.4.sql`
- เพิ่มตาราง `marketplace_channels`, `marketplace_product_mappings`, `marketplace_orders`, `marketplace_order_items`, `marketplace_order_events`
- เพิ่ม RLS, Permission และ Audit Log สำหรับ Marketplace
- เพิ่ม database functions `create_marketplace_channel` และ `import_marketplace_order`

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
