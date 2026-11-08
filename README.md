# Valkyrias Nails Studios

Landing page estática para Valkyrias Nails Studios, estudio de manicura en
Caballito, Buenos Aires. Está desarrollada con [Astro](https://astro.build/)
y lista para publicar en servicios de hosting estático.

## Requisitos

- Node.js `>=22.23.4`
- npm `>=9.6.5`

## Instalación y desarrollo

```bash
npm ci
npm run dev
```

Astro muestra en la terminal la dirección local para abrir el sitio.

## Compilar y previsualizar

```bash
npm run build
npm run preview
```

La versión lista para publicar se genera en `dist/`. No subas `dist/`,
`node_modules/` ni `.astro/` al repositorio: Git los ignora y el sitio se
reconstruye con `npm run build`.

## Publicar en GitHub

1. Crea en GitHub un repositorio **vacío**, sin README, licencia ni archivos
   iniciales.
2. Desde esta carpeta, agrega la dirección de ese repositorio y sube la rama
   `main`:

   ```bash
   git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
   git push -u origin main
   ```

El proyecto incluye `package-lock.json`; usa `npm ci` para instalar las mismas
versiones de dependencias en cada entorno.

## Contenido

La página, sus servicios, enlaces sociales, horarios e imágenes se configuran
en `src/pages/index.astro`. La galería permite filtrar ideas de inspiración
por categoría; sus fotografías de Unsplash no representan trabajos del estudio.
Reemplázalas por fotos propias cuando estén disponibles. La sección de
opiniones incluye fragmentos de reseñas públicas de Google y enlaza al perfil
para consultar las reseñas completas. Los botones de reserva y consultas
abren WhatsApp.

La dirección y el horario publicados corresponden a la información disponible
en el perfil público de Google del estudio. Verifica los datos antes de
publicar cambios.

## SEO local e imágenes

Astro genera metadatos canonical y Open Graph/Twitter, una tarjeta de vista
previa de 1200 × 630 y datos estructurados `BeautySalon` con la dirección,
teléfono, ubicación y horario público del estudio. En Vercel, Astro toma el
dominio de producción de las variables del sistema. En otro hosting, configura
`SITE_URL` con la URL pública completa, por ejemplo `https://tudominio.com`.

Las imágenes de la galería están en `src/assets/` y se procesan con el
componente `<Picture />` de Astro para generar AVIF, WebP y varios tamaños
responsivos al compilar. La imagen para redes se mantiene en `public/og-image.svg`
y su versión PNG en `public/og-image.png`.

## Vercel Speed Insights

El sitio incluye el componente oficial `@vercel/speed-insights/astro`. Para
recibir métricas de rendimiento:

1. Importa el repositorio y despliega el proyecto en Vercel.
2. En el panel de Vercel, abre el proyecto y habilita **Speed Insights**.
3. Vuelve a desplegar si Vercel lo solicita y visita el sitio publicado para
   empezar a generar datos.

Speed Insights no recopila métricas durante el desarrollo local. La integración
se encuentra en `src/pages/index.astro`; al ser un sitio Astro estático, no
requiere configurar el adaptador de Vercel.
