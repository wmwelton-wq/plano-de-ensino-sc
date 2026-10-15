"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface ItemDoMenu {
  href: string;
  texto: string;
  destaque?: boolean;
  /** Linha divisória antes deste item. */
  divisor?: boolean;
}

export interface MenuDoTopo {
  titulo: string;
  href: string;
  itens: ItemDoMenu[];
}

const botaoMenu =
  "inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

/**
 * Menu do topo que funciona no computador (abre ao passar o mouse ou clicar) e no celular
 * (um toque abre; outro toque fora ou em "Esc" fecha). O título NÃO navega: o primeiro item
 * da lista leva à página principal da seção.
 */
function Menu({ menu, aberto, aoAbrir, aoFechar, alinharDireita }: { menu: MenuDoTopo; aberto: boolean; aoAbrir: () => void; aoFechar: () => void; alinharDireita: boolean }) {
  const temHover = useRef(false);
  useEffect(() => {
    temHover.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={() => temHover.current && aoAbrir()}
      onMouseLeave={() => temHover.current && aoFechar()}
    >
      <button
        type="button"
        className={botaoMenu}
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => (aberto ? aoFechar() : aoAbrir())}
      >
        {menu.titulo}
        <span aria-hidden="true" className={`text-[10px] text-slate-400 transition ${aberto ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {aberto && (
        <div className={`absolute top-full z-30 w-64 max-w-[calc(100vw-2rem)] pt-1 ${alinharDireita ? "right-0 sm:left-0 sm:right-auto" : "left-0"}`}>
          <div className="rounded-xl border border-primary-200 bg-white p-1.5 shadow-lg">
            {menu.itens.map((item) => (
              <div key={item.href}>
                {item.divisor && <div className="my-1 border-t border-slate-200" role="separator" />}
                <Link
                  href={item.href}
                  onClick={aoFechar}
                  className={`block rounded-lg px-3 py-3 text-sm font-semibold transition hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:py-2 ${
                    item.destaque ? "text-primary-700" : "text-slate-700"
                  }`}
                >
                  {item.texto}
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

  return (
    <nav ref={raiz} className="flex flex-wrap items-center gap-1" aria-label="Menu principal">
      <Link href="/dashboard" className={botaoMenu} onClick={() => setAberto(null)}>
        Início
      </Link>
      {menus.map((m, i) => (
        <Menu
          key={m.titulo}
          menu={m}
          aberto={aberto === m.titulo}
          aoAbrir={() => setAberto(m.titulo)}
          aoFechar={() => setAberto((atual) => (atual === m.titulo ? null : atual))}
          alinharDireita={i > 0}
        />
      ))}
      {extras.map((e) => (
        <Link key={e.href} href={e.href} className={botaoMenu} onClick={() => setAberto(null)}>
          {e.texto}
        </Link>
      ))}
    </nav>
  );
}
