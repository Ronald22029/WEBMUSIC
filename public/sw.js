/* WEBMUSIC: solo guarda el aviso offline y los recursos propios mínimos.
   Nunca intercepta ni almacena música externa, APIs privadas o credenciales. */
const CACHE = 'webmusic-offline-v1'
const PRECACHE = ['/offline.html', '/icons/webmusic.svg', '/manifest.webmanifest']
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()))
})
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('webmusic-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))
})
self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate'||event.request.method!=='GET')return
  const target=new URL(event.request.url)
  if(target.origin!==self.location.origin||target.pathname.startsWith('/api/')||target.pathname.startsWith('/admin/'))return
  event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')))
})
