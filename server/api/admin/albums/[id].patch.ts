import { readBody, getRouterParam, createError } from 'h3'
import { mutateLocalCatalog } from '../../../utils/local-catalog'
import { optionalMusicDb } from '../../../utils/admin-db'
import { safeCover, safeLabel } from '../../../utils/local-admin-entities'
export default defineEventHandler(async event=>{
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Editor de álbumes disponible en modo local'})
 const id=getRouterParam(event,'id'),body=await readBody<Record<string,unknown>>(event)
 const title=safeLabel(body?.title,200),cover=safeCover(body?.cover)
 const year=Number(body?.year||0)
 if(!Number.isInteger(year)||year<0||year>2100)throw createError({statusCode:400,statusMessage:'Año inválido'})
 const genre=typeof body?.genre==='string'?body.genre.trim().slice(0,120):''
 const releaseType=typeof body?.releaseType==='string'?body.releaseType.trim().slice(0,80):''
 await mutateLocalCatalog(data=>{
  const album=data.albums.find(a=>a.id===id)
  if(!album)throw createError({statusCode:404,statusMessage:'Álbum no encontrado'})
  album.title=title;album.cover=cover;album.year=year;album.genre=genre;album.releaseType=releaseType
 })
 return {ok:true,id}
})
