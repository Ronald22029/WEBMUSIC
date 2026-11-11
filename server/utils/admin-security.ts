import type { H3Event } from 'h3'
import { createError, getCookie, getHeader, getRequestURL, setCookie } from 'h3'

const COOKIE = 'wm_admin_session'
const TTL_SECONDS = 60 * 60 * 12
const encoder = new TextEncoder()

function secrets(event: H3Event) {
  const config = useRuntimeConfig(event)
  const password = String(event.context.cloudflare?.env?.ADMIN_PASSWORD || config.adminPassword || '')
  const sessionSecret = String(event.context.cloudflare?.env?.ADMIN_SESSION_SECRET || config.adminSessionSecret || '')
  return { password, sessionSecret, configured: password.length >= 12 && sessionSecret.length >= 32 }
}
export const adminConfigured = (event: H3Event) => secrets(event).configured

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
}
export async function validAdminPassword(event: H3Event, attempt: string) {
  const cfg = secrets(event)
  if (!cfg.configured || attempt.length > 256) return false
  const [actual, expected] = await Promise.all([digest(attempt), digest(cfg.password)])
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= (actual[i] ?? 0) ^ expected[i]
  return diff === 0
}
async function hmacKey(event: H3Event) {
  const secret = secrets(event).sessionSecret
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
const toHex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes)).map(x => x.toString(16).padStart(2,'0')).join('')
function fromHex(value: string) {
  if (!/^[a-f0-9]{64}$/.test(value)) return null
  return Uint8Array.from(value.match(/../g)!.map(v => parseInt(v, 16)))
}
export async function createAdminSession(event: H3Event) {
  if (!adminConfigured(event)) throw createError({ statusCode: 503, statusMessage: 'Configura las credenciales administrativas' })
  const now = Math.floor(Date.now() / 1000)
  const payload = ['v1', String(now), crypto.randomUUID()].join('.')
  const signature = toHex(await crypto.subtle.sign('HMAC', await hmacKey(event), encoder.encode(payload)))
  setCookie(event, COOKIE, payload + '.' + signature, {
    httpOnly: true, secure: getRequestURL(event).protocol === 'https:', sameSite: 'strict',
    path: '/', maxAge: TTL_SECONDS
  })
}
export async function adminSessionValid(event: H3Event) {
  if (!adminConfigured(event)) return false
  const raw = getCookie(event, COOKIE)
  if (!raw || raw.length > 256) return false
  const parts = raw.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1' || !/^\d{10}$/.test(parts[1] || '') || !/^[0-9a-f-]{36}$/i.test(parts[2] || '')) return false
  const issued = Number(parts[1])
  const now = Math.floor(Date.now() / 1000)
  if (issued > now + 30 || issued < now - TTL_SECONDS) return false
  const signature = fromHex(parts[3] || '')
  if (!signature) return false
  return crypto.subtle.verify('HMAC', await hmacKey(event), signature, encoder.encode(parts.slice(0,3).join('.')))
}
export async function requireAdmin(event: H3Event) {
  if (!await adminSessionValid(event)) throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesión como administrador' })
}
export function clearAdminSession(event: H3Event) {
  setCookie(event, COOKIE, '', { path: '/', httpOnly: true, secure: getRequestURL(event).protocol === 'https:', sameSite: 'strict', maxAge: 0 })
}
export function assertSameOrigin(event: H3Event) {
  const origin = getHeader(event, 'origin')
  const fetchSite = getHeader(event, 'sec-fetch-site')
  if (fetchSite === 'cross-site' || (origin && origin !== getRequestURL(event).origin)) {
    throw createError({ statusCode: 403, statusMessage: 'Origen no permitido' })
  }
}

// Defensa básica contra intentos repetidos por instancia; en producción complementar con WAF/rate limiting de Cloudflare.
const attempts = new Map<string,{count:number;until:number}>()
function loginKey(event:H3Event) { return String(getHeader(event,'cf-connecting-ip') || getHeader(event,'x-forwarded-for')?.split(',')[0] || 'local').slice(0,100) }
export function assertLoginRate(event:H3Event) {
  const key=loginKey(event), entry=attempts.get(key), now=Date.now()
  if(entry && entry.until>now && entry.count>=8) throw createError({statusCode:429,statusMessage:'Demasiados intentos. Prueba nuevamente más tarde.'})
  if(attempts.size>5000)attempts.clear()
}
export function recordLoginAttempt(event:H3Event,success:boolean) {
  const key=loginKey(event), now=Date.now()
  if(success){attempts.delete(key);return}
  const previous=attempts.get(key)
  attempts.set(key,{count:(previous?.until||0)>now?(previous!.count+1):1,until:now+15*60*1000})
}
