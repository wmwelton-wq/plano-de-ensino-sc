/**
 * Limitador de taxa simples, em memória, para proteger rotas públicas contra
 * abuso automatizado (ex.: um script tentando centenas de verificações por
 * segundo) sem arriscar travar uso humano normal.
 *
 * Decisões propositais, pensadas para nunca prejudicar usuário legítimo:
 * - Fica em memória da própria função serverless: zera sozinho a cada reinício
 *   ("cold start") e não trava ninguém "para sempre" entre deploys.
 * - Em caso de qualquer erro interno, `isRateLimited` retorna `false`
 *   (permite a requisição) — uma falha aqui nunca deve derrubar o fluxo real.
 * - Limites generosos por padrão: pensados para parar automação, não humanos
 *   digitando devagar ou tentando de novo algumas vezes.
 *
 * Para DESATIVAR completamente sem mexer em código: defina a variável de
 * ambiente `RATE_LIMIT_TURNSTILE=false` no painel da Vercel e redeploy.
 *
 * Para REMOVER de vez: apague este arquivo e a chamada a `isRateLimited` em
 * `src/app/api/turnstile-verify/route.ts` (e a variável de ambiente, se
 * quiser).
 */

type Bucket = {
  windowStart: number;
  attempts: number;
  blockedUntil?: number;
};

const buckets = new Map<string, Bucket>();

// Evita crescimento ilimitado do mapa em instâncias de longa duração: a cada
// 500 chamadas, remove entradas já expiradas há mais de 1 hora.
let callsSinceCleanup = 0;

function cleanup() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    const expiredAt = Math.max(bucket.blockedUntil ?? 0, bucket.windowStart);
    if (now - expiredAt > 60 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitOptions {
  /** Nome do limitador (evita colisão entre diferentes rotas). */
  bucket: string;
  /** Identificador do chamador (normalmente o IP). */
  identifier: string | null | undefined;
  /** Duração da janela de contagem, em milissegundos. */
  windowMs: number;
  /** Quantidade de tentativas permitidas dentro da janela. */
  maxAttempts: number;
  /** Por quanto tempo bloquear depois de exceder o limite, em milissegundos. */
  blockMs: number;
}

/**
 * Retorna `true` quando a requisição deve ser recusada por excesso de
 * tentativas. Em qualquer cenário de incerteza (sem identificador, variável
 * de ambiente desativando, ou erro interno) retorna `false` — ou seja,
 * "falha aberta": nunca bloqueia por conta própria de um problema no
 * limitador.
 */
export function isRateLimited(options: RateLimitOptions): boolean {
  try {
    if (process.env.RATE_LIMIT_TURNSTILE === "false") return false;
    if (!options.identifier) return false;

    callsSinceCleanup += 1;
    if (callsSinceCleanup >= 500) {
      callsSinceCleanup = 0;
      cleanup();
    }

    const key = `${options.bucket}:${options.identifier}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (existing?.blockedUntil && existing.blockedUntil > now) {
      return true;
    }

    if (!existing || now - existing.windowStart > options.windowMs) {
      buckets.set(key, { windowStart: now, attempts: 1 });
      return false;
    }

    existing.attempts += 1;

    if (existing.attempts > options.maxAttempts) {
      existing.blockedUntil = now + options.blockMs;
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
