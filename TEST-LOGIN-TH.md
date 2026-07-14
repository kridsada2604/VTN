# ตั้งค่าบัญชีทดสอบ Admin / 1234

โหมดนี้ใช้เฉพาะช่วงทดสอบระบบเท่านั้น

## 1. ตั้งค่ารหัสผ่านขั้นต่ำใน Supabase

ไปที่ Supabase Dashboard > Authentication > Settings / Password Security

ตั้ง Minimum password length เป็น 4 ชั่วคราว

> ก่อนใช้งานจริง ให้ปรับกลับเป็นอย่างน้อย 8 ตัวอักษรและเปลี่ยนรหัสผ่านทันที

## 2. สร้างหรือแก้ผู้ใช้ทดสอบ

ไปที่ Authentication > Users

สร้างผู้ใช้หรือแก้ผู้ใช้เดิมให้มี:

- Email: อีเมลผู้ดูแลที่คุณใช้อยู่
- Password: `1234`
- Confirm email: เปิดใช้งานแล้ว

## 3. ตั้งค่า Environment Variable ใน Vercel

ไปที่ Vercel > Project > Settings > Environment Variables

เพิ่ม:

```text
NEXT_PUBLIC_TEST_ADMIN_EMAIL=อีเมลผู้ดูแลที่สร้างใน Supabase
```

เลือก Production, Preview และ Development แล้ว Save

## 4. Redeploy

Redeploy โปรเจกต์ หลังจากนั้นเข้าสู่ระบบด้วย:

```text
ชื่อผู้ใช้: Admin
รหัสผ่าน: 1234
```

หน้า Login จะแปลงคำว่า `Admin` เป็นอีเมลจาก Environment Variable โดยอัตโนมัติ
