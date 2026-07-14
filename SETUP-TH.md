# คู่มือตั้งค่า VTN Business Phase 1

## 1) ตั้งค่า Supabase
1. เข้า Supabase Project ของคุณ
2. ไปที่ **SQL Editor > New query**
3. เปิดไฟล์ `supabase/phase-1.sql` คัดลอกทั้งหมด แล้วกด **Run**
4. ไปที่ **Authentication > Users > Add user**
5. สร้างผู้ใช้คนแรกด้วยอีเมลและรหัสผ่าน ผู้ใช้คนแรกจะได้รับ Role `OWNER`
6. ไปที่ **Project Settings > API** แล้วคัดลอก Project URL และ Publishable key

## 2) ตั้งค่า GitHub
1. แตก ZIP
2. เปิด Terminal ในโฟลเดอร์โปรเจกต์
3. รัน `git init`
4. รัน `git add .`
5. รัน `git commit -m "feat: initialize VTN Business phase 1"`
6. สร้าง Repository ชื่อ `vtn-business` ใน GitHub
7. ทำตามคำสั่ง Push ที่ GitHub แสดง

## 3) ตั้งค่า Vercel
1. เข้า Vercel และเลือก **Add New > Project**
2. Import Repository `vtn-business`
3. Framework Preset ให้เป็น **Next.js**
4. เพิ่ม Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. กด **Deploy**
6. เมื่อ Deploy เสร็จ เปิด URL ที่ Vercel ให้ แล้ว Login ด้วยผู้ใช้จาก Supabase

## 4) ทดสอบบนเครื่อง (ไม่บังคับ)
- Node.js 20.9 ขึ้นไป
- `npm install`
- สร้าง `.env.local` จาก `.env.example`
- `npm run dev`
- เปิด `http://localhost:3000`

## การแก้ปัญหาเบื้องต้น
- Login ไม่ได้: ตรวจ Email/Password และ Environment Variables
- หน้า Company ว่าง: ตรวจว่ารัน SQL ครบและสร้าง User หลังรัน SQL
- Vercel Build ล้ม: ตรวจ Node.js และ Environment Variables
