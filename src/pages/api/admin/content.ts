import type { APIRoute } from "astro";
import { hasAdminSession, isSameOrigin } from "../../../lib/auth";
import {
  ContentValidationError,
  parseSiteContent,
} from "../../../lib/content-validation";
import { readJsonBody } from "../../../lib/http";
import {
  readSiteContent,
  replaceSiteContent,
} from "../../../lib/db";

const privateHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export const GET: APIRoute = async ({ cookies }) => {
  if (!hasAdminSession(cookies)) {
    return Response.json(
      { error: "Sesión vencida. Iniciá sesión nuevamente." },
      { status: 401, headers: privateHeaders },
    );
  }

  try {
    return Response.json(await readSiteContent(), { headers: privateHeaders });
  } catch (error) {
    console.error("No se pudo leer el contenido administrativo.", error);
    return Response.json(
      { error: "No se pudo cargar el contenido." },
      { status: 503, headers: privateHeaders },
    );
  }
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  if (!isSameOrigin(request)) {
    return Response.json(
      { error: "Solicitud no permitida." },
      { status: 403, headers: privateHeaders },
    );
  }
  if (!hasAdminSession(cookies)) {
    return Response.json(
      { error: "Sesión vencida. Iniciá sesión nuevamente." },
      { status: 401, headers: privateHeaders },
    );
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json(
      { error: "Formato de solicitud no válido." },
      { status: 415, headers: privateHeaders },
    );
  }
  const body = await readJsonBody(request, 50_000);
  if (!body.ok) {
    return Response.json(
      {
        error:
          body.status === 413
            ? "La solicitud es demasiado grande."
            : "No se pudo leer el contenido enviado.",
      },
      { status: body.status, headers: privateHeaders },
    );
  }

  try {
    const content = parseSiteContent(body.value);
    await replaceSiteContent(content);
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof ContentValidationError) {
      return Response.json(
        { error: error.message },
        { status: 400, headers: privateHeaders },
      );
    }
    console.error("No se pudo guardar el contenido administrativo.", error);
    return Response.json(
      { error: "No se pudo guardar el contenido." },
      { status: 503, headers: privateHeaders },
    );
  }
};
