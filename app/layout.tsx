import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QOR Admin",
  description: "Painel administrativo QOR — aprovações, eventos e planos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-admin-bg-body">{children}</body>
    </html>
  );
}
