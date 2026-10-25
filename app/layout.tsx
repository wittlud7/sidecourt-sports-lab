import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "场边 · 体育数据与解说备课",
  description: "查询赛事与球员数据，使用关系图谱、战术板和解说备课工具。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
