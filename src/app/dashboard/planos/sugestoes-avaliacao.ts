/**
 * Sugestões para os campos de avaliação. São pontos de partida: o professor
 * pode usar, editar ou escrever os seus próprios. A lista é exibida em ordem
 * alfabética (ver ordenarAlfabeticamente).
 */

export const CRITERIOS_AVALIACAO: string[] = [
  "Aplicação dos conhecimentos em situações do cotidiano",
  "Apresentação e organização dos trabalhos e das atividades",
  "Assiduidade e pontualidade",
  "Autonomia na realização das atividades",
  "Capacidade de análise e interpretação de textos, imagens e dados",
  "Capacidade de argumentação e posicionamento crítico",
  "Capacidade de síntese e organização das ideias",
  "Clareza na comunicação oral e escrita",
  "Compreensão dos conceitos trabalhados",
  "Comprometimento com as atividades propostas",
  "Cooperação e trabalho em equipe",
  "Criatividade e originalidade nas produções",
  "Cumprimento dos prazos estabelecidos",
  "Domínio do vocabulário específico do componente curricular",
  "Envolvimento e participação nas aulas",
  "Evolução da aprendizagem ao longo do período",
  "Formulação de hipóteses e busca de soluções para problemas",
  "Interesse e curiosidade pelos conteúdos estudados",
  "Participação em debates, rodas de conversa e discussões",
  "Pesquisa e uso adequado de fontes de informação",
  "Postura ética e respeito à diversidade",
  "Realização das atividades em sala e extraclasse",
  "Registro e organização do caderno",
  "Relação entre teoria e prática",
  "Resolução de problemas e situações-problema",
  "Respeito às regras de convivência e aos colegas",
  "Responsabilidade com o material e com o ambiente escolar",
  "Superação das dificuldades e progresso individual",
  "Uso adequado das tecnologias digitais",
  "Uso correto da língua portuguesa na modalidade escrita e oral",
];

export const INSTRUMENTOS_AVALIACAO: string[] = [
  "Apresentações orais",
  "Atividades práticas e experimentais",
  "Autoavaliação",
  "Avaliação diagnóstica",
  "Avaliação escrita (prova)",
  "Avaliação oral",
  "Caderno de registros",
  "Debates",
  "Diário de bordo",
  "Estudos de caso",
  "Exercícios de fixação",
  "Fichas de observação",
  "Jogos educativos",
  "Leitura e interpretação de textos",
  "Listas de exercícios",
  "Mapas conceituais e mentais",
  "Observação e registro do professor",
  "Pesquisas orientadas",
  "Portfólio",
  "Produção de cartazes e murais",
  "Produção de textos",
  "Produção audiovisual (vídeos, podcasts)",
  "Projetos interdisciplinares",
  "Questionários",
  "Relatórios de aulas práticas",
  "Rodas de conversa",
  "Seminários",
  "Simulados",
  "Trabalhos em grupo",
  "Trabalhos individuais",
  "Uso de plataformas e recursos digitais",
];

export function ordenarAlfabeticamente(itens: string[]): string[] {
  return [...itens].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
}
