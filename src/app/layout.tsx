import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const fonteCorpo = Public_Sans({
  subsets: ["latin"],
  variable: "--font-corpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Planos de Ensino SC",
  description: "Aplicativo para professores da rede estadual de SC criarem seus planos de ensino.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fonteCorpo.variable}>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased">{children}</body>
    </html>
  );
}
