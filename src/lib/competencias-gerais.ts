// As 10 Competências Gerais da Educação Básica (BNCC, 2018). São as mesmas em
// qualquer plano, por isso ficam fixas aqui e o professor só marca as que quiser.

export interface CompetenciaGeral {
  numero: number;
  nome: string;
  texto: string;
}

export const COMPETENCIAS_GERAIS_BNCC: CompetenciaGeral[] = [
  {
    numero: 1,
    nome: "Conhecimento",
    texto:
      "Valorizar e utilizar os conhecimentos historicamente construídos sobre o mundo físico, social, cultural e digital para entender e explicar a realidade, continuar aprendendo e colaborar para a construção de uma sociedade justa, democrática e inclusiva.",
  },
  {
    numero: 2,
    nome: "Pensamento científico, crítico e criativo",
    texto:
      "Exercitar a curiosidade intelectual e recorrer à abordagem própria das ciências, incluindo a investigação, a reflexão, a análise crítica, a imaginação e a criatividade, para investigar causas, elaborar e testar hipóteses, formular e resolver problemas e criar soluções (inclusive tecnológicas) com base nos conhecimentos das diferentes áreas.",
  },
  {
    numero: 3,
    nome: "Repertório cultural",
    texto:
      "Valorizar e fruir as diversas manifestações artísticas e culturais, das locais às mundiais, e também participar de práticas diversificadas da produção artístico-cultural.",
  },
  {
    numero: 4,
    nome: "Comunicação",
    texto:
      "Utilizar diferentes linguagens verbal (oral ou visual-motora, como Libras, e escrita), corporal, visual, sonora e digital, bem como conhecimentos das linguagens artística, matemática e científica, para se expressar e partilhar informações, experiências, ideias e sentimentos em diferentes contextos e produzir sentidos que levem ao entendimento mútuo.",
  },
  {
    numero: 5,
    nome: "Cultura digital",
    texto:
      "Compreender, utilizar e criar tecnologias digitais de informação e comunicação de forma crítica, significativa, reflexiva e ética nas diversas práticas sociais (incluindo as escolares) para se comunicar, acessar e disseminar informações, produzir conhecimentos, resolver problemas e exercer protagonismo e autoria na vida pessoal e coletiva.",
  },
  {
    numero: 6,
    nome: "Trabalho e projeto de vida",
    texto:
      "Valorizar a diversidade de saberes e vivências culturais e apropriar-se de conhecimentos e experiências que lhe possibilitem entender as relações próprias do mundo do trabalho e fazer escolhas alinhadas ao exercício da cidadania e ao seu projeto de vida, com liberdade, autonomia, consciência crítica e responsabilidade.",
  },
  {
    numero: 7,
    nome: "Argumentação",
    texto:
      "Argumentar com base em fatos, dados e informações confiáveis, para formular, negociar e defender ideias, pontos de vista e decisões comuns que respeitem e promovam os direitos humanos, a consciência socioambiental e o consumo responsável em âmbito local, regional e global, com posicionamento ético em relação ao cuidado de si mesmo, dos outros e do planeta.",
  },
  {
    numero: 8,
    nome: "Autoconhecimento e autocuidado",
    texto:
      "Conhecer-se, apreciar-se e cuidar de sua saúde física e emocional, compreendendo-se na diversidade humana e reconhecendo suas emoções e as dos outros, com autocrítica e capacidade para lidar com elas.",
  },
  {
    numero: 9,
    nome: "Empatia e cooperação",
    texto:
      "Exercitar a empatia, o diálogo, a resolução de conflitos e a cooperação, fazendo-se respeitar e promovendo o respeito ao outro e aos direitos humanos, com acolhimento e valorização da diversidade de indivíduos e de grupos sociais, seus saberes, identidades, culturas e potencialidades, sem preconceitos de qualquer natureza.",
  },
  {
    numero: 10,
    nome: "Responsabilidade e cidadania",
    texto:
      "Agir pessoal e coletivamente com autonomia, responsabilidade, flexibilidade, resiliência e determinação, tomando decisões com base em princípios éticos, democráticos, inclusivos, sustentáveis e solidários.",
  },
];
