import type { H3Event } from 'h3'
import { createError } from 'h3'
export type D1Statement = {
  bind(...values:unknown[]):D1Statement
  first<T=Record<string,unknown>>():Promise<T|null>
  all<T=Record<string,unknown>>():Promise<{results:T[]}>
  run():Promise<unknown>
}
export type MusicDatabase = {
  prepare(sql:string):D1Statement
  batch<T=Record<string,unknown>>(statements:D1Statement[]):Promise<Array<{results:T[]}>>
}
export function optionalMusicDb(event:H3Event):MusicDatabase|null {
  return (event.context.cloudflare?.env?.DB as MusicDatabase|undefined)||null
}
// Durante desarrollo, el almacenamiento local funciona sin cuentas ni servicios externos.
export function getStorageMode(event:H3Event):'local'|'cloudflare' {
  return optionalMusicDb(event)?'cloudflare':'local'
}
export function requireMusicDb(event:H3Event):MusicDatabase {
  const db=optionalMusicDb(event)
  if(!db)throw createError({statusCode:503,statusMessage:'Esta operación necesita vincular Cloudflare D1'})
  return db
}
