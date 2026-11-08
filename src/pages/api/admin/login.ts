import type { APIRoute } from "astro";
import {
  hashAddress,
  isSameOrigin,
  setAdminSession,
  verifyAdminCredentials,
} from "../../../lib/auth";
import { registerLoginAttempt, clearLoginAttempts } from "../../../lib/db";
import { readJsonBody } from "../../../lib/http";

function errorResponse(message: string, status: number): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

function isLoginPayload(
  value: unknown,
): value is { username: string; password: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "username" in value &&
    typeof value.username === "string" &&
    "password" in value &&
    typeof value.password === "string"
  );
}

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  if (!isSameOrigin(request)) {
    return errorResponse("Solicitud no permitida.", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse("Formato de solicitud no válido.", 415);
  }
  const body = await readJsonBody(request, 2048);
  if (!body.ok) {
    return errorResponse(
      body.status === 413
        ? "Solicitud demasiado grande."
        : "No se pudo leer la solicitud.",
      body.status,
    );
  }
  if (!isLoginPayload(body.value)) {
    return errorResponse("Usuario o contraseña incorrectos.", 401);
  }
  const { username, password } = body.value;
  if (
    username.length > 120 ||
    password.length === 0 ||
    password.length > 256
  ) {
    return errorResponse("Usuario o contraseña incorrectos.", 401);
  }

  try {
    const ipHash = hashAddress(clientAddress);
    if ((await registerLoginAttempt(ipHash)) > 5) {
      return errorResponse(
        "Demasiados intentos. Esperá 15 minutos antes de volver a probar.",
        429,
      );
    }

    if (!(await verifyAdminCredentials(username, password))) {
      return errorResponse("Usuario o contraseña incorrectos.", 401);
    }

    await clearLoginAttempts(ipHash);
    setAdminSession(cookies);
    return Response.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch (error) {
    console.error("No se pudo procesar el inicio de sesión administrativo.", error);
    return errorResponse("El acceso no está disponible en este momento.", 503);
  }
};
