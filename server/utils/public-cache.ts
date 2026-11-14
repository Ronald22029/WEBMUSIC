import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

// Caché de metadatos públicos en Cloudflare. No almacena contraseñas,
// cookies, consultas administrativas ni audio. Si no existe Cache API,
// continúa consultando D1 normalmente (por ejemplo, en pruebas locales).
export async function cachedPublicD1<T>(
 event:H3Event,
 ttl:number,
 query:()=>Promise<T>
):Promise<T>{
 const cache=(globalThis as any).caches?.default as
  | {match:(request:Request)=>Promise<Response|undefined>;put:(request:Request,response:Response)=>Promise<void>}
  | undefined
 if(!cache)return query()
 const key=new Request(getRequestURL(event).toString(),{method:'GET'})
 try{
  const matched=await cache.match(key)
  if(matched?.ok)return (await matched.json()) as T
 }catch{/* no cache en preview o cache vacío */}
 const result=await query()
 try{
  const response=new Response(JSON.stringify(result),{
   headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':`public, max-age=0, s-maxage=${ttl}`}
  })
  const task=cache.put(key,response)
  const ctx=(event.context.cloudflare as any)?.context
  if(ctx?.waitUntil)ctx.waitUntil(task)
  else void task.catch(()=>{})
 }catch{/* la respuesta principal siempre funciona sin caché */}
 return result
}
