import { readLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
export default defineEventHandler(async event=>{
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Editor de artistas disponible en modo local'})
 const c=await readLocalCatalog()
 return c.artists.map(a=>({...a,albums:c.albums.filter(b=>b.artistId===a.id).length,tracks:c.tracks.filter(t=>t.artistId===a.id).length}))
})
