import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type Client, type Row } from "@libsql/client";

const envFile = resolve(process.cwd(), ".env");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

export type Service = {
  id: string;
  title: string;
  description: string;
  price: string;
  position: number;
};

export type WorkingHour = {
  id: string;
  day: number;
  opens: string;
  closes: string;
};

export type Announcement = {
  active: boolean;
  message: string;
  href: string;
};

export type SiteContent = {
  services: Service[];
  workingHours: WorkingHour[];
  announcement: Announcement;
};

const initialServices = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Manicura",
    description:
      "Un momento para vos, con el cuidado y los detalles que tus manos merecen.",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    title: "Uñas esculpidas",
    description:
      "Acrílico, gel o polygel: elegí tu técnica y creamos juntas el estilo que buscás.",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    title: "Diseños y calcos",
    description:
      "Un toque de color, un detalle sutil o algo completamente único. Vos inspirás.",
  },
];

let client: Client | undefined;
let schemaPromise: Promise<void> | undefined;

export function getDb(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || (!authToken && !url.startsWith("file:"))) {
    throw new Error(
      "Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN. Configuralos en .env (ver .env.example) o en las variables de entorno del servidor.",
    );
  }

  client ??= createClient(authToken ? { url, authToken } : { url });
  return client;
}

export async function initializeDatabase(): Promise<Client> {
  const db = getDb();
  schemaPromise ??= (async () => {
    await db.batch(
      [
        `CREATE TABLE IF NOT EXISTS services (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          price TEXT NOT NULL,
          position INTEGER NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS working_hours (
          id TEXT PRIMARY KEY,
          day INTEGER NOT NULL CHECK(day BETWEEN 0 AND 6),
          opens TEXT NOT NULL,
          closes TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS announcements (
          id INTEGER PRIMARY KEY CHECK(id = 1),
          active INTEGER NOT NULL DEFAULT 0,
          message TEXT NOT NULL DEFAULT '',
          href TEXT NOT NULL DEFAULT ''
        )`,
        `CREATE TABLE IF NOT EXISTS login_attempts (
          ip_hash TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL,
          window_start INTEGER NOT NULL
        )`,
      ],
      "write",
    );

    const serviceCount = await db.execute("SELECT COUNT(*) AS count FROM services");
    if (Number(serviceCount.rows[0]?.count ?? 0) === 0) {
      await db.batch(
        initialServices.map((service, position) => ({
          sql: `INSERT OR IGNORE INTO services (id, title, description, price, position)
            VALUES (?, ?, ?, ?, ?)`,
          args: [
            service.id,
            service.title,
            service.description,
            "Consultar",
            position,
          ],
        })),
        "write",
      );
    }

    const hoursCount = await db.execute(
      "SELECT COUNT(*) AS count FROM working_hours",
    );
    if (Number(hoursCount.rows[0]?.count ?? 0) === 0) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO working_hours (id, day, opens, closes)
          VALUES (?, ?, ?, ?)`,
        args: ["00000000-0000-4000-8000-000000000010", 6, "10:00", "20:00"],
      });
    }

    await db.execute(
      `INSERT OR IGNORE INTO announcements (id, active, message, href)
        VALUES (1, 0, '', '')`,
    );
  })().catch((error: unknown) => {
    schemaPromise = undefined;
    throw error;
  });

  await schemaPromise;
  return db;
}

function text(row: Row | undefined, key: string): string {
  if (!row) return "";
  const value = row[key];
  return value === null || value === undefined ? "" : String(value);
}

export async function readSiteContent(): Promise<SiteContent> {
  const db = await initializeDatabase();
  const [serviceRows, hourRows, announcementResult] = await Promise.all([
    db.execute(
      "SELECT id, title, description, price, position FROM services ORDER BY position, title",
    ),
    db.execute(
      "SELECT id, day, opens, closes FROM working_hours ORDER BY day, opens",
    ),
    db.execute(
      "SELECT active, message, href FROM announcements WHERE id = 1",
    ),
  ]);
  const announcement = announcementResult.rows[0];

  return {
    services: serviceRows.rows.map((row) => ({
      id: text(row, "id"),
      title: text(row, "title"),
      description: text(row, "description"),
      price: text(row, "price"),
      position: Number(row.position),
    })),
    workingHours: hourRows.rows.map((row) => ({
      id: text(row, "id"),
      day: Number(row.day),
      opens: text(row, "opens"),
      closes: text(row, "closes"),
    })),
    announcement: {
      active: announcement?.active === 1,
      message: text(announcement, "message"),
      href: text(announcement, "href"),
    },
  };
}

export async function registerLoginAttempt(ipHash: string): Promise<number> {
  const db = await initializeDatabase();
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 15 * 60;
  const result = await db.execute({
    sql: `INSERT INTO login_attempts (ip_hash, attempts, window_start)
      VALUES (?, 1, ?)
      ON CONFLICT(ip_hash) DO UPDATE SET
        attempts = CASE
          WHEN login_attempts.window_start <= ? THEN 1
          ELSE login_attempts.attempts + 1
        END,
        window_start = CASE
          WHEN login_attempts.window_start <= ? THEN excluded.window_start
          ELSE login_attempts.window_start
        END
      RETURNING attempts`,
    args: [ipHash, now, windowStart, windowStart],
  });
  await db.execute({
    sql: "DELETE FROM login_attempts WHERE window_start < ?",
    args: [windowStart - 24 * 60 * 60],
  });
  return Number(result.rows[0]?.attempts ?? 0);
}

export async function clearLoginAttempts(ipHash: string): Promise<void> {
  const db = await initializeDatabase();
  await db.execute({
    sql: "DELETE FROM login_attempts WHERE ip_hash = ?",
    args: [ipHash],
  });
}

export async function replaceSiteContent(content: SiteContent): Promise<void> {
  const db = await initializeDatabase();
  const transaction = await db.transaction("write");

  try {
    await transaction.execute("DELETE FROM services");
    await transaction.execute("DELETE FROM working_hours");
    for (const [position, service] of content.services.entries()) {
      await transaction.execute({
        sql: `INSERT INTO services (id, title, description, price, position)
          VALUES (?, ?, ?, ?, ?)`,
        args: [
          service.id,
          service.title,
          service.description,
          service.price,
          position,
        ],
      });
    }
    for (const hour of content.workingHours) {
      await transaction.execute({
        sql: `INSERT INTO working_hours (id, day, opens, closes)
          VALUES (?, ?, ?, ?)`,
        args: [hour.id, hour.day, hour.opens, hour.closes],
      });
    }
    await transaction.execute({
      sql: `UPDATE announcements SET active = ?, message = ?, href = ? WHERE id = 1`,
      args: [
        content.announcement.active ? 1 : 0,
        content.announcement.message,
        content.announcement.href,
      ],
    });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
