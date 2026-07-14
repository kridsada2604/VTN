import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTN Business",
  description: "ERP และระบบบัญชีสำหรับธุรกิจ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
