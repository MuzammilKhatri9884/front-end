import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HCM Lite · A little more human",
  description:
    "Your people, attendance, leave and payroll. One thoughtful workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
