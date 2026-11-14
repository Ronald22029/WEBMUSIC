import { adminConfigured, adminSessionValid } from '../../../utils/admin-security'
import { getStorageMode } from '../../../utils/admin-db'
export default defineEventHandler(async event=>({
 authenticated:await adminSessionValid(event),configured:adminConfigured(event),
 database:true,storage:getStorageMode(event)
}))
