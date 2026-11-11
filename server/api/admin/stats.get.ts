import { optionalMusicDb, getStorageMode } from '../../utils/admin-db'
import { readLocalCatalog } from '../../utils/local-catalog'
export default defineEventHandler(async event => {
 const db=optionalMusicDb(event)
 if(!db){
   const data=await readLocalCatalog()
   return {database:true,storage:'local',artists:data.artists.length,albums:data.albums.length,tracks:data.tracks.length}
 }
 const [artists,albums,tracks]=await Promise.all(['artists','albums','tracks'].map(
   table=>db.prepare('SELECT COUNT(*) AS total FROM '+table).first<{total:number}>()
 ))
 return {database:true,storage:getStorageMode(event),artists:artists?.total||0,albums:albums?.total||0,tracks:tracks?.total||0}
})
