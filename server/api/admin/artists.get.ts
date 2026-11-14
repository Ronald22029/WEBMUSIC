import { readLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const cloud=optionalMusicDb(event)
 if(cloud){
   const rows=await cloud.prepare(`SELECT a.id,a.name,a.slug,a.description,a.cover,a.accent,a.genre,
      (SELECT COUNT(*) FROM albums al WHERE al.artist_id=a.id) AS albums,
      (SELECT COUNT(*) FROM tracks t WHERE t.artist_id=a.id) AS tracks
      FROM artists a ORDER BY a.name`).all()
   return rows.results
 }
 const sqlite=getLocalSQLite()
 if(sqlite)return sqlite.prepare('SELECT a.id,a.name,a.slug,a.description,a.cover,a.accent,COUNT(DISTINCT al.id) AS albums,COUNT(DISTINCT t.id) AS tracks FROM artists a LEFT JOIN albums al ON al.artist_id=a.id LEFT JOIN tracks t ON t.artist_id=a.id GROUP BY a.id ORDER BY a.name').all()
 const c=await readLocalCatalog()
 return c.artists.map(a=>({...a,albums:c.albums.filter(b=>b.artistId===a.id).length,tracks:c.tracks.filter(t=>t.artistId===a.id).length}))
})
