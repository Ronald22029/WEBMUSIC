import type { Catalog } from '../../types/music'
import { optionalMusicDb } from '../utils/admin-db'
import { publishedCatalog, readLocalCatalog } from '../utils/local-catalog'
import { getLocalSQLite, sqliteCatalog } from '../utils/sqlite-catalog'
import { catalogFromD1 } from '../utils/d1-catalog'
import { cachedPublicD1 } from '../utils/public-cache'
export default defineEventHandler(async event=>{
 const cloud=optionalMusicDb(event)
 if(cloud){
   // Público; TTL corto para permitir correcciones del administrador.
   setHeader(event,'cache-control','public, max-age=60, s-maxage=300, stale-while-revalidate=60')
   return await cachedPublicD1(event,300,()=>catalogFromD1(cloud))
 }
 setHeader(event,'cache-control','no-store')
 const db=getLocalSQLite()
 if(db)return sqliteCatalog(db)
 const data=publishedCatalog(await readLocalCatalog())
 return {...data,counts:{artists:data.artists.length,albums:data.albums.length,tracks:data.tracks.length}}
})
