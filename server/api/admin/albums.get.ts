import { readLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const sqlite=getLocalSQLite()
 if(sqlite)return sqlite.prepare('SELECT al.id,al.title,al.slug,al.artist_id AS artistId,al.year,al.cover,al.genre,al.release_type AS releaseType,a.name AS artistName,(SELECT COUNT(*) FROM tracks t WHERE t.album_id=al.id) AS tracks FROM albums al JOIN artists a ON a.id=al.artist_id ORDER BY al.year DESC,al.title').all()
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Editor de álbumes disponible en modo local'})
 const c=await readLocalCatalog()
 return c.albums.map(a=>({...a,artistName:c.artists.find(x=>x.id===a.artistId)?.name||'',tracks:c.tracks.filter(t=>t.albumId===a.id).length}))
})
