import type { APIRoute } from "astro";
import { readSiteContent } from "../../lib/db";

export const GET: APIRoute = async () => {
  try {
    const content = await readSiteContent();
    return Response.json(content, {
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch (error) {
    console.error("No se pudo leer el contenido público.", error);
    return Response.json(
      { error: "El contenido no está disponible en este momento." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
