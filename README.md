# WEBMUSIC 🎵 — catálogo completo local

Aplicación Nuxt/Vue con reproductor nativo y biblioteca local. **Los archivos de música no se descargan**: el catálogo solo contiene metadatos y enlaces externos, cuya disponibilidad y autorización deben verificarse.

## Novedad: catálogo consolidado de catalogo_enlaces.rar

El archivo `WEBMUSIC_catalogo_completo_local.zip` contiene una base SQLite lista para WEBMUSIC con:

- **1.036 artistas**, incluyendo las fichas de artistas sin canciones.
- **3.433 álbumes**, incluyendo listas de canciones sueltas y fichas sin pistas.
- **36.722 canciones**, **36.721 con enlaces HTTPS** y 1 pista sin enlace (oculta hasta corregirla).
- **1 enlace sin asignar**, guardado por separado en `unassigned_links`.
- Metadatos de artista, género, año, portada, tipo de lanzamiento, orden de pista y referencias de origen.
- Índices para búsqueda de canciones, filtrado por artista/álbum/género y paginación.

Cifras de *registros distintos* (artista + álbum + número de pista + canción + URL). No se ha verificado si las URL siguen activas ni sus derechos de reproducción.

La base SQL se distribuye separadamente del repositorio para evitar subir 33 MB de datos al historial Git.

### Instalar en Windows

Requiere Node.js 22+ y Git.

1. Detén tu servidor WEBMUSIC: `Ctrl+C`.
2. Actualiza:

```powershell
git pull origin main
npm install
```

3. Descarga el ZIP de catálogo completo de esta conversación. **Extrae su contenido en la carpeta raíz de WEBMUSIC** (donde está `package.json`).

Debe quedar exactamente:

```text
WEBMUSIC/
  package.json
  .data/
    webmusic/
      webmusic.sqlite
```

4. Enciende:

```powershell
npm run dev
```

5. Visita `http://localhost:3000`. Comprueba artistas, álbumes, búsqueda y canciones. No requiere Cloudflare.

En Windows, desde la carpeta WEBMUSIC puedes extraer el ZIP con:

```powershell
Expand-Archive -LiteralPath "RUTA\WEBMUSIC_catalogo_completo_local.zip" -DestinationPath "." -Force
```

**IMPORTANTE:** La carpeta `.data/` no se guarda en GitHub. No la borres ni reemplaces una base modificada sin crear un respaldo.

### ¿Qué pasa con mis cambios anteriores?

Al abrir la base por primera vez, WEBMUSIC detecta `.data/webmusic/catalog.local.json` y fusiona sus artistas, álbumes y canciones con SQLite. Las ediciones del catálogo anterior tienen prioridad en registros con el mismo identificador. Se marca la migración para no repetirla.

Nunca se modifica el archivo JSON previo durante esa migración. Conserva el JSON hasta comprobar tus datos.

### Rendimiento

- La API `/api/catalog` envía artistas, álbumes y **solo 60 canciones recientes** para la portada y los componentes globales.
- La API `/api/tracks` devuelve las canciones por páginas y permite filtros `q`, `artistId`, `albumId`, `genre`, `ids` y `offset`.
- Artistas y álbumes se muestran en páginas de 60 tarjetas. Las pistas por álbum se solicitan por páginas y el reproductor mantiene su cola actual.
- El panel administrativo edita los datos directamente en SQLite; para una copia de seguridad, copia `.data/webmusic/webmusic.sqlite` con el servidor detenido.
- La importación CSV desde el panel permanece disponible para nuevos registros en SQLite.

### Administrador local

Accede a `http://localhost:3000/admin`. En el archivo `.env` configura contraseñas privadas:

```dotenv
NUXT_ADMIN_PASSWORD=REEMPLAZA_POR_CLAVE_DE_12_O_MAS
NUXT_ADMIN_SESSION_SECRET=REEMPLAZA_POR_SECRETO_DE_32_O_MAS
```

No subas `.env` a GitHub. Reinicia `npm run dev` después de cambiar esas variables.

### Nota de derechos y calidad

Las URL pueden estar caídas, ser temporales o bloquear reproducción externa; una URL no demuestra que exista permiso de distribución. Antes de publicar WEBMUSIC públicamente o enviarlo a Google Play, verifica autorizaciones de reproducción, portadas y datos de terceros. Esta implementación está preparada para uso de desarrollo local.

## Política de fechas de álbumes

- Los años no informados se guardan como `0` (sin año), pero **no se muestran** como `0`, raya ni año actual en el sitio.
- Al crear un álbum, el año es opcional y permanece vacío hasta que se indique una fecha respaldada.
- La migración `clear_unverified_miel_san_marcos_2020_v1` elimina el 2020 incorrectamente atribuido a cinco álbumes clásicos de Miel San Marcos. No modifica los años corregidos manualmente ni el 2020 confirmado de *Adorando en Casa (Amigos Invitados)*.
- Los demás años proceden del catálogo CSV original. **No se han verificado uno por uno**; no deben interpretarse como fechas certificadas. Pueden revisarse y corregirse desde el administrador.
