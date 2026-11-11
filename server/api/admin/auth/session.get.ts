import { adminConfigured, adminSessionValid } from '../../../utils/admin-security'
import { optionalMusicDb } from '../../../utils/admin-db'
export default defineEventHandler(async(event)=>({
  authenticated:await adminSessionValid(event),
  configured:adminConfigured(event),
  database:!!optionalMusicDb(event)
}))
