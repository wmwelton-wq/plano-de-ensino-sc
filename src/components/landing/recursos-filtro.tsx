"use client";

import { useState } from "react";
import { Icone, type NomeIcone } from "@/components/icones";

type Cat = "planejar" | "ia" | "compartilhar" | "seguranca";

const CATEGORIAS: [Cat | "todos", string][] = [
  ["todos", "Tudo"],
  ["planejar", "Planejar"],
  ["ia", "IA e calendário"],
  ["compartilhar", "Entregar e compartilhar"],
  ["seguranca", "Praticidade e segurança"],
];

const RECURSOS: { cat: Cat; tom: string; icone: NomeIcone; titulo: string; texto: string }[] = [
  { cat: "planejar", tom: "azul", icone: "livro", titulo: "BNCC e Currículo Catarinense já cadastrados", texto: "Habilidades, competências e objetos de conhecimento por etapa, componente e curso técnico. Você marca; não digita código por código." },
  { cat: "planejar", tom: "violeta", icone: "graduacao", titulo: "Um formulário certo para cada etapa", texto: "Educação Infantil, Anos Iniciais, Anos Finais e Ensino Médio/Técnico, cada um com os quadros que a etapa pede." },
  { cat: "planejar", tom: "verde", icone: "unidade", titulo: "Plano anual e planos mensais", texto: "Monte o plano anual por trimestre e gere os mensais a partir dele, com os conteúdos já distribuídos." },
  { cat: "planejar", tom: "ambar", icone: "copiar", titulo: "Copie para outras turmas", texto: "Dá aula para várias turmas da mesma série? Reaproveite o plano em um clique e só ajuste o que muda." },
  { cat: "planejar", tom: "ciano", icone: "escola", titulo: "Várias escolas e turmas, uma conta", texto: "Cadastre cada escola com nome, município e logo uma única vez. Troque de escola sem refazer nada." },
  { cat: "ia", tom: "verde", icone: "sparkle", titulo: "Caminho metodológico com IA", texto: "Peça por semana (até 5) ou por aula (até 16). O texto vem no futuro — “Será realizado…” — como rascunho para você editar." },
  { cat: "ia", tom: "azul", icone: "calendarioMes", titulo: "Calendário escolar inteligente", texto: "Feriados nacionais e de Santa Catarina, datas importantes e uma agenda no painel. Envie o PDF do calendário da escola e a IA lê para você." },
  { cat: "compartilhar", tom: "rosa", icone: "baixar", titulo: "PDF, Word e impressão", texto: "Documento no formato que a rede estadual exige, com a logo da sua escola. Baixe, edite no Word ou imprima." },
  { cat: "compartilhar", tom: "ciano", icone: "olho", titulo: "Link de leitura", texto: "Gere um link para a coordenação ou colegas lerem o plano sem precisar de conta. O link tem prazo de validade." },
  { cat: "compartilhar", tom: "violeta", icone: "envelope", titulo: "Envio por e-mail para colegas", texto: "Cadastre seus colegas e envie o plano por e-mail em um clique, com um recado seu." },
  { cat: "seguranca", tom: "ardosia", icone: "globo", titulo: "Instale como aplicativo", texto: "Funciona no navegador do computador e do celular e pode ser instalado na tela inicial, sem loja de aplicativos." },
  { cat: "seguranca", tom: "ambar", icone: "lua", titulo: "Modo escuro e entrada com Google", texto: "Painel confortável para trabalhar à noite e login rápido com a sua conta Google." },
  { cat: "seguranca", tom: "ardosia", icone: "cadeado", titulo: "Seus planos são só seus", texto: "Cada professor só acessa os próprios planos e escolas. A separação é garantida no banco de dados, com conexão sempre criptografada." },
];

export default function RecursosFiltro() {
  const [cat, setCat] = useState<Cat | "todos">("todos");
  const lista = RECURSOS.filter((r) => cat === "todos" || r.cat === cat);

  return (
    <div>
      <div role="tablist" aria-label="Filtrar recursos" className="flex flex-wrap gap-2">
        {CATEGORIAS.map(([id, rotulo]) => (
          <button key={id} type="button" role="tab" aria-selected={cat === id} onClick={() => setCat(id)} className={`ld-chip-filtro ${cat === id ? "ld-chip-filtro-on" : ""}`}>
            {rotulo}
          </button>
        ))}
      </div>
      <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((r) => (
          <article key={r.titulo} data-tom={r.tom} className="ld-card-recurso ld-aparece">
            <span className="ld-card-icone">
              <Icone nome={r.icone} className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-extrabold leading-snug text-slate-900">{r.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.texto}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
