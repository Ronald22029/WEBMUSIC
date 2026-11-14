import { readBody, createError } from 'h3'
import { readLocalCatalog } from '../utils/local-catalog'
import { getLocalSQLite, sqliteTracks } from '../utils/sqlite-catalog'
import { optionalMusicDb } from '../utils/admin-db'
import { tracksByIdsD1 } from '../utils/d1-catalog'
import type { TrackPage } from '../../types/music'
export default defineEventHandler(async event=>{
 setHeader(event,'cache-control','no-store')
 const body=await readBody<{ids?:unknown}>(event)
 if(!Array.isArray(body?.ids))throw createError({statusCode:400,statusMessage:'Se requiere un array de identificadores'})
 if(body.ids.length>250)throw createError({statusCode:413,statusMessage:'Máximo 250 identificadores por consulta'})
 const ids=[...new Set(body.ids.filter((id):id is string=>typeof id==='string'&&id.length<=250&&id.length>0))]
 if(!ids.length)return {rows:[],total:0,offset:0,limit:250} satisfies TrackPage
 const cloud=optionalMusicDb(event)
 if(cloud)return tracksByIdsD1(cloud,ids)
 const sqlite=getLocalSQLite()
 if(sqlite)return sqliteTracks(sqlite,{ids,limit:250})
 const data=await readLocalCatalog()
 const rows=data.tracks.filter(t=>t.published!==0&&ids.includes(t.id))
 return {rows,total:rows.length,offset:0,limit:250} satisfies TrackPage
})
