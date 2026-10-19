"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EtapaPlano, HabilidadeManual } from "@/lib/database.types";
import { MARCADOR_HTML, prepararCampoParaSalvar } from "@/lib/texto-rico";
import { tituloParaTurma } from "@/lib/copiar-turma";
import { CAMPOS_SECAO, nomeCampoSecao, ordenarComponentes, type SecaoComponente } from "@/lib/secoes-componentes";

export interface EstadoFormulario {
  erro?: string;
}

const ETAPAS_VALIDAS: EtapaPlano[] = [
  "educacao_infantil",
  "fundamental_anos_iniciais",
  "fundamental_anos_finais",
  "ensino_medio",
];

function lerEtapa(formData: FormData): EtapaPlano {
  const valor = formData.get("etapa") as string;
  return (ETAPAS_VALIDAS as string[]).includes(valor) ? (valor as EtapaPlano) : "ensino_medio";
}

function lerVinculo(formData: FormData) {
  const vinculoTipo = formData.get("vinculo_tipo") as string;
  const vinculoId = formData.get("vinculo_id") as string;

  return {
    disciplina_id: vinculoTipo === "disciplina" ? vinculoId : null,
    curso_tecnico_id: vinculoTipo === "curso" ? vinculoId : null,
  };
}

/** Fonte do currículo escolhida no formulário; só gravamos quando o formulário a envia. */
function lerFonteCurriculo(formData: FormData): { fonte_curriculo?: "bncc" | "curriculo_catarinense" } {
  const valor = formData.get("fonte_curriculo");
  return valor === "bncc" || valor === "curriculo_catarinense" ? { fonte_curriculo: valor } : {};
}

/**
 * Habilidades digitais escritas à mão pelo professor (fora da lista). Só
 * gravamos a coluna quando o formulário envia o marcador
 * "tem_habilidades_manuais" — assim formulários que não têm o campo (ex.:
 * Educação Infantil) nunca apagam o que já está salvo. Com o currículo
 * digital desligado, a lista é zerada.
 */
function lerHabilidadesManuais(formData: FormData): { habilidades_manuais?: HabilidadeManual[] } {
  if (!formData.has("tem_habilidades_manuais")) return {};
  if (formData.get("usar_curriculo_digital") !== "on") return { habilidades_manuais: [] };

  const codigos = formData.getAll("habilidade_manual_codigo");
  const descricoes = formData.getAll("habilidade_manual_descricao");
  const lista: HabilidadeManual[] = [];
  descricoes.forEach((d, i) => {
    const descricao = typeof d === "string" ? d.trim().slice(0, 2000) : "";
    if (!descricao) return;
    const c = codigos[i];
    const codigo = typeof c === "string" && c.trim() ? c.trim().slice(0, 40) : null;
    lista.push({ codigo, descricao });
  });
  return { habilidades_manuais: lista.slice(0, 50) };
}

/** "Objetivos (uso interno)": só mexemos na coluna se o formulário enviar o campo. */
function lerObjetivos(formData: FormData): { objetivos?: string | null } {
  return formData.has("objetivos") ? { objetivos: (formData.get("objetivos") as string) || null } : {};
}

function lerHabilidadeIds(formData: FormData) {
  return formData.getAll("habilidade_ids").filter((v): v is string => typeof v === "string" && v.length > 0);
}

function lerCompetenciaIds(formData: FormData) {
  return formData.getAll("competencia_ids").filter((v): v is string => typeof v === "string" && v.length > 0);
}

function lerDisciplinaIds(formData: FormData) {
  return formData.getAll("disciplina_ids").filter((v): v is string => typeof v === "string" && v.length > 0);
}

/**
 * O modelo oficial "PLANO DE AULA DOS ANOS INICIAIS DO ENSINO FUNDAMENTAL"
 * limita o período do plano a, no máximo, 30 dias. Só validamos quando as
 * duas datas foram informadas — os campos continuam opcionais.
 */
function validarPeriodoAnosIniciais(formData: FormData, etapa: EtapaPlano): string | null {
  if (etapa !== "fundamental_anos_iniciais") return null;

  const inicio = formData.get("data_inicio") as string;
  const fim = formData.get("data_fim") as string;
  if (!inicio || !fim) return null;

  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);
  if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) return null;

  const diffDias = (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDias < 0) return "A data de fim não pode ser anterior à data de início.";
  if (diffDias > 30) {
    return "O período do plano não pode ultrapassar 30 dias, conforme o modelo oficial dos Anos Iniciais.";
  }
  return null;
}

