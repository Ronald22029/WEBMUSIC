interface MusicD1 { prepare(sql:string):{all<T=Record<string,unknown>>():Promise<{results:T[]}>} }
declare module 'h3'{interface H3EventContext{cloudflare?:{env:{DB?:MusicD1}}}}
export {}
