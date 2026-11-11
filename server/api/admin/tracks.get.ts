import { getQuery } from 'h3'
import { optionalMusicDb } from '../../utils/admin-db'
import { readLocalCatalog } from '../../utils/local-catalog'
export default defineEventHandler(async event => {
 const q=getQuery(event)
 const search=String(q.search||'').trim().slice(0,100)
 const limit=Math.max(1,Math.min(60,Number(q.limit)||20))
 const offset=Math.max(0,Math.min(1_000_000,Number(q.offset)||0))
 const db=optionalMusicDb(event)
 if(!db){
  const data=await readLocalCatalog()
  const artists=new Map(data.artists.map(a=>[a.id,a.name]))
  const query=search.toLocaleLowerCase('es')
  const filtered=data.tracks.filter(t=>!search||[t.title,artists.get(t.artistId)||''].some(v=>v.toLocaleLowerCase('es').includes(query)))
  return {database:true,storage:'local',total:filtered.length,rows:filtered.slice(offset,offset+limit).map(t=>({...t,artistName:artists.get(t.artistId)||'',published:t.published===0?0:1}))}
 }
 const where=search?'WHERE t.title LIKE ? OR a.name LIKE ?':''
 const safeSearch=search.replace(/[\\%_]/g,'')
 const args=search?['%'+safeSearch+'%','%'+safeSearch+'%']:[]
 const [total,rows]=await Promise.all([
  db.prepare('SELECT COUNT(*) AS total FROM tracks t JOIN artists a ON a.id=t.artist_id '+where).bind(...args).first<{total:number}>(),
  db.prepare('SELECT t.id,t.title,t.artist_id AS artistId,t.album_id AS albumId,t.audio_url AS audioUrl,t.cover,t.source_status AS sourceStatus,t.published,a.name AS artistName FROM tracks t JOIN artists a ON a.id=t.artist_id '+where+' ORDER BY a.name,t.title LIMIT ? OFFSET ?').bind(...args,limit,offset).all()
 ])
 return {database:true,storage:'cloudflare',total:total?.total||0,rows:rows.results}
})
