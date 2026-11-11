import { readBody } from 'h3'
import { parseMusicCsv } from '../../../utils/csv-music'
export default defineEventHandler(async(event)=>{
 const body=await readBody<{csv?:unknown}>(event)
 const parsed=parseMusicCsv(body?.csv)
 return {summary:parsed.summary,warnings:parsed.warnings,
   sample:parsed.rows.slice(0,10).map(x=>({artist:x.artistName,album:x.albumTitle,track:x.title,year:x.year,trackNumber:x.trackNumber}))}
})
