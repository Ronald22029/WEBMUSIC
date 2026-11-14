import { DatabaseSync } from 'node:sqlite'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const dir=await mkdtemp(join(tmpdir(),'webmusic-sqlite-'))
const file=join(dir,'webmusic.sqlite')
const sql=new DatabaseSync(file)
sql.exec(`
 CREATE TABLE artists(id TEXT PRIMARY KEY,name TEXT,slug TEXT,description TEXT,cover TEXT,accent TEXT,genre TEXT,source_url TEXT,published INTEGER);
 CREATE TABLE albums(id TEXT PRIMARY KEY,title TEXT,slug TEXT,artist_id TEXT,year INTEGER,cover TEXT,genre TEXT,release_type TEXT,source_url TEXT,published INTEGER);
 CREATE TABLE tracks(id TEXT PRIMARY KEY,title TEXT,slug TEXT,artist_id TEXT,album_id TEXT,duration INTEGER,audio_url TEXT,cover TEXT,plays INTEGER,track_number INTEGER,source_status TEXT,source_page TEXT,published INTEGER,search_text TEXT);
 CREATE TABLE import_meta(key TEXT PRIMARY KEY,value TEXT);
 INSERT INTO artists VALUES('a-test','Cantante de Prueba','test','Biografía','','#a17aff','Cristiana','',1);
 INSERT INTO albums VALUES('alb-test','Álbum Uno','album-test','a-test',2026,'','Cristiana','Álbum','',1);
 INSERT INTO tracks VALUES('t-test','Prueba Escuchable','prueba','a-test','alb-test',150,'https://example.com/test.mp3','',0,1,'unverified','',1,'prueba escuchable cantante de prueba album uno');
 INSERT INTO tracks VALUES('t-hidden','Canción Oculta','hidden','a-test','alb-test',120,'','',0,2,'missing','',0,'cancion oculta cantante de prueba album uno');
`)
sql.close()
const port=String(39000+Math.floor(Math.random()*1000))
const base='http://127.0.0.1:'+port
const password='WEBMUSIC_TEST_ADMIN_PASSWORD_123'
const secret='WEBMUSIC_TEST_ADMIN_SECRET_1234567890_1234567890'
const app=spawn(process.execPath,['.output/server/index.mjs'],{
 env:{...process.env,WEBMUSIC_DATA_DIR:dir,HOST:'127.0.0.1',PORT:port,NUXT_ADMIN_PASSWORD:password,NUXT_ADMIN_SESSION_SECRET:secret},
 stdio:['ignore','pipe','pipe']
})
let logs=''
for(const stream of [app.stdout,app.stderr])stream.on('data',b=>logs+=String(b).slice(-5000))
function check(value,expected,label){if(value!==expected)throw Error(label+': expected '+expected+' got '+value)}
async function request(path,options={}){
 const r=await fetch(base+path,options)
 const json=await r.json().catch(()=>null)
 if(!r.ok)throw Error(path+' HTTP '+r.status+' '+JSON.stringify(json))
 return {json,response:r}
}
try{
 let launched=false
 for(let i=0;i<70;i++){
  try{const r=await fetch(base+'/api/catalog');if(r.ok){launched=true;break}}catch{}
  await delay(350)
 }
 if(!launched)throw Error('Server did not launch: '+logs)
 // Comprobar el renderizado HTML SSR de páginas reales, no solo los endpoints JSON.
 for(const route of ['/', '/album/album-test', '/artista/test', '/canciones', '/albumes', '/playlists']){
   const pageResponse=await fetch(base+route)
   const html=await pageResponse.text()
   if(!pageResponse.ok || /Cannot access ['"]page['"] before initialization|__nuxt_error|Internal Server Error/.test(html)){
     throw Error('Página '+route+' no se pudo renderizar: HTTP '+pageResponse.status+' '+html.slice(0,500))
   }
 }
 const manifest=await fetch(base+'/manifest.webmanifest')
 if(!manifest.ok||(await manifest.text()).includes('WEBMUSIC')===false)throw Error('PWA manifest no accesible')
 const worker=await fetch(base+'/sw.js')
 if(!worker.ok||(await worker.text()).includes('webmusic-offline')===false)throw Error('Service worker no accesible')
 const c=(await request('/api/catalog')).json
 check(c.counts.tracks,1,'published tracks')
 check(c.artists.length,1,'artists')
 check(c.albums.length,1,'albums')
 const l=(await request('/api/tracks?albumId=alb-test&limit=10')).json
 check(l.total,1,'album filtering')
 check(l.rows[0].title,'Prueba Escuchable','track title')
 const q=(await request('/api/tracks?q=Prueba&limit=10')).json
 check(q.total,1,'search')
 const qualityUnauthorized=await fetch(base+'/api/admin/quality')
 if(qualityUnauthorized.status!==401)throw Error('El diagnóstico debe estar protegido; HTTP '+qualityUnauthorized.status)
 const stats=(await request('/api/admin/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})}))
 const cookie=stats.response.headers.get('set-cookie')?.split(';')[0]
 if(!cookie)throw Error('No session cookie')
 const headers={cookie,'content-type':'application/json'}
 const quality=(await request('/api/admin/quality?kind=missing_cover',{headers:{cookie}})).json
 check(quality.counts.missingCover,1,'missing covers in quality dashboard')
 check(quality.counts.missingAudio,1,'missing audio in quality dashboard')
 check(quality.rows.length,1,'quality result pagination')
 const overview=(await request('/api/admin/stats',{headers:{cookie}})).json
 check(overview.tracks,2,'admin sees hidden track')
 await request('/api/admin/tracks/t-test',{method:'PATCH',headers,body:JSON.stringify({title:'Título Actualizado',audioUrl:'https://example.com/new.mp3',published:true})})
 const edited=(await request('/api/tracks?q=Actualizado')).json
 check(edited.total,1,'edited SQLite track is searchable')
 const csv='artista,album,cancion,url_audio,numero_pista,anio\\nOtro Artista,Nuevo Disco,Cancion Importada,https://example.com/new.mp3,1,2025\\n'.replaceAll('\\n','\n')
 await request('/api/admin/import',{method:'POST',headers,body:JSON.stringify({csv,authorized:true})})
 const result=(await request('/api/admin/stats',{headers:{cookie}})).json
 check(result.artists,2,'imported artists')
 check(result.tracks,3,'imported tracks')
 console.log('SQLite smoke test OK: catalog, search, paging, admin login, editing and CSV')
}catch(e){console.error(e);console.error(logs.slice(-3000));process.exitCode=1}
finally{app.kill('SIGTERM');await delay(300);await rm(dir,{recursive:true,force:true})}
