import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./dashboard/painel.css";
import "./modo-escuro.css";
import RegistrarApp from "@/components/registrar-app";

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
  applicationName: "Plano Docente",
  appleWebApp: { capable: true, title: "Plano Docente", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={fonteCorpo.variable} suppressHydrationWarning>
      <head>
        {/* Aplica o modo escuro antes da primeira pintura (só no painel), para a tela não piscar em branco. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('plano-docente:tema');var d=t==='escuro'||(t!=='claro'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d&&location.pathname.indexOf('/dashboard')===0)document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased">{children}
        <RegistrarApp />
      </body>
    </html>
  );
}
