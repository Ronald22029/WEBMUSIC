import { getRouterParam, readBody, createError } from 'h3'
import { optionalMusicDb } from '../../../utils/admin-db'
import { mutateLocalCatalog } from '../../../utils/local-catalog'
import { validHttps } from '../../../utils/csv-music'
export default defineEventHandler(async event => {
 const id=getRouterParam(event,'id')
 if(!id || id.length>250)throw createError({statusCode:400,statusMessage:'Identificador no válido'})
 const body=await readBody<Record<string,unknown>>(event)
 const title=typeof body?.title==='string'?body.title.trim():''
 const audioUrl=typeof body?.audioUrl==='string'?validHttps(body.audioUrl):''
 if(!title||title.length>200||!audioUrl || typeof body?.published!=='boolean')
  throw createError({statusCode:400,statusMessage:'Indica título, enlace HTTPS y visibilidad válidos'})
 const published=body.published?1:0
 const db=optionalMusicDb(event)
 if(!db){
  await mutateLocalCatalog(data=>{
   const track=data.tracks.find(t=>t.id===id)
   if(!track)throw createError({statusCode:404,statusMessage:'Canción no encontrada'})
   track.title=title
   track.audioUrl=audioUrl
   track.published=published
   track.sourceStatus='unverified'
  })
  return {ok:true,id,storage:'local'}
 }
 const previous=await db.prepare('SELECT id FROM tracks WHERE id=?').bind(id).first()
 if(!previous)throw createError({statusCode:404,statusMessage:'Canción no encontrada'})
 await db.prepare('UPDATE tracks SET title=?,audio_url=?,published=?,source_status=? WHERE id=?')
  .bind(title,audioUrl,published,'unverified',id).run()
 return {ok:true,id,storage:'cloudflare'}
})
