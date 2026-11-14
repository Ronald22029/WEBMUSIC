import { setHeader,createError } from 'h3'
import { optionalMusicDb } from '../../utils/admin-db'
import { readLocalCatalog } from '../../utils/local-catalog'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Usa exportación específica para D1'})
 const sqlite=getLocalSQLite()
 if(sqlite){
  const count=sqlite.prepare('SELECT COUNT(*) AS count FROM tracks').get() as {count:number}
  if(count.count>10000)throw createError({statusCode:413,statusMessage:'El catálogo es muy grande para exportarlo como JSON. Copia el archivo .data/webmusic/webmusic.sqlite con el servidor detenido.'})
 }
 const catalog=await readLocalCatalog()
 setHeader(event,'content-type','application/json; charset=utf-8')
 setHeader(event,'content-disposition','attachment; filename="webmusic-catalog-backup.json"')
 setHeader(event,'cache-control','no-store')
 return JSON.stringify(catalog,null,2)
})
