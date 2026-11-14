# CieloPlay — Cloudflare Workers + D1 (preparación, sin publicar)

## Estado y seguridad
- Se mantiene **intacto el modo local** con SQLite en Windows.
- Workers usa la vinculación **DB** de Cloudflare D1 para catálogo, búsqueda y administración.
- Solo se migran metadatos y URLs. **No se alojan audios**.
- Las variables de inicio de sesión de administrador se crearán como *secrets* más adelante.
- **No está desplegado** ni conectado a tu cuenta. No hay que compartir claves por el chat.

## 1. Comprobar compilación del Worker
Desde WEBMUSIC:
```powershell
npm install
$env:NITRO_PRESET="cloudflare_module"
npm run build
Remove-Item Env:NITRO_PRESET
```

## 2. Exportar SQLite a SQL (sin red)
```powershell
node scripts/export-d1.mjs
```
El resultado privado quedará en `.data/cloudflare-import/` (y no se debe subir a GitHub).
Contiene un `manifest.json` y SQL dividido en pequeños archivos ordenados por artistas, álbumes y canciones.

## 3. Vincular Cloudflare (ETAPA POSTERIOR)
1. Abrir una cuenta gratuita de Cloudflare e iniciar sesión con `npx wrangler login`.
2. Crear D1 con `npx wrangler d1 create cieloplay-db`.
3. Copiar el **database_id real** devuelto por Cloudflare en `wrangler.jsonc`, sustituyendo el UUID todo-cero.
4. Aplicar esquema y fragmentos SQL una vez comprobado respaldo:
```powershell
node scripts/apply-d1.mjs --remote
# El comando anterior solo muestra la vista previa, no modifica datos.
node scripts/apply-d1.mjs --remote --apply
```
5. Guardar secretos (nunca en Git):
```powershell
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```
6. Compilar con el preset Cloudflare y publicar **solo después de comprobar** que responde el Worker:
```powershell
$env:NITRO_PRESET="cloudflare_module"
npm run build
npx wrangler deploy
Remove-Item Env:NITRO_PRESET
```
7. Comprobar número de artistas/álbumes/canciones, reproducción y búsquedas. No vincular dominio ni divulgar la URL hasta terminar las verificaciones.

## Costos y límites
Cloudflare Free tiene límites diarios de solicitudes y consultas D1. Los metadatos públicos usan cabeceras de caché conservadoras. No se garantiza gratuidad indefinida ni ausencia de restricciones del proveedor de audio.

## Importante
- El esquema D1 no incluye audios, usuarios, contraseñas ni favoritos guardados en el navegador.
- Si CieloPlay se vuelve público, revisa las licencias de música/portadas y si los proveedores permiten reproducción en tu dominio.
- Antes de utilizar `--remote --apply`, conserva una copia de tu archivo `.data/webmusic/webmusic.sqlite`.
- El plan actual mantiene la base local como fuente de desarrollo y usa D1 para producción, no sincroniza cambios automáticamente.

## Caché pública y límites gratuitos
Las rutas GET `/api/catalog` y `/api/tracks` utilizan la Cache API de Cloudflare cuando está disponible. El TTL es de 300 s para catálogo y 120 s para búsquedas. Los cambios administrativos pueden tardar ese tiempo en reflejarse en otras ubicaciones. No se cachea nada de `/api/admin/`, ninguna canción ni playlists personales.

La búsqueda actual por fragmentos utiliza `LIKE '%texto%'`: puede resultar costosa en D1 con tráfico elevado. Antes de abrir al público es recomendable medir `rows_read` y considerar un índice FTS5. El plan gratuito no garantiza uso ilimitado.
