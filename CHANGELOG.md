# Changelog

## v0.20.8 - Move Sale Out to Report Center
- Move Sale Out create and detail routes under Report Center context.
- Redirect legacy Sales Sale Out routes to Report Center routes to preserve old links.
- Remove Sale Out from the Sales module grid and update Report Center actions/detail links.
## v0.20.7 - Report Preview Filters
- Add Sale Out report preview inside Report Center with date, dealer, status, and keyword filters.
- Add filtered Sale Out KPIs, preview table, top dealer, and top salesperson summaries before export.
- Keep report querying in Service and Repository layers instead of UI components.

## v0.20.6 - MOI Test Data
- Rename MOI meaning to Month of Inventory in Report Center metadata and upload UI.
- Add reversible Supabase test data migration for dealers, products, Sale Out reports, and report upload batches.
- Add sample CSV files for Sale Out, Inventory, Month of Inventory, and Runrate upload testing.

## v0.20.5 — Sale Out CSV Import Pipeline
- Add Sale Out CSV importer for Report Center uploads.
- Parse uploaded CSV files from Supabase Storage and create Sale Out reports.
- Add import action on the Sale Out report category page.
- Update upload batch status to processing, imported, or failed with row counts.

## v0.20.4 — Report Center Storage Upload
- Add private Supabase Storage bucket `report-imports` with company-scoped policies.
- Upload report files directly from Report Center into Storage.
- Automatically register uploaded files with storage path, bucket, original file name, and size.

## v0.20.3 — Report Center Category Status
- Add clickable Report Center category cards.
- Add category detail pages for Sale In, Sale Out, Inventory, MOI, and Runrate.
- Add per-category status labels for ready, foundation, and in-progress modules.

## v0.20.2 — Report Center Foundation
- Add Report Center for Sale In, Sale Out, Inventory, MOI, and Runrate categories.
- Add report upload registry table with RLS, audit log, and create RPC.
- Add Report Center Service, Repository, Validation, upload registration form, and dashboard.
- Add Report Center navigation entry.

## v0.20.1 — Purchase Dashboard KPIs
- Add Purchase dashboard summary from Purchase Order Service/Repository.
- Show total PO amount, outstanding supplier balance, pending receipt count, and overdue expected receipts.
- Add recent Purchase Orders table to the Purchase dashboard.

## v0.20.0 — Sale Out Dealer Sales Foundation
- Add Sale Out report and item tables with RLS, audit log, and create RPC.
- Add Sale Out Service, Repository, Validation, Calculator, and responsive form.
- Add Sale Out dashboard with dealer, salesperson, monthly growth, and top performer summaries.
- Add Sale Out list, create, and detail pages under Sales.

## v0.19.4 — Account Type Financial Statement Check
- Add Balance Sheet balance check from account-type grouped financial reports.
- Confirm Sprint 9 financial statements are generated from accounting account types.

## v0.19.3 — Invoice Email Provider
- Add document email logs with RLS for sales invoices.
- Add Supabase Edge Function `invoice-email` with Resend-compatible provider support.
- Add invoice provider-send action and email log panel on invoice detail.

## v0.19.2 — Application Error Boundaries
- Add dashboard route error boundary with retry and dashboard recovery path.
- Add global application error boundary for root-level rendering failures.
- Improve production resilience for server-rendered ERP pages.

## v0.19.1 — Marketplace Sync Foundation
- Add marketplace sync logs with RLS, audit log, and start/finish RPCs.
- Add Supabase Edge Function `marketplace-sync` as the connector entry point.
- Add Marketplace dashboard sync trigger and latest sync log view.

## v0.19.0 — AI Action Approval Queue
- Add `ai_action_requests` with RLS, audit log, and approval/rejection RPCs.
- Add AI service/repository/validation workflow for queued action requests.
- Add AI dashboard and conversation UI for creating, approving, and rejecting action requests.

## v0.18.9 — OpenAI Edge Provider
- Add Supabase Edge Function `ai-provider` for OpenAI Responses API.
- Wire AI conversation follow-up to call the provider with fallback placeholder behavior.
- Add OpenAI provider environment variables to `.env.example`.
- No database migration required.

## v0.18.8 — AI Conversation Follow-up
- Add follow-up message form to AI conversation detail.
- Add Service/Repository action and Supabase RPC to append messages.
- Add placeholder assistant response until OpenAI provider is connected.
- Add SQL Migration `supabase/phase-4.8.sql`.

## v0.18.7 — AI Recommendation Queue
- Add AI recommendation generation into suggestion queue.
- Add Service/Repository action and Supabase RPC for ERP signal recommendations.
- Add Generate Suggestions action to AI dashboard.
- Add SQL Migration `supabase/phase-4.7.sql`.

## v0.18.6 — AI Dashboard Summary
- Add AI-generated ERP dashboard summary from live ERP signals.
- Summarize unpaid invoices, low stock, marketplace fulfillment, and open claims.
- Add focus area chips to AI Assistant dashboard.
- No database migration required.

