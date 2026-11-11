import { readBody, createError } from 'h3'
import { mutateLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
import { entitySlug, safeCover, safeLabel } from '../../utils/local-admin-entities'
export default defineEventHandler(async event=>{
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Editor de artistas disponible en modo local'})
 const body=await readBody<Record<string,unknown>>(event)
 const name=safeLabel(body?.name),slug=entitySlug(name),cover=safeCover(body?.cover)
 const description=typeof body?.description==='string'?body.description.trim().slice(0,2000):''
 if(!slug)throw createError({statusCode:400,statusMessage:'El nombre del artista no permite generar un identificador'})
 const id='a-'+slug
 await mutateLocalCatalog(data=>{
  if(data.artists.some(a=>a.id===id||a.slug===slug))throw createError({statusCode:409,statusMessage:'El artista ya existe'})
  data.artists.push({id,name,slug,description,cover,accent:'#a17aff'})
  data.artists.sort((a,b)=>a.name.localeCompare(b.name,'es'))
 })
 return {ok:true,id}
})
