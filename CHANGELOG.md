# Changelog

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
