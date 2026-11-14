import { readBody, createError } from 'h3'
import { readLocalCatalog } from '../utils/local-catalog'
import { getLocalSQLite, sqliteTracks } from '../utils/sqlite-catalog'
import type { TrackPage } from '../../types/music'

// Búsqueda en lote para playlists y favoritos. No usa URL extensa con IDs.
// Conservamos el orden en el cliente, donde se guardaron las preferencias.
export default defineEventHandler(async event=>{
 setHeader(event,'cache-control','no-store')
 const body=await readBody<{ids?:unknown}>(event)
 if(!Array.isArray(body?.ids))throw createError({statusCode:400,statusMessage:'Se requiere un array de identificadores'})
 if(body.ids.length>250)throw createError({statusCode:413,statusMessage:'Máximo 250 identificadores por consulta'})
 const ids=[...new Set(body.ids.filter((id):id is string=>typeof id==='string'&&id.length<=250&&id.length>0))]
 if(!ids.length)return {rows:[],total:0,offset:0,limit:250} satisfies TrackPage
 const sqlite=getLocalSQLite()
 if(sqlite)return sqliteTracks(sqlite,{ids,limit:250})
 const data=await readLocalCatalog()
 const rows=data.tracks.filter(t=>t.published!==0&&ids.includes(t.id))
 return {rows,total:rows.length,offset:0,limit:250} satisfies TrackPage
})
