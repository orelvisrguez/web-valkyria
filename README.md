# Valkyria Nail Studio

Sitio web de Valkyria Nail Studio, estudio de manicura en Caballito, Buenos
Aires. Está desarrollado con [Astro](https://astro.build/) y [Turso
(libSQL)](https://turso.tech/). El sitio público muestra servicios, precios,
horarios y anuncios administrables desde un panel privado.

## Requisitos

- Node.js `>=22.23.4`
- npm `>=9.6.5`

## Instalación y desarrollo

```bash
npm ci
```

Antes de iniciar la aplicación, configura las variables requeridas en la
sección **Base de datos y panel administrativo**. En desarrollo, copia
`.env.example` a `.env` y completa la URL y el token nuevo de Turso. El servidor
carga ese archivo automáticamente. No pegues secretos en el código ni los
subas al repositorio.

```powershell
Copy-Item .env.example .env
npm run dev
```

Si aparece `Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN`, comprueba que `.env`
esté en la raíz del proyecto y que ambas variables tengan valores válidos.

## Base de datos y panel administrativo

La aplicación necesita renderizado en servidor (no hosting estático), ya que
consulta Turso al servir las páginas y protege las rutas del panel. Para
producción está configurada con el adaptador oficial de Astro para Vercel.

1. Crea una base Turso y un token de acceso de lectura/escritura desde el panel
   o la CLI oficial. **No reutilices el token que se compartió en una
   conversación: revócalo y genera uno nuevo.**
2. Copia `.env.example` a `.env` y completa `TURSO_DATABASE_URL` y
   `TURSO_AUTH_TOKEN`. En producción, configura esas variables en el gestor de
   secretos del hosting; no subas `.env` al repositorio.
3. Genera un hash para una contraseña de al menos 14 caracteres, escribiéndola
   en la terminal sin que se muestre:

   ```bash
   node scripts/hash-admin-password.mjs
   ```

   Guarda el valor impreso en `ADMIN_PASSWORD_HASH` y define `ADMIN_USERNAME`.
   Genera también `SESSION_SECRET` con al menos 32 bytes aleatorios; por
   ejemplo, en PowerShell:

   ```powershell
   [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```

4. Al primer acceso, la aplicación crea las tablas de servicios, horarios,
   anuncios y control de intentos, e inicializa los servicios y el horario
   público ya existentes. Los precios iniciales quedan como “Consultar” para no
   publicar montos no confirmados.
5. Inicia sesión en `/admin`. Los cambios guardados se publican en el sitio.

El acceso usa cookies `HttpOnly`, `SameSite=Strict`, sesiones firmadas con
expiración de 8 horas, protección de origen, limitación de intentos de inicio
de sesión almacenada en Turso y contraseñas verificadas con scrypt. Cambiar
`SESSION_SECRET` invalida las sesiones existentes.

## Compilar y ejecutar

```bash
npm run build
npm run preview
```

Para desplegar en Vercel, configura allí las variables requeridas antes de
publicar una nueva versión. No subas `dist/`, `node_modules/` ni `.astro/` al
repositorio: Git los ignora y Vercel reconstruye el sitio con `npm run build`.

## Publicar en Vercel

El proyecto debe estar importado en Vercel desde GitHub y usar la configuración
automática de Astro. Antes del primer despliegue, agrega en **Settings →
Environment Variables** (para Production y Preview, según corresponda):

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `SITE_URL` (URL pública del sitio)

No uses los valores de ejemplo como secretos ni subas `.env` al repositorio.
Una vez configuradas las variables, los cambios enviados a `main` pueden
desplegarse automáticamente; también puedes iniciar un despliegue desde Vercel.

El proyecto incluye `package-lock.json`; usa `npm ci` para instalar las mismas
versiones de dependencias en cada entorno.

## Contenido

La página, sus enlaces sociales e imágenes se configuran en
`src/pages/index.astro`; los servicios, sus precios, los horarios y la barra de
anuncios se editan en `/admin`. La galería pública muestra trabajos reales del
estudio mediante imágenes WebP en `public/images/`; se conservan también las
fotos originales. La sección del estudio muestra fotos reales de Susana y del
local. La sección de
opiniones incluye fragmentos de reseñas públicas de Google y enlaza al perfil
para consultar las reseñas completas. La sección sobre el estudio presenta a
Susana Delgado y sus más de diez años de experiencia, y la navegación enlaza
directamente a esa sección y a la de cuidado e higiene. Las consultas sobre
higiene y las condiciones de los turnos publican las políticas confirmadas por
el estudio: equipos esterilizados, materiales descartables, seña no
reembolsable del 30% al solicitar el turno, cancelación con 24 horas de
anticipación y tolerancia de hasta 30 minutos. Se acepta efectivo,
transferencia y Mercado Pago. Los botones de reserva y consultas abren WhatsApp.

La dirección y el horario publicados corresponden a la información disponible
en el perfil público de Google del estudio. Verifica los datos antes de
publicar cambios.

## SEO local e imágenes

Astro genera metadatos canonical y Open Graph/Twitter, una tarjeta de vista
previa de 1200 × 630 y datos estructurados `BeautySalon` con la dirección,
teléfono, ubicación y horario público del estudio. En Vercel, Astro toma el
dominio de producción de las variables del sistema. En otro hosting, configura
`SITE_URL` con la URL pública completa, por ejemplo `https://tudominio.com`.

La foto principal está en `src/assets/` y Astro la procesa para generar AVIF,
WebP y varios tamaños responsivos al compilar. Las fotos reales de la galería
están en `public/images/` como WebP. La vista previa al compartir en WhatsApp y
otras redes usa una foto real de manicura en `public/images/og-nails.jpg` (JPEG
de 1200 × 630). El isotipo y los recursos anteriores para redes siguen
disponibles en `public/og-image.svg` y `public/og-image.png`.

## Vercel Speed Insights

El sitio incluye el componente oficial `@vercel/speed-insights/astro`. Para
recibir métricas de rendimiento:

1. Importa el repositorio y despliega el proyecto en Vercel.
2. En el panel de Vercel, abre el proyecto y habilita **Speed Insights**.
3. Vuelve a desplegar si Vercel lo solicita y visita el sitio publicado para
   empezar a generar datos.

Speed Insights no recopila métricas durante el desarrollo local. La integración
se encuentra en `src/pages/index.astro`. El sitio se despliega en Vercel con el
adaptador oficial de Astro.
