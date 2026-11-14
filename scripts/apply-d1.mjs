#!/usr/bin/env node
// Ejecuta los fragmentos generados por export-d1.mjs sin publicarlos en Git.
// La opcion --remote requiere autenticacion y una base D1 creada. No se invoca automaticamente.
import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
const remote=process.argv.includes('--remote')
const apply=process.argv.includes('--apply')
const out=resolve('.data/cloudflare-import')
const manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'))
const config=resolve('wrangler.jsonc')
const env=remote?'--remote':'--local'
const cmds=[resolve('db/cloudflare/0001_schema.sql'),...manifest.files.map(f=>join(out,f.file))]
console.log('Modo:',env,'; archivos:',cmds.length)
if(!apply){
 console.log('Vista previa únicamente. Para aplicar, añade --apply'+(remote?' --remote':''))
 console.log('Ejemplo: node scripts/apply-d1.mjs --apply'+(remote?' --remote':''))
 process.exit(0)
}
for(let i=0;i<cmds.length;i++){
 const parts=['wrangler','d1','execute','cieloplay-db',env,'--config',config,'--file',cmds[i],'--yes']
 console.log('Aplicando '+(i+1)+'/'+cmds.length+': '+cmds[i])
 const result=spawnSync(process.platform==='win32'?'npx.cmd':'npx',parts,{stdio:'inherit',shell:process.platform==='win32'})
 if(result.status!==0)throw Error('Importación interrumpida en '+cmds[i]+'; los anteriores pueden haberse aplicado.')
}
console.log('Migración aplicada.')
