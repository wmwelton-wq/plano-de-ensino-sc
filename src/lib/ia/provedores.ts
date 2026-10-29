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
  /** Provedores que falharam antes de este responder (ex.: "gemini: HTTP 503 ..."). Vazio quando de primeira. */
  falhas: string[];
  /** Tempo total da chamada, em milissegundos. */
  duracaoMs: number;
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

/** Tempo máximo de uma tentativa em um provedor. */
const TEMPO_LIMITE_MS = 40_000;
/** Tempo total para todos os provedores juntos (a função da Vercel tem limite de ~60 s). */
const TEMPO_TOTAL_MS = 56_000;
/** Pausa antes de repetir um provedor que respondeu "ocupado". */
const PAUSA_REPETIR_MS = 1_500;

/** Erros passageiros (provedor sobrecarregado ou com limite momentâneo): vale tentar o mesmo provedor de novo. */
function erroPassageiro(e: unknown): boolean {
  const m = e instanceof Error ? e.message : "";
  return /^HTTP (429|500|502|503|504)\b/.test(m);
}

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
    const host = new URL(url).hostname;
    if (host === "api.openai.com") corpo.max_completion_tokens = p.maxTokens;
    else corpo.max_tokens = p.maxTokens;
    if (p.json) corpo.response_format = { type: "json_object" };
    // Modelos "gpt-oss" (Groq) raciocinam antes de responder; raciocínio curto gasta menos tempo e menos tokens.
    if (host === "api.groq.com" && modelo.includes("gpt-oss")) corpo.reasoning_effort = "low";
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
    // O Groq desligou o llama-3.3-70b-versatile em 16/08/2026; o gpt-oss-120b é o substituto de produção indicado por eles.
    modeloPadrao: "openai/gpt-oss-120b",
    lePdf: false,
    preco: [0.15, 0.6],
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
  constructor(mensagem: string, readonly tentativas: string[] = [], readonly duracaoMs = 0) {
    super(mensagem);
  }
}

/** Texto curto, sem chaves nem dados de professores, para guardar no registro de uso (só o provedor e o motivo). */
export function resumoDoErro(e: unknown, falhasAntes: string[] = []): string {
  if (e instanceof ErroIA) return e.tentativas.join(" | ").slice(0, 500) || e.message;
  const msg = e instanceof Error ? e.message.slice(0, 200) : "erro";
  return [...falhasAntes, msg].join(" | ").slice(0, 500);
}

/** Tenta os provedores em ordem até um responder. */
export async function chamarIA(pedido: PedidoIA, ambiente: Record<string, string | undefined> = process.env): Promise<RespostaIA> {
  const fila = provedoresDisponiveis(Boolean(pedido.pdfBase64), ambiente);
  if (fila.length === 0) throw new ErroIA("Nenhum provedor de IA está configurado.");
  const falhas: string[] = [];
  const inicio = Date.now();
  for (const prov of fila) {
    // Até 2 tentativas por provedor, só quando o erro é passageiro (ex.: "alta demanda").
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      const restante = TEMPO_TOTAL_MS - (Date.now() - inicio);
      if (restante < 6_000) break;
      const controle = new AbortController();
      const relogio = setTimeout(() => controle.abort(), Math.min(TEMPO_LIMITE_MS, restante - 2_000));
      try {
        const r = await prov.chamar(pedido, prov.chave, prov.modelo, controle.signal);
        const custo = (r.tin * prov.preco[0] + r.tout * prov.preco[1]) / 1_000_000;
        return { texto: r.texto, provedor: prov.nome, modelo: prov.modelo, tokensEntrada: r.tin, tokensSaida: r.tout, custo, falhas, duracaoMs: Date.now() - inicio };
      } catch (e) {
        // Nunca registramos a chave; só o nome do provedor e o motivo curto.
        falhas.push(`${prov.nome}: ${e instanceof Error ? e.message.slice(0, 120) : "erro"}`);
        if (tentativa === 1 && erroPassageiro(e)) {
          await dormir(PAUSA_REPETIR_MS);
          continue;
        }
        break;
      } finally {
        clearTimeout(relogio);
      }
    }
  }
  console.error("[ia] todos os provedores falharam", falhas);
  throw new ErroIA("Todos os provedores de IA falharam.", falhas, Date.now() - inicio);
}

export interface ResultadoTeste {
  provedor: NomeProvedor;
  modelo: string;
  lePdf: boolean;
  configurado: boolean;
  ok?: boolean;
  ms?: number;
  erro?: string;
  custo?: number;
}

/** Lista os provedores (com ou sem chave) na ordem de uso, sem chamar ninguém e sem expor nenhuma chave. */
export function listarProvedores(ambiente: Record<string, string | undefined> = process.env): ResultadoTeste[] {
  const configurados = provedoresDisponiveis(false, ambiente);
  const nomes = new Set(configurados.map((p) => p.nome));
  const resto = ORDEM_PADRAO.filter((n) => !nomes.has(n));
  return [
    ...configurados.map((p): ResultadoTeste => ({ provedor: p.nome, modelo: p.modelo, lePdf: p.lePdf, configurado: true })),
    ...resto.map((n): ResultadoTeste => ({ provedor: n, modelo: ambiente[`IA_MODELO_${n.toUpperCase()}`]?.trim() || PROVEDORES[n].modeloPadrao, lePdf: PROVEDORES[n].lePdf, configurado: false })),
  ];
}

/** Teste rápido (uma frase minúscula) em cada provedor com chave. Só o administrador chama isto; custa frações de centavo. */
export async function testarProvedores(ambiente: Record<string, string | undefined> = process.env): Promise<ResultadoTeste[]> {
  const configurados = new Map(provedoresDisponiveis(false, ambiente).map((p) => [p.nome, p]));
  const ordem = [...new Set([...provedoresDisponiveis(false, ambiente).map((p) => p.nome), ...ORDEM_PADRAO])];
  return Promise.all(
    ordem.map(async (nome): Promise<ResultadoTeste> => {
      const def = PROVEDORES[nome];
      const prov = configurados.get(nome);
      if (!prov) return { provedor: nome, modelo: ambiente[`IA_MODELO_${nome.toUpperCase()}`]?.trim() || def.modeloPadrao, lePdf: def.lePdf, configurado: false };
      const inicio = Date.now();
      const controle = new AbortController();
      const relogio = setTimeout(() => controle.abort(), 20_000);
      try {
        const r = await prov.chamar({ sistema: "Responda só com a palavra: ok", usuario: "Teste de funcionamento.", maxTokens: 300, temperatura: 0 }, prov.chave, prov.modelo, controle.signal);
        return { provedor: nome, modelo: prov.modelo, lePdf: def.lePdf, configurado: true, ok: true, ms: Date.now() - inicio, custo: (r.tin * prov.preco[0] + r.tout * prov.preco[1]) / 1_000_000 };
      } catch (e) {
        return { provedor: nome, modelo: prov.modelo, lePdf: def.lePdf, configurado: true, ok: false, ms: Date.now() - inicio, erro: (e instanceof Error ? e.message : "erro").slice(0, 200) };
      } finally {
        clearTimeout(relogio);
      }
    })
  );
}
