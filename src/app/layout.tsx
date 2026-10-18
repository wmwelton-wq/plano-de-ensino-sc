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
  title: "Plano Docente — planos de ensino para professores de SC",
  description: "O Plano Docente ajuda professores de Santa Catarina a montar planos de ensino anuais e mensais.",
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
