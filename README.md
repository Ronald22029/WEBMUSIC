# WEBMUSIC 🎵

Plataforma musical web, tipo biblioteca de artistas, álbumes y canciones, desarrollada con **Nuxt + Vue + TypeScript + Tailwind CSS**. Preparada para utilizar **Cloudflare D1**; el audio se reproduce exclusivamente a través de enlaces externos HTTPS autorizados.

## Ejecutar localmente

Requisitos: Node.js 22 o superior y npm.

```bash
git clone https://github.com/Ronald22029/WEBMUSIC.git
cd WEBMUSIC
npm install
npm run dev
```

Abre http://localhost:3000.

## Funciones implementadas

- Inicio responsive con álbum destacado, artistas y canciones populares.
- Buscador por artista, canción o álbum.
- Rutas públicas de artistas y álbumes.
- Reproductor global con pausa, avance, retroceso, repetición, aleatorio, volumen y cola.
- API de catálogo `GET /api/catalog`.
- Metadatos SEO por página, robots.txt y sitemap.xml inicial.
- Esquema SQL inicial para D1.

## Importante: datos de demostración

Los artistas, álbumes y canciones iniciales son **ficticios**, y sus enlaces de audio están vacíos intencionalmente. La interfaz muestra un aviso al intentar reproducir hasta que se registren fuentes HTTPS de audio autorizadas. Las imágenes de demostración son externas. No se incluyen archivos musicales.

Si no existe binding D1, la API muestra el catálogo ficticio. Si D1 está vinculado, la API lee las tablas reales. Una base D1 vacía mostrará una biblioteca vacía; se deben agregar datos antes de usarla.

## Cloudflare D1

1. Crea una base de datos llamada `webmusic` desde Cloudflare.
2. Sustituye `REEMPLAZAR_CON_ID_REAL` en `wrangler.jsonc` por el ID asignado.
3. Aplica migraciones con Wrangler (requiere sesión iniciada en Cloudflare):

```bash
npx wrangler d1 migrations apply webmusic --local
npx wrangler d1 migrations apply webmusic --remote
```

La integración de D1 usa `event.context.cloudflare.env.DB`; valida los bindings y el preset de despliegue en la versión de Nitro/Nuxt que instales antes de publicar. Configura `NUXT_PUBLIC_SITE_URL` con tu dominio definitivo.

## Estado y próximos pasos

**Fase inicial**: catálogo, UI, reproductor y esquema SQL. Aún no incluye autenticación, panel de administración, carga de canciones, búsqueda paginada en D1, registro de estadísticas persistentes, APK ni despliegue automático. El sitemap usa datos de demostración y debe conectarse al catálogo real antes de producción.

No se ha ejecutado una compilación completa en este entorno. Realiza `npm install && npm run build` y `npm run typecheck` tras clonar.

## Derechos

Solo incorpora enlaces de audio que tengas autorización para distribuir o reproducir. Algunos servidores bloquean streaming directo o reproducción desde sitios externos.
