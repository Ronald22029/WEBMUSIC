export interface MusicD1 {
 prepare(sql:string):{
  bind(...values:unknown[]):MusicD1Statement
  first<T=Record<string,unknown>>():Promise<T|null>
  all<T=Record<string,unknown>>():Promise<{results:T[]}>
  run():Promise<unknown>
 }
 batch<T=Record<string,unknown>>(statements:MusicD1Statement[]):Promise<Array<{results:T[]}>>
}
export interface MusicD1Statement {
 bind(...values:unknown[]):MusicD1Statement
 first<T=Record<string,unknown>>():Promise<T|null>
 all<T=Record<string,unknown>>():Promise<{results:T[]}>
 run():Promise<unknown>
}
declare module 'h3' {
 interface H3EventContext {
  cloudflare?:{ env: {DB?:MusicD1; ADMIN_PASSWORD?:string; ADMIN_SESSION_SECRET?:string} }
 }
}
