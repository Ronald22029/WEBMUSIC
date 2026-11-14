import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const dir = await mkdtemp(join(tmpdir(), 'webmusic-smoke-'))
const port = String(38000 + Math.floor(Math.random() * 1000))
const origin = 'http://127.0.0.1:' + port
const password = 'WEBMUSIC_TEST_PRIVATE_SECRET_2026'
const secret = 'WEBMUSIC_TEST_SESSION_SECRET_WITH_ENOUGH_LENGTH_2026'
const app = spawn(process.execPath, ['.output/server/index.mjs'], {
  env: { ...process.env, HOST:'127.0.0.1', PORT:port, WEBMUSIC_DATA_DIR:dir,
    NUXT_ADMIN_PASSWORD:password, NUXT_ADMIN_SESSION_SECRET:secret
  },
  stdio: ['ignore','pipe','pipe']
})
let output = ''
app.stdout.on('data', d => {output += d.toString().slice(-5000)})
app.stderr.on('data', d => {output += d.toString().slice(-5000)})
async function request(path, options={}) {
  const response = await fetch(origin + path, options)
  const body = await response.json().catch(()=>({}))
  if (!response.ok) throw Error(path + ' returned HTTP ' + response.status + ': ' + JSON.stringify(body))
  return {response,body}
}
async function ready() {
 for(let i=0;i<70;i++) {
  if(app.exitCode!==null)throw Error('El servidor terminó prematuramente. '+output)
  try {const response=await fetch(origin+'/api/catalog');if(response.ok)return}
  catch {}
  await delay(400)
 }
 throw Error('Tiempo de espera agotado iniciando WEBMUSIC. '+output)
}
function eq(actual,expected,label) {
 if(actual!==expected)throw Error(label+': se esperaba '+expected+' pero se obtuvo '+actual)
}
try {
 await ready()
 let response=await request('/api/catalog')
 eq(response.body.artists.length,3,'artistas iniciales')
 eq(response.body.albums.length,49,'álbumes iniciales')
 eq(response.body.tracks.length,469,'pistas iniciales')
 let session=await request('/api/admin/auth/session')
 eq(session.body.configured,true,'configuración admin')
 eq(session.body.storage,'local','modo local')
 const auth=await request('/api/admin/auth/login',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password})
 })
 const cookie=auth.response.headers.get('set-cookie')?.split(';')[0]
 if(!cookie)throw Error('No se emitió cookie de sesión')
 const headers={cookie,'content-type':'application/json'}
 const csv='artista,album,cancion,url_audio,numero_pista,anio\nArtista de Prueba,Album de Prueba,Cancion de Prueba,https://example.com/demo.mp3,1,2026\n'
 const preview=await request('/api/admin/import/preview',{method:'POST',headers,body:JSON.stringify({csv})})
 eq(preview.body.summary.tracks,1,'preview de pistas')
 const imported=await request('/api/admin/import',{method:'POST',headers,body:JSON.stringify({csv,authorized:true})})
 eq(imported.body.changes.newTracks,1,'pista importada')
 const second=await request('/api/admin/import',{method:'POST',headers,body:JSON.stringify({csv,authorized:true})})
 eq(second.body.changes.newTracks,0,'reimportación sin duplicados')
 response=await request('/api/catalog')
 eq(response.body.artists.length,4,'nuevos artistas')
 eq(response.body.albums.length,50,'nuevos álbumes')
 eq(response.body.tracks.length,470,'nuevas pistas')
 const track=response.body.tracks.find(t=>t.title==='Cancion de Prueba')
 if(!track)throw Error('Canción importada ausente')
 await request('/api/admin/tracks/'+encodeURIComponent(track.id),{
  method:'PATCH',headers,body:JSON.stringify({title:'Cancion Corregida',audioUrl:track.audioUrl,published:false})
 })
 response=await request('/api/catalog')
 eq(response.body.tracks.length,469,'visibilidad de pista editada')
 const catalogFile=JSON.parse(await readFile(join(dir,'catalog.local.json'),'utf8'))
 eq(catalogFile.tracks.length,470,'persistencia local')
 const exportResult=await request('/api/admin/export',{headers:{cookie}})
 eq(exportResult.body.tracks.length,470,'respaldo administrativo')
 console.log('WEBMUSIC: pruebas locales correctas (catálogo, login, CSV, deduplicación, edición, respaldo).')
} catch(error) {
 console.error(error)
 console.error(output.slice(-2500))
 process.exitCode=1
} finally {
 app.kill('SIGTERM')
 await delay(250)
 await rm(dir,{recursive:true,force:true})
}
