import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { Catalog, Track } from '../../types/music'

const dataDir = process.env.WEBMUSIC_DATA_DIR ? resolve(process.env.WEBMUSIC_DATA_DIR) : resolve(process.cwd(), '.data', 'webmusic')
export const sqlitePath = resolve(dataDir, 'webmusic.sqlite')
const legacyJsonPath = resolve(dataDir, 'catalog.local.json')
let db: DatabaseSync | null = null

export function cleanSearch(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ')
}
const artistFromSql = (r:any) => ({id:r.id,name:r.name,slug:r.slug,description:r.description,cover:r.cover,accent:r.accent,genre:r.genre})
const albumFromSql = (r:any) => ({id:r.id,title:r.title,slug:r.slug,artistId:r.artist_id,year:r.year,cover:r.cover,genre:r.genre,releaseType:r.release_type})
const trackFromSql = (r:any):Track => ({
  id:r.id,title:r.title,slug:r.slug,artistId:r.artist_id,albumId:r.album_id,duration:r.duration,
  audioUrl:r.audio_url,cover:r.cover,plays:r.plays,trackNumber:r.track_number,
  sourceStatus:r.source_status,sourcePage:r.source_page,published:r.published
})

function mergePreviousLocalEdits(database:DatabaseSync) {
  const marker=database.prepare("SELECT value FROM import_meta WHERE key='legacy_json_merged'").get()
  if(marker || !existsSync(legacyJsonPath))return
  const local=JSON.parse(readFileSync(legacyJsonPath,'utf8')) as Catalog
  if(!Array.isArray(local.artists)||!Array.isArray(local.albums)||!Array.isArray(local.tracks))throw new Error('El catálogo local anterior no tiene formato válido')
  const artist=database.prepare("INSERT INTO artists(id,name,slug,description,cover,accent,genre,source_url,published) VALUES(?,?,?,?,?,?,?,'',1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,cover=CASE WHEN excluded.cover<>'' THEN excluded.cover ELSE artists.cover END")
  const album=database.prepare("INSERT INTO albums(id,title,slug,artist_id,year,cover,genre,release_type,source_url,published) VALUES(?,?,?,?,?,?,?,?,'',1) ON CONFLICT(id) DO UPDATE SET title=excluded.title,year=CASE WHEN excluded.year>0 THEN excluded.year ELSE albums.year END,cover=CASE WHEN excluded.cover<>'' THEN excluded.cover ELSE albums.cover END")
  const track=database.prepare("INSERT INTO tracks(id,title,slug,artist_id,album_id,duration,audio_url,cover,plays,track_number,source_status,source_page,published,search_text) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,audio_url=excluded.audio_url,cover=CASE WHEN excluded.cover<>'' THEN excluded.cover ELSE tracks.cover END,published=excluded.published,search_text=excluded.search_text")
  database.exec('BEGIN IMMEDIATE')
  try{
    for(const a of local.artists)artist.run(a.id,a.name,a.slug,a.description||'',a.cover||'',a.accent||'#a17aff',a.genre||'')
    for(const a of local.albums)album.run(a.id,a.title,a.slug,a.artistId,a.year||0,a.cover||'',a.genre||'',a.releaseType||'')
    const artists=new Map(local.artists.map(a=>[a.id,a.name]))
    const albums=new Map(local.albums.map(a=>[a.id,a.title]))
    for(const t of local.tracks)track.run(t.id,t.title,t.slug,t.artistId,t.albumId,t.duration||0,t.audioUrl,t.cover||'',t.plays||0,t.trackNumber||0,t.sourceStatus||'unverified',t.sourcePage||'',(t as any).published===0?0:1,cleanSearch([t.title,artists.get(t.artistId)||'',albums.get(t.albumId)||''].join(' ')))
    database.prepare("INSERT OR REPLACE INTO import_meta(key,value) VALUES('legacy_json_merged',?)").run(new Date().toISOString())
    database.exec('COMMIT')
  }catch(error){database.exec('ROLLBACK');throw error}
}
export function getLocalSQLite():DatabaseSync|null {
  if(!existsSync(sqlitePath))return null
  if(db)return db
  const opened=new DatabaseSync(sqlitePath)
  try{
    opened.exec('PRAGMA foreign_keys=ON')
    opened.exec('PRAGMA busy_timeout=3000')
    if(!opened.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tracks'").get())throw new Error('El archivo SQLite no contiene el esquema de WEBMUSIC')
    mergePreviousLocalEdits(opened)
    db=opened
    return db
  }catch(e){opened.close();throw e}
}
export function sqliteCatalog(database:DatabaseSync):Catalog & {counts:{artists:number;albums:number;tracks:number}} {
 const artists=database.prepare('SELECT id,name,slug,description,cover,accent,genre FROM artists WHERE published=1 ORDER BY name').all().map(artistFromSql)
 const albums=database.prepare('SELECT id,title,slug,artist_id,year,cover,genre,release_type FROM albums WHERE published=1 ORDER BY year DESC,title').all().map(albumFromSql)
 // Solo una muestra de pistas llega al cliente. El resto se consulta por páginas.
 const tracks=database.prepare('SELECT * FROM tracks WHERE published=1 ORDER BY rowid DESC LIMIT 60').all().map(trackFromSql)
 const count=database.prepare('SELECT COUNT(*) as n FROM tracks WHERE published=1').get() as {n:number}
 return {artists,albums,tracks,counts:{artists:artists.length,albums:albums.length,tracks:count.n}}
}
export function sqliteTracks(database:DatabaseSync, params:{
  q?:string;artistId?:string;albumId?:string;genre?:string;ids?:string[];
  offset?:number;limit?:number;includeHidden?:boolean
}){
 const conditions:string[]=[]
 const args:(string|number)[]=[]
 if(!params.includeHidden)conditions.push('t.published=1')
 if(params.artistId){conditions.push('t.artist_id=?');args.push(params.artistId)}
 if(params.albumId){conditions.push('t.album_id=?');args.push(params.albumId)}
 if(params.genre){conditions.push('al.genre=?');args.push(params.genre)}
 if(params.q){conditions.push('t.search_text LIKE ?');args.push('%'+cleanSearch(params.q).replace(/[%_]/g,'')+'%')}
 if(params.ids?.length){conditions.push('t.id IN ('+params.ids.map(()=>'?').join(',')+')');args.push(...params.ids)}
 const where=conditions.length?' WHERE '+conditions.join(' AND '):''
 const from=' FROM tracks t JOIN albums al ON al.id=t.album_id'
 const total=(database.prepare('SELECT COUNT(*) n'+from+where).get(...args) as {n:number}).n
 const limit=Math.max(1,Math.min(250,Number(params.limit)||30))
 const offset=Math.max(0,Math.min(10000000,Number(params.offset)||0))
 const ordering=params.albumId?' ORDER BY t.track_number,t.title':' ORDER BY t.rowid DESC'
 const rows=database.prepare('SELECT t.*'+from+where+ordering+' LIMIT ? OFFSET ?').all(...args,limit,offset).map(trackFromSql)
 return {rows,total,offset,limit}
}
