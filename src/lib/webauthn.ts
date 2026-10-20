/**
 * Verificação de chaves de segurança (WebAuthn / FIDO2), como a Feitian ePass K28, usada como
 * segunda etapa do login do administrador. Só usa o módulo "crypto" do Node (sem bibliotecas).
 *
 * Escopo (de propósito, pequeno):
 *  - registro sem atestado ("attestation: none"): guardamos só a chave pública;
 *  - algoritmos ES256 (-7) e RS256 (-257), que cobrem as chaves USB comuns;
 *  - confere tipo, desafio, origem, rpId, "usuário presente", assinatura e contador (anti-clonagem).
 */
import { createHash, createPublicKey, timingSafeEqual, verify as verificarAssinatura } from "node:crypto";

export type JwkPublica = { kty: "EC"; crv: "P-256"; x: string; y: string } | { kty: "RSA"; n: string; e: string };

export class ErroWebAuthn extends Error {}

const sha256 = (b: Buffer | string) => createHash("sha256").update(b).digest();
const falhar = (msg: string): never => {
  throw new ErroWebAuthn(msg);
};

// ---------- CBOR mínimo (somente o que a resposta do autenticador usa) ----------
function lerCbor(buf: Buffer, estado: { i: number }, profundidade = 0): unknown {
  if (profundidade > 8) return falhar("estrutura muito profunda");
  if (estado.i >= buf.length) return falhar("dados incompletos");
  const inicial = buf[estado.i++];
  const tipo = inicial >> 5;
  const info = inicial & 31;
  let valor: number;
  if (info < 24) {
    valor = info;
  } else if (info === 24) {
    valor = buf.readUInt8(estado.i);
    estado.i += 1;
  } else if (info === 25) {
    valor = buf.readUInt16BE(estado.i);
    estado.i += 2;
  } else if (info === 26) {
    valor = buf.readUInt32BE(estado.i);
    estado.i += 4;
  } else if (info === 27) {
    const grande = buf.readBigUInt64BE(estado.i);
    estado.i += 8;
    if (grande > BigInt(Number.MAX_SAFE_INTEGER)) return falhar("número grande demais");
    valor = Number(grande);
  } else {
    return falhar("formato CBOR não suportado");
  }

  switch (tipo) {
    case 0:
      return valor;
    case 1:
      return -1 - valor;
    case 2: {
      if (estado.i + valor > buf.length) return falhar("dados incompletos");
      const b = buf.subarray(estado.i, estado.i + valor);
      estado.i += valor;
      return b;
    }
    case 3: {
      if (estado.i + valor > buf.length) return falhar("dados incompletos");
      const t = buf.subarray(estado.i, estado.i + valor).toString("utf8");
      estado.i += valor;
      return t;
    }
    case 4: {
      if (valor > 64) return falhar("lista grande demais");
      const lista: unknown[] = [];
      for (let k = 0; k < valor; k++) lista.push(lerCbor(buf, estado, profundidade + 1));
      return lista;
    }
    case 5: {
      if (valor > 64) return falhar("mapa grande demais");
      const mapa = new Map<unknown, unknown>();
      for (let k = 0; k < valor; k++) {
        const chave = lerCbor(buf, estado, profundidade + 1);
        mapa.set(chave, lerCbor(buf, estado, profundidade + 1));
      }
      return mapa;
    }
    case 7:
      if (info === 20) return false;
      if (info === 21) return true;
      if (info === 22 || info === 23) return null;
      return falhar("valor CBOR não suportado");
    default:
      return falhar("tipo CBOR não suportado");
  }
}

// ---------- Dados do autenticador ----------
interface DadosAutenticador {
  rpIdHash: Buffer;
  flags: number;
  contador: number;
  credencialId?: Buffer;
  chaveCose?: Map<unknown, unknown>;
}

function lerAuthData(ad: Buffer, esperaCredencial: boolean): DadosAutenticador {
  if (ad.length < 37) return falhar("dados do autenticador curtos demais");
  const saida: DadosAutenticador = { rpIdHash: ad.subarray(0, 32), flags: ad[32], contador: ad.readUInt32BE(33) };
  if (esperaCredencial) {
    if (!(saida.flags & 0x40)) return falhar("a chave não enviou a credencial");
    if (ad.length < 55) return falhar("dados do autenticador incompletos");
    const tamanho = ad.readUInt16BE(53);
    if (tamanho < 16 || tamanho > 1023 || ad.length < 55 + tamanho) return falhar("identificador de credencial inválido");
    saida.credencialId = ad.subarray(55, 55 + tamanho);
    const estado = { i: 55 + tamanho };
    const cose = lerCbor(ad, estado);
    if (!(cose instanceof Map)) return falhar("chave pública inválida");
    saida.chaveCose = cose;
  }
  return saida;
}

function igual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

