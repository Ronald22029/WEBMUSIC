import { getQuery } from 'h3'
import { optionalMusicDb } from '../../utils/admin-db'
import { readLocalCatalog } from '../../utils/local-catalog'
import { getLocalSQLite, sqliteTracks } from '../../utils/sqlite-catalog'
export default defineEventHandler(async event=>{
 const q=getQuery(event)
 const search=String(q.search||'').trim().slice(0,100)
 const limit=Math.max(1,Math.min(60,Number(q.limit)||20))
 const offset=Math.max(0,Math.min(10000000,Number(q.offset)||0))
 const cloud=optionalMusicDb(event)
 if(cloud){
   const term=search.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[%_\\]/g,'')
   const where=term?'WHERE t.search_text LIKE ?':''
   const args=term?['%'+term+'%']:[]
   const [count,list]=await Promise.all([
     cloud.prepare('SELECT COUNT(*) total FROM tracks t '+where).bind(...args).first<{total:number}>(),
     cloud.prepare(`SELECT t.id,t.title,t.artist_id AS artistId,t.album_id AS albumId,
         t.audio_url AS audioUrl,t.cover,t.source_status AS sourceStatus,t.published,
         a.name AS artistName FROM tracks t JOIN artists a ON a.id=t.artist_id `+
       where+' ORDER BY t.rowid DESC LIMIT ? OFFSET ?').bind(...args,limit,offset).all()
   ])
   return {database:true,storage:'cloudflare',total:count?.total||0,rows:list.results}
 }
 const sqlite=getLocalSQLite()
 if(sqlite){
  const result=sqliteTracks(sqlite,{q:search,limit,offset,includeHidden:true})
  const names=new Map((sqlite.prepare('SELECT id,name FROM artists').all() as Array<{id:string;name:string}>).map(a=>[a.id,a.name]))
  return {database:true,storage:'local',total:result.total,rows:result.rows.map(r=>({...r,artistName:names.get(r.artistId)||'',published:r.published??1}))}
 }
 {
  const data=await readLocalCatalog()
  const artists=new Map(data.artists.map(a=>[a.id,a.name]))
  const query=search.toLocaleLowerCase('es')
  const filtered=data.tracks.filter(t=>!search||[t.title,artists.get(t.artistId)||''].some(v=>v.toLocaleLowerCase('es').includes(query)))
  return {database:true,storage:'local',total:filtered.length,rows:filtered.slice(offset,offset+limit).map(t=>({...t,artistName:artists.get(t.artistId)||'',published:t.published===0?0:1}))}
 }
})
