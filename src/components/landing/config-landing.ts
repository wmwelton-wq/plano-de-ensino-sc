// ============================================================================
// ÚNICO LUGAR PARA EDITAR: vídeo de apresentação e planos/preços da página inicial.
// ============================================================================

/**
 * VÍDEO DE APRESENTAÇÃO
 * Quando o vídeo estiver pronto, cole o endereço aqui dentro das aspas:
 *   - YouTube:  "https://www.youtube.com/watch?v=XXXXXXXXXXX"  (ou o link curto youtu.be)
 *   - Vimeo:    "https://vimeo.com/123456789"
 *   - Arquivo:  "/video-plano-docente.mp4"  (coloque o arquivo na pasta "public")
 * Enquanto estiver vazio (""), a página mostra o aviso "Vídeo em breve".
 */
export const VIDEO_URL = "";

/** Imagem de capa do vídeo em arquivo (opcional). Ex.: "/capa-video.jpg" (arquivo na pasta "public"). */
export const VIDEO_CAPA = "";

export interface PlanoPreco {
  id: string;
  nome: string;
  /** Texto do preço. Troque "Valor em breve" por algo como "R$ 29,90" quando definir. */
  preco: string;
  /** Texto pequeno depois do preço. Ex.: "por mês". Deixe "" enquanto o preço não existir. */
  periodo: string;
  /** Frase curta embaixo do nome. */
  resumo: string;
  /** Faixa de destaque no topo do cartão (ex.: "Mais escolhido"). "" para não mostrar. */
  destaque: string;
  /** Lista de benefícios deste plano. */
  itens: string[];
  /** Texto do botão. */
  botao: string;
}

/** Recursos que valem para todos os planos (muda só o período de acesso). */
const INCLUIDO = [
  "Todos os currículos e etapas de ensino",
  "Plano anual, planos mensais e caminho metodológico com IA",
  "PDF, Word e impressão com a logo da escola",
  "Calendário escolar, link de leitura e envio por e-mail",
  "Escolas, turmas e disciplinas na mesma conta",
];

/** Os 3 planos. Quando definir os preços, é só editar os textos abaixo. */
export const PLANOS: PlanoPreco[] = [
  {
    id: "mensal",
    nome: "Mensal",
    preco: "Valor em breve",
    periodo: "",
    resumo: "Para experimentar sem compromisso longo.",
    destaque: "",
    itens: ["Acesso por 1 mês", ...INCLUIDO],
    botao: "Criar conta e acompanhar",
  },
  {
    id: "semestral",
    nome: "Semestral",
    preco: "Valor em breve",
    periodo: "",
    resumo: "Para planejar o semestre com tranquilidade.",
    destaque: "Mais escolhido",
    itens: ["Acesso por 6 meses", ...INCLUIDO],
    botao: "Criar conta e acompanhar",
  },
  {
    id: "anual",
    nome: "Anual",
    preco: "Valor em breve",
    periodo: "",
    resumo: "Para o ano letivo inteiro, com o melhor custo-benefício.",
    destaque: "Melhor custo-benefício",
    itens: ["Acesso por 12 meses", ...INCLUIDO],
    botao: "Criar conta e acompanhar",
  },
];
