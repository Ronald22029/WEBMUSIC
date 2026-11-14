import { readBody,getRouterParam,createError } from 'h3'
import { mutateLocalCatalog } from '../../../utils/local-catalog'
import { optionalMusicDb } from '../../../utils/admin-db'
import { safeCover,safeLabel } from '../../../utils/local-admin-entities'
import { getLocalSQLite, cleanSearch } from '../../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const id=getRouterParam(event,'id'),body=await readBody<Record<string,unknown>>(event)
 const title=safeLabel(body?.title,200),cover=safeCover(body?.cover)
 const year=Number(body?.year||0)
 if(!Number.isInteger(year)||year<0||year>2100)throw createError({statusCode:400,statusMessage:'Año inválido'})
 const genre=typeof body?.genre==='string'?body.genre.trim().slice(0,120):''
 const releaseType=typeof body?.releaseType==='string'?body.releaseType.trim().slice(0,80):''
 const sqlite=getLocalSQLite()
 if(sqlite){
  const old=sqlite.prepare('SELECT artist_id FROM albums WHERE id=?').get(id) as {artist_id:string}|undefined
  if(!old)throw createError({statusCode:404,statusMessage:'Álbum no encontrado'})
  sqlite.prepare('UPDATE albums SET title=?,cover=?,year=?,genre=?,release_type=? WHERE id=?').run(title,cover,year,genre,releaseType,id)
  const artist=sqlite.prepare('SELECT name FROM artists WHERE id=?').get(old.artist_id) as {name:string}
  const trackRows=sqlite.prepare('SELECT id,title FROM tracks WHERE album_id=?').all(id) as {id:string;title:string}[]
  const update=sqlite.prepare('UPDATE tracks SET search_text=? WHERE id=?')
  for(const track of trackRows)update.run(cleanSearch([track.title,artist.name,title].join(' ')),track.id)
  return {ok:true,id}
 }
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Disponible en modo local'})
 await mutateLocalCatalog(data=>{
  const album=data.albums.find(a=>a.id===id)
  if(!album)throw createError({statusCode:404,statusMessage:'Álbum no encontrado'})
  album.title=title;album.cover=cover;album.year=year;album.genre=genre;album.releaseType=releaseType
 })
 return {ok:true,id}
})
