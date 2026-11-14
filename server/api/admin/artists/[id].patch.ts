import { readBody,getRouterParam,createError } from 'h3'
import { mutateLocalCatalog } from '../../../utils/local-catalog'
import { optionalMusicDb } from '../../../utils/admin-db'
import { safeCover,safeLabel } from '../../../utils/local-admin-entities'
import { getLocalSQLite, cleanSearch } from '../../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const id=getRouterParam(event,'id'),body=await readBody<Record<string,unknown>>(event)
 const name=safeLabel(body?.name),cover=safeCover(body?.cover)
 const description=typeof body?.description==='string'?body.description.trim().slice(0,2000):''
 const cloud=optionalMusicDb(event)
 if(cloud){
  const previous=await cloud.prepare('SELECT id FROM artists WHERE id=?').bind(id).first()
  if(!previous)throw createError({statusCode:404,statusMessage:'Artista no encontrado'})
  const oldName=await cloud.prepare('SELECT name FROM artists WHERE id=?').bind(id).first<{name:string}>()
  await cloud.prepare('UPDATE artists SET name=?,cover=?,description=? WHERE id=?').bind(name,cover,description,id).run()
  if(oldName?.name!==name){
   // Buscar por nombre de artista requiere refrescar textos indexables.
   const tracks=await cloud.prepare('SELECT id,title,album_id AS albumId FROM tracks WHERE artist_id=?').bind(id).all<{id:string;title:string;albumId:string}>()
   const albums=await cloud.prepare('SELECT id,title FROM albums WHERE artist_id=?').bind(id).all<{id:string;title:string}>()
   const names=new Map(albums.results.map(a=>[a.id,a.title]))
   for(let i=0;i<tracks.results.length;i+=50){
    await cloud.batch(tracks.results.slice(i,i+50).map(t=>
     cloud.prepare('UPDATE tracks SET search_text=? WHERE id=?').bind(cleanSearch([t.title,name,names.get(t.albumId)||''].join(' ')),t.id)))
   }
  }
  return {ok:true,id}
 }
 const sqlite=getLocalSQLite()
 if(sqlite){
  if(!sqlite.prepare('SELECT id FROM artists WHERE id=?').get(id))throw createError({statusCode:404,statusMessage:'Artista no encontrado'})
  sqlite.prepare('UPDATE artists SET name=?,cover=?,description=? WHERE id=?').run(name,cover,description,id)
  return {ok:true,id}
 }
 await mutateLocalCatalog(data=>{
  const artist=data.artists.find(a=>a.id===id)
  if(!artist)throw createError({statusCode:404,statusMessage:'Artista no encontrado'})
  artist.name=name;artist.cover=cover;artist.description=description
 })
 return {ok:true,id}
})
