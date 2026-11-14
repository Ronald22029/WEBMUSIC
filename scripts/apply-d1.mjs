#!/usr/bin/env node
// CieloPlay -> D1. Importación reanudable: nunca se ejecuta sin --apply.
// Mantiene checkpoints en .data/, sin exponer archivos del catálogo a GitHub.
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'

const remote = process.argv.includes('--remote')
const apply = process.argv.includes('--apply')
const out = resolve('.data/cloudflare-import')
const manifestPath = join(out,'manifest.json')
const configPath = resolve('wrangler.jsonc')
const manifestText = readFileSync(manifestPath,'utf8')
const manifest = JSON.parse(manifestText)
const config = JSON.parse(readFileSync(configPath,'utf8'))
const db = config.d1_databases?.find(x=>x.binding==='DB')
if(!db?.database_name)throw Error('Falta binding DB en wrangler.jsonc')
if(remote && (!db.database_id || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(db.database_id))) {
  throw Error('Debes reemplazar database_id del wrangler.jsonc por el ID real de tu D1 antes de importar')
}
const flag = process.argv.find(x=>x.startsWith('--max-files='))
const maxFiles = flag ? Number(flag.slice('--max-files='.length)) : 25
if(!Number.isSafeInteger(maxFiles)||maxFiles<1||maxFiles>100)throw Error('--max-files debe estar entre 1 y 100')
const scripts = [{file:'db/cloudflare/0001_schema.sql',path:resolve('db/cloudflare/0001_schema.sql')},
 ...manifest.files.map(x=>({file:x.file,path:join(out,x.file)}))]
for(const file of scripts)if(!existsSync(file.path))throw Error('Falta archivo SQL '+file.path)
const stateFile = join(out,remote?'progress.remote.json':'progress.local.json')
const fingerprint = createHash('sha256').update(manifestText).digest('hex')
const target = remote?String(db.database_id):'local:'+String(db.database_name)
let state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile,'utf8')) : {
  fingerprint,target,next:0,updatedAt:null
}
if(state.fingerprint!==fingerprint||state.target!==target){
 throw Error('Cambió el catálogo exportado o el ID de la base desde la última importación. Revisa el respaldo y el progreso antes de continuar; NO vuelvas a iniciar automáticamente.')
}
const remaining = scripts.length-state.next
console.log('Destino:',remote?'D1 remota (Cloudflare)':'D1 local de prueba')
console.log('Base:',db.database_name)
console.log('Archivos SQL:',scripts.length,'; completados:',state.next,'; pendientes:',remaining)
console.log('Límite de esta ejecución:',maxFiles,'archivos')
if(!apply){
 console.log('VISTA PREVIA: no se ha modificado ninguna base.')
 console.log('Para aplicar:', 'node scripts/apply-d1.mjs'+(remote?' --remote':'')+' --apply --max-files=25')
 process.exit(0)
}
function persist(){
  state.updatedAt = new Date().toISOString()
  const tmp = stateFile+'.tmp'
  writeFileSync(tmp,JSON.stringify(state,null,2))
  renameSync(tmp,stateFile)
}
let completed=0
for(let i=state.next;i<scripts.length && completed<maxFiles;i++){
 const {file,path}=scripts[i]
 console.log('Aplicando',i+1,'/',scripts.length,':',file)
 const args=['wrangler','d1','execute',db.database_name,remote?'--remote':'--local','--config',configPath,'--file',path,'--yes']
 const processResult = spawnSync(process.platform==='win32'?'npx.cmd':'npx',args,{
  stdio:'inherit',shell:process.platform==='win32'
 })
 if(processResult.error||processResult.status!==0){
   console.error('Falló el fragmento '+file+'. Se conserva el progreso hasta el último fragmento confirmado.')
   console.error('Revisa las cuotas de D1 y vuelve a ejecutar el mismo comando cuando se restablezcan; NO borres el estado.')
   process.exit(1)
 }
 state.next = i+1
 persist()
 completed++
}
console.log('Archivos aplicados ahora:',completed)
console.log('Archivos pendientes:',scripts.length-state.next)
if(state.next===scripts.length)console.log('Importación terminada. Verifica los totales en D1.')
else console.log('Progreso guardado. Ejecuta el mismo comando en otra sesión; si alcanzaste la cuota gratuita, espera al siguiente día UTC.')
