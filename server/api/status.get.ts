import { optionalMusicDb } from '../utils/admin-db'
export default defineEventHandler(async event=>{
 setHeader(event,'cache-control','no-store')
 const cloud=optionalMusicDb(event)
 if(cloud){
  try{
   const result=await cloud.prepare('SELECT COUNT(*) AS total FROM tracks').first<{total:number}>()
   return {ok:true,storage:'cloudflare',tracks:result?.total||0}
  }catch{
   throw createError({statusCode:503,statusMessage:'D1 aún no está inicializada'})
  }
 }
 return {ok:true,storage:'local',message:'SQLite local de desarrollo'}
})
