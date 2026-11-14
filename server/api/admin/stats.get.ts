import { optionalMusicDb } from '../../utils/admin-db'
import { readLocalCatalog } from '../../utils/local-catalog'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const cloud=optionalMusicDb(event)
 if(cloud){
   const [artists,albums,tracks]=await Promise.all(['artists','albums','tracks'].map(table=>
    cloud.prepare('SELECT COUNT(*) AS total FROM '+table).first<{total:number}>()))
   return {database:true,storage:'cloudflare',artists:artists?.total||0,albums:albums?.total||0,tracks:tracks?.total||0}
 }
 const sqlite=getLocalSQLite()
 if(sqlite){
   const count=(table:'artists'|'albums'|'tracks')=>(sqlite.prepare('SELECT COUNT(*) AS total FROM '+table).get() as {total:number}).total
   return {database:true,storage:'local',artists:count('artists'),albums:count('albums'),tracks:count('tracks')}
 }
})
