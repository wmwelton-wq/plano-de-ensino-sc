"use client";

/** Ajuda do navegador para conversar com a chave de segurança (WebAuthn). */

function paraBytes(b64url: string): ArrayBuffer {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function paraB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function navegadorSuportaChave(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && typeof navigator !== "undefined" && !!navigator.credentials && typeof window.PublicKeyCredential !== "undefined";
}

/** Traduz os erros do navegador para português. */
export function mensagemDoErroDaChave(e: unknown): string {
  const nome = e instanceof DOMException ? e.name : "";
  if (nome === "NotAllowedError") return "A operação foi cancelada ou demorou demais. Toque na chave quando ela piscar e tente de novo.";
  if (nome === "InvalidStateError") return "Esta chave já está cadastrada.";
  if (nome === "SecurityError") return "O navegador não permitiu usar a chave neste endereço do site.";
  if (nome === "NotSupportedError") return "Este navegador ou esta chave não suporta essa operação.";
  return "Não foi possível falar com a chave de segurança.";
}

export async function criarCredencial(opcoes: Record<string, unknown>): Promise<{ clientDataJSON: string; attestationObject: string }> {
  const o = opcoes as {
    challenge: string;
    user: { id: string; name: string; displayName: string };
    excludeCredentials?: { type: "public-key"; id: string }[];
  } & Record<string, unknown>;
  const publicKey = {
    ...o,
    challenge: paraBytes(o.challenge),
    user: { ...o.user, id: paraBytes(o.user.id) },
    excludeCredentials: (o.excludeCredentials ?? []).map((c) => ({ type: c.type, id: paraBytes(c.id) })),
  } as unknown as PublicKeyCredentialCreationOptions;
  const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!cred) throw new DOMException("cancelado", "NotAllowedError");
  const r = cred.response as AuthenticatorAttestationResponse;
  return { clientDataJSON: paraB64url(r.clientDataJSON), attestationObject: paraB64url(r.attestationObject) };
}

export async function usarCredencial(opcoes: Record<string, unknown>): Promise<{ id: string; clientDataJSON: string; authenticatorData: string; assinatura: string }> {
  const o = opcoes as { challenge: string; allowCredentials: { type: "public-key"; id: string }[] } & Record<string, unknown>;
  const publicKey = {
    ...o,
    challenge: paraBytes(o.challenge),
    allowCredentials: o.allowCredentials.map((c) => ({ type: c.type, id: paraBytes(c.id) })),
  } as unknown as PublicKeyCredentialRequestOptions;
  const cred = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  if (!cred) throw new DOMException("cancelado", "NotAllowedError");
  const r = cred.response as AuthenticatorAssertionResponse;
  return { id: paraB64url(cred.rawId), clientDataJSON: paraB64url(r.clientDataJSON), authenticatorData: paraB64url(r.authenticatorData), assinatura: paraB64url(r.signature) };
}
