import type { APIRoute } from "astro";
import { clearAdminSession, isSameOrigin } from "../../../lib/auth";

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isSameOrigin(request)) {
    return Response.json(
      { error: "Solicitud no permitida." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  clearAdminSession(cookies);
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
};
