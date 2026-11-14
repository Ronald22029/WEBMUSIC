import { DatabaseSync } from 'node:sqlite'
import { join, resolve } from 'node:path'
import { existsSync } from 'node:fs'

const dir=process.env.WEBMUSIC_DATA_DIR||join(process.cwd(),'.data','webmusic')
const dbfile=resolve(dir,'webmusic.sqlite')
if(!existsSync(dbfile)){
 console.error('Falta la base SQLite en '+dbfile)
 console.error('Extrae WEBMUSIC_catalogo_completo_local.zip en la carpeta raíz del proyecto.')
 process.exit(1)
}
const db=new DatabaseSync(dbfile,{readOnly:true})
const counts={}
for(const table of ['artists','albums','tracks','unassigned_links']){
 counts[table]=(db.prepare('SELECT COUNT(*) AS n FROM '+table).get()).n
}
console.log('Catálogo local de WEBMUSIC:',counts)
console.log('Integridad SQLite:',(db.prepare('PRAGMA integrity_check').get()).integrity_check)
db.close()
