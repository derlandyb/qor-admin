import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QOR Admin",
  description: "Painel administrativo QOR — moderação e gestão de contas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
