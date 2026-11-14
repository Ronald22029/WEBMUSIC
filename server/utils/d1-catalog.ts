import type { MusicDatabase } from './admin-db'
import type { Album, Artist, Catalog, Track } from '../../types/music'

type D1Artist = Artist
type D1Album = Album
const trackFields = 't.id,t.title,t.slug,t.artist_id AS artistId,t.album_id AS albumId,t.duration,t.audio_url AS audioUrl,t.cover,t.plays,t.track_number AS trackNumber,t.source_status AS sourceStatus,t.source_page AS sourcePage,t.published'
const albumFields = 'id,title,slug,artist_id AS artistId,year,cover,genre,release_type AS releaseType'
export async function catalogFromD1(db:MusicDatabase):Promise<Catalog & {counts:{artists:number;albums:number;tracks:number}}> {
 const [artists,albums,tracks,c] = await Promise.all([
   db.prepare('SELECT id,name,slug,description,cover,accent,genre FROM artists WHERE published=1 ORDER BY name').all<D1Artist>(),
   db.prepare('SELECT '+albumFields+' FROM albums WHERE published=1 ORDER BY year DESC,title').all<D1Album>(),
   db.prepare('SELECT '+trackFields+' FROM tracks t WHERE t.published=1 ORDER BY t.rowid DESC LIMIT 60').all<Track>(),
   db.prepare('SELECT COUNT(*) total FROM tracks WHERE published=1').first<{total:number}>()
 ])
 return {artists:artists.results,albums:albums.results,tracks:tracks.results,
  counts:{artists:artists.results.length,albums:albums.results.length,tracks:c?.total||0}}
}
export type D1TrackParams = {
 q?:string;artistId?:string;albumId?:string;genre?:string;ids?:string[];
 offset?:number;limit?:number;includeHidden?:boolean
}
export async function tracksFromD1(db:MusicDatabase,p:D1TrackParams) {
 const wheres:string[]=[]
 const args:unknown[]=[]
 if(!p.includeHidden) wheres.push('t.published=1')
 if(p.artistId){wheres.push('t.artist_id=?');args.push(p.artistId)}
 if(p.albumId){wheres.push('t.album_id=?');args.push(p.albumId)}
 if(p.genre){wheres.push('al.genre=?');args.push(p.genre)}
 if(p.ids?.length){
   const ids=p.ids.slice(0,80)
   wheres.push('t.id IN ('+ids.map(()=>'?').join(',')+')')
   args.push(...ids)
 }
 if(p.q){
   // SQL bind y escaping de comodines; no permitir % de usuario como wildcard.
   // D1 se indexará por prefijo; consultas substring pueden consumir más filas.
   let term=p.q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
    .replace(/[%_\\]/g,'').slice(0,100)
   // D1 admite como máximo 50 bytes por patrón LIKE, incluidos los %.
   const encoder=new TextEncoder()
   while(encoder.encode(term).length>46)term=term.slice(0,-1)
   if(term){wheres.push("t.search_text LIKE ?");args.push('%'+term+'%')}
 }
 const from=' FROM tracks t JOIN albums al ON al.id=t.album_id'
 const where=wheres.length?' WHERE '+wheres.join(' AND '):''
 const offset=Math.min(10_000_000,Math.max(0,Number(p.offset)||0))
 const limit=Math.min(250,Math.max(1,Number(p.limit)||30))
 const sort=p.albumId?' ORDER BY t.track_number ASC,t.title ASC':' ORDER BY t.rowid DESC'
 const [count,rows] = await Promise.all([
   db.prepare('SELECT COUNT(*) AS total'+from+where).bind(...args).first<{total:number}>(),
   db.prepare('SELECT '+trackFields+from+where+sort+' LIMIT ? OFFSET ?').bind(...args,limit,offset).all<Track>()
 ])
 return {rows:rows.results,total:count?.total||0,limit,offset}
}
export async function tracksByIdsD1(db:MusicDatabase,ids:string[]) {
 const rows:Track[]=[]
 // Cloudflare D1 admite hasta 100 parámetros por consulta.
 for(let i=0;i<ids.length;i+=75){
   const slice=ids.slice(i,i+75)
   const found=await db.prepare('SELECT '+trackFields+' FROM tracks t WHERE t.published=1 AND t.id IN ('+
    slice.map(()=>'?').join(',')+')').bind(...slice).all<Track>()
   rows.push(...found.results)
 }
 return {rows,total:rows.length,offset:0,limit:Math.min(250,ids.length)}
}
