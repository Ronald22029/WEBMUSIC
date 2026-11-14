import { getQuery } from 'h3'
import { getLocalSQLite } from '../../utils/sqlite-catalog'
import { readLocalCatalog } from '../../utils/local-catalog'

type Finding={id:string;name:string;artist?:string;reason:string;type:string}
export default defineEventHandler(async event=>{
 const q=getQuery(event)
 const kind=String(q.kind||'missing_year').slice(0,50)
 const offset=Math.max(0,Math.min(1_000_000,Number(q.offset)||0))
 const limit=Math.max(1,Math.min(100,Number(q.limit)||30))
 const db=getLocalSQLite()
 if(db){
  const counts={
   missingYear:(db.prepare("SELECT COUNT(*) n FROM albums WHERE year IS NULL OR year<=0").get() as {n:number}).n,
   missingCover:(db.prepare("SELECT COUNT(*) n FROM albums WHERE cover IS NULL OR TRIM(cover)=''").get() as {n:number}).n,
   missingAudio:(db.prepare("SELECT COUNT(*) n FROM tracks WHERE audio_url IS NULL OR audio_url NOT LIKE 'https://%'").get() as {n:number}).n,
   uncheckedAudio:(db.prepare("SELECT COUNT(*) n FROM tracks WHERE source_status IS NULL OR source_status IN ('unverified','unknown','missing')").get() as {n:number}).n,
   duplicateLinks:(db.prepare("SELECT COUNT(*) n FROM (SELECT audio_url FROM tracks WHERE audio_url LIKE 'https://%' GROUP BY audio_url HAVING COUNT(*)>1)").get() as {n:number}).n,
   duplicateAlbums:(db.prepare("SELECT COUNT(*) n FROM (SELECT artist_id,LOWER(TRIM(title)) title FROM albums GROUP BY artist_id,LOWER(TRIM(title)) HAVING COUNT(*)>1)").get() as {n:number}).n,
  }
  const configs:Record<string,{from:string;where:string;name:string;artist:string;reason:string;order:string}>={
   missing_year:{from:'albums al LEFT JOIN artists a ON a.id=al.artist_id',where:'(al.year IS NULL OR al.year<=0)',name:'al.title',artist:'a.name',reason:'Sin año confirmado',order:'al.title'},
   missing_cover:{from:'albums al LEFT JOIN artists a ON a.id=al.artist_id',where:"(al.cover IS NULL OR TRIM(al.cover)='')",name:'al.title',artist:'a.name',reason:'Sin portada',order:'al.title'},
   missing_audio:{from:'tracks al LEFT JOIN artists a ON a.id=al.artist_id',where:"(al.audio_url IS NULL OR al.audio_url NOT LIKE 'https://%')",name:'al.title',artist:'a.name',reason:'Sin enlace HTTPS',order:'al.title'},
   unchecked_audio:{from:'tracks al LEFT JOIN artists a ON a.id=al.artist_id',where:"(al.source_status IS NULL OR al.source_status IN ('unverified','unknown','missing'))",name:'al.title',artist:'a.name',reason:'Enlace pendiente de validación',order:'al.title'},
   duplicate_links:{from:'tracks al LEFT JOIN artists a ON a.id=al.artist_id',where:"al.audio_url IN (SELECT audio_url FROM tracks WHERE audio_url LIKE 'https://%' GROUP BY audio_url HAVING COUNT(*)>1)",name:'al.title',artist:'a.name',reason:'Comparte enlace con otra pista',order:'al.audio_url,al.title'},
   duplicate_albums:{from:'albums al LEFT JOIN artists a ON a.id=al.artist_id',where:'EXISTS (SELECT 1 FROM albums x WHERE x.artist_id=al.artist_id AND LOWER(TRIM(x.title))=LOWER(TRIM(al.title)) AND x.id<>al.id)',name:'al.title',artist:'a.name',reason:'Posible álbum duplicado',order:'al.title'}
  }
  const config=configs[kind]||configs.missing_year!
  const total=(db.prepare('SELECT COUNT(*) n FROM '+config.from+' WHERE '+config.where).get() as {n:number}).n
  const audioField=kind.includes('audio')||kind==='duplicate_links'?'al.audio_url':'NULL'
  const rows=db.prepare('SELECT al.id AS id,'+config.name+' AS name,'+config.artist+' AS artist,'+audioField+' AS audioUrl FROM '+config.from+' WHERE '+config.where+' ORDER BY '+config.order+' LIMIT ? OFFSET ?').all(limit,offset)
  return {storage:'local',counts,kind,total,offset,limit,rows:rows.map(row=>({...row,type:kind,reason:config.reason})),notice:'Análisis del catálogo; no se han verificado enlaces externos ni licencias.'}
 }
 const catalog=await readLocalCatalog()
 const counts={
  missingYear:catalog.albums.filter(a=>!a.year).length,
  missingCover:catalog.albums.filter(a=>!a.cover).length,
  missingAudio:catalog.tracks.filter(t=>!/^https:\/\//.test(t.audioUrl||'')).length,
  uncheckedAudio:catalog.tracks.filter(t=>!t.sourceStatus||t.sourceStatus==='unverified').length,
  duplicateLinks:0,duplicateAlbums:0
 }
 const artists=new Map(catalog.artists.map(a=>[a.id,a.name]))
 const list=kind==='missing_year'?catalog.albums.filter(a=>!a.year):
  kind==='missing_cover'?catalog.albums.filter(a=>!a.cover):
  kind==='missing_audio'?catalog.tracks.filter(t=>!/^https:\/\//.test(t.audioUrl||'')):
  kind==='unchecked_audio'?catalog.tracks.filter(t=>!t.sourceStatus||t.sourceStatus==='unverified'):[]
 return {storage:'local',counts,kind,total:list.length,offset,limit,rows:list.slice(offset,offset+limit).map(a=>({id:a.id,name:'title' in a?a.title:a.name,artist:artists.get(a.artistId),type:kind,reason:'Pendiente de revisión'})),notice:'Sin verificaciones de red o licencias'}
})
