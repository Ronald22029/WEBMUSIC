import { readLocalCatalog } from '../../utils/local-catalog'
import { optionalMusicDb } from '../../utils/admin-db'
export default defineEventHandler(async event=>{
 if(optionalMusicDb(event))throw createError({statusCode:501,statusMessage:'Editor de álbumes disponible en modo local'})
 const c=await readLocalCatalog()
 return c.albums.map(a=>({...a,artistName:c.artists.find(x=>x.id===a.artistId)?.name||'',tracks:c.tracks.filter(t=>t.albumId===a.id).length}))
})
