"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icone, type NomeIcone } from "@/components/icones";

export interface ItemDoMenu {
  href: string;
  texto: string;
  destaque?: boolean;
  /** Linha divisória antes deste item. */
  divisor?: boolean;
  /** Ícone desenhado ao lado do texto. */
  icone?: NomeIcone;
  /** Frase curta embaixo do texto. */
  descricao?: string;
}

export interface MenuDoTopo {
  titulo: string;
  href: string;
  itens: ItemDoMenu[];
  /** Caminhos que deixam este menu em destaque (a página em que o professor está). */
  ativoEm?: string[];
}

const botaoBase =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";
const botaoInativo = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
const botaoAtivo = "bg-primary-50 text-primary-700 hover:bg-primary-100";

/** Setinha fina e arredondada (no lugar do triângulo preto). Gira quando o menu abre. */
function Seta({ aberto }: { aberto: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5.5 8l4.5 4.5L14.5 8" />
    </svg>
  );
}

/**
 * Menu do topo que funciona no computador (abre ao passar o mouse ou clicar) e no celular
 * (um toque abre; outro toque fora ou em "Esc" fecha). O título NÃO navega: o primeiro item
 * da lista leva à página principal da seção.
 */
function Menu({
  menu,
  aberto,
  ativo,
  aoAbrir,
  aoFechar,
  alinharDireita,
}: {
  menu: MenuDoTopo;
  aberto: boolean;
  ativo: boolean;
  aoAbrir: () => void;
  aoFechar: () => void;
  alinharDireita: boolean;
}) {
  const temHover = useRef(false);
  useEffect(() => {
    temHover.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  return (
    <div className="relative" onMouseEnter={() => temHover.current && aoAbrir()} onMouseLeave={() => temHover.current && aoFechar()}>
      <button
        type="button"
        className={`${botaoBase} ${aberto || ativo ? botaoAtivo : botaoInativo}`}
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => (aberto ? aoFechar() : aoAbrir())}
      >
        {menu.titulo}
        <Seta aberto={aberto} />
      </button>
      {aberto && (
        <div className={`absolute top-full z-30 w-72 max-w-[calc(100vw-2rem)] pt-2 ${alinharDireita ? "right-0 sm:left-0 sm:right-auto" : "left-0"}`}>
          <div className="menu-entra rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.28)]">
            {menu.itens.map((item) => (
              <div key={item.href}>
                {item.divisor && <div className="mx-2 my-1.5 border-t border-slate-100" role="separator" />}
                <Link
                  href={item.href}
                  onClick={aoFechar}
                  className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {item.icone && (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
                        item.destaque
                          ? "bg-primary-600 text-white shadow-sm group-hover:bg-primary-700"
                          : "bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700"
                      }`}
                      aria-hidden="true"
                    >
                      <Icone nome={item.icone} className="h-[18px] w-[18px]" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${item.destaque ? "text-primary-700" : "text-slate-800"}`}>{item.texto}</span>
                    {item.descricao && <span className="mt-0.5 block text-xs leading-snug text-slate-500">{item.descricao}</span>}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuTopo({ menus, extras }: { menus: MenuDoTopo[]; extras: { href: string; texto: string }[] }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const raiz = useRef<HTMLElement>(null);
  const caminho = usePathname() ?? "";

  useEffect(() => {
    function fora(e: Event) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(null);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(null);
    }
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, []);

  const dentro = (bases: string[]) => bases.some((b) => caminho === b || caminho.startsWith(`${b}/`));

  return (
    <nav ref={raiz} className="flex flex-wrap items-center gap-1" aria-label="Menu principal">
      <Link
        href="/dashboard"
        className={`${botaoBase} ${caminho === "/dashboard" ? botaoAtivo : botaoInativo}`}
        aria-current={caminho === "/dashboard" ? "page" : undefined}
        onClick={() => setAberto(null)}
      >
        Início
      </Link>
      {menus.map((m, i) => (
        <Menu
          key={m.titulo}
          menu={m}
          aberto={aberto === m.titulo}
          ativo={dentro(m.ativoEm ?? [m.href])}
          aoAbrir={() => setAberto(m.titulo)}
          aoFechar={() => setAberto((atual) => (atual === m.titulo ? null : atual))}
          alinharDireita={i > 0}
        />
      ))}
      {extras.map((e) => {
        const ativo = dentro([e.href]);
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`${botaoBase} ${ativo ? botaoAtivo : botaoInativo}`}
            aria-current={ativo ? "page" : undefined}
            onClick={() => setAberto(null)}
          >
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
