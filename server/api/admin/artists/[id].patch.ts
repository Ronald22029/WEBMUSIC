import { readBody, getRouterParam, createError } from 'h3'
import { mutateLocalCatalog } from '../../../utils/local-catalog'
import { optionalMusicDb } from '../../../utils/admin-db'
import { safeCover, safeLabel } from '../../../utils/local-admin-entities'
export default defineEventHandler(async event=>{
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Editor de artistas disponible en modo local'})
 const id=getRouterParam(event,'id'),body=await readBody<Record<string,unknown>>(event)
 const name=safeLabel(body?.name),cover=safeCover(body?.cover)
 const description=typeof body?.description==='string'?body.description.trim().slice(0,2000):''
 await mutateLocalCatalog(data=>{
  const artist=data.artists.find(a=>a.id===id)
  if(!artist)throw createError({statusCode:404,statusMessage:'Artista no encontrado'})
  artist.name=name;artist.cover=cover;artist.description=description
 })
 return {ok:true,id}
})