async function sincronizarHabilidades(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planoId: string,
  habilidadeIds: string[]
) {
  // RLS em planos_habilidades garante que só é possível vincular habilidades
  // a um plano que pertença ao professor autenticado.
  await supabase.from("planos_habilidades").delete().eq("plano_id", planoId);

  if (habilidadeIds.length > 0) {
    await supabase.from("planos_habilidades").insert(
      habilidadeIds.map((habilidade_id) => ({ plano_id: planoId, habilidade_id }))
    );
  }
}

async function sincronizarCompetencias(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planoId: string,
  competenciaIds: string[]
) {
  // RLS em planos_competencias garante que só é possível vincular competências
  // a um plano que pertença ao professor autenticado.
  await supabase.from("planos_competencias").delete().eq("plano_id", planoId);

  if (competenciaIds.length > 0) {
    await supabase.from("planos_competencias").insert(
      competenciaIds.map((competencia_id) => ({ plano_id: planoId, competencia_id }))
    );
  }
}

async function sincronizarDisciplinas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  planoId: string,
  disciplinaIds: string[]
) {
  // RLS em planos_disciplinas garante que só é possível vincular componentes
  // curriculares a um plano que pertença ao professor autenticado.
  await supabase.from("planos_disciplinas").delete().eq("plano_id", planoId);

  if (disciplinaIds.length > 0) {
    await supabase.from("planos_disciplinas").insert(
      disciplinaIds.map((disciplina_id) => ({ plano_id: planoId, disciplina_id }))
    );
  }
}

/**
 * Anos Iniciais: cada componente curricular tem os seus próprios textos (objetos/conteúdos, caminho
 * metodológico, critérios, instrumentos e recomposição). Só mexemos nisso quando o formulário envia o
 * marcador "tem_secoes". Os campos únicos antigos (usados em outras telas) também são preenchidos, com
 * os textos de todos os componentes juntos, cada um sob o nome do componente.
 */
async function lerSecoesComponentes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
  disciplinaIds: string[]
): Promise<{
  secoes_componentes?: SecaoComponente[];
  conteudos_programaticos?: string | null;
  metodologia?: string | null;
  avaliacao?: string | null;
  instrumentos_avaliacao?: string | null;
}> {
  if (!formData.has("tem_secoes")) return {};
  const ids = Array.from(new Set(disciplinaIds));
  let nomes: { id: string; nome: string }[] = [];
  if (ids.length > 0) {
    const { data } = await supabase.from("disciplinas").select("id, nome").in("id", ids);
    nomes = (data ?? []) as { id: string; nome: string }[];
  }
  const ordem = ordenarComponentes(nomes);

  const secoes: SecaoComponente[] = ordem.map((d) => {
    const secao: SecaoComponente = { disciplina_id: d.id };
    for (const campo of CAMPOS_SECAO) secao[campo] = prepararCampoParaSalvar(formData.get(nomeCampoSecao(campo, d.id)));
    return secao;
  });

  const juntar = (campo: (typeof CAMPOS_SECAO)[number]) => {
    const partes: string[] = [];
    secoes.forEach((secao, i) => {
      const texto = secao[campo];
      if (!texto) return;
      const html = texto.startsWith(MARCADOR_HTML) ? texto.slice(MARCADOR_HTML.length) : texto;
      const nome = ordem[i].nome.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      partes.push(`<p><strong>${nome}</strong></p>${html}`);
    });
    return partes.length > 0 ? prepararCampoParaSalvar(MARCADOR_HTML + partes.join("")) : null;
  };

  return {
    secoes_componentes: secoes,
    conteudos_programaticos: juntar("conteudos"),
    metodologia: juntar("metodologia"),
    avaliacao: juntar("criterios"),
    instrumentos_avaliacao: juntar("instrumentos"),
  };
}

/**
 * Anos Finais e Ensino Médio: o plano tem uma só disciplina, mas Língua Portuguesa e Matemática podem ter
 * "recomposição das aprendizagens". Ela fica na mesma coluna dos Anos Iniciais (secoes_componentes), numa única
 * entrada da disciplina do plano. O marcador "tem_recomposicao" avisa que o formulário cuida disso: assim, trocar
 * de disciplina ou escolher "não" limpa o que havia antes.
 */
