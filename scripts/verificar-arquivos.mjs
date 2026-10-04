// Verificação de segurança executada automaticamente antes de cada build ("prebuild").
// Se algum arquivo essencial estiver faltando, o build FALHA e a Vercel mantém
// o site atual no ar — assim um envio incompleto nunca substitui o app em produção.
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const essenciais = [
  // Autenticação e segurança
  "src/proxy.ts",
  "src/app/login/page.tsx",
  "src/app/cadastro/page.tsx",
  "src/app/recuperar-senha/page.tsx",
  "src/app/redefinir-senha/page.tsx",
  "src/app/auth/confirm/route.ts",
  "src/app/api/turnstile-verify/route.ts",
  "src/components/turnstile.tsx",
  "src/lib/turnstile-client.ts",
  "src/lib/rate-limit.ts",
  // Banco de dados
  "src/lib/supabase/client.ts",
  "src/lib/supabase/server.ts",
  "src/lib/database.types.ts",
  // Páginas principais
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/dashboard/layout.tsx",
  "src/app/dashboard/escolas/page.tsx",
  "src/app/dashboard/planos/actions.ts",
  "src/app/dashboard/planos/novo/page.tsx",
  "src/app/dashboard/planos/novo/medio-tecnico/page.tsx",
  "src/app/dashboard/planos/novo/fundamental-anos-iniciais/page.tsx",
  "src/app/dashboard/planos/novo/fundamental-anos-finais/page.tsx",
  "src/app/dashboard/planos/novo/infantil/page.tsx",
  "src/app/dashboard/planos/[id]/visualizar/page.tsx",
  // Exportação de PDF / impressão
  "src/lib/gerar-pdf.ts",
  // Imagens e logos
  "public/brasao-santa-catarina.jpg",
  "public/logo-sc-educacao.png",
  "public/hero-professora.jpg",
  "public/planejamento-professores.jpg",
];

const faltando = essenciais.filter((arquivo) => !existsSync(resolve(raiz, arquivo)));

if (faltando.length > 0) {
  console.error("\n❌ BUILD CANCELADO: faltam arquivos essenciais do aplicativo:\n");
  for (const arquivo of faltando) console.error("   - " + arquivo);
  console.error(
    "\nO site em produção NÃO foi alterado. Envie o projeto completo (pasta inteira) e tente novamente.\n"
  );
  process.exit(1);
}

console.log(`✔ Verificação OK: ${essenciais.length} arquivos essenciais presentes.`);
