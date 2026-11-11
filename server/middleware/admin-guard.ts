import { defineEventHandler, getMethod } from 'h3'
import { assertSameOrigin, requireAdmin } from '../utils/admin-security'
export default defineEventHandler(async (event) => {
  const route=event.path.split('?')[0]
  if (!route.startsWith('/api/admin/')) return
  if (['POST','PATCH','PUT','DELETE'].includes(getMethod(event))) assertSameOrigin(event)
  if (route==='/api/admin/auth/login' || route==='/api/admin/auth/session') return
  await requireAdmin(event)
})
