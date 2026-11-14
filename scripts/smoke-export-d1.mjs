import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const cwd=process.cwd(), root=mkdtempSync(join(tmpdir(),'cieloplay-d1-export-'))
const data=join(root,'local'),output=join(root,'out')
mkdirSync(data)
const db=new DatabaseSync(join(data,'webmusic.sqlite'))
try{
 db.exec(readFileSync(resolve('db/cloudflare/0001_schema.sql'),'utf8'))
 db.exec(`INSERT INTO artists(id,name,slug) VALUES('a-test','Cantante','cantante');
  INSERT INTO albums(id,title,slug,artist_id,year) VALUES('alb-test','Disco','disco','a-test',0);
  INSERT INTO tracks(id,title,slug,artist_id,album_id,audio_url,search_text)
   VALUES('t-test','Canción','cancion','a-test','alb-test','https://example.com/a.mp3','cancion cantante disco');`)
 db.close()
 const exportResult=spawnSync(process.execPath,['scripts/export-d1.mjs',output],{cwd,env:{...process.env,WEBMUSIC_DATA_DIR:data},encoding:'utf8'})
 if(exportResult.status!==0)throw Error('Exportación falló: '+exportResult.stderr)
 const manifest=JSON.parse(readFileSync(join(output,'manifest.json'),'utf8'))
 if(manifest.counts.tracks!==1||manifest.counts.albums!==1||manifest.counts.artists!==1)throw Error('Conteo incorrecto en manifiesto')
 const destination=new DatabaseSync(join(root,'roundtrip.sqlite'))
 try{
  destination.exec(readFileSync(resolve('db/cloudflare/0001_schema.sql'),'utf8'))
  for(const item of manifest.files)destination.exec(readFileSync(join(output,item.file),'utf8'))
  const track=destination.prepare('SELECT audio_url AS url FROM tracks WHERE id=?').get('t-test')
  if(track?.url!=='https://example.com/a.mp3')throw Error('Enlace no conservado en importación')
  const integrity=destination.prepare('PRAGMA integrity_check').get().integrity_check
  if(integrity!=='ok')throw Error('Integridad SQL falló: '+integrity)
  console.log('Exportación e importación D1 SQL: correctas')
 }finally{destination.close()}
}finally{try{db.close()}catch{} rmSync(root,{recursive:true,force:true})}
