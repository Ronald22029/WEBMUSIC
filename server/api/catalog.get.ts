import type { Catalog } from '../../types/music'
import { optionalMusicDb } from '../utils/admin-db'
import { publishedCatalog, readLocalCatalog } from '../utils/local-catalog'
export default defineEventHandler(async event => {
  setHeader(event,'cache-control','no-store')
  const db=optionalMusicDb(event)
  if(!db)return publishedCatalog(await readLocalCatalog())
  try {
    const [a,b,t]=await Promise.all([
      db.prepare('SELECT id,name,slug,description,cover,accent FROM artists WHERE published=1 ORDER BY name LIMIT 500').all<Catalog['artists'][number]>(),
      db.prepare('SELECT id,title,slug,artist_id AS artistId,year,cover,genre,release_type AS releaseType FROM albums WHERE published=1 ORDER BY year DESC,title LIMIT 500').all<Catalog['albums'][number]>(),
      db.prepare('SELECT id,title,slug,artist_id AS artistId,album_id AS albumId,duration,audio_url AS audioUrl,cover,plays,track_number AS trackNumber,source_status AS sourceStatus,source_page AS sourcePage FROM tracks WHERE published=1 ORDER BY album_id,track_number LIMIT 1000').all<Catalog['tracks'][number]>()
    ])
    return {artists:a.results,albums:b.results,tracks:t.results}
  }catch(error){
    console.error('Error consultando D1',error)
    throw createError({statusCode:503,statusMessage:'No se pudo consultar la base musical'})
  }
})
