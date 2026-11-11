// Parser CSV con soporte de comillas, comas internas y saltos de línea.
const MAX_CHARS = 650_000
const MAX_ROWS = 750
const MAX_FIELD = 2_048
const clean = (value: string) => value.normalize('NFC').trim()
const slug = (value: string) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,95)

function csvMatrix(text: string) {
 const rows: string[][] = [], row: string[] = []
 let field = '', quoted = false
 const pushField = () => { row.push(field); field = '' }
 const pushRow = () => { pushField(); if (row.some(v => v.trim())) rows.push(row.splice(0)) }
 for (let i=0;i<text.length;i++) {
   const ch=text[i]
   if (quoted) {
     if (ch==='"' && text[i+1]==='"') { field+='"'; i++ }
     else if (ch==='"') quoted=false
     else field+=ch
   } else if (ch==='"') quoted=true
   else if (ch===',') pushField()
   else if (ch==='\n') pushRow()
   else field+=ch
   if (field.length > MAX_FIELD) throw createError({statusCode:400,statusMessage:'Campo CSV demasiado largo'})
   if (rows.length > MAX_ROWS + 1) throw createError({statusCode:400,statusMessage:'Máximo 750 canciones por archivo'})
 }
 if (quoted) throw createError({statusCode:400,statusMessage:'CSV con comillas sin cerrar'})
 if (row.length || field) pushRow()
 return rows
}
export function validHttps(value: string) {
 let raw=clean(value)
 if (raw.startsWith('//')) raw='https:'+raw
 if (raw.length > 2_000) return ''
 try { const url=new URL(raw); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password ? url.toString() : '' }
 catch { return '' }
}
export type ImportTrack = {
 id: string; title: string; slug: string; artistId: string; artistName: string; artistSlug: string
 albumId: string; albumTitle: string; albumSlug: string; year: number; genre: string; releaseType: string
 trackNumber: number; audioUrl: string; cover: string; sourcePage: string
}
export function parseMusicCsv(value: unknown) {
 if (typeof value !== 'string' || !value.trim() || value.length > MAX_CHARS) {
   throw createError({statusCode:400,statusMessage:'CSV vacío o mayor a 650 KB'})
 }
 const matrix=csvMatrix(value.replace(/^\uFEFF/,''))
 const headers=matrix.shift()?.map(h => clean(h).toLowerCase()) || []
 for (const name of ['artista','album','cancion','url_audio']) {
   if (!headers.includes(name)) throw createError({statusCode:400,statusMessage:'Falta columna obligatoria: '+name})
 }
 const result: ImportTrack[] = []
 const warnings: string[] = []
 const ids=new Set<string>()
 for (const [i,fields] of matrix.entries()) {
   if (fields.length !== headers.length) {
     warnings.push('Línea '+(i+2)+': cantidad de columnas incorrecta')
     continue
   }
   const row=Object.fromEntries(headers.map((h,k)=>[h,clean(fields[k] || '')]))
   const artistName=row.artista || '', albumTitle=row.album || '', title=row.cancion || ''
   const artistSlug=slug(row.artista_slug || artistName),albumSlug=artistSlug+'-'+slug(albumTitle)
   const trackNumber=Number.parseInt(row.numero_pista || '0',10) || 0
   const url=validHttps(row.url_audio || '')
   const cover=validHttps(row.url_portada || '')
   if (!artistName || !albumTitle || !title || !artistSlug || !slug(albumTitle) || !slug(title) || !url) {
     warnings.push('Línea '+(i+2)+': faltan datos o el enlace HTTPS es inválido')
     continue
   }
   if (artistName.length>160||albumTitle.length>200||title.length>200 || trackNumber<0 || trackNumber>5000) {
     warnings.push('Línea '+(i+2)+': campos fuera del límite permitido')
     continue
   }
   const id='t-'+albumSlug+'-'+String(trackNumber).padStart(3,'0')+'-'+slug(title)
   if (ids.has(id)) { warnings.push('Línea '+(i+2)+': pista duplicada dentro del CSV'); continue }
   ids.add(id)
   const parsedYear=Number.parseInt(row.anio||'0',10)
   result.push({
     id,title,slug:id.slice(2),artistId:'a-'+artistSlug,artistName,artistSlug,
     albumId:'alb-'+albumSlug,albumTitle,albumSlug,
     year:parsedYear >= 1900 && parsedYear <= 2100 ? parsedYear : 0,
     genre:(row.genero||'').slice(0,120),releaseType:(row.tipo_lanzamiento||'Álbum').slice(0,80),
     trackNumber,audioUrl:url,cover,sourcePage:validHttps(row.url_cancion||'')
   })
 }
 if (!result.length) throw createError({statusCode:400,statusMessage:'El CSV no contiene canciones válidas'})
 const artists=new Set(result.map(x=>x.artistId)).size
 const albums=new Set(result.map(x=>x.albumId)).size
 return {rows:result,summary:{tracks:result.length,artists,albums,skipped:matrix.length-result.length},warnings:warnings.slice(0,25)}
}
