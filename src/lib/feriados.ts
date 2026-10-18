// Feriados e datas especiais do Brasil e de Santa Catarina, calculados por código (valem para qualquer ano, sem tabela
// para atualizar), e contagem de dias letivos/aulas. Sem DOM e sem Supabase.

export type TipoEvento = "feriado" | "recesso" | "evento" | "projeto" | "prova" | "reuniao" | "outro";

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  feriado: "Feriado",
  recesso: "Recesso",
  evento: "Evento da escola",
  projeto: "Projeto",
  prova: "Avaliação/prova",
  reuniao: "Reunião",
  outro: "Outro",
};

/** Quando o professor escolhe o tipo, já sugerimos se aquele dia fica sem aula. */
export const SEM_AULA_PADRAO: Record<TipoEvento, boolean> = {
  feriado: true,
  recesso: true,
  evento: false,
  projeto: false,
  prova: false,
  reuniao: false,
  outro: false,
};

export interface EventoCalendario {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  sem_aula: boolean;
  data_inicio: string; // AAAA-MM-DD
  data_fim: string; // AAAA-MM-DD
  observacao?: string | null;
  escola_id?: string | null;
  origem?: "manual" | "pdf";
}

export interface DataOficial {
  data: string;
  titulo: string;
  /** feriado = feriado de verdade; facultativo = ponto facultativo; comemorativa = só uma data lembrada. */
  natureza: "feriado" | "facultativo" | "comemorativa";
  semAula: boolean;
  esfera: "nacional" | "estadual";
  nota?: string;
}

const dois = (n: number) => String(n).padStart(2, "0");

