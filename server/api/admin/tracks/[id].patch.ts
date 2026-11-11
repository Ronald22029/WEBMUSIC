import { getRouterParam, readBody, createError } from 'h3'
import { requireMusicDb } from '../../../utils/admin-db'
import { validHttps } from '../../../utils/csv-music'
export default defineEventHandler(async(event)=>{
 const id=getRouterParam(event,'id')
 if(!id || id.length>250)throw createError({statusCode:400,statusMessage:'Identificador no válido'})
 const body=await readBody<Record<string,unknown>>(event)
 const title=String(body?.title||'').trim()
 const audioUrl=validHttps(String(body?.audioUrl||''))
 const published=body?.published===true||body?.published===1?1:0
 if(!title||title.length>200||!audioUrl)throw createError({statusCode:400,statusMessage:'Título y enlace HTTPS válidos son obligatorios'})
 const db=requireMusicDb(event)
 const old=await db.prepare('SELECT id FROM tracks WHERE id=?').bind(id).first()
 if(!old)throw createError({statusCode:404,statusMessage:'Canción no encontrada'})
 await db.prepare('UPDATE tracks SET title=?,audio_url=?,published=?,source_status=? WHERE id=?').bind(title,audioUrl,published,'unverified',id).run()
 return {ok:true,id}
})
