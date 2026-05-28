import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eid Salami Spin Wheel",
  description: "One-time Eid Salami redeem code spin wheel"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
