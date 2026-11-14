import { readBody, createError } from 'h3'
import { mutateLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
import { entitySlug,safeCover,safeLabel } from '../../utils/local-admin-entities'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const body=await readBody<Record<string,unknown>>(event)
 const name=safeLabel(body?.name),slug=entitySlug(name),cover=safeCover(body?.cover)
 const description=typeof body?.description==='string'?body.description.trim().slice(0,2000):''
 if(!slug)throw createError({statusCode:400,statusMessage:'Nombre inválido'})
 const id='a-'+slug
 const cloud=optionalMusicDb(event)
 if(cloud){
  const exists=await cloud.prepare('SELECT id FROM artists WHERE id=? OR slug=?').bind(id,slug).first()
  if(exists)throw createError({statusCode:409,statusMessage:'El artista ya existe'})
  await cloud.prepare("INSERT INTO artists(id,name,slug,description,cover,accent,genre,source_url,published) VALUES(?,?,?,?,?,'#a17aff','','',1)").bind(id,name,slug,description,cover).run()
  return {ok:true,id}
 }
 const sqlite=getLocalSQLite()
 if(sqlite){
  if(sqlite.prepare('SELECT id FROM artists WHERE id=? OR slug=?').get(id,slug))throw createError({statusCode:409,statusMessage:'El artista ya existe'})
  sqlite.prepare("INSERT INTO artists(id,name,slug,description,cover,accent,genre,source_url,published) VALUES(?,?,?,?,?,'#a17aff','','',1)").run(id,name,slug,description,cover)
  return {ok:true,id}
 }
 await mutateLocalCatalog(data=>{
  if(data.artists.some(a=>a.id===id||a.slug===slug))throw createError({statusCode:409,statusMessage:'El artista ya existe'})
  data.artists.push({id,name,slug,description,cover,accent:'#a17aff'})
 })
 return {ok:true,id}
})
