import catalog from '../../data/catalog.json'
import { optionalMusicDb } from '../../utils/admin-db'
export default defineEventHandler(async(event)=>{
 const db=optionalMusicDb(event)
 if(!db)return { database:false, artists:catalog.artists.length, albums:catalog.albums.length, tracks:catalog.tracks.length, message:'Vista previa: conecta Cloudflare D1 para editar o importar.' }
 const queries=['artists','albums','tracks'].map(table=>db.prepare('SELECT COUNT(*) AS total FROM '+table).first<{total:number}>())
 const [artists,albums,tracks]=await Promise.all(queries)
 return {database:true,artists:artists?.total||0,albums:albums?.total||0,tracks:tracks?.total||0}
})