function lerRecomposicaoSimples(
  formData: FormData,
  disciplinaId: string | null
): { secoes_componentes?: SecaoComponente[] } {
  if (!formData.has("tem_recomposicao") || formData.has("tem_secoes")) return {};
  if (!disciplinaId) return { secoes_componentes: [] };
  const objetos = prepararCampoParaSalvar(formData.get("recomposicao_objetos"));
  const habilidades = prepararCampoParaSalvar(formData.get("recomposicao_habilidades"));
  if (!objetos && !habilidades) return { secoes_componentes: [] };
  return {
    secoes_componentes: [{ disciplina_id: disciplinaId, recomposicao_objetos: objetos, recomposicao_habilidades: habilidades }],
  };
}

/** Resultado de gravar o plano sem sair da tela (usado pelo salvamento a cada passo). */
export interface ResultadoGravacao {
  id?: string;
  erro?: string;
}

/**
 * Grava o plano (cria se não houver id, atualiza se houver) e devolve o id, SEM redirecionar. É o que faz o
 * "Salvar e continuar" e o salvamento automático: o plano vai sendo guardado enquanto o professor preenche.
 */
async function gravarPlano(planoId: string | null, formData: FormData): Promise<ResultadoGravacao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Faça login novamente." };

  const etapa = lerEtapa(formData);
  const { disciplina_id, curso_tecnico_id } = lerVinculo(formData);
  const disciplinaIds = lerDisciplinaIds(formData);

  if (!disciplina_id && !curso_tecnico_id) {
    return {
      erro:
        etapa === "fundamental_anos_iniciais"
          ? "Selecione ao menos um componente curricular."
          : "Selecione uma disciplina ou um curso técnico.",
    };
  }

  const erroPeriodo = validarPeriodoAnosIniciais(formData, etapa);
  if (erroPeriodo) return { erro: erroPeriodo };

  const titulo = ((formData.get("titulo") as string) || "").trim();
  if (!titulo) return { erro: "Dê um título ao plano (primeiro passo)." };

  const quantidadeAulasRaw = formData.get("quantidade_aulas") as string;
  const escolaId = (formData.get("escola_id") as string) || null;
  if (escolaId) {
    const { data: escola } = await supabase.from("escolas").select("id").eq("id", escolaId).maybeSingle();
    if (!escola) return { erro: "Escolha uma escola da sua lista." };
  }

  const dados = {
    disciplina_id,
    curso_tecnico_id,
    etapa,
    escola_id: escolaId,
    ...lerFonteCurriculo(formData),
    grupo_etario: (formData.get("grupo_etario") as string) || null,
    segundo_professor_nome: (formData.get("segundo_professor_nome") as string) || null,
    incluir_logo_estado: formData.get("incluir_logo_estado") === "on",
    incluir_logo_escola: formData.get("incluir_logo_escola") === "on",
    usar_curriculo_digital: formData.get("usar_curriculo_digital") === "on",
    ...lerHabilidadesManuais(formData),
    titulo,
    ano_letivo: Number(formData.get("ano_letivo")) || new Date().getFullYear(),
    turma: (formData.get("turma") as string) || null,
    data_inicio: (formData.get("data_inicio") as string) || null,
    data_fim: (formData.get("data_fim") as string) || null,
    quantidade_aulas: quantidadeAulasRaw ? Number(quantidadeAulasRaw) : null,
    ...lerObjetivos(formData),
    conteudos_programaticos: prepararCampoParaSalvar(formData.get("conteudos_programaticos")),
    metodologia: prepararCampoParaSalvar(formData.get("metodologia")),
    avaliacao: prepararCampoParaSalvar(formData.get("avaliacao")),
    instrumentos_avaliacao: prepararCampoParaSalvar(formData.get("instrumentos_avaliacao")),
    cronograma: (formData.get("cronograma") as string) || null,
    referencias: (formData.get("referencias") as string) || null,
    status: (formData.get("status") as string) || "rascunho",
    ...(await lerSecoesComponentes(supabase, formData, disciplinaIds)),
    ...lerRecomposicaoSimples(formData, disciplina_id),
  };

  let id = planoId;
  if (id) {
    // RLS em planos_de_ensino garante que este UPDATE só afeta uma linha se ela pertencer ao professor
    // autenticado (professor_id = auth.uid()) — um professor nunca consegue alterar o plano de outro.
    const { error } = await supabase.from("planos_de_ensino").update(dados).eq("id", id);
    if (error) return { erro: "Não foi possível salvar as alterações. Tente novamente." };
  } else {
    const { data, error } = await supabase
      .from("planos_de_ensino")
      .insert({ ...dados, professor_id: user.id })
      .select("id")
      .single();
    if (error || !data) return { erro: "Não foi possível salvar o plano. Tente novamente." };
    id = data.id as string;
  }

  await sincronizarHabilidades(supabase, id, lerHabilidadeIds(formData));
  await sincronizarCompetencias(supabase, id, lerCompetenciaIds(formData));
  if (etapa === "fundamental_anos_iniciais") {
    await sincronizarDisciplinas(supabase, id, disciplinaIds);
  }
  return { id };
}

