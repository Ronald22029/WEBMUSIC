import { getQuery, setHeader } from 'h3'
import { adminConfigured, adminSessionValid, adminCredentialDiagnostic } from '../../../utils/admin-security'
import { getStorageMode } from '../../../utils/admin-db'

export default defineEventHandler(async event=>{
 setHeader(event,'cache-control','no-store')
 const configured=adminConfigured(event)
 const response={
  authenticated:await adminSessionValid(event),configured,
  database:true,storage:getStorageMode(event)
 }
 // Muestra únicamente presencia/requisitos mínimos de los secretos si la
 // administración aún está deshabilitada; no expone ningún valor secreto.
 if(!configured && getQuery(event).diagnostic==='1'){
  return {...response,credentialCheck:adminCredentialDiagnostic(event)}
 }
 return response
})
