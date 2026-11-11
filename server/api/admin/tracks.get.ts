import catalog from '../../data/catalog.json'
import { optionalMusicDb } from '../../utils/admin-db'
import { getQuery } from 'h3'
export default defineEventHandler(async (event)=>{
 const q=getQuery(event)
 const search=String(q.search||'').trim().slice(0,100)
 const limit=Math.max(1,Math.min(60,Number(q.limit)||20))
 const offset=Math.max(0,Math.min(1_000_000,Number(q.offset)||0))
 const db=optionalMusicDb(event)
 if(!db){
   const artists=new Map(catalog.artists.map(a=>[a.id,a.name]))
   const filtered=catalog.tracks.filter(t=>!search||[t.title,artists.get(t.artistId)||''].some(v=>v.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))))
   return {database:false,total:filtered.length,rows:filtered.slice(offset,offset+limit).map(t=>({...t,artistName:artists.get(t.artistId),published:1}))}
 }
 const where=search?'WHERE t.title LIKE ? OR a.name LIKE ?':''
 const args=search?['%'+search.replace(/[\\%_]/g,'')+'%','%'+search.replace(/[\\%_]/g,'')+'%']:[]
 const [total,rows]=await Promise.all([
   db.prepare('SELECT COUNT(*) AS total FROM tracks t JOIN artists a ON a.id=t.artist_id '+where).bind(...args).first<{total:number}>(),
   db.prepare('SELECT t.id,t.title,t.artist_id AS artistId,t.album_id AS albumId,t.audio_url AS audioUrl,t.cover,t.source_status AS sourceStatus,t.published,a.name AS artistName FROM tracks t JOIN artists a ON a.id=t.artist_id '+where+' ORDER BY a.name,t.title LIMIT ? OFFSET ?').bind(...args,limit,offset).all()
 ])
 return {database:true,total:total?.total||0,rows:rows.results}
})
