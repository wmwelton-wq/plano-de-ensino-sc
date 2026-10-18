/**
 * Chamada de IA com reserva automática ("fallback").
 *
 * As chaves ficam SOMENTE no servidor (variáveis de ambiente da Vercel). Cada provedor só entra na fila se a sua chave
 * existir. A ordem padrão é a mais barata primeiro; se um provedor falhar (fora do ar, limite, erro), tenta o próximo.
 *
 *   GEMINI_API_KEY      → Google Gemini   (lê PDF)
 *   OPENAI_API_KEY      → OpenAI          (lê PDF)
 *   ANTHROPIC_API_KEY   → Claude          (lê PDF)
 *   DEEPSEEK_API_KEY    → DeepSeek        (só texto)
 *   MISTRAL_API_KEY     → Mistral         (só texto)
 *   GROQ_API_KEY        → Groq (Llama)    (só texto)
 *
 *   IA_ORDEM            → ex.: "gemini,openai,anthropic,deepseek,mistral,groq" (opcional)
 *   IA_MODELO_<NOME>    → troca o modelo de um provedor (ex.: IA_MODELO_GEMINI)
 */

export type NomeProvedor = "gemini" | "openai" | "anthropic" | "deepseek" | "mistral" | "groq";

export interface PedidoIA {
  sistema: string;
  usuario: string;
  /** PDF em base64 (somente provedores que leem PDF). */
  pdfBase64?: string;
  maxTokens: number;
  /** Pede resposta em JSON quando o provedor tem esse modo. */
  json?: boolean;
  temperatura?: number;
}

export interface RespostaIA {
  texto: string;
  provedor: NomeProvedor;
  modelo: string;
  tokensEntrada: number;
  tokensSaida: number;
  /** Custo estimado em dólares. */
  custo: number;
}

interface Provedor {
  nome: NomeProvedor;
  chave: string;
  modelo: string;
  lePdf: boolean;
  /** Preço por 1 milhão de tokens (entrada, saída), em dólares. */
  preco: [number, number];
  chamar(p: PedidoIA, chave: string, modelo: string, sinal: AbortSignal): Promise<{ texto: string; tin: number; tout: number }>;
}

const TEMPO_LIMITE_MS = 50_000;

