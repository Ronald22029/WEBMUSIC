import catalog from '../data/catalog.json'
import type { Catalog } from '../../types/music'
import { optionalMusicDb } from '../utils/admin-db'
const fallback = catalog as Catalog
export default defineEventHandler(async (event) => {
 const db=optionalMusicDb(event)
 if(!db)return fallback
 try {
  const [a,b,t]=await Promise.all([
   db.prepare('SELECT id,name,slug,description,cover,accent FROM artists WHERE published=1 ORDER BY name LIMIT 500').all<Catalog['artists'][number]>(),
   db.prepare('SELECT id,title,slug,artist_id AS artistId,year,cover,genre,release_type AS releaseType FROM albums WHERE published=1 ORDER BY year DESC,title LIMIT 500').all<Catalog['albums'][number]>(),
   db.prepare('SELECT id,title,slug,artist_id AS artistId,album_id AS albumId,duration,audio_url AS audioUrl,cover,plays,track_number AS trackNumber,source_status AS sourceStatus,source_page AS sourcePage FROM tracks WHERE published=1 ORDER BY album_id,track_number LIMIT 1000').all<Catalog['tracks'][number]>()
  ])
  if(!a.results.length&&!b.results.length&&!t.results.length)return fallback
  return {artists:a.results,albums:b.results,tracks:t.results}
 }catch(e){
  console.error('D1 catalog query failed',e)
  throw createError({statusCode:503,statusMessage:'Catálogo temporalmente no disponible'})
 }
})
