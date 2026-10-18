import { Icone } from "@/components/icones";

/**
 * Regras da senha, em português, com marcação ao vivo conforme a pessoa digita.
 * Só a primeira regra (8 caracteres) é obrigatória; as outras ajudam a criar uma senha mais segura.
 * O componente só mostra informação: quem valida o envio continua sendo o formulário de cada tela.
 */
export default function RegrasSenha({ senha, confirmar }: { senha: string; confirmar?: string }) {
  const tamanho = senha.length >= 8;
  const longa = senha.length >= 12;
  const maiusculaEMinuscula = /[a-zà-ú]/.test(senha) && /[A-ZÀ-Ú]/.test(senha);
  const numero = /\d/.test(senha);
  const simbolo = /[^A-Za-z0-9À-ú\s]/.test(senha);

  const pontos = [tamanho, longa, maiusculaEMinuscula, numero, simbolo].filter(Boolean).length;
  const nivel = !senha ? 0 : !tamanho ? 1 : pontos <= 2 ? 2 : pontos === 3 ? 3 : 4;
  const rotulos = ["", "Muito curta", "Fraca — pode melhorar", "Boa", "Forte"];
  const cores = ["bg-slate-200", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
  const coresTexto = ["text-slate-500", "text-red-600", "text-amber-700", "text-lime-700", "text-emerald-700"];

  const regras: { ok: boolean; texto: string; obrigatoria?: boolean }[] = [
    { ok: tamanho, texto: "Pelo menos 8 caracteres", obrigatoria: true },
    { ok: maiusculaEMinuscula, texto: "Letras maiúsculas e minúsculas (A e a)" },
    { ok: numero, texto: "Pelo menos um número (0 a 9)" },
    { ok: simbolo, texto: "Um símbolo, como ! ? @ # $ %" },
    { ok: longa, texto: "12 ou mais caracteres deixam a senha bem mais segura" },
  ];

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm" data-testid="regras-senha">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-slate-800">Regras da senha</p>
        <p aria-live="polite" className={`text-xs font-bold ${coresTexto[nivel]}`}>
          {nivel > 0 ? rotulos[nivel] : "Digite para ver a força"}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-colors ${nivel >= i ? cores[nivel] : "bg-slate-200"}`} />
        ))}
      </div>

      <ul className="mt-3 space-y-1.5">
        {regras.map((r) => (
          <li key={r.texto} className={`flex items-start gap-2 ${r.ok ? "text-emerald-700" : "text-slate-600"}`}>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full ${r.ok ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}
              style={{ height: 18, width: 18 }}
            >
              {r.ok && <Icone nome="check" className="h-3 w-3" espessura={3} />}
            </span>
            <span>
              {r.texto}
              {r.obrigatoria && <span className="ml-1.5 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700">obrigatório</span>}
              <span className="sr-only">{r.ok ? " — atendida" : " — ainda não atendida"}</span>
            </span>
          </li>
        ))}
        {confirmar !== undefined && (
          <li className={`flex items-start gap-2 ${confirmar && confirmar === senha ? "text-emerald-700" : "text-slate-600"}`}>
            <span
              aria-hidden="true"
              className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full ${confirmar && confirmar === senha ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}
              style={{ height: 18, width: 18 }}
            >
              {confirmar && confirmar === senha && <Icone nome="check" className="h-3 w-3" espessura={3} />}
            </span>
            <span>As duas senhas digitadas são iguais</span>
          </li>
        )}
      </ul>

      <details className="mt-3 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
        <summary className="cursor-pointer select-none font-semibold text-primary-700">Como criar uma senha boa e fácil de lembrar</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
          <li>Junte 3 ou 4 palavras que não têm relação entre si e acrescente números e um símbolo. Exemplo: <strong>Girassol-Mesa-Chuva-47</strong> (crie a sua própria, não use esta).</li>
          <li>Não use seu nome, e-mail, data de nascimento, telefone nem sequências como 12345678.</li>
          <li>Use uma senha só para o Plano Docente. Não repita a de outros sites ou do e-mail.</li>
          <li>Não compartilhe a senha com ninguém, nem por mensagem.</li>
        </ul>
      </details>
    </div>
  );
}