function conferirDadosCliente(clientDataJSON: Buffer, tipoEsperado: "webauthn.create" | "webauthn.get", desafioEsperado: string, origensPermitidas: string[]) {
  let dados: { type?: unknown; challenge?: unknown; origin?: unknown; crossOrigin?: unknown };
  try {
    dados = JSON.parse(clientDataJSON.toString("utf8"));
  } catch {
    return falhar("resposta do navegador ilegível");
  }
  if (dados.type !== tipoEsperado) falhar("tipo de operação inesperado");
  if (typeof dados.challenge !== "string" || !igual(Buffer.from(dados.challenge), Buffer.from(desafioEsperado))) falhar("desafio diferente do esperado");
  if (typeof dados.origin !== "string" || !origensPermitidas.includes(dados.origin)) falhar("origem não permitida");
  if (dados.crossOrigin === true) falhar("origem cruzada não permitida");
}

function conferirRp(d: DadosAutenticador, rpId: string) {
  if (!igual(d.rpIdHash, sha256(rpId))) falhar("a chave foi criada para outro endereço");
  if (!(d.flags & 0x01)) falhar("a chave não confirmou presença (toque na chave)");
}

// ---------- Registro ----------
export interface EntradaRegistro {
  clientDataJSON: string; // base64url
  attestationObject: string; // base64url
  desafio: string;
  origensPermitidas: string[];
  rpId: string;
}

export function verificarRegistro(e: EntradaRegistro): { credencialId: string; chavePublica: JwkPublica; alg: number; contador: number } {
  conferirDadosCliente(Buffer.from(e.clientDataJSON, "base64url"), "webauthn.create", e.desafio, e.origensPermitidas);
  const atestado = lerCbor(Buffer.from(e.attestationObject, "base64url"), { i: 0 });
  if (!(atestado instanceof Map)) return falhar("atestado inválido");
  const authData = atestado.get("authData");
  if (!Buffer.isBuffer(authData)) return falhar("atestado sem dados do autenticador");
  const d = lerAuthData(authData, true);
  conferirRp(d, e.rpId);
  const cose = d.chaveCose!;
  const kty = cose.get(1);
  const alg = cose.get(3);
  let jwk: JwkPublica;
  if (kty === 2 && alg === -7) {
    const x = cose.get(-2);
    const y = cose.get(-3);
    if (cose.get(-1) !== 1 || !Buffer.isBuffer(x) || !Buffer.isBuffer(y) || x.length !== 32 || y.length !== 32) return falhar("chave ES256 inválida");
    jwk = { kty: "EC", crv: "P-256", x: x.toString("base64url"), y: y.toString("base64url") };
  } else if (kty === 3 && alg === -257) {
    const n = cose.get(-1);
    const ex = cose.get(-2);
    if (!Buffer.isBuffer(n) || !Buffer.isBuffer(ex) || n.length < 256 || n.length > 1024) return falhar("chave RS256 inválida");
    jwk = { kty: "RSA", n: n.toString("base64url"), e: ex.toString("base64url") };
  } else {
    return falhar("tipo de chave não suportado (use uma chave FIDO2 comum)");
  }
  // Confirma que o Node consegue usar a chave (rejeita pontos fora da curva etc.).
  try {
    createPublicKey({ key: jwk as never, format: "jwk" });
  } catch {
    return falhar("chave pública inválida");
  }
  return { credencialId: d.credencialId!.toString("base64url"), chavePublica: jwk, alg: alg as number, contador: d.contador };
}

// ---------- Login (asserção) ----------
export interface EntradaAssercao {
  clientDataJSON: string; // base64url
  authenticatorData: string; // base64url
  assinatura: string; // base64url
  desafio: string;
  origensPermitidas: string[];
  rpId: string;
  chavePublica: JwkPublica;
  alg: number;
  contadorAnterior: number;
}

export function verificarAssercao(e: EntradaAssercao): { contador: number } {
  const bytesCliente = Buffer.from(e.clientDataJSON, "base64url");
  conferirDadosCliente(bytesCliente, "webauthn.get", e.desafio, e.origensPermitidas);
  const authData = Buffer.from(e.authenticatorData, "base64url");
  const d = lerAuthData(authData, false);
  conferirRp(d, e.rpId);
  const chave = createPublicKey({ key: e.chavePublica as never, format: "jwk" });
  const assinada = Buffer.concat([authData, sha256(bytesCliente)]);
  const assinatura = Buffer.from(e.assinatura, "base64url");
  if (e.alg !== -7 && e.alg !== -257) falhar("algoritmo não suportado");
  let valida = false;
  try {
    valida = verificarAssinatura("sha256", assinada, chave, assinatura);
  } catch {
    valida = false;
  }
  if (!valida) falhar("assinatura inválida");
  // Contador: se a chave usa contador, ele só pode crescer (se diminuir ou repetir, a chave pode ter sido clonada).
  if ((d.contador !== 0 || e.contadorAnterior !== 0) && d.contador <= e.contadorAnterior) falhar("contador da chave não avançou");
  return { contador: d.contador };
}
