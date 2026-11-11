import { clearAdminSession } from '../../../utils/admin-security'
export default defineEventHandler(event=>{clearAdminSession(event);return {ok:true}})
