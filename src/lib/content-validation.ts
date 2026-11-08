import type {
  Announcement,
  Service,
  SiteContent,
  WorkingHour,
} from "./db";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export class ContentValidationError extends Error {}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ContentValidationError("El formato enviado no es válido.");
  }
  return value as Record<string, unknown>;
}

function boundedText(
  value: unknown,
  field: string,
  maxLength: number,
  allowEmpty = false,
): string {
  if (
    typeof value !== "string" ||
    value.length > maxLength ||
    (!allowEmpty && value.trim().length === 0)
  ) {
    throw new ContentValidationError(`${field} no es válido.`);
  }
  return value.trim();
}

function parseService(value: unknown): Service {
  const service = record(value);
  const id = boundedText(service.id, "ID de servicio", 36);
  if (!uuidPattern.test(id)) {
    throw new ContentValidationError("El ID de servicio no es válido.");
  }
  return {
    id,
    title: boundedText(service.title, "Nombre del servicio", 80),
    description: boundedText(service.description, "Descripción", 300, true),
    price: boundedText(service.price, "Precio", 40),
    position: 0,
  };
}

function parseWorkingHour(value: unknown): WorkingHour {
  const hour = record(value);
  const id = boundedText(hour.id, "ID de horario", 36);
  const day = hour.day;
  const opens = boundedText(hour.opens, "Hora de apertura", 5);
  const closes = boundedText(hour.closes, "Hora de cierre", 5);
  if (
    !uuidPattern.test(id) ||
    typeof day !== "number" ||
    !Number.isInteger(day) ||
    day < 0 ||
    day > 6 ||
    !timePattern.test(opens) ||
    !timePattern.test(closes) ||
    opens >= closes
  ) {
    throw new ContentValidationError("Uno de los horarios no es válido.");
  }
  return { id, day, opens, closes };
}

function parseAnnouncement(value: unknown): Announcement {
  const announcement = record(value);
  const active = announcement.active;
  const message = boundedText(announcement.message, "Texto del anuncio", 180, true);
  const href = boundedText(announcement.href, "Enlace del anuncio", 500, true);
  if (typeof active !== "boolean" || (active && message.length === 0)) {
    throw new ContentValidationError("El anuncio no es válido.");
  }
  if (href) {
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      throw new ContentValidationError(
        "El enlace del anuncio debe ser una URL HTTPS válida.",
      );
    }
    if (url.protocol !== "https:") {
      throw new ContentValidationError("El enlace del anuncio debe usar HTTPS.");
    }
  }
  return { active, message, href };
}

export function parseSiteContent(value: unknown): SiteContent {
  const content = record(value);
  if (
    !Array.isArray(content.services) ||
    content.services.length > 50 ||
    !Array.isArray(content.workingHours) ||
    content.workingHours.length > 50
  ) {
    throw new ContentValidationError(
      "La cantidad de servicios u horarios no es válida.",
    );
  }

  const services = content.services.map(parseService);
  const workingHours = content.workingHours.map(parseWorkingHour);
  const serviceIds = new Set(services.map((service) => service.id));
  const hourIds = new Set(workingHours.map((hour) => hour.id));
  if (
    serviceIds.size !== services.length ||
    hourIds.size !== workingHours.length
  ) {
    throw new ContentValidationError("Hay elementos duplicados.");
  }

  return {
    services,
    workingHours,
    announcement: parseAnnouncement(content.announcement),
  };
}