## v0.18.5 — Marketplace Sales Conversion
- Add Marketplace Order conversion to Sales Order.
- Add optional reserve and delivery creation during conversion.
- Link converted Marketplace Orders to Sales Orders and Delivery records.
- Add SQL Migration `supabase/phase-4.6.sql`.

## v0.18.4 — FIFO Issue Consumption
- Add stock layer consumption tracking table.
- Consume FIFO layers for ISSUE, ADJUSTMENT_OUT, and TRANSFER_OUT when product costing method is FIFO.
- Keep Average Cost behavior for AVERAGE products.
- Add SQL Migration `supabase/phase-4.5.sql`.

## v0.18.3 — Warehouse Transfer
- Add warehouse transfer workflow with paired transfer-out and transfer-in movements.
- Add transfer validation, service, repository, and server action.
- Add Warehouse Transfer page and Inventory dashboard entry.
- Add SQL Migration `supabase/phase-4.4.sql`.

## v0.18.2 — Partial Delivery and Backorder
- Add partial delivery quantity input per Sales Order item.
- Update Sales Delivery posting to support partial quantities.
- Keep backorder quantity visible on Sales Order detail.
- Add SQL Migration `supabase/phase-4.3.sql`.

## v0.18.1 — Product Barcode Workflow
- Add Product Service/Repository/Validation workflow.
- Move Product master page and actions away from direct Supabase access.
- Add barcode field to Product list, search, and form.
- Add SQL Migration `supabase/phase-4.2.sql` with RPC workflow and audit log.

## v0.18.0 — Delivery Print
- Add printable Delivery Note page for Sales Delivery.
- Add delivery print data access through Sales Service/Repository.
- Add print action link from Sales Order delivery history.
- No database migration required.

## v0.17.9 — Marketplace Fee Reconciliation
- Add marketplace fee reconciliation table with RLS and audit log.
- Add fee recording workflow through Service/Repository and Supabase RPC.
- Add marketplace order fee history and net-after-fees summary.
- Add SQL Migration `supabase/phase-4.1.sql`.

## v0.17.8 — Marketplace Unmapped SKU
- Add unmapped marketplace SKU management page.
- Add SKU mapping workflow through Service/Repository and Supabase RPC.
- Update marketplace order items to mapped products after mapping.
- Add SQL Migration `supabase/phase-4.0.sql`.

## v0.17.7 — Warranty Policy
- Add warranty policy setup page.
- Add warranty policy table with RLS and audit log.
- Add warranty policy create workflow through Service/Repository.
- Add SQL Migration `supabase/phase-3.9.sql`.

## v0.17.6 — Claim Resolution Actions
- Add claim replacement, refund, and credit note resolution workflow.
- Add claim resolution history and resolution action form.
- Post replacement stock through Stock Movement.
- Add SQL Migration `supabase/phase-3.8.sql` with claim resolution table, RLS, audit log, and workflow function.

## v0.17.5 — Project Billing
- Add project invoice creation workflow.
- Link sales invoices to projects through `project_id`.
- Update project revenue automatically when creating project invoices.
- Add Project detail billing form and invoice history.
- Add SQL Migration `supabase/phase-3.7.sql`.

## v0.17.4 — POS Void and Refund
- Add POS full bill void and refund workflow.
- Reverse POS stock through stock movement when voiding or refunding.
- Add POS receipt controls for Void Bill and Refund Full Bill.
- Add adjustment status fields for reason, adjusted time, and stock reversal.
- Add SQL Migration `supabase/phase-3.6.sql`.

## v0.17.3 — POS Terminal Foundation
- Add full-screen POS Terminal route `/pos/terminal`.
- Add barcode/SKU/product search input with Enter-to-add flow.
- Add cashier cart with quantity controls, product tiles, payment method buttons, paid amount, and change calculation.
- Keep POS Terminal creating sales through the existing Service/Repository server action.
- Add POS dashboard entry point to Terminal while keeping the ERP sale form available.

## v0.17.2 — POS Session Workflow
- Add POS session open and close workflow.
- Add cash drawer summary with opening cash, cash sales, and expected cash.
- Attach POS sales to the currently open warehouse session automatically.
- Add SQL Migration `supabase/phase-3.5.sql` with POS session workflow functions.

## v0.17.1 — Claim Status Workflow
- Add claim status update workflow with resolution notes.
- Add claim timeline events and audit log for status changes.
- Add SQL Migration `supabase/phase-3.4.sql` with claim update RLS and workflow database function.
- Update Claim detail page with workflow controls.

## v0.17.0 — Project Cost Posting
- Add project cost posting with automatic journal entry creation.
- Add project cost account `6100` and journal link on project costs.
- Update Project detail with cost posting form and project cost history.
- Update project actual cost automatically when posting costs.
- Add SQL Migration `supabase/phase-3.3.sql`.

## v0.16.9 — Project Task Workflow
- Add project task create and update workflow.
- Add project task status, due date, estimated hours, and actual hours editing.
- Add project progress summary on Project detail.
- Add SQL Migration `supabase/phase-3.2.sql` with task update RLS and task workflow database functions.
- Keep Project UI routed through Service/Repository and validation layers.

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
