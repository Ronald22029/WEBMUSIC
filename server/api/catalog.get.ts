import type { Catalog } from '../../types/music'
import { optionalMusicDb } from '../utils/admin-db'
import { publishedCatalog, readLocalCatalog } from '../utils/local-catalog'
import { getLocalSQLite, sqliteCatalog } from '../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 setHeader(event,'cache-control','no-store')
 const db=getLocalSQLite()
 if(db)return sqliteCatalog(db)
 const cloud=optionalMusicDb(event)
 if(!cloud){
   const data=publishedCatalog(await readLocalCatalog())
   return {...data,counts:{artists:data.artists.length,albums:data.albums.length,tracks:data.tracks.length}}
 }
 try{
   const [a,b,t]=await Promise.all([
    cloud.prepare('SELECT id,name,slug,description,cover,accent FROM artists WHERE published=1 ORDER BY name LIMIT 500').all<Catalog['artists'][number]>(),
    cloud.prepare('SELECT id,title,slug,artist_id AS artistId,year,cover,genre,release_type AS releaseType FROM albums WHERE published=1 ORDER BY year DESC,title LIMIT 500').all<Catalog['albums'][number]>(),
    cloud.prepare('SELECT id,title,slug,artist_id AS artistId,album_id AS albumId,duration,audio_url AS audioUrl,cover,plays,track_number AS trackNumber,source_status AS sourceStatus,source_page AS sourcePage FROM tracks WHERE published=1 ORDER BY album_id,track_number LIMIT 1000').all<Catalog['tracks'][number]>()
   ])
   return {artists:a.results,albums:b.results,tracks:t.results,counts:{artists:a.results.length,albums:b.results.length,tracks:t.results.length}}
 }catch(e){console.error(e);throw createError({statusCode:503,statusMessage:'Catálogo temporalmente no disponible'})}
})
