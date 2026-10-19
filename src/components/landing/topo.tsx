"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/logo";
import { Icone } from "@/components/icones";

const LINKS = [
  ["#recursos", "Recursos"],
  ["#como-funciona", "Como funciona"],
  ["#ia", "IA"],
  ["#exemplo", "Veja como fica"],
  ["#planos", "Planos"],
  ["#perguntas", "Perguntas"],
] as const;

export default function Topo() {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    function aoRolar() {
      const y = window.scrollY;
      setRolou(y > 12);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgresso(total > 0 ? Math.min(100, (y / total) * 100) : 0);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  return (
    <header className={`ld-topo ${rolou || aberto ? "ld-topo-solido" : ""}`}>
      <div className="ld-progresso" style={{ width: `${progresso}%` }} aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" aria-label="Plano Docente — início" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
          <span className="ld-logo-topo">
            <Logo />
          </span>
        </Link>

        <nav aria-label="Seções da página" className="hidden items-center gap-1 lg:flex">
          {LINKS.map(([href, rotulo]) => (
            <a key={href} href={href} className="ld-navlink">
              {rotulo}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/login" className="ld-btn-fantasma">
              Entrar
            </Link>
            <Link href="/cadastro" className="btn-azul !rounded-full !px-5">
              Criar minha conta
            </Link>
          </div>
          <button
            type="button"
            className="ld-btn-menu"
            aria-expanded={aberto}
            aria-controls="menu-landing"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            onClick={() => setAberto((v) => !v)}
          >
            <Icone nome={aberto ? "fechar" : "unidade"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {aberto && (
        <div id="menu-landing" className="ld-menu-mobile lg:hidden">
          <nav aria-label="Menu" className="mx-auto flex max-w-6xl flex-col gap-1 px-5 pb-5">
            {LINKS.map(([href, rotulo]) => (
              <a key={href} href={href} className="ld-navlink-mobile" onClick={() => setAberto(false)}>
                {rotulo}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/login" className="ld-btn-fantasma justify-center !py-3">
                Entrar
              </Link>
              <Link href="/cadastro" className="btn-azul !rounded-full !py-3">
                Criar conta
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
