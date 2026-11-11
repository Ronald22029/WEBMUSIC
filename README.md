# WEBMUSIC 🎵

Biblioteca musical basada en Nuxt, Vue 3 y TypeScript, con reproducción mediante enlaces externos.

## Catálogo actual
3 artistas, 49 álbumes y 469 canciones importadas desde los CSV proporcionados, con URLs externas y portadas, orden de pista y año.

## Ejecutar en Windows
Requiere Node 22 o superior.

```powershell
git clone https://github.com/Ronald22029/WEBMUSIC.git
cd WEBMUSIC
npm install
npm run dev
```

Abre http://localhost:3000.

## Funciones disponibles
- Inicio con álbum destacado, discografías y artistas.
- Navegación responsive, barra de búsqueda con sugerencias, filtros y ordenamientos por artista, año y nombre.
- Página de canciones con paginación visual (30 canciones por página).
- Reproductor único global HTML5 Audio con cola, controles multimedia, barra de tiempo, repetir, aleatorio, volumen y álbum animado en pantalla completa.
- Ecualizador **visual animado** (no representa frecuencia real), indicador de buffering, mensajes de error y modo de movimiento reducido.
- Favoritos e historial local en el navegador, sin cuenta.
- SEO base, rutas de artista/álbum, sitemap y robots.
- Preparado para Cloudflare D1, con esquema SQL y seed.

## Añadir nuevos artistas mediante CSV
Mueve nuevos archivos CSV a una carpeta en tu computadora. Los archivos deben seguir el formato de los anteriores e incluir `artista,album,cancion,url_audio`. Recomendados: `artista_slug,anio,numero_pista,genero,tipo_lanzamiento,url_portada,url_cancion`.

```powershell
npm run import -- ".\nuevos\artista_1.csv" ".\nuevos\artista_2.csv"
npm run dev
```

El importador procesa CSV entrecomillados correctamente, fusiona por ID estable, preserva artistas previos y regenerará:
- `server/data/catalog.json`: el catálogo usado localmente sin D1
- `db/seed.sql`: datos SQL para D1

Vuelve a ejecutar el comando sin duplicar los registros equivalentes. Revisa el resumen de registros nuevos, actualizados y omitidos. **No debes editar el código cada vez que agregues artistas.**

> Precaución: el nombre, número de pista y álbum determinan una clave estable. Si cambias estos datos en un CSV antiguo, el importador puede interpretarlos como una pista distinta; revisa duplicados antes de publicar.

## Cloudflare D1
1. Crea una D1 llamada `webmusic`.
2. Copia `wrangler.example.jsonc` a `wrangler.jsonc` y rellena el ID verdadero (el archivo local no se versiona).
3. Para el entorno local:
```bash
npx wrangler d1 migrations apply webmusic --local
npx wrangler d1 execute webmusic --local --file=./db/seed.sql
```
4. Para remotos, usa `--remote` **solo cuando estés listo** y se hayan verificado derechos y fuentes.

El backend usa D1 cuando el binding `DB` está disponible; en local sin binding usa el JSON. Por ahora el backend devuelve como máximo 500 artistas, 500 álbumes y 1000 pistas; antes de escalar se deben implementar paginación SQL y búsqueda indexada del lado del servidor.

## Estado y advertencias
- **No se ha comprobado la reproducción real de los enlaces de audio.** Un enlace puede bloquear hotlink, necesitar autenticación o estar roto.
- La presencia de un enlace en CSV no acredita permiso para transmitir música comercial. Verifica los derechos de reproducción y licencias correspondientes antes de publicar una web pública.
- La duración está ausente de los CSV, se muestra cuando el navegador la detecta.
- Los favoritos e historial solo están en el navegador actual, no sincronizados entre dispositivos.
- El ecualizador es una animación decorativa, no un analizador del audio.
- Autenticación, playlists sincronizadas, administración visual, API para importaciones, búsqueda server-side, APK y despliegue están pendientes.
- `npm run build` se verifica mediante GitHub Actions; no se ha verificado reproducción de enlaces por navegador.
