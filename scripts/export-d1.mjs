#!/usr/bin/env node
// CieloPlay - exporta los registros SQLite LOCALES a SQL de Cloudflare D1.
// No conecta con internet. No guarda canciones MP3 ni portadas.
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { resolve, join } from 'node:path'
const source=resolve(process.env.WEBMUSIC_DATA_DIR||'.data/webmusic','webmusic.sqlite')
const out=resolve(process.argv[2]||'.data/cloudflare-import')
const BATCH_SIZE=250
if(!existsSync(source))throw Error('No existe '+source+'. Instala primero tu catálogo local.')
const db=new DatabaseSync(source,{readOnly:true})
const ok=db.prepare('PRAGMA integrity_check').get()?.integrity_check
if(ok!=='ok')throw Error('La base SQLite no pasó la prueba de integridad: '+ok)
mkdirSync(out,{recursive:true})
const tables={
 artists:['id','name','slug','description','cover','accent','genre','source_url','published'],
 albums:['id','title','slug','artist_id','year','cover','genre','release_type','source_url','published'],
 tracks:['id','title','slug','artist_id','album_id','duration','audio_url','cover','plays','track_number','source_status','source_page','published','search_text']
}
const q=v=>v==null?'NULL':typeof v==='number'?Number.isFinite(v)?String(v):'NULL':"'"+String(v).replaceAll("'","''")+"'"
const files=[]
for(const [table,cols] of Object.entries(tables)){
 const has=db.prepare("PRAGMA table_info("+table+")").all()
 const names=new Set(has.map(c=>c.name))
 for(const col of cols)if(!names.has(col))throw Error('Falta columna '+table+'.'+col+' en SQLite local')
 const total=db.prepare('SELECT COUNT(*) AS n FROM '+table).get().n
 let fileNum=0
 for(let offset=0;offset<total;offset+=BATCH_SIZE){
  const rows=db.prepare('SELECT '+cols.join(',')+' FROM '+table+' ORDER BY rowid LIMIT ? OFFSET ?').all(BATCH_SIZE,offset)
  const value=rows.map(row=>{
   const items=cols.map(col=>q(row[col]))
   return 'INSERT OR REPLACE INTO '+table+' ('+cols.join(',')+') VALUES ('+items.join(',')+');'
  })
  if(!value.length)continue
  const basename=String(files.length+1).padStart(4,'0')+'-'+table+'-'+String(++fileNum).padStart(4,'0')+'.sql'
  const text='-- CieloPlay D1; tabla '+table+'; registros '+(offset+1)+'-'+(offset+rows.length)+'\n'+value.join('\n')+'\n'
  writeFileSync(join(out,basename),text,'utf8')
  files.push({file:basename,table,rows:rows.length})
 }
 console.log(table+': '+total+' registros')
}
db.close()
const manifest={schema:'db/cloudflare/0001_schema.sql',files,counts:Object.fromEntries(Object.keys(tables).map(t=>[t,files.filter(f=>f.table===t).reduce((n,f)=>n+f.rows,0)]))}
writeFileSync(join(out,'manifest.json'),JSON.stringify(manifest,null,2),'utf8')
writeFileSync(join(out,'README.txt'),'CieloPlay D1: aplicar primero db/cloudflare/0001_schema.sql, despues los ficheros SQL en el orden indicado en manifest.json. Repetir la importacion sobrescribe los datos con los IDs existentes; guardar respaldo antes.\n','utf8')
console.log('Archivos creados: '+files.length+' en '+out)
console.log('Contenido privado: NO subir .data/cloudflare-import al repositorio.')
