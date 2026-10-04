import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planos de Ensino SC",
  description: "Aplicativo para professores da rede estadual de SC criarem seus planos de ensino.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased">{children}</body>
    </html>
  );
}