/** Data (AAAA-MM-DD) a partir de ano/mês(1-12)/dia, sem fuso horário. */
export function iso(ano: number, mes: number, dia: number): string {
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

function paraUtc(d: string): number {
  const [a, m, dia] = d.split("-").map(Number);
  return Date.UTC(a, m - 1, dia);
}

export function somarDias(d: string, n: number): string {
  const t = new Date(paraUtc(d) + n * 86400000);
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** 0 = domingo ... 6 = sábado. */
export function diaDaSemana(d: string): number {
  return new Date(paraUtc(d)).getUTCDay();
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): string {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(ano, mes, dia);
}

/** Feriados nacionais, pontos facultativos usuais e a Data Magna de SC, para o ano. */
export function datasOficiais(ano: number): DataOficial[] {
  const p = pascoa(ano);
  const nac = (data: string, titulo: string, extra: Partial<DataOficial> = {}): DataOficial => ({
    data,
    titulo,
    natureza: "feriado",
    semAula: true,
    esfera: "nacional",
    ...extra,
  });

  // Data Magna de Santa Catarina: 11/08; se não cair no domingo, a comemoração vai para o domingo seguinte (Lei 18.531/2022).
  const dm = iso(ano, 8, 11);
  const dow = diaDaSemana(dm);
  const dataMagna = dow === 0 ? dm : somarDias(dm, 7 - dow);

  const lista: DataOficial[] = [
    nac(iso(ano, 1, 1), "Confraternização Universal"),
    nac(somarDias(p, -48), "Carnaval (segunda-feira)", { natureza: "facultativo", nota: "Ponto facultativo; a maioria das escolas não tem aula." }),
    nac(somarDias(p, -47), "Carnaval (terça-feira)", { natureza: "facultativo", nota: "Ponto facultativo; a maioria das escolas não tem aula." }),
    nac(somarDias(p, -46), "Quarta-feira de Cinzas", { natureza: "facultativo", semAula: false, nota: "Ponto facultativo até as 14h. Confira o calendário da sua escola." }),
    nac(somarDias(p, -2), "Sexta-feira Santa"),
    nac(iso(ano, 4, 21), "Tiradentes"),
    nac(iso(ano, 5, 1), "Dia do Trabalho"),
    nac(somarDias(p, 60), "Corpus Christi", { natureza: "facultativo", nota: "Ponto facultativo; a maioria das escolas não tem aula." }),
    nac(iso(ano, 9, 7), "Independência do Brasil"),
    nac(iso(ano, 10, 12), "Nossa Senhora Aparecida"),
    { data: iso(ano, 10, 15), titulo: "Dia do Professor", natureza: "comemorativa", semAula: false, esfera: "nacional", nota: "Em muitas escolas não há aula. Confira o calendário da sua escola." },
    { data: iso(ano, 10, 28), titulo: "Dia do Servidor Público", natureza: "facultativo", semAula: false, esfera: "nacional", nota: "Ponto facultativo nos órgãos públicos. Confira o calendário da sua escola." },
    nac(iso(ano, 11, 2), "Finados"),
    nac(iso(ano, 11, 15), "Proclamação da República"),
    nac(iso(ano, 11, 20), "Consciência Negra"),
    { data: iso(ano, 12, 24), titulo: "Véspera de Natal", natureza: "facultativo", semAula: false, esfera: "nacional", nota: "Ponto facultativo. Confira o calendário da sua escola." },
    nac(iso(ano, 12, 25), "Natal"),
    { data: iso(ano, 12, 31), titulo: "Véspera de Ano Novo", natureza: "facultativo", semAula: false, esfera: "nacional", nota: "Ponto facultativo. Confira o calendário da sua escola." },
    {
      data: dataMagna,
      titulo: "Data Magna de Santa Catarina",
      natureza: "feriado",
      semAula: false,
      esfera: "estadual",
      nota: "Feriado estadual (11/08), transferido para o domingo seguinte (Lei estadual 18.531/2022).",
    },
  ];
  return lista.sort((x, y) => x.data.localeCompare(y.data));
}

/** Todos os dias (AAAA-MM-DD) entre duas datas, inclusive. */
export function diasEntre(inicio: string, fim: string): string[] {
  const saida: string[] = [];
  if (!inicio || !fim || fim < inicio) return saida;
  let d = inicio;
  let guarda = 0;
  while (d <= fim && guarda++ < 800) {
    saida.push(d);
    d = somarDias(d, 1);
  }
  return saida;
}

/** Conjunto dos dias SEM AULA entre duas datas (feriados oficiais com "sem aula" + eventos do professor marcados assim). */
export function diasSemAula(inicio: string, fim: string, eventos: EventoCalendario[]): Set<string> {
  const set = new Set<string>();
  if (!inicio || !fim || fim < inicio) return set;
  const anos = new Set<number>();
  for (let a = Number(inicio.slice(0, 4)); a <= Number(fim.slice(0, 4)); a++) anos.add(a);
  for (const a of anos) {
    for (const o of datasOficiais(a)) if (o.semAula) set.add(o.data);
  }
  for (const e of eventos) {
    if (!e.sem_aula) continue;
    for (const d of diasEntre(e.data_inicio < inicio ? inicio : e.data_inicio, e.data_fim > fim ? fim : e.data_fim)) set.add(d);
  }
  return set;
}

export interface ResumoPeriodo {
  /** Dias de segunda a sexta no período. */
  diasUteis: number;
  /** Dias de segunda a sexta sem aula (feriados e recessos). */
  diasSemAula: number;
  /** Dias letivos (segunda a sexta com aula). */
  diasLetivos: number;
}

export function resumirPeriodo(inicio: string, fim: string, eventos: EventoCalendario[]): ResumoPeriodo {
  const sem = diasSemAula(inicio, fim, eventos);
  let uteis = 0;
  let semAula = 0;
  for (const d of diasEntre(inicio, fim)) {
    const w = diaDaSemana(d);
    if (w === 0 || w === 6) continue;
    uteis++;
    if (sem.has(d)) semAula++;
  }
  return { diasUteis: uteis, diasSemAula: semAula, diasLetivos: uteis - semAula };
}

/** Horário do professor com a turma: dias da semana (0-6) em que há aula e quantas aulas por dia. */
export interface HorarioAulas {
  dias: number[];
  aulasPorDia: number;
}

/** Quantas aulas cabem no período, descontando feriados e recessos. */
export function contarAulas(inicio: string, fim: string, eventos: EventoCalendario[], horario: HorarioAulas): number {
  if (horario.dias.length === 0 || horario.aulasPorDia <= 0) return 0;
  const sem = diasSemAula(inicio, fim, eventos);
  let aulas = 0;
  for (const d of diasEntre(inicio, fim)) {
    if (horario.dias.includes(diaDaSemana(d)) && !sem.has(d)) aulas += horario.aulasPorDia;
  }
  return aulas;
}

/** Eventos do professor que tocam o período (de início a fim). */
export function eventosNoPeriodo(eventos: EventoCalendario[], inicio: string, fim: string): EventoCalendario[] {
  if (!inicio || !fim || fim < inicio) return [];
  return eventos.filter((e) => e.data_fim >= inicio && e.data_inicio <= fim).sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
}

/** "15/03" ou "15/03 a 18/03". */
export function rotuloPeriodo(inicio: string, fim: string): string {
  const f = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return inicio === fim ? f(inicio) : `${f(inicio)} a ${f(fim)}`;
}

export const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const NOMES_DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
