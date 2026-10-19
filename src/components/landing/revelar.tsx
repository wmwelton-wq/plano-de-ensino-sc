"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Faz o bloco "aparecer" suavemente quando chega na tela.
 * Sem JavaScript (ou com "reduzir movimento" ligado) o conteúdo fica sempre visível.
 */
export default function Revelar({
  children,
  className = "",
  atraso = 0,
  como: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Atraso em milissegundos (para entrar em sequência). */
  atraso?: number;
  como?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) return; // já está na tela: não esconde
    el.classList.add("ld-rv-oculto");
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("ld-rv-on");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const estilo = atraso ? { transitionDelay: `${atraso}ms` } : undefined;
  const props = { ref: ref as never, className: `ld-rv ${className}`, style: estilo };
  return <Tag {...props}>{children}</Tag>;
}
