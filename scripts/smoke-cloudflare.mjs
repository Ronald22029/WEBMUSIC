// Local Workers integration smoke: real Wrangler workerd + D1, no Cloudflare account required.
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
const watchdog=setTimeout(()=>{console.error('TIMEOUT: prueba Wrangler excedió 110 segundos');process.exit(1)},110000)
const dir=mkdtempSync(join(tmpdir(),'cieloplay-workerd-'))
const port=String(38600+Math.floor(Math.random()*300))
const base='http://127.0.0.1:'+port
const execute=(args)=>{
 const result=spawnSync('npx',['wrangler',...args],{encoding:'utf8',env:process.env,timeout:45000})
 if(result.status!==0)throw Error('Wrangler '+args.join(' ')+' failed\n'+result.stdout+'\n'+result.stderr)
}
const fixture=join(dir,'seed.sql')
writeFileSync(fixture,`INSERT INTO artists(id,name,slug,genre) VALUES('a-demo','Artista de prueba','demo','Gospel');
INSERT INTO albums(id,title,slug,artist_id,year) VALUES('alb-demo','Album de prueba','demo-album','a-demo',0);
INSERT INTO tracks(id,title,slug,artist_id,album_id,audio_url,search_text,track_number)
VALUES('t-demo','Cancion de prueba','cancion','a-demo','alb-demo','https://example.com/demo.mp3','cancion de prueba artista de prueba album de prueba',1);`)
let server
let logs=''
try{
 execute(['d1','execute','cieloplay-db','--local','--yes','--file','db/cloudflare/0001_schema.sql','--persist-to',dir])
 execute(['d1','execute','cieloplay-db','--local','--yes','--file',fixture,'--persist-to',dir])
 server=spawn('npx',['wrangler','dev','--local','--ip','127.0.0.1','--port',port,'--persist-to',dir,
  '--var','ADMIN_PASSWORD:testing-password-long-enough',
  '--var','ADMIN_SESSION_SECRET:testing-session-secret-at-least-thirty-two-characters'],{stdio:['ignore','pipe','pipe'],env:process.env})
 server.stdout.on('data',c=>{logs+=(String(c)).slice(-1000)})
 server.stderr.on('data',c=>{logs+=(String(c)).slice(-1000)})
 let ok=false
 for(let i=0;i<70;i++){
  try{
   const res=await fetch(base+'/api/status')
   if(res.ok){const data=await res.json();if(data.storage==='cloudflare'&&data.tracks===1){ok=true;break}throw Error(JSON.stringify(data))}
  }catch{}
  await delay(400)
 }
 if(!ok)throw Error('Worker no está listo o no detecta D1: '+logs.slice(-4500))
 async function get(path,opts){
  const r=await fetch(base+path,opts)
  if(!r.ok)throw Error(path+': HTTP '+r.status+' '+(await r.text()).slice(0,600))
  return r.json()
 }
 const adminSession=await get('/api/admin/auth/session')
 if(adminSession.configured!==true||adminSession.storage!=='cloudflare') {
  throw Error('El Worker no puede reconocer secretos administrativos: '+JSON.stringify(adminSession))
 }
 const catalog=await get('/api/catalog')
 if(catalog.counts?.tracks!==1||catalog.albums.length!==1||catalog.artists.length!==1)throw Error('Catálogo D1 incorrecto '+JSON.stringify(catalog.counts))
 const tracks=await get('/api/tracks?albumId=alb-demo&limit=15')
 if(tracks.total!==1||tracks.rows[0]?.audioUrl!=='https://example.com/demo.mp3')throw Error('Pistas D1 incorrectas')
 const search=await get('/api/tracks?q=cancion')
 if(search.total!==1)throw Error('La búsqueda D1 no encuentra la canción')
 const ids=await get('/api/tracks-by-ids',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({ids:['t-demo']})})
 if(ids.total!==1)throw Error('Consulta D1 por IDs falla')
 console.log('WORKER+D1 OK: estado, catálogo, búsqueda, álbum y playlists')
}catch(e){console.error(e);console.error(logs.slice(-4500));process.exitCode=1}
finally{if(server){server.kill('SIGTERM');await delay(1000)}rmSync(dir,{recursive:true,force:true});clearTimeout(watchdog);process.exit(process.exitCode||0)}
