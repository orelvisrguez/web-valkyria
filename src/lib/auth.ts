import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { AstroCookies } from "astro";

const scrypt = promisify(scryptCallback);
const cookieName = "valkyria_admin";
const sessionLifetimeSeconds = 8 * 60 * 60;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 bytes aleatorios.");
  }
  return secret;
}

function adminCredentials(): { username: string; passwordHash: string } {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!username || !passwordHash) {
    throw new Error("Faltan ADMIN_USERNAME y ADMIN_PASSWORD_HASH.");
  }
  return { username, passwordHash };
}

function signature(payload: string): Buffer {
  return createHmac("sha256", sessionSecret()).update(payload).digest();
}

export function hashAddress(address: string): string {
  return createHmac("sha256", sessionSecret())
    .update(`login-rate:${address}`)
    .digest("hex");
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const credentials = adminCredentials();
  const [scheme, salt, hash] = credentials.passwordHash.split("$");
  if (
    scheme !== "scrypt" ||
    !salt ||
    !hash ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(hash)
  ) {
    throw new Error("ADMIN_PASSWORD_HASH no tiene un formato scrypt válido.");
  }

  const expected = Buffer.from(hash, "hex");
  const actual = (await scrypt(password, Buffer.from(salt, "hex"), 64)) as Buffer;
  const usernameMatches =
    Buffer.byteLength(username) === Buffer.byteLength(credentials.username) &&
    timingSafeEqual(
      Buffer.from(username),
      Buffer.from(credentials.username),
    );
  return usernameMatches && timingSafeEqual(actual, expected);
}

export function setAdminSession(cookies: AstroCookies): void {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${expiresAt}.${nonce}`;
  const token = `${payload}.${signature(payload).toString("base64url")}`;

  cookies.set(cookieName, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "strict",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  });
}

export function clearAdminSession(cookies: AstroCookies): void {
  cookies.delete(cookieName, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "strict",
    path: "/",
  });
}

export function hasAdminSession(cookies: AstroCookies): boolean {
  const token = cookies.get(cookieName)?.value;
  if (!token) return false;
  const [expiresAt, nonce, encodedSignature, ...extra] = token.split(".");
  if (
    extra.length > 0 ||
    !expiresAt ||
    !/^\d+$/.test(expiresAt) ||
    !nonce ||
    !encodedSignature
  ) {
    return false;
  }

  const expiry = Number(expiresAt);
  const now = Math.floor(Date.now() / 1000);
  if (expiry <= now || expiry > now + sessionLifetimeSeconds + 60) return false;

  const expected = signature(`${expiresAt}.${nonce}`);
  const provided = Buffer.from(encodedSignature, "base64url");
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

export function isSameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}
