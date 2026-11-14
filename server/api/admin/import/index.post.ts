import { createError, readBody } from 'h3'
import { optionalMusicDb } from '../../../utils/admin-db'
import { mutateLocalCatalog, mergeCsvTracks } from '../../../utils/local-catalog'
import { getLocalSQLite, cleanSearch } from '../../../utils/sqlite-catalog'
import { parseMusicCsv } from '../../../utils/csv-music'
export default defineEventHandler(async event => {
 const body=await readBody<{csv?:unknown;authorized?:unknown}>(event)
 if(body?.authorized!==true)throw createError({statusCode:400,statusMessage:'Debes confirmar la autorización de uso de los audios'})
 const parsed=parseMusicCsv(body.csv)
 const sqlite=getLocalSQLite()
 if(sqlite){
  const artists=new Map(parsed.rows.map(r=>[r.artistId,r]))
  const albums=new Map(parsed.rows.map(r=>[r.albumId,r]))
  const insertArtist=sqlite.prepare("INSERT OR IGNORE INTO artists(id,name,slug,description,cover,accent,genre,source_url,published) VALUES(?,?,?,?,?,'#a17aff',?,'',1)")
  const insertAlbum=sqlite.prepare("INSERT OR IGNORE INTO albums(id,title,slug,artist_id,year,cover,genre,release_type,source_url,published) VALUES(?,?,?,?,?,?,?,?,'',1)")
  const insertTrack=sqlite.prepare("INSERT INTO tracks(id,title,slug,artist_id,album_id,duration,audio_url,cover,plays,track_number,source_status,source_page,published,search_text) VALUES(?,?,?,?,?,0,?,?,0,?,'unverified',?,1,?) ON CONFLICT(id) DO UPDATE SET audio_url=excluded.audio_url,source_status='unverified',source_page=excluded.source_page,cover=CASE WHEN excluded.cover<>'' THEN excluded.cover ELSE tracks.cover END")
  sqlite.exec('BEGIN IMMEDIATE')
  try {
   for(const a of artists.values())insertArtist.run(a.artistId,a.artistName,a.artistSlug,'Discografía de '+a.artistName,a.cover,a.genre)
   for(const a of albums.values())insertAlbum.run(a.albumId,a.albumTitle,a.albumSlug,a.artistId,a.year,a.cover,a.genre,a.releaseType)
   for(const t of parsed.rows)insertTrack.run(t.id,t.title,t.slug,t.artistId,t.albumId,t.audioUrl,t.cover,t.trackNumber,t.sourcePage,cleanSearch([t.title,t.artistName,t.albumTitle].join(' ')))
   sqlite.exec('COMMIT')
  }catch(e){sqlite.exec('ROLLBACK');throw e}
  return {ok:true,storage:'local',summary:parsed.summary,message:'CSV importado correctamente en tu base SQLite local'}
 }
 const db=optionalMusicDb(event)
 if(!db) {
  const changes=await mutateLocalCatalog(data=>mergeCsvTracks(data,parsed.rows))
  return {ok:true,storage:'local',summary:parsed.summary,changes,
    message:'Canciones guardadas en tu biblioteca local. Los cambios se conservarán al reiniciar el servidor.'}
 }
 const artists=new Map(parsed.rows.map(r=>[r.artistId,r]))
 const albums=new Map(parsed.rows.map(r=>[r.albumId,r]))
 const statements=[]
 for(const r of artists.values())statements.push(db.prepare(
  'INSERT OR IGNORE INTO artists(id,name,slug,description,cover,accent,published) VALUES(?,?,?,?,?,?,1)'
 ).bind(r.artistId,r.artistName,r.artistSlug,'Discografía de '+r.artistName,r.cover,'#a17aff'))
 for(const r of albums.values())statements.push(db.prepare(
  'INSERT OR IGNORE INTO albums(id,title,slug,artist_id,year,cover,genre,release_type,published) VALUES(?,?,?,?,?,?,?,?,1)'
 ).bind(r.albumId,r.albumTitle,r.albumSlug,r.artistId,r.year,r.cover,r.genre,r.releaseType))
 for(const r of parsed.rows)statements.push(db.prepare(
  "INSERT INTO tracks(id,title,slug,artist_id,album_id,duration,audio_url,cover,plays,track_number,source_status,source_page,published) "+
  "VALUES(?,?,?,?,?,0,?,?,0,?,'unverified',?,1) "+
  "ON CONFLICT(id) DO UPDATE SET audio_url=excluded.audio_url,source_status='unverified',source_page=excluded.source_page,cover=CASE WHEN excluded.cover<>'' THEN excluded.cover ELSE tracks.cover END"
 ).bind(r.id,r.title,r.slug,r.artistId,r.albumId,r.audioUrl,r.cover,r.trackNumber,r.sourcePage))
 for(let i=0;i<statements.length;i+=40)await db.batch(statements.slice(i,i+40))
 return {ok:true,storage:'cloudflare',summary:parsed.summary,message:'Importación completada en Cloudflare D1'}
})
