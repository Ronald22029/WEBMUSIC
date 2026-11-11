# WEBMUSIC 🎵

Aplicación musical Nuxt + TypeScript con biblioteca, reproductor y administración protegida. Las canciones utilizan enlaces HTTPS externos: **no se almacenan archivos de audio en el proyecto**.

## Inicio rápido (Windows)

Requiere Node.js 22+:

```powershell
git clone https://github.com/Ronald22029/WEBMUSIC.git
cd WEBMUSIC
npm install
npm run dev
```

Visita http://localhost:3000. El catálogo JSON provisional incluye **3 artistas, 49 álbumes y 469 canciones**; la disponibilidad de los enlaces externos no se ha verificado.

## Panel de administración

URL: **http://localhost:3000/admin**

El panel está **deshabilitado por defecto**. Para habilitarlo en local crea un archivo `.env` en la raíz del proyecto (nunca lo subas a GitHub) y define:

```dotenv
NUXT_ADMIN_PASSWORD=UNA_CONTRASENA_LARGA_Y_UNICA
NUXT_ADMIN_SESSION_SECRET=UN_SECRETO_ALEATORIO_LARGO_DE_AL_MENOS_32_CARACTERES
```

**Reemplaza ambos ejemplos por valores privados y aleatorios.** La contraseña necesita al menos 12 caracteres; el secreto, al menos 32. Reinicia `npm run dev` tras guardar el archivo.

Puedes entrar, consultar estadísticas y **previsualizar CSV sin D1**, pero el guardado/importación remota estará deshabilitado hasta vincular la base. El panel permite:

- Buscar y ver canciones mediante paginación.
- Editar título, URL de audio y visibilidad de una canción (requiere D1).
- Cargar un CSV con el formato original, previsualizarlo y revisar registros omitidos.
- Confirmar permiso de uso de los audios antes de importarlos en D1.

La autenticación administrativa usa sesión firmada HMAC, cookie HttpOnly y SameSite=Strict. Se valida autorización en el servidor en **todas las rutas de administración**, no solo en la interfaz. Existe un control básico anti-intentos repetidos por instancia; **en producción configura también WAF / rate limiting de Cloudflare**. No uses la contraseña administrativa de desarrollo como credencial de producción.

### Configurar Cloudflare D1

1. Crea una cuenta/proyecto Cloudflare y una base D1 llamada `webmusic`.
2. Copia `wrangler.example.jsonc` a `wrangler.jsonc`, reemplazando `PON_AQUI_EL_ID_REAL` por el identificador verdadero.
3. Ejecuta:

```bash
npx wrangler d1 migrations apply webmusic --local
npx wrangler d1 execute webmusic --local --file=./db/seed.sql
```

Para usar D1 desde el panel, ejecuta el proyecto con un binding `DB` disponible en el runtime Cloudflare (por ejemplo mediante Wrangler). El dev server estándar de Nuxt sin el binding mostrará solo la vista previa.

En Cloudflare añade `ADMIN_PASSWORD` y `ADMIN_SESSION_SECRET` como **secrets de Worker**, nunca como variables públicas ni en Git. Opcionalmente Nuxt puede leer las variables privadas `NUXT_ADMIN_PASSWORD` y `NUXT_ADMIN_SESSION_SECRET`.

Para producción, aplica migraciones con `--remote` y considera importar `db/seed.sql` **únicamente después de revisar las autorizaciones de distribución de los audios**. La versión inicial del catálogo todavía está en el JSON versionado.

### CSV compatible

Columnas obligatorias: `artista,album,cancion,url_audio`.
Recomendadas: `artista_slug,anio,numero_pista,genero,tipo_lanzamiento,url_portada,url_cancion`.

Desde el navegador, los CSV se procesan en lotes de **hasta 750 registros o 650 KB** para evitar límites de Workers y D1. El importador evita duplicados idénticos mediante identificadores estables de artista, álbum y número/título de pista, y usa operaciones SQL parametrizadas. La importación reintenta por lotes sin crear nuevos duplicados de los mismos IDs.

Para una importación local sin D1 también existe:

```powershell
npm run import -- ".\nuevos\artista_1.csv" ".\nuevos\artista_2.csv"
```

Este comando reescribe `server/data/catalog.json` y `db/seed.sql` sin eliminar registros existentes.

## Estado del producto

**Disponible:** catálogo, páginas de artista/álbum, búsqueda básica, filtros, reproducción con HTML5 Audio, reproductor animado, biblioteca local, SEO inicial, panel administrador con acceso protegido, CSV preview, importación D1, edición básica de canciones.

**Pendiente:** publicar en Cloudflare, configurar D1 real, CRUD de artistas/álbumes completo, perfiles de usuario, favoritos sincronizados, playlists, búsqueda SQL indexada y paginada, sitemap desde D1, app Android y validaciones reales de derechos y reproducción de cada enlace.

El catálogo público cuando D1 está vinculado usa un límite temporal de 500 artistas, 500 álbumes y 1000 pistas. **No es una implementación para millones de canciones**: antes de crecer hay que reemplazar ese endpoint por consultas paginadas, búsqueda indexada y caché. La importación web puede hacer visible música recién agregada en D1, pero el sitemap sigue dependiendo del catálogo versionado hasta la siguiente fase.

## Seguridad y derechos

No subir archivos `.env`, secretos, contraseñas ni claves API al repositorio.

Un URL de audio encontrado en un CSV **no demuestra** que sea una fuente autorizada, que funcione ni que permita hotlinking. Solo publica fuentes para las que dispongas de autorización de reproducción pública. Los datos del CSV original se mantienen en el repositorio como referencia provisional hasta realizar la revisión.
