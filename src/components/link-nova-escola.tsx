"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function montar(caminho: string, busca: string): string {
  return `/dashboard/escolas/nova?voltar=${encodeURIComponent(caminho + busca)}`;
}

/** Resultado do "guardar antes de sair" registrado pelo formulário do plano. */
type AntesDeSair = () => Promise<{ id?: string | null }>;
let antesDeSair: AntesDeSair | null = null;

/** O formulário do plano registra aqui como guardar o que já foi preenchido antes de sair da tela. */
export function registrarAntesDeSair(fn: AntesDeSair): () => void {
  antesDeSair = fn;
  return () => {
    if (antesDeSair === fn) antesDeSair = null;
  };
}

const CHAVE_COPIA = "plano-docente:copia-formulario";
const TIPOS_IGNORADOS = new Set(["hidden", "file", "submit", "button", "reset", "password", "image"]);

interface CampoCopiado {
  nome: string;
  indice: number;
  tipo: string;
  valor: string;
  marcado: boolean;
}

/**
 * Plano ainda sem título/disciplina não pode ir para o banco; então guardamos uma cópia dos campos
 * simples na própria sessão do navegador, para devolvê-los quando o professor voltar.
 */
function copiarCampos(form: HTMLFormElement, caminho: string) {
  try {
    const campos: CampoCopiado[] = [];
    const contagem: Record<string, number> = {};
    for (const el of Array.from(form.elements)) {
      const c = el as HTMLInputElement;
      if (!c.name || TIPOS_IGNORADOS.has(c.type)) continue;
      const indice = (contagem[c.name] = (contagem[c.name] ?? -1) + 1);
      campos.push({ nome: c.name, indice, tipo: c.type, valor: c.value, marcado: c.checked });
    }
    sessionStorage.setItem(CHAVE_COPIA, JSON.stringify({ caminho, quando: Date.now(), campos }));
  } catch {
    /* sem armazenamento: o formulário volta vazio, como antes */
  }
}

function definirValor(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, valor: string) {
  const proto =
    el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (!setter) return;
  setter.call(el, valor);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Devolve ao formulário (novo plano) os campos copiados antes de ir cadastrar a escola. */
export function restaurarCopiaDoFormulario(form: HTMLFormElement | null): void {
  if (!form) return;
  let copia: { caminho: string; quando: number; campos: CampoCopiado[] } | null = null;
  try {
    const bruto = sessionStorage.getItem(CHAVE_COPIA);
    if (!bruto) return;
    copia = JSON.parse(bruto);
    sessionStorage.removeItem(CHAVE_COPIA);
  } catch {
    return;
  }
  if (!copia || copia.caminho !== window.location.pathname || Date.now() - copia.quando > 2 * 60 * 60 * 1000) return;
  const campos = copia.campos;

  const aplicar = () => {
    const contagem: Record<string, number> = {};
    for (const el of Array.from(form.elements)) {
      const c = el as HTMLInputElement;
      if (!c.name || TIPOS_IGNORADOS.has(c.type)) continue;
      const indice = (contagem[c.name] = (contagem[c.name] ?? -1) + 1);
      const salvo = campos.find((f) => f.nome === c.name && f.indice === indice && f.tipo === c.type);
      if (!salvo) continue;
      if (c.type === "checkbox" || c.type === "radio") {
        if (c.checked !== salvo.marcado) c.click();
      } else if (c.value !== salvo.valor && salvo.valor !== "") {
        definirValor(c, salvo.valor);
      }
    }
  };
  // Algumas listas dependem de outra escolha (ex.: disciplina -> séries): repete até assentar.
  for (const atraso of [0, 250, 800]) window.setTimeout(aplicar, atraso);
}

/**
 * Link "Cadastrar nova escola" que lembra de onde o professor veio: ao salvar (ou clicar em Voltar)
 * ele retorna para a mesma tela (plano, plano anual, calendário...), e não para a lista de escolas.
 * Dentro de um plano, antes de sair o que já foi preenchido é guardado: se o plano já pode ser salvo,
 * ele volta para ESTE plano; se ainda falta título/disciplina, volta ao formulário com os campos preenchidos.
 */
export default function LinkNovaEscola({ className, children }: { className?: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const ocupado = useRef(false);
  const [href, setHref] = useState(() => montar(pathname, ""));

  useEffect(() => {
    const novo = montar(pathname, window.location.search);
    if (novo !== href) setHref(novo);
  });

  async function aoClicar(e: MouseEvent<HTMLAnchorElement>) {
    const guardar = antesDeSair;
    if (!guardar || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (ocupado.current) return;
    ocupado.current = true;
    const form = e.currentTarget.closest("form");
    const atual = window.location.pathname + window.location.search;
    let destino = atual;
    try {
      const r = await guardar();
      if (r.id) destino = `/dashboard/planos/${r.id}`;
      else if (form) copiarCampos(form, window.location.pathname);
    } catch {
      if (form) copiarCampos(form, window.location.pathname);
    }
    ocupado.current = false;
    router.push(montar(destino, ""));
  }

  return (
    <Link href={href} className={className} onClick={aoClicar}>
      {children}
    </Link>
  );
}
