import { setHeader, createError } from 'h3'
import { optionalMusicDb } from '../../utils/admin-db'
import { readLocalCatalog } from '../../utils/local-catalog'
export default defineEventHandler(async event => {
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Usa una exportación específica para D1'})
 const catalog=await readLocalCatalog()
 setHeader(event,'content-type','application/json; charset=utf-8')
 setHeader(event,'content-disposition','attachment; filename="webmusic-catalog-backup.json"')
 setHeader(event,'cache-control','no-store')
 return JSON.stringify(catalog,null,2)
})
