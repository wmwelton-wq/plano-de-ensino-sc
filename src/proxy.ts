import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { localizacaoDosCabecalhos } from "@/lib/localizacao";

// Domínio antigo (subdomínio padrão do Vercel) — não passa pelo Cloudflare,
// então quem ainda tiver esse link salvo é redirecionado permanentemente
// para o domínio definitivo, que está protegido pelo WAF.
const OLD_HOST = "plano-de-ensino-sc.vercel.app";
const NEW_HOST = "planodocente.com.br";

/**
 * Proxy (substitui o antigo middleware.ts a partir do Next.js 16):
 * mantém a sessão do professor sempre renovada e protege as rotas do
 * dashboard (exige login), redirecionando quem já está logado para
 * longe das telas de login/cadastro.
 */
export async function proxy(request: NextRequest) {
  // Rota usada pelo banco (pg_net) para disparar o envio dos alertas de segurança.
  // Fica fora do redirecionamento e da sessão: não recebe dados e só envia alertas que o próprio banco registrou.
  if (request.nextUrl.pathname.startsWith("/api/alertas/")) {
    return NextResponse.next();
  }

  if (request.nextUrl.hostname === OLD_HOST) {
    const url = request.nextUrl.clone();
    url.hostname = NEW_HOST;
    url.port = "";
    url.protocol = "https";
    return NextResponse.redirect(url, 308);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/cadastro");

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Local aproximado (cidade/estado/país) do acesso, só para o administrador entender de onde vêm os cadastros.
  // Roda no máximo a cada ~6 horas por navegador (cookie "pd_loc") e nunca atrapalha a navegação se falhar.
  // O endereço IP não é guardado: só o texto da localização.
  if (
    user &&
    request.nextUrl.pathname === "/dashboard" &&
    request.method === "GET" &&
    !request.cookies.has("pd_loc") &&
    !request.headers.get("next-router-prefetch") &&
    request.headers.get("purpose") !== "prefetch" &&
    request.headers.get("sec-purpose") !== "prefetch"
  ) {
    try {
      const l = localizacaoDosCabecalhos(request.headers);
      if (l.cidade || l.regiao || l.pais) {
        await supabase.rpc("registrar_acesso", { p_cidade: l.cidade, p_regiao: l.regiao, p_pais: l.pais });
      }
      response.cookies.set("pd_loc", "1", { maxAge: 6 * 3600, httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/" });
    } catch {
      /* sem localização, segue normalmente */
    }
  }

  // Agora que o site fica atrás do Cloudflare, garantimos que respostas que
  // acabaram de renovar/checar a sessão nunca sejam cacheadas no proxy — um
  // Set-Cookie cacheado poderia vazar a sessão de um professor para outro.
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
