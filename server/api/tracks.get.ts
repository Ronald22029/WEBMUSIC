import { getQuery } from 'h3'
import { readLocalCatalog } from '../utils/local-catalog'
import { getLocalSQLite, sqliteTracks, cleanSearch } from '../utils/sqlite-catalog'
import { optionalMusicDb } from '../utils/admin-db'
import { tracksFromD1 } from '../utils/d1-catalog'
import { cachedPublicD1 } from '../utils/public-cache'
export default defineEventHandler(async event=>{
 const q=getQuery(event)
 const str=(v:unknown)=>typeof v==='string'?v.trim().slice(0,150):''
 const artistId=str(q.artistId),albumId=str(q.albumId),genre=str(q.genre),search=str(q.q)
 const ids=str(q.ids).split(',').map(v=>v.trim()).filter(Boolean).slice(0,80)
 const limit=Math.max(1,Math.min(250,Number(q.limit)||30))
 const offset=Math.max(0,Math.min(10000000,Number(q.offset)||0))
 const cloud=optionalMusicDb(event)
 if(cloud){
   setHeader(event,'cache-control','public, max-age=30, s-maxage=120, stale-while-revalidate=30')
   return cachedPublicD1(event,120,()=>tracksFromD1(cloud,{artistId,albumId,genre,q:search,ids:ids.length?ids:undefined,limit,offset}))
 }
 setHeader(event,'cache-control','no-store')
 const db=getLocalSQLite()
 if(db)return sqliteTracks(db,{artistId,albumId,genre,q:search,ids:ids.length?ids:undefined,limit,offset})
 const data=await readLocalCatalog()
 const albumGenres=new Map(data.albums.map(a=>[a.id,a.genre||'']))
 const names=new Map(data.artists.map(a=>[a.id,a.name]))
 const titles=new Map(data.albums.map(a=>[a.id,a.title]))
 const term=cleanSearch(search)
 const found=data.tracks.filter(t=>t.published!==0&&(!artistId||t.artistId===artistId)&&(!albumId||t.albumId===albumId)&&(!genre||albumGenres.get(t.albumId)===genre)&&(!ids.length||ids.includes(t.id))&&(!term||cleanSearch([t.title,names.get(t.artistId),titles.get(t.albumId)].join(' ')).includes(term)))
 const sorted=albumId?[...found].sort((a,b)=>(a.trackNumber||0)-(b.trackNumber||0)):found
 return {rows:sorted.slice(offset,offset+limit),total:sorted.length,limit,offset}
})
