import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { limitadoNoBanco } from "@/lib/rate-limit-banco";

/**
 * Verifica um token do Cloudflare Turnstile no servidor, chamando a API
 * oficial de "siteverify" do Cloudflare. A chave secreta (TURNSTILE_SECRET_KEY)
 * só existe aqui, no servidor — nunca é enviada ao navegador nem aparece em
 * nenhuma resposta desta rota.
 */
export async function POST(request: Request) {
  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  // Camada extra contra automação batendo nesta rota em volume (login,
  // cadastro e recuperação de senha dependem dela antes de prosseguir).
  // Limite generoso de propósito — 20 verificações em 5 minutos por IP é
  // muito mais do que qualquer pessoa real precisaria, mesmo errando o
  // captcha algumas vezes; só trava automação de verdade. Ver
  // src/lib/rate-limit.ts para como ajustar ou desativar isso.
  const limiteTurnstile = {
    bucket: "turnstile-verify",
    identifier: remoteIp,
    windowMs: 5 * 60 * 1000,
    maxAttempts: 20,
    blockMs: 10 * 60 * 1000,
  };
  // Primeiro o limite em memória (barato, por instância); depois o do banco, que vale para todas as instâncias.
  if (isRateLimited(limiteTurnstile) || (await limitadoNoBanco(limiteTurnstile))) {
    return NextResponse.json(
      { success: false },
      { status: 429, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  let token: unknown;

  try {
    const body = await request.json();
    token = body?.token;
  } catch {
    return NextResponse.json(
      { success: false },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  if (!token || typeof token !== "string") {
    return NextResponse.json(
      { success: false },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Se a chave não estiver configurada no servidor, negamos por padrão —
    // nunca liberamos o formulário sem conseguir validar de verdade.
    return NextResponse.json(
      { success: false },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token);
  if (remoteIp) params.set("remoteip", remoteIp);

  try {
    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      }
    );

    const data = (await verifyRes.json()) as { success?: boolean };

    return NextResponse.json(
      { success: data.success === true },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch {
    return NextResponse.json(
      { success: false },
      { status: 502, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
