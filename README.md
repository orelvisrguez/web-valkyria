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
en `src/pages/index.astro`. Las fotografías de la galería son imágenes de
inspiración de Unsplash y están identificadas como tales; reemplázalas por
fotos propias cuando estén disponibles.

La dirección y el horario publicados corresponden a la información disponible
en el perfil público de Google del estudio. Verifica los datos antes de
publicar cambios.
