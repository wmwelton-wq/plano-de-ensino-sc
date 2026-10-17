// Sugestões de marcar para as colunas "Critérios de avaliação" e "Metodologia" do plano anual.
// São pontos de partida: o professor marca, edita ou digita as suas próprias.

import { CRITERIOS_AVALIACAO, ordenarAlfabeticamente } from "@/app/dashboard/planos/sugestoes-avaliacao";
import { chaveTexto } from "./plano-anual";
import type { OpcaoLista } from "./dados-anuais";

export const METODOLOGIAS_SUGERIDAS: string[] = [
  "Aula expositiva dialogada, com problematização inicial e retomada dos conhecimentos prévios",
  "Atividades práticas e experimentais",
  "Trabalhos em duplas e em grupos, com divisão de tarefas",
  "Leitura, interpretação e produção de textos de diferentes gêneros",
  "Pesquisa orientada e socialização dos resultados",
  "Resolução de situações-problema e de exercícios de fixação",
  "Rodas de conversa e debates orientados",
  "Seminários e apresentações orais",
  "Jogos, brincadeiras e atividades lúdicas",
  "Uso de recursos digitais, audiovisuais e plataformas educacionais",
  "Estudo do meio e aulas em espaços não formais",
  "Projetos e sequências didáticas interdisciplinares",
  "Uso de mapas, gráficos, tabelas, esquemas e mapas conceituais",
  "Organização de mural, cartazes e produções coletivas",
  "Atendimento individualizado e retomada dos conteúdos com estudantes que precisam de apoio",
  "Recuperação paralela ao longo do trimestre",
  "Avaliação diagnóstica no início do trimestre para planejar as aulas",
  "Estratégias de ensino que respeitam as necessidades e o ritmo de cada estudante (inclusão)",
];

const comoOpcoes = (prefixo: string, itens: string[], grupo: string): OpcaoLista[] =>
  itens.map((texto) => ({ id: `${prefixo}:${chaveTexto(texto).slice(0, 60)}`, texto, grupo, anos: [] }));

export const OPCOES_CRITERIOS: OpcaoLista[] = comoOpcoes("crit", ordenarAlfabeticamente(CRITERIOS_AVALIACAO), "Critério de avaliação");
export const OPCOES_METODOLOGIA_BASE: OpcaoLista[] = comoOpcoes("met", METODOLOGIAS_SUGERIDAS, "Estratégia de ensino");

const MODELOS_METODOLOGIA = [
  (o: string) => `Aula expositiva dialogada e problematização inicial sobre ${o}`,
  (o: string) => `Atividades práticas, em duplas ou grupos, para explorar ${o}`,
  (o: string) => `Pesquisa orientada e socialização dos resultados sobre ${o}`,
  (o: string) => `Resolução de situações-problema envolvendo ${o}`,
  (o: string) => `Uso de recursos digitais e audiovisuais para aprofundar ${o}`,
];

/** Sugestões de metodologia montadas com os objetos de conhecimento que o professor marcou no trimestre. */
export function metodologiaDosObjetos(objetos: string[]): OpcaoLista[] {
  const unicos = Array.from(new Set(objetos.map((o) => o.trim()).filter(Boolean))).slice(0, 8);
  return unicos.map((o, i) => {
    const texto = MODELOS_METODOLOGIA[i % MODELOS_METODOLOGIA.length](o);
    return { id: `meto:${chaveTexto(texto).slice(0, 70)}`, texto, grupo: "Sobre os objetos que você marcou", anos: [] };
  });
}
