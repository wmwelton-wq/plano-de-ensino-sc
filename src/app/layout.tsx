import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
