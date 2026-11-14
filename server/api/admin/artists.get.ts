import { readLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const sqlite=getLocalSQLite()
 if(sqlite)return sqlite.prepare('SELECT a.id,a.name,a.slug,a.description,a.cover,a.accent,COUNT(DISTINCT al.id) AS albums,COUNT(DISTINCT t.id) AS tracks FROM artists a LEFT JOIN albums al ON al.artist_id=a.id LEFT JOIN tracks t ON t.artist_id=a.id GROUP BY a.id ORDER BY a.name').all()
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Editor de artistas disponible en modo local'})
 const c=await readLocalCatalog()
 return c.artists.map(a=>({...a,albums:c.albums.filter(b=>b.artistId===a.id).length,tracks:c.tracks.filter(t=>t.artistId===a.id).length}))
})
