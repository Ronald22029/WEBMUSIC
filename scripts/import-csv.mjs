#!/usr/bin/env node
// Importador de catálogo WEBMUSIC. Node.js 22+; no necesita librerías.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const catalogFile=resolve(root,'server/data/catalog.json')
const seedFile=resolve(root,'db/seed.sql')
const inputs=process.argv.slice(2).filter(x=>!x.startsWith('--'))
if(!inputs.length){console.error('Uso: npm run import -- archivo1.csv [archivo2.csv ...]');process.exit(1)}
function readCSV(source){
 const text=source.replace(/^\uFEFF/,'')
 const rows=[];let row=[],field='',quoted=false
 for(let i=0;i<text.length;i++){
  const c=text[i]
  if(quoted){
   if(c==='"'&&text[i+1]==='"'){field+='"';i++}
   else if(c==='"')quoted=false
   else field+=c
  } else if(c==='"')quoted=true
  else if(c===','){row.push(field);field=''}
  else if(c==='\n'){row.push(field.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}
  else field+=c
 }
 if(quoted)throw Error('CSV con comillas sin cerrar')
 if(field||row.length){row.push(field.replace(/\r$/,''));if(row.some(x=>x.trim()))rows.push(row)}
 const header=rows.shift()?.map(x=>x.trim())
 if(!header?.length)throw Error('Archivo CSV vacío o sin encabezados')
 const required=['artista','album','cancion','url_audio']
 for(const key of required)if(!header.includes(key))throw Error('Columna obligatoria faltante: '+key)
 return rows.map((fields,index)=>{
  if(fields.length!==header.length)throw Error('Línea '+(index+2)+': '+fields.length+' columnas, esperadas '+header.length)
  return Object.fromEntries(header.map((key,i)=>[key,fields[i]?.trim()||'']))
 })
}
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)
function https(value){
 let s=String(value||'').trim()
 if(s.startsWith('//'))s='https:'+s
 return /^https:\/\/[a-z0-9.-]+(?::443)?(?:\/|$)/i.test(s)?s:''
}
const quote=s=>"'"+String(s??'').replace(/'/g,"''")+"'"
const existing=JSON.parse(await readFile(catalogFile,'utf8'))
const artists=new Map(existing.artists.map(x=>[x.id,x]))
const albums=new Map(existing.albums.map(x=>[x.id,x]))
const tracks=new Map(existing.tracks.map(x=>[x.id,x]))
const before={artists:artists.size,albums:albums.size,tracks:tracks.size}
let accepted=0,skipped=0,updated=0
const warnings=[]
for(const path of inputs){
 const records=readCSV(await readFile(resolve(process.cwd(),path),'utf8'))
 for(const [i,rec] of records.entries()){
  if(!rec.artista||!rec.album||!rec.cancion){skipped++;warnings.push(path+': línea '+(i+2)+' incompleta');continue}
  const artistSlug=slug(rec.artista_slug||rec.artista),artistId='a-'+artistSlug
  const albumSlug=artistSlug+'-'+slug(rec.album),albumId='alb-'+albumSlug
  const number=Number.parseInt(rec.numero_pista||'0',10)
  const cover=https(rec.url_portada)
  const audioUrl=https(rec.url_audio)
  if(!artistSlug||!slug(rec.album)||!audioUrl){skipped++;warnings.push(path+': línea '+(i+2)+' sin enlace HTTPS válido');continue}
  if(!artists.has(artistId))artists.set(artistId,{id:artistId,name:rec.artista.trim(),slug:artistSlug,description:'Discografía de '+rec.artista.trim(),cover,accent:'#a17aff'})
  else if(cover&&!artists.get(artistId).cover)artists.get(artistId).cover=cover
  if(!albums.has(albumId))albums.set(albumId,{
    id:albumId,title:rec.album,slug:albumSlug,artistId,year:Number.parseInt(rec.anio||'0',10)||0,
    cover,genre:rec.genero||'',releaseType:rec.tipo_lanzamiento||'Álbum'
  })
  // Identificador estable por álbum + número de pista + título; reimportar no duplica.
  const trackSlug=slug(rec.cancion)
  const num=Number.isFinite(number)&&number>0?number:0
  const trackId='t-'+albumSlug+'-'+String(num).padStart(3,'0')+'-'+trackSlug
  const old=tracks.get(trackId)
  const next={id:trackId,title:rec.cancion,slug:trackId.slice(2),artistId,albumId,duration:old?.duration||0,
    audioUrl,cover:cover||old?.cover||'',plays:old?.plays||0,trackNumber:num,
    sourceStatus:'unverified',sourcePage:https(rec.url_cancion)}
  if(old){tracks.set(trackId,{...old,...next});updated++}
  else{tracks.set(trackId,next);accepted++}
 }
}
const result={
 artists:[...artists.values()].sort((a,b)=>a.name.localeCompare(b.name,'es')),
 albums:[...albums.values()].sort((a,b)=>b.year-a.year||a.title.localeCompare(b.title,'es')),
 tracks:[...tracks.values()].sort((a,b)=>a.albumId.localeCompare(b.albumId)||a.trackNumber-b.trackNumber||a.title.localeCompare(b.title,'es'))
}
let sql='-- WEBMUSIC: enlaces externos pendientes de validación de derechos y disponibilidad.\nPRAGMA foreign_keys=ON;\n'
for(const a of result.artists)sql+='INSERT OR REPLACE INTO artists(id,name,slug,description,cover,accent,published) VALUES ('+
 [a.id,a.name,a.slug,a.description,a.cover,a.accent].map(quote).join(',')+',1);\n'
for(const a of result.albums)sql+='INSERT OR REPLACE INTO albums(id,title,slug,artist_id,year,cover,genre,release_type,published) VALUES ('+
 [a.id,a.title,a.slug,a.artistId].map(quote).join(',')+','+(a.year||0)+','+[a.cover,a.genre||'',a.releaseType||''].map(quote).join(',')+',1);\n'
for(const t of result.tracks)sql+='INSERT OR REPLACE INTO tracks(id,title,slug,artist_id,album_id,duration,audio_url,cover,plays,track_number,source_status,source_page,published) VALUES ('+
 [t.id,t.title,t.slug,t.artistId,t.albumId].map(quote).join(',')+','+(t.duration||0)+','+[t.audioUrl,t.cover||''].map(quote).join(',')+','+(t.plays||0)+','+(t.trackNumber||0)+','+[t.sourceStatus||'unverified',t.sourcePage||''].map(quote).join(',')+',1);\n'
await mkdir(dirname(catalogFile),{recursive:true})
await writeFile(catalogFile,JSON.stringify(result,null,2)+'\n')
await writeFile(seedFile,sql)
console.log('WEBMUSIC: importación finalizada')
console.log('Nuevas canciones:',accepted,'Actualizadas:',updated,'Omitidas:',skipped)
console.log('Catálogo actual:',result.artists.length,'artistas,',result.albums.length,'álbumes,',result.tracks.length,'canciones')
if(warnings.length)console.warn(warnings.slice(0,30).join('\n'))
if(result.artists.length<before.artists||result.albums.length<before.albums||result.tracks.length<before.tracks)throw Error('No se deben perder registros al importar')
