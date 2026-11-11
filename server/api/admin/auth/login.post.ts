import { readBody, createError } from 'h3'
import { adminConfigured, createAdminSession, validAdminPassword, assertLoginRate, recordLoginAttempt } from '../../../utils/admin-security'
export default defineEventHandler(async(event)=>{
 if(!adminConfigured(event))throw createError({statusCode:503,statusMessage:'Configura ADMIN_PASSWORD y ADMIN_SESSION_SECRET'})
 assertLoginRate(event)
 const body=await readBody<{password?:unknown}>(event)
 const password=body && typeof body.password==='string' ? body.password : ''
 const ok=await validAdminPassword(event,password)
 recordLoginAttempt(event,ok)
 if(!ok)throw createError({statusCode:401,statusMessage:'Contraseña incorrecta'})
 await createAdminSession(event)
 return {ok:true}
})
