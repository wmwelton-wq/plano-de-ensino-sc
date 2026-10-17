import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// O nome da variável (--font-inter) é mantido de propósito: assim a fonte funciona
// mesmo que o tailwind.config.ts do projeto ainda seja o antigo.
const fonteCorpo = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
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