async function postJson(url: string, corpo: unknown, cabecalhos: Record<string, string>, sinal: AbortSignal): Promise<any> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...cabecalhos }, body: JSON.stringify(corpo), signal: sinal, cache: "no-store" });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} ${t.slice(0, 200)}`);
  }
  return r.json();
}

/** OpenAI e todos os compatíveis (DeepSeek, Mistral, Groq) usam o mesmo formato "chat/completions". */
function compativelOpenAI(url: string, extra?: { pdf?: boolean }): Provedor["chamar"] {
  return async (p, chave, modelo, sinal) => {
    const conteudo: unknown = p.pdfBase64 && extra?.pdf
      ? [
          { type: "text", text: p.usuario },
          { type: "file", file: { filename: "calendario.pdf", file_data: `data:application/pdf;base64,${p.pdfBase64}` } },
        ]
      : p.usuario;
    const corpo: Record<string, unknown> = {
      model: modelo,
      messages: [
        { role: "system", content: p.sistema },
        { role: "user", content: conteudo },
      ],
      temperature: p.temperatura ?? 0.5,
    };
    if (url.includes("api.openai.com")) corpo.max_completion_tokens = p.maxTokens;
    else corpo.max_tokens = p.maxTokens;
    if (p.json) corpo.response_format = { type: "json_object" };
    const d = await postJson(url, corpo, { authorization: `Bearer ${chave}` }, sinal);
    const texto = d?.choices?.[0]?.message?.content;
    if (typeof texto !== "string" || !texto.trim()) throw new Error("resposta vazia");
    return { texto, tin: d?.usage?.prompt_tokens ?? 0, tout: d?.usage?.completion_tokens ?? 0 };
  };
}

const PROVEDORES: Record<NomeProvedor, Omit<Provedor, "chave" | "modelo"> & { modeloPadrao: string; variavel: string }> = {
  gemini: {
    nome: "gemini",
    variavel: "GEMINI_API_KEY",
    modeloPadrao: "gemini-2.5-flash",
    lePdf: true,
    preco: [0.3, 2.5],
    async chamar(p, chave, modelo, sinal) {
      const partes: unknown[] = [{ text: p.usuario }];
      if (p.pdfBase64) partes.push({ inline_data: { mime_type: "application/pdf", data: p.pdfBase64 } });
      const corpo = {
        system_instruction: { parts: [{ text: p.sistema }] },
        contents: [{ role: "user", parts: partes }],
        generationConfig: {
          maxOutputTokens: p.maxTokens,
          temperature: p.temperatura ?? 0.5,
          thinkingConfig: { thinkingBudget: 0 },
          ...(p.json ? { responseMimeType: "application/json" } : {}),
        },
      };
      const d = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
        corpo,
        { "x-goog-api-key": chave },
        sinal
      );
      const texto = (d?.candidates?.[0]?.content?.parts ?? []).map((x: { text?: string }) => x.text ?? "").join("");
      if (!texto.trim()) throw new Error("resposta vazia");
      return { texto, tin: d?.usageMetadata?.promptTokenCount ?? 0, tout: d?.usageMetadata?.candidatesTokenCount ?? 0 };
    },
  },
  openai: {
    nome: "openai",
    variavel: "OPENAI_API_KEY",
    modeloPadrao: "gpt-4.1-mini",
    lePdf: true,
    preco: [0.4, 1.6],
    chamar: compativelOpenAI("https://api.openai.com/v1/chat/completions", { pdf: true }),
  },
  anthropic: {
    nome: "anthropic",
    variavel: "ANTHROPIC_API_KEY",
    modeloPadrao: "claude-haiku-4-5",
    lePdf: true,
    preco: [1, 5],
    async chamar(p, chave, modelo, sinal) {
      const conteudo: unknown[] = [];
      if (p.pdfBase64) conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: p.pdfBase64 } });
      conteudo.push({ type: "text", text: p.usuario });
      const d = await postJson(
        "https://api.anthropic.com/v1/messages",
        { model: modelo, max_tokens: p.maxTokens, temperature: p.temperatura ?? 0.5, system: p.sistema, messages: [{ role: "user", content: conteudo }] },
        { "x-api-key": chave, "anthropic-version": "2023-06-01" },
        sinal
      );
      const texto = (d?.content ?? []).map((x: { text?: string }) => x.text ?? "").join("");
      if (!texto.trim()) throw new Error("resposta vazia");
      return { texto, tin: d?.usage?.input_tokens ?? 0, tout: d?.usage?.output_tokens ?? 0 };
    },
  },
  deepseek: {
    nome: "deepseek",
    variavel: "DEEPSEEK_API_KEY",
    modeloPadrao: "deepseek-chat",
    lePdf: false,
    preco: [0.28, 0.42],
    chamar: compativelOpenAI("https://api.deepseek.com/chat/completions"),
  },
  mistral: {
    nome: "mistral",
    variavel: "MISTRAL_API_KEY",
    modeloPadrao: "mistral-small-latest",
    lePdf: false,
    preco: [0.1, 0.3],
    chamar: compativelOpenAI("https://api.mistral.ai/v1/chat/completions"),
  },
  groq: {
    nome: "groq",
    variavel: "GROQ_API_KEY",
    modeloPadrao: "llama-3.3-70b-versatile",
    lePdf: false,
    preco: [0.59, 0.79],
    chamar: compativelOpenAI("https://api.groq.com/openai/v1/chat/completions"),
  },
};

const ORDEM_PADRAO: NomeProvedor[] = ["gemini", "openai", "anthropic", "deepseek", "mistral", "groq"];

/** Provedores com chave configurada, na ordem desejada. */
export function provedoresDisponiveis(precisaPdf = false, ambiente: Record<string, string | undefined> = process.env): Provedor[] {
  const pedida = (ambiente.IA_ORDEM ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is NomeProvedor => s in PROVEDORES);
  const ordem = [...new Set([...pedida, ...ORDEM_PADRAO])];
  const lista: Provedor[] = [];
  for (const nome of ordem) {
    const def = PROVEDORES[nome];
    const chave = ambiente[def.variavel]?.trim();
    if (!chave) continue;
    if (precisaPdf && !def.lePdf) continue;
    const modelo = ambiente[`IA_MODELO_${nome.toUpperCase()}`]?.trim() || def.modeloPadrao;
    lista.push({ ...def, chave, modelo });
  }
  return lista;
}

export class ErroIA extends Error {
  constructor(mensagem: string, readonly tentativas: string[] = []) {
    super(mensagem);
  }
}

/** Tenta os provedores em ordem até um responder. */
export async function chamarIA(pedido: PedidoIA, ambiente: Record<string, string | undefined> = process.env): Promise<RespostaIA> {
  const fila = provedoresDisponiveis(Boolean(pedido.pdfBase64), ambiente);
  if (fila.length === 0) throw new ErroIA("Nenhum provedor de IA está configurado.");
  const falhas: string[] = [];
  for (const prov of fila) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
      const r = await prov.chamar(pedido, prov.chave, prov.modelo, controle.signal);
      const custo = (r.tin * prov.preco[0] + r.tout * prov.preco[1]) / 1_000_000;
      return { texto: r.texto, provedor: prov.nome, modelo: prov.modelo, tokensEntrada: r.tin, tokensSaida: r.tout, custo };
    } catch (e) {
      // Nunca registramos a chave; só o nome do provedor e o motivo curto.
      falhas.push(`${prov.nome}: ${e instanceof Error ? e.message.slice(0, 120) : "erro"}`);
    } finally {
      clearTimeout(relogio);
    }
  }
  console.error("[ia] todos os provedores falharam", falhas);
  throw new ErroIA("Todos os provedores de IA falharam.", falhas);
}