/** Salva o plano sem sair da tela (botão "Salvar e continuar" e salvamento automático). */
export async function salvarRascunhoPlano(planoId: string | null, formData: FormData): Promise<ResultadoGravacao> {
  const r = await gravarPlano(planoId && /^[0-9a-f-]{36}$/i.test(planoId) ? planoId : null, formData);
  if (r.id) revalidatePath("/dashboard");
  return r;
}

/** Depois de salvar de vez, o professor cai na tela de conclusão (baixar, imprimir, encaminhar, novo plano...). */
function destinoDeConclusao(id: string): string {
  return `/dashboard/planos/${id}/visualizar?concluido=1`;
}

export async function criarPlano(
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const r = await gravarPlano(null, formData);
  if (!r.id) return { erro: r.erro };
  revalidatePath("/dashboard");
  redirect(destinoDeConclusao(r.id));
}

export async function atualizarPlano(
  planoId: string,
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const r = await gravarPlano(planoId, formData);
  if (!r.id) return { erro: r.erro };
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/planos/${planoId}`);
  redirect(destinoDeConclusao(planoId));
}

/** Marca o plano como finalizado (ou volta para rascunho) — usado na tela de conclusão. */
export async function definirStatusPlano(planoId: string, status: "rascunho" | "finalizado"): Promise<{ erro?: string }> {
  if (status !== "rascunho" && status !== "finalizado") return { erro: "Situação inválida." };
  const supabase = await createClient();
  const { error } = await supabase.from("planos_de_ensino").update({ status, updated_at: new Date().toISOString() }).eq("id", planoId);
  if (error) return { erro: "Não foi possível mudar a situação agora." };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/meus-planos");
  revalidatePath(`/dashboard/planos/${planoId}`);
  return {};
}

export async function excluirPlano(planoId: string) {
  const supabase = await createClient();
  await supabase.from("planos_de_ensino").delete().eq("id", planoId);
  revalidatePath("/dashboard");
  redirect("/dashboard/meus-planos");
}

/**
 * Cria cópias do plano para outras ESCOLAS. Cada cópia nasce como rascunho,
 * guarda a referência ao plano de origem (replicado_de_id) e leva junto as
 * habilidades, competências e componentes escolhidos. Para cada escola o
 * professor pode ajustar título, turma, período e número de aulas; o restante
 * do plano pode ser editado depois (ou logo em seguida, com "abrir_edicao").
 */
export async function replicarPlano(
  planoId: string,
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const escolaIds = Array.from(
    new Set(
      formData
        .getAll("escola_ids")
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );
  if (escolaIds.length === 0) {
    return { erro: "Selecione ao menos uma escola de destino." };
  }
  if (escolaIds.length > 30) {
    return { erro: "Replique para no máximo 30 escolas por vez." };
  }

  // O RLS garante que só enxergamos planos e escolas do próprio professor.
  const [{ data: origem }, { data: escolasDestino }] = await Promise.all([
    supabase.from("planos_de_ensino").select("*").eq("id", planoId).single(),
    supabase.from("escolas").select("id, nome").in("id", escolaIds),
  ]);
  if (!origem) {
    return { erro: "Plano de origem não encontrado." };
  }
  const nomePorEscola = new Map<string, string>(
    (escolasDestino ?? []).map((e: { id: string; nome: string }): [string, string] => [e.id, e.nome])
  );
  if (escolaIds.some((id) => !nomePorEscola.has(id))) {
    return { erro: "Alguma das escolas selecionadas não foi encontrada. Atualize a página e tente de novo." };
  }

  const [{ data: hab }, { data: comp }, { data: disc }] = await Promise.all([
    supabase.from("planos_habilidades").select("habilidade_id").eq("plano_id", planoId),
    supabase.from("planos_competencias").select("competencia_id").eq("plano_id", planoId),
    supabase.from("planos_disciplinas").select("disciplina_id").eq("plano_id", planoId),
  ]);

  const base: Record<string, unknown> = { ...origem };
  for (const campo of ["id", "created_at", "updated_at", "pdf_path", "pdf_gerado_em"]) {
    delete base[campo];
  }

  const texto = (chave: string, padrao: string | null) => {
    const v = formData.get(chave);
    if (typeof v !== "string") return padrao;
    const limpo = v.trim();
    return limpo.length > 0 ? limpo : null;
  };

  // Valida tudo antes de criar a primeira cópia (assim não fica pela metade).
  const copias = escolaIds.map((escolaId) => {
    const nomeEscola = nomePorEscola.get(escolaId) ?? "";
    const quantidadeRaw = texto(`quantidade_aulas_${escolaId}`, null);
    return {
      escolaId,
      nomeEscola,
      titulo: texto(`titulo_${escolaId}`, origem.titulo) ?? origem.titulo,
      turma: texto(`turma_${escolaId}`, null),
      data_inicio: texto(`data_inicio_${escolaId}`, null),
      data_fim: texto(`data_fim_${escolaId}`, null),
      quantidade_aulas: quantidadeRaw && Number(quantidadeRaw) > 0 ? Number(quantidadeRaw) : null,
    };
  });

  if (origem.etapa === "fundamental_anos_iniciais") {
    for (const c of copias) {
      if (!c.data_inicio || !c.data_fim) continue;
      const dias = (new Date(c.data_fim).getTime() - new Date(c.data_inicio).getTime()) / 86400000;
      if (dias < 0) return { erro: `${c.nomeEscola}: a data de fim não pode ser anterior à data de início.` };
      if (dias > 30) {
        return { erro: `${c.nomeEscola}: o período do plano não pode ultrapassar 30 dias (modelo oficial dos Anos Iniciais).` };
      }
    }
  }

  const criados: string[] = [];
  for (const c of copias) {
    const { data: novo, error } = await supabase
      .from("planos_de_ensino")
      .insert({
        ...base,
        escola_id: c.escolaId,
        titulo: c.titulo,
        turma: c.turma,
        data_inicio: c.data_inicio,
        data_fim: c.data_fim,
        quantidade_aulas: c.quantidade_aulas,
        status: "rascunho",
        gerado_por_ia: false,
        replicado_de_id: planoId,
      })
      .select("id")
      .single();

    if (error || !novo) {
      return {
        erro:
          criados.length > 0
            ? `Foram criados ${criados.length} plano(s), mas houve falha ao criar o da escola "${c.nomeEscola}". Confira em "Meus planos".`
            : "Não foi possível replicar o plano. Tente novamente.",
      };
    }
    criados.push(novo.id);

    if (hab && hab.length > 0) {
      await supabase
        .from("planos_habilidades")
        .insert(hab.map((h) => ({ plano_id: novo.id, habilidade_id: h.habilidade_id })));
    }
    if (comp && comp.length > 0) {
      await supabase
        .from("planos_competencias")
        .insert(comp.map((x) => ({ plano_id: novo.id, competencia_id: x.competencia_id })));
    }
    if (disc && disc.length > 0) {
      await supabase
        .from("planos_disciplinas")
        .insert(disc.map((d) => ({ plano_id: novo.id, disciplina_id: d.disciplina_id })));
    }
  }

  revalidatePath("/dashboard");
  if (formData.get("abrir_edicao") === "on" && criados.length > 0) {
    redirect(`/dashboard/planos/${criados[0]}`);
  }
  redirect("/dashboard/meus-planos");
}

/**
 * Copiar um plano para outras turmas (por padrão da mesma escola e do mesmo ano/série; o professor pode trocar a
 * série de cada cópia). Cada cópia nasce como rascunho e leva o conteúdo, as habilidades e as competências.
 */
export async function replicarParaTurmas(
  planoId: string,
  _estadoAnterior: EstadoFormulario,
  formData: FormData
): Promise<EstadoFormulario> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { erro: "Sessão expirada. Faça login novamente." };
  }

  const vistos = new Set<string>();
  const turmas: string[] = [];
  for (const v of formData.getAll("turma_destino")) {
    if (typeof v !== "string") continue;
    const limpo = v.trim().slice(0, 60);
    const chave = limpo.toLowerCase();
    if (!limpo || vistos.has(chave)) continue;
    vistos.add(chave);
    turmas.push(limpo);
  }
  if (turmas.length === 0) {
    return { erro: "Escreva o nome de pelo menos uma turma de destino." };
  }
  if (turmas.length > 30) {
    return { erro: "Copie para no máximo 30 turmas por vez." };
  }

  const { data: origem } = await supabase.from("planos_de_ensino").select("*").eq("id", planoId).single();
  if (!origem) {
    return { erro: "Plano de origem não encontrado." };
  }

  // Escola de destino: a do plano original, a menos que o professor escolha outra (o RLS só mostra as dele).
  const escolaPedida = formData.get("escola_id");
  let escolaId: string | null = origem.escola_id ?? null;
  if (typeof escolaPedida === "string" && escolaPedida !== (origem.escola_id ?? "")) {
    if (escolaPedida === "") {
      escolaId = null;
    } else {
      const { data: escola } = await supabase.from("escolas").select("id").eq("id", escolaPedida).single();
      if (!escola) return { erro: "A escola escolhida não foi encontrada. Atualize a página e tente de novo." };
      escolaId = escola.id;
    }
  }

  const texto = (chave: string, padrao: string | null) => {
    const v = formData.get(chave);
    if (typeof v !== "string") return padrao;
    const limpo = v.trim();
    return limpo.length > 0 ? limpo : null;
  };
  const dataInicio = texto("data_inicio", origem.data_inicio ?? null);
  const dataFim = texto("data_fim", origem.data_fim ?? null);
  const quantidadeRaw = texto("quantidade_aulas", origem.quantidade_aulas != null ? String(origem.quantidade_aulas) : null);
  const quantidadeAulas = quantidadeRaw && Number(quantidadeRaw) > 0 ? Number(quantidadeRaw) : null;

  if (origem.etapa === "fundamental_anos_iniciais" && dataInicio && dataFim) {
    const dias = (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / 86400000;
    if (dias < 0) return { erro: "A data de fim não pode ser anterior à data de início." };
    if (dias > 30) return { erro: "O período do plano não pode ultrapassar 30 dias (modelo oficial dos Anos Iniciais)." };
  }

  const [{ data: hab }, { data: comp }, { data: disc }] = await Promise.all([
    supabase.from("planos_habilidades").select("habilidade_id").eq("plano_id", planoId),
    supabase.from("planos_competencias").select("competencia_id").eq("plano_id", planoId),
    supabase.from("planos_disciplinas").select("disciplina_id").eq("plano_id", planoId),
  ]);

  const base: Record<string, unknown> = { ...origem };
  for (const campo of ["id", "created_at", "updated_at", "pdf_path", "pdf_gerado_em"]) {
    delete base[campo];
  }

  const criados: string[] = [];
  for (const turma of turmas) {
    const { data: novo, error } = await supabase
      .from("planos_de_ensino")
      .insert({
        ...base,
        escola_id: escolaId,
        titulo: tituloParaTurma(origem.titulo, origem.turma ?? null, turma),
        turma,
        data_inicio: dataInicio,
        data_fim: dataFim,
        quantidade_aulas: quantidadeAulas,
        status: "rascunho",
        gerado_por_ia: false,
        replicado_de_id: planoId,
      })
      .select("id")
      .single();

    if (error || !novo) {
      return {
        erro:
          criados.length > 0
            ? `Foram criados ${criados.length} plano(s), mas houve falha ao criar o da turma "${turma}". Confira em "Meus planos".`
            : "Não foi possível copiar o plano. Tente novamente.",
      };
    }
    criados.push(novo.id);

    if (hab && hab.length > 0) {
      await supabase.from("planos_habilidades").insert(hab.map((h) => ({ plano_id: novo.id, habilidade_id: h.habilidade_id })));
    }
    if (comp && comp.length > 0) {
      await supabase.from("planos_competencias").insert(comp.map((x) => ({ plano_id: novo.id, competencia_id: x.competencia_id })));
    }
    if (disc && disc.length > 0) {
      await supabase.from("planos_disciplinas").insert(disc.map((d) => ({ plano_id: novo.id, disciplina_id: d.disciplina_id })));
    }
  }

  revalidatePath("/dashboard");
  if (formData.get("abrir_edicao") === "on" && criados.length > 0) {
    redirect(`/dashboard/planos/${criados[0]}`);
  }
  redirect("/dashboard/meus-planos");
}
