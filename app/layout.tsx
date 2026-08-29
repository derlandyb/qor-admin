import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "QOR Admin",
  description: "Painel administrativo QOR — moderação e gestão de contas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`h-full ${rubik.variable}`}>
      <body className="min-h-full flex flex-col font-admin-sans bg-admin-bg-body text-admin-text-primary">
        {children}
      </body>
    </html>
  );
}
