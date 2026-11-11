# WEBMUSIC — Plataforma musical local 🎵

WEBMUSIC es una biblioteca musical desarrollada con Nuxt, Vue 3, TypeScript y Tailwind CSS. Los enlaces de audio y portada son externos: **no se descargan ni almacenan archivos de música**.

## Ahora TODO se desarrolla en tu PC

No necesitas crear cuentas de Cloudflare, Firebase, Vercel ni contratar un servidor. La web y el panel de administración funcionan localmente y los cambios se conservan al apagar el equipo.

La base de datos actual para desarrollo es un archivo privado:
`.data/webmusic/catalog.local.json`. Al modificar canciones o importar CSV, el servidor actualiza este archivo mediante una escritura atómica y mantiene `.data/webmusic/catalog.local.json.bak` como copia del estado anterior.

La carpeta `.data/` está excluida de Git. **No ejecutes `git clean -fdx` ni borres `.data` sin guardar tu respaldo.**

## 1. Instalar y ejecutar

Requisitos: Node.js 22 o superior y Git.

```powershell
git clone https://github.com/Ronald22029/WEBMUSIC.git
cd WEBMUSIC
npm install
npm run dev
```

Accede a: http://localhost:3000.

Si ya lo tienes instalado:

```powershell
cd C:\WEBMUSIC
git pull origin main
npm install
npm run dev
```

## 2. Habilitar administrador local

Crea `.env` en la raíz del proyecto. Añade **valores tuyos**, distintos de los ejemplos:

```dotenv
NUXT_ADMIN_PASSWORD=CONTRASENA_PRIVADA_DE_12_O_MAS_CARACTERES
NUXT_ADMIN_SESSION_SECRET=SECRETO_PRIVADO_ALEATORIO_DE_32_O_MAS_CARACTERES
```

En PowerShell, para generar un secreto de sesión seguro puedes ejecutar:

```powershell
-join ((1..48) | ForEach-Object { '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[(Get-Random -Maximum 62)] })
```

Reinicia el servidor después de crear o cambiar el archivo `.env`. El panel está en:

**http://localhost:3000/admin**

Funciones locales:
- Inicio de sesión administrativo protegido (cookie HttpOnly + firma HMAC).
- Estadísticas: artistas, álbumes y canciones.
- Importación de CSV (máximo 750 canciones o 650 KB por archivo).
- Vista previa con advertencias antes de guardar.
- Detección de duplicados por identificador estable.
- Edición de título, URL HTTPS de audio y visibilidad de cada canción.
- Descarga de copia de seguridad JSON.
- Actualización del catálogo del sitio sin editar archivos de código.

**Las importaciones quedan en el servidor local, no en GitHub.** Si modificas tu código con `git pull`, no reemplaza los cambios guardados en `.data/`.

## 3. Catálogo inicial y nuevas importaciones

El proyecto arranca con una biblioteca incorporada de **3 artistas, 49 álbumes y 469 canciones**. Al primer cambio administrativo, copia el catálogo inicial a `.data/`, donde ya puedes seguir agregando canciones.

CSV admitido: columnas `artista,album,cancion,url_audio`. Opcionales: `artista_slug,anio,numero_pista,genero,tipo_lanzamiento,url_portada,url_cancion`.

Para importar desde el navegador:
1. Abre el panel administrativo.
2. Selecciona un CSV.
3. Haz clic en **Verificar y previsualizar**.
4. Revisa registros omitidos y duplicados; confirma que tienes permiso para utilizar los audios.
5. Haz clic en **Guardar en mi computadora**.

La biblioteca pública mostrará esos cambios al actualizar la página. Las URLs deben permitir reproducción desde el navegador; no están verificadas automáticamente.

También puedes usar el importador del repositorio, que modifica `server/data/catalog.json`, pero para trabajar normalmente **utiliza el panel web**; así mantienes los datos privados separados del código.

## 4. Respaldos

En `/admin` encontrarás **Descargar copia de seguridad**: exporta todo el catálogo como JSON.

Alternativamente copia estos archivos a una carpeta de respaldo:

- `.data/webmusic/catalog.local.json` (catálogo editable).
- `.data/webmusic/catalog.local.json.bak` (estado anterior al último guardado).

El almacenamiento es local, así que no se sincroniza con otro equipo automáticamente. Al reinstalar Windows o mover el proyecto, conserva esta carpeta.

## 5. Cloudflare, más adelante

No hace falta Cloudflare en esta fase. Conservamos un esquema SQL y una capa de acceso a datos para integrar D1 posteriormente, cuando quieras lanzar el sitio público.

Para compilar en local, el preset predeterminado es Node.js. El despliegue Cloudflare queda desactivado hasta que configuremos `NITRO_PRESET=cloudflare_module` y su binding D1. La migración de los cambios locales a D1 necesitará una importación propia en esa fase.

## 6. Pendientes

- Ampliar el panel con creación/edición completa de artistas y álbumes.
- Pruebas reales de reproducción y permisos de los enlaces externos.
- Cuentas, playlists y sincronización.
- Búsqueda paginada sobre una base real para catálogos mucho mayores.
- APK Android y despliegue público.

**Derechos:** encontrar una URL de música en internet no acredita que sea legal retransmitirla. Solo publica música con autorización o licencias aplicables.

## Prueba local experimental con Dailymotion (Génesis Campos)

En `/artista/genesis-campos` está el video `https://dai.ly/xbvseii`. La prueba integra el **Web SDK de Dailymotion**, no su reproductor legado. Si el servidor y navegador lo permiten, WEBMUSIC intenta reproducirlo con el video minimizado y la portada visible en el reproductor inferior.

**No es una modalidad de solo audio admitida oficialmente.** El reproductor necesita configuración de Dailymotion (Player ID) y puede exigir visibilidad para reproducción, publicidad y permisos. La integración puede no funcionar. Para diagnóstico se ofrece el botón **Mostrar video** y el enlace **Abrir Dailymotion**. No se modifican ni se extraen archivos de video/audio.

En `.env` puedes definir `NUXT_PUBLIC_DAILYMOTION_PLAYER_ID=TU_PLAYER_ID` con un reproductor creado en Dailymotion Studio. El ID `x8lr5` en `nuxt.config.ts` es un valor experimental de ejemplo y **no equivale a un Player ID propio**, por lo que debes configurar uno para una integración estable.

Si ocultar el reproductor está prohibido por los términos aplicables, utiliza siempre el reproductor visible o una fuente de audio autorizada. En producción es necesario revisar las licencias musicales y condiciones de inserción.
