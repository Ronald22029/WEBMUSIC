# WEBMUSIC 🎵

Plataforma musical en **Nuxt 4 + Vue 3 + TypeScript + Tailwind**, preparada para Cloudflare D1, SEO y futura aplicación Android.

## Catálogo inicial importado de CSV

| Artista | Álbumes | Canciones |
| --- | ---: | ---: |
| Alex Campos | 17 | 186 |
| Alex Zurdo | 25 | 182 |
| Barak | 7 | 101 |
| **Total** | **49** | **469** |

Los enlaces de audio y portadas se conservan como URLs externas HTTPS. Las duraciones no estaban en los CSV y se muestran como desconocidas hasta que el audio transmita sus metadatos. Los registros se hallan en `server/data/catalog.json` (para iniciar sin D1) y `db/seed.sql` (importación SQL).

**Importante:** la existencia de una URL y el estado ENCONTRADO de los archivos no verifican que se pueda reproducir, que el servidor permita hotlink o que haya permiso legal para transmitir las grabaciones. Comprueba las licencias antes de publicar música.

## Ejecutar local

Requiere Node.js 22 o superior.

```powershell
git clone https://github.com/Ronald22029/WEBMUSIC.git
cd WEBMUSIC
npm install
npm run dev
```

Abre http://localhost:3000. En local, la API usa el catálogo importado como alternativa cuando no hay base D1 vinculada.

## Cloudflare D1

1. Crea una base de datos D1 llamada `webmusic`.
2. Copia `wrangler.example.jsonc` a `wrangler.jsonc` y reemplaza `PON_AQUI_EL_ID_REAL` por el UUID real.
3. Aplica la migración y la semilla:

```bash
npx wrangler d1 migrations apply webmusic --local
npx wrangler d1 execute webmusic --local --file=./db/seed.sql
# Ejecuta --remote solo después de revisar derechos y configurar Cloudflare
```

Para producción: configura `NUXT_PUBLIC_SITE_URL` con tu dominio, ejecuta `npm run build` y revisa el resultado antes de `npx wrangler deploy`. El preset de Nitro es `cloudflare_module` según la guía de Cloudflare para Nuxt/Nitro v2.

## Funciones disponibles

- Catálogo importado: 3 artistas, 49 álbumes, 469 pistas.
- Inicio responsive, páginas de artistas/álbumes y buscador simple de catálogo.
- Reproductor HTML5 Audio para URL externa, cola, avance, repetición, aleatorio y volumen.
- Sitemap básico y metadatos por página.
- Esquema SQL para D1, todavía sin despliegue.

## Límites actuales

La API de D1 lee hasta 500 artistas, 500 álbumes y 1000 pistas por consulta: es un MVP; agregar paginación, servidor de búsqueda e índices especializados antes de escalar. El sitemap usa el JSON del repo, no una D1 que cambie en tiempo real. Autenticación, favoritos reales, playlists, editor de catálogo, API de importación y APK siguen pendientes.

La instalación/build no han sido ejecutados desde la conexión GitHub; se requiere validación con Node o CI.
