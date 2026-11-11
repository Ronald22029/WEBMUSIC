import { createError } from 'h3'
import { validHttps } from './csv-music'
export const entitySlug=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,95)
export function safeLabel(value:unknown,max=160) {
  if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw createError({statusCode:400,statusMessage:'Nombre no válido'})
  return value.trim()
}
export function safeCover(value:unknown) {
  if(value===undefined||value===null||value==='')return ''
  if(typeof value!=='string')throw createError({statusCode:400,statusMessage:'Imagen inválida'})
  const url=validHttps(value)
  if(!url)throw createError({statusCode:400,statusMessage:'La portada debe usar HTTPS'})
  return url
}
