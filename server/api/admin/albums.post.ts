import { readBody,createError } from 'h3'
import { mutateLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
import { entitySlug,safeCover,safeLabel } from '../../utils/local-admin-entities'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const body=await readBody<Record<string,unknown>>(event)
 const title=safeLabel(body?.title,200),artistId=String(body?.artistId||''),cover=safeCover(body?.cover)
 const year=Number(body?.year||0)
 if(!Number.isInteger(year)||year<0||year>2100)throw createError({statusCode:400,statusMessage:'Año inválido'})
 const genre=typeof body?.genre==='string'?body.genre.trim().slice(0,120):''
 const releaseType=typeof body?.releaseType==='string'?body.releaseType.trim().slice(0,80):'Álbum'
 const titleSlug=entitySlug(title)
 if(!titleSlug)throw createError({statusCode:400,statusMessage:'Título inválido'})
 const sqlite=getLocalSQLite()
 if(sqlite){
  const artist=sqlite.prepare('SELECT slug FROM artists WHERE id=?').get(artistId) as {slug:string}|undefined
  if(!artist)throw createError({statusCode:400,statusMessage:'Primero debes crear el artista'})
  const slug=artist.slug+'-'+titleSlug,id='alb-'+slug
  if(sqlite.prepare('SELECT id FROM albums WHERE id=? OR slug=?').get(id,slug))throw createError({statusCode:409,statusMessage:'El álbum ya existe'})
  sqlite.prepare("INSERT INTO albums(id,title,slug,artist_id,year,cover,genre,release_type,source_url,published) VALUES(?,?,?,?,?,?,?,?,'',1)").run(id,title,slug,artistId,year,cover,genre,releaseType)
  return {ok:true,id}
 }
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Disponible en modo local'})
 const id=await mutateLocalCatalog(data=>{
  const artist=data.artists.find(a=>a.id===artistId)
  if(!artist)throw createError({statusCode:400,statusMessage:'Primero debes crear el artista'})
  const slug=artist.slug+'-'+titleSlug,id='alb-'+slug
  if(data.albums.some(a=>a.id===id||a.slug===slug))throw createError({statusCode:409,statusMessage:'El álbum ya existe'})
  data.albums.push({id,title,slug,artistId,cover,year,genre,releaseType})
  return id
 })
 return {ok:true,id}
})
